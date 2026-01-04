
/**
 * 环境变量管理服务
 */
export class EnvService {
  /**
   * 获取 Google Gemini API Key
   */
  static getGoogleApiKey(): string {
    return process.env.API_KEY || "";
  }

  /**
   * 获取 Alibaba DashScope API Key
   */
  static getAlibabaApiKey(): string {
    return process.env.ALIBABA_API_KEY || "";
  }

  /**
   * 检查是否有任何有效密钥可用
   */
  static hasAnyValidKey(): boolean {
    const googleKey = this.getGoogleApiKey();
    const aliKey = this.getAlibabaApiKey();
    return (googleKey && googleKey.length > 10) || (aliKey && aliKey.length > 10);
  }
}
