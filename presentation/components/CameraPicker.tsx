
import React, { useState } from 'react';
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
        className={`w-16 h-16 transition-all duration-500 ${isSelected ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-400'}`}
        dangerouslySetInnerHTML={{ __html: profile.icon.value }}
      />
    );
  }
  return <div className="text-5xl">{profile.icon.value}</div>;
};

export const CameraPicker: React.FC<CameraPickerProps> = ({ profiles, selectedId, onSelect }) => {
  const categories = Array.from(new Set(profiles.map(p => p.category)));
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredProfiles = profiles.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col gap-10 animate-fade-in w-full">
      {/* Category Tabs */}
      <nav className="flex items-center gap-12 border-b border-neutral-900 overflow-x-auto no-scrollbar pt-2 pb-1 scroll-smooth">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`text-[13px] font-black uppercase tracking-[0.4em] pb-4 transition-all relative whitespace-nowrap min-w-max
              ${activeCategory === category 
                ? 'text-white border-b-2 border-white' 
                : 'text-neutral-600 hover:text-neutral-400 border-b-2 border-transparent'}`}
          >
            {category}
          </button>
        ))}
      </nav>

      {/* Grid Layout - Adaptive Height */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-12">
        {filteredProfiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className={`group flex flex-col items-center gap-8 p-8 rounded-sm transition-all duration-300 border relative min-h-[220px] w-full
              ${selectedId === profile.id 
                ? 'border-neutral-600 bg-neutral-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.6)]' 
                : 'border-neutral-900 bg-[#161616] hover:border-neutral-700 hover:bg-neutral-800/30'}`}
          >
            <div className="relative z-10 py-2">
              <CameraIcon profile={profile} isSelected={selectedId === profile.id} />
            </div>
            
            <div className="flex flex-col items-center gap-2 w-full mt-auto">
              <span className={`text-[12px] font-bold tracking-[0.05em] text-center leading-relaxed transition-colors break-words w-full
                ${selectedId === profile.id ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
                {profile.name}
              </span>
            </div>

            {selectedId === profile.id && (
              <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-[#E30613] shadow-[0_0_10px_rgba(227,6,19,0.5)]"></div>
            )}
          </button>
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
