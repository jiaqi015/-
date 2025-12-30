
import { IDownloadService } from '../application/ports';

export class LocalDownloadService implements IDownloadService {
  downloadImage(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
