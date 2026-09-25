import React from 'react';
import { Coffee, Wine, Croissant, Cake, Utensils, Pizza, Soup, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { playTapSound } from '../utils/audio.ts';

interface LeftSidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const categories = [
    { id: 'All Items', label: 'All', icon: Coffee, title: 'All Items' },
    { id: 'Specialty Coffee', label: 'Coffee', icon: Coffee, title: 'Specialty Coffee & Roastery' },
    { id: 'Cocktails', label: 'Drinks', icon: Wine, title: 'Craft Cocktails' },
    { id: 'Bakery', label: 'Bakery', icon: Croissant, title: 'Fresh Bakery' },
    { id: 'Desserts', label: 'Dessert', icon: Cake, title: 'Artisanal Dolci' },
    { id: 'Small Plates', label: 'Bites', icon: Utensils, title: 'Cicchetti & Bites' },
    { id: 'Pasta', label: 'Pasta', icon: Soup, title: 'Handmade Pasta' },
    { id: 'Pizza', label: 'Pizza', icon: Pizza, title: 'Sourdough Pizza' },
  ];

  return (
    <nav className="hidden lg:flex w-20 bg-[#120f0d]/90 border-r border-[#c88a58]/20 flex-col items-center py-6 gap-5 select-none flex-shrink-0 h-full z-20">
      {/* Top Monogram */}
      <div className="w-11 h-11 rounded-full bg-[#241a14] border border-[#c88a58]/50 flex items-center justify-center font-coffee font-bold text-lg text-[#dda15e] shadow-md">
        ☕
      </div>

      {/* Category Icons */}
      <div className="flex flex-col items-center gap-4 my-auto overflow-y-auto no-scrollbar py-2">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                playTapSound();
                onSelectCategory(cat.id);
              }}
              title={cat.title}
              className={`w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                isActive
                  ? 'pill-caramel scale-105 shadow-lg'
                  : 'bg-[#1a1512] border border-[#c88a58]/20 text-[#b8aaa0] hover:border-[#dda15e] hover:text-[#f4ece1]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {/* Tooltip */}
              <span className="absolute left-14 px-3 py-1 bg-[#1a1512] border border-[#c88a58]/40 text-[#f4ece1] text-[11px] font-mono-meta uppercase tracking-wider rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Settings & Fullscreen Controls */}
      <div className="mt-auto flex flex-col items-center gap-3 pt-3 border-t border-[#c88a58]/20">
        <button
          onClick={() => {
            playTapSound();
            onToggleFullscreen();
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="w-10 h-10 rounded-full bg-[#1a1512] border border-[#c88a58]/20 text-[#b8aaa0] hover:text-[#dda15e] hover:border-[#dda15e] flex items-center justify-center transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            playTapSound();
            onOpenSettings();
          }}
          title="Terminal Hub & Settings"
          className="w-10 h-10 rounded-full bg-[#241a14] border border-[#c88a58]/40 text-[#dda15e] hover:bg-[#32231b] flex items-center justify-center font-mono-meta text-xs transition-colors shadow-md"
        >
          ⚙️
        </button>
      </div>
    </nav>
  );
};
