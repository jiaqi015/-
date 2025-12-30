
import { ICameraCatalog } from '../application/ports';
import { CameraProfile } from '../domain/types';
import { CAMERA_PROFILES } from './resources/cameras';

export class StaticCameraCatalog implements ICameraCatalog {
  getAllProfiles(): CameraProfile[] {
    return CAMERA_PROFILES;
  }

  getProfileById(id: string): CameraProfile | undefined {
    return CAMERA_PROFILES.find(p => p.id === id);
  }
}
