
import { IImageProcessor } from '../application/ports';
import { CameraProfile, DevelopResult } from '../domain/types';
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

class PromptComposer {
  static compose(profile: CameraProfile, intensity: number): string {
    const { recipe, name } = profile;
    let prompt = `[核心指令：神经光学重构 - 项目 ${name}]\n`;
    prompt += `主引擎：艺术合成，显影强度 ${Math.round(intensity * 100)}%。\n\n`;
    prompt += `核心章程：\n${profile.promptTemplate.trim()}\n\n`;
    prompt += `硬件规格说明：\n`;
    prompt += `- 模拟光路：${recipe.exposure > 0 ? '过曝' : '欠曝'} ${Math.abs(recipe.exposure)} 档。\n`;
    prompt += `- 信号噪点：${recipe.grainAmount > 20 ? '高颗粒感' : '低噪点控制'}。\n`;
    if (recipe.grayscale) prompt += `4. 单色域控制\n`;
    return prompt;
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
    
    if (!apiKey) {
      throw new Error("缺少显影密钥 (API_KEY)");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const { base64Data, mimeType, width, height } = await this.getOptimizedImageData(imageSource);
    const aspectRatio = this.getClosestAspectRatio(width, height);
    const fullPrompt = PromptComposer.compose(profile, intensity);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: fullPrompt }
          ],
        },
        config: {
          imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
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

      if (!outputBase64) throw new Error("显影引擎响应为空");

      const sessionId = `sess_${Math.random().toString(36).substr(2, 9)}`;
      const imageBlob = this.base64ToBlob(outputBase64, 'image/png');
      
      let finalUrl = '';

      // 弹性处理：如果有 Token，则上传到云端；否则使用本地 Object URL
      if (blobToken && blobToken.length > 0) {
        try {
          const { url: cloudUrl } = await put(`leifi-lab/outputs/${sessionId}.png`, imageBlob, {
            access: 'public',
            token: blobToken
          });
          finalUrl = cloudUrl;
        } catch (uploadError) {
          console.warn('云端上传失败，回退至本地预览链接', uploadError);
          finalUrl = URL.createObjectURL(imageBlob);
        }
      } else {
        finalUrl = URL.createObjectURL(imageBlob);
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
      console.error("Gemini 显影过程出错:", error);
      throw error;
    }
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const binary = atob(base64);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type });
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
      const MAX_SIZE = 1024;
      const img = new Image();
      const processImg = (imageElement: HTMLImageElement) => {
        let w = imageElement.naturalWidth;
        let h = imageElement.naturalHeight;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) { h = (h / w) * MAX_SIZE; w = MAX_SIZE; } else { w = (w / h) * MAX_SIZE; h = MAX_SIZE; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("画布初始化失败"));
        ctx.drawImage(imageElement, 0, 0, w, h);
        resolve({ base64Data: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], mimeType: 'image/jpeg', width: w, height: h });
      };
      const handleBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        img.onload = () => { processImg(img); URL.revokeObjectURL(url); };
        img.onerror = reject;
        img.src = url;
      };
      if (typeof source === 'string') fetch(source).then(r => r.blob()).then(handleBlob).catch(reject);
      else handleBlob(source);
    });
  }
}
