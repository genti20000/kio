import React, { useState } from 'react';
import {
  Menu,
  Search,
  LayoutGrid,
  ChevronDown,
  MoreVertical,
  Maximize2,
  Minimize2,
  CreditCard,
  ShoppingBag,
  X,
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
  cartCount?: number;
  onOpenCart?: () => void;
  onNavigateStation?: (station: 'pos' | 'kitchen' | 'bar') => void;
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
  cartCount = 0,
  onOpenCart,
  onNavigateStation,
}) => {
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const tables = [
    { id: 'Table 12', label: 'Table 12', area: 'Main Dining · 4 Guests' },
    { id: 'Table 04', label: 'Table 04', area: 'Booth · 6 Guests' },
    { id: 'Bar 02', label: 'Bar 02', area: 'Cocktail Bar · 2 Guests' },
    { id: 'Table 08', label: 'Table 08', area: 'Velvet Lounge · 4 Guests' },
    { id: 'Takeaway', label: 'Takeaway', area: 'Express Counter' },
  ];

  const currentTable = tables.find((t) => t.id === activeTable) || tables[0];

  return (
    <header className="px-3 sm:px-4 md:px-6 bg-[#0E0C0A] border-b border-[#241F1A] flex flex-col z-30 select-none flex-shrink-0">
      <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Menu & Brand Lockup */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          <button
            onClick={() => {
              playTapSound();
              onOpenSettings();
            }}
            className="w-10 h-10 rounded-xl bg-[#181512] text-stone-400 hover:text-white flex items-center justify-center border border-[#2D261F] transition-colors active:scale-95 min-h-[44px] min-w-[44px]"
            title="Terminal Hub & Settings"
            aria-label="Terminal Hub and Settings"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex flex-col">
            <span className="font-brand text-sm sm:text-base md:text-lg font-bold tracking-widest text-[#F3E7C4] leading-tight">
              AMICA SOHO
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#C89B3C] tracking-widest uppercase font-light hidden xs:inline">
              COCKTAILS · CUCINA · VINO
            </span>
          </div>
        </div>

        {/* Center: Desktop Search */}
        <div className="hidden md:flex items-center gap-3 max-w-xs lg:max-w-md w-full mx-2 lg:mx-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search cocktails, pasta, plates..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#161310] border border-[#2A241D] rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#C89B3C] transition-colors"
            />
          </div>

          <button
            onClick={() => setShowTableMenu(!showTableMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161310] border border-[#2A241D] text-xs text-stone-300 hover:text-white hover:border-[#C89B3C]/50 transition-colors whitespace-nowrap min-h-[34px]"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>Tables</span>
          </button>
        </div>

        {/* Right: Active Table selector, Mobile Search, Cart & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Station Switcher Quick Links (Kitchen / Bar) */}
          {onNavigateStation && (
            <div className="hidden sm:flex items-center gap-1 bg-[#14120F] border border-[#2A231C] rounded-xl p-0.5">
              <button
                onClick={() => {
                  playTapSound();
                  onNavigateStation('kitchen');
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-[#1E1914] transition-colors flex items-center gap-1"
                title="Open Kitchen Display System"
              >
                <span>🍳 Kitchen</span>
              </button>
              <button
                onClick={() => {
                  playTapSound();
                  onNavigateStation('bar');
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-[#1E1914] transition-colors flex items-center gap-1"
                title="Open Bar Display System"
              >
                <span>🍸 Bar</span>
              </button>
            </div>
          )}

          {/* Mobile Search Toggle */}
          <button
            onClick={() => {
              playTapSound();
              setIsMobileSearchOpen(!isMobileSearchOpen);
            }}
            className="md:hidden w-10 h-10 rounded-xl bg-[#161310] text-stone-300 hover:text-white flex items-center justify-center border border-[#2D261F] min-h-[44px] min-w-[44px] active:scale-95"
            aria-label="Toggle search"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Table Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                playTapSound();
                setShowTableMenu(!showTableMenu);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#161310] border border-[#2D261F] text-left hover:border-[#C89B3C]/60 transition-colors min-h-[44px] active:scale-95"
            >
              <div>
                <div className="text-xs font-bold text-[#F3E7C4] tracking-wide">
                  {currentTable.label}
                </div>
                <div className="text-[9px] sm:text-[10px] text-stone-400 font-light truncate max-w-[70px] sm:max-w-[110px]">
                  {currentTable.area.split('·')[0]}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400" />
            </button>

            {showTableMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/50"
                  onClick={() => setShowTableMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-[#161310] border border-[#332A20] rounded-2xl p-1.5 shadow-2xl z-50 animate-fade-in">
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
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between min-h-[44px] ${
                        activeTable === t.id
                          ? 'bg-[#5C1D24] text-[#F3E7C4] font-semibold'
                          : 'text-stone-300 hover:bg-[#201C17]'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-[10px] text-stone-400">{t.area}</div>
                      </div>
                      {activeTable === t.id && (
                        <span className="w-2 h-2 rounded-full bg-[#E5C378]" />
                      )}
                    </button>
                  ))}

                  {onNavigateStation && (
                    <div className="pt-2 mt-2 border-t border-[#2A221A] space-y-1">
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#C89B3C] font-semibold">
                        Kitchen & Bar Stations
                      </div>
                      <button
                        onClick={() => {
                          playTapSound();
                          setShowTableMenu(false);
                          onNavigateStation('kitchen');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-300 hover:bg-[#201C17] flex items-center justify-between min-h-[40px]"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🍳 Kitchen KDS Display</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">/kitchen</span>
                      </button>

                      <button
                        onClick={() => {
                          playTapSound();
                          setShowTableMenu(false);
                          onNavigateStation('bar');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-300 hover:bg-[#201C17] flex items-center justify-between min-h-[40px]"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🍸 Bar KDS Display</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">/bar</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Cart Trigger Button */}
          {onOpenCart && (
            <button
              onClick={() => {
                playTapSound();
                onOpenCart();
              }}
              className="lg:hidden relative w-10 h-10 rounded-xl bg-[#5C1D24] text-[#F3E7C4] flex items-center justify-center border border-[#7D2833] min-h-[44px] min-w-[44px] active:scale-95 shadow-md"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#E5C378]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C89B3C] text-[#0C0B0A] text-[10px] font-extrabold flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Reader status chip (Desktop) */}
          <div
            onClick={onOpenSettings}
            className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#161310] border border-[#2D261F] text-xs text-[#E5C378] cursor-pointer hover:border-[#C89B3C]/50"
            title="SumUp Reader Status"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span className="text-[11px] font-medium truncate max-w-[100px]">
              {activeReader ? activeReader.name : 'SumUp Solo'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Fullscreen Toggle (Hidden on small mobile where screen handles it) */}
          <button
            onClick={() => {
              playTapSound();
              onToggleFullscreen();
            }}
            className="hidden sm:flex w-10 h-10 rounded-xl bg-[#181512] text-stone-400 hover:text-white items-center justify-center border border-[#2D261F] min-h-[44px] min-w-[44px] active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Kiosk'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* More Options / Settings */}
          <button
            onClick={() => {
              playTapSound();
              onOpenSettings();
            }}
            className="w-10 h-10 rounded-xl bg-[#181512] text-stone-400 hover:text-white flex items-center justify-center border border-[#2D261F] min-h-[44px] min-w-[44px] active:scale-95"
            title="Terminal & Inventory Hub"
            aria-label="Terminal & Inventory Hub"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden pb-3 pt-1 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search cocktails, pasta, small plates..."
              className="w-full pl-9 pr-9 py-2 bg-[#161310] border border-[#2A241D] rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#C89B3C]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
