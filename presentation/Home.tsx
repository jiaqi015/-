
import React, { useState, useEffect, useRef, memo } from 'react';
import { Logo } from './components/Logo';
import { Uploader } from './components/Uploader';
import { CameraPicker } from './components/CameraPicker';
import { IntensitySlider } from './components/IntensitySlider';
import { ExifRibbon } from './components/ExifRibbon';
import { HistoryStrip } from './components/HistoryStrip';
import { developPhotoUseCase, cameraCatalogUseCase, downloadAppService, engineController } from '../infrastructure/container';
import { CameraProfile, DevelopSession, DevelopMode, GroundingSource, EngineProvider } from '../domain/types';
import { WorkflowStep } from '../application/ports';
import { LocalSessionRepository } from '../infrastructure/sessionRepository';

const sessionRepo = new LocalSessionRepository();

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const LaboratoryTimer: React.FC<{ active: boolean; modeColor: string }> = ({ active, modeColor }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 50);
    return () => clearInterval(interval);
  }, [active]);

  const timeStr = elapsed.toFixed(1);
  
  return (
    <div className="flex flex-col items-center gap-2 mb-10 select-none">
      <div className="flex items-center justify-center bg-black/60 border border-white/5 px-12 py-5 rounded-sm backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-baseline font-mono font-black tabular-nums tracking-tighter">
          <div className="flex text-[64px] text-white" style={{ textShadow: `0 0 40px ${modeColor}44` }}>
            {timeStr.split('').map((char, i) => (
              <div key={i} className={`${char === '.' ? 'w-[20px]' : 'w-[42px]'} flex justify-center`}>
                {char}char
              </div>
            ))}
          </div>
          <span className="text-[18px] ml-4 font-sans opacity-40 uppercase tracking-[0.6em] font-bold" style={{ color: modeColor }}>SEC</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#E30613] shadow-[0_0_8px_#E30613]"></div>
        <span className="text-[10px] tracking-[0.5em] uppercase font-black text-neutral-600">Objective Process Time (Optic Lab)</span>
      </div>
    </div>
  );
};

