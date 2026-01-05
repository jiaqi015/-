
import React, { useCallback, useRef } from 'react';

interface UploaderProps {
  image: string | null;
  onUpload: (file: File) => void;
}

export const Uploader: React.FC<UploaderProps> = ({ image, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) onUpload(blob);
        }
      }
    }
  }, [onUpload]);

  React.useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div 
      className={`relative w-full h-full min-h-[350px] flex items-center justify-center cursor-pointer transition-all duration-700 overflow-hidden group
        ${image ? 'bg-black' : 'bg-[#161616] hover:bg-neutral-800/30'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      {/* 模拟取景器视觉层 (Viewfinder Elements) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-neutral-500/80 transition-all duration-500 group-hover:border-white/80 group-hover:scale-105"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-neutral-500/80 transition-all duration-500 group-hover:border-white/80 group-hover:scale-105"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-neutral-500/80 transition-all duration-500 group-hover:border-white/80 group-hover:scale-105"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-neutral-500/80 transition-all duration-500 group-hover:border-white/80 group-hover:scale-105"></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all">
          <div className="w-px h-full bg-neutral-400 transition-colors duration-500 group-hover:bg-white"></div>
          <div className="absolute w-full h-px bg-neutral-400 transition-colors duration-500 group-hover:bg-white"></div>
        </div>

        {!image && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 items-end opacity-60 group-hover:opacity-100 transition-all duration-700">
            {[+2, +1, 0, -1, -2].map(num => (
              <div key={num} className="flex items-center gap-2.5">
                <span className={`text-[8px] font-mono font-bold tracking-tighter transition-colors ${num === 0 ? 'text-neutral-300' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
                  {num > 0 ? `+${num}` : num}
                </span>
                <div className={`h-[1px] transition-all ${num === 0 ? 'w-5 bg-neutral-300' : 'w-3 bg-neutral-600 group-hover:bg-neutral-400'}`}></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
      
      {image ? (
        <>
          <img src={image} className="w-full h-full object-contain p-12 animate-fade-in relative z-0" alt="预览" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm z-20">
            <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl font-light">+</span>
            </div>
            <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase">更换影像</p>
          </div>
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center pt-8 relative z-20">
          {/* 移除红框中的圆形加号，保留 mt-auto 占位以维持下方文案的垂直坐标 */}
          <div className="mt-auto"></div>
          
          {/* 下方文案及布局保持原封不动 */}
          <div className="flex flex-col items-center gap-6 mt-auto mb-12">
            <div className="flex flex-col gap-3 text-center">
              <p className="text-neutral-300 text-[16px] font-black tracking-[0.5em] uppercase transition-colors group-hover:text-white">
                上传影像源
              </p>
              <p className="text-neutral-500 text-[10px] tracking-[0.15em] font-mono uppercase">
                支持 拖拽, 粘贴 或 点击
              </p>
            </div>
            <div className="w-10 h-px bg-neutral-800 group-hover:bg-neutral-600 transition-all"></div>
            <p className="text-neutral-700 text-[9px] tracking-[0.2em] font-mono uppercase">
              支持 JPEG / PNG / RAW 格式
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
