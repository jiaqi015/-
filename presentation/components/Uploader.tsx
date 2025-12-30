
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
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
      
      {image ? (
        <>
          <img src={image} className="w-full h-full object-contain p-8 animate-fade-in" alt="预览" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl font-light">+</span>
            </div>
            <p className="text-white text-[10px] font-black tracking-[0.4em] uppercase">更换影像</p>
          </div>
        </>
      ) : (
        <div className="text-center flex flex-col items-center gap-6 p-8">
          <div className="w-14 h-14 border border-neutral-800 rounded-full flex items-center justify-center mb-2 group-hover:border-neutral-600 transition-colors">
            <span className="text-neutral-700 text-2xl font-light group-hover:text-neutral-400 transition-colors">+</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-neutral-500 text-[11px] font-black tracking-[0.3em] uppercase">
              上传影像源
            </p>
            <p className="text-neutral-700 text-[9px] tracking-[0.1em] font-mono uppercase">
              支持 拖拽, 粘贴 或 点击
            </p>
          </div>
          <div className="w-8 h-px bg-neutral-900"></div>
          <p className="text-neutral-800 text-[8px] tracking-[0.2em] font-mono">
            支持 JPEG / PNG / RAW 格式
          </p>
        </div>
      )}
    </div>
  );
};
