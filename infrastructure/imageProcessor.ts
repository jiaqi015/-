import { IImageProcessor } from '../application/ports';
import { CameraProfile, DevelopResult } from '../domain/types';
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";

type SupportedAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

class PromptComposer {
  static compose(profile: CameraProfile, intensity: number): string {
    const { recipe, name } = profile;
    return `[核心指令：神经光学重构 - 项目 ${name}]
主引擎：艺术合成，显影强度 ${Math.round(intensity * 100)}%。

核心章程：
${profile.promptTemplate.trim()}

硬件规格补充说明：
- 模拟光路：${recipe.exposure > 0 ? '过曝' : '欠曝'} ${Math.abs(recipe.exposure)} 档。
- 信号噪点控制：${recipe.grainAmount > 20 ? '高物理颗粒感' : '低噪点控制'}。
${recipe.grayscale ? '- 单色域映射：完全去除饱和度，执行高动态灰度显影。' : ''}
`;
  }
}

export class GeminiImageProcessor implements IImageProcessor {
  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number
  ): Promise<DevelopResult> {
    // 统一从环境变量读取，Vite define 会在构建时替换
    const apiKey = process.env.API_KEY;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!apiKey || apiKey.length < 5) {
      throw new Error("缺少显影密钥 (API_KEY)。请在设置中配置有效的密钥以激活神经显影引擎。");
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
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content.parts) throw new Error("显影引擎未能生成有效的影像数据");

      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          outputBase64 = part.inlineData.data;
          break;
        }
      }

      if (!outputBase64) throw new Error("显影输出为空，请检查原始影像格式或 API 配额");

      const sessionId = `sess_${Math.random().toString(36).substring(2, 11)}`;
      const imageBlob = this.base64ToBlob(outputBase64, 'image/png');
      
      let finalUrl = '';

      // 云端存储策略优化
      if (blobToken && blobToken.length > 10) {
        try {
          const { url: cloudUrl } = await put(`leifi-lab/outputs/${sessionId}.png`, imageBlob, {
            access: 'public',
            token: blobToken
          });
          finalUrl = cloudUrl;
        } catch (uploadError) {
          console.warn('云端同步失败，降级至本地缓存:', uploadError);
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
      console.error("Gemini 显影异常:", error);
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
      const MAX_SIZE = 1280; // 提升显影输入分辨率上限
      const img = new Image();
      
      const processImg = (imageElement: HTMLImageElement) => {
        let w = imageElement.naturalWidth;
        let h = imageElement.naturalHeight;
        
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) { h = (h / w) * MAX_SIZE; w = MAX_SIZE; } 
          else { w = (w / h) * MAX_SIZE; h = MAX_SIZE; }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("显影系统无法初始化图形上下文"));
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imageElement, 0, 0, w, h);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve({ 
          base64Data: dataUrl.split(',')[1], 
          mimeType: 'image/jpeg', 
          width: w, 
          height: h 
        });
      };

      const handleBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        img.onload = () => { 
          processImg(img); 
          URL.revokeObjectURL(url); 
        };
        img.onerror = () => reject(new Error("影像文件读取失败"));
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