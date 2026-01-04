
/**
 * 徕滤实验室摄影美学知识库 v8.0 (High-Density RAG Core)
 */
export const PHOTOGRAPHY_KNOWLEDGE_BASE = {
  OPTICAL_PHYSICS: [
    "徕卡 Summicron 50mm 镜头的微对比度 (Micro-contrast) 源于对低频像差的极致压制，使影调过渡呈现出所谓的'钢中带柔'。",
    "球面像差的残留 (Residual Spherical Aberration) 会在焦点边缘产生微量光晕 (Leica Glow)，这是德系老镜头的灵魂。",
    "蔡司 T* 镀膜的物理特性：通过原子层沉积技术，对 400-700nm 光谱实现极高透射率，暗部通透感极强。",
    "现代复古镜头模拟：需在渲染时注入 2% 的径向球差和 1.5 档的非线性暗角 (Vignetting)。",
    "镜头耀斑 (Flare) 的物理形态：根据光圈叶片数（如 6 片或 8 片）决定衍射星芒的锐利度。"
  ],
  FILM_EMULSION_SCIENCE: [
    "Kodak Tri-X 400 (400TX) 的卤化银颗粒在冲洗时会形成独特的'云状分布'，阴影宽容度高达 5 档。",
    "Fujichrome Velvia 50 (RVP) 的光谱敏感度在 550nm (绿色) 处有极高峰值，导致其色彩呈现出浓郁的宝石感。",
    "Kodak Portra 400 的肤色还原算法：对红色光谱进行 10% 的去饱和处理，同时提升中间调的暖黄色温，消除数字噪点感。",
    "CineStill 800T 去除防光晕层 (Rem-jet) 后的物理反应：点光源周围会出现红色光晕效应 (Halation)。",
    "彩色负片冲洗 (C-41) 的化学特性：高光部分会发生银盐堆叠，产生丝滑的动态范围缩减。"
  ],
  SENSOR_ENGINEERING: [
    "柯达 KAF-18500 CCD 传感器（M9）的响应曲线：红色通道的电荷收集深度比现代 CMOS 深 30%，发色厚重。",
    "Bayer 滤镜排布对纹理的影响：数字锐化往往产生虚假边缘，神经显影需采用类似于双三次插值的像素重构。",
    "14-bit RAW 文件的线性映射：在向 8-bit 输出转换时，需采用极高阶的高光滚降曲线 (Highlights Roll-off)。",
    "现代 CMOS 的冷峻感源于其极高的信噪比，显影时需人工注入有机随机噪声以重构'胶片感'。"
  ],
  AESTHETIC_MASTER_STRATEGY: [
    "大师模式指令：模拟布列松纪实影调。重点在于强化黑白灰阶的 11 个 Zone 层次，拒绝死黑，保留暗部纹理。",
    "大师模式指令：索尔·雷特式色彩。模拟透过带有雨水的窗户看城市的质感，色彩需呈现出半透明的抽象美。",
    "大师模式指令：电影感渲染。将 2.35:1 的画幅感注入影调，暗部采用 Teal 色偏移，高光采用 Orange 温暖校准。"
  ]
};

export class KnowledgeRetrievalService {
  static retrieve(keywords: string[]): string {
    const context: string[] = [];
    const lowerKeywords = keywords.map(k => k.toLowerCase());

    Object.entries(PHOTOGRAPHY_KNOWLEDGE_BASE).forEach(([category, data]) => {
      data.forEach(fact => {
        // 改进匹配逻辑：只要包含任意关键词或分类名
        const isMatch = lowerKeywords.some(k => 
          fact.toLowerCase().includes(k) || category.toLowerCase().includes(k)
        );
        if (isMatch) context.push(fact);
      });
    });

    // 大师模式返回更高密度的信息
    return context.length > 0 
      ? context.sort(() => 0.5 - Math.random()).slice(0, 10).join("\n")
      : "Initializing neural optic reconstruction with standard laboratory specs.";
  }
}
