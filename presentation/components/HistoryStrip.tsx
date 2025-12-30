
import React from 'react';
import { DevelopSession } from '../../domain/types';

interface HistoryStripProps {
  sessions: DevelopSession[];
  onSelect: (session: DevelopSession) => void;
  onDownload: (session: DevelopSession) => void;
  onShowInfo: (session: DevelopSession) => void;
}

export const HistoryStrip: React.FC<HistoryStripProps> = ({ sessions, onSelect, onDownload, onShowInfo }) => {
  if (sessions.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-[0.5em] text-neutral-600 uppercase">历史底片</span>
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>
        </div>
        <span className="text-[9px] font-mono text-neutral-800">{sessions.length} / 20</span>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 scroll-smooth">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="flex-shrink-0 group relative w-32 h-32 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-all overflow-hidden"
          >
            <img 
              src={session.outputUrl} 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-all duration-500 cursor-pointer" 
              alt="History"
              onClick={() => onSelect(session)}
            />
            
            {/* 底部信息条 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-[7px] font-black text-white truncate uppercase tracking-widest mb-1">
                {session.cameraName}
              </p>
              <p className="text-[6px] text-neutral-500 font-mono">
                {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* 操作遮罩层 */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 pointer-events-none group-hover:pointer-events-auto">
              {/* 预览 */}
              <button 
                onClick={() => onSelect(session)}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                title="放大预览"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
              
              {/* 下载 */}
              <button 
                onClick={() => onDownload(session)}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-[#E30613] hover:text-white transition-all"
                title="保存影像"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </button>

              {/* 提示词 */}
              <button 
                onClick={() => onShowInfo(session)}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-neutral-200 hover:text-black transition-all"
                title="查看神经指令"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
