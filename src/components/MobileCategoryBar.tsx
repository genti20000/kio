import React, { useRef, useEffect } from 'react';
import {
  Wine,
  UtensilsCrossed,
  Soup,
  Pizza,
  Cake,
  Beer,
  CupSoda,
  GlassWater,
  Sparkles,
} from 'lucide-react';
import { playTapSound } from '../utils/audio.ts';

interface MobileCategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const MobileCategoryBar: React.FC<MobileCategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { name: 'All Items', icon: Sparkles },
    { name: 'Cocktails', icon: Wine },
    { name: 'Aperitivo', icon: GlassWater },
    { name: 'Small Plates', icon: UtensilsCrossed },
    { name: 'Pasta', icon: Soup },
    { name: 'Pizza', icon: Pizza },
    { name: 'Desserts', icon: Cake },
    { name: 'Wine', icon: Wine },
    { name: 'Beer', icon: Beer },
    { name: 'Soft Drinks', icon: CupSoda },
  ];

  // Scroll active item into view on selection
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector('[data-active="true"]') as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategory]);

  return (
    <div className="lg:hidden w-full bg-[#100E0C] border-b border-[#241F1A] px-2 py-2 select-none flex-shrink-0 z-20">
      <div
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const Icon = cat.icon;
          const count = categoryCounts[cat.name] ?? 0;

          return (
            <button
              key={cat.name}
              data-active={isSelected}
              onClick={() => {
                playTapSound();
                onSelectCategory(cat.name);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap min-h-[42px] transition-all flex-shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-[#5C1D24] text-[#F3E7C4] border border-[#7D2833]/80 shadow-md font-semibold'
                  : 'bg-[#161310] text-stone-400 hover:text-stone-200 border border-[#262019]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isSelected ? 'text-[#E5C378]' : 'text-stone-500'
                }`}
              />
              <span>{cat.name}</span>
              {count > 0 && cat.name !== 'All Items' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-black/30 text-[#E5C378]' : 'text-stone-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
