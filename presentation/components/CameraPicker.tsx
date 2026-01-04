
import React, { useState, useMemo } from 'react';
import { CameraProfile } from '../../domain/types';

interface CameraPickerProps {
  profiles: CameraProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CameraIcon: React.FC<{ profile: CameraProfile; isSelected: boolean }> = ({ profile, isSelected }) => {
  if (profile.icon.type === 'svg') {
    return (
      <svg 
        viewBox="0 0 24 24" 
        className={`w-12 h-12 transition-all duration-500 ${isSelected ? 'text-white' : 'text-neutral-700 group-hover:text-neutral-500'}`}
        dangerouslySetInnerHTML={{ __html: profile.icon.value }}
      />
    );
  }
  return <div className="text-4xl">{profile.icon.value}</div>;
};

export const CameraPicker: React.FC<CameraPickerProps> = ({ profiles, selectedId, onSelect }) => {
  const categories = useMemo(() => Array.from(new Set(profiles.map(p => p.category))), [profiles]);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredProfiles = profiles.filter(p => p.category === activeCategory);
  const selectedProfile = useMemo(() => profiles.find(p => p.id === selectedId), [profiles, selectedId]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in w-full">
      {/* Category Tabs */}
      <nav className="flex items-center gap-8 border-b border-neutral-900 overflow-x-auto no-scrollbar pb-0">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`text-[10px] font-black uppercase tracking-[0.3em] pb-3 transition-all relative whitespace-nowrap
              ${activeCategory === category 
                ? 'text-white border-b border-white' 
                : 'text-neutral-600 hover:text-neutral-400 border-b border-transparent'}`}
          >
            {category}
          </button>
        ))}
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Grid Layout */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
          {filteredProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className={`group flex flex-col items-center justify-center gap-4 p-4 rounded-sm transition-all duration-300 border relative aspect-square
                ${selectedId === profile.id 
                  ? 'border-neutral-600 bg-neutral-800/40 shadow-2xl' 
                  : 'border-neutral-900 bg-[#161616] hover:border-neutral-700 hover:bg-neutral-800/20'}`}
            >
              <div className="relative z-10">
                <CameraIcon profile={profile} isSelected={selectedId === profile.id} />
              </div>
              
              <span className={`text-[9px] font-bold tracking-[0.1em] text-center leading-tight transition-colors uppercase
                ${selectedId === profile.id ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'}`}>
                {profile.name}
              </span>

              {selectedId === profile.id && (
                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-[#E30613] shadow-[0_0_8px_rgba(227,6,19,0.6)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Details Panel */}
        <div className="w-full lg:w-72 flex flex-col gap-4 p-6 bg-[#161616] border border-neutral-900 min-h-[250px] animate-fade-in">
          {selectedProfile ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-[#E30613] tracking-[0.2em] uppercase">技术规格</span>
                <h4 className="text-lg font-bold text-white tracking-tight leading-tight">{selectedProfile.name}</h4>
              </div>
              
              <div className="w-8 h-px bg-neutral-800"></div>
              
              <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">
                {selectedProfile.description}
              </p>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <span className="text-[9px] font-black text-neutral-800 tracking-[0.4em] uppercase">请选择光学预设</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
