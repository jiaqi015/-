
import { CameraProfile } from '../../domain/types';

const ICONS = {
  LEICA_M_CLASSIC: '<path d="M4 7h16v10H4V7zM6 7V5h4v2M16 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><path d="M17 7h1" stroke="currentColor"/>',
  LEICA_M_DIGITAL: '<path d="M4 7h16v10H4V7zM6 7V5h4v2M16 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="17" cy="8.5" r="0.5" fill="currentColor"/>',
  LEICA_Q: '<path d="M3 8h18v9H3V8zM7 8V6h10v2M14 12.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  FUJI_X: '<path d="M4 8h16v9H4V8zM5 8V6h5v2M16 6v2M13 12.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="18" cy="10" r="1" fill="currentColor"/>',
  HASSELBLAD_V: '<path d="M6 6h12v12H6V6zM11 6V4h2v2M8 12h8M12 8v8" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  HASSELBLAD_X: '<path d="M4 8h16v9H4V8zM14 12.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  RICOH_GR: '<path d="M4 9h16v8H4V9zM5 9V7h4v2M16 7h2v2M13 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  FILM_35: '<rect x="4" y="6" width="16" height="12" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none"/><path d="M4 9h2M4 12h2M4 15h2M18 9h2M18 12h2M18 15h2" stroke="currentColor"/>',
  SONY_A: '<path d="M4 8h16v10H4V8zM4 10l3-2h10l3 2M12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" stroke="currentColor" fill="none" stroke-width="1.5"/>'
};

