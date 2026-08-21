import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingBag, Star, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, navigateTo, addToCart, wishlist, toggleWishlist } = useApp();
  
  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const primaryImage = product.images && product.images[0] 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800';
  const secondaryImage = product.images && product.images[1] ? product.images[1] : null;

  return (
    <div className="group bg-[#161616] border border-zinc-800 hover:border-[#F4B400]/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#F4B400]/10 transition-all duration-300 flex flex-col relative">
      {/* Product Image & Badges */}
      <div 
        onClick={() => navigateTo('product-detail', { productId: product.id })}
        className="relative aspect-square overflow-hidden bg-[#0D0D0D] cursor-pointer"
      >
        <img
          src={primaryImage}
          alt={product.nameEn || 'Product'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          loading="lazy"
          decoding="async"
        />

        {/* Secondary image preview on hover if available */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={product.nameEn || 'Product'}
            className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Top Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.discountPercent > 0 && (
            <span className="bg-[#FF8C00] text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-[#F4B400] text-[#111111] font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              🔥 Best Seller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all z-10 ${
            isWishlisted 
              ? 'bg-rose-600 text-white' 
              : 'bg-black/40 text-white hover:bg-rose-600 hover:text-white'
          }`}
          title="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* Quick View overlay button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateTo('product-detail', { productId: product.id });
            }}
            className="bg-[#111111] text-white hover:bg-[#F4B400] hover:text-[#111111] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'पहा' : 'Quick View'}</span>
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded text-[10px]">
              {product.variants && product.variants.length > 1 
                ? `${product.variants.length} Sizes (${product.weight})`
                : product.weight}
            </span>
            <div className="flex items-center gap-1 text-[#F4B400]">
              <Star className="w-3.5 h-3.5 fill-[#F4B400]" />
              <span className="font-bold text-xs">{product.ratings}</span>
              <span className="text-zinc-500 text-[10px]">({product.reviewCount})</span>
            </div>
          </div>

          <h3 
            onClick={() => navigateTo('product-detail', { productId: product.id })}
            className={`font-bold text-white text-base hover:text-[#F4B400] cursor-pointer line-clamp-2 transition-colors ${language === 'mr' ? 'font-marathi' : ''} leading-snug`}
          >
            {language === 'mr' ? product.nameMr : product.nameEn}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 font-sans">
            {language === 'mr' ? product.descriptionMr : product.descriptionEn}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-[#F4B400]">
              ₹{product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-zinc-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="bg-[#F4B400] text-[#111111] hover:bg-[#FF8C00] font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'mr' ? 'जोडा' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
