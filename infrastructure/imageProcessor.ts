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

    prompt += `HARDWARE SPECIFICATIONS FOR SYNTHESIS:\n`;
    prompt += `- EMULATED LIGHT PATH: ${recipe.exposure > 0 ? 'Overexposed by' : 'Underexposed by'} ${Math.abs(recipe.exposure)} stops.\n`;
    prompt += `- SIGNAL NOISE RATIO: ${recipe.grainAmount > 20 ? 'High-energy organic grain matrix' : 'Low-noise laboratory signal'}.\n`;
    prompt += `- CHROMATIC SATURATION: ${recipe.saturation > 20 ? 'Deep spectral saturation' : 'Desaturated cinematic palette'}.\n`;
    
    prompt += `\nOPERATIONAL RULES:\n`;
    prompt += `1. ABSOLUTE GEOMETRIC FIDELITY: Do not alter coordinates of any objects, people, or architecture.\n`;
    prompt += `2. NO HALOS: Avoid artificial sharpening artifacts. Sharpness must come from emulated lens resolving power.\n`;
    prompt += `3. DYNAMIC RANGE: Map the input luminosity to the target ${name} characteristic curve.\n`;
    
    if (recipe.grayscale) {
      prompt += `4. MONOCHROMATIC DOMAIN: Discard all color data. Maximize the 14-bit grayscale tonal separation.\n`;
    }

    return prompt;
  }
}

export class GeminiImageProcessor implements IImageProcessor {
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number
  ): Promise<DevelopResult> {
    // 严格遵循指令：API Key 从 process.env.API_KEY 获取
    // 通过 vite.config.mjs 的 define 确保这里的引用在运行时是动态的
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "") {
      console.error("Runtime API Key is missing. Ensure Key Selector has been confirmed.");
      throw new Error("API_KEY_MISSING");
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
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: fullPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio, 
            imageSize: "2K" 
          }
        }
      });

      let outputBase64 = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            outputBase64 = part.inlineData.data;
            break;
          }
        }
      }

      if (!outputBase64) {
        throw new Error("MODEL_EMPTY_RESPONSE");
      }

      const outputUrl = `data:image/png;base64,${outputBase64}`;

      return {
        session: {
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          cameraId: profile.id,
          cameraName: profile.name,
          createdAt: new Date(),
          outputMeta: {
            width: width,
            height: height,
            intensity: intensity,
            promptUsed: fullPrompt
          },
          outputUrl
        },
        blob: new Blob([new Uint8Array(atob(outputBase64).split('').map(c => c.charCodeAt(0)))], { type: 'image/png' })
      };
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_INVALID");
      }
      throw error;
    }
  }

  private getClosestAspectRatio(w: number, h: number): SupportedAspectRatio {
    const ratio = w / h;
    const candidates: { ratio: number; value: SupportedAspectRatio }[] = [
      { ratio: 1, value: "1:1" },
      { ratio: 3/4, value: "3:4" },
      { ratio: 4/3, value: "4:3" },
      { ratio: 9/16, value: "9:16" },
      { ratio: 16/9, value: "16:9" }
    ];

    return candidates.reduce((prev, curr) => 
      Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev
    ).value;
  }

  private async getOptimizedImageData(source: string | File): Promise<{ base64Data: string; mimeType: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const MAX_SIZE = 1536; 
      const img = new Image();
      
      const processImg = (imageElement: HTMLImageElement, mimeType: string) => {
        let w = imageElement.naturalWidth;
        let h = imageElement.naturalHeight;

        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) {
            h = (h / w) * MAX_SIZE;
            w = MAX_SIZE;
          } else {
            w = (w / h) * MAX_SIZE;
            h = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context failed"));
        
        ctx.drawImage(imageElement, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); 
        const base64 = dataUrl.split(',')[1];
        
        resolve({
          base64Data: base64,
          mimeType: 'image/jpeg',
          width: w,
          height: h
        });
      };

      const handleBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          processImg(img, blob.type);
          URL.revokeObjectURL(url);
        };
        img.onerror = reject;
        img.src = url;
      };

      if (typeof source === 'string') {
        fetch(source).then(r => r.blob()).then(handleBlob).catch(reject);
      } else {
        handleBlob(source);
      }
    });
  }
}