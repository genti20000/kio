import React from 'react';
import { motion } from 'motion/react';
import { Wine, Utensils, Sparkles, ChevronRight, CreditCard } from 'lucide-react';
import { OrderType } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';
import facadeImg from '../assets/images/amica_facade_entrance_1790356001503.jpg';
import cocktailsImg from '../assets/images/amica_cocktails_collection_1790355946328.jpg';

interface AttractScreenProps {
  onStartOrder: (orderType: OrderType) => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({ onStartOrder }) => {
  const handleSelect = (type: OrderType) => {
    playTapSound();
    onStartOrder(type);
  };

  return (
    <div
      onClick={() => handleSelect('dine_in')}
      className="relative w-full h-full min-h-screen bg-[#0C0B0A] text-stone-100 flex flex-col justify-between overflow-hidden cursor-pointer select-none"
    >
      {/* Background Ambient Imagery with Moody Scrim */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full opacity-40 scale-105 transition-transform duration-1000">
          <img
            src={facadeImg}
            alt="Amica Soho Facade"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <img
            src={cocktailsImg}
            alt="Amica Cocktails"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover hidden md:block"
          />
        </div>
        {/* Warm speakeasy vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A] via-[#0C0B0A]/85 to-[#0C0B0A]/60" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#0C0B0A]/50 to-[#0C0B0A]" />
      </div>

      {/* Top Header Branding */}
      <header className="relative z-10 p-4 sm:p-8 md:p-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#5C1D24]/40 border border-[#7D2833]/50 flex items-center justify-center text-[#E5C378]">
            <Wine className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-brand text-lg sm:text-2xl md:text-3xl font-bold tracking-wider text-[#F3E7C4]">
              AMICA SOHO
            </h1>
            <p className="text-[9px] sm:text-[11px] text-[#C89B3C] tracking-widest uppercase">
              COCKTAILS · APERITIVO · CUCINA · VINO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181614]/90 border border-[#2D2823] text-[11px] sm:text-xs text-[#E5C378]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <CreditCard className="w-3.5 h-3.5 text-[#C89B3C]" />
          <span className="hidden xs:inline">SumUp Solo Ready</span>
          <span className="xs:hidden">SumUp</span>
        </div>
      </header>

      {/* Center Call to Action */}
      <div className="relative z-10 px-4 sm:px-8 max-w-3xl mx-auto text-center flex flex-col items-center my-auto py-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#5C1D24]/30 border border-[#7D2833]/50 text-[#E5C378] text-[10px] sm:text-xs tracking-wider uppercase font-semibold mb-3 sm:mb-6 shadow-lg shadow-[#5C1D24]/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E5C378]" />
          <span>London Soho · Table & Bar POS</span>
        </motion.div>

        {/* Amica Stylized Logo Lockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-3 sm:mb-4"
        >
          <div className="font-brand text-5xl sm:text-7xl lg:text-8xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5DA] via-[#E5C378] to-[#9E782F] drop-shadow-md">
            AMICA
          </div>
          <div className="text-[10px] sm:text-xs md:text-sm tracking-[0.35em] text-[#C89B3C] uppercase mt-1">
            APERITIVO — MUSIC — LATE
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xs sm:text-base md:text-lg text-stone-300 mb-6 sm:mb-8 max-w-md font-light leading-relaxed px-2"
        >
          Touch anywhere to view menu, place table orders, or pay with SumUp contactless.
        </motion.p>

        {/* Order Type Selection Buttons */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSelect('dine_in')}
            className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#C89B3C] to-[#E5C378] text-[#120F0B] font-bold text-base hover:brightness-105 active:scale-95 transition-all shadow-xl shadow-[#C89B3C]/20 min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/15 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-[#120F0B]" />
              </div>
              <div className="text-left">
                <div className="text-sm sm:text-base font-bold tracking-wide">Table Service</div>
                <div className="text-[11px] text-[#3D2C0C] font-normal">Dine in at table or booth</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#120F0B]" />
          </button>

          <button
            onClick={() => handleSelect('takeaway')}
            className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#181614] border border-[#332C25] text-white font-semibold text-base hover:border-[#C89B3C]/50 active:scale-95 transition-all shadow-xl min-h-[64px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5C1D24]/30 border border-[#7D2833]/40 flex items-center justify-center text-[#E5C378]">
                <Wine className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm sm:text-base font-bold text-white tracking-wide">Bar Express</div>
                <div className="text-[11px] text-stone-400 font-normal">Drinks & quick counter</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-stone-400" />
          </button>
        </div>
      </div>

      {/* Bottom Footer Hint */}
      <footer className="relative z-10 p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-stone-500 border-t border-[#241F1A] text-center sm:text-left">
        <div>Good food. Good cocktails. Better company.</div>
        <div className="flex items-center gap-2">
          <span>SumUp Solo & Air</span>
          <span>·</span>
          <span>Contactless & Chip</span>
        </div>
      </footer>
    </div>
  );
};
