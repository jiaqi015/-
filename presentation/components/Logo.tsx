
import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#E30613] flex items-center justify-center shadow-lg">
        <span className="text-white text-[12px] font-black tracking-tighter mb-0.5">Leifi</span>
      </div>
      <div className="flex flex-col -gap-0.5">
        <span className="font-black text-xl tracking-tighter text-white uppercase">开机</span>
      </div>
    </div>
  );
};