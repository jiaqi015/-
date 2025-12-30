
import { IDevelopSessionRepository } from '../application/ports';
import { DevelopSession } from '../domain/types';

export class LocalSessionRepository implements IDevelopSessionRepository {
  private readonly DB_NAME = 'LeifiLabDB';
  private readonly STORE_NAME = 'sessions';
  private readonly DB_VERSION = 1;

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'sessionId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(session: DevelopSession): Promise<void> {
    const db = await this.getDB();
    
    // 1. 先进行历史记录清理逻辑（独立于保存事务之外）
    const all = await this.getAll();
    if (all.length >= 20) {
      const sorted = [...all].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const oldest = sorted[0];
      await this.delete(oldest.sessionId);
    }

    // 2. 此时所有异步前置工作已完成，启动正式的保存事务
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const request = store.put(session);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      
      // 监听事务整体状态以防万一
      transaction.onerror = () => reject(new Error('IndexedDB Transaction Error'));
    });
  }

  private async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getById(id: string): Promise<DevelopSession | undefined> {
    const db = await this.getDB();
    const transaction = db.transaction(this.STORE_NAME, 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<DevelopSession[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []) as DevelopSession[];
        resolve(results.map(s => ({
          ...s,
          createdAt: s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt)
        })));
      };
      request.onerror = () => reject(request.error);
    });
  }
}
