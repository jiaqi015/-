
import { IImageProcessor } from '../application/ports';
import { CameraProfile, DevelopResult } from '../domain/types';
import { GoogleGenAI } from "@google/genai";

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

class PromptComposer {
  static compose(profile: CameraProfile, intensity: number): string {
    const { recipe, name } = profile;
    return `[PROJECT: NEURAL OPTICAL RECONSTRUCTION - ${name.toUpperCase()}]
INTENSITY: ${Math.round(intensity * 100)}%
DIRECTIVE: ${profile.promptTemplate.trim()}
TECHNICAL SPECS:
- EXPOSURE: ${recipe.exposure}
- GRAIN: ${recipe.grainAmount}
${recipe.grayscale ? '- DOMAIN: MONOCHROME' : '- DOMAIN: FULL_COLOR'}
IMPORTANT: OUTPUT IMAGE DATA ONLY. NO TEXT DESCRIPTION.`;
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
      throw new Error("MISSING_API_KEY: 请在开发者中心配置有效的显影密钥。");
    }

    const ai = new GoogleGenAI({ apiKey });
    const { base64Data, mimeType, width, height } = await this.getOptimizedImageData(imageSource);
    const aspectRatio = this.getClosestAspectRatio(width, height);
    const fullPrompt = PromptComposer.compose(profile, intensity);

    try {
      // 切换到极速版 gemini-2.5-flash-image，显影成功率更高，速度提升 300%
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: fullPrompt }
          ],
        },
        config: {
          // 注意：imageSize 仅支持 gemini-3-pro-image-preview，在 flash 模型中必须移除
          imageConfig: { aspectRatio: aspectRatio }
        }
      });

      let outputBase64 = '';
      const candidate = response.candidates?.[0];
      
      if (!candidate) throw new Error("ENGINE_NO_CANDIDATE: 显影引擎未能识别影像特征");

      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          outputBase64 = part.inlineData.data;
          break;
        }
      }

      if (!outputBase64) {
        console.warn("Gemini Response Meta:", response);
        throw new Error("MODEL_EMPTY_RESPONSE: 显影结果为空，请尝试调整强度或更换底片");
      }

      const sessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
      const outputUrl = `data:image/png;base64,${outputBase64}`;
      
      // 构建 Blob 以便下载
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
          outputMeta: { width, height, intensity, promptUsed: fullPrompt },
          outputUrl: outputUrl
        },
        blob: blob
      };
    } catch (error: any) {
      console.error("显影核心报错:", error);
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

  private async getOptimizedImageData(source: string | File): Promise<{ base64Data: string; mimeType: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const MAX_SIZE = 1024; // 适度的分辨率可以极大缩短 AI 处理时间
      const img = new Image();
      const processImg = (imageElement: HTMLImageElement) => {
        let w = imageElement.naturalWidth;
        let h = imageElement.naturalHeight;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) { h = (h / w) * MAX_SIZE; w = MAX_SIZE; } 
          else { w = (w / h) * MAX_SIZE; h = MAX_SIZE; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("CANVAS_CONTEXT_ERROR"));
        ctx.drawImage(imageElement, 0, 0, w, h);
        resolve({ 
          base64Data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], 
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
      img.onerror = () => reject(new Error("IMAGE_LOAD_ERROR: 无法读取源图像"));
      img.src = src;
    });
  }
}
