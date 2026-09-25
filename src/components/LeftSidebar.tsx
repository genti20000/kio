import React from 'react';
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
import facadeImg from '../assets/images/amica_facade_entrance_1790356001503.jpg';

interface LeftSidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const navItems = [
    { name: 'All Items', icon: Sparkles },
    { name: 'Cocktails', icon: Wine, isAccent: true },
    { name: 'Aperitivo', icon: GlassWater },
    { name: 'Small Plates', icon: UtensilsCrossed },
    { name: 'Pasta', icon: Soup },
    { name: 'Pizza', icon: Pizza },
    { name: 'Desserts', icon: Cake },
    { name: 'Wine', icon: Wine },
    { name: 'Beer', icon: Beer },
    { name: 'Soft Drinks', icon: CupSoda },
  ];

  return (
    <aside className="hidden lg:flex w-52 md:w-56 bg-[#100E0C] border-r border-[#26211C] flex-col justify-between select-none flex-shrink-0 h-full">
      {/* Category Links */}
      <div className="p-3 space-y-1 overflow-y-auto flex-grow">
        {navItems.map((item) => {
          const isSelected = selectedCategory === item.name;
          const Icon = item.icon;
          const count = categoryCounts[item.name] ?? 0;

          return (
            <button
              key={item.name}
              onClick={() => {
                playTapSound();
                onSelectCategory(item.name);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all min-h-[46px] ${
                isSelected
                  ? 'bg-[#5C1D24] text-[#F3E7C4] shadow-md border border-[#7D2833]/60'
                  : 'text-stone-400 hover:text-[#E5C378] hover:bg-[#1A1714]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-[#E5C378]' : 'text-stone-500'
                  }`}
                />
                <span className="font-medium text-[13px]">{item.name}</span>
              </div>

              {count > 0 && item.name !== 'All Items' && (
                <span
                  className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-black/30 text-[#E5C378]'
                      : 'text-stone-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Promo Card matching uploaded mockup */}
      <div className="p-3 border-t border-[#241F1A]">
        <div className="relative rounded-2xl overflow-hidden border border-[#332A20] group bg-[#161310]">
          <div className="aspect-[4/3] w-full relative overflow-hidden">
            <img
              src={facadeImg}
              alt="Amica London"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/60 to-transparent" />
          </div>

          <div className="absolute inset-0 p-3 flex flex-col justify-end">
            <div className="font-brand text-[11px] font-bold text-[#E5C378] tracking-widest uppercase">
              AMICA
            </div>
            <div className="text-[9px] text-stone-300 tracking-wider leading-tight font-light mt-0.5 uppercase">
              Good Food · Good Cocktails · Better Company
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
