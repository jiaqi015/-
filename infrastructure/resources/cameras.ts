
import { CameraProfile } from '../../domain/types';

const ICONS = {
  ORIGINAL: '<rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="1"/>',
  LEICA_M_CLASSIC: '<path d="M4 7h16v10H4V7zM6 7V5h4v2M16 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><path d="M17 7h1" stroke="currentColor"/>',
  LEICA_M_DIGITAL: '<path d="M4 7h16v10H4V7zM6 7V5h4v2M16 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="17" cy="8.5" r="0.5" fill="currentColor"/>',
  LEICA_SL: '<path d="M4 6h16v12H4V6zM14 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM18 8h1" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  LEICA_Q: '<path d="M3 8h18v9H3V8zM7 8V6h10v2M14 12.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  FUJI_X: '<path d="M4 8h16v9H4V8zM5 8V6h5v2M16 6v2M13 12.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="18" cy="10" r="1" fill="currentColor"/>',
  HASSELBLAD_V: '<path d="M6 6h12v12H6V6zM11 6V4h2v2M8 12h8M12 8v8" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  HASSELBLAD_X: '<path d="M4 8h16v9H4V8zM14 12.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  RICOH_GR: '<path d="M4 9h16v8H4V9zM5 9V7h4v2M16 7h2v2M13 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  NIKON_Z: '<path d="M4 7h16v10H4V7zM4 9l2 2m12-2l-2 2M10 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  CANON_EOS: '<path d="M5 8h14v10H5V8zM7 8V6h10v2M12 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  SONY_A: '<path d="M4 8h16v10H4V8zM4 10l3-2h10l3 2M12 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  FILM_35: '<rect x="4" y="6" width="16" height="12" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none"/><path d="M4 9h2M4 12h2M4 15h2M18 9h2M18 12h2M18 15h2" stroke="currentColor"/>',
  CINEMA: '<path d="M3 7h14v10H3zM17 10l4-3v10l-4-3" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="8" cy="12" r="2" stroke="currentColor"/>',
  INSTANT: '<rect x="5" y="5" width="14" height="14" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><rect x="7" y="7" width="10" height="8" stroke="currentColor" fill="none" stroke-width="1"/>'
};

