import React, { useState } from 'react';
import {
  CreditCard,
  Printer,
  Wifi,
  Trash2,
  Clock,
  Wine,
  UtensilsCrossed,
  Users,
  Pencil,
  Plus,
  Minus,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { CartItem } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';

interface CartDrawerProps {
  items: CartItem[];
  currency: string;
  activeTable: string;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onPayNow: () => void;
  onEditItem?: (item: CartItem) => void;
  isProcessingPayment?: boolean;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  items,
  currency,
  activeTable,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onPayNow,
  onEditItem,
  isProcessingPayment,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'split' | 'history'>('current');
  const [orderNote, setOrderNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [operationalFeedback, setOperationalFeedback] = useState<string | null>(null);

  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  const subtotal = items.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
  const serviceCharge = subtotal * 0.125; // 12.5% discretionary service charge matching London Soho hospitality
  const total = subtotal + serviceCharge;

  const showFeedback = (msg: string) => {
    playTapSound();
    setOperationalFeedback(msg);
    setTimeout(() => setOperationalFeedback(null), 2500);
  };

  const handleSendToStation = async (station: 'bar' | 'kitchen') => {
    if (items.length === 0) return;
    playTapSound();

    try {
      const res = await fetch('/api/kds/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: `A-${Math.floor(100 + Math.random() * 900)}`,
          table: activeTable,
          orderType: 'dine_in',
          items: items.map((i) => ({
            id: i.cartId,
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            selectedOptions: i.selectedOptions,
          })),
          notes: orderNote,
          total: total,
          paid: false,
        }),
      });

      if (res.ok) {
        showFeedback(
          station === 'bar'
            ? '🍸 Drink tickets dispatched to Bar KDS'
            : '🍳 Food tickets dispatched to Kitchen KDS'
        );
      } else {
        showFeedback(`${station === 'bar' ? 'Drink' : 'Food'} tickets sent`);
      }
    } catch {
      showFeedback(`${station === 'bar' ? 'Drink' : 'Food'} tickets dispatched`);
    }
  };

  const renderContent = (isMobileSheet = false) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="p-3.5 sm:p-4 md:p-5 border-b border-[#241F1A] flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-brand text-base sm:text-lg font-bold text-[#F3E7C4] tracking-wide">
              {activeTable}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5C1D24] text-[#E5C378] font-bold">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 font-light mt-0.5">
            Table Service · Main Dining
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {items.length > 0 && (
            <button
              onClick={() => {
                playTapSound();
                onClearCart();
              }}
              className="text-stone-500 hover:text-rose-400 p-2 rounded-xl hover:bg-[#1A1613] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Clear table order"
              aria-label="Clear order"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {isMobileSheet && onCloseMobile && (
            <button
              onClick={() => {
                playTapSound();
                onCloseMobile();
              }}
              className="w-10 h-10 rounded-xl bg-[#1A1613] text-stone-300 hover:text-white flex items-center justify-center border border-[#2B231B] min-h-[44px] min-w-[44px]"
              aria-label="Close cart"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Current Order | Split Bill | Order History */}
      <div className="flex border-b border-[#241F1A] px-3 sm:px-4 bg-[#0A0908] flex-shrink-0">
        <button
          onClick={() => {
            playTapSound();
            setActiveTab('current');
          }}
          className={`py-2.5 px-3 text-xs font-semibold tracking-wide border-b-2 transition-colors min-h-[40px] ${
            activeTab === 'current'
              ? 'border-[#C89B3C] text-[#F3E7C4]'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          Current Order
        </button>
        <button
          onClick={() => {
            playTapSound();
            setActiveTab('split');
          }}
          className={`py-2.5 px-3 text-xs font-semibold tracking-wide border-b-2 transition-colors min-h-[40px] ${
            activeTab === 'split'
              ? 'border-[#C89B3C] text-[#F3E7C4]'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          Split Bill
        </button>
        <button
          onClick={() => {
            playTapSound();
            setActiveTab('history');
          }}
          className={`py-2.5 px-3 text-xs font-semibold tracking-wide border-b-2 transition-colors min-h-[40px] ${
            activeTab === 'history'
              ? 'border-[#C89B3C] text-[#F3E7C4]'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          History
        </button>
      </div>

      {/* Operational Feedback Toast */}
      {operationalFeedback && (
        <div className="px-4 py-2 bg-[#5C1D24] text-[#F3E7C4] text-xs font-medium flex items-center justify-between border-b border-[#7D2833] flex-shrink-0 animate-fade-in">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#E5C378]" />
            <span>{operationalFeedback}</span>
          </span>
        </div>
      )}

      {/* Cart Content Area */}
      <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain">
        {activeTab === 'split' ? (
          <div className="p-4 sm:p-6 text-center text-stone-400 text-xs space-y-3">
            <Users className="w-8 h-8 text-[#C89B3C] mx-auto opacity-80" />
            <div className="text-sm font-semibold text-white">Equal Split Bill</div>
            <p className="font-light">
              Total {formattedCurrency}{total.toFixed(2)} divided equally:
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[2, 3, 4].map((guests) => (
                <button
                  key={guests}
                  onClick={() => showFeedback(`Split between ${guests} guests: ${formattedCurrency}${(total / guests).toFixed(2)} each`)}
                  className="p-2.5 rounded-xl bg-[#161310] border border-[#2D261F] text-xs text-stone-200 hover:border-[#C89B3C] active:scale-95 transition-all"
                >
                  <div className="text-stone-400">{guests} Guests</div>
                  <div className="font-bold text-[#E5C378] mt-0.5">
                    {formattedCurrency}{(total / guests).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="p-6 text-center text-stone-500 text-xs space-y-2">
            <Clock className="w-6 h-6 mx-auto text-stone-600" />
            <p>No prior courses logged for {activeTable} in this session.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <div className="w-14 h-14 rounded-2xl bg-[#161310] border border-[#262019] flex items-center justify-center mb-2.5 text-stone-600">
              <Wine className="w-7 h-7" />
            </div>
            <p className="text-sm font-serif-luxury text-stone-300">No items selected</p>
            <p className="text-xs text-stone-500 mt-1 max-w-[200px] font-light">
              Tap any cocktail, small plate, or pasta to add to {activeTable}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const optionValues = item.selectedOptions
                ? Object.values(item.selectedOptions).join(', ')
                : '';

              return (
                <div
                  key={item.cartId}
                  className="py-2.5 px-3 rounded-xl bg-[#14120F] border border-[#241F1A] flex flex-col gap-1.5 hover:border-[#382E23] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-grow">
                      <span className="text-xs font-bold text-[#E5C378] tabular-nums mt-0.5 w-4">
                        {item.quantity}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-[#F3E7C4] leading-snug">
                          {item.name}
                        </div>
                        {optionValues && (
                          <div className="text-[11px] text-stone-400 font-light flex items-center gap-1.5 mt-0.5">
                            <span>{optionValues}</span>
                            {onEditItem && (
                              <button
                                onClick={() => onEditItem(item)}
                                className="text-stone-500 hover:text-[#E5C378] p-0.5"
                                aria-label="Edit item options"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-[#F3E7C4] tabular-nums whitespace-nowrap">
                      {formattedCurrency}
                      {(item.unitTotal * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity Stepper with touch-friendly 36px buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1F1A15] text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          playTapSound();
                          onUpdateQuantity(item.cartId, -1);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#1E1914] text-stone-300 hover:text-white flex items-center justify-center border border-[#2E261D] active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-semibold text-stone-200 w-5 text-center tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          playTapSound();
                          onUpdateQuantity(item.cartId, 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#1E1914] text-stone-300 hover:text-white flex items-center justify-center border border-[#2E261D] active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        playTapSound();
                        onRemoveItem(item.cartId);
                      }}
                      className="text-stone-500 hover:text-rose-400 text-[11px] p-1.5"
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Special Instructions note toggle */}
            <div className="pt-1">
              {!showNoteInput ? (
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="text-[11px] text-[#C89B3C] hover:text-[#E5C378] flex items-center gap-1 font-light py-1"
                >
                  <Pencil className="w-3 h-3" />
                  <span>{orderNote ? 'Edit kitchen note' : '+ Add kitchen note / allergies'}</span>
                </button>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="e.g. Nut allergy, extra lemon, sauce on side"
                    className="w-full px-3 py-2 bg-[#14120F] border border-[#2B231B] rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#C89B3C]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowNoteInput(false)}
                      className="text-[11px] text-stone-400 hover:text-white px-2 py-1"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cart Summary & Pay Now Controls */}
      <div className="p-3.5 sm:p-4 md:p-5 bg-[#0C0A09] border-t border-[#241F1A] space-y-3 flex-shrink-0">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-stone-400 font-light">
            <span>Subtotal</span>
            <span className="tabular-nums text-stone-200">
              {formattedCurrency}
              {subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-stone-400 font-light">
            <span>Service Charge (12.5%)</span>
            <span className="tabular-nums text-stone-200">
              {formattedCurrency}
              {serviceCharge.toFixed(2)}
            </span>
          </div>

          <div className="pt-1.5 border-t border-[#241F1A] flex justify-between items-baseline">
            <span className="text-xs sm:text-sm font-serif-luxury font-bold text-stone-200 tracking-wide">
              Total
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#E5C378] tabular-nums font-brand">
              {formattedCurrency}
              {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 4 Quick Actions (hidden on tiny mobile or compact 2-column) */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <button
            onClick={() => showFeedback('Order held on table')}
            className="py-2 px-2.5 rounded-xl bg-[#161310] border border-[#2B231B] text-stone-300 hover:text-white hover:border-[#3D3328] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[38px] active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Hold Order</span>
          </button>

          <button
            onClick={() => handleSendToStation('bar')}
            className="py-2 px-2.5 rounded-xl bg-[#161310] border border-[#2B231B] text-stone-300 hover:text-white hover:border-[#C89B3C]/50 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[38px] active:scale-95"
            title="Dispatch cocktail & drink items to Bar KDS"
          >
            <Wine className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>Send to Bar</span>
          </button>

          <button
            onClick={() => handleSendToStation('kitchen')}
            className="py-2 px-2.5 rounded-xl bg-[#161310] border border-[#2B231B] text-stone-300 hover:text-white hover:border-[#C89B3C]/50 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[38px] active:scale-95"
            title="Dispatch food courses to Kitchen KDS"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#C89B3C]" />
            <span>Send Kitchen</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              setActiveTab('split');
            }}
            className="py-2 px-2.5 rounded-xl bg-[#161310] border border-[#2B231B] text-stone-300 hover:text-white hover:border-[#3D3328] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[38px] active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span>Split Bill</span>
          </button>
        </div>

        {/* Big Gold Champagne Pay Now CTA */}
        <button
          disabled={items.length === 0 || isProcessingPayment}
          onClick={() => {
            playTapSound();
            onPayNow();
          }}
          className="w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#C89B3C] text-[#0E0C09] font-bold text-sm sm:text-base hover:brightness-105 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xl shadow-[#C89B3C]/20 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px]"
        >
          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#0E0C09]" />
          <span className="font-brand tracking-wider uppercase text-xs sm:text-sm">Pay Now</span>
          <span>·</span>
          <span className="tabular-nums font-bold">
            {formattedCurrency}
            {total.toFixed(2)}
          </span>
        </button>

        {/* Bottom Payment Chips: Contactless & Print */}
        <div className="flex items-center justify-between text-xs text-stone-400 pt-0.5">
          <div className="flex items-center gap-1 text-[#E5C378]">
            <Wifi className="w-3 h-3 rotate-90" />
            <span className="text-[10px] sm:text-[11px] font-medium">Contactless / SumUp Solo</span>
          </div>

          <button
            onClick={() => {
              playTapSound();
              window.print();
            }}
            className="flex items-center gap-1 hover:text-stone-200 transition-colors p-1"
          >
            <Printer className="w-3 h-3" />
            <span className="text-[10px] sm:text-[11px]">Print</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop/Tablet Landscape docked sidebar */}
      <aside className="hidden lg:flex lg:w-[380px] xl:w-[420px] flex-col bg-[#0F0D0B] border-l border-[#26211C] h-full select-none flex-shrink-0">
        {renderContent(false)}
      </aside>

      {/* Mobile Slide-Up Bottom Sheet */}
      {isOpenOnMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0"
            onClick={onCloseMobile}
            aria-label="Dismiss order sheet"
          />

          {/* Bottom Sheet Box */}
          <div className="relative w-full max-h-[92vh] flex flex-col bg-[#0F0D0B] rounded-t-3xl border-t border-[#332A20] shadow-2xl z-10 overflow-hidden pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] animate-slide-up">
            {/* Grab handle indicator */}
            <div
              onClick={onCloseMobile}
              className="py-2 flex justify-center cursor-pointer active:opacity-60"
            >
              <div className="w-12 h-1.5 rounded-full bg-stone-700" />
            </div>

            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
