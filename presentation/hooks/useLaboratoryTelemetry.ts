
import { useState, useEffect } from 'react';
import { WorkflowStep } from '../../application/ports';

const DYNAMIC_LOGS: Record<WorkflowStep, string[]> = {
  'ANALYZING_OPTICS': [
    '中枢 Agent 正在执行底片临床诊断...',
    '识别逆光光斑物理形态，编排补光策略...',
    '感知主体肤色通道，自规划保护协议...',
    '正在自主生成 DAG 任务显影清单...',
    '检测环境光光谱显色指数 (CRI)...'
  ],
  'RETRIEVING_KNOWLEDGE': [
    'Agent 自发检索全球光学实验室文档...',
    '按需抓取 T* 镀膜光谱物理常数...',
    '正在根据诊断报告定位 RAG 审美知识节点...',
    '同步实时联网摄影技术文档库...',
    '自主筛选最匹配的银盐晶体建模方案...'
  ],
  'NEURAL_DEVELOPING': [
    '首席显影师正在执行首轮神经重构...',
    '注入 Zone System 影调保护算法...',
    'Agent 正在审计像素级微对比度...',
    '动态调整高阶高光滚降映射曲线...',
    '正在比对“自省清单”，执行二轮显影修正...'
  ],
  'QUALITY_CHECKING': [
    '正在执行审美自校准 (Self-Audit)...',
    '物理缺陷美学仿真已成功注入...',
    '锐度人工痕迹审计完成，执行平滑操作...',
    '自主封装 14-bit 高位深显影结果...',
    '显影档案最终一致性校准通过...'
  ]
};

const LAB_INSIGHTS = [
  "Agent 提示：徕卡的‘空气感’源于对微对比度的动态编排。",
  "Agent 提示：检测到底片动态范围较低，已自发增加 1.5 档虚拟宽容度。",
  "Agent 提示：为了保护这块肤色，我放弃了部分冷色通道的增益。",
  "Agent 提示：经典的‘Leica Glow’模拟中，我增加了 2.5% 的物理球差。",
  "Agent 提示：中画幅的散景过渡已通过 Agent 的 DAG 路径进行二次平滑。",
  "Agent 提示：蔡司 T* 镀膜的通透感已通过光谱对冲算法精准还原。"
];

export const useLaboratoryTelemetry = (isDeveloping: boolean, currentStep: WorkflowStep) => {
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);

  useEffect(() => {
    if (isDeveloping) {
      setTelemetryLogs(["实验室中枢神经系统唤醒中...", "超级 Agent 编排引擎已就绪..."]);
      setInsightIndex(Math.floor(Math.random() * LAB_INSIGHTS.length));
      
      const logInterval = window.setInterval(() => {
        setTelemetryLogs(prev => {
          const possible = DYNAMIC_LOGS[currentStep];
          const nextLog = possible[Math.floor(Math.random() * possible.length)];
          return [...prev.slice(-12), `[Agent] ${nextLog}`];
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
