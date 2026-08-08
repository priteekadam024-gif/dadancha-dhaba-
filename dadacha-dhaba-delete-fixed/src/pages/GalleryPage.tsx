import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ZoomIn, Camera, Utensils, Store } from 'lucide-react';

export const GalleryPage: React.FC = () => {
  const { language, gallery } = useApp();
  const [filter, setFilter] = useState<'all' | 'food' | 'kitchen' | 'products' | 'ambience'>('all');
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const filteredGallery = gallery.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const selectedItem = gallery.find((g) => g.imageUrl === activeImage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3.5 py-1 rounded-full uppercase border border-[#F4B400]/30">
          🖼️ {language === 'mr' ? 'फोटो दालन' : 'Photo Gallery'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
          {language === 'mr' ? 'दादाचा ढाबा - फोटो संग्रह' : 'Glance Into Dada\'s Dhaba & Kitchen'}
        </h1>
        <p className="text-xs text-zinc-400 font-marathi">
          {language === 'mr' 
            ? 'मसाले बनवण्याच्या प्रक्रियेपासून ते चुलीवरील काळ्या रश्श्यापर्यंत सर्व क्षणचित्रे.' 
            : 'Explore photos of handcrafted spices, traditional brassware, charcoal cooking, and authentic meals.'}
        </p>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {language === 'mr' ? 'सर्व फोटो' : 'All Photos'} ({gallery.length})
          </button>
          <button
            onClick={() => setFilter('food')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'food' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🍲 {language === 'mr' ? 'खाद्यपदार्थ' : 'Food Photos'}
          </button>
          <button
            onClick={() => setFilter('kitchen')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'kitchen' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🔥 {language === 'mr' ? 'स्वयंपाकघर' : 'Kitchen & Cooking'}
          </button>
          <button
            onClick={() => setFilter('products')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'products' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            📦 {language === 'mr' ? 'उत्पादने व भांडी' : 'Products & Brassware'}
          </button>
          <button
            onClick={() => setFilter('ambience')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'ambience' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🏬 {language === 'mr' ? 'ढाबा वातावरण' : 'Dhaba Ambience'}
          </button>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredGallery.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveImage(item.imageUrl)}
            className="group relative bg-[#161616] border border-zinc-800 hover:border-[#F4B400] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:scale-[1.02] aspect-square"
          >
            <img
              src={item.imageUrl}
              alt={item.titleEn}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <span className="text-[10px] text-[#F4B400] font-bold uppercase tracking-wider">
                {item.category}
              </span>
              <h3 className="font-bold text-white text-sm font-marathi">
                {language === 'mr' ? item.titleMr : item.titleEn}
              </h3>
              {item.captionEn && (
                <p className="text-[11px] text-zinc-300 line-clamp-1 font-marathi">
                  {language === 'mr' ? item.captionMr : item.captionEn}
                </p>
              )}
            </div>
            <div className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-[#F4B400]" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal Zoom View */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#141414] border border-[#F4B400]/40 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-4">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white hover:text-[#F4B400] p-2 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black">
              <img src={activeImage} alt="Gallery Zoom" className="max-h-[75vh] w-auto object-contain" />
            </div>

            {selectedItem && (
              <div className="text-center space-y-1">
                <h3 className="font-bold text-white text-lg font-marathi">
                  {language === 'mr' ? selectedItem.titleMr : selectedItem.titleEn}
                </h3>
                <p className="text-xs text-[#F4B400] font-marathi">
                  {language === 'mr' ? selectedItem.captionMr : selectedItem.captionEn}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