export const CAMERA_PROFILES: CameraProfile[] = [
  {
    id: 'leica-m3-rigid',
    name: '徕卡 M3 Summicron 50',
    category: '徕卡 LEICA',
    description: '1954年光学巅峰。模拟 Rigid 镜头的极致微对比度与马格南式人文黑白。',
    designNotes: 'Rangefinder soul.',
    icon: { type: 'svg', value: ICONS.LEICA_M_CLASSIC },
    promptTemplate: `
      # 显影协议：LEICA M3 MASTER ANALOG
      [核心特征]：极致微对比度 (Micro-contrast)、马格南式人文叙事、德系暗房银盐。
      [光学仿真]：模拟 Summicron 50mm f/2 Rigid 双高斯结构。高光边缘呈现“徕卡光晕(Leica Glow)”，即残留球差带来的轻微氤氲感。中心区锐度极高，边缘呈现约 1.2 档的非线性物理暗角。
      [影调渲染]：移除色彩通道，执行高位深灰阶映射。模拟 Kodak Tri-X 400 底片在 D-76 显影液中的随机晶体颗粒分布。Zone V 中间调饱满，Zone I 阴影深沉但保留细节。
      [最终目标]：呈现具有历史厚重感的经典旁轴纪实黑白影像。
    `,
    recipe: { exposure: 0.1, contrast: 32, saturation: 0, temperature: 0, tint: 0, grainAmount: 42, vignetteAmount: 35, grayscale: true }
  },
  {
    id: 'leica-m9-ccd',
    name: '徕卡 M9 Steel Grey',
    category: '徕卡 LEICA',
    description: '柯达 CCD 传感器的“油画发色”。红蓝通道具有独特的溢出感。',
    designNotes: 'CCD Magic.',
    icon: { type: 'svg', value: ICONS.LEICA_M_DIGITAL },
    promptTemplate: `
      # 显影协议：LEICA M9 CCD SPECTRUM
      [核心特征]：柯达 CCD 油画质感、绯红饱和度溢出、高宽容度高光滚降。
      [色彩仿真]：模拟 Kodak KAF-18500 传感器的电荷迁移特性。红色通道具有极高物理厚度，呈现深沉的“M9 红”。蓝色通道透明度极高，模拟柯达幻灯片的晶体感。主体与背景之间存在显著的空间撕裂感。
    `,
    recipe: { exposure: -0.1, contrast: 40, saturation: 45, temperature: 12, tint: 5, grainAmount: 14, vignetteAmount: 22 }
  },
  {
    id: 'fuji-classic-chrome',
    name: '富士 Classic Chrome',
    category: '富士 FUJI',
    description: '纪实摄影首选。低饱和度配合硬朗的高光，模拟彩色负片的报刊质感。',
    designNotes: 'Documentary depth.',
    icon: { type: 'svg', value: ICONS.FUJI_X },
    promptTemplate: `
      # 显影协议：FUJIFILM CLASSIC CHROME
      [核心特征]：低饱和度、高对比度、硬朗影调。
      [色彩仿真]：模拟上世纪 80 年代纪实负片的色彩特征。大幅削减青色与品红的纯度。肤色表现克制，背景中的天空呈现独特的灰蓝色调。
      [影调渲染]：强化阴影压缩，使暗部显得深邃且具有故事感。
    `,
    recipe: { exposure: 0, contrast: 25, saturation: -30, temperature: -5, tint: 2, grainAmount: 18, vignetteAmount: 10 }
  },
  {
    id: 'fuji-velvia-50',
    name: '富士 Velvia 50',
    category: '富士 FUJI',
    description: '风光摄影图腾。极高对比度与饱和度，宝石般的绿色表现。',
    designNotes: 'Hyper-vibrant.',
    icon: { type: 'svg', value: ICONS.FUJI_X },
    promptTemplate: `
      # 显影协议：FUJICHROME VELVIA 50 (RVP)
      [核心特征]：超高饱和度、宝石绿映射、风景统治力。
      [色彩仿真]：执行“第四色彩层”技术。绿色通道偏向翡翠色，蓝色向蓝宝石色偏移。红色具有如油画颜料般的视觉重量。阴影区快速沉入绝对黑。
    `,
    recipe: { exposure: -0.2, contrast: 55, saturation: 70, temperature: 12, tint: -5, grainAmount: 12, vignetteAmount: 15 }
  },
  {
    id: 'hasselblad-500cm',
    name: '哈苏 500C/M 80mm',
    category: '哈苏 HASSELBLAD',
    description: '中画幅经典。模拟蔡司镜头的通透感与 6x6 正方形画幅的仪式感。',
    designNotes: 'Medium format soul.',
    icon: { type: 'svg', value: ICONS.HASSELBLAD_V },
    promptTemplate: `
      # 显影协议：HASSELBLAD 500C/M ZEISS
      [核心特征]：极高色彩深度、蔡司 T* 镀膜通透感、切片式虚化。
      [光学仿真]：模拟 Zeiss Planar 80mm f/2.8 镜头。画面呈现极致平坦的像场，边缘畸变为零。虚化过渡如丝绸般平滑。
      [影调渲染]：呈现 16-bit 级别的阶梯感。高光 Roll-off 极其平滑。
    `,
    recipe: { exposure: 0.1, contrast: 15, saturation: 20, temperature: 0, tint: 0, grainAmount: 8, vignetteAmount: 5 }
  },
  {
    id: 'ricoh-gr-pos',
    name: '理光 GR 正片模式',
    category: '理光 RICOH',
    description: '街头之王。模拟浓郁的胶片色彩，极高的对比度与独特的颗粒感。',
    designNotes: 'Street King.',
    icon: { type: 'svg', value: ICONS.RICOH_GR },
    promptTemplate: `
      # 显影协议：RICOH GR POSITIVE FILM
      [核心特征]：高对比、浓郁发色、颗粒粗矿、青蓝色偏移。
      [色彩仿真]：阴影区注入冷青色，高光区偏暖。红色呈现高度饱和。颗粒结构粗糙但具有节奏感，模拟理光 GR 独特的传感器噪点美学。
    `,
    recipe: { exposure: -0.1, contrast: 45, saturation: 35, temperature: -8, tint: 15, grainAmount: 35, vignetteAmount: 25 }
  },
  {
    id: 'kodak-portra-400',
    name: '柯达 Portra 400',
    category: '胶片 FILM',
    description: '人像摄影圣经。极佳的肤色还原，暖调且富有宽容度。',
    designNotes: 'Legendary skin tones.',
    icon: { type: 'svg', value: ICONS.FILM_35 },
    promptTemplate: `
      # 显影协议：KODAK PORTRA 400 (C-41)
      [核心特征]：粉嫩肤色、暖橙影调、乳剂颗粒、极高宽容度。
      [色彩仿真]：对肤色通道(橙/红)进行非线性平滑，抹除数字锐度。整体色调偏向温馨的浅棕与暖橙色。模拟 C-41 工艺带来的有机颗粒。
    `,
    recipe: { exposure: 0.3, contrast: 10, saturation: 15, temperature: 15, tint: 5, grainAmount: 25, vignetteAmount: 8 }
  },
  {
    id: 'cinestill-800t',
    name: 'CineStill 800T',
    category: '胶片 FILM',
    description: '电影胶卷改造。独特的高光红晕效应，适合霓虹夜景。',
    designNotes: 'Night vision.',
    icon: { type: 'svg', value: ICONS.FILM_35 },
    promptTemplate: `
      # 显影协议：CINESTILL 800T (Tungsten)
      [核心特征]：钨丝灯平衡、高光红晕 (Halation)、电影感青调、冷调阴影。
      [光学仿真]：在高光边缘生成显著的红色弥散环，模拟移除防光晕层后的电影胶片效果。阴影呈现深沉的青绿色。
    `,
    recipe: { exposure: 0.2, contrast: 30, saturation: 20, temperature: -30, tint: -10, grainAmount: 40, vignetteAmount: 20 }
  },
  {
    id: 'sony-a7rv-raw',
    name: '索尼 A7R V 高解析',
    category: '现代 MODERN',
    description: '数码性能巅峰。极致锐度与色彩准确性，适合后期创作。',
    designNotes: 'Pure data.',
    icon: { type: 'svg', value: ICONS.SONY_A },
    promptTemplate: `
      # 显影协议：SONY A7R V PRECISION
      [核心特征]：极致解析力、无畸变还原、现代 CMOS 冷峻感。
      [光学仿真]：模拟 6100 万像素传感器的超高采样。边缘锐度与中心一致。色彩中立，不带有任何时代倾向。
    `,
    recipe: { exposure: 0, contrast: 10, saturation: 5, temperature: 0, tint: 0, grainAmount: 2, vignetteAmount: 0 }
  }
];
