import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#E30613] flex items-center justify-center shadow-lg">
        {/* 移除英文文本，保留纯正红点设计 */}
      </div>
      <div className="flex flex-col -gap-0.5">
        <span className="font-black text-xl tracking-tighter text-white uppercase">公开相机</span>
      </div>
    </div>
  );
};