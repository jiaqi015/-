/**
 * 环境变量管理服务
 */
export class EnvService {
  /**
   * 获取当前有效的 API Key
   */
  static getApiKey(): string {
    return process.env.API_KEY || "";
  }

  /**
   * 检查密钥有效性
   */
  static hasValidKey(): boolean {
    const key = this.getApiKey();
    return typeof key === 'string' && key.length > 20;
  }
}