
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Logo } from './components/Logo';
import { Uploader } from './components/Uploader';
import { CameraPicker } from './components/CameraPicker';
import { developPhotoUseCase, cameraCatalogUseCase, downloadAppService } from '../infrastructure/container';
import { CameraProfile, DevelopSession } from '../domain/types';

export const Home: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('leica-m3-rigid');
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<{ session: DevelopSession; url: string } | null>(null);
  const [profiles] = useState<CameraProfile[]>(() => cameraCatalogUseCase.getProfiles());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if ((window as any).aistudio) {
          const selected = await (window as any).aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } else {
          setHasKey(true);
        }
      } catch (e) {
        setHasKey(true);
      }
    };
    checkApiKey();
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

  const selectedProfile = useMemo(() => 
    profiles.find(p => p.id === selectedCameraId), 
    [selectedCameraId, profiles]
  );

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
    }
    setHasKey(true);
  };

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setSourceImage(url);
    setResult(null);
  };

  const handleDevelop = async () => {
    if (!sourceImage || !selectedCameraId) return;
    try {
      setIsDeveloping(true);
      const { session } = await developPhotoUseCase.execute(sourceImage, selectedCameraId);
      setResult({ session, url: session.outputUrl });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'API_KEY_INVALID' && (window as any).aistudio) {
        setHasKey(false);
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
      } else {
        alert('AI 显影引擎遇到阻碍，请检查配置。');
      }
    } finally {
      setIsDeveloping(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadAppService.downloadImage(result.url, `Leifi_PRO_${result.session.cameraName.replace(/\s+/g, '_')}.png`);
    }
  };

  const handleReset = () => {
    setSourceImage(null);
    setSelectedCameraId('leica-m3-rigid');
    setResult(null);
    setIsDeveloping(false);
    setElapsedTime(0);
    setPreviewImage(null);
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <Logo />
        <div className="mt-8 max-w-sm text-neutral-500 text-[12px] tracking-wide mb-8">
          本应用需要连接 API 密钥以调用 Gemini 3 Pro 高级显影引擎。
        </div>
        <button onClick={handleOpenKeySelector} className="h-16 px-12 bg-white text-black font-black tracking-[0.4em] hover:bg-[#E30613] hover:text-white transition-all uppercase">
          连接密钥 / CONNECT
        </button>
      </div>
    );
  }

  if (hasKey === null) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><div className="w-12 h-px bg-[#E30613] animate-pulse"></div></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 flex flex-col selection:bg-[#E30613]/30 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full px-6 py-8 md:px-12 md:py-16 flex flex-col gap-12 md:gap-24">
        
        <header className="flex items-end justify-between border-b border-neutral-900 pb-12">
          <Logo />
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-neutral-500 uppercase tracking-[0.5em] font-black">PRECISION NEURAL SYNTHESIS</span>
          </div>
        </header>

        {/* 核心对称視图区域 */}
        <section className={`relative w-full bg-[#161616] border border-neutral-900 shadow-2xl rounded-sm overflow-hidden transition-all duration-700
          ${result ? 'min-h-[400px]' : 'aspect-video min-h-[350px] md:min-h-[500px]'}`}>
          
          {result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full bg-neutral-900 gap-[1px]">
               {/* 原始影像沙箱 */}
               <div className="relative aspect-auto md:h-[600px] flex items-center justify-center group cursor-zoom-in bg-black overflow-hidden" onClick={() => setPreviewImage(sourceImage)}>
                 <div className="absolute inset-0 p-10 flex items-center justify-center">
                   <img src={sourceImage!} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" alt="Original" />
                 </div>
                 <div className="absolute top-6 left-6 text-[8px] font-black tracking-[0.4em] text-white/30 uppercase z-20">原始影像 / Source</div>
                 <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors z-10"></div>
               </div>
               
               {/* 显影影像沙箱 */}
               <div className="relative aspect-auto md:h-[600px] flex items-center justify-center group cursor-zoom-in bg-black border-t md:border-t-0 md:border-l border-neutral-900 overflow-hidden" onClick={() => setPreviewImage(result.url)}>
                 <div className="absolute inset-0 p-10 flex items-center justify-center">
                   <img src={result.url} className="max-w-full max-h-full object-contain animate-fade-in transition-transform duration-700 group-hover:scale-[1.02]" alt="Developed" />
                 </div>
                 <div className="absolute top-6 left-6 text-[8px] font-black tracking-[0.4em] text-[#E30613] uppercase z-20">AI 显影 / Developed</div>
                 <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors z-10"></div>
               </div>
            </div>
          ) : (
            <Uploader image={sourceImage} onUpload={handleUpload} />
          )}

          {isDeveloping && (
            <div className="absolute inset-0 bg-[#121212]/95 backdrop-blur-xl flex flex-col items-center justify-center z-50">
              <div className="text-[42px] font-mono font-black text-white tabular-nums tracking-tighter">
                {elapsedTime.toFixed(1)}<span className="text-[#E30613] text-xl ml-1">S</span>
              </div>
              <div className="mt-4 text-[10px] tracking-[1em] text-neutral-500 uppercase font-black">正在执行光学神经显影</div>
              <div className="mt-8 w-32 h-px bg-neutral-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#E30613] animate-scan"></div>
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col items-center gap-8 py-4">
          <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-4 max-w-4xl mx-auto">
            {!result ? (
              <button 
                onClick={handleDevelop} 
                disabled={!sourceImage || isDeveloping} 
                className={`flex-1 h-20 bg-white text-black font-black text-[13px] tracking-[0.5em] transition-all
                  ${!sourceImage || isDeveloping ? 'opacity-10 cursor-not-allowed' : 'hover:bg-[#E30613] hover:text-white active:scale-95'}`}
              >
                AI 显影 / SHOOT
              </button>
            ) : (
              <button onClick={handleDownload} className="flex-1 h-20 bg-white text-black font-black text-[13px] tracking-[0.5em] hover:bg-neutral-200 transition-all active:scale-95">
                保存影像 / SAVE
              </button>
            )}
            
            <div className="flex gap-4">
               {result && (
                <button onClick={() => setResult(null)} className="px-10 h-20 border border-neutral-800 text-neutral-400 text-[10px] font-black tracking-[0.3em] hover:bg-neutral-900 transition-all uppercase">
                  重拍 / RETAKE
                </button>
              )}
              <button onClick={handleReset} className="px-10 h-20 border border-transparent text-neutral-700 text-[10px] font-black tracking-[0.3em] hover:text-neutral-400 transition-all uppercase">
                重置 / RESET
              </button>
            </div>
          </div>
        </section>

        {/* 动态内容区块：显影前显示 Picker，显影后显示风格解析 */}
        {result ? (
          <section className="animate-fade-in grid md:grid-cols-[1fr,2fr] gap-12 pt-12 border-t border-neutral-900">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">会话元数据 / Session Meta</span>
                <div className="h-px w-full bg-neutral-900"></div>
              </div>
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 text-white opacity-40" dangerouslySetInnerHTML={{ __html: selectedProfile?.icon.value || '' }}></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-700 uppercase font-mono">光学模拟预设</span>
                    <span className="text-[18px] font-bold text-white uppercase">{result.session.cameraName}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pl-16">
                  <span className="text-[9px] text-neutral-700 uppercase font-mono">神经算力引擎</span>
                  <span className="text-[14px] font-bold text-[#E30613] uppercase">Gemini 3 Pro Vision</span>
                </div>
              </div>
            </div>
            <div className="bg-[#161616] p-10 border border-neutral-900 flex items-center rounded-sm">
              <p className="text-neutral-400 text-[16px] md:text-[18px] font-light leading-relaxed italic tracking-wide">
                {selectedProfile?.description}
              </p>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-12 pt-20 border-t border-neutral-900">
            <div className="flex flex-col gap-2">
              <h3 className="text-[12px] font-black text-white uppercase tracking-[0.6em]">光学预设目录 / Optical Catalog</h3>
              <p className="text-[10px] text-neutral-600 font-mono tracking-widest uppercase">Select your emulated optical instrument</p>
            </div>
            <CameraPicker profiles={profiles} selectedId={selectedCameraId} onSelect={setSelectedCameraId} />
          </section>
        )}

        <footer className="mt-12 text-center border-t border-neutral-900 pt-20 pb-20">
          <div className="flex flex-col items-center gap-6 opacity-30">
            <div className="flex gap-8 text-[9px] font-black tracking-[0.5em] uppercase grayscale">
              <span>Leica</span><span>Fujifilm</span><span>Hasselblad</span><span>Ricoh</span>
            </div>
            <p className="text-[8px] text-neutral-700 tracking-[0.4em] font-black uppercase">© 2024 LEIFI LABS / PRECISION OPTICAL SYNTHESIS</p>
          </div>
        </footer>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full object-contain animate-scale-up shadow-2xl" alt="Full Preview" />
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-up { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes scan { 0% { left: -100%; } 100% { left: 100%; } }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scan { animation: scan 1.5s infinite linear; }
        ::-webkit-scrollbar { display: none; }
        body { background-color: #121212; overflow-y: scroll; }
      `}</style>
    </div>
  );
};
