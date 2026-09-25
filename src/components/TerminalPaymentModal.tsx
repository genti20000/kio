import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Wifi, AlertCircle, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { CheckoutResponse } from '../types/kiosk.ts';
import { playTapSound, playAlertBeep, playSuccessChime } from '../utils/audio.ts';

interface TerminalPaymentModalProps {
  checkout: CheckoutResponse;
  currency: string;
  onSuccess: (updatedCheckout: CheckoutResponse) => void;
  onFailure: (reason: string) => void;
  onCancel: () => void;
  isSimulationMode: boolean;
}

export const TerminalPaymentModal: React.FC<TerminalPaymentModalProps> = ({
  checkout,
  currency,
  onSuccess,
  onFailure,
  onCancel,
  isSimulationMode,
}) => {
  const [currentStep, setCurrentStep] = useState<'awaiting_card' | 'processing' | 'approved' | 'declined'>('awaiting_card');
  const [statusMessage, setStatusMessage] = useState('Please tap, insert, or swipe your card on the terminal.');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formattedCurrency = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

  // Poll backend API endpoint every 2 seconds for transaction status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/${checkout.id}`);
        if (!res.ok) return;

        const data: CheckoutResponse = await res.json();

        if (data.status === 'SUCCESSFUL') {
          setCurrentStep('approved');
          setStatusMessage('Payment Approved! Thank you.');
          playSuccessChime();
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTimeout(() => {
            onSuccess(data);
          }, 1200);
        } else if (data.status === 'FAILED') {
          setCurrentStep('declined');
          setStatusMessage(data.failureReason || 'Card payment declined. Please try another card.');
          playAlertBeep();
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTimeout(() => {
            onFailure(data.failureReason || 'Card declined');
          }, 2500);
        } else if (data.status === 'CANCELLED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          onCancel();
        } else {
          // Status is PENDING
          if (data.terminalStep === 'processing') {
            setCurrentStep('processing');
            setStatusMessage('Authorizing with card issuer...');
          } else if (data.terminalStep === 'connecting') {
            setStatusMessage('Waking SumUp terminal...');
          } else {
            setCurrentStep('awaiting_card');
            setStatusMessage('Please tap, insert, or swipe your card on the terminal.');
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    };

    // Initial check
    pollStatus();

    // 2-second polling as specified
    pollIntervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkout.id, onSuccess, onFailure, onCancel]);

  // Handle manual simulation trigger (allows instant testing)
  const handleSimulateAction = async (action: 'approve' | 'decline') => {
    setIsSimulating(true);
    playTapSound();
    try {
      const res = await fetch(`/api/checkout/${checkout.id}/simulate-tap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await res.json();
    } catch {
      // Ignore
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle cancel checkout
  const handleCancel = async () => {
    playTapSound();
    setIsCancelling(true);
    try {
      await fetch(`/api/checkout/${checkout.id}/cancel`, { method: 'POST' });
    } catch {
      // Ignore
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0B0A]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto flex-shrink-0 mb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5C1D24] border border-[#7D2833] flex items-center justify-center text-[#E5C378]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              SumUp Terminal Checkout
            </h2>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span>{checkout.readerName || 'SumUp Solo'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Connected
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCancel}
          disabled={isCancelling || currentStep === 'approved'}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161310] border border-[#2D261F] text-stone-400 hover:text-white transition-colors text-xs min-h-[44px]"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Cancel Order</span>
        </button>
      </div>

      {/* Center Interactive Terminal Graphic */}
      <div className="flex flex-col items-center justify-center my-auto max-w-xl mx-auto text-center w-full py-4">
        {/* SumUp Terminal Physical Representation */}
        <div className="relative mb-6">
          {/* Terminal Body */}
          <div className="w-56 h-72 sm:w-64 sm:h-80 bg-[#161310] rounded-3xl border-4 border-[#2A241D] shadow-2xl p-3.5 flex flex-col items-center justify-between relative overflow-hidden">
            {/* Terminal Screen */}
            <div className="w-full h-36 sm:h-44 bg-[#0A0807] rounded-2xl border border-[#332A20] p-3 flex flex-col items-center justify-between text-white relative">
              {/* Screen Header */}
              <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] text-stone-400">
                <span className="font-bold tracking-wider text-[#E5C378]">SUMUP SOLO</span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  100%
                </span>
              </div>

              {/* Screen Amount Display */}
              <div className="my-auto text-center">
                <div className="text-[10px] sm:text-xs text-stone-400">Total Due</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#F3E7C4] tabular-nums tracking-tight font-brand">
                  {formattedCurrency}
                  {checkout.amount.toFixed(2)}
                </div>
              </div>

              {/* Terminal Screen Status Icon */}
              <div className="w-full flex items-center justify-center pb-1">
                {currentStep === 'awaiting_card' && (
                  <div className="flex items-center gap-1 text-[11px] text-[#E5C378] font-medium">
                    <Wifi className="w-3.5 h-3.5 animate-pulse text-[#C89B3C] rotate-90" />
                    <span>Present Card</span>
                  </div>
                )}
                {currentStep === 'processing' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-sky-300 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing...</span>
                  </div>
                )}
                {currentStep === 'approved' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approved</span>
                  </div>
                )}
                {currentStep === 'declined' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-300 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Declined</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contactless NFC Waves & Card Slot Visual */}
            <div className="w-full flex flex-col items-center gap-1.5 my-2">
              <div className="flex items-center gap-1 text-stone-600">
                <div className="w-6 h-1 rounded-full bg-stone-800" />
                <div className="w-10 h-1 rounded-full bg-stone-700" />
                <div className="w-6 h-1 rounded-full bg-stone-800" />
              </div>
            </div>

            {/* Bottom Chip Card Slot */}
            <div className="w-28 h-2 bg-black rounded-full border border-stone-800" />
          </div>

          {/* Animated Credit Card Tap Hover Motion */}
          {currentStep === 'awaiting_card' && (
            <motion.div
              initial={{ y: -20, opacity: 0.8 }}
              animate={{ y: [0, -10, 0], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute -top-6 -right-4 sm:-right-8 w-28 sm:w-36 h-18 sm:h-22 bg-gradient-to-tr from-[#C89B3C] to-[#E5C378] rounded-xl shadow-xl p-2.5 flex flex-col justify-between text-stone-950 border border-amber-200/50 pointer-events-none"
            >
              <div className="flex items-center justify-between">
                <div className="w-5 h-3.5 bg-black/20 rounded" />
                <Wifi className="w-3 h-3 rotate-90 text-stone-900" />
              </div>
              <div className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest">
                •••• 4242
              </div>
            </motion.div>
          )}
        </div>

        {/* Dynamic Instructional Title & Subtext */}
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
          {currentStep === 'approved'
            ? 'Payment Successful'
            : currentStep === 'declined'
            ? 'Payment Declined'
            : currentStep === 'processing'
            ? 'Processing Card...'
            : 'Tap Card on Solo Terminal'}
        </h3>

        <p className="text-xs sm:text-sm text-stone-300 max-w-sm font-light leading-relaxed mb-4">
          {statusMessage}
        </p>

        {/* Polling pulse indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161310] border border-[#2D261F] text-[11px] text-stone-400">
          <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-ping" />
          <span>Polling terminal every 2 seconds</span>
        </div>

        {/* Simulation / Testing Controls */}
        {isSimulationMode && (
          <div className="mt-6 p-3 sm:p-4 rounded-2xl bg-[#14120F] border border-[#2D261F] max-w-md w-full">
            <div className="text-[11px] font-semibold text-[#E5C378] uppercase tracking-wider mb-1.5">
              Terminal Simulation Controls
            </div>
            <p className="text-[11px] text-stone-400 mb-3 font-light">
              Tap below to simulate an immediate customer interaction on the terminal:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isSimulating || currentStep === 'approved'}
                onClick={() => handleSimulateAction('approve')}
                className="py-2.5 px-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simulate Tap</span>
              </button>
              <button
                disabled={isSimulating || currentStep === 'approved'}
                onClick={() => handleSimulateAction('decline')}
                className="py-2.5 px-3 rounded-xl bg-rose-950/60 border border-rose-600/40 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Simulate Decline</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="max-w-4xl w-full mx-auto text-center text-[10px] sm:text-xs text-stone-500 flex-shrink-0 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <span>Payment securely processed by SumUp Cloud Payments. EMV & Contactless compliant.</span>
      </div>
    </div>
  );
};
