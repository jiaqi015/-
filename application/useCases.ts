
import { IImageProcessor, ICameraCatalog, IDevelopSessionRepository, WorkflowStep } from './ports';
import { DevelopResult, CameraProfile, DevelopMode } from '../domain/types';

export class DevelopPhotoUseCase {
  constructor(
    private imageProcessor: IImageProcessor,
    private cameraCatalog: ICameraCatalog,
    private sessionRepo: IDevelopSessionRepository
  ) {}

  async execute(
    imageSource: string | File,
    cameraId: string,
    intensity: number = 1.0,
    mode: DevelopMode = 'DIRECT',
    onProgress?: (step: WorkflowStep) => void
  ): Promise<DevelopResult> {
    const profile = this.cameraCatalog.getProfileById(cameraId);
    if (!profile) throw new Error('Camera profile not found');
    
    const result = await this.imageProcessor.process(imageSource, profile, intensity, mode, onProgress);
    
    // DDD: 持久化 Session 实体
    await this.sessionRepo.save(result.session);
    
    return result;
  }
}

export class CameraCatalogUseCase {
  constructor(private catalog: ICameraCatalog) {}
  
  getProfiles(): CameraProfile[] {
    return this.catalog.getAllProfiles();
  }
}
