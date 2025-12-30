
/**
 * 环境变量管理服务
 * 负责从构建环境中提取已注入的 API 密钥
 */
export class EnvService {
  /**
   * 获取当前有效的 API Key
   * 密钥已通过 Vite define 在编译时注入到 process.env.API_KEY
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
