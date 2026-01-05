
import React, { useMemo, useDeferredValue } from 'react';

interface IntensitySliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const IntensitySlider: React.FC<IntensitySliderProps> = ({ value, onChange, disabled }) => {
  // 核心优化：使用延迟值处理复杂的 UI 动画
  // 即便在 120Hz 屏幕或性能受限设备上，拖动滑块的响应（onChange）也是即时的
  // 而 1200px 轨道的渲染位移允许有一定的延迟/调度，避免掉帧
  const deferredValue = useDeferredValue(value);
  
  const trackWidth = 1200; 
  const trackOffset = useMemo(() => {
    return deferredValue * trackWidth;
  }, [deferredValue]);

  return (
    <div className={`flex flex-col gap-6 w-full max-w-xs transition-opacity duration-500 ${disabled ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black tracking-[0.4em] text-neutral-500 uppercase">显影强度</span>
        <span className="text-[14px] font-mono font-bold text-white tabular-nums">{Math.round(value * 100)}%</span>
      </div>

      <div className="relative h-16 flex items-center group">
        <div className="absolute inset-0 bg-[#0A0A0A] rounded-sm overflow-hidden border border-neutral-900 shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)]">
          <div 
            className="absolute h-full flex items-center transition-transform duration-75 ease-out will-change-transform"
            style={{ 
              transform: `translateX(calc(50% - ${trackOffset}px))`,
              width: `${trackWidth}px`
            }}
          >
            {[...Array(41)].map((_, i) => {
              const val = i * 2.5;
              const isMajor = val % 10 === 0;
              return (
                <div 
                  key={i} 
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${(val / 100) * trackWidth}px` }}
                >
                  <div className={`w-[1.5px] rounded-full mb-2 ${
                    isMajor ? 'h-6 bg-neutral-400' : 'h-2 bg-neutral-800'
                  }`} />
                  {isMajor && (
                    <span className="text-[8px] font-mono font-black text-neutral-600 tracking-tighter tabular-nums select-none leading-none w-8 text-center">
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/5 pointer-events-none z-20" />
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-[#E30613] z-30 shadow-[0_0_20px_rgba(227,6,19,0.6)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#E30613] rotate-45 shadow-lg border border-white/10" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E30613] rounded-full" />
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-40
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-20 [&::-webkit-slider-thumb]:h-full 
            [&::-webkit-slider-thumb]:bg-transparent"
        />
      </div>

      <style>{`
        input[type=range]:focus { outline: none; }
        .will-change-transform { will-change: transform; }
      `}</style>
    </div>
  );
};
