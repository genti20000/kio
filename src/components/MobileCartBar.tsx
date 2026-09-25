import React from 'react';
import { ShoppingBag, ChevronUp, CreditCard } from 'lucide-react';
import { CartItem } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';

interface MobileCartBarProps {
  items: CartItem[];
  currency: string;
  activeTable: string;
  onOpenCart: () => void;
  onQuickPay: () => void;
}

export const MobileCartBar: React.FC<MobileCartBarProps> = ({
  items,
  currency,
  activeTable,
  onOpenCart,
  onQuickPay,
}) => {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalCount === 0) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
  const total = subtotal * 1.125; // 12.5% service charge
  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-2.5 bg-gradient-to-t from-[#0C0B0A] via-[#0C0B0A]/95 to-transparent pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))] pointer-events-none">
      <div className="pointer-events-auto max-w-lg mx-auto bg-[#181410] border border-[#C89B3C]/40 rounded-2xl p-2 shadow-2xl shadow-black/80 flex items-center justify-between backdrop-blur-md">
        {/* Left: Cart Info & trigger to open sheet */}
        <button
          onClick={() => {
            playTapSound();
            onOpenCart();
          }}
          className="flex items-center gap-3 pl-2 text-left active:opacity-80"
          aria-label="View order details"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#5C1D24] border border-[#7D2833] flex items-center justify-center text-[#F3E7C4]">
              <ShoppingBag className="w-5 h-5 text-[#E5C378]" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C89B3C] text-[#0C0B0A] text-[11px] font-extrabold flex items-center justify-center shadow-md">
              {totalCount}
            </span>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#F3E7C4] flex items-center gap-1.5">
              <span>{activeTable} Order</span>
              <ChevronUp className="w-3.5 h-3.5 text-[#C89B3C]" />
            </div>
            <div className="text-[11px] text-stone-400">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} · <span className="text-[#E5C378] font-bold tabular-nums">{formattedCurrency}{total.toFixed(2)}</span>
            </div>
          </div>
        </button>

        {/* Right: Quick Pay / Review CTA */}
        <button
          onClick={() => {
            playTapSound();
            onOpenCart();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#E5C378] text-[#0C0B0A] font-bold text-xs shadow-lg shadow-[#C89B3C]/20 hover:brightness-105 active:scale-95 transition-all min-h-[44px]"
        >
          <CreditCard className="w-3.5 h-3.5 text-[#0C0B0A]" />
          <span>View Order</span>
        </button>
      </div>
    </div>
  );
};
