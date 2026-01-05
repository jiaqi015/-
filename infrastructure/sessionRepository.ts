
import { IDevelopSessionRepository } from '../application/ports';
import { DevelopSession } from '../domain/types';

export class LocalSessionRepository implements IDevelopSessionRepository {
  private readonly DB_NAME = 'LeifiLabDB';
  private readonly STORE_NAME = 'sessions';
  private readonly DB_VERSION = 1;
  private readonly MAX_RECORDS = 20;

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
    
    return new Promise((resolve, reject) => {
      // 开启读写事务，保证原子性
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      // 利用 count() 检查总量，避免 getAll() 的内存开销
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        if (countRequest.result >= this.MAX_RECORDS) {
          // 如果超过限制，使用游标定位最旧的一条记录（假设写入顺序即时间顺序，或手动排序）
          // 注意：此处索引缺失时默认按 key 排序，对于 sessionId 时间戳前缀有效
          const cursorRequest = store.openCursor();
          let deleted = false;
          cursorRequest.onsuccess = (e: any) => {
            const cursor = e.target.result;
            if (cursor && !deleted) {
              cursor.delete();
              deleted = true;
              // 删除后继续插入
              store.put(session);
            }
          };
        } else {
          store.put(session);
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
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
