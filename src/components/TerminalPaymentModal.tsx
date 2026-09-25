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
  const [statusMessage, setStatusMessage] = useState('Please present card or device to the SumUp terminal.');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  // Poll backend API endpoint every 2 seconds for transaction status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/checkout/${checkout.id}`);
        if (!res.ok) return;

        const data: CheckoutResponse = await res.json();

        if (data.status === 'SUCCESSFUL') {
          setCurrentStep('approved');
          setStatusMessage('Authorization Successful. Order confirmed.');
          playSuccessChime();
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTimeout(() => {
            onSuccess(data);
          }, 1200);
        } else if (data.status === 'FAILED') {
          setCurrentStep('declined');
          setStatusMessage(data.failureReason || 'Card payment declined. Please present another card.');
          playAlertBeep();
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setTimeout(() => {
            onFailure(data.failureReason || 'Card declined');
          }, 2500);
        } else if (data.status === 'CANCELLED') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          onCancel();
        } else {
          if (data.terminalStep === 'processing') {
            setCurrentStep('processing');
            setStatusMessage('Authorizing card with SumUp Cloud...');
          }
        }
      } catch (err) {
        console.error('Error polling checkout:', err);
      }
    };

    pollIntervalRef.current = setInterval(pollStatus, 2000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [checkout.id, onSuccess, onFailure, onCancel]);

  // Handle Simulating Card Actions
  const handleSimulateAction = async (action: 'tap' | 'decline') => {
    setIsSimulating(true);
    playTapSound();

    if (action === 'tap') {
      setCurrentStep('processing');
      setStatusMessage('Card Detected. Communicating with bank...');
    }

    try {
      await fetch(`/api/checkout/${checkout.id}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch {
      // Ignore
    } finally {
      setIsSimulating(false);
    }
  };

  // Cancel order execution
  const handleCancel = async () => {
    setIsCancelling(true);
    playTapSound();
    try {
      await fetch(`/api/checkout/${checkout.id}/cancel`, { method: 'POST' });
    } catch {
      // Ignore
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/95 bg-concierge-grid backdrop-blur-md flex flex-col justify-between p-6 md:p-12 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto pb-4 border-b border-[#c89b3c]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#c89b3c] flex items-center justify-center text-[#c89b3c]">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#e0d9cc] tracking-wide">
              SumUp Terminal Authorization
            </h2>
            <div className="font-mono-meta text-xs text-[#c89b3c]/80 flex items-center gap-2 mt-0.5">
              <span>Reader: {checkout.readerName || 'SumUp Solo'}</span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Link
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCancel}
          disabled={isCancelling || currentStep === 'approved'}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#c89b3c]/30 text-[#e0d9cc]/60 hover:text-[#e0d9cc] hover:border-[#c89b3c] transition-colors font-mono-meta text-xs uppercase tracking-wider min-h-[44px]"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Center Interactive Terminal Graphic */}
      <div className="flex flex-col items-center justify-center my-auto max-w-xl mx-auto text-center w-full">
        {/* SumUp Terminal Physical Representation */}
        <div className="relative mb-8">
          <div className="w-68 h-88 bg-[#0a0a0a] rounded-2xl border-2 border-[#c89b3c]/40 shadow-[0_0_40px_rgba(200,155,60,0.15)] p-5 flex flex-col items-center justify-between relative overflow-hidden">
            {/* Terminal Screen */}
            <div className="w-full h-48 bg-[#050505] rounded-xl border border-[#c89b3c]/30 p-4 flex flex-col items-center justify-between text-[#e0d9cc] relative">
              {/* Screen Header */}
              <div className="w-full flex items-center justify-between font-mono-meta text-[10px] text-[#c89b3c]">
                <span className="font-bold tracking-widest">SUMUP SOLO</span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  100%
                </span>
              </div>

              {/* Amount Display */}
              <div className="my-auto text-center">
                <div className="font-mono-meta text-[11px] text-[#e0d9cc]/50 uppercase tracking-widest">
                  Total Due
                </div>
                <div className="font-cinzel text-3xl font-bold text-[#c89b3c] tracking-tight mt-1">
                  {formattedCurrency}
                  {checkout.amount.toFixed(2)}
                </div>
              </div>

              {/* Terminal Screen Status Icon */}
              <div className="w-full flex items-center justify-center pb-1 font-mono-meta text-xs">
                {currentStep === 'awaiting_card' && (
                  <div className="flex items-center gap-1.5 text-[#c89b3c]">
                    <Wifi className="w-3.5 h-3.5 animate-pulse rotate-90" />
                    <span className="uppercase tracking-wider">Present Card</span>
                  </div>
                )}
                {currentStep === 'processing' && (
                  <div className="flex items-center gap-1.5 text-[#e0d9cc]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c89b3c]" />
                    <span className="uppercase tracking-wider">Authorizing...</span>
                  </div>
                )}
                {currentStep === 'approved' && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wider">Approved</span>
                  </div>
                )}
                {currentStep === 'declined' && (
                  <div className="flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="uppercase tracking-wider">Declined</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terminal Hardware Details */}
            <div className="w-full flex items-center justify-between px-2 pt-3 text-[10px] font-mono-meta text-[#e0d9cc]/30">
              <span>NFC / CHIP</span>
              <div className="w-2 h-2 rounded-full bg-[#c89b3c] shadow-[0_0_8px_#c89b3c]" />
              <span>EMV L2</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <h3 className="font-cinzel text-2xl font-bold text-[#e0d9cc] mb-2">
          {statusMessage}
        </h3>
        <p className="font-mono-meta text-xs text-[#c89b3c]/80 uppercase tracking-widest max-w-md">
          Table {checkout.orderNumber || '12'} · Ref: {checkout.id}
        </p>

        {/* Interactive Quick Simulation triggers */}
        <div className="mt-8 p-4 bg-[#0a0a0a] border border-[#c89b3c]/20 rounded-[2px] w-full max-w-sm">
          <div className="font-mono-meta text-[10px] text-[#c89b3c] uppercase tracking-widest mb-3">
            Terminal Test Simulation
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => handleSimulateAction('tap')}
              disabled={isSimulating || currentStep === 'approved'}
              className="flex-1 py-2.5 px-3 bg-[#c89b3c] hover:bg-[#d6ab4e] text-black font-cinzel text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Simulate Card Tap
            </button>
            <button
              onClick={() => handleSimulateAction('decline')}
              disabled={isSimulating || currentStep === 'approved'}
              className="py-2.5 px-3 bg-[#111] hover:bg-[#1a1a1a] border border-rose-500/40 text-rose-300 font-mono-meta text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Decline
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Security Assurance */}
      <div className="max-w-4xl w-full mx-auto pt-4 border-t border-[#c89b3c]/20 flex items-center justify-between font-mono-meta text-[11px] text-[#e0d9cc]/30">
        <div>ENCRYPTED HARDWARE EMV / PCI-PTS CERTIFIED</div>
        <div>AMICA PRIVATE CONCIERGE</div>
      </div>
    </div>
  );
};
