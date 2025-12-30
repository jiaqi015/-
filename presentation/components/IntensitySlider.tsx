
import React, { useMemo } from 'react';

interface IntensitySliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const IntensitySlider: React.FC<IntensitySliderProps> = ({ value, onChange, disabled }) => {
  // 模拟拨盘旋转的角度，数值从 0-1 映射到旋转位移
  const rotationOffset = useMemo(() => value * 200, [value]);

  return (
    <div className={`flex flex-col gap-6 w-full max-w-xs transition-opacity duration-500 ${disabled ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black tracking-[0.4em] text-neutral-500 uppercase">显影强度</span>
        <span className="text-[14px] font-mono font-bold text-white tabular-nums">{Math.round(value * 100)}%</span>
      </div>

      {/* 模拟机械拨盘容器 */}
      <div className="relative h-16 flex items-center group">
        {/* 拨盘背景槽 */}
        <div className="absolute inset-0 bg-neutral-900/50 rounded-sm overflow-hidden border border-neutral-800/50">
          
          {/* 滚轮刻度层 - 模拟 3D 旋转 */}
          <div 
            className="absolute inset-0 flex items-center transition-transform duration-75 ease-out"
            style={{ transform: `translateX(${-rotationOffset % 40}px)` }}
          >
            <div className="flex gap-4 px-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-0.5 h-6 bg-neutral-800 rounded-full" />
                  <div className="w-0.5 h-3 bg-neutral-800/50 rounded-full" />
                  <div className="w-0.5 h-3 bg-neutral-800/50 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* 边缘阴影阴影 - 营造圆柱体视觉 */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
          
          {/* 顶部高光 - 模拟金属光泽 */}
          <div className="absolute top-0 inset-x-0 h-px bg-white/5 pointer-events-none" />
        </div>

        {/* 红色指示针 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-[#E30613] z-20 shadow-[0_0_10px_rgba(227,6,19,0.5)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E30613] rotate-45" />
        </div>

        {/* 透明交互层 */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-30
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-12 [&::-webkit-slider-thumb]:h-full 
            [&::-webkit-slider-thumb]:bg-transparent"
        />
      </div>

      <style>{`
        input[type=range]::-webkit-slider-runnable-track {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
