import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Logo } from './components/Logo';
import { Uploader } from './components/Uploader';
import { CameraPicker } from './components/CameraPicker';
import { developPhotoUseCase, cameraCatalogUseCase, downloadAppService } from '../infrastructure/container';
import { CameraProfile, DevelopSession } from '../domain/types';

// Declare aistudio for window as per @google/genai coding guidelines
declare global {
  /* Fix: Define AIStudio interface to ensure identical modifiers and type compatibility for window.aistudio */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export const Home: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('leica-m3-rigid');
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<{ session: DevelopSession; url: string } | null>(null);
  const [profiles] = useState<CameraProfile[]>(() => cameraCatalogUseCase.getProfiles());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isDeployingInfo, setIsDeployingInfo] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. 优先尝试调用 AI Studio 官方选择器接口（如果存在）
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setIsAuthorized(true);
          return;
        }
      }
      
      // 2. 检查由 Vite 注入的 process.env.API_KEY
      const key = process.env.API_KEY;
      if (key && key.length > 5) {
        setIsAuthorized(true);
      } else {
        setIsDeployingInfo(true);
      }
    };
    checkAuth();
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
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setIsAuthorized(true);
    } else {
      window.open('https://vercel.com/docs/concepts/projects/environment-variables#redeploying-to-apply-changes', '_blank');
    }
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
      console.error("Development Error:", error);
      const msg = error.message || "";
      if (msg.includes("API Key must be set") || msg === "MISSING_API_KEY") {
        alert('API 密钥未生效。请在 Vercel 后台点击 "Redeploy" 以应用您刚刚设置的环境变量。');
        setIsAuthorized(false);
        setIsDeployingInfo(true);
      } else if (msg.includes("Requested entity was not found.")) {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
          setIsAuthorized(true);
        }
      } else {
        alert('显影失败：请检查 API 密钥是否有效并已开启计费（Billing）。');
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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <Logo />
        <div className="mt-8 max-w-md text-neutral-500 text-[12px] tracking-wide mb-12 leading-relaxed">
          {isDeployingInfo ? (
            <div className="border border-[#E30613]/30 p-6 bg-[#E30613]/5 rounded-sm">
              <p className="text-white font-bold mb-4 uppercase tracking-[0.2em]">需要重新部署 / ACTION REQUIRED</p>
              <p className="mb-4">检测到您已在 Vercel 配置密钥，但当前网页仍在使用旧版本。</p>
              <p className="text-[#E30613] font-black">请前往控制台 &rarr; 部署 &rarr; 点击最近一次部署 &rarr; 选择 重新部署。</p>
            </div>
          ) : (
            <>
              为了开启 2K 高清神经合成引擎，需要连接 Google Gemini API 密钥。
              <br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-white transition-colors block my-2">
                了解账单与计费 (Billing)
              </a>
              <span className="text-neutral-700 italic">LEIFI LAB 采用 DDD 架构，确保您的影像在本地完成预处理。</span>
            </>
          )}
        </div>
        <button 
          onClick={handleOpenKeySelector} 
          className="h-16 px-12 bg-white text-black font-black tracking-[0.4em] hover:bg-[#E30613] hover:text-white transition-all uppercase active:scale-95 shadow-2xl"
        >
          {isDeployingInfo ? "查看部署指引" : "连接密钥 / CONNECT KEY"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-neutral-200 flex flex-col selection:bg-[#E30613]/30 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full px-6 py-8 md:px-12 md:py-16 flex flex-col gap-12 md:gap-24">
        <header className="flex items-end justify-between border-b border-neutral-900 pb-12">
          <Logo />
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-neutral-500 uppercase tracking-[0.5em] font-black">PRECISION NEURAL SYNTHESIS</span>
          </div>
        </header>

        <section className={`relative w-full bg-[#161616] border border-neutral-900 shadow-2xl rounded-sm overflow-hidden transition-all duration-700
          ${result ? 'min-h-[400px]' : 'aspect-video min-h-[350px] md:min-h-[500px]'}`}>
          
          {result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full bg-neutral-900 gap-[1px]">
               <div className="relative aspect-auto md:h-[600px] flex items-center justify-center group cursor-zoom-in bg-black overflow-hidden" onClick={() => setPreviewImage(sourceImage)}>
                 <div className="absolute inset-0 p-10 flex items-center justify-center">
                   <img src={sourceImage!} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-[1.02]" alt="Original" />
                 </div>
                 <div className="absolute top-6 left-6 text-[8px] font-black tracking-[0.4em] text-white/30 uppercase z-20">原始影像 / Source</div>
               </div>
               <div className="relative aspect-auto md:h-[600px] flex items-center justify-center group cursor-zoom-in bg-black border-t md:border-t-0 md:border-l border-neutral-900 overflow-hidden" onClick={() => setPreviewImage(result.url)}>
                 <div className="absolute inset-0 p-10 flex items-center justify-center">
                   <img src={result.url} className="max-w-full max-h-full object-contain animate-fade-in transition-transform duration-700 group-hover:scale-[1.02]" alt="Developed" />
                 </div>
                 <div className="absolute top-6 left-6 text-[8px] font-black tracking-[0.4em] text-[#E30613] uppercase z-20">AI 显影 / Developed</div>
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

        <section className="flex flex-col gap-12 pt-20 border-t border-neutral-900">
          <div className="flex flex-col gap-2">
            <h3 className="text-[12px] font-black text-white uppercase tracking-[0.6em]">光学预设目录 / Optical Catalog</h3>
            <p className="text-[10px] text-neutral-600 font-mono tracking-widest uppercase">Select your emulated optical instrument</p>
          </div>
          <CameraPicker profiles={profiles} selectedId={selectedCameraId} onSelect={setSelectedCameraId} />
        </section>

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
