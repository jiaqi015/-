
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopResult, DevelopMode, GroundingSource } from '../domain/types';
import { KnowledgeRetrievalService } from './knowledgeBase';
import { EnvService } from './envService';

export class AlibabaImageProcessor implements IImageProcessor {
  private readonly rawBaseUrl = 'https://dashscope.aliyuncs.com/api/v1';

  /**
   * 智能 URL 处理：支持路径和绝对 URL 的代理注入
   */
  private getRequestUrl(target: string): string {
    const proxy = EnvService.getCorsProxy();
    // 如果 target 是以 / 开头的路径，先拼接完整阿里 API 地址
    const fullTarget = target.startsWith('http') ? target : `${this.rawBaseUrl}${target}`;
    
    if (proxy) {
      // 确保代理前缀正确拼接
      const separator = proxy.endsWith('/') ? '' : '/';
      return `${proxy}${separator}${fullTarget}`;
    }
    return fullTarget;
  }

  private async safeFetch(path: string, options: RequestInit) {
    const url = this.getRequestUrl(path);
    try {
      const response = await fetch(url, options);
      if (response.status === 401) throw new Error("API Key 验证失败，请检查设置。");
      return response;
    } catch (e: any) {
      if (e.name === 'TypeError' || e.message.includes('fetch')) {
        throw new Error("跨域拦截 (CORS)：阿里 API 拒绝了浏览器的直接访问。请点击右上角[设置]配置 CORS 代理服务器（如：https://cors-anywhere.herokuapp.com/），或切换至 Gemini 引擎。");
      }
      throw e;
    }
  }

  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number,
    mode: DevelopMode,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    const apiKey = EnvService.getAlibabaApiKey();
    if (!apiKey) throw new Error("请先在[设置]中配置 ALIBABA_API_KEY。");

    const img = await this.getOptimizedImageData(imageSource, 1536);
    
    return mode === 'AGENTIC' 
      ? this.executeAgenticWorkflow(apiKey, img, profile, intensity, onProgress)
      : this.executeAigcWorkflow(apiKey, img, profile, intensity, onProgress);
  }

  private async executeAigcWorkflow(apiKey: string, img: any, profile: CameraProfile, intensity: number, onProgress?: any): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const context = KnowledgeRetrievalService.retrieve([profile.name, 'photography']);
    
    onProgress?.('NEURAL_DEVELOPING');
    const prompt = `【Leifi Lab】强度 ${intensity}。风格：${profile.promptTemplate}。背景：${context}`;
    const taskId = await this.submitWanxTask(apiKey, img.base64Data, prompt, intensity);
    const outputUrl = await this.pollTask(apiKey, taskId, onProgress);
    
    return this.assembleResult(outputUrl, profile, intensity, 'DIRECT', prompt, img.width, img.height);
  }

  private async executeAgenticWorkflow(apiKey: string, img: any, profile: CameraProfile, intensity: number, onProgress?: any): Promise<DevelopResult> {
    onProgress?.('ANALYZING_OPTICS');
    const auditRes = await this.callQwen(apiKey, `分析这张照片的光学特征并给出重构建议。`, false);
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const searchRes = await this.callQwen(apiKey, `检索 ${profile.name} 相机的发色与光学特性。`, true);
    
    onProgress?.('NEURAL_DEVELOPING');
    const masterPrompt = `【大师显影报告】\n审计：${auditRes.text}\n参考：${searchRes.text}\n指令：以 ${intensity} 强度重塑 ${profile.name}。`;
    const taskId = await this.submitWanxTask(apiKey, img.base64Data, masterPrompt, intensity);
    const outputUrl = await this.pollTask(apiKey, taskId, onProgress);

    return this.assembleResult(outputUrl, profile, intensity, 'AGENTIC', masterPrompt, img.width, img.height, searchRes.sources);
  }

  private async callQwen(apiKey: string, prompt: string, search: boolean): Promise<{ text: string, sources: GroundingSource[] }> {
    const response = await this.safeFetch(`/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen-max',
        input: { messages: [{ role: 'user', content: prompt }] },
        parameters: { enable_search: search, result_format: 'message' }
      })
    });
    const data = await response.json();
    const message = data.output?.choices?.[0]?.message;
    const sources: GroundingSource[] = [];
    if (message?.extra?.search_info) {
      message.extra.search_info.forEach((s: any) => sources.push({ title: s.title, uri: s.url }));
    }
    return { text: message?.content || "", sources };
  }

  private async submitWanxTask(apiKey: string, base64: string, prompt: string, intensity: number): Promise<string> {
    const response = await this.safeFetch(`/services/aigc/image-generation/generation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' },
      body: JSON.stringify({
        model: 'wanx-v2',
        input: { prompt, ref_image_url: `data:image/jpeg;base64,${base64}` },
        parameters: { style: '<auto>', size: '1024*1024', n: 1, ref_strength: intensity }
      })
    });
    const data = await response.json();
    if (!data.output?.task_id) throw new Error(data.message || "万相引擎启动失败");
    return data.output.task_id;
  }

  private async pollTask(apiKey: string, taskId: string, onProgress?: any): Promise<string> {
    let attempts = 0;
    while (attempts < 60) {
      const response = await this.safeFetch(`/tasks/${taskId}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      const data = await response.json();
      const status = data.output?.task_status;
      if (status === 'SUCCEEDED') return data.output.results[0].url;
      if (status === 'FAILED') throw new Error(data.output.message || "图像生成失败");
      await new Promise(r => setTimeout(r, 2500));
      attempts++;
    }
    throw new Error("显影任务超时");
  }

  private async assembleResult(url: string, profile: CameraProfile, intensity: number, mode: DevelopMode, promptUsed: string, width: number, height: number, sources?: GroundingSource[]): Promise<DevelopResult> {
    // 关键修复：结果图下载 URL 也必须经过代理，否则会触发 CORS 报错
    const proxiedUrl = this.getRequestUrl(url);
    const resp = await fetch(proxiedUrl);
    const blob = await resp.blob();
    const base64 = await new Promise<string>(r => {
      const reader = new FileReader();
      reader.onloadend = () => r(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return {
      session: {
        sessionId: `sess_ali_${Math.random().toString(36).substring(2, 10)}`,
        cameraId: profile.id,
        cameraName: profile.name,
        createdAt: new Date(),
        engine: 'ALIBABA',
        outputMeta: { width, height, intensity, mode, promptUsed, sources },
        outputUrl: base64
      },
      blob
    };
  }

  private async getOptimizedImageData(source: string | File, targetSize: number): Promise<any> {
    return new Promise(r => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        r({ base64Data: canvas.toDataURL('image/jpeg', 0.9).split(',')[1], width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
    });
  }
}
