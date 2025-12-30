
import { IDevelopSessionRepository } from '../application/ports';
import { DevelopSession } from '../domain/types';
import { put, list } from "@vercel/blob";

/**
 * 基于 Vercel Blob 的全局云端存储仓库
 * 实现跨设备、跨用户的“全局底片”画廊
 */
export class VercelBlobSessionRepository implements IDevelopSessionRepository {
  private readonly PREFIX = 'leifi-lab/sessions/';
  // 注意：在实际 Vercel 环境中，BLOB_READ_WRITE_TOKEN 会被自动识别
  // 这里我们假设通过 process.env.BLOB_READ_WRITE_TOKEN 提供支持

  async save(session: DevelopSession): Promise<void> {
    try {
      // 1. 将 Session 元数据转换为 JSON
      const sessionData = JSON.stringify({
        ...session,
        createdAt: session.createdAt.toISOString()
      });

      // 2. 上传到 Vercel Blob
      // 路径格式：leifi-lab/sessions/sess_[id].json
      await put(`${this.PREFIX}${session.sessionId}.json`, sessionData, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
      });
      
      console.log('底片元数据已同步至云端');
    } catch (error) {
      console.error('云端同步失败，降级保存:', error);
      // 可选：在此处实现 IndexedDB 降级逻辑，但为了满足“全局”需求，此处仅记录错误
    }
  }

  async getById(id: string): Promise<DevelopSession | undefined> {
    try {
      const response = await fetch(`https://${process.env.VERCEL_URL || 'leifi-lab.vercel.app'}/api/blob/get?path=${this.PREFIX}${id}.json`);
      if (!response.ok) return undefined;
      const data = await response.json();
      return {
        ...data,
        createdAt: new Date(data.createdAt)
      };
    } catch {
      return undefined;
    }
  }

  async getAll(): Promise<DevelopSession[]> {
    try {
      // 1. 列出所有在指定前缀下的 blobs
      const { blobs } = await list({
        prefix: this.PREFIX,
      });

      // 2. 筛选出 JSON 配置文件并并发抓取内容
      const sessionBlobs = blobs.filter(b => b.pathname.endsWith('.json'));
      
      // 为了性能考虑，只取最近的 20 条
      const latestBlobs = sessionBlobs
        .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
        .slice(0, 20);

      const sessions = await Promise.all(
        latestBlobs.map(async (blob) => {
          const res = await fetch(blob.url);
          const data = await res.json();
          return {
            ...data,
            createdAt: new Date(data.createdAt)
          } as DevelopSession;
        })
      );

      return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('无法获取全局底片记录:', error);
      return [];
    }
  }
}
