import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
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
  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#c89b3c]/40 rounded-[4px] p-8 md:p-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="absolute top-6 right-6 w-9 h-9 rounded-full border border-[#c89b3c]/20 text-[#e0d9cc]/40 hover:text-[#c89b3c] hover:border-[#c89b3c] flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6 pb-4 border-b border-[#c89b3c]/20">
          <span className="meta-label">Bespoke Preparation</span>
          <h2 className="font-cinzel text-3xl font-bold text-[#e0d9cc] mt-1 tracking-wide">
            {product.name}
          </h2>
          <p className="font-sans-editorial text-sm font-light text-[#e0d9cc]/60 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Options List */}
        <div className="flex-grow overflow-y-auto no-scrollbar space-y-6 pr-1 mb-6">
          {product.customizationGroups?.map((group) => (
            <div key={group.id} className="space-y-3">
              <span className="meta-label text-xs tracking-wider text-[#c89b3c]">
                {group.name}
              </span>
              <div className="grid grid-cols-1 gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedOptions[group.name] === option.name;
                  return (
                    <button
                      key={option.name}
                      onClick={() => handleSelectOption(group.name, option.name)}
                      className={`p-3.5 border rounded-[2px] flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'border-[#c89b3c] bg-[#c89b3c]/10 text-[#e0d9cc] shadow-[0_0_12px_rgba(200,155,60,0.2)]'
                          : 'border-white/10 bg-[#111111] text-[#e0d9cc]/60 hover:border-[#c89b3c]/40'
                      }`}
                    >
                      <span className="font-cinzel text-sm">{option.name}</span>
                      <span className="font-mono-meta text-xs text-[#c89b3c]">
                        {option.priceDelta > 0
                          ? `+${formattedCurrency}${option.priceDelta.toFixed(2)}`
                          : 'Included'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity Selector */}
          <div className="pt-2 flex items-center justify-between border-t border-white/5">
            <span className="meta-label">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playTapSound();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                className="w-8 h-8 rounded-full border border-[#c89b3c]/30 text-[#e0d9cc] flex items-center justify-center hover:border-[#c89b3c]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono-meta text-base text-[#c89b3c] w-6 text-center font-bold">
                {quantity}
              </span>
              <button
                onClick={() => {
                  playTapSound();
                  setQuantity((q) => q + 1);
                }}
                className="w-8 h-8 rounded-full border border-[#c89b3c]/30 text-[#e0d9cc] flex items-center justify-center hover:border-[#c89b3c]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-4 border-t border-[#c89b3c]/20 flex items-center justify-between gap-4">
          <div>
            <span className="meta-label text-[10px]">Total</span>
            <div className="font-cinzel text-2xl font-bold text-[#c89b3c]">
              {formattedCurrency}{totalPrice.toFixed(2)}
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="flex-grow py-4 px-6 bg-[#c89b3c] hover:bg-[#d6ab4e] active:scale-[0.98] text-[#000000] font-cinzel text-base font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(200,155,60,0.3)] cursor-pointer rounded-[2px]"
          >
            Reserve Selection
          </button>
        </div>
      </div>
    </div>
  );
};
