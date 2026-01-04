
/**
 * 环境变量与实验室配置管理服务
 */
export class EnvService {
  private static readonly PREFIX = 'LEIFI_LAB_';

  private static getValue(key: string): string {
    // 1. 优先尝试从 Vite 注入的环境变量读取
    const envVal = process.env[key];
    if (envVal && envVal.length > 5) return envVal;

    // 2. 其次从 localStorage 读取
    return localStorage.getItem(`${this.PREFIX}${key}`) || "";
  }

  static getGoogleApiKey(): string {
    return this.getValue('API_KEY');
  }

  static getAlibabaApiKey(): string {
    return this.getValue('ALIBABA_API_KEY');
  }

  /**
   * 获取用户配置的 CORS 代理地址
   */
  static getCorsProxy(): string {
    return localStorage.getItem(`${this.PREFIX}CORS_PROXY`) || "";
  }

  static setConfigs(configs: { alibaba?: string; google?: string; proxy?: string }) {
    if (configs.alibaba !== undefined) localStorage.setItem(`${this.PREFIX}ALIBABA_API_KEY`, configs.alibaba);
    if (configs.google !== undefined) localStorage.setItem(`${this.PREFIX}API_KEY`, configs.google);
    if (configs.proxy !== undefined) localStorage.setItem(`${this.PREFIX}CORS_PROXY`, configs.proxy);
  }

  static isAlibabaReady(): boolean {
    return this.getAlibabaApiKey().length > 10;
  }

  static isGoogleReady(): boolean {
    return this.getGoogleApiKey().length > 10;
  }
}
