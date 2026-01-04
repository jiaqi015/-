
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
import { EnvService } from '../infrastructure/envService';

const sessionRepo = new LocalSessionRepository();

const LaboratoryTimer: React.FC<{ active: boolean; modeColor: string }> = ({ active, modeColor }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const startTime = Date.now();
    const interval = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 50);
    return () => clearInterval(interval);
  }, [active]);
  const timeStr = elapsed.toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 mb-10 select-none">
      <div className="bg-black/60 border border-white/5 px-12 py-5 rounded-sm backdrop-blur-3xl shadow-2xl">
        <div className="flex items-baseline font-mono font-black tabular-nums tracking-tighter">
          <div className="flex text-[64px] text-white" style={{ textShadow: `0 0 40px ${modeColor}44` }}>
            {timeStr.split('').map((char, i) => (
              <div key={i} className={`${char === '.' ? 'w-[20px]' : 'w-[42px]'} flex justify-center`}>{char}</div>
            ))}
          </div>
          <span className="text-[18px] ml-4 font-sans opacity-40 uppercase tracking-[0.6em] font-bold" style={{ color: modeColor }}>SEC</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#E30613]"></div>
        <span className="text-[10px] tracking-[0.5em] uppercase font-black text-neutral-600">Optic Lab Processing</span>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [alibabaKey, setAlibabaKey] = useState(() => EnvService.getAlibabaApiKey());
  const [googleKey, setGoogleKey] = useState(() => EnvService.getGoogleApiKey());
  const [proxy, setProxy] = useState(() => EnvService.getCorsProxy());

  if (!isOpen) return null;

  const handleSave = () => {
    EnvService.setConfigs({ alibaba: alibabaKey, google: googleKey, proxy: proxy });
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-neutral-800 p-8 shadow-2xl rounded-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-black tracking-widest uppercase text-sm">实验室环境配置</h3>
            <span className="text-[10px] text-neutral-500 font-mono tracking-tighter">LEIFI LAB INFRASTRUCTURE v3.1.3</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">✕</button>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Alibaba DashScope Key</label>
            <input type="password" value={alibabaKey} onChange={e => setAlibabaKey(e.target.value)} placeholder="sk-..." className="bg-black border border-neutral-800 p-3 text-xs text-white focus:border-[#E30613] outline-none transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Google Gemini Key</label>
            <input type="password" value={googleKey} onChange={e => setGoogleKey(e.target.value)} placeholder="AIza..." className="bg-black border border-neutral-800 p-3 text-xs text-white focus:border-[#E30613] outline-none transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">CORS Proxy 地址 (阿里引擎必须)</label>
            <input type="text" value={proxy} onChange={e => setProxy(e.target.value)} placeholder="https://cors-anywhere.herokuapp.com/" className="bg-black border border-neutral-800 p-3 text-xs text-white focus:border-[#E30613] outline-none transition-all" />
            <div className="bg-red-500/10 border border-red-500/20 p-3 mt-1">
               <p className="text-[9px] text-red-400 font-bold leading-relaxed">
                 * 重要：阿里百炼 API 不支持前端跨域直连。
               </p>
               <p className="text-[8px] text-red-400/70 mt-1 leading-relaxed">
                 推荐使用 cors-anywhere 或自定义 Nginx 代理。
                 <br/>若使用 cors-anywhere，请务必先访问其官网点击“Request temporary access”。
               </p>
            </div>
          </div>
        </div>
        <button onClick={handleSave} className="w-full mt-10 h-14 bg-white text-black font-black text-[11px] tracking-[0.3em] uppercase hover:bg-[#E30613] hover:text-white transition-all shadow-lg active:scale-95">更新并重启引擎</button>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('leica-m3-rigid');
  const [intensity, setIntensity] = useState(1.0);
  const [developMode, setDevelopMode] = useState<DevelopMode>('DIRECT');
  const [engine, setEngine] = useState<EngineProvider>(() => EnvService.isAlibabaReady() ? 'ALIBABA' : 'GOOGLE');
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('ANALYZING_OPTICS');
  const [result, setResult] = useState<{ session: DevelopSession; url: string } | null>(null);
  const [history, setHistory] = useState<DevelopSession[]>([]);
  const [profiles] = useState<CameraProfile[]>(() => cameraCatalogUseCase.getProfiles());
  const [infoModalSession, setInfoModalSession] = useState<DevelopSession | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const sessions = await sessionRepo.getAll();
    setHistory(sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  };

  const handleUpload = (file: File) => {
    setSourceImage(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDevelop = async () => {
    if (!sourceImage || !selectedCameraId) return;
    try {
      setIsDeveloping(true);
      engineController.setEngine(engine);
      const { session } = await developPhotoUseCase.execute(sourceImage, selectedCameraId, intensity, developMode, setCurrentStep);
      setResult({ session, url: session.outputUrl });
      loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("显影故障:", error);
      // 捕获特定错误信息，更智能地引导设置
      if (error.message.includes('CORS')) {
        setIsSettingsOpen(true);
      }
      alert(`显影中断：${error.message}`);
    } finally { setIsDeveloping(false); }
  };

  const modeColor = developMode === 'AGENTIC' ? '#D4AF37' : '#FFFFFF';
  const steps: WorkflowStep[] = ['ANALYZING_OPTICS', 'RETRIEVING_KNOWLEDGE', 'NEURAL_DEVELOPING', 'QUALITY_CHECKING'];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 flex flex-col overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full px-6 py-2 md:px-12 flex flex-col gap-4">
        <header className="flex items-end justify-between border-b border-neutral-900 pb-2 mt-4">
          <Logo />
          <div className="flex items-center gap-4">
             <div className="flex bg-black/50 border border-neutral-800 p-0.5 rounded-sm">
               <button onClick={() => setEngine('ALIBABA')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${engine === 'ALIBABA' ? 'bg-white text-black' : 'text-neutral-600 hover:text-neutral-400'}`}>Qwen/Wanx</button>
               <button onClick={() => setEngine('GOOGLE')} className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${engine === 'GOOGLE' ? 'bg-white text-black' : 'text-neutral-600 hover:text-neutral-400'}`}>Gemini</button>
             </div>
             <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-neutral-500 hover:text-white transition-colors">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
             </button>
          </div>
        </header>

        <section className="relative w-full">
          {isDeveloping && (
            <div className="absolute inset-0 bg-[#0A0A0A]/98 backdrop-blur-3xl flex flex-col items-center justify-center z-50 p-8">
              <LaboratoryTimer active={isDeveloping} modeColor={modeColor} />
              <div className="w-full max-w-md flex flex-col gap-8">
                  <span className="text-[10px] tracking-[0.4em] uppercase font-black text-white/90 text-center">引擎：{engine} | 模式：{developMode}</span>
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    {steps.map((_, i) => (
                      <div key={i} className={`rounded-full transition-all duration-1000 ${i <= currentStepIndex ? 'bg-white' : 'bg-neutral-900'}`} style={{ backgroundColor: i <= currentStepIndex ? modeColor : undefined }} />
                    ))}
                  </div>
              </div>
            </div>
          )}
          {result && !isDeveloping ? <ExifRibbon session={result.session} imageUrl={result.url} /> : <div className="bg-[#161616] border border-neutral-900 aspect-video rounded-sm overflow-hidden shadow-2xl"><Uploader image={sourceImage} onUpload={handleUpload} /></div>}
        </section>

        <section className="flex flex-col gap-6 py-2 border-b border-neutral-900 pb-6">
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
            <IntensitySlider value={intensity} onChange={setIntensity} disabled={isDeveloping} />
            <div className="flex-1 flex gap-2 h-14 w-full">
              <button onClick={() => setDevelopMode(prev => prev === 'DIRECT' ? 'AGENTIC' : 'DIRECT')} disabled={isDeveloping} className={`px-6 text-[9px] font-black uppercase tracking-widest transition-all border ${developMode === 'AGENTIC' ? 'bg-[#D4AF37] border-[#D4AF37] text-black' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
                {developMode === 'AGENTIC' ? '大师模式' : '标准模式'}
              </button>
              <button onClick={handleDevelop} disabled={!sourceImage || isDeveloping} className={`flex-1 bg-white text-black font-black tracking-[0.5em] transition-all uppercase ${!sourceImage || isDeveloping ? 'opacity-10' : 'hover:bg-[#E30613] hover:text-white'}`}>开始显影</button>
            </div>
          </div>
          <HistoryStrip sessions={history} onSelect={s => setResult({session: s, url: s.outputUrl})} onDownload={d => downloadAppService.downloadImage(d.outputUrl, `Leifi_${d.cameraName}.png`)} onShowInfo={setInfoModalSession} />
        </section>
        <section><CameraPicker profiles={profiles} selectedId={selectedCameraId} onSelect={setSelectedCameraId} /></section>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {infoModalSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/98" onClick={() => setInfoModalSession(null)}></div>
          <div className="relative w-full max-w-6xl bg-[#161616] border border-neutral-800 flex flex-col md:flex-row overflow-hidden rounded-sm">
            <div className="w-full md:w-3/5 bg-black p-8 flex items-center justify-center"><img src={infoModalSession.outputUrl} className="max-w-full max-h-[80vh] shadow-2xl" /></div>
            <div className="w-full md:w-2/5 p-12 flex flex-col gap-10 border-l border-neutral-900 overflow-y-auto">
              <h4 className="text-white text-3xl font-black">{infoModalSession.cameraName}</h4>
              <div className="bg-[#0A0A0A] p-6 rounded-sm text-[10px] font-mono leading-relaxed text-neutral-400 whitespace-pre-wrap">{infoModalSession.outputMeta.promptUsed}</div>
              <button onClick={() => { downloadAppService.downloadImage(infoModalSession.outputUrl, `Leifi_${infoModalSession.cameraName}.png`); setInfoModalSession(null); }} className="h-16 bg-white text-black font-black tracking-[0.5em] uppercase hover:bg-[#E30613] hover:text-white transition-all">下载高清原片</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
