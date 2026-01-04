
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopResult, DevelopMode, GroundingSource, EngineProvider } from '../domain/types';
import { KnowledgeRetrievalService } from './knowledgeBase';

export class AlibabaImageProcessor implements IImageProcessor {
  private readonly baseUrl = 'https://dashscope.aliyuncs.com/api/v1';

  async process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number,
    mode: DevelopMode,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    const apiKey = process.env.ALIBABA_API_KEY;
    if (!apiKey) throw new Error("未检测到 ALIBABA_API_KEY，请在环境变量中配置。");

    const img = await this.getOptimizedImageData(imageSource, 1536);
    
    return mode === 'AGENTIC' 
      ? this.executeAgenticWorkflow(apiKey, img, profile, intensity, onProgress)
      : this.executeAigcWorkflow(apiKey, img, profile, intensity, onProgress);
  }

  private async executeAigcWorkflow(
    apiKey: string,
    img: any,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const localContext = KnowledgeRetrievalService.retrieve([profile.name, 'photography', profile.category]);
    
    onProgress?.('NEURAL_DEVELOPING');
    const prompt = `【Leifi Lab Alibaba Quick Dev】以强度 ${intensity} 重构影像。风格要求：${profile.promptTemplate}。背景参考：${localContext}`;

    const taskId = await this.submitWanxTask(apiKey, img.base64Data, prompt, intensity);
    const outputUrl = await this.pollTask(apiKey, taskId, onProgress);
    
    return this.assembleResult(outputUrl, profile, intensity, 'DIRECT', prompt, img.width, img.height);
  }

  private async executeAgenticWorkflow(
    apiKey: string,
    img: any,
    profile: CameraProfile,
    intensity: number,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    // 1. 视觉分析 (Qwen-VL 逻辑简化为 Qwen-Max 描述增强)
    onProgress?.('ANALYZING_OPTICS');
    const auditPrompt = `作为顶级摄影专家，基于 ${profile.name} 的光学特性，请分析一张照片并给出重构建议。`;
    const auditResponse = await this.callQwen(apiKey, auditPrompt, false);
    const visualAudit = auditResponse.text;

    // 2. 联网搜索 (Qwen-Max with Search)
    onProgress?.('RETRIEVING_KNOWLEDGE');
    const searchPrompt = `检索关于 ${profile.name} 的物理色彩特性与最新光学评测。`;
    const searchResponse = await this.callQwen(apiKey, searchPrompt, true);
    
    onProgress?.('NEURAL_DEVELOPING');
    const masterPrompt = `【大师显影报告】\n审计：${visualAudit}\n实时数据：${searchResponse.text}\n指令：以 ${intensity} 强度重塑 ${profile.name} 质感。`;

    const taskId = await this.submitWanxTask(apiKey, img.base64Data, masterPrompt, intensity);
    const outputUrl = await this.pollTask(apiKey, taskId, onProgress);

    return this.assembleResult(outputUrl, profile, intensity, 'AGENTIC', masterPrompt, img.width, img.height, searchResponse.sources);
  }

  // --- 通讯基础设施 ---

  private async callQwen(apiKey: string, prompt: string, search: boolean): Promise<{ text: string, sources: GroundingSource[] }> {
    const model = process.env.ALIBABA_QWEN_MODEL || 'qwen-max';
    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-DashScope-SSE': 'disable' },
      body: JSON.stringify({
        model,
        input: { messages: [{ role: 'user', content: prompt }] },
        parameters: { enable_search: search, result_format: 'message' }
      })
    });
    const data = await response.json();
    const text = data.output?.choices?.[0]?.message?.content || "";
    const sources: GroundingSource[] = [];
    
    // 适配阿里搜索返回格式
    if (data.output?.choices?.[0]?.message?.extra?.search_info) {
      const info = data.output.choices[0].message.extra.search_info;
      info.forEach((s: any) => sources.push({ title: s.title, uri: s.url }));
    }
    return { text, sources };
  }

  private async submitWanxTask(apiKey: string, base64: string, prompt: string, intensity: number): Promise<string> {
    const model = process.env.ALIBABA_WANX_MODEL || 'wanx-v2';
    const response = await fetch(`${this.baseUrl}/services/aigc/image-generation/generation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' },
      body: JSON.stringify({
        model,
        input: { prompt, ref_image_url: `data:image/jpeg;base64,${base64}` },
        parameters: { style: '<auto>', size: '1024*1024', n: 1, ref_strength: intensity }
      })
    });
    const data = await response.json();
    if (!data.output?.task_id) throw new Error("百炼任务提交失败: " + JSON.stringify(data));
    return data.output.task_id;
  }

  private async pollTask(apiKey: string, taskId: string, onProgress?: any): Promise<string> {
    let attempts = 0;
    while (attempts < 60) {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const data = await response.json();
      const status = data.output?.task_status;

      if (status === 'SUCCEEDED') return data.output.results[0].url;
      if (status === 'FAILED') throw new Error("显影失败: " + data.output.message);
      
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }
    throw new Error("显影超时。");
  }

  private async assembleResult(url: string, profile: CameraProfile, intensity: number, mode: DevelopMode, promptUsed: string, width: number, height: number, sources?: GroundingSource[]): Promise<DevelopResult> {
    // 核心步骤：将 URL 转换为 Base64，确保历史记录持久化
    const resp = await fetch(url);
    const blob = await resp.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
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
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const data = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        resolve({ base64Data: data, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = typeof source === 'string' ? source : URL.createObjectURL(source);
    });
  }
}
