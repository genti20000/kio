import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Mail, Send, Printer, ArrowRight, Sparkles } from 'lucide-react';
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
  const [countdown, setCountdown] = useState(25);
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  const formattedCurrency = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

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
        setErrorMessage('Failed to send receipt. Please try again.');
      }
    } catch {
      setErrorMessage('Network error sending receipt.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    playTapSound();
    setShowPrintSlip(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0B0A]/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 md:p-10 overflow-y-auto select-none">
      <div className="max-w-xl mx-auto w-full my-auto flex flex-col items-center text-center py-4">
        {/* Animated Success Checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 sm:mb-6 shadow-xl shadow-emerald-500/10"
        >
          <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
        </motion.div>

        {/* Order Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5C1D24]/40 border border-[#7D2833] text-[#E5C378] text-[11px] font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Payment Approved</span>
        </div>

        {/* Big Kitchen Pickup Number */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#F3E7C4] tracking-tight mb-2 font-brand">
          Order #{order.orderNumber}
        </h1>

        <p className="text-stone-300 text-xs sm:text-sm max-w-md font-light mb-6">
          Your table order has been dispatched to the Cocktail Bar & Cucina.
        </p>

        {/* Order Receipt Card */}
        <div className="w-full bg-[#14120F] border border-[#2D261F] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-left mb-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#241F1A] text-xs text-stone-400">
            <span>{order.orderType === 'dine_in' ? 'Table Service' : 'Express Bar'}</span>
            <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="py-3 space-y-2 max-h-48 overflow-y-auto">
            {order.items.map((item) => (
              <div key={item.cartId} className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-stone-200">
                  <span className="font-semibold text-[#E5C378]">{item.quantity}×</span> {item.name}
                </span>
                <span className="font-mono tabular-nums text-stone-300">
                  {formattedCurrency}
                  {(item.unitTotal * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#241F1A] flex justify-between items-center text-sm sm:text-base font-bold text-white">
            <span>Total Paid (SumUp Card)</span>
            <span className="font-mono tabular-nums text-[#E5C378] text-base sm:text-lg">
              {formattedCurrency}
              {order.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Digital Receipt Section */}
        <div className="w-full bg-[#14120F]/80 border border-[#262019] rounded-2xl p-4 mb-6">
          {emailSent ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold py-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Digital receipt sent to {email}</span>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for e-receipt..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0C0B0A] border border-[#2B231B] rounded-xl text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-[#C89B3C] min-h-[44px]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#C89B3C] to-[#E5C378] text-[#0C0B0A] font-bold rounded-xl text-xs sm:text-sm hover:brightness-105 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px] active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2.5 bg-[#1E1914] text-stone-300 font-semibold rounded-xl text-xs hover:text-white transition-colors flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 border border-[#2E261D]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </form>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-400 mt-2 text-left">{errorMessage}</p>
          )}
        </div>

        {/* Done / Start New Order Button */}
        <button
          onClick={() => {
            playTapSound();
            onDone();
          }}
          className="w-full py-3.5 sm:py-4 px-6 bg-[#1A1613] hover:bg-[#221D18] border border-[#382E23] text-[#F3E7C4] font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 group min-h-[48px] active:scale-[0.98]"
        >
          <span>Done · Start New Order</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          <span className="text-xs text-stone-500 ml-2 font-normal">
            ({countdown}s auto-return)
          </span>
        </button>
      </div>

      {/* Hidden printable receipt for window.print() */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-mono text-xs">
        <div className="text-center pb-4 border-b border-black">
          <h1 className="text-xl font-bold">AMICA SOHO</h1>
          <p>42 Dean Street, Soho, London</p>
          <p>VAT Reg: GB 928 381 294</p>
        </div>
        <div className="py-2 border-b border-black flex justify-between">
          <span>Order #{order.orderNumber}</span>
          <span>{new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div className="py-4 space-y-1">
          {order.items.map((item) => (
            <div key={item.cartId} className="flex justify-between">
              <span>{item.quantity}x {item.name}</span>
              <span>{(item.unitTotal * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-black space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Service Charge (12.5%)</span>
            <span>{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
            <span>TOTAL</span>
            <span>{order.total.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-center pt-6 text-[10px]">
          <p>SumUp Solo POS Terminal</p>
          <p>Thank you for visiting Amica Soho.</p>
        </div>
      </div>
    </div>
  );
};
