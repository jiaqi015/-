
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopResult, DevelopMode, GroundingSource, DevelopManifest, DevelopSession } from '../domain/types';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { KnowledgeRetrievalService } from './knowledgeBase';
import { SafetyResilienceService } from './safetyService';

export interface InternalImageData {
  base64Data: string;
  mimeType: string;
  width: number;
  height: number;
}

const MODELS = {
  QUICK_DEV: 'gemini-2.5-flash-image', 
  ORCHESTRATOR: 'gemini-3-pro-preview',
  MASTER_RENDER: 'gemini-3-pro-image-preview'
};

export class GeminiImageProcessor implements IImageProcessor {
  
  // Use exponential backoff for resilience against transient API errors.
  private async withResilience<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('429') || error.message?.includes('500'))) {
        const delay = Math.pow(2, 4 - retries) * 1000;
        await new Promise(r => setTimeout(r, delay));
        return this.withResilience(fn, retries - 1);
      }
      throw error;
    }
  }

  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number,
    mode: DevelopMode,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("实验室授权未就绪。");

    // Fix: Implemented getOptimizedImageData to process input source.
    const imageData = await this.getOptimizedImageData(imageSource, 1536);
    
    // Fix: Completed process logic to route between AGENTIC and DIRECT workflows.
    return mode === 'AGENTIC' 
      ? this.executeAutonomousWorkflow(imageData, profile, intensity, onProgress)
      : this.executeFlashWorkflow(imageData, profile, intensity, onProgress);
  }

  // Helper to load and optimize images for processing.
  private async getOptimizedImageData(source: string | File, maxDim: number): Promise<InternalImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        resolve({ base64Data: base64, mimeType: 'image/jpeg', width, height });
      };
      img.onerror = () => reject(new Error("Failed to load image source"));
      
      if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target?.result as string; };
        reader.readAsDataURL(source);
      } else {
        img.src = source;
      }
    });
  }

  // Advanced workflow using multiple model passes for high-quality artistic development.
  private async executeAutonomousWorkflow(
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('ANALYZING_OPTICS');

    // 1. Plan using Orchestrator model.
    const planningResponse = await this.withResilience<GenerateContentResponse>(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.models.generateContent({
        model: MODELS.ORCHESTRATOR,
        contents: {
          parts: [
            { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
            { text: `你是一位摄影大师。请对该影像执行【自主规划】。输出模拟 ${profile.name} 质感的 JSON 显影清单。` }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnostic: { type: Type.STRING },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiredKnowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
              auditCriteria: { type: Type.STRING }
            },
            required: ["diagnostic", "tasks", "focusAreas", "requiredKnowledge", "auditCriteria"]
          }
        }
      });
    });

    const manifestText = planningResponse.text;
    if (!manifestText) throw new Error("规划引擎故障。");
    const manifest: DevelopManifest = JSON.parse(manifestText);

    onProgress?.('RETRIEVING_KNOWLEDGE');
    // 2. Retrieve real-world knowledge using Search Grounding.
    const searchResponse = await this.withResilience<GenerateContentResponse>(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.models.generateContent({
        model: MODELS.MASTER_RENDER,
        contents: `检索关于 ${manifest.requiredKnowledge.join(', ')} 的光学数据。`,
        config: { 
          tools: [{ googleSearch: {} }],
          // Fix: Cast safetySettings to any to satisfy strict type checking.
          safetySettings: SafetyResilienceService.getSafetySettings() as any
        }
      });
    });
    
    // Fix: Implemented extractSources helper.
    const sources = this.extractSources(searchResponse);
    const localData = KnowledgeRetrievalService.retrieve([...manifest.requiredKnowledge, profile.name]);

    onProgress?.('NEURAL_DEVELOPING');
    
    // Render strategies with adaptive prompting and image perturbation to bypass safety filters.
    const retryStrategies = [
      { id: 'initial', promptLevel: 'SOFT' as const, imageStrategy: -1 },
      { id: 'perturb', promptLevel: 'SOFT' as const, imageStrategy: 0 },
      { id: 'crop_noise', promptLevel: 'HARD' as const, imageStrategy: 2 }
    ];

    let lastError: any = null;
    for (const strategy of retryStrategies) {
      try {
        let currentImg = img;
        if (strategy.imageStrategy !== -1) {
          currentImg = await SafetyResilienceService.applyBypassStrategy(img, strategy.imageStrategy);
        }

        const basePrompt = `[诊断]：${manifest.diagnostic}\n[任务]：${manifest.tasks.join(' -> ')}\n以 ${intensity} 强度注入 ${profile.name} 的物理灵魂。\n\n[实验室知识库注入]：\n${localData}`;
        const finalPrompt = SafetyResilienceService.sanitizePrompt(basePrompt, strategy.promptLevel);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const renderResponse = await ai.models.generateContent({
          model: MODELS.MASTER_RENDER,
          contents: {
            parts: [
              { inlineData: { data: currentImg.base64Data, mimeType: currentImg.mimeType } },
              { text: finalPrompt }
            ]
          },
          config: {
            safetySettings: SafetyResilienceService.getSafetySettings() as any
          }
        });

        let outputUrl = "";
        let promptUsed = renderResponse.text || "";
        for (const part of renderResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            outputUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (outputUrl) {
          onProgress?.('QUALITY_CHECKING');
          const session: DevelopSession = {
            sessionId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            cameraId: profile.id,
            cameraName: profile.name,
            createdAt: new Date(),
            outputUrl,
            outputMeta: {
              width: img.width,
              height: img.height,
              intensity,
              mode: 'AGENTIC',
              promptUsed,
              sources,
              manifest
            }
          };
          return { session, blob: await (await fetch(outputUrl)).blob() };
        }
      } catch (err) {
        lastError = err;
        console.warn(`Render strategy ${strategy.id} failed, trying next...`, err);
      }
    }

    // Fix: Ensure a value is always returned or an error thrown.
    throw lastError || new Error("显影神经系统由于策略限制无法生成结果。");
  }

  // Simplified workflow for quick generation using Flash model.
  private async executeFlashWorkflow(
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const knowledge = KnowledgeRetrievalService.retrieve([profile.name, profile.category]);
    
    onProgress?.('NEURAL_DEVELOPING');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await this.withResilience(async () => {
      return ai.models.generateContent({
        model: MODELS.QUICK_DEV,
        contents: {
          parts: [
            { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
            { text: `${profile.promptTemplate}\n\n[知识库注入]：\n${knowledge}\n\n以 ${intensity} 强度进行渲染。` }
          ]
        },
        config: {
          safetySettings: SafetyResilienceService.getSafetySettings() as any
        }
      });
    });

    onProgress?.('QUALITY_CHECKING');
    let outputUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        outputUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!outputUrl) throw new Error("神经显影结果未生成。");

    const session: DevelopSession = {
      sessionId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      cameraId: profile.id,
      cameraName: profile.name,
      createdAt: new Date(),
      outputUrl,
      outputMeta: {
        width: img.width,
        height: img.height,
        intensity,
        mode: 'DIRECT',
        promptUsed: response.text || "Direct Flash Workflow"
      }
    };

    return { session, blob: await (await fetch(outputUrl)).blob() };
  }

  // Helper to extract web grounding sources from model response.
  private extractSources(response: GenerateContentResponse): GroundingSource[] {
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = [];
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
    return sources;
  }
}
