import React from 'react';
import {
  CreditCard,
  Trash2,
  Plus,
  Minus,
  Pencil,
  X,
  Coffee,
  Check,
} from 'lucide-react';
import { CartItem } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';

interface CartDrawerProps {
  items: CartItem[];
  currency: string;
  activeTable: string;
  activeReaderName?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onPayNow: () => void;
  onEditItem?: (item: CartItem) => void;
  isProcessingPayment?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  currency,
  activeTable,
  activeReaderName = 'SumUp Solo Terminal',
  isOpenMobile = false,
  onCloseMobile,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPayNow,
  onEditItem,
  isProcessingPayment,
}) => {
  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  const subtotal = items.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
  const serviceCharge = subtotal * 0.125; // 12.5% London hospitality service
  const total = subtotal + serviceCharge;

  const content = (
    <div className="flex flex-col h-full justify-between select-none bg-[#14100e] text-[#f4ece1]">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[#c88a58]/20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#241a14] border border-[#c88a58]/30 flex items-center justify-center text-[#dda15e]">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono-meta text-[10px] text-[#dda15e] uppercase tracking-wider block">
              Cupping Order · {activeTable}
            </span>
            <h2 className="font-coffee text-xl sm:text-2xl font-bold text-[#f4ece1]">
              Table Summary
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => {
                playTapSound();
                onClearCart();
              }}
              className="p-2 text-[#b8aaa0] hover:text-rose-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Clear table order"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={() => {
                playTapSound();
                onCloseMobile();
              }}
              className="lg:hidden p-2 rounded-full bg-[#241a14] text-[#b8aaa0] hover:text-[#f4ece1] min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-grow overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#b8aaa0]/60 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#1e1713] border border-[#c88a58]/20 flex items-center justify-center text-[#dda15e]/70">
              <Coffee className="w-6 h-6" />
            </div>
            <p className="font-coffee text-base text-[#f4ece1]/80">
              Your cup is empty
            </p>
            <p className="font-body text-xs text-[#b8aaa0]/60 max-w-[220px]">
              Explore our single origin roasts, pastries, and signature drinks to begin.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const optionValues = item.selectedOptions
              ? Object.values(item.selectedOptions).join(', ')
              : '';

            return (
              <div
                key={item.cartId}
                className="p-3.5 sm:p-4 rounded-xl bg-[#1d1714] border border-[#c88a58]/15 flex items-start justify-between gap-3 group hover:border-[#dda15e]/40 transition-colors"
              >
                <div className="flex-grow">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-coffee text-sm sm:text-base font-bold text-[#f4ece1] leading-tight">
                      {item.name}
                    </h4>
                    <span className="font-mono-meta text-xs sm:text-sm font-bold text-[#dda15e] whitespace-nowrap">
                      {formattedCurrency}{(item.unitTotal * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {optionValues && (
                    <div className="font-body text-xs text-[#b8aaa0] mt-1 flex items-center gap-1.5">
                      <span className="truncate max-w-[180px]">{optionValues}</span>
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="text-[#dda15e] hover:text-[#f4ece1] p-1"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quantity Stepper (touch-friendly on mobile) */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playTapSound();
                          onUpdateQuantity(item.cartId, -1);
                        }}
                        className="w-7 h-7 rounded-full bg-[#2a1f18] text-[#f4ece1] flex items-center justify-center hover:bg-[#3d2b20] active:scale-95 transition-all min-h-[32px] min-w-[32px]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="font-mono-meta text-xs font-bold text-[#dda15e] w-5 text-center">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => {
                          playTapSound();
                          onUpdateQuantity(item.cartId, 1);
                        }}
                        className="w-7 h-7 rounded-full bg-[#2a1f18] text-[#f4ece1] flex items-center justify-center hover:bg-[#3d2b20] active:scale-95 transition-all min-h-[32px] min-w-[32px]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        playTapSound();
                        onRemoveItem(item.cartId);
                      }}
                      className="font-mono-meta text-[10px] text-rose-400/70 hover:text-rose-400 uppercase tracking-wider p-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Totals & Authorize Payment CTA */}
      <div className="p-5 sm:p-6 bg-[#110e0c] border-t border-[#c88a58]/20 space-y-4 flex-shrink-0">
        <div className="space-y-1.5 text-xs font-body text-[#b8aaa0]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono-meta text-[#f4ece1]">
              {formattedCurrency}{subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Hospitality Service (12.5%)</span>
            <span className="font-mono-meta text-[#f4ece1]">
              {formattedCurrency}{serviceCharge.toFixed(2)}
            </span>
          </div>

          <div className="pt-2 border-t border-[#c88a58]/15 flex justify-between items-baseline">
            <span className="font-coffee text-base text-[#f4ece1] font-bold">Total</span>
            <span className="font-mono-meta text-2xl sm:text-3xl font-bold text-[#dda15e]">
              {formattedCurrency}{total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Warm Caramel Pill Button from the uploaded image */}
        <button
          disabled={items.length === 0 || isProcessingPayment}
          onClick={() => {
            playTapSound();
            onPayNow();
          }}
          className="w-full py-4 px-6 rounded-full pill-caramel font-coffee text-base font-bold uppercase tracking-wider transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5 shadow-xl min-h-[54px] cursor-pointer"
        >
          <CreditCard className="w-5 h-5 text-[#120d09]" />
          <span>Authorize Payment</span>
          <span>·</span>
          <span className="font-mono-meta text-sm font-bold">
            {formattedCurrency}{total.toFixed(2)}
          </span>
        </button>

        {/* Terminal Indicator */}
        <div className="flex items-center justify-center gap-2 font-mono-meta text-[11px] text-[#dda15e]/70 pt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SumUp Active · {activeTable}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-[380px] xl:w-[420px] border-l border-[#c88a58]/20 flex-shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile / Tablet Slide-up Bottom Sheet Modal */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-h-[88vh] bg-[#14100e] rounded-t-3xl border-t-2 border-[#c88a58]/40 shadow-2xl flex flex-col overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
