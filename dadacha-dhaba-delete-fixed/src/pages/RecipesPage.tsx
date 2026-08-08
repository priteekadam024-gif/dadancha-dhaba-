import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Flame, Clock, Users, ArrowRight, BookOpen } from 'lucide-react';

export const RecipesPage: React.FC = () => {
  const { language, recipes, navigateTo } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'rassa' | 'veg' | 'quick'>('all');

  const filteredRecipes = recipes.filter((r) => {
    if (activeCategory === 'all') return true;
    return (r as any).category === activeCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-[#1C1400] via-[#2A1E00] to-[#121212] p-8 rounded-3xl border border-[#F4B400]/40 text-center space-y-3 shadow-xl">
        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3 py-1 rounded-full uppercase">
          🍲 {language === 'mr' ? 'दादांच्या गुपित शाकाहारी पाककृती' : "Dada's Secret Pure Veg Recipes"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
          {language === 'mr' ? 'अस्सल १००% शाकाहारी गावरान चवीचे गुपित' : '100% Pure Veg Maharashtrian Recipes'}
        </h1>
        <p className="text-xs text-zinc-300 max-w-xl mx-auto font-marathi">
          {language === 'mr' 
            ? 'दादाचा ढाबा विशेष कांदा लसूण व मसाल्यांचा वापर करून बनवा हॉटेलसारखा काळा रस्सा आणि भाजी.' 
            : 'Learn how to cook hotel-style Kolhapuri Kala Rassa, Shev Bhaji, and Pithla Bhakri using our hand-ground spices.'}
        </p>

        <div className="flex justify-center gap-2 pt-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === 'all' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300'
            }`}
          >
            {language === 'mr' ? 'सर्व शाकाहारी पाककृती' : 'All Pure Veg Recipes'}
          </button>
          <button
            onClick={() => setActiveCategory('rassa')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === 'rassa' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300'
            }`}
          >
            🍲 {language === 'mr' ? 'काळा व तांबडा रस्सा' : 'Veg Kala & Red Rassa'}
          </button>
          <button
            onClick={() => setActiveCategory('veg')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === 'veg' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300'
            }`}
          >
            🥬 {language === 'mr' ? 'ढाबा स्पेशल भाज्या' : 'Dhaba Veg Specials'}
          </button>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRecipes.map((rec) => (
          <div key={rec.id} className="bg-[#161616] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl space-y-4 flex flex-col justify-between">
            <div className="relative aspect-video bg-black overflow-hidden">
              <img src={rec.image || (rec as any).imageUrl} alt={rec.titleEn} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 left-3 bg-[#111111]/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#F4B400] border border-[#F4B400]/40">
                Difficulty: {rec.difficulty}
              </div>
            </div>

            <div className="p-6 space-y-3 flex-1">
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F4B400]" /> {rec.prepTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#F4B400]" /> Serves {rec.servings}
                </span>
              </div>

              <h3 className="text-xl font-black text-white font-marathi">
                {language === 'mr' ? rec.titleMr : rec.titleEn}
              </h3>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#F4B400]">Recommended Spice:</h4>
                <p className="text-xs text-zinc-300 font-semibold">{(rec as any).recommendedSpice || 'Dadache Special Masala'}</p>
              </div>

              <p className="text-xs text-zinc-400 line-clamp-3 font-marathi">
                {language === 'mr' ? ((rec as any).descriptionMr || rec.titleMr) : ((rec as any).descriptionEn || rec.titleEn)}
              </p>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => navigateTo('shop')}
                className="w-full bg-[#1F1F1F] hover:bg-[#F4B400] hover:text-[#111111] text-white font-bold text-xs py-3 rounded-2xl border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>{language === 'mr' ? 'मसाला खरेदी करा' : 'Buy Required Spice'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