const PromptFormatter: React.FC<{ text: string; sources?: GroundingSource[] }> = ({ text, sources }) => {
  const lines = text.split('\n');
  return (
    <div className="flex flex-col gap-4 font-mono text-[11px] leading-relaxed tracking-tight">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        if (trimmed.startsWith('【') && trimmed.includes('】')) {
          return (
            <div key={idx} className="text-white font-black mt-2 mb-1 flex items-center gap-2">
              <span className="w-1 h-3 bg-[#E30613]" />
              <span className="text-[12px] uppercase">{trimmed}</span>
            </div>
          );
        }
        if (trimmed.startsWith('[') && trimmed.includes(']')) {
          const match = trimmed.match(/^\[(.*?)\]：?(.*)/);
          if (match) {
            return (
              <div key={idx} className="flex flex-col gap-1 pl-3 border-l border-neutral-800">
                <span className="text-neutral-200 font-bold opacity-90">{`[${match[1]}]`}</span>
                <span className="text-neutral-500 pl-1">{match[2]}</span>
              </div>
            );
          }
        }
        if (trimmed.startsWith('#')) {
          return (
            <div key={idx} className="text-white font-black py-1 tracking-[0.2em] border-b border-neutral-800/50 mb-2 uppercase">
              {trimmed.replace(/^#+\s*/, '')}
            </div>
          );
        }
        return (
          <div key={idx} className="text-neutral-400 pl-3 opacity-80">
            {trimmed}
          </div>
        );
      })}

      {sources && sources.length > 0 && (
        <div className="mt-6 border-t border-neutral-800 pt-6">
          <div className="text-white font-black mb-3 text-[12px] uppercase flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500" />
            <span>实验室实时技术溯源</span>
          </div>
          <div className="flex flex-col gap-2">
            {sources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 text-[10px] truncate block opacity-70 hover:opacity-100 transition-opacity"
              >
                [{idx + 1}] {source.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WORKFLOW_LABELS: Record<WorkflowStep, string> = {
  'ANALYZING_OPTICS': '视觉分析官：审计光学特征与光影构图',
  'RETRIEVING_KNOWLEDGE': '知识库引擎：检索 RAG 摄影百科知识',
  'NEURAL_DEVELOPING': '神经显影师：执行多层像素重构',
  'QUALITY_CHECKING': '质量检查官：校准色彩一致性与纹理'
};

const DYNAMIC_LOGS: Record<WorkflowStep, string[]> = {
  'ANALYZING_OPTICS': [
    '正在同步阿里云神经节点...',
    '分析高光区域动态范围溢出...',
    '映射原始光影能量梯度...',
    '识别暗部噪声分布模型...',
    '检测镜头径向球差残留...'
  ],
  'RETRIEVING_KNOWLEDGE': [
    '注入通义万象光谱透射率曲线...',
    '同步实时联网摄影技术文档...',
    '模拟卤化银颗粒在显影液中的物理反应...',
    '加载百炼 CCD 传感器非线性色彩映射表...',
    '正在检索阿里云摄影美学专利库...'
  ],
  'NEURAL_DEVELOPING': [
    'Wanx-V2 像素阵列重构中...',
    '注入有机随机颗粒噪声...',
    '校准 Zone System 影调层次...',
    '执行高阶高光滚降映射...',
    '正在合成百炼中画幅虚化散景过渡...'
  ],
  'QUALITY_CHECKING': [
    '对比度一致性审计通过...',
    '色温偏差零点校准完成...',
    '正在导出 14-bit 高位深显影档案...',
    '准备封装实验室专属 EXIF 证书...'
  ]
};

const LAB_INSIGHTS = [
  "徕卡的‘空气感’源于对微对比度的独特控制。",
  "Kodak Portra 400 会在红色通道执行非线性去饱和，以保护肤色。",
  "CCD 传感器的魅力在于其色彩通道的电荷收集深度。",
  "经典的‘Leica Glow’是由残留的球面像差带来的氤氲感。",
  "中画幅相机的虚化过渡比全画幅更加平幅自然。",
  "蔡司 T* 镀膜通过原子层沉积技术消除了绝大部分鬼影。"
];

export const Home: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('leica-m3-rigid');
  const [intensity, setIntensity] = useState(1.0);
  const [developMode, setDevelopMode] = useState<DevelopMode>('DIRECT');
  const [engine, setEngine] = useState<EngineProvider>('ALIBABA'); // 默认阿里
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('ANALYZING_OPTICS');
  const [result, setResult] = useState<{ session: DevelopSession; url: string } | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [history, setHistory] = useState<DevelopSession[]>([]);
  const [profiles] = useState<CameraProfile[]>(() => cameraCatalogUseCase.getProfiles());
  
  const [infoModalSession, setInfoModalSession] = useState<DevelopSession | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);

  const loadHistory = async () => {
    const sessions = await sessionRepo.getAll();
    setHistory(sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  useEffect(() => {
    const checkAuth = async () => {
      // 检查任意一个 Key 有效即可
      const googleKey = process.env.API_KEY;
      const aliKey = process.env.ALIBABA_API_KEY;
      if ((googleKey && googleKey.length > 5) || (aliKey && aliKey.length > 5)) {
        setIsAuthorized(true);
      } else if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) setIsAuthorized(true);
      }
    };
    checkAuth();
    loadHistory();
  }, []);

  useEffect(() => {
    if (isDeveloping) {
      setTelemetryLogs([`实验室 [${engine}] 引擎初始化...`, "正在连接神经显影节点..."]);
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
  }, [isDeveloping, currentStep, engine]);

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setSourceImage(url);
    setResult(null);
    setShowSource(false);
  };

  const handleReset = () => {
    if (sourceImage && sourceImage.startsWith('blob:')) {
      URL.revokeObjectURL(sourceImage);
    }
    setSourceImage(null);
    setResult(null);
    setShowSource(false);
  };

  const handleDevelop = async () => {
    if (!sourceImage || !selectedCameraId) return;
    try {
      setIsDeveloping(true);
      engineController.setEngine(engine); // 切换后端引擎
      
      const { session } = await developPhotoUseCase.execute(
        sourceImage, 
        selectedCameraId, 
        intensity,
        developMode,
        (step) => setCurrentStep(step)
      );
      setResult({ session, url: session.outputUrl });
      setShowSource(false);
      loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("显影引擎故障:", error);
      alert('显影中断：远程神经引擎连接超时或请求参数错误。');
    } finally {
      setIsDeveloping(false);
    }
  };

  const handleDownload = (session?: DevelopSession) => {
    const target = session || result?.session;
    const url = session?.outputUrl || result?.url;
    if (target && url) {
      downloadAppService.downloadImage(url, `Leifi_${target.cameraName.replace(/\s+/g, '_')}_${target.outputMeta.mode}.png`);
    }
  };

  const handleHistorySelect = (session: DevelopSession) => {
    setResult({ session, url: session.outputUrl });
    setShowSource(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <Logo />
        <div className="mt-12 p-10 border border-neutral-800 bg-[#161616] max-w-sm shadow-2xl rounded-sm">
           <p className="text-white font-black mb-6 tracking-[0.3em] uppercase text-[11px]">正在唤醒显影神经引擎</p>
           <button onClick={() => window.aistudio?.openSelectKey().then(() => setIsAuthorized(true))} className="w-full h-16 bg-white text-black font-black tracking-[0.4em] hover:bg-[#E30613] hover:text-white transition-all uppercase text-[12px] active:scale-95">开始显影流程</button>
           <p className="mt-6 text-[8px] text-neutral-600 font-bold tracking-[0.2em] uppercase">© 2026 徕滤 / AI 光学与艺术</p>
        </div>
      </div>
    );
  }

  const modeColor = developMode === 'AGENTIC' ? '#D4AF37' : '#FFFFFF';
  const steps: WorkflowStep[] = ['ANALYZING_OPTICS', 'RETRIEVING_KNOWLEDGE', 'NEURAL_DEVELOPING', 'QUALITY_CHECKING'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 flex flex-col selection:bg-[#E30613]/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full px-6 py-2 md:px-12 flex flex-col gap-4 md:gap-6">
        <header className="flex items-end justify-between border-b border-neutral-900 pb-2 mt-4">
          <Logo />
          {/* 引擎切换器 */}
          <div className="flex bg-black/50 border border-neutral-800 p-0.5 rounded-sm mb-1">
             <button 
              onClick={() => setEngine('ALIBABA')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${engine === 'ALIBABA' ? 'bg-white text-black' : 'text-neutral-600 hover:text-neutral-400'}`}
             >
               Qwen / Wanx
             </button>
             <button 
              onClick={() => setEngine('GOOGLE')}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${engine === 'GOOGLE' ? 'bg-white text-black' : 'text-neutral-600 hover:text-neutral-400'}`}
             >
               Gemini
             </button>
          </div>
        </header>

        <section className="relative w-full">
          {sourceImage && !isDeveloping && (
            <div className="absolute top-4 left-4 z-40 flex gap-2">
              <button 
                onClick={handleReset}
                className="group flex items-center bg-black/60 backdrop-blur-3xl border border-white/5 px-4 h-10 rounded-full transition-all hover:bg-[#E30613] active:scale-95 shadow-2xl"
              >
                <span className="text-white text-[9px] font-black tracking-[0.2em] uppercase">重置实验室</span>
              </button>
            </div>
          )}

          {result && !showSource ? (
            <div className="max-w-5xl mx-auto transition-all duration-700 animate-fade-in">
               <ExifRibbon session={result.session} imageUrl={result.url} />
            </div>
          ) : (
            <div className="bg-[#161616] border border-neutral-900 shadow-2xl rounded-sm overflow-hidden aspect-video min-h-[400px] transition-all duration-1000 animate-fade-in">
              <Uploader image={sourceImage} onUpload={handleUpload} />
            </div>
          )}

          {result && sourceImage && !isDeveloping && (
            <div className="absolute top-4 right-4 z-40">
              <button 
                onClick={() => setShowSource(!showSource)}
                className="group flex items-center bg-black/60 backdrop-blur-3xl border border-white/5 px-4 h-10 rounded-full transition-all hover:bg-white active:scale-95 shadow-2xl"
              >
                <div className={`w-1 h-1 rounded-full transition-all duration-300 mr-2 ${showSource ? 'bg-neutral-600' : 'bg-[#E30613] shadow-[0_0_10px_#E30613]'}`}></div>
                <span className={`text-[9px] font-black tracking-[0.2em] uppercase transition-colors ${showSource ? 'text-neutral-500 group-hover:text-black' : 'text-white group-hover:text-black'}`}>
                  {showSource ? '显影预览' : '查看原片'}
                </span>
              </button>
            </div>
          )}

          {isDeveloping && (
            <div className="absolute inset-0 bg-[#0A0A0A]/98 backdrop-blur-3xl flex flex-col items-center justify-center z-50 transition-all duration-1000 p-8">
              <LaboratoryTimer active={isDeveloping} modeColor={modeColor} />

              <div className="flex flex-col md:flex-row items-start justify-center w-full max-w-6xl gap-12 animate-fade-in">
                <div className="flex-1 w-full flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[12px] tracking-[0.4em] uppercase font-black text-white/90 mb-1">
                        {developMode === 'AGENTIC' ? `大师模式 [${engine}] 显影协议` : `标准 AIGC [${engine}] 快显协议`}
                      </span>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">神经节点：在线同步</span>
                         <div className="w-1 h-1 bg-green-500 rounded-full shadow-[0_0_5px_green]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">显影流水线深度</span>
                      <span className="text-[10px] font-mono text-neutral-600">{Math.round((currentStepIndex + 1) / 4 * 100)}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      {steps.map((_, i) => (
                        <div key={i} className={`rounded-full transition-all duration-1000 ${i <= currentStepIndex ? 'bg-white' : 'bg-neutral-900'}`} style={{ backgroundColor: i <= currentStepIndex ? modeColor : undefined }} />
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-neutral-400 mt-2 uppercase tracking-widest animate-pulse h-4">
                      {WORKFLOW_LABELS[currentStep]}
                    </span>
                  </div>

                  <div className="bg-black/50 border border-neutral-900 p-5 rounded-sm font-mono text-[10px] h-48 overflow-hidden relative">
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>
                    <div className="flex flex-col gap-2">
                      {telemetryLogs.map((log, i) => (
                        <div key={i} className="flex gap-4 animate-fade-in opacity-80 border-l border-neutral-800/30 pl-3">
                          <span className="text-neutral-700 shrink-0 w-12 text-[9px]">DIAG_0{i+1}</span>
                          <span className={`${log.startsWith('[成功]') ? 'text-green-900/80' : 'text-neutral-500'} tracking-tight`}>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-80 flex flex-col gap-6">
                  <div className="flex flex-col gap-4 p-6 border border-neutral-800/50 bg-[#111] rounded-sm relative overflow-hidden min-h-[160px]">
                     <div className="absolute top-0 right-0 p-3 opacity-5">
                       <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                     </div>
                     <span className="text-[9px] font-black text-neutral-600 tracking-[0.3em] uppercase border-b border-neutral-800 pb-2">实验室显影洞察</span>
                     <p className="text-[12px] text-neutral-300 leading-relaxed font-medium transition-all duration-1000 italic pt-2">
                       “{LAB_INSIGHTS[insightIndex]}”
                     </p>
                  </div>

                  <div className="flex flex-col items-center gap-6 mt-4">
                    <div className="relative">
                       <div className="w-16 h-16 border-[3px] border-neutral-900 rounded-full"></div>
                       <div className="absolute inset-0 border-[3px] border-transparent border-t-white rounded-full animate-spin"></div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] tracking-[0.6em] text-neutral-600 uppercase font-black">深度显影中</span>
                      <span className="text-[8px] tracking-[0.2em] text-neutral-800 uppercase font-mono italic">正在校准光学常数...</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {developMode === 'AGENTIC' && <div className="absolute inset-0 bg-[#E30613]/5 pointer-events-none mix-blend-overlay"></div>}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6 py-2 border-b border-neutral-900 pb-6">
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
            <IntensitySlider value={intensity} onChange={setIntensity} disabled={isDeveloping} />
            <div className="flex-1 flex flex-col items-center gap-4 w-full">
              <div className="flex flex-col sm:flex-row gap-3 w-full h-14">
                {result && !isDeveloping && (
                   <button onClick={handleReset} className="w-14 bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all flex items-center justify-center active:scale-95" title="放弃显影并重置">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                   </button>
                )}
                <button 
                  onClick={handleDevelop} 
                  disabled={!sourceImage || isDeveloping} 
                  className={`flex-1 bg-white text-black font-black text-[14px] tracking-[0.5em] transition-all uppercase shadow-2xl active:scale-95
                    ${!sourceImage || isDeveloping ? 'opacity-10 cursor-not-allowed' : 'hover:bg-[#E30613] hover:text-white'}`}
                >
                  {result ? '再显影一次' : '开始显影'}
                </button>
                {result && (
                  <button onClick={() => handleDownload()} className="flex-1 bg-neutral-900 border border-neutral-800 text-white font-black text-[12px] tracking-[0.4em] hover:bg-neutral-800 transition-all uppercase active:scale-95 shadow-xl">
                    存储至档案库
                  </button>
                )}
              </div>

              {!isDeveloping && (
                <div className="flex items-center gap-1 bg-[#1A1A1A] p-1.5 border border-neutral-800/80 rounded-sm">
                  <button 
                    onClick={() => setDevelopMode('DIRECT')}
                    className={`group flex items-center gap-4 px-10 py-2.5 transition-all duration-500 relative overflow-hidden rounded-sm min-w-[150px]
                      ${developMode === 'DIRECT' ? 'bg-[#2A2A2A] shadow-2xl border border-white/5' : 'hover:bg-neutral-800/20'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${developMode === 'DIRECT' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-neutral-800'}`}></div>
                    <div className="flex flex-col items-start">
                      <span className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors ${developMode === 'DIRECT' ? 'text-white' : 'text-neutral-600'}`}>
                        AIGC 快显
                      </span>
                      <span className="text-[11px] font-mono opacity-80 uppercase tracking-tighter transition-colors group-hover:text-white">约 15-25秒</span>
                    </div>
                  </button>
                  <div className="w-px h-8 bg-neutral-800 mx-1"></div>
                  <button 
                    onClick={() => setDevelopMode('AGENTIC')}
                    className={`group flex items-center gap-4 px-10 py-2.5 transition-all duration-500 relative overflow-hidden rounded-sm min-w-[150px]
                      ${developMode === 'AGENTIC' ? 'bg-[#2A2A2A] shadow-2xl border border-[#D4AF37]/20' : 'hover:bg-neutral-800/20'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${developMode === 'AGENTIC' ? 'bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]' : 'bg-neutral-800'}`}></div>
                    <div className="flex flex-col items-start">
                      <span className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors ${developMode === 'AGENTIC' ? 'text-[#D4AF37]' : 'text-neutral-600'}`}>
                        Agent 大师
                      </span>
                      <span className="text-[11px] font-mono opacity-80 uppercase tracking-tighter transition-colors group-hover:text-white">约 45-90秒</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="w-full max-w-5xl mx-auto mt-2">
            <HistoryStrip 
              sessions={history} 
              onSelect={handleHistorySelect} 
              onDownload={handleDownload}
              onShowInfo={(session) => setInfoModalSession(session)}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <CameraPicker profiles={profiles} selectedId={selectedCameraId} onSelect={setSelectedCameraId} />
        </section>

        <footer className="mt-6 border-t border-neutral-900 pt-6 text-center pb-8 opacity-40">
           <p className="text-[9px] text-neutral-600 tracking-[0.5em] font-black uppercase">© 2026 徕滤 / AI 光学与艺术</p>
        </footer>
      </div>

      {infoModalSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setInfoModalSession(null)}></div>
          <div className="relative w-full max-w-6xl bg-[#161616] border border-neutral-800 shadow-2xl flex flex-col md:flex-row overflow-hidden rounded-sm animate-scale-in">
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center p-4 sm:p-8">
               <img src={infoModalSession.outputUrl} className="max-w-full max-h-[80vh] object-contain shadow-2xl" alt="Preview" />
            </div>
            <div className="w-full md:w-2/5 p-12 flex flex-col gap-10 overflow-y-auto no-scrollbar border-l border-neutral-900">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <h4 className="text-white text-3xl font-black tracking-tighter leading-none">{infoModalSession.cameraName}</h4>
                  <p className="text-neutral-500 text-[10px] uppercase tracking-[0.4em] font-bold">实验室 [${infoModalSession.engine}] 显影档案</p>
                </div>
                <button onClick={() => setInfoModalSession(null)} className="text-neutral-600 hover:text-white transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: infoModalSession.outputMeta.mode === 'AGENTIC' ? '#D4AF37' : '#FFFFFF' }}></div>
                      <span className="text-[10px] font-black tracking-[0.4em] uppercase" style={{ color: infoModalSession.outputMeta.mode === 'AGENTIC' ? '#D4AF37' : '#FFFFFF' }}>
                        {infoModalSession.outputMeta.mode === 'AGENTIC' ? '大师模式报告' : 'AIGC 显影协议'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopyPrompt(infoModalSession.outputMeta.promptUsed)}
                      className="text-[9px] font-black text-neutral-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2 group"
                    >
                      <svg className="w-3 h-3 transition-transform group-active:scale-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      {copyFeedback ? '已复制' : '复制技术文本'}
                    </button>
                  </div>
                  <div className="bg-[#0A0A0A] border border-neutral-800/50 p-6 rounded-sm relative group overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neutral-800 transition-colors group-hover:bg-[#E30613]"></div>
                    <div className="max-h-[350px] overflow-y-auto pr-3 scroll-thin">
                      <PromptFormatter text={infoModalSession.outputMeta.promptUsed} sources={infoModalSession.outputMeta.sources} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-t border-neutral-900 pt-8">
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[9px] font-black text-neutral-700 tracking-[0.2em] uppercase">显影强度</span>
                     <span className="text-white font-mono text-base">{Math.round(infoModalSession.outputMeta.intensity * 100)}%</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[9px] font-black text-neutral-700 tracking-[0.2em] uppercase">输出分辨率</span>
                     <span className="text-white font-mono text-base">{infoModalSession.outputMeta.width}p (HD)</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[9px] font-black text-neutral-700 tracking-[0.2em] uppercase">引擎标识</span>
                     <span className="text-white font-mono text-[13px] uppercase tracking-tight">{infoModalSession.engine}</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[9px] font-black text-neutral-700 tracking-[0.2em] uppercase">显影时间戳</span>
                     <span className="text-white font-mono text-[10px] leading-none opacity-60">
                       {new Date(infoModalSession.createdAt).toLocaleDateString()} {new Date(infoModalSession.createdAt).toLocaleTimeString([], { hour12: false })}
                     </span>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => { handleDownload(infoModalSession); setInfoModalSession(null); }} 
                className="mt-4 h-16 bg-white text-black font-black text-[12px] tracking-[0.5em] uppercase hover:bg-[#E30613] hover:text-white transition-all shadow-2xl active:scale-[0.98] rounded-sm"
              >
                下载高清原片
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { left: -100%; } 100% { left: 100%; } }
        .animate-scan { animation: scan 3s infinite cubic-bezier(0.45, 0.05, 0.55, 0.95); }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { display: none; }
        .scroll-thin::-webkit-scrollbar { width: 4px; display: block; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};
