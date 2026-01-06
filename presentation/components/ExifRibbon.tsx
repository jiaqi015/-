
import React from 'react';
import { DevelopSession } from '../../domain/types';

interface ExifRibbonProps {
  session: DevelopSession;
  imageUrl: string;
}

export const ExifRibbon: React.FC<ExifRibbonProps> = ({ session, imageUrl }) => {
  return (
    <div className="flex flex-col bg-white p-6 sm:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.8)] animate-fade-in group selection:bg-neutral-200">
      <div className="relative overflow-hidden bg-black flex items-center justify-center ring-1 ring-neutral-100">
        <img src={imageUrl} className="max-w-full h-auto object-contain transition-all duration-1000 group-hover:scale-[1.005]" alt="显影结果" />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center mt-10 sm:mt-14 gap-8 px-4">
        {/* 左侧：相机型号 */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <span className="text-[20px] font-serif italic text-black font-black tracking-tight leading-none">
            {session.cameraName}
          </span>
        </div>

        {/* 右侧：Leifi Logo (原中间位置移动至此) */}
        <div className="flex flex-col items-center sm:items-end">
           <div className="w-10 h-10 rounded-full bg-[#E30613] flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white text-[12px] font-black tracking-tighter mb-0.5">Leifi</span>
           </div>
        </div>
      </div>
    </div>
  );
};
