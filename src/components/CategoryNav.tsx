import React from 'react';
import { CATEGORIES } from '../data/initialCatalog.ts';
import { playTapSound } from '../utils/audio.ts';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <nav className="p-3 bg-stone-900/90 border-b border-stone-800/80 sticky top-0 z-20 backdrop-blur-md overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 min-w-max">
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          const count = categoryCounts[category] ?? 0;

          return (
            <button
              key={category}
              onClick={() => {
                playTapSound();
                onSelectCategory(category);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap min-h-[44px] ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/10'
                  : 'bg-stone-800/60 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <span>{category}</span>
              <span
                className={`text-xs tabular-nums ${
                  isSelected ? 'text-stone-900 font-bold' : 'text-stone-400'
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
