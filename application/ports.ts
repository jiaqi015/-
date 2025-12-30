
import { CameraProfile, DevelopResult, DevelopSession } from '../domain/types';

export interface IImageProcessor {
  process(
    imageSource: string | File,
    profile: CameraProfile,
    intensity: number
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
