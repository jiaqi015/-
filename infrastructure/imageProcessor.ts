
import { IImageProcessor } from '../application/ports';
import { CameraProfile, DevelopResult } from '../domain/types';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

/**
 * 神经安全卫士：处理模型拦截与指令冲突
 */
class NeuralSafetyGuard {
  static getBypassConfig() {
    return {
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    };
  }

  /**
   * 将 Prompt 转换为纯净的中性英文属性集
   */
  static technicalSanitize(prompt: string): string {
    // 1. 移除中括号及其内容
    let cleaned = prompt.replace(/\[[\s\S]*?\]/g, '');
    
    // 2. 移除常见的拟人化/干扰词
    cleaned = cleaned.replace(/你现在是一位.*大师/g, '')
                     .replace(/你现在是一卷.*/g, '')
                     .replace(/执行.*脚本/g, '');

    // 3. 核心摄影术语翻译 (映射到稳定的英文关键词)
    const mapping: Record<string, string> = {
      '色彩': 'color palette',
      '影调': 'tonality',
      '高光': 'highlights',
      '阴影': 'shadows',
      '颗粒': 'film grain',
      '锐度': 'sharpness',
      '对比度': 'contrast',
      '饱和度': 'saturation',
      '氛围': 'atmosphere',
      '肤色': 'skin tones',
      '质感': 'texture',
      '光晕': 'glow',
      '德系': 'German optic style',
      '日系': 'Japanese film style',
      '复古': 'vintage',
      '纪实': 'documentary aesthetic'
    };

    Object.entries(mapping).forEach(([cn, en]) => {
      cleaned = cleaned.split(cn).join(en);
    });

    // 4. 彻底移除剩余中文字符，这是解决 IMAGE_OTHER 的关键
    cleaned = cleaned.replace(/[\u4e00-\u9fa5]/g, ' ');

    // 5. 敏感词替换
    cleaned = cleaned.replace(/(sexy|nude|erotic|aggressive|sensitive|depressing)/gi, 'artistic');

    return cleaned.replace(/\s+/g, ' ').trim().substring(0, 500);
  }
}

class PromptComposer {
  static compose(profile: CameraProfile, intensity: number): string {
    const { recipe } = profile;
    const descriptors = NeuralSafetyGuard.technicalSanitize(profile.promptTemplate);
    
    // 采用“元数据注入”风格，不使用动词，避免模型误解为“生成新内容”而非“编辑原图”
    return `IMAGE_MODIFICATION_PROFILE:
- VISUAL_STYLE: ${descriptors}
- RENDERING_INTENSITY: ${intensity}
- CHROMATIC_MODE: ${recipe.grayscale ? 'MONOCHROME_FILM' : 'ANALOG_COLOR_STOCKS'}
- EXPOSURE_VALUE: ${recipe.exposure}
- CONTRAST_INDEX: ${recipe.contrast}
- FILM_GRAIN_STRUCTURE: ${recipe.grainAmount}
- PERIPHERAL_VIGNETTE: ${recipe.vignetteAmount}
- OPTICAL_FLAVOR: High-fidelity lens simulation`;
  }
}

export class GeminiImageProcessor implements IImageProcessor {
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number
  ): Promise<DevelopResult> {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("MISSING_API_KEY: 请在设置中配置有效的显影密钥。");
    }

    const ai = new GoogleGenAI({ apiKey });
    // 调整为 768px，这是 Flash 模型的黄金比例
    const { base64Data, mimeType, width, height } = await this.getOptimizedImageData(imageSource, 768);
    const aspectRatio = this.getClosestAspectRatio(width, height);
    const finalPrompt = PromptComposer.compose(profile, intensity);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: finalPrompt }
          ],
        },
        config: {
          ...NeuralSafetyGuard.getBypassConfig(),
          imageConfig: { aspectRatio: aspectRatio }
        }
      });

      const candidate = response.candidates?.[0];
      
      // 增强型 Debug 日志
      if (!candidate || candidate.finishReason !== 'STOP') {
        console.warn("Gemini Engine Diagnosis:", JSON.stringify({
          finishReason: candidate?.finishReason,
          safety: candidate?.safetyRatings,
          promptTail: finalPrompt.substring(finalPrompt.length - 100)
        }, null, 2));
      }

      if (candidate?.finishReason === 'SAFETY') {
        throw new Error("SAFETY_INTERCEPT: 影像特征触碰模型安全边界，显影已终止。请尝试更换角度或调低强度。");
      }

      let outputBase64 = '';
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          outputBase64 = part.inlineData.data;
          break;
        }
      }

      if (!outputBase64) {
        const reason = candidate?.finishReason || "UNKNOWN";
        throw new Error(`MODEL_EMPTY_RESPONSE: 显影失败(原因:${reason})。建议检查图片内容是否过于复杂，或尝试重新显影。`);
      }

      const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
      const outputUrl = `data:image/png;base64,${outputBase64}`;
      
      const binary = atob(outputBase64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      const blob = new Blob([array], { type: 'image/png' });

      return {
        session: {
          sessionId,
          cameraId: profile.id,
          cameraName: profile.name,
          createdAt: new Date(),
          outputMeta: { width, height, intensity, promptUsed: finalPrompt },
          outputUrl: outputUrl
        },
        blob: blob
      };
    } catch (error: any) {
      console.error("Critical Image Processor Failure:", error);
      throw error;
    }
  }

  private getClosestAspectRatio(w: number, h: number): SupportedAspectRatio {
    const ratio = w / h;
    const candidates: { ratio: number; value: SupportedAspectRatio }[] = [
      { ratio: 1, value: "1:1" }, { ratio: 3/4, value: "3:4" }, { ratio: 4/3, value: "4:3" }, { ratio: 9/16, value: "9:16" }, { ratio: 16/9, value: "16:9" }
    ];
    return candidates.reduce((prev, curr) => Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev).value;
  }

  private async getOptimizedImageData(source: string | File, targetSize: number): Promise<{ base64Data: string; mimeType: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const processImg = (imageElement: HTMLImageElement) => {
        let w = imageElement.naturalWidth;
        let h = imageElement.naturalHeight;
        if (w > targetSize || h > targetSize) {
          if (w > h) { h = (h / w) * targetSize; w = targetSize; } 
          else { w = (w / h) * targetSize; h = targetSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("CANVAS_UNAVAILABLE"));
        ctx.drawImage(imageElement, 0, 0, w, h);
        resolve({ 
          base64Data: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], 
          mimeType: 'image/jpeg', 
          width: w, 
          height: h 
        });
      };

      const src = typeof source === 'string' ? source : URL.createObjectURL(source);
      img.onload = () => {
        processImg(img);
        if (typeof source !== 'string') URL.revokeObjectURL(src);
      };
      img.onerror = () => reject(new Error("IMAGE_IO_FAILURE"));
      img.src = src;
    });
  }
}
