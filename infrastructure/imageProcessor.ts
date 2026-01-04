
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopResult, DevelopMode, GroundingSource } from '../domain/types';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentResponse } from "@google/genai";
import { KnowledgeRetrievalService } from './knowledgeBase';

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface InternalImageData {
  base64Data: string;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * 显影引擎模型配置常量
 */
const MODELS = {
  QUICK_DEVELOP: 'gemini-2.5-flash-image',       // 2.5 快速显影引擎
  MASTER_AUDIT: 'gemini-3-pro-preview',          // 3.0 大师审计引擎 (支持 Thinking)
  MASTER_DEVELOP: 'gemini-3-pro-image-preview'   // 3.0 大师显影引擎 (高精度/Search)
};

export class GeminiImageProcessor implements IImageProcessor {
  /**
   * 主入口：显影执行引擎
   */
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number,
    mode: DevelopMode,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("缺少有效的 API 密钥，请在实验室入口进行授权。");

    const ai = new GoogleGenAI({ apiKey });
    const imageData = await this.getOptimizedImageData(imageSource, 1536);
    
    return mode === 'AGENTIC' 
      ? this.executeAgenticWorkflow(ai, imageData, profile, intensity, onProgress)
      : this.executeAigcWorkflow(ai, imageData, profile, intensity, onProgress);
  }

  /**
   * AIGC 快显流程：使用 Gemini 2.5 Flash Image 引擎
   */
  private async executeAigcWorkflow(
    ai: GoogleGenAI,
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const localContext = KnowledgeRetrievalService.retrieve([profile.name, 'photography', profile.category]);
    
    onProgress?.('NEURAL_DEVELOPING');
    const prompt = this.buildAigcPrompt(profile, localContext, intensity);

    const response = await ai.models.generateContent({
      model: MODELS.QUICK_DEVELOP,
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: prompt }
        ],
      },
      config: {
        safetySettings: this.getSafetySettings(),
        imageConfig: { 
          aspectRatio: this.getClosestAspectRatio(img.width, img.height)
          // 2.5 Flash 不支持 imageSize 1K/2K/4K 参数，仅由 aspectRatio 控制
        }
      }
    });

    return this.assembleResult(response, profile, intensity, 'DIRECT', prompt, img.width, img.height);
  }

  /**
   * Agent 大师流程：使用 Gemini 3 Pro 旗舰引擎
   */
  private async executeAgenticWorkflow(
    ai: GoogleGenAI,
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('ANALYZING_OPTICS');
    // 视觉审计：利用 3.0 Pro 模型的长思考能力
    const auditResponse: GenerateContentResponse = await ai.models.generateContent({
      model: MODELS.MASTER_AUDIT,
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: `作为首席摄影专家，请对这张照片进行【物理显影审计】：评估光影动态范围、对比度分布，并给出模拟 ${profile.name} 的像素重构建议。中文输出，150字内。` }
        ]
      },
      config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    const visualAudit = auditResponse.text || "视觉审计完成。";

    onProgress?.('RETRIEVING_KNOWLEDGE');
    const searchResponse: GenerateContentResponse = await ai.models.generateContent({
      model: MODELS.MASTER_DEVELOP,
      contents: `检索关于 ${profile.name} 相机的最新光学评测、色彩科学文档以及物理发色特性。`,
      config: { tools: [{ googleSearch: {} }] }
    });
    
    const sources = this.extractGroundingSources(searchResponse);
    const searchKnowledge = searchResponse.text || "实时数据注入中...";
    const localKnowledge = KnowledgeRetrievalService.retrieve([profile.name, profile.category, 'sensor', 'optical']);

    onProgress?.('NEURAL_DEVELOPING');
    const masterReport = this.buildAgenticReport(visualAudit, searchKnowledge, localKnowledge, profile, intensity);

    const response = await ai.models.generateContent({
      model: MODELS.MASTER_DEVELOP,
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: masterReport }
        ],
      },
      config: {
        safetySettings: this.getSafetySettings(),
        imageConfig: { 
          aspectRatio: this.getClosestAspectRatio(img.width, img.height),
          imageSize: "1K"
        },
        tools: [{ googleSearch: {} }]
      }
    });

    return this.assembleResult(response, profile, intensity, 'AGENTIC', masterReport, img.width, img.height, sources);
  }

  private buildAigcPrompt(profile: CameraProfile, context: string, intensity: number): string {
    return `【徕滤实验室 AIGC 快显协议】
执行指令：${profile.promptTemplate.replace(/\[[\s\S]*?\]/g, '')}
背景知识：${context}
要求：强度设为 ${intensity}。快速重现 ${profile.name} 的影调氛围，保持画面纯净度。`;
  }

  private buildAgenticReport(audit: string, search: string, local: string, profile: CameraProfile, intensity: number): string {
    return `【徕滤实验室 Agent 大师显影报告】

【影像审计分析】
${audit}

【全球实时技术同步】
${search}

【本地高密度光学底稿】
${local}

【显影执行核心】
根据上述审计与检索到的物理参数，以 ${intensity} 强度对原始底片执行深度重构。
重点：重构 ${profile.name} 特有的微对比度、光学晕化与感光乳剂颗粒。`;
  }

  private extractGroundingSources(response: GenerateContentResponse): GroundingSource[] {
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push({ title: chunk.web.title || '参考来源', uri: chunk.web.uri });
      }
    });
    return sources;
  }

  private assembleResult(
    response: GenerateContentResponse, 
    profile: CameraProfile, 
    intensity: number, 
    mode: DevelopMode, 
    promptUsed: string,
    width: number,
    height: number,
    sources?: GroundingSource[]
  ): DevelopResult {
    const candidate = response.candidates?.[0];
    let outputBase64 = '';
    
    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData) {
        outputBase64 = part.inlineData.data;
        break;
      }
    }

    if (!outputBase64) {
      throw new Error(`显影引擎故障：未能从响应中提取像素数据。原因: ${candidate?.finishReason || '未知'}`);
    }

    const binary = atob(outputBase64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);

    return {
      session: {
        sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
        cameraId: profile.id,
        cameraName: profile.name,
        createdAt: new Date(),
        outputMeta: { width, height, intensity, mode, promptUsed, sources },
        outputUrl: `data:image/png;base64,${outputBase64}`
      },
      blob: new Blob([array], { type: 'image/png' })
    };
  }

  private getSafetySettings() {
    return [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];
  }

  private getClosestAspectRatio(w: number, h: number): SupportedAspectRatio {
    const ratio = w / h;
    const candidates: { ratio: number; value: SupportedAspectRatio }[] = [
      { ratio: 1, value: "1:1" }, { ratio: 3/4, value: "3:4" }, { ratio: 4/3, value: "4:3" }, { ratio: 9/16, value: "9:16" }, { ratio: 16/9, value: "16:9" }
    ];
    return candidates.reduce((prev, curr) => Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev).value;
  }

  private async getOptimizedImageData(source: string | File, targetSize: number): Promise<InternalImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const src = typeof source === 'string' ? source : URL.createObjectURL(source);
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
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0, w, h);
        const data = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
        resolve({ base64Data: data, mimeType: 'image/jpeg', width: w, height: h });
        if (typeof source !== 'string') URL.revokeObjectURL(src);
      };
      img.onerror = () => reject(new Error("无法加载底片源文件"));
      img.src = src;
    });
  }
}
