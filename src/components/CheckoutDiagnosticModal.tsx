import React from 'react';
import { AlertCircle, CreditCard, RefreshCw, X, ArrowRight, ExternalLink } from 'lucide-react';
import { playTapSound } from '../utils/audio.ts';

export interface CheckoutErrorInfo {
  title: string;
  message: string;
  detail?: string;
  suggestSimulation?: boolean;
}

interface CheckoutDiagnosticModalProps {
  error: CheckoutErrorInfo;
  onClose: () => void;
  onOpenSettings: () => void;
  onSwitchToSimulationAndPay: () => void;
}

export const CheckoutDiagnosticModal: React.FC<CheckoutDiagnosticModalProps> = ({
  error,
  onClose,
  onOpenSettings,
  onSwitchToSimulationAndPay,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 md:p-8 flex flex-col shadow-2xl overflow-hidden relative">
        <button
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
          <AlertCircle className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
          {error.title}
        </h3>

        {/* Message */}
        <p className="text-stone-300 text-sm leading-relaxed mb-4 font-light">
          {error.message}
        </p>

        {/* Detail Box */}
        {error.detail && (
          <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800/90 text-xs text-stone-400 leading-relaxed mb-6 font-mono">
            {error.detail}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 border-t border-stone-800">
          {error.suggestSimulation && (
            <button
              onClick={() => {
                playTapSound();
                onSwitchToSimulationAndPay();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 min-h-[50px] text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Test Order in Simulation Mode</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                playTapSound();
                onOpenSettings();
              }}
              className="py-3 px-4 rounded-xl bg-stone-800 border border-stone-700 text-white font-semibold hover:bg-stone-750 transition-colors text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Open Settings</span>
            </button>

            <button
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="py-3 px-4 rounded-xl border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-850 transition-colors text-xs min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
