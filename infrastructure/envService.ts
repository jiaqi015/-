export class EnvService {
  /**
   * 动态获取有效的 API Key
   * 逻辑优先级：
   * 1. aistudio 选取的运行时 Key (window.API_KEY)
   * 2. Vercel 注入的构建时 Key (process.env.API_KEY)
   */
  static getApiKey(): string {
    // 优先尝试从 aistudio 可能注入的全局变量或 window 对象中获取
    const runtimeKey = (window as any).API_KEY;
    if (runtimeKey && runtimeKey !== "") {
      return runtimeKey;
    }

    // 其次尝试从注入的 process.env 中获取（Vercel 环境变量）
    const envKey = process.env.API_KEY;
    if (envKey && envKey !== "") {
      return envKey;
    }

    return "";
  }

  static hasValidKey(): boolean {
    return this.getApiKey().length > 10;
  }
}