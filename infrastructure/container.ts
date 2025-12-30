
import { DevelopPhotoUseCase, CameraCatalogUseCase } from '../application/useCases';
import { GeminiImageProcessor } from './imageProcessor';
import { StaticCameraCatalog } from './cameraCatalog';
import { LocalDownloadService } from './downloadService';
import { LocalSessionRepository } from './sessionRepository';

// 基础设施实例化
const imageProcessor = new GeminiImageProcessor();
const cameraCatalog = new StaticCameraCatalog();
const downloadService = new LocalDownloadService();
const sessionRepo = new LocalSessionRepository();

// 应用层用例组装 (Assembly)
export const developPhotoUseCase = new DevelopPhotoUseCase(imageProcessor, cameraCatalog, sessionRepo);
export const cameraCatalogUseCase = new CameraCatalogUseCase(cameraCatalog);
export const downloadAppService = downloadService;
