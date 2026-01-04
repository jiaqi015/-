
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopResult, DevelopMode, DevelopSession } from '../domain/types';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { KnowledgeRetrievalService } from './knowledgeBase';

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export class GeminiImageProcessor implements IImageProcessor {
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number,
    mode: DevelopMode,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    // 关键修复：每次处理前从环境变量重新获取最新的 API_KEY 并实例化
    // 在 AI Studio 环境中，process.env.API_KEY 会在用户通过 dialog 选择后被注入
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("缺少有效的 API 密钥，请在实验室入口进行授权。");

    const ai = new GoogleGenAI({ apiKey });
    const imageData = await this.getOptimizedImageData(imageSource, 1536);
    
    // 架构分离：根据模式进入不同的执行管道
    if (mode === 'AGENTIC') {
      return this.executeAgenticWorkflow(ai, imageData, profile, intensity, onProgress);
    } else {
      return this.executeAigcWorkflow(ai, imageData, profile, intensity, onProgress);
    }
  }

  /**
   * 模式 A：AIGC 快显模式 (Gemini 3 Flash)
   * 使用较轻量但高性能的模型完成基础显影
   */
  private async executeAigcWorkflow(
    ai: any,
    img: any,
    profile: CameraProfile,
    intensity: number,
    onProgress?: any
  ): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const quickFacts = KnowledgeRetrievalService.retrieve([profile.name, 'photography', profile.category]);
    
    onProgress?.('NEURAL_DEVELOPING');
    const finalPrompt = `【徕滤实验室 AIGC 快显协议】
执行指令：${profile.promptTemplate.replace(/\[[\s\S]*?\]/g, '')}
背景知识：${quickFacts}
要求：强度设为 ${intensity}。快速重现 ${profile.name} 的影调氛围，保持画面纯净度。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // 统一使用 3 系列以获得最佳画质，且支持 1K 参数
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: finalPrompt }
        ],
      },
      config: {
        safetySettings: this.getSafetySettings(),
        imageConfig: { 
          aspectRatio: this.getClosestAspectRatio(img.width, img.height),
          imageSize: "1K"
        }
      }
    });

    return this.assembleResult(response, profile, intensity, 'DIRECT', finalPrompt, img.width, img.height);
  }

  /**
   * 模式 B：Agent 大师模式 (Gemini 3 Pro)
   * 涉及双重思考、联网搜索与高密度 RAG 注入
   */
  private async executeAgenticWorkflow(
    ai: any,
    img: any,
    profile: CameraProfile,
    intensity: number,
    onProgress?: any
  ): Promise<DevelopResult> {
    onProgress?.('ANALYZING_OPTICS');
    // 第一步：深度视觉审计 (利用 Gemini 3 Pro 的推理能力)
    const analystResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: `作为首席摄影器材专家，请对这张照片进行【物理显影审计】：
          1. 评估当前光影的动态范围分布。
          2. 若要模拟 ${profile.name} 的光学特征，应如何处理其特有的高光滚降和色彩溢出？
          请用中文输出 200 字以内的“实验室审计报告”。` }
        ]
      },
      config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    const visualAudit = analystResponse.text || "视觉审计已完成。";

    onProgress?.('RETRIEVING_KNOWLEDGE');
    // 第二步：联网获取最新器材评测与物理参数
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: `检索关于 ${profile.name} 相机的最新光学评测、色彩科学文档、传感器物理缺陷分析以及在现代摄影中的应用建议。`,
      config: { tools: [{ googleSearch: {} }] }
    });
    const searchKnowledge = searchResponse.text || "实时技术数据已注入。";
    
    // 第三步：从本地高密度知识库检索核心语料
    const localKnowledge = KnowledgeRetrievalService.retrieve([profile.name, profile.category, 'sensor', 'optical']);

    onProgress?.('NEURAL_DEVELOPING');
    const finalReport = `【徕滤实验室 Agent 大师显影报告】

【影像审计分析】
${visualAudit}

【全球实时技术同步】
${searchKnowledge}

【本地高密度光学底稿】
${localKnowledge}

【原始执行协议】
${profile.promptTemplate.replace(/\[[\s\S]*?\]/g, '')}

【显影策略核心】
根据上述审计与检索到的物理参数，以 ${intensity} 强度进行深度显影。
重点：精准重构 ${profile.name} 特有的微对比度、边角失光 (Vignetting) 与有机颗粒感。利用联网获取的最新色彩对齐逻辑，执行高位深色彩重组。`;

    // 最终像素重构
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: img.base64Data, mimeType: img.mimeType } },
          { text: finalReport }
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

    return this.assembleResult(response, profile, intensity, 'AGENTIC', finalReport, img.width, img.height);
  }

  private assembleResult(
    response: any, 
    profile: CameraProfile, 
    intensity: number, 
    mode: DevelopMode, 
    promptUsed: string,
    width: number,
    height: number
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
      // 捕获权限相关错误或内容拦截
      const status = response.candidates?.[0]?.finishReason;
      throw new Error(`显影引擎未能生成像素数据。状态: ${status || '未知故障'}。请检查 API 权限或重试。`);
    }

    const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
    const outputUrl = `data:image/png;base64,${outputBase64}`;
    
    const binary = atob(outputBase64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);

    return {
      session: {
        sessionId,
        cameraId: profile.id,
        cameraName: profile.name,
        createdAt: new Date(),
        outputMeta: { width, height, intensity, mode, promptUsed },
        outputUrl
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

  private async getOptimizedImageData(source: string | File, targetSize: number) {
    return new Promise<{ base64Data: string; mimeType: string; width: number; height: number }>((resolve, reject) => {
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
        resolve({ base64Data: canvas.toDataURL('image/jpeg', 0.95).split(',')[1], mimeType: 'image/jpeg', width: w, height: h });
        if (typeof source !== 'string') URL.revokeObjectURL(src);
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = src;
    });
  }
}
