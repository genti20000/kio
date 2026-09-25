import React, { useState } from 'react';
import {
  Menu,
  Search,
  LayoutGrid,
  ChevronDown,
  User,
  MoreVertical,
  Maximize2,
  Minimize2,
  CreditCard,
  Wifi,
} from 'lucide-react';
import { SumUpReader } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';

interface TopBarProps {
  activeTable: string;
  onChangeTable: (table: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeReader: SumUpReader | null;
  onOpenSettings: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isOnline: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTable,
  onChangeTable,
  searchQuery,
  onSearchChange,
  activeReader,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
  isOnline,
}) => {
  const [showTableMenu, setShowTableMenu] = useState(false);

  const tables = [
    { id: 'Table 12', label: 'Table 12', area: 'Main Dining · 4 Guests' },
    { id: 'Table 04', label: 'Table 04', area: 'Booth · 6 Guests' },
    { id: 'Bar 02', label: 'Bar 02', area: 'Cocktail Bar · 2 Guests' },
    { id: 'Table 08', label: 'Table 08', area: 'Velvet Lounge · 4 Guests' },
    { id: 'Takeaway', label: 'Takeaway', area: 'Express Counter' },
  ];

  const currentTable = tables.find((t) => t.id === activeTable) || tables[0];

  return (
    <header className="h-16 px-4 md:px-6 bg-[#0E0C0A] border-b border-[#241F1A] flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Left: Menu & Brand Lockup */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-lg bg-[#181512] text-stone-400 hover:text-white flex items-center justify-center border border-[#2D261F] transition-colors"
          title="Terminal Hub & Settings"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col">
          <span className="font-brand text-base md:text-lg font-bold tracking-widest text-[#F3E7C4] leading-tight">
            AMICA SOHO
          </span>
          <span className="text-[9px] text-[#C89B3C] tracking-widest uppercase font-light">
            COCKTAILS · APERITIVO · CUCINA · VINO
          </span>
        </div>
      </div>

      {/* Center: Search & Tables Trigger */}
      <div className="hidden md:flex items-center gap-3 max-w-md w-full mx-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cocktails, pasta, small plates..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#161310] border border-[#2A241D] rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#C89B3C] transition-colors"
          />
        </div>

        <button
          onClick={() => setShowTableMenu(!showTableMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161310] border border-[#2A241D] text-xs text-stone-300 hover:text-white hover:border-[#C89B3C]/50 transition-colors whitespace-nowrap"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span>Tables</span>
        </button>
      </div>

      {/* Right: Active Table selector & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Table Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTableMenu(!showTableMenu)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#161310] border border-[#2D261F] text-left hover:border-[#C89B3C]/60 transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-[#F3E7C4] tracking-wide">
                {currentTable.label}
              </div>
              <div className="text-[10px] text-stone-400 font-light truncate max-w-[120px]">
                {currentTable.area}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {showTableMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#161310] border border-[#332A20] rounded-2xl p-1.5 shadow-2xl z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#C89B3C] font-semibold">
                Select Table / Location
              </div>
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    playTapSound();
                    onChangeTable(t.id);
                    setShowTableMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                    activeTable === t.id
                      ? 'bg-[#5C1D24] text-[#F3E7C4] font-semibold'
                      : 'text-stone-300 hover:bg-[#201C17]'
                  }`}
                >
                  <div>
                    <div>{t.label}</div>
                    <div className="text-[10px] text-stone-400">{t.area}</div>
                  </div>
                  {activeTable === t.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5C378]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reader status chip */}
        <div
          onClick={onOpenSettings}
          className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#161310] border border-[#2D261F] text-xs text-[#E5C378] cursor-pointer hover:border-[#C89B3C]/50"
          title="SumUp Reader Status"
        >
          <CreditCard className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span className="text-[11px] font-medium truncate max-w-[120px]">
            {activeReader ? activeReader.name : 'SumUp Solo Ready'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => {
            playTapSound();
            onToggleFullscreen();
          }}
          className="w-9 h-9 rounded-xl bg-[#181512] text-stone-400 hover:text-white flex items-center justify-center border border-[#2D261F]"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* More Options / Settings */}
        <button
          onClick={() => {
            playTapSound();
            onOpenSettings();
          }}
          className="w-9 h-9 rounded-xl bg-[#181512] text-stone-400 hover:text-white flex items-center justify-center border border-[#2D261F]"
          title="Terminal & Inventory Hub"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
