import React from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Product } from '../types/kiosk.ts';
import { playTapSound } from '../utils/audio.ts';

interface ProductCardProps {
  product: Product;
  currency: string;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onSelect,
}) => {
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isLowStock = !isOutOfStock && product.stock <= 5;
  const hasOptions = (product.customizationGroups?.length ?? 0) > 0;

  const handleClick = () => {
    if (isOutOfStock) return;
    playTapSound();
    onSelect(product);
  };

  const formattedCurrency = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';

  return (
    <div
      onClick={handleClick}
      className={`group relative flex flex-col justify-between bg-[#14110E] rounded-2xl border border-[#262019] overflow-hidden transition-all text-left select-none touch-manipulation ${
        isOutOfStock
          ? 'opacity-55 cursor-not-allowed'
          : 'hover:border-[#C89B3C]/50 hover:shadow-xl hover:shadow-black/60 active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-[4/3] bg-[#0E0C0A] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-700 ${
            !isOutOfStock ? 'group-hover:scale-105' : 'grayscale'
          }`}
          loading="lazy"
        />

        {/* Sold out overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#0C0B0A]/80 flex items-center justify-center p-3">
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg bg-rose-950/70">
              Sold Out
            </span>
          </div>
        )}

        {/* Low Stock Indicator */}
        {isLowStock && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[#C89B3C] text-[#0C0B0A] text-[9px] sm:text-[10px] font-bold tracking-tight shadow-md">
            Only {product.stock} left
          </div>
        )}
      </div>

      {/* Product Info & Actions */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#C89B3C] mb-0.5 font-light">
            <span>{product.category}</span>
            {product.dietary && product.dietary.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate text-stone-400">{product.dietary[0]}</span>
              </>
            )}
          </div>

          <h3 className="font-serif-luxury text-sm sm:text-base font-semibold text-[#F3E7C4] tracking-tight leading-snug group-hover:text-[#E5C378] transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-1 line-clamp-2 leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        {/* Price & Add Circle Button (matching uploaded mockup) */}
        <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#241F1A] flex items-center justify-between">
          <div className="text-sm sm:text-base font-semibold text-[#F3E7C4] tabular-nums">
            {formattedCurrency}
            {product.price.toFixed(0)}
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to order`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all min-h-[36px] min-w-[36px] active:scale-90 ${
              isOutOfStock
                ? 'border-stone-800 text-stone-600 cursor-not-allowed'
                : hasOptions
                ? 'border-[#3D3328] text-stone-300 hover:border-[#C89B3C] hover:text-[#E5C378] hover:bg-[#1E1914]'
                : 'border-[#3D3328] text-[#E5C378] hover:bg-[#C89B3C] hover:text-[#0C0B0A] hover:border-[#C89B3C]'
            }`}
          >
            {hasOptions ? (
              <SlidersHorizontal className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