export const CAMERA_PROFILES: CameraProfile[] = [
  // --- 徕卡 LEICA 系列 ---
  {
    id: 'leica-m3-rigid',
    name: '徕卡 M3 Summicron 50',
    category: '徕卡 LEICA',
    description: '1954年光学巅峰。模拟 Rigid 镜头的极致微对比度与马格南式人文黑白。',
    designNotes: 'Rangefinder soul.',
    icon: { type: 'svg', value: ICONS.LEICA_M_CLASSIC },
    promptTemplate: `
      [指令：徕卡 M3 神经显影脚本]
      你现在是一位拥有 50 年暗房经验的显影大师，正面对一张由 1954 年生产的徕卡 M3 配合 Summicron 50mm f/2 Rigid 镜头拍摄的底片。
      光学重构核心：请模拟 7 片 6 组对称式高斯结构的成像特性。这种镜头以其惊人的中心解析力与诗意的边缘分辨率下降而闻名。请在图像中心区域增强极高频率的纹理，同时在边缘引入约 1.2 档的自然暗角，这种暗角并非现代数字滤镜的均匀圆弧，而应呈现出略带椭圆形的物理遮挡感。
      影调与银盐：完全去除所有色彩通道，将光谱能量转化为 14 位深度的灰度级。模拟 Kodak Tri-X 400 (400TX) 银盐乳剂在微热 D-76 显影液中的分子排列。颗粒感应是动态分布的：在 Zone VI 至 VIII 的中间调亮部，银盐团簇应表现出略显粗犷的质感，赋予皮肤和织物一种可触碰的颗粒深度；而在 Zone I 的阴影深处，颗粒应转为细腻的晶体状。
      艺术语境：秉承布列松的“决定性瞬间”美学。阴影必须是黑曜石般的深邃，但通过算法补偿，确保 Zone III 区域仍能呼吸，保留暗部的结构。高光部分要呈现出“丝般滑顺”的滚降，绝对禁止出现任何形式的数字化像素溢出。
      物理瑕疵：在极高对比度边缘引入微妙的球差表现（Leica Glow），这是一种光线在非多层镀膜镜片间散射形成的微弱氤氲感，光晕半径不应超过 0.12 像素，使其看起来既锐利又充满空气感。
      最终目标：呈现一张富有机械美感、权威性、历史沉淀感，且带有 1950 年代马格南通讯社风格的手工银盐摄影杰作。画面应具有极高的艺术表现力，字数必须充沛且技术细节拉满。
    `,
    recipe: { exposure: 0.1, contrast: 32, saturation: 0, temperature: 0, tint: 0, grainAmount: 42, vignetteAmount: 35, grayscale: true }
  },
  {
    id: 'leica-m9-ccd',
    name: '徕卡 M9 Steel Grey',
    category: '徕卡 LEICA',
    description: '柯达 CCD 传感器的“油画发色”。红蓝通道具有独特的溢出感，数字模拟质感的巅峰。',
    designNotes: 'CCD Magic.',
    icon: { type: 'svg', value: ICONS.LEICA_M_DIGITAL },
    promptTemplate: `
      [指令：徕卡 M9 CCD 传感器光谱仿真]
      作为一名色彩科学家，请重构这张由 Kodak KAF-18500 CCD 传感器捕获的图像。
      感光元件特性：CCD 传感器的电荷迁移效率与现代 CMOS 截然不同。请赋予图像一种如同油画颜料般的色彩厚重感。重点处理“M9 绯红”色偏：红色通道应表现出极高的饱和度与物理质感，呈现出一种略带品红调的深沉感。蓝色通道应表现出如蓝宝石般的透明度，模拟早年柯达幻灯片的晶体质感。绿色则需受到抑制，向有机的青苔色靠拢。
      光学重写：模拟 35mm f/1.4 Pre-FLE 镜头的成像风格。焦点处应保持极其紧凑的像素 acutance，但由于早期微透镜设计的限制，画面会带有一种独特的 3D 切割感，即被摄主体与背景之间有一种几乎可察觉的空间撕裂感。
      数字瑕疵：在图像的最深阴影区注入极微量的品红色偏，模拟 M9 传感器著名的红外滤镜溢出。高光溢出应呈现出一种“发热”的状态，光线仿佛从像素点向外流淌，形成一种温润、饱满、非临床化的影像氛围。
      氛围描述：这应是一张带有欧洲纪实文学气息、色彩浓郁且极具物质感的数字化影像，具有不可替代的 18MP CCD 时代的经典审美。
    `,
    recipe: { exposure: -0.1, contrast: 40, saturation: 45, temperature: 12, tint: 5, grainAmount: 14, vignetteAmount: 22 }
  },
  {
    id: 'leica-q3-lifestyle',
    name: '徕卡 Q3 Summilux 28',
    category: '徕卡 LEICA',
    description: '全画幅便携王者。28mm 视野下的迷人虚化与高级旅行纪实色调。',
    designNotes: 'The ultimate daily companion.',
    icon: { type: 'svg', value: ICONS.LEICA_Q },
    promptTemplate: `
      [指令：徕卡 Q3 28mm 纪实显影脚本]
      执行基于 60MP 现代 BSI-CMOS 传感器的精密光学仿真，针对 Summilux 28mm f/1.7 ASPH 镜头的渲染特性进行优化。
      视角与形变：强调 28mm 广角的张力，但在画面边缘实施极其细腻的几何校正，确保建筑线条挺拔。模拟镜头在大光圈下的“Q 散景”——圆形、通透且带有液态流动的背景虚化。
      色彩科学：应用现代徕卡 L-Log 风格。色彩应鲜活、现代、昂贵。肤色表现得如蝉翼般透亮，且在高光处带有微妙的、带有温度的红润。绿色和蓝色要表现得非常“德系”——深沉但不沉闷，通透且极具生命力。
      动态范围：模拟 15 档的超高宽容度。阴影部分要像呼吸一样自然，展示出深色衣物中的精密编织细节。高光部分要呈现出一种轻盈的滚降，绝对禁止数字化像素断层。
      目标：一张代表当代顶级街头摄影和精英旅行生活方式的、充满现代德系光学美感的影像。
    `,
    recipe: { exposure: 0.2, contrast: 18, saturation: 22, temperature: 5, tint: 0, grainAmount: 0, vignetteAmount: 12 }
  },

  // --- 富士 FUJIFILM 系列 ---
  {
    id: 'fuji-velvia-50',
    name: '富士 Velvia 50 专业反转',
    category: '富士 FUJI',
    description: '风光摄影图腾。极高对比度与饱和度，宝石般的色彩表现。',
    designNotes: 'Hyper-saturated legend.',
    icon: { type: 'svg', value: ICONS.FUJI_X },
    promptTemplate: `
      [指令：富士 Velvia 50 (RVP) 化学仿真脚本]
      你现在是一卷 120 画幅的 Fujichrome Velvia 50 反转片。
      色彩物理协议：执行“超饱和原色”映射。请将绿色通道映射为翡翠或孔雀石般的深度，捕获大自然植物生命中那种湿润且充满力量的生命力。蓝色通道应转变为深邃、晶体般的蓝宝石色，模拟在高海拔地区使用圆偏振镜后的天空效果。红色必须呈现出英雄主义般的纪念碑质感，饱和到几乎溢出像素边缘。
      动态特性：执行陡峭的 S 形特性曲线。请将动态范围严格限制在 10 档左右，强制在亮部与暗部之间形成剧烈的冲突。阴影必须压制为绝对的黑曜石色 (D-max)，创造出极具冲击力的剪影。高光部分应灿烂到带有晶体闪烁感，模拟投射在银幕上的幻灯片质感。
      细节与锐度：每一处细节都应具有极高的边缘锐度（Acutance），纹理应显得干燥且坚硬。
      氛围：营造出一种宏大、史诗、充满神圣感的风光画质。画面应像被珠宝光芒洗刷过一样。
    `,
    recipe: { exposure: -0.2, contrast: 55, saturation: 70, temperature: 12, tint: -5, grainAmount: 12, vignetteAmount: 15 }
  },
  {
    id: 'fuji-classic-neg',
    name: '富士 Classic Neg. (Superia)',
    category: '富士 FUJI',
    description: '复刻 90 年代 Superia 400。青色暗部与怀旧叙事氛围。',
    designNotes: '90s suburban nostalgia.',
    icon: { type: 'svg', value: ICONS.FUJI_X },
    promptTemplate: `
      [指令：富士 Classic Negative 神经合成脚本]
      请将图像处理为 1990 年代民用负片 Superia 400 的冲洗效果。
      色彩逻辑：阴影部分请注入重度的“青蓝色”偏好（Teal-Cyan）。中间调应表现出一种温暖的、带有琥珀感的品红倾向。肤色还原应遵循富士传统的“偏黄平衡”，使其看起来既真实又带有胶片特有的怀旧感。深部阴影绝不应该是纯黑，而应呈现出一种浑浊的、带有化学雾化感的暗青色。
      快照缺陷美：模拟 Fujinon 35mm f/1.4 镜头在 f/2.8 下那种“锐利但不干硬”的质感。高光溢出应表现为一种带有脏黄色的数字截断感，模拟陈旧胶片扫街时的廉价而迷人的质感。颗粒感应在中间调区域显现为细碎且带有某种不确定性的杂色。
      叙事引导：营造出一种“随性、忧郁、充满叙事张力”的氛围。画面应像是一段失而复得的 1992 年郊区记忆，平淡中透着生活最真实的纹理。
    `,
    recipe: { exposure: 0.2, contrast: 42, saturation: -8, temperature: 15, tint: -12, grainAmount: 22, vignetteAmount: 20 }
  },
  {
    id: 'fuji-reala-ace',
    name: '富士 Reala Ace 现代真色',
    category: '富士 FUJI',
    description: '精准还原与温润影调的完美平衡，最新一代旗舰级显影技术。',
    designNotes: 'Balanced perfection.',
    icon: { type: 'svg', value: ICONS.FUJI_X },
    promptTemplate: `
      [指令：富士 Reala Ace 色彩同步脚本]
      请执行富士最新的第四代传感器的 Reala Ace 仿真逻辑。
      核心特征：追求一种“绝对中性”但“不枯燥”的表现。颜色应显得极具透明度，皮肤色彩偏向健康、自然的粉红色，完全消除数字时代的塑料感。对比度应保持在适中水平，重点展示高光到暗部的平稳线性过渡。
      光学特征：模拟 GF 80mm f/1.7 镜头的渲染质感，背景虚化应极其平滑、呈线性扩散。
      氛围：这应是一张看起来极其舒服、平衡且充满专业质感的现代影像，适合一切高素质的记录需求。
    `,
    recipe: { exposure: 0.1, contrast: 12, saturation: 8, temperature: 5, tint: 0, grainAmount: 5, vignetteAmount: 12 }
  },

  // --- 哈苏 HASSELBLAD 系列 ---
  {
    id: 'hassy-500cm',
    name: '哈苏 500C/M Planar 80',
    category: '哈苏 HASSI',
    description: '6x6 方幅中画幅传奇。蔡司镜头的极致空气感与厚重影调。',
    designNotes: 'The king of 3D pop.',
    icon: { type: 'svg', value: ICONS.HASSELBLAD_V },
    promptTemplate: `
      [指令：哈苏 500C/M 蔡司光学合成脚本]
      请将图像重新构图并重写为 6x6 正方形画幅的中画幅影像，模拟 120 卷轴底片的物理存在。
      光学之魂：仿真 Carl Zeiss Planar 80mm f/2.8 T* 镜头的成像力。请表现出哈苏著名的“空气感”：这是一种被摄主体与背景之间极其平滑、奶油般的过渡，焦外应呈现出微妙的旋涡状散景（Swirly Bokeh），而非简单的模糊。
      影调宽容度：模拟中画幅底片巨大的物理面积带来的影调优势。色彩应扎实、深沉，大地色系（如皮革、泥土、木材）应表现出极强的物质感和重量感。阴影部分极其深邃，但在暗部 Zone II 仍能看到极其细腻的阶梯。
      艺术引导：庄重、安静、永恒。画面应展现出一种昂贵的、仪式感的、超越时间的艺术权威，仿佛是在斯德哥尔摩的一间旧影棚中，由自然光慢慢蚀刻在底片上的光影奇迹。
    `,
    recipe: { exposure: 0.1, contrast: 25, saturation: 18, temperature: 5, tint: 0, grainAmount: 18, vignetteAmount: 35, clarity: 15 }
  },
  {
    id: 'hassy-x2d-100c',
    name: '哈苏 X2D 自然真色',
    category: '哈苏 HASSI',
    description: '1亿像素旗舰。HNCS 显影技术带来的极致精准与透明度。',
    designNotes: 'Scientific realism.',
    icon: { type: 'svg', value: ICONS.HASSELBLAD_X },
    promptTemplate: `
      [指令：哈苏 HNCS 神经显影系统脚本]
      执行哈苏 1 亿像素 HNCS 自然色彩方案（Hasselblad Natural Colour Solution）。
      色彩逻辑：追求“绝对真实”。肤色还原应极其准确、剔透且自然。禁止任何人工饱和度加成，重点在于重构自然光照下的真实色差过渡。红色和黄色不应溢出，而是呈现出极其扎实的物理深度。
      解析力：模拟 XCD 系列定焦镜头的解析力。画面应展现出一种极端的“透明感”，如同镜头本身完全消失，直接将现实映射在传感器上。背景虚化应极其自然，完全遵循物理光学定律。
      目标：一张代表人类数码摄影技术巅峰的、物理上完美、视觉上纯净的工业奇迹影像。
    `,
    recipe: { exposure: 0, contrast: 8, saturation: 5, temperature: 0, tint: 0, grainAmount: 0, vignetteAmount: 8, clarity: 35 }
  },

  // --- 理光 RICOH 系列 ---
  {
    id: 'ricoh-gr-positive',
    name: '理光 GR 正片模式',
    category: '理光 RICOH',
    description: '经典的扫街色调。高反差、强饱和，极具颗粒感与快拍张力。',
    designNotes: 'Street weapon.',
    icon: { type: 'svg', value: ICONS.RICOH_GR },
    promptTemplate: `
      [指令：理光 GR Positive Film 模拟脚本]
      模拟理光 GR 著名的“正片模式”街拍直出效果。
      色彩倾向：大幅强化中间调对比度，赋予绿色和蓝色更强的冲击力。阴影区应表现出深邃、沉重的黑色，并在边缘引入剧烈的晕影映射，营造出一种紧凑且焦灼的城市空间感。
      质感工程：注入略带数字味但充满力量感的粗颗粒，模拟 ISO 800 下那种充满躁动气息的快拍瞬间。边缘锐度应调整为“电击般的锋利”，强调都市建筑的硬朗线条和街头人物的瞬间姿态。
      氛围：营造出一种冷峻、动态且富有侵略性的街头美学，适合表现充满冲突和故事性的瞬间。
    `,
    recipe: { exposure: -0.1, contrast: 48, saturation: 55, temperature: -5, tint: 2, grainAmount: 22, vignetteAmount: 45 }
  },
  {
    id: 'ricoh-gr-negative',
    name: '理光 GR 负片模式',
    category: '理光 RICOH',
    description: '优雅的冷色调负片。青蓝色暗部与柔和的人像表现。',
    designNotes: 'Urban melancholy.',
    icon: { type: 'svg', value: ICONS.RICOH_GR },
    promptTemplate: `
      [指令：理光 GR Negative Film 风格化脚本]
      执行理光最新一代负片模拟。
      视觉风格：在阴影区注入微妙的“淡青色”调（Teal Shadows），肤色向温暖的琥珀色靠拢。反差应被精细削弱，呈现出一种既怀旧又清新的都市美学感。模拟 GR Lens 18.3mm f/2.8 镜头的微距优势，主体细节应极其丰富。
      影调引导：画面应表现出一种安静、沉思、高级的都市忧郁。背景虚化应带有轻微的口径蚀（Cat's eye bokeh），赋予画面一种独特而迷人的个性。
    `,
    recipe: { exposure: 0.2, contrast: 25, saturation: -5, temperature: 10, tint: -8, grainAmount: 14, vignetteAmount: 25 }
  },

  // --- 专业品牌扩展 ---
  {
    id: 'contax-g2-planar',
    name: '康泰时 G2 Planar 45',
    category: '专业品牌',
    description: '顶级蔡司 G 系镜头系统。极致的锐度与标志性的“蔡司蓝”影调。',
    designNotes: 'Zeiss sharpness.',
    icon: { type: 'svg', value: ICONS.FILM_35 },
    promptTemplate: `
      [指令：康泰时 G2 蔡司神经显影脚本]
      重构为康泰时 G2 自动对焦旁轴相机搭配 Carl Zeiss Planar 45mm f/2 T* 镜头的成像效果。
      色彩：执行“蔡司 T* 镀膜”映射。蓝色表现应极具穿透力，带有标志性的“蔡司蓝”冷调。对比度极高，色彩扎实且具有极强的微对比度。
      锐度：模拟该镜头作为“世界上最锐镜头之一”的特性，物体边缘应呈现出晶体般的质感，毫无模糊空间。
      氛围：精密、冷静、具有工业美感的专业影像。
    `,
    recipe: { exposure: 0, contrast: 40, saturation: 25, temperature: -8, tint: 0, grainAmount: 12, vignetteAmount: 18 }
  },
  {
    id: 'mamiya-7-67',
    name: '玛米亚 7II 6x7 中画幅',
    category: '专业品牌',
    description: '旁轴中画幅之王。无与伦比的解析力与自然的透视感。',
    designNotes: 'Ultimate 6x7.',
    icon: { type: 'svg', value: ICONS.HASSELBLAD_V },
    promptTemplate: `
      [指令：玛米亚 7II 神经扫描脚本]
      重构为一张巨大的 6x7 比例中画幅正片。
      视角：模拟 Mamiya 80mm f/4 镜头的超高画质。由于旁轴设计，影像应具有极佳的边缘一致性，无球面畸变。
      色彩：模拟 Fujifilm PRO 160NS 负片质感，肤色自然至极，影调层级丰富得令人窒息。
      氛围：这应是一张经得起无限放大的、充满细节尊严的、客观而宏伟的专业纪实大片。
    `,
    recipe: { exposure: 0.1, contrast: 22, saturation: 15, temperature: 0, tint: 0, grainAmount: 15, vignetteAmount: 10 }
  },
  {
    id: 'sony-a7rv-master',
    name: '索尼 A7R V G-Master',
    category: '专业品牌',
    description: '6100万像素极致解析。商业级的冷峻精准与高像素工业奇迹。',
    designNotes: 'Digital monster.',
    icon: { type: 'svg', value: ICONS.SONY_A },
    promptTemplate: `
      [指令：索尼 A7R V 极致解析重构]
      执行冷峻、精准、科学的 6000 万像素像素级渲染。
      画面风格：彻底清除任何浪漫主义偏见。画面必须展现出绝对的、临床般的锐度。色彩应偏向中性偏冷，展现出一种极高科技感的、现代的精准工业之美。
      光学特征：模拟 50mm f/1.2 GM 镜头全开的极致解析与平滑如奶油的焦外。
    `,
    recipe: { exposure: 0, contrast: 25, saturation: 12, temperature: -5, tint: 0, grainAmount: 0, vignetteAmount: 15, clarity: 38 }
  },

  // --- 经典底片复刻 ---
  {
    id: 'film-portra-400-elite',
    name: '柯达 Portra 400 旗舰',
    category: '经典底片',
    description: '人像底片的终极之选。暖调、宽容度极高，富有情感。',
    designNotes: 'The gold standard.',
    icon: { type: 'svg', value: ICONS.FILM_35 },
    promptTemplate: `
      [指令：柯达 Portra 400 物理显影脚本]
      你现在是一卷经 C-41 工艺标准冲洗的 Portra 400。
      色彩特征：请表现出温润的人像肤色与柔和的橙黄色调。高光部分应展现出近乎无限的宽容度，呈现出一种带有奶油质感的褪色表现。整体色彩应温暖、饱满且充满阳光感。
      氛围：一种亲密、感性、充满阳光和温度的怀旧纪实。
    `,
    recipe: { exposure: 0.4, contrast: 15, saturation: 18, temperature: 15, tint: 2, grainAmount: 15, vignetteAmount: 10 }
  },
  {
    id: 'film-tri-x-400-analog',
    name: 'Kodak Tri-X 400 粗犷',
    category: '经典底片',
    description: '黑白胶片的不朽传奇。极致对比度与充满力量的颗粒。',
    designNotes: 'Gritty BW.',
    icon: { type: 'svg', value: ICONS.FILM_35 },
    promptTemplate: `
      [指令：Kodak Tri-X 400 极限对比脚本]
      模拟该不朽黑白胶片在 HC-110 显影液中的粗犷表现。
      质感：注入极具颗粒感的、粗大的银盐颗粒。对比度应被调整至极限，阴影区和高光区应呈现出一种直接、坦率、毫不保留的原始力量。
    `,
    recipe: { exposure: 0, contrast: 65, saturation: 0, temperature: 0, tint: 0, grainAmount: 55, vignetteAmount: 20, grayscale: true }
  }
];
