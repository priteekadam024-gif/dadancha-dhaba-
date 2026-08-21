import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { LatestReelsSection } from '../components/LatestReelsSection';
import { OfficialLogo } from '../components/OfficialLogo';
import { getCategoryProductCount } from '../utils/categoryUtils';
import { 
  ShoppingBag, Video, Flame, Sparkles, Award, ShieldCheck, 
  Truck, ArrowRight, Star, Heart, Play, Clock, ChevronRight, 
  Utensils, CheckCircle2, MessageSquare, BookOpen 
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { 
    language, navigateTo, products, categories, 
    videos, gallery, reviews, recipes, isLoadingData 
  } = useApp();

  // Flash sale countdown timer (12 hours)
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* HERO BANNER SECTION */}
      <section className="relative min-h-[580px] lg:min-h-[640px] bg-[#0E0E0E] flex items-center justify-center overflow-hidden border-b border-[#F4B400]/20">
        {/* Parallax / Background Dhaba Atmosphere */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000"
            alt="Dhaba Background"
            className="w-full h-full object-cover opacity-25 scale-105 filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E0E] via-[#0E0E0E]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E0E0E] via-[#0E0E0E]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#F4B400]/10 border border-[#F4B400]/30 px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-[#F4B400] animate-spin" />
              <span className="text-xs font-bold text-[#F4B400] tracking-wider uppercase">
                {language === 'mr' ? 'अस्सल महाराष्ट्रीयन परंपरा • १००% नैसर्गिक' : '100% Authentic Maharashtrian Spices & Cookware'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] font-marathi">
              {language === 'mr' ? (
                <>
                  स्वादाचा खरा राजा! <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4B400] via-[#FF8C00] to-[#F4B400]">
                    दादाचा ढाबा स्पेशल
                  </span>
                </>
              ) : (
                <>
                  Taste of Pure Heritage <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4B400] via-[#FF8C00] to-[#F4B400]">
                    Dadacha Dhaba Spices
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl font-marathi leading-relaxed">
              {language === 'mr' 
                ? 'गावरान कांदा लसूण मसाला, मालवणी मसाला, सुगंधी गोडा मसाला, लाकडी घाण्याचे शुद्ध शेंगदाणा तेल आणि पारंपरिक कलई लावलेली पितळी भांडी. स्वाद, सेवा आणि भरपूर प्रेम!'
                : 'Experience heirloom recipe spices roasted in iron kadais, Solapuri roasted peanut garlic chutney, and handcrafted brassware directly delivered to your kitchen.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigateTo('shop')}
                className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-base px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#F4B400]/20 flex items-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{language === 'mr' ? 'मसाले खरेदी करा' : 'Shop Spices Now'}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>

              <button
                onClick={() => navigateTo('videos')}
                className="bg-[#1F1F1F]/90 hover:bg-[#2A2A2A] text-white border border-zinc-700 font-bold text-base px-6 py-4 rounded-2xl hover:border-[#F4B400] transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5 text-[#F4B400] fill-[#F4B400]" />
                <span>{language === 'mr' ? 'रेसिपी व्हिडिओ पहा' : 'Watch Videos'}</span>
              </button>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-black text-[#F4B400]">
                  {language === 'mr' ? '५०,०००+' : '50,000+'}
                </p>
                <p className="text-xs text-zinc-400 font-semibold">{language === 'mr' ? 'आनंदी ग्राहक' : 'Happy Foodies'}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#F4B400]">
                  {language === 'mr' ? '४.९ ★' : '4.9 ★'}
                </p>
                <p className="text-xs text-zinc-400 font-semibold">{language === 'mr' ? 'उत्कृष्ट रेटिंग' : '5 Star Rating'}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#F4B400]">
                  {language === 'mr' ? '१००%' : '100%'}
                </p>
                <p className="text-xs text-zinc-400 font-semibold">{language === 'mr' ? 'शुद्ध गावरान' : 'Pure Homemade'}</p>
              </div>
            </div>
          </div>

          {/* Right Brand Showcase Badge */}
          <div className="lg:col-span-5 relative">
            <div className="relative bg-gradient-to-br from-[#1E1E1E] via-[#161616] to-[#111111] p-8 rounded-3xl border border-[#F4B400]/40 shadow-2xl space-y-6 text-center">
              <div className="mx-auto flex justify-center">
                <OfficialLogo variant="icon" size="hero" clickable />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white font-marathi">
                  {language === 'mr' ? 'अस्सल गावरान चव आणि भांडी' : 'Authentic Maharashtrian Dhaba Taste'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {language === 'mr'
                    ? 'परंपरेने बनवलेले कांदा लसूण मसाले, लोखंडी कढई आणि पितळी भांडी.'
                    : '100% Homemade Iron Kadai Roasted Spices & Traditional Handcrafted Cookware'}
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => navigateTo('shop')}
                  className="w-full bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-extrabold text-xs py-3 rounded-xl transition-all shadow"
                >
                  {language === 'mr' ? 'दुकान पहा (Explore Shop)' : 'Explore All Products'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC LATEST REELS & VIDEOS SHOWCASE SECTION (DIRECTLY BELOW HEADER) */}
      <LatestReelsSection />

      {/* FLASH SALE / DEAL OF THE DAY COUNTDOWN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#1E1600] via-[#2A1E00] to-[#1E1600] border-2 border-[#F4B400] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3 py-1 rounded-full">
              <Flame className="w-4 h-4 text-red-500 animate-bounce" />
              <span>{language === 'mr' ? 'आजची खास ऑफर' : 'Limited Time Flash Offer'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              {language === 'mr' ? '२५% अतिरिक्त सूट + मोफत पितळी चमचा!' : 'Flat 25% OFF + Free Brass Spice Spoon!'}
            </h2>
            <p className="text-xs text-zinc-400">
              {language === 'mr' ? '₹१४९९ वरील सर्व कॉम्बो खरेदीवर कूपन वापरू शकता.' : 'Valid on orders above ₹1499. Apply coupon code SWAD200.'}
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-[#111111] border border-[#F4B400]/40 px-4 py-2 rounded-xl min-w-[64px]">
              <span className="text-2xl font-black text-[#F4B400]">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">{language === 'mr' ? 'तास' : 'Hrs'}</span>
            </div>
            <span className="text-xl font-bold text-[#F4B400]">:</span>
            <div className="flex flex-col items-center bg-[#111111] border border-[#F4B400]/40 px-4 py-2 rounded-xl min-w-[64px]">
              <span className="text-2xl font-black text-[#F4B400]">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">{language === 'mr' ? 'मिनिटे' : 'Mins'}</span>
            </div>
            <span className="text-xl font-bold text-[#F4B400]">:</span>
            <div className="flex flex-col items-center bg-[#111111] border border-[#F4B400]/40 px-4 py-2 rounded-xl min-w-[64px]">
              <span className="text-2xl font-black text-red-500 animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">{language === 'mr' ? 'सेकंद' : 'Secs'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              {language === 'mr' ? 'खास उत्पादन श्रेणी' : 'Explore Categories'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {language === 'mr' ? 'तुमच्या स्वयंपाकघरासाठी लागणारे अस्सल गावरान जिन्नस' : 'Authentic Maharashtrian kitchen essentials'}
            </p>
          </div>
          <button
            onClick={() => navigateTo('categories')}
            className="text-xs text-[#F4B400] font-bold hover:underline flex items-center gap-1"
          >
            <span>{language === 'mr' ? 'सर्व पहा' : 'View All'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigateTo('shop', { categoryId: cat.id })}
              className="group bg-[#161616] border border-zinc-800 hover:border-[#F4B400] p-4 rounded-2xl text-center cursor-pointer transition-all hover:scale-105 shadow-md flex flex-col items-center justify-between"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#F4B400]/40 group-hover:border-[#F4B400] transition-colors">
                <img src={cat.imageUrl} alt={cat.nameEn} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-white text-sm font-marathi group-hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? cat.nameMr : cat.nameEn}
              </h3>
              <span className="text-[10px] text-zinc-500 font-semibold mt-1">
                {getCategoryProductCount(cat, products)} {language === 'mr' ? 'उत्पादने' : 'Products'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLING PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              {language === 'mr' ? 'सर्वोत्कृष्ट विक्री उत्पादने' : 'Best Selling Products'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {language === 'mr' ? 'ग्राहकांची सर्वाधिक आवडती उत्पादने' : 'Most loved items by food lovers'}
            </p>
          </div>
          <button
            onClick={() => navigateTo('shop')}
            className="text-xs text-[#F4B400] font-bold hover:underline flex items-center gap-1"
          >
            <span>{language === 'mr' ? 'शॉप वर जा' : 'Go To Shop'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoadingData && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#161616] border border-zinc-800 rounded-2xl p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-zinc-800/80 rounded-xl" />
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                <div className="h-8 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#141414] rounded-2xl border border-zinc-800 space-y-2">
            <p className="text-3xl">🍲</p>
            <p className="text-zinc-400 text-sm font-marathi">
              {language === 'mr' ? 'सध्या कोणतीही उत्पादने उपलब्ध नाहीत' : 'No products available at the moment.'}
            </p>
          </div>
        )}
      </section>

      {/* EMBEDDED INSTAGRAM & YOUTUBE REELS SECTION */}
      <section className="bg-[#121212] border-y border-zinc-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3 py-1 rounded-full uppercase">
              🎬 {language === 'mr' ? 'दादांचे किचन व्हिडिओ' : 'Dada\'s Video Section'}
            </span>
            <h2 className="text-3xl font-black text-white font-marathi">
              {language === 'mr' ? 'इंस्टाग्राम व यूट्यूब रिल्स पहा' : 'Watch Reels & Cooking Videos'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl mx-auto">
              {language === 'mr' ? 'थेट वेबसाईटवर दादांचे व्हिडिओ पहा आणि अस्सल महाराष्ट्रीयन पाककृती शिका' : 'Watch recipes, spice grinding process, and customer reviews directly on the website.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.slice(0, 4).map((vid) => (
              <div 
                key={vid.id}
                onClick={() => navigateTo('videos')}
                className="group bg-[#1A1A1A] border border-zinc-800 hover:border-[#F4B400] rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all"
              >
                <div className="relative aspect-[9/16] overflow-hidden bg-black">
                  <img src={vid.thumbnailUrl} alt={vid.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#F4B400] text-[#111111] rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-[#111111] ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {vid.type}
                  </span>
                  {vid.views && (
                    <span className="absolute bottom-3 right-3 bg-[#111111]/80 text-[#F4B400] text-[10px] font-bold px-2 py-0.5 rounded">
                      👁️ {vid.views}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-white line-clamp-2 font-marathi">
                    {language === 'mr' ? vid.titleMr : vid.titleEn}
                  </h4>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => navigateTo('videos')}
              className="bg-[#222222] hover:bg-[#F4B400] hover:text-[#111111] text-white font-bold text-xs px-6 py-2.5 rounded-full border border-zinc-700 transition-all inline-flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              <span>{language === 'mr' ? 'सर्व व्हिडिओ पहा' : 'View All Videos'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED WRITTEN RECIPES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-[#F4B400]/10 border border-[#F4B400]/30 px-3 py-1 rounded-full">
              <BookOpen className="w-3.5 h-3.5 text-[#F4B400]" />
              <span className="text-[11px] font-bold text-[#F4B400] tracking-wider uppercase">
                {language === 'mr' ? 'लेखी पाककृती' : 'Written Pure Veg Recipes'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-white font-marathi">
              {language === 'mr' ? 'दादांच्या गुपित शाकाहारी पाककृती' : "Dada's Secret Pure Veg Recipes"}
            </h2>
            <p className="text-xs text-zinc-400">
              {language === 'mr' ? 'साहित्य, प्रमाण आणि पायरीनुसार अस्सल ढाबा स्टाईल पाककृती' : 'Step-by-step written cooking recipes with exact spice measurements'}
            </p>
          </div>

          <button
            onClick={() => navigateTo('recipes')}
            className="text-xs text-[#F4B400] hover:underline font-bold flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>{language === 'mr' ? 'सर्व पाककृती पहा' : 'Explore All Recipes'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recipes.slice(0, 3).map((rec) => (
            <div
              key={rec.id}
              onClick={() => navigateTo('recipe-detail', { recipeId: rec.id })}
              className="bg-[#161616] border border-zinc-800 hover:border-[#F4B400]/50 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'}
                  alt={rec.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#F4B400] border border-[#F4B400]/40">
                  {rec.difficulty || 'Medium'}
                </div>
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 border border-emerald-500/40">
                  100% Veg
                </div>
              </div>

              <div className="p-5 space-y-2 flex-1">
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#F4B400]" /> {rec.prepTime || '15m'} prep
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> {rec.cookTime || '25m'} cook
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-marathi group-hover:text-[#F4B400] transition-colors line-clamp-1">
                  {language === 'mr' ? rec.titleMr : rec.titleEn}
                </h3>

                <p className="text-xs text-zinc-400 line-clamp-2 font-marathi">
                  {language === 'mr' ? ((rec as any).descriptionMr || rec.titleMr) : ((rec as any).descriptionEn || rec.titleEn)}
                </p>
              </div>

              <div className="p-5 pt-0">
                <div className="w-full bg-[#1F1F1F] group-hover:bg-[#F4B400] group-hover:text-[#111111] text-white font-bold text-xs py-2.5 rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-2">
                  <span>{language === 'mr' ? 'पाककृती वाचा' : 'Read Recipe'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE DADACHA DHABA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white font-marathi">
            {language === 'mr' ? 'दादाचा ढाबा का निवडावा?' : 'Why Choose Dadacha Dhaba?'}
          </h2>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'अन्नात कोणतीही तडजोड नाही - अस्सल चव आणि आरोग्य' : 'No compromises on authenticity and health'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-3 text-center md:text-left">
            <div className="w-12 h-12 bg-[#F4B400]/10 text-[#F4B400] rounded-xl flex items-center justify-center font-bold text-xl mb-4 mx-auto md:mx-0">
              🔥
            </div>
            <h3 className="text-lg font-extrabold text-white font-marathi">
              {language === 'mr' ? 'लोखंडी कढईत मंद आचेवर भाजलेले' : 'Iron Kadai Slow Roasted'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-marathi">
              {language === 'mr' 
                ? 'मसाले जास्त उष्णतेने करपू न देता लोखंडी कढईत गावरान पद्धतीने शेकले जातात. ज्यामुळे मसाल्याचा सुवास टिकून राहतो.'
                : 'Spices are slow-roasted in heavy iron kadais to preserve volatile essential oils and natural digestive aroma.'}
            </p>
          </div>

          <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-3 text-center md:text-left">
            <div className="w-12 h-12 bg-[#F4B400]/10 text-[#F4B400] rounded-xl flex items-center justify-center font-bold text-xl mb-4 mx-auto md:mx-0">
              🍲
            </div>
            <h3 className="text-lg font-extrabold text-white font-marathi">
              {language === 'mr' ? 'कलईची अस्सल पितळी भांडी' : 'Artisanal Brass Cookware'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-marathi">
              {language === 'mr' 
                ? 'तांबट आळीतील अनुभवी कारागीरांनी घडवलेली जाड पितळी हंडी व कढई. अन्नातील पोषणमूल्ये टिकवून ठेवते.'
                : 'Hand-hammered brass handis lined with food-grade tin (Kalai) for authentic dhaba style slow simmering.'}
            </p>
          </div>

          <div className="bg-[#161616] p-6 rounded-2xl border border-zinc-800 space-y-3 text-center md:text-left">
            <div className="w-12 h-12 bg-[#F4B400]/10 text-[#F4B400] rounded-xl flex items-center justify-center font-bold text-xl mb-4 mx-auto md:mx-0">
              ❤️
            </div>
            <h3 className="text-lg font-extrabold text-white font-marathi">
              {language === 'mr' ? 'नाही कोणतेही रसायन वा रंग' : 'Zero Preservatives & Colors'}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-marathi">
              {language === 'mr' 
                ? 'कोणतेही रासायनिक रंग किंवा प्रिझर्व्हेटिव्ह न वापरता तयार केलेले गावरान जिन्नस. पोटात जळजळ होत नाही.'
                : 'Pure Byadgi and Guntur chilli color without synthetic dyes or chemical preservatives. Gentle on the stomach.'}
            </p>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS & TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white font-marathi">
            {language === 'mr' ? 'ग्राहकांचे अभिप्राय' : 'What Our Foodies Say'}
          </h2>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'हजारो तृप्त ग्राहकांची पसंती' : 'Loved by thousands across Maharashtra'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-[#161616] border border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-1 text-[#F4B400]">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F4B400]" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 italic font-marathi leading-relaxed">
                "{rev.comment}"
              </p>
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-xs">
                <span className="font-bold text-white">{rev.userName}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> {language === 'mr' ? 'खरेदीदार' : 'Verified'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
