import React from 'react';
import { Clock, RefreshCcw } from 'lucide-react';
import { playTapSound } from '../utils/audio.ts';

interface InactivityWarningModalProps {
  remainingSeconds: number;
  onContinue: () => void;
  onReset: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  remainingSeconds,
  onContinue,
  onReset,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
          Are you still ordering?
        </h3>

        <p className="text-stone-300 text-sm font-light mb-6">
          To protect your privacy, this self-checkout screen will automatically reset in{' '}
          <span className="font-mono font-bold text-amber-400 text-base">{remainingSeconds}s</span>.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              playTapSound();
              onContinue();
            }}
            className="w-full py-4 px-6 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-all text-base min-h-[50px] shadow-lg shadow-amber-500/20"
          >
            I'm Still Ordering
          </button>

          <button
            onClick={() => {
              playTapSound();
              onReset();
            }}
            className="w-full py-3 px-6 rounded-xl bg-stone-800 text-stone-300 font-semibold hover:bg-stone-750 transition-colors text-sm min-h-[44px] flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Reset Kiosk Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
