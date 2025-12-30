import { IImageProcessor } from '../application/ports';
import { CameraProfile, DevelopResult } from '../domain/types';
import { GoogleGenAI } from "@google/genai";

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

class PromptComposer {
  static compose(profile: CameraProfile, intensity: number): string {
    const { recipe, name } = profile;
    let prompt = `[CRITICAL DIRECTIVE: NEURAL OPTICAL RECONSTRUCTION - PROJECT ${name}]\n`;
    prompt += `PRIMARY ENGINE: ARTISTIC SYNTHESIS AT ${Math.round(intensity * 100)}% INTENSITY.\n\n`;
    prompt += `CORE MANIFESTO:\n${profile.promptTemplate.trim()}\n\n`;
    prompt += `HARDWARE SPECIFICATIONS:\n`;
    prompt += `- EMULATED LIGHT PATH: ${recipe.exposure > 0 ? 'Overexposed' : 'Underexposed'} by ${Math.abs(recipe.exposure)} stops.\n`;
    prompt += `- SIGNAL NOISE: ${recipe.grainAmount > 20 ? 'High grain' : 'Low noise'}.\n`;
    if (recipe.grayscale) prompt += `4. MONOCHROMATIC DOMAIN\n`;
    return prompt;
  }
}

export class GeminiImageProcessor implements IImageProcessor {
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number
  ): Promise<DevelopResult> {
    // 关键：每次处理请求时创建新实例，确保使用最新的 process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

      if (!outputBase64) throw new Error("MODEL_EMPTY_RESPONSE");

      return {
        session: {
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          cameraId: profile.id,
          cameraName: profile.name,
          createdAt: new Date(),
          outputMeta: { width, height, intensity, promptUsed: fullPrompt },
          outputUrl: `data:image/png;base64,${outputBase64}`
        },
        blob: new Blob([new Uint8Array(atob(outputBase64).split('').map(c => c.charCodeAt(0)))], { type: 'image/png' })
      };
    } catch (error: any) {
      // 捕获 API 报错并规范化，便于前端 UI 提示重选 Key
      console.error("Gemini API Error:", error);
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
      const MAX_SIZE = 1536; 
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
        if (!ctx) return reject(new Error("Canvas failed"));
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