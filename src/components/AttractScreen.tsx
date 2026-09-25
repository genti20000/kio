import React from 'react';
import { motion } from 'motion/react';
import { Coffee, ArrowRight, Sparkles, CreditCard } from 'lucide-react';
import { OrderType } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';
import coffeeHeroImg from '../assets/images/coffee_atelier_hero_1790359067443.jpg';

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
      className="relative w-full h-full min-h-screen bg-roastery-pattern text-[#f4ece1] flex flex-col justify-between overflow-x-hidden cursor-pointer select-none p-6 md:p-12"
    >
      {/* Background Overhead Photography matching uploaded coffee design */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={coffeeHeroImg}
          alt="Coffee Roastery Atelier"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-35 filter brightness-[0.75] contrast-[1.1] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/80 to-[#0e0c0a]/60" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#241a14] border border-[#c88a58]/40 flex items-center justify-center text-[#dda15e] shadow-md">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono-meta text-[10px] md:text-xs tracking-[0.25em] text-[#dda15e] uppercase">
              Artisanal Roastery & Bar
            </span>
            <div className="font-coffee text-sm md:text-base font-bold text-[#f4ece1] tracking-wide">
              AMICA ATELIER
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c1714]/90 border border-[#c88a58]/30 font-mono-meta text-[11px] text-[#dda15e]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SumUp Terminal Ready</span>
        </div>
      </header>

      {/* Center Editorial Hero matching uploaded image typography */}
      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#261b14]/80 border border-[#c88a58]/40 text-[#dda15e] font-mono-meta text-[11px] tracking-widest uppercase mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Single Origin & Craft Cocktails</span>
        </motion.div>

        {/* Big Coffee Coffee Headline styling from uploaded image */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="font-coffee text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-[#f4ece1] leading-none mb-4"
        >
          Coffee <span className="text-[#dda15e] italic font-normal">Coffee</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-sm sm:text-base md:text-lg text-[#b8aaa0] max-w-lg mb-10 font-light leading-relaxed"
        >
          Roasted on-site with meticulous temperature profiles. Touch the screen to explore our cupping notes, order table-side, or pay via contactless.
        </motion.p>

        {/* Warm Pill Buttons from the image */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleSelect('dine_in')}
            className="w-full sm:flex-1 py-4 px-8 rounded-full pill-caramel font-coffee text-base font-bold tracking-wider uppercase transition-all duration-300 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 shadow-lg min-h-[54px] cursor-pointer"
          >
            <span>Dine In / Table</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleSelect('takeaway')}
            className="w-full sm:flex-1 py-4 px-8 rounded-full pill-espresso font-coffee text-base font-semibold tracking-wider uppercase transition-all duration-300 hover:border-[#dda15e] active:scale-95 flex items-center justify-center gap-2 min-h-[54px] cursor-pointer"
          >
            <span>Express Takeaway</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#b8aaa0]/70 font-mono-meta border-t border-[#c88a58]/20 pt-4 gap-2">
        <div>AMICA ROASTERY · ETHIOPIA · COLOMBIA · GUATEMALA</div>
        <div className="flex items-center gap-3">
          <span>CONTACTLESS</span>
          <span>·</span>
          <span>APPLE PAY & SUMUP</span>
        </div>
      </footer>
    </div>
  );
};
