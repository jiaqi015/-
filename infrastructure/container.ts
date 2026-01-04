
import { DevelopPhotoUseCase, CameraCatalogUseCase } from '../application/useCases';
import { GeminiImageProcessor } from './imageProcessor';
import { AlibabaImageProcessor } from './alibabaImageProcessor';
import { StaticCameraCatalog } from './cameraCatalog';
import { LocalDownloadService } from './downloadService';
import { LocalSessionRepository } from './sessionRepository';
import { IImageProcessor, WorkflowStep } from '../application/ports';
import { CameraProfile, DevelopMode, DevelopResult, EngineProvider } from '../domain/types';

// 策略模式包装器
class MultiEngineProcessor implements IImageProcessor {
  private engines: Record<EngineProvider, IImageProcessor>;
  public currentEngine: EngineProvider = 'ALIBABA'; // 默认阿里

  constructor(gemini: IImageProcessor, alibaba: IImageProcessor) {
    this.engines = { 'GOOGLE': gemini, 'ALIBABA': alibaba };
  }

  async process(imageSource: string | File, profile: CameraProfile, intensity: number, mode: DevelopMode, onProgress?: (step: WorkflowStep) => void): Promise<DevelopResult> {
    return this.engines[this.currentEngine].process(imageSource, profile, intensity, mode, onProgress);
  }

  setEngine(engine: EngineProvider) {
    this.currentEngine = engine;
  }
}

const geminiProcessor = new GeminiImageProcessor();
const alibabaProcessor = new AlibabaImageProcessor();
const multiProcessor = new MultiEngineProcessor(geminiProcessor, alibabaProcessor);

const cameraCatalog = new StaticCameraCatalog();
const downloadService = new LocalDownloadService();
const sessionRepo = new LocalSessionRepository();

export const developPhotoUseCase = new DevelopPhotoUseCase(multiProcessor, cameraCatalog, sessionRepo);
export const cameraCatalogUseCase = new CameraCatalogUseCase(cameraCatalog);
export const downloadAppService = downloadService;
export const engineController = multiProcessor;
