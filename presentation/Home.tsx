
import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './components/Logo';
import { Uploader } from './components/Uploader';
import { CameraPicker } from './components/CameraPicker';
import { IntensitySlider } from './components/IntensitySlider';
import { ExifRibbon } from './components/ExifRibbon';
import { HistoryStrip } from './components/HistoryStrip';
import { developPhotoUseCase, cameraCatalogUseCase, downloadAppService } from '../infrastructure/container';
import { CameraProfile, DevelopSession } from '../domain/types';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export const Home: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('leica-m3-rigid');
  const [intensity, setIntensity] = useState(1.0);
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<{ session: DevelopSession; url: string } | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [history, setHistory] = useState<DevelopSession[]>([]);
  const [profiles] = useState<CameraProfile[]>(() => cameraCatalogUseCase.getProfiles());
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  
  const [infoModalSession, setInfoModalSession] = useState<DevelopSession | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const loadHistory = async () => {
    try {
      const sessions = await (developPhotoUseCase as any).sessionRepo.getAll();
      setHistory(sessions);
    } catch (e) {
      console.error("加载历史底片失败", e);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      setIsCloudEnabled(!!(blobToken && blobToken.length > 0));

      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) { setIsAuthorized(true); return; }
      }
      const key = process.env.API_KEY;
      if (key && key.length > 5) setIsAuthorized(true);
    };
    checkAuth();
    loadHistory();
  }, []);

  useEffect(() => {
    if (isDeveloping) {
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isDeveloping]);

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setSourceImage(url);
    setResult(null);
    setShowSource(false);
  };

  const handleDevelop = async () => {
    if (!sourceImage || !selectedCameraId) return;
    try {
      setIsDeveloping(true);
      const { session } = await developPhotoUseCase.execute(sourceImage, selectedCameraId, intensity);
      setResult({ session, url: session.outputUrl });
      setShowSource(false);
      loadHistory();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error("显影错误:", error);
      const msg = error.message || "";
      if (msg.includes("API key expired")) { setErrorMessage("显影密钥已过期"); setIsAuthorized(false); }
      else if (msg.includes("Requested entity was not found.")) { if (window.aistudio) await window.aistudio.openSelectKey(); }
      else alert(`显影失败: ${error.message || '系统繁忙，请稍后再试'}`);
    } finally {
      setIsDeveloping(false);
    }
  };

  const handleDownload = (session?: DevelopSession) => {
    const target = session || result?.session;
    const url = session?.outputUrl || result?.url;
    if (target && url) {
      downloadAppService.downloadImage(url, `徕滤_${target.cameraName.replace(/\s+/g, '_')}_${Math.round(target.outputMeta.intensity*100)}.png`);
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
      console.error('复制失败: ', err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <Logo />
        <div className="mt-12 p-10 border border-neutral-800 bg-[#161616] max-w-sm shadow-2xl">
           <p className="text-white font-black mb-6 tracking-[0.3em] uppercase text-[11px]">正在初始化显影环境</p>
           {errorMessage && <p className="text-[#E30613] text-[10px] mb-6 font-black tracking-widest">{errorMessage}</p>}
           <button onClick={() => window.aistudio?.openSelectKey().then(() => setIsAuthorized(true))} className="w-full h-16 bg-white text-black font-black tracking-[0.4em] hover:bg-[#E30613] hover:text-white transition-all uppercase text-[12px] active:scale-95">开启显影权限</button>
           <p className="mt-6 text-[8px] text-neutral-600 font-bold tracking-[0.2em] uppercase">徕滤实验室 / 神经光学重构系统</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 flex flex-col selection:bg-[#E30613]/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto w-full px-6 py-8 md:px-12 md:py-16 flex flex-col gap-12 md:gap-20">
        <header className="flex items-end justify-between border-b border-neutral-900 pb-12">
          <Logo />
          <div className="text-right hidden sm:flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isCloudEnabled ? 'bg-[#E30613] shadow-[0_0_8px_rgba(227,6,19,0.8)]' : 'bg-neutral-700'}`}></div>
              <span className="text-[10px] text-neutral-500 uppercase tracking-[0.5em] font-black">
                {isCloudEnabled ? '全球云端同步已开启' : '本地显影模式'}
              </span>
            </div>
            <span className="text-[8px] text-neutral-800 font-mono tracking-widest uppercase">
              {isCloudEnabled ? 'Synced with Vercel Blob' : 'Standalone Local Session'}
            </span>
          </div>
        </header>

        <section className="relative w-full">
          {result && !showSource ? (
            <div className="max-w-5xl mx-auto transition-all duration-700 animate-fade-in">
               <ExifRibbon session={result.session} imageUrl={result.url} onCopyPrompt={handleCopyPrompt} />
            </div>
          ) : (
            <div className="bg-[#161616] border border-neutral-900 shadow-2xl rounded-sm overflow-hidden aspect-video min-h-[400px] transition-all duration-700 animate-fade-in">
              <Uploader image={sourceImage} onUpload={handleUpload} />
            </div>
          )}

          {result && sourceImage && (
            <div className="absolute top-8 right-8 z-40">
              <button 
                onClick={() => setShowSource(!showSource)}
                className="group flex items-center bg-black/70 backdrop-blur-2xl border border-white/10 px-4 h-10 rounded-full transition-all hover:bg-white hover:border-white active:scale-95 shadow-2xl"
              >
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 mr-3 shadow-[0_0_8px_rgba(227,6,19,0.5)] ${showSource ? 'bg-neutral-400' : 'bg-[#E30613]'}`}></div>
                <span className={`text-[10px] font-black tracking-[0.2em] uppercase transition-colors ${showSource ? 'text-neutral-400 group-hover:text-black' : 'text-white group-hover:text-black'}`}>
                  {showSource ? '切换显影' : '切换原图'}
                </span>
              </button>
            </div>
          )}

          {isDeveloping && (
            <div className="absolute inset-0 bg-[#121212]/98 backdrop-blur-2xl flex flex-col items-center justify-center z-50">
              <div className="text-[64px] font-mono font-black text-white tabular-nums tracking-tighter mb-2">
                {elapsedTime.toFixed(1)}<span className="text-[#E30613] text-2xl ml-1 font-sans">秒</span>
              </div>
              <div className="text-[10px] tracking-[1.2em] text-neutral-500 uppercase font-black pl-[1.2em]">正在进行神经光学重构模拟...</div>
              <div className="mt-12 w-64 h-px bg-neutral-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#E30613] animate-scan"></div>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-16 py-8 border-b border-neutral-900 pb-24">
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-16 max-w-5xl mx-auto">
            <IntensitySlider value={intensity} onChange={setIntensity} disabled={isDeveloping} />
            
            <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full h-20">
              <button 
                onClick={handleDevelop} 
                disabled={!sourceImage || isDeveloping} 
                className={`flex-1 bg-white text-black font-black text-[14px] tracking-[0.5em] transition-all uppercase shadow-xl active:scale-95
                  ${!sourceImage || isDeveloping ? 'opacity-10 cursor-not-allowed' : 'hover:bg-[#E30613] hover:text-white'}`}
              >
                {result ? '重新显影' : '开始显影'}
              </button>
              
              {result && (
                <>
                  <button onClick={() => handleDownload()} className="flex-1 bg-neutral-900 border border-neutral-800 text-white font-black text-[12px] tracking-[0.4em] hover:bg-neutral-800 transition-all uppercase active:scale-95">
                    保存作品
                  </button>
                  <button onClick={() => {setResult(null); setSourceImage(null);}} className="px-10 border border-neutral-900 text-neutral-500 text-[9px] font-black tracking-[0.3em] hover:bg-neutral-900 transition-all uppercase active:scale-95">
                    重置
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="w-full max-w-5xl mx-auto">
            <HistoryStrip 
              sessions={history} 
              onSelect={handleHistorySelect} 
              onDownload={handleDownload}
              onShowInfo={(session) => setInfoModalSession(session)}
            />
          </div>
        </section>

        <section className="flex flex-col gap-12">
          <div className="flex items-center gap-4">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.8em]">光学预设目录</h3>
            <div className="flex-1 h-px bg-neutral-900"></div>
          </div>
          <CameraPicker profiles={profiles} selectedId={selectedCameraId} onSelect={setSelectedCameraId} />
        </section>

        <footer className="mt-20 text-center pb-24 opacity-30">
           <p className="text-[9px] text-neutral-500 tracking-[0.5em] font-black uppercase">© 2024 徕滤实验室 / 高精度光学合成系统 / 慕尼黑 - 东京</p>
        </footer>
      </div>

      {/* 信息模态框 */}
      {infoModalSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setInfoModalSession(null)}></div>
          <div className="relative w-full max-w-4xl bg-[#161616] border border-neutral-800 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-in">
            <div className="w-full md:w-1/2 bg-black flex items-center justify-center p-4">
               <img src={infoModalSession.outputUrl} className="max-w-full max-h-[70vh] object-contain shadow-2xl" alt="预览" />
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col gap-8 overflow-y-auto max-h-[70vh] md:max-h-none no-scrollbar">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white text-xl font-bold tracking-tight">{infoModalSession.cameraName}</h4>
                  <p className="text-neutral-500 text-[10px] uppercase tracking-[0.3em] mt-1">显影档案详细信息</p>
                </div>
                <button onClick={() => setInfoModalSession(null)} className="text-neutral-600 hover:text-white transition-colors">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-[#E30613] tracking-[0.3em] uppercase">神经显影指令</span>
                    <button 
                      onClick={() => handleCopyPrompt(infoModalSession.outputMeta.promptUsed)}
                      className={`h-9 px-4 rounded-full text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2
                        ${copyFeedback ? 'bg-[#E30613] text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-white hover:text-black'}`}
                    >
                      {copyFeedback ? (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                          已复制指令
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1"/>
                          </svg>
                          复制提示词
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-black/60 border border-neutral-800 p-5 rounded-sm relative group">
                    <p className="text-neutral-400 text-[12px] font-mono leading-relaxed whitespace-pre-wrap selection:bg-white/10">
                      {infoModalSession.outputMeta.promptUsed}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-6">
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-neutral-600 tracking-[0.2em] uppercase">强度等级</span>
                     <span className="text-white font-mono text-sm">{Math.round(infoModalSession.outputMeta.intensity * 100)}%</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-neutral-600 tracking-[0.2em] uppercase">显影时间</span>
                     <span className="text-white font-mono text-sm">{new Date(infoModalSession.createdAt).toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-neutral-600 tracking-[0.2em] uppercase">档案编号</span>
                     <span className="text-white font-mono text-sm uppercase">{infoModalSession.sessionId.split('_')[1]}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-neutral-600 tracking-[0.2em] uppercase">分辨率</span>
                     <span className="text-white font-mono text-sm">{infoModalSession.outputMeta.width} x {infoModalSession.outputMeta.height}</span>
                   </div>
                </div>
              </div>

              <div className="mt-auto pt-6 flex gap-4">
                <button 
                  onClick={() => { handleDownload(infoModalSession); setInfoModalSession(null); }}
                  className="flex-1 h-12 bg-white text-black font-black text-[11px] tracking-[0.4em] uppercase hover:bg-[#E30613] hover:text-white transition-all"
                >
                  保存此版本影像
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { left: -100%; } 100% { left: 100%; } }
        .animate-scan { animation: scan 2s infinite ease-in-out; }
        ::-webkit-scrollbar { display: none; }
        body { background-color: #121212; scroll-behavior: smooth; }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};
