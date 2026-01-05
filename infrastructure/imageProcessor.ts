
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
 * 核心引擎配置：严格遵循最新命名规范
 */
const MODELS = {
  QUICK_DEV: 'gemini-2.5-flash-image',       // 快速显影引擎
  MASTER_AUDIT: 'gemini-3-pro-preview',      // 大师级推理审计
  MASTER_RENDER: 'gemini-3-pro-image-preview' // 高精度像素重构
};

/**
 * 智能资源调度层：信息熵与强度双维度博弈
 */
class AdaptiveBudgetController {
  /**
   * 根据影像复杂度与显影强度动态分配推理预算
   */
  static calculate(intensity: number, profile: CameraProfile): number {
    // 基础算力：1024
    let budget = 1024;
    
    // 权重 A：显影强度（强度 0.8 以上触发深层物理建模）
    const intensityMultiplier = Math.pow(intensity, 2.5);
    
    // 权重 B：预设复杂度
    const profileComplexity = profile.promptTemplate.length > 600 ? 1.4 : 1.0;

    budget += (intensityMultiplier * 15360 * profileComplexity);

    // 封顶 16384，保底 1024，确保成本与性能平衡
    return Math.floor(Math.min(Math.max(budget, 1024), 16384));
  }
}

export class GeminiImageProcessor implements IImageProcessor {
  
  /**
   * 指数退避重试：确保极端并发下的显影稳定性
   */
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
    if (!apiKey) throw new Error("实验室授权未就绪，请先完成身份验证。");

    const ai = new GoogleGenAI({ apiKey });
    const imageData = await this.getOptimizedImageData(imageSource, 1536);
    
    return mode === 'AGENTIC' 
      ? this.executeAgenticWorkflow(ai, imageData, profile, intensity, onProgress)
      : this.executeFlashWorkflow(ai, imageData, profile, intensity, onProgress);
  }

  /**
   * 标准快显流程：模拟化学显影的快速反应
   */
  private async executeFlashWorkflow(
    ai: GoogleGenAI,
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const context = KnowledgeRetrievalService.retrieve([profile.name, '影调']);
    
    onProgress?.('NEURAL_DEVELOPING');
    const prompt = `【徕滤实验室：快显协议】
参照 ${profile.name} 的光学特征，以 ${intensity} 的显影深度执行。
底层参考：${context.substring(0, 400)}
目标：重塑影调，注入胶片质感。`;

    const response = await this.withResilience(() => ai.models.generateContent({
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
    }));

    return this.packageResult(response, profile, intensity, 'DIRECT', prompt, img.width, img.height);
  }

  /**
   * Agent 大师显影流程：全维度物理建模重构
   */
  private async executeAgenticWorkflow(
    ai: GoogleGenAI,
    img: InternalImageData,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    const budget = AdaptiveBudgetController.calculate(intensity, profile);
    console.debug(`[实验室动态调度] 显影预算分配: ${budget} 神经元`);

    onProgress?.('ANALYZING_OPTICS');
    
    // 步骤 1：全方位物理审计 (光谱 + 几何 + 物理参数推导)
    const auditResponse = await this.withResilience(() => ai.models.generateContent({
      model: MODELS.MASTER_AUDIT,
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: `你是一位殿堂级摄影物理学家。请对该底片执行【全维度物理审计】：
1. 【环境光线审计】：分析光源的光谱显色指数 (CRI) 及其照度等级 (EV)。
2. 【镜头几何建模】：推断当前的物距关系。如果是广角或大光圈，识别径向对比度衰减 (Radial Decay) 的物理热图。
3. 【数字孪生推演】：如果这张照片是用 ${profile.name} 拍摄的，推导其物理光圈、快门及感光度的“伪物理参数”。
请以极具艺术感的中文回复，200字内。` }
        ]
      },
      config: { 
        thinkingConfig: { thinkingBudget: budget } 
      }
    }));
    const auditReport = auditResponse.text || "审计完成。";

    onProgress?.('RETRIEVING_KNOWLEDGE');
    // 步骤 2：实验室溯源与本地知识融合
    const searchResponse = await this.withResilience(() => ai.models.generateContent({
      model: MODELS.MASTER_RENDER,
      contents: `检索关于 ${profile.name} 相机的最新光学实验室评测数据，以及 ${profile.category} 品牌的色彩科学协议。`,
      config: { tools: [{ googleSearch: {} }] }
    }));
    
    const sources = this.extractSources(searchResponse);
    const searchData = searchResponse.text || "";
    const localData = KnowledgeRetrievalService.retrieve([profile.name, profile.category, '光学', '物理']);

    onProgress?.('NEURAL_DEVELOPING');
    // 步骤 3：区域显影渲染 (注入 Zone System 逻辑)
    const renderInstruction = `【徕滤实验室：大师级显影协议】

【物理审计建模】
${auditReport}

【实时全球档案】
${searchData}

【本地光学底稿】
${localData.substring(0, 1000)}

【终极显影要求】
作为首席显影师，基于上述物理建模，以强度 ${intensity} 执行重构。
1. 严格遵循【区域曝光系统 (Zone System)】：保护 0 区阴影深度与 10 区高光纹理，避免数码感死白。
2. 注入【物理缺陷美学】：模拟真实镜头的色散分布与边缘解析度退化。
3. 颗粒重组：在信息熵高的区域注入更具质感的银盐晶体结构。
执行像素级物理建模，而非简单的调色。`;

    const response = await this.withResilience(() => ai.models.generateContent({
      model: MODELS.MASTER_RENDER,
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: renderInstruction }
        ],
      },
      config: {
        safetySettings: this.getSafetyConfig(),
        imageConfig: { 
          aspectRatio: this.matchAspectRatio(img.width, img.height),
          imageSize: "1K" 
        },
        tools: [{ googleSearch: {} }]
      }
    }));

    return this.packageResult(response, profile, intensity, 'AGENTIC', renderInstruction, img.width, img.height, sources);
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
    sources?: GroundingSource[]
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
      throw new Error(`显影失败：由于神经引擎反馈 [${candidate.finishReason}]，无法生成影像。建议重置实验室或检查底片内容。`);
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
        outputMeta: { width, height, intensity, mode, promptUsed: prompt, sources },
        outputUrl: `data:image/png;base64,${base64}`
      },
      blob: new Blob([array], { type: 'image/png' })
    };
  }

  private getSafetyConfig() {
    return [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
    ];
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
        if (!ctx) return reject("Canvas Context Error");
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
