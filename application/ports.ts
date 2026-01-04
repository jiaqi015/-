
import { CameraProfile, DevelopResult, DevelopSession, DevelopMode } from '../domain/types';

export type WorkflowStep = 
  | 'ANALYZING_OPTICS'    // 视觉分析官：分析原图特征
  | 'RETRIEVING_KNOWLEDGE' // RAG 引擎：检索摄影百科
  | 'NEURAL_DEVELOPING'   // 神经显影师：像素重构渲染
  | 'QUALITY_CHECKING';   // 质量检查官：色彩与质感校准

export interface IImageProcessor {
  process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number,
    mode: DevelopMode,
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult>;
}

export interface ICameraCatalog {
  getAllProfiles(): CameraProfile[];
  getProfileById(id: string): CameraProfile | undefined;
}

export interface IDevelopSessionRepository {
  save(session: DevelopSession): Promise<void>;
  getById(id: string): Promise<DevelopSession | undefined>;
  getAll(): Promise<DevelopSession[]>;
}

export interface IDownloadService {
  downloadImage(url: string, filename: string): void;
}
