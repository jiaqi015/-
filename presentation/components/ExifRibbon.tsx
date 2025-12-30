
import React, { useState } from 'react';
import { DevelopSession } from '../../domain/types';

interface ExifRibbonProps {
  session: DevelopSession;
  imageUrl: string;
  onCopyPrompt?: (text: string) => void;
}

export const ExifRibbon: React.FC<ExifRibbonProps> = ({ session, imageUrl, onCopyPrompt }) => {
  const [copying, setCopying] = useState(false);
  const dateStr = new Date(session.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '.');

  const handleCopy = () => {
    if (onCopyPrompt) {
      onCopyPrompt(session.outputMeta.promptUsed);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  return (
    <div className="flex flex-col bg-white p-6 sm:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-fade-in group selection:bg-neutral-200 relative">
      <div className="relative overflow-hidden bg-black flex items-center justify-center ring-1 ring-neutral-100">
        <img src={imageUrl} className="max-w-full h-auto object-contain transition-all duration-1000 group-hover:scale-[1.005]" alt="显影结果" />
        
        {/* 悬浮复制按钮 */}
        {onCopyPrompt && (
          <button 
            onClick={handleCopy}
            className={`absolute bottom-6 right-6 h-10 px-5 rounded-full backdrop-blur-xl border flex items-center gap-2 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-2xl
              ${copying ? 'bg-[#E30613] border-[#E30613] text-white' : 'bg-white/90 border-neutral-200 text-black hover:bg-black hover:text-white hover:border-black'}`}
          >
            <span className="text-[10px] font-black tracking-widest uppercase">
              {copying ? '已复制指令' : '复制神经指令'}
            </span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {copying ? <path d="M20 6L9 17l-5-5"/> : <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>}
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mt-10 sm:mt-14 gap-8 px-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-[18px] font-serif italic text-black font-black tracking-tight leading-none">
            {session.cameraName}
          </span>
          <span className="text-[9px] text-neutral-400 font-black tracking-[0.4em] uppercase mt-2">
            神经光学重构系统 / 版本 0.1
          </span>
        </div>

        <div className="flex flex-col items-center order-first sm:order-none">
           <div className="w-10 h-10 rounded-full bg-[#E30613] flex items-center justify-center mb-1.5 shadow-lg shadow-red-500/20">
              <span className="text-white text-[12px] font-black tracking-tighter">Leifi</span>
           </div>
           <span className="text-[8px] text-neutral-900 font-black tracking-[0.6em] uppercase">实验室</span>
        </div>

        <div className="flex flex-col items-center sm:items-end font-mono text-center sm:text-right">
          <span className="text-[11px] text-black font-black tracking-widest">
            编号 #{session.sessionId.split('_')[1].toUpperCase()}
          </span>
          <span className="text-[10px] text-neutral-500 mt-2 font-bold tracking-tighter">
            {dateStr} • {Math.round(session.outputMeta.intensity * 100)}% 显影强度
          </span>
        </div>
      </div>
    </div>
  );
};
