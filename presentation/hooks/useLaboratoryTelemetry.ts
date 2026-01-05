
import { useState, useEffect } from 'react';
import { WorkflowStep } from '../../application/ports';

const DYNAMIC_LOGS: Record<WorkflowStep, string[]> = {
  'ANALYZING_OPTICS': [
    '正在采样 Bayer 阵列排列...',
    '分析高光区域动态范围溢出...',
    '识别暗部噪声分布模型...',
    '映射原始光影能量梯度...',
    '检测镜头径向球差残留...'
  ],
  'RETRIEVING_KNOWLEDGE': [
    '正在检索光学专利库...',
    '注入 T* 镀膜光谱透射率曲线...',
    '模拟卤化银颗粒在显影液中的物理反应...',
    '同步实时联网摄影技术文档...',
    '加载 CCD 传感器非线性色彩映射表...'
  ],
  'NEURAL_DEVELOPING': [
    '重构边缘微对比度梯度...',
    '注入有机随机颗粒噪声...',
    '校准 Zone System 影调层次...',
    '执行高阶高光滚降映射...',
    '正在合成中画幅虚化散景过渡...'
  ],
  'QUALITY_CHECKING': [
    '对比度一致性审计通过...',
    '色温偏差零点校准完成...',
    '锐度人工痕迹消除逻辑激活...',
    '正在导出 14-bit 高位深显影档案...',
    '准备封装实验室专属 EXIF 证书...'
  ]
};

const LAB_INSIGHTS = [
  "徕卡的‘空气感’源于对微对比度的独特控制。",
  "Kodak Portra 400 会在红色通道执行非线性去饱和，以保护肤色。",
  "CCD 传感器的魅力在于其色彩通道的电荷收集深度。",
  "经典的‘Leica Glow’是由残留的球面像差带来的氤氲感。",
  "中画幅相机的虚化过渡比全画幅更加平滑自然。",
  "蔡司 T* 镀膜通过原子层沉积技术消除了绝大部分鬼影。"
];

export const useLaboratoryTelemetry = (isDeveloping: boolean, currentStep: WorkflowStep) => {
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);

  useEffect(() => {
    if (isDeveloping) {
      setTelemetryLogs(["实验室系统初始化...", "正在连接神经显影节点..."]);
      setInsightIndex(Math.floor(Math.random() * LAB_INSIGHTS.length));
      
      const logInterval = window.setInterval(() => {
        setTelemetryLogs(prev => {
          const possible = DYNAMIC_LOGS[currentStep];
          const nextLog = possible[Math.floor(Math.random() * possible.length)];
          return [...prev.slice(-12), `[成功] ${nextLog}`];
        });
      }, 1500);

      const insightInterval = window.setInterval(() => {
        setInsightIndex(prev => (prev + 1) % LAB_INSIGHTS.length);
      }, 5000);

      return () => {
        clearInterval(logInterval);
        clearInterval(insightInterval);
      };
    }
  }, [isDeveloping, currentStep]);

  return {
    telemetryLogs,
    insightIndex,
    currentInsight: LAB_INSIGHTS[insightIndex]
  };
};
