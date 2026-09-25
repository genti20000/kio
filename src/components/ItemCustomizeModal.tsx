import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { Product, CartItem } from '../types/kiosk.ts';
import { playTapSound, playAddToCartSound } from '../utils/audio.ts';

interface ItemCustomizeModalProps {
  product: Product;
  currency: string;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ItemCustomizeModal: React.FC<ItemCustomizeModalProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
}) => {
  const formattedCurrency = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

  // Initialize selected options with defaults
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.customizationGroups?.forEach((group) => {
      if (group.options.length > 0) {
        initial[group.name] = group.options[0].name;
      }
    });
    return initial;
  });

  const [quantity, setQuantity] = useState(1);

  // Calculate unit price including options
  const calculateUnitPrice = () => {
    let price = product.price;
    product.customizationGroups?.forEach((group) => {
      const selectedOptionName = selectedOptions[group.name];
      const option = group.options.find((o) => o.name === selectedOptionName);
      if (option) {
        price += option.priceDelta;
      }
    });
    return price;
  };

  const unitPrice = calculateUnitPrice();
  const totalPrice = unitPrice * quantity;

  const handleSelectOption = (groupName: string, optionName: string) => {
    playTapSound();
    setSelectedOptions((prev) => ({
      ...prev,
      [groupName]: optionName,
    }));
  };

  const handleAdd = () => {
    playAddToCartSound();
    const cartId = `${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    onAddToCart({
      cartId,
      productId: product.id,
      name: product.name,
      price: unitPrice,
      quantity,
      image: product.image,
      selectedOptions,
      unitTotal: unitPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[90vh] bg-[#14110E] border-t sm:border border-[#2D261F] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl z-10 animate-slide-up">
        {/* Mobile handle indicator */}
        <div className="sm:hidden py-2 flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 rounded-full bg-stone-700" />
        </div>

        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:p-5 border-b border-[#241F1A] flex items-center justify-between flex-shrink-0 bg-[#0E0C0A]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#181512] border border-[#2D261F] flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif-luxury font-bold text-[#F3E7C4] tracking-tight">
                {product.name}
              </h2>
              <div className="text-[11px] text-[#C89B3C] font-light mt-0.5">
                {product.category} · {formattedCurrency}{unitPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-[#1A1613] text-stone-300 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px] border border-[#2B231B] active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Customization Groups */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-grow overscroll-contain">
          <p className="text-xs text-stone-400 font-light leading-relaxed">
            {product.description}
          </p>

          {product.customizationGroups?.map((group) => (
            <div key={group.id} className="space-y-2">
              <label className="text-xs font-semibold text-[#E5C378] tracking-wider uppercase block">
                {group.name}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.options.map((opt) => {
                  const isSelected = selectedOptions[group.name] === opt.name;
                  return (
                    <button
                      key={opt.name}
                      onClick={() => handleSelectOption(group.name, opt.name)}
                      className={`min-h-[46px] p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-[#C89B3C] bg-[#5C1D24]/40 text-[#F3E7C4] shadow-sm font-semibold'
                          : 'border-[#262019] bg-[#100E0C] text-stone-300 hover:border-[#382E23]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E5C378]" />}
                        <span className="text-xs">{opt.name}</span>
                      </div>
                      {opt.priceDelta > 0 && (
                        <span className="text-xs font-semibold text-[#E5C378] tabular-nums">
                          +{formattedCurrency}{opt.priceDelta.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer: Sticky Quantity + Add to Order */}
        <div className="p-3.5 sm:p-5 border-t border-[#241F1A] bg-[#0E0C0A] flex items-center justify-between gap-3 flex-shrink-0 pb-[calc(0.9rem+env(safe-area-inset-bottom,0px))]">
          {/* Quantity Stepper with 44px touch targets */}
          <div className="flex items-center gap-2 bg-[#161310] border border-[#2D261F] rounded-2xl p-1">
            <button
              onClick={() => {
                playTapSound();
                setQuantity((prev) => Math.max(1, prev - 1));
              }}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-xl bg-[#1E1914] text-stone-300 disabled:opacity-30 disabled:pointer-events-none hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-90"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-[#F3E7C4] w-8 text-center tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => {
                playTapSound();
                setQuantity((prev) => prev + 1);
              }}
              className="w-10 h-10 rounded-xl bg-[#1E1914] text-stone-300 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-90"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleAdd}
            className="flex-grow py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#C89B3C] text-[#0C0B0A] font-bold text-sm hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-[#C89B3C]/20 flex items-center justify-center gap-2 min-h-[46px]"
          >
            <span>Add to Table Order</span>
            <span>·</span>
            <span className="tabular-nums font-bold">
              {formattedCurrency}{totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
