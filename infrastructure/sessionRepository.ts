
import { IDevelopSessionRepository } from '../application/ports';
import { DevelopSession } from '../domain/types';

/**
 * 稳健型底片仓库 v2.0
 * 策略：本地索引 + 云端影像
 * 解决客户端调用 Vercel Blob list() 产生的 CORS 报错
 */
export class VercelBlobSessionRepository implements IDevelopSessionRepository {
  private readonly LOCAL_KEY = 'leifi_v2_sessions';

  async save(session: DevelopSession): Promise<void> {
    // 始终保存到本地索引，确保即时可用
    this.saveToLocal(session);
    console.log('底片索引已更新');
  }

  async getById(id: string): Promise<DevelopSession | undefined> {
    const sessions = this.getFromLocal();
    return sessions.find(s => s.sessionId === id);
  }

  async getAll(): Promise<DevelopSession[]> {
    // 仅从本地索引读取，避开云端 list() 的跨域限制和高延迟
    return this.getFromLocal().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private saveToLocal(session: DevelopSession) {
    try {
      const sessions = this.getFromLocal();
      const index = sessions.findIndex(s => s.sessionId === session.sessionId);
      
      const sessionToSave = {
        ...session,
        createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt
      };

      if (index > -1) {
        sessions[index] = sessionToSave as any;
      } else {
        sessions.unshift(sessionToSave as any);
      }
      
      // 仅保留最近 30 条记录，防止 LocalStorage 溢出
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify(sessions.slice(0, 30)));
    } catch (e) {
      console.error('本地索引保存失败:', e);
    }
  }

  private getFromLocal(): DevelopSession[] {
    try {
      const data = localStorage.getItem(this.LOCAL_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt)
      }));
    } catch (e) {
      console.warn('解析本地索引失败，已重置');
      return [];
    }
  }
}
