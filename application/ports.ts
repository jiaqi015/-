
import { CameraProfile, DevelopResult, DevelopSession, DevelopMode, EngineProvider } from '../domain/types';

export type WorkflowStep = 
  | 'ANALYZING_OPTICS'    
  | 'RETRIEVING_KNOWLEDGE' 
  | 'NEURAL_DEVELOPING'   
  | 'QUALITY_CHECKING';   

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
