import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Mail, Send, Printer, ArrowRight } from 'lucide-react';
import { KioskOrder } from '../types/kiosk.ts';
import { playTapSound, playAddToCartSound } from '../utils/audio.ts';

interface PaymentSuccessModalProps {
  order: KioskOrder;
  currency: string;
  onDone: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  order,
  currency,
  onDone,
}) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(30);

  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  // Auto-reset countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDone]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsSending(true);
    playTapSound();

    try {
      const res = await fetch('/api/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          orderNumber: order.orderNumber,
          items: order.items,
          total: order.total,
        }),
      });

      if (res.ok) {
        setEmailSent(true);
        playAddToCartSound();
      } else {
        setErrorMessage('Failed to dispatch receipt. Please try again.');
      }
    } catch {
      setErrorMessage('Network error sending receipt.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    playTapSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/95 bg-concierge-grid backdrop-blur-md flex items-center justify-center p-6 select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-[#0a0a0a] border border-[#c89b3c]/40 rounded-[2px] p-8 md:p-12 shadow-2xl relative my-auto"
      >
        {/* Success Icon Lockup */}
        <div className="w-16 h-16 border-2 border-[#c89b3c] flex items-center justify-center text-[#c89b3c] mx-auto mb-6 shadow-[0_0_20px_rgba(200,155,60,0.3)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="text-center mb-8">
          <span className="meta-label">Payment Authorized</span>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-[#e0d9cc] tracking-wide mt-2">
            Reservation Confirmed
          </h2>
          <div className="font-mono-meta text-xs text-[#c89b3c] mt-2">
            ORDER {order.orderNumber} · {order.orderType === 'dine_in' ? 'TABLE CONCIERGE' : 'EXPRESS COUNTER'}
          </div>
        </div>

        {/* Order Receipt Summary */}
        <div className="p-6 bg-[#111111] border border-white/10 rounded-[2px] mb-8 space-y-3 font-sans-editorial">
          <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2 pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-xs text-[#e0d9cc]/80">
                <span className="font-cinzel">{item.quantity}x {item.name}</span>
                <span className="font-mono-meta text-[#c89b3c]">
                  {formattedCurrency}{(item.unitTotal * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
            <span className="meta-label text-xs">Total Settled</span>
            <span className="font-cinzel text-2xl font-bold text-[#c89b3c]">
              {formattedCurrency}{order.total.toFixed(2)}
            </span>
          </div>

          <div className="font-mono-meta text-[10px] text-[#e0d9cc]/40 text-center pt-1">
            Processed via SumUp Cloud Terminal · {order.readerName}
          </div>
        </div>

        {/* Email Receipt Dispatch */}
        <div className="mb-8">
          <span className="meta-label text-xs mb-2 block text-center">Digital Receipt</span>
          {emailSent ? (
            <div className="p-3 bg-[#c89b3c]/10 border border-[#c89b3c] text-[#e0d9cc] text-xs font-mono-meta text-center">
              Receipt dispatched to {email}
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email for receipt..."
                className="flex-grow px-4 py-3 bg-[#111] border border-white/10 text-xs text-[#e0d9cc] font-mono-meta focus:outline-none focus:border-[#c89b3c] rounded-[2px]"
              />
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-3 bg-[#c89b3c] hover:bg-[#d6ab4e] text-black font-cinzel text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>
          )}
          {errorMessage && (
            <p className="font-mono-meta text-[11px] text-rose-400 mt-2 text-center">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Actions: Print & Done */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-4 px-4 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-[#e0d9cc] font-cinzel text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#c89b3c]" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              onDone();
            }}
            className="flex-1 py-4 px-4 bg-[#c89b3c] hover:bg-[#d6ab4e] text-black font-cinzel text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,155,60,0.3)]"
          >
            <span>Finish ({countdown}s)</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
