import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { language, categories, products, navigateTo } = useApp();

  const visibleCategories = categories
    .filter((cat) => cat.isActive !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3.5 py-1 rounded-full uppercase border border-[#F4B400]/30">
          ✨ {language === 'mr' ? 'खास वर्गवारी' : 'Product Categories'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
          {language === 'mr' ? 'दादाचा ढाबा उत्पादन श्रेणी' : 'Dadacha Dhaba Collections'}
        </h1>
        <p className="text-xs text-zinc-400 font-marathi">
          {language === 'mr' 
            ? 'गावरान मसाल्यांपासून ते कलईच्या पारंपरिक पितळी भांड्यांपर्यंत सर्व काही' 
            : 'Explore traditional spices, kitchenware, fast premixes, and gift combo packs.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleCategories.map((cat) => {
          const catItemCount = products.filter((p) => p.categoryId === cat.id || p.categoryName === cat.nameEn).length;

          return (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop', { categoryId: cat.id })}
              className="group relative bg-[#161616] border border-zinc-800 hover:border-[#F4B400] rounded-3xl overflow-hidden cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.02]"
              style={cat.backgroundColor ? { backgroundColor: cat.backgroundColor } : undefined}
            >
              {/* Category Banner Image */}
              <div className="relative h-64 overflow-hidden bg-zinc-900">
                <img
                  src={cat.bannerUrl || cat.imageUrl}
                  alt={cat.nameEn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-[#161616]/40 to-transparent" />
                
                <span className="absolute top-4 right-4 bg-[#111111]/80 text-[#F4B400] border border-[#F4B400]/40 font-bold text-xs px-3 py-1 rounded-full backdrop-blur-md">
                  {catItemCount} {language === 'mr' ? 'वस्तू' : 'Items'}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3 relative">
                <h3 className="text-2xl font-black text-white font-marathi group-hover:text-[#F4B400] transition-colors flex items-center gap-2" style={cat.textColor ? { color: cat.textColor } : undefined}>
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{language === 'mr' ? cat.nameMr : cat.nameEn}</span>
                </h3>
                
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {language === 'mr' ? (cat.descriptionMr || cat.descriptionEn) : cat.descriptionEn}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#F4B400]">
                  <span>{language === 'mr' ? 'उत्पादने पहा' : 'Browse Collection'}</span>
                  <div className="w-8 h-8 bg-[#F4B400] text-[#111111] rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
