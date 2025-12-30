
import { IImageProcessor } from '../application/ports';
import { CameraProfile, DevelopResult } from '../domain/types';
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";

class PromptComposer {
  static compose(profile: CameraProfile, intensity: number): string {
    const { recipe, name } = profile;
    return `[CORE: NEURAL OPTICAL RECONSTRUCTION - ${name}]
STRENGTH: ${Math.round(intensity * 100)}%
DIRECTIVE: ${profile.promptTemplate.trim()}
TECHNICAL:
- EXPOSURE: ${recipe.exposure}
- GRAIN: ${recipe.grainAmount}
${recipe.grayscale ? '- MONOCHROME: TRUE' : ''}
RESPONSE: IMAGE DATA ONLY. NO TEXT.`;
  }
}

export class GeminiImageProcessor implements IImageProcessor {
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number
  ): Promise<DevelopResult> {
    const apiKey = process.env.API_KEY;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!apiKey) throw new Error("API KEY MISSING");

    const ai = new GoogleGenAI({ apiKey });
    const { base64Data, mimeType, width, height } = await this.getOptimizedImageData(imageSource);
    const fullPrompt = PromptComposer.compose(profile, intensity);

    try {
      // 强制使用 gemini-2.5-flash-image 以确保速度
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: fullPrompt }
          ],
        }
      });

      let outputBase64 = '';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          outputBase64 = part.inlineData.data;
          break;
        }
      }

      if (!outputBase64) throw new Error("ENGINE_EMPTY_RESPONSE");

      const sessionId = `leifi_${Math.random().toString(36).substring(2, 9)}`;
      const imageBlob = this.base64ToBlob(outputBase64, 'image/png');
      
      // 默认生成本地临时 URL，确保用户能立即看到图
      let finalUrl = URL.createObjectURL(imageBlob);

      // 静默尝试云端存储
      if (blobToken) {
        put(`leifi/v2/${sessionId}.png`, imageBlob, {
          access: 'public',
          token: blobToken
        }).then(({ url }) => {
          console.log('云端同步完成:', url);
          // 这里不更新 finalUrl 是为了避免不必要的重新渲染
        }).catch(e => console.warn('云端备份略过:', e));
      }

      return {
        session: {
          sessionId,
          cameraId: profile.id,
          cameraName: profile.name,
          createdAt: new Date(),
          outputMeta: { width, height, intensity, promptUsed: fullPrompt },
          outputUrl: finalUrl
        },
        blob: imageBlob
      };
    } catch (error: any) {
      console.error("显影核心错误:", error);
      throw error;
    }
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    return new Blob([uint8Array], { type });
  }

  private async getOptimizedImageData(source: string | File): Promise<{ base64Data: string; mimeType: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const MAX_SIZE = 1024; // 严格限制尺寸以加速
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
        if (!ctx) return reject(new Error("CANVAS_ERROR"));
        ctx.drawImage(imageElement, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ base64Data: dataUrl.split(',')[1], mimeType: 'image/jpeg', width: w, height: h });
      };

      if (typeof source === 'string') {
        fetch(source).then(r => r.blob()).then(b => {
          const url = URL.createObjectURL(b);
          img.onload = () => { processImg(img); URL.revokeObjectURL(url); };
          img.src = url;
        }).catch(reject);
      } else {
        const url = URL.createObjectURL(source);
        img.onload = () => { processImg(img); URL.revokeObjectURL(url); };
        img.src = url;
      }
    });
  }
}
