
import { IImageProcessor, ICameraCatalog, IDevelopSessionRepository } from './ports';
import { DevelopResult, CameraProfile } from '../domain/types';

export class DevelopPhotoUseCase {
  constructor(
    private imageProcessor: IImageProcessor,
    private cameraCatalog: ICameraCatalog,
    private sessionRepo: IDevelopSessionRepository
  ) {}

  async execute(
    imageSource: string | File,
    cameraId: string,
    intensity: number = 1.0
  ): Promise<DevelopResult> {
    const profile = this.cameraCatalog.getProfileById(cameraId);
    if (!profile) throw new Error('Camera profile not found');
    
    const result = await this.imageProcessor.process(imageSource, profile, intensity);
    
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
