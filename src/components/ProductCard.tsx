import React from 'react';
import { Plus, SlidersHorizontal, Coffee } from 'lucide-react';
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
      className={`group relative flex flex-col justify-between bg-[#191512] rounded-2xl border border-[#c88a58]/20 overflow-hidden transition-all duration-300 select-none cursor-pointer ${
        isOutOfStock
          ? 'opacity-40 pointer-events-none'
          : 'hover:border-[#dda15e]/60 hover:shadow-xl hover:shadow-black/70 active:scale-[0.98]'
      }`}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-[16/11] bg-[#120f0d] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-[0.92] contrast-[1.05]"
          loading="lazy"
        />

        {/* Low Stock Badge */}
        {isLowStock && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#241a14]/90 border border-[#c88a58] text-[#dda15e] font-mono-meta text-[10px] uppercase tracking-wider backdrop-blur-sm">
            Only {product.stock} left
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#0e0c0a]/85 flex items-center justify-center">
            <span className="font-mono-meta text-xs uppercase tracking-widest text-[#f4ece1]/70 border border-[#f4ece1]/30 px-3 py-1 rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {/* Category subtle pill on top left */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#120f0d]/85 backdrop-blur-md border border-[#c88a58]/20 flex items-center gap-1.5 text-[10px] font-mono-meta text-[#dda15e]">
          <Coffee className="w-3 h-3 text-[#dda15e]" />
          <span>{product.category}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Item Name */}
          <h3 className="font-coffee text-lg sm:text-xl font-bold text-[#f4ece1] group-hover:text-[#dda15e] transition-colors leading-snug tracking-wide line-clamp-1">
            {product.name}
          </h3>

          {/* Description / Cupping Notes */}
          <p className="font-body text-xs sm:text-sm font-light text-[#b8aaa0] mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Cupping / Dietary tags */}
          {product.dietary && product.dietary.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {product.dietary.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-[#241a14] border border-[#c88a58]/30 font-mono-meta text-[9px] text-[#dda15e] uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3 border-t border-[#c88a58]/15 flex items-center justify-between">
          <div className="font-mono-meta text-base sm:text-lg font-bold text-[#dda15e]">
            {formattedCurrency}{product.price.toFixed(2)}
          </div>

          <button
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to order`}
            className={`h-9 px-3.5 rounded-full flex items-center gap-1.5 font-coffee text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] ${
              hasOptions
                ? 'bg-[#241a14] border border-[#c88a58]/40 text-[#f4ece1] hover:border-[#dda15e] hover:bg-[#32231b]'
                : 'pill-caramel hover:brightness-110'
            }`}
          >
            {hasOptions ? (
              <>
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#dda15e]" />
                <span className="text-[11px]">Tailor</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[11px]">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
