import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { language, wishlist, products, navigateTo } = useApp();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-black text-white font-marathi flex items-center gap-2">
          <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
          <span>{language === 'mr' ? 'माझी विशलिस्ट (आवडती उत्पादने)' : 'My Wishlist'}</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          {wishlistedProducts.length} {language === 'mr' ? 'उत्पादने जतन केली आहेत' : 'items saved for later'}
        </p>
      </div>

      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#141414] rounded-3xl border border-zinc-800 space-y-4">
          <div className="w-20 h-20 bg-rose-950/30 text-rose-400 border border-rose-800/40 rounded-full flex items-center justify-center mx-auto text-3xl">
            ❤️
          </div>
          <h3 className="text-xl font-bold text-white font-marathi">
            {language === 'mr' ? 'तुमची विशलिस्ट रिकामी आहे' : 'Your Wishlist is Empty'}
          </h3>
          <p className="text-xs text-zinc-500 font-marathi max-w-sm mx-auto">
            {language === 'mr' ? 'उत्पादनांवरील हृदय चिन्हावर क्लिक करून तुमची आवडती उत्पादने जतन करा.' : 'Save products you love by clicking the heart icon.'}
          </p>
          <button
            onClick={() => navigateTo('shop')}
            className="bg-[#F4B400] text-[#111111] font-bold text-xs px-6 py-3 rounded-2xl"
          >
            {language === 'mr' ? 'उत्पादने शोधा' : 'Explore Products'}
          </button>
        </div>
      )}
    </div>
  );
};
