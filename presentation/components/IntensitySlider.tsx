
import React, { useMemo } from 'react';

interface IntensitySliderProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const IntensitySlider: React.FC<IntensitySliderProps> = ({ value, onChange, disabled }) => {
  // 模拟机械拨盘的物理位移。
  // 我们建立一个 1200px 的长轨道，增加阻尼感与对齐精度。
  const trackWidth = 1200; 
  const trackOffset = useMemo(() => {
    // 线性映射：显影强度 0->1 对应轨道位移 0->1200px
    return value * trackWidth;
  }, [value]);

  return (
    <div className={`flex flex-col gap-6 w-full max-w-xs transition-opacity duration-500 ${disabled ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black tracking-[0.4em] text-neutral-500 uppercase">显影强度</span>
        <span className="text-[14px] font-mono font-bold text-white tabular-nums">{Math.round(value * 100)}%</span>
      </div>

      {/* 模拟机械拨盘容器 */}
      <div className="relative h-16 flex items-center group">
        {/* 拨盘背景槽：深邃的磨砂壳体感 */}
        <div className="absolute inset-0 bg-[#0A0A0A] rounded-sm overflow-hidden border border-neutral-900 shadow-[inset_0_2px_15px_rgba(0,0,0,0.9)]">
          
          {/* 物理刻度轨道：核心位移组件 */}
          <div 
            className="absolute h-full flex items-center transition-transform duration-75 ease-out will-change-transform"
            style={{ 
              transform: `translateX(calc(50% - ${trackOffset}px))`,
              width: `${trackWidth}px`
            }}
          >
            {/* 刻度生成逻辑：每 2.5% 一个间距，总计 41 个锚点 (0, 2.5 ... 100) */}
            {[...Array(41)].map((_, i) => {
              const val = i * 2.5;
              const isMajor = val % 10 === 0; // 0, 10, 20...100 为大刻度
              
              return (
                <div 
                  key={i} 
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${(val / 100) * trackWidth}px` }}
                >
                  {/* 物理刻度线：严格居中对齐 */}
                  <div className={`w-[1.5px] rounded-full mb-2 ${
                    isMajor ? 'h-6 bg-neutral-400' : 'h-2 bg-neutral-800'
                  }`} />
                  
                  {/* 刻度数字：确保文本中心与刻度线中轴线重合 */}
                  {isMajor && (
                    <span className="text-[8px] font-mono font-black text-neutral-600 tracking-tighter tabular-nums select-none leading-none w-8 text-center">
                      {val}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 边缘遮罩：营造圆柱体侧壁的渐变阴影，使拨盘看起来是“沉”在里面的 */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent pointer-events-none z-10" />
          
          {/* 顶部微亮高光：模拟金属边缘的反射光泽 */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/5 pointer-events-none z-20" />
        </div>

        {/* 核心指示针：徕卡标志性的精准红线 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-[#E30613] z-30 shadow-[0_0_20px_rgba(227,6,19,0.6)]">
          {/* 顶部菱形准心：确保刻度读取的绝对参考点 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#E30613] rotate-45 shadow-lg border border-white/10" />
          {/* 底部稳定点 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E30613] rounded-full" />
        </div>

        {/* 交互层：完全透明的范围选择器，作为手势捕获层 */}
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
        /* 移除焦点与默认样式，保持纯净的物理模拟感 */
        input[type=range]:focus {
          outline: none;
        }
        .will-change-transform {
          will-change: transform;
        }
      `}</style>
    </div>
  );
};
