
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopResult, DevelopMode, GroundingSource, DevelopManifest } from '../domain/types';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { KnowledgeRetrievalService } from './knowledgeBase';

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface InternalImageData {
  base64Data: string;
  mimeType: string;
  width: number;
  height: number;
}

const MODELS = {
  // 必须使用支持 imageConfig (aspectRatio) 的模型
  QUICK_DEV: 'gemini-2.5-flash-image', 
  ORCHESTRATOR: 'gemini-3-pro-preview',
  MASTER_RENDER: 'gemini-3-pro-image-preview'
};

export class GeminiImageProcessor implements IImageProcessor {
  
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

    const imageData = await this.getOptimizedImageData(imageSource, 1536);
    
    return mode === 'AGENTIC' 
      ? this.executeAutonomousWorkflow(imageData, profile, intensity, onProgress)
      : this.executeFlashWorkflow(imageData, profile, intensity, onProgress);
  }

  private async executeAutonomousWorkflow(
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('ANALYZING_OPTICS');

    // 1. 自规划阶段：生成显影清单 (Develop Manifest)
    const planningResponse = await this.withResilience<GenerateContentResponse>(async () => {
      // 必须在调用前创建实例以确保使用最新的 API KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.models.generateContent({
        model: MODELS.ORCHESTRATOR,
        contents: {
          parts: [
            { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
            { text: `你是一位殿堂级摄影大师与首席显影师。请对该影像执行【自主规划】。
你的目标是模拟 ${profile.name} 的极致质感。
输出一个 JSON 格式的显影清单，包含：
1. diagnostic: 对底片光影和物理特征的专业临床诊断（中文）。
2. tasks: 为了达到目标，你需要执行的具体显影任务列表（中文）。
3. focusAreas: 重点关注的图像区域（中文）。
4. requiredKnowledge: 需要检索的摄影百科关键词。
5. auditCriteria: 完成后的自我审计标准（中文）。` }
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

    const manifest: DevelopManifest = JSON.parse(planningResponse.text || "{}");

    onProgress?.('RETRIEVING_KNOWLEDGE');
    // 2. 自工具检索：结合 Manifest 执行检索
    const searchResponse = await this.withResilience<GenerateContentResponse>(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.models.generateContent({
        model: MODELS.MASTER_RENDER,
        contents: `检索关于 ${manifest.requiredKnowledge.join(', ')} 的光学实验室数据及 ${profile.name} 的最新显影协议。`,
        config: { tools: [{ googleSearch: {} }] }
      });
    });
    
    const sources = this.extractSources(searchResponse);
    const localData = KnowledgeRetrievalService.retrieve([...manifest.requiredKnowledge, profile.name]);

    onProgress?.('NEURAL_DEVELOPING');
    // 3. 自执行渲染
    const finalInstruction = `【开机超级 Agent 自主显影协议】
[临床诊断]：${manifest.diagnostic}
[任务编排]：${manifest.tasks.join(' -> ')}
[重点区域]：${manifest.focusAreas.join(', ')}
[物理建模百科]：${localData.substring(0, 1000)}
[全球实时数据]：${searchResponse.text}

显影师指令：
请以 ${intensity} 强度执行物理建模。不仅是调色，要注入 ${profile.name} 的物理灵魂。
审计标准：${manifest.auditCriteria}`;

    const response = await this.withResilience<GenerateContentResponse>(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.models.generateContent({
        model: MODELS.MASTER_RENDER,
        contents: {
          parts: [
            { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
            { text: finalInstruction }
          ],
        },
        config: {
          imageConfig: { 
            aspectRatio: this.matchAspectRatio(img.width, img.height),
            imageSize: "1K" 
          }
        }
      });
    });

    onProgress?.('QUALITY_CHECKING');
    return this.packageResult(response, profile, intensity, 'AGENTIC', finalInstruction, img.width, img.height, sources, manifest);
  }

  private async executeFlashWorkflow(
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const context = KnowledgeRetrievalService.retrieve([profile.name, '影调']);
    
    onProgress?.('NEURAL_DEVELOPING');
    const prompt = `【开机实验室：快显协议】
参照 ${profile.name} 的光学特征，以 ${intensity} 的显影深度执行。
目标：重塑影调，注入胶片质感。
参考背景知识：${context.substring(0, 500)}`;

    const response = await this.withResilience<GenerateContentResponse>(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      return ai.models.generateContent({
        model: MODELS.QUICK_DEV,
        contents: {
          parts: [
            { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
            { text: prompt }
          ],
        },
        config: {
          imageConfig: { aspectRatio: this.matchAspectRatio(img.width, img.height) }
        }
      });
    });

    return this.packageResult(response, profile, intensity, 'DIRECT', prompt, img.width, img.height);
  }

  private extractSources(response: GenerateContentResponse): GroundingSource[] {
    return (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
      .map((c: any) => ({ title: c.web?.title || '技术文献', uri: c.web?.uri || '' }))
      .filter((s: any) => s.uri);
  }

  private packageResult(
    response: GenerateContentResponse, 
    profile: CameraProfile, 
    intensity: number, 
    mode: DevelopMode, 
    prompt: string,
    width: number,
    height: number,
    sources?: GroundingSource[],
    manifest?: DevelopManifest
  ): DevelopResult {
    const candidate = response.candidates[0];
    let base64 = '';
    
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        base64 = part.inlineData.data;
        break;
      }
    }

    if (!base64) {
      throw new Error(`显影失败：由于神经引擎反馈 [${candidate.finishReason}]。`);
    }

    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);

    return {
      session: {
        sessionId: `LAB_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        cameraId: profile.id,
        cameraName: profile.name,
        createdAt: new Date(),
        outputMeta: { width, height, intensity, mode, promptUsed: prompt, sources, manifest },
        outputUrl: `data:image/png;base64,${base64}`
      },
      blob: new Blob([array], { type: 'image/png' })
    };
  }

  private matchAspectRatio(w: number, h: number): SupportedAspectRatio {
    const r = w / h;
    const map: { r: number, v: SupportedAspectRatio }[] = [
      { r: 1, v: "1:1" }, { r: 3/4, v: "3:4" }, { r: 4/3, v: "4:3" }, { r: 9/16, v: "9:16" }, { r: 16/9, v: "16:9" }
    ];
    return map.reduce((p, c) => Math.abs(c.r - r) < Math.abs(p.r - r) ? c : p).v;
  }

  private async getOptimizedImageData(source: string | File, targetSize: number): Promise<InternalImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      img.onload = () => {
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > targetSize || h > targetSize) {
          if (w > h) { h = (h / w) * targetSize; w = targetSize; } 
          else { w = (w / h) * targetSize; h = targetSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas Error");
        ctx.drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
        resolve({ base64Data: data, mimeType: 'image/jpeg', width: Math.round(w), height: Math.round(h) });
        if (typeof source !== 'string') URL.revokeObjectURL(url);
      };
      img.onerror = () => reject("底片加载失败");
      img.src = url;
    });
  }
}