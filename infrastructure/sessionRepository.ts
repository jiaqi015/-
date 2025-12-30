
import { IDevelopSessionRepository } from '../application/ports';
import { DevelopSession } from '../domain/types';
import { put, list } from "@vercel/blob";

/**
 * 混合动力底片仓库
 * 优先使用 Vercel Blob 云端同步，若无 Token 则自动降级至本地 localStorage
 */
export class VercelBlobSessionRepository implements IDevelopSessionRepository {
  private readonly PREFIX = 'leifi-lab/sessions/';
  private readonly LOCAL_KEY = 'leifi_local_sessions';
  
  private getToken(): string | undefined {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    return (token && token.length > 0) ? token : undefined;
  }

  async save(session: DevelopSession): Promise<void> {
    const token = this.getToken();
    
    // 无论是否有云端 Token，都先同步一份到本地 localStorage 备份
    this.saveToLocal(session);

    if (token) {
      try {
        const sessionData = JSON.stringify({
          ...session,
          createdAt: session.createdAt.toISOString()
        });

        await put(`${this.PREFIX}${session.sessionId}.json`, sessionData, {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
          token: token
        });
        console.log('底片已同步至全球画廊');
      } catch (error) {
        console.warn('云端同步暂时失效:', error);
      }
    }
  }

  async getById(id: string): Promise<DevelopSession | undefined> {
    const token = this.getToken();
    
    // 优先从本地找，速度最快
    const local = this.getFromLocal().find(s => s.sessionId === id);
    if (local) return local;

    if (token) {
      try {
        const { blobs } = await list({
          prefix: `${this.PREFIX}${id}.json`,
          token: token
        });
        if (blobs.length > 0) {
          const response = await fetch(blobs[0].url);
          const data = await response.json();
          return { ...data, createdAt: new Date(data.createdAt) };
        }
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  async getAll(): Promise<DevelopSession[]> {
    const token = this.getToken();
    let sessions: DevelopSession[] = this.getFromLocal();

    if (token) {
      try {
        const { blobs } = await list({
          prefix: this.PREFIX,
          token: token
        });

        const cloudSessions = await Promise.all(
          blobs.filter(b => b.pathname.endsWith('.json'))
            .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
            .slice(0, 20)
            .map(async (blob) => {
              try {
                const res = await fetch(blob.url);
                const data = await res.json();
                return { ...data, createdAt: new Date(data.createdAt) } as DevelopSession;
              } catch { return null; }
            })
        );

        const validCloud = cloudSessions.filter((s): s is DevelopSession => s !== null);
        
        // 合并去重
        const sessionMap = new Map<string, DevelopSession>();
        [...sessions, ...validCloud].forEach(s => sessionMap.set(s.sessionId, s));
        sessions = Array.from(sessionMap.values());
      } catch (error) {
        console.warn('无法拉取云端记录，仅显示本地历史');
      }
    }

    return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private saveToLocal(session: DevelopSession) {
    const sessions = this.getFromLocal();
    const index = sessions.findIndex(s => s.sessionId === session.sessionId);
    if (index > -1) sessions[index] = session;
    else sessions.unshift(session);
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(sessions.slice(0, 50)));
  }

  private getFromLocal(): DevelopSession[] {
    try {
      const data = localStorage.getItem(this.LOCAL_KEY);
      if (!data) return [];
      return JSON.parse(data).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    } catch { return []; }
  }
}
