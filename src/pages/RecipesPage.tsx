import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Flame, Clock, Users, ArrowRight, BookOpen, Search, 
  ChefHat, Filter, Sparkles, ShoppingBag, Eye, RefreshCw, 
  Tag, Layers, CheckCircle2, AlertCircle
} from 'lucide-react';

export const RecipesPage: React.FC = () => {
  const { 
    language, recipes, recipeCategories, navigateTo, products, 
    addToCart, showToast, isLoadingData, fetchError, refetchData 
  } = useApp();
  
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Strictly filter only published recipes for customer view
  const publishedRecipes = useMemo(() => {
    return recipes.filter((r) => r.isPublished !== false);
  }, [recipes]);

  // 2. Extract available subcategories based on active category
  const availableSubcategories = useMemo(() => {
    if (activeCategoryId === 'all') {
      // Gather all unique subcategories from all categories
      const allSubs: { id: string; nameEn: string; nameMr: string; categoryId: string }[] = [];
      recipeCategories.forEach((cat) => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          cat.subcategories.forEach((sub) => {
            if (!allSubs.some((s) => s.id === sub.id)) {
              allSubs.push({ ...sub, categoryId: cat.id });
            }
          });
        }
      });
      return allSubs;
    }

    const currentCat = recipeCategories.find((c) => c.id === activeCategoryId);
    return currentCat?.subcategories || [];
  }, [recipeCategories, activeCategoryId]);

  // 3. Filter published recipes by search, category, subcategory, and difficulty
  const filteredRecipes = useMemo(() => {
    return publishedRecipes.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      
      const matchesSearch = 
        !q ||
        r.titleEn.toLowerCase().includes(q) ||
        r.titleMr.includes(q) ||
        (r.descriptionEn && r.descriptionEn.toLowerCase().includes(q)) ||
        (r.descriptionMr && r.descriptionMr.includes(q)) ||
        (r.categoryName && r.categoryName.toLowerCase().includes(q)) ||
        (r.subcategoryName && r.subcategoryName.toLowerCase().includes(q)) ||
        r.ingredientsEn?.some((i) => i.toLowerCase().includes(q)) ||
        r.ingredientsMr?.some((i) => i.includes(q)) ||
        (r.relatedProductName && r.relatedProductName.toLowerCase().includes(q));

      const matchesCategory = activeCategoryId === 'all' || r.categoryId === activeCategoryId;
      const matchesSubcategory = activeSubcategoryId === 'all' || r.subcategoryId === activeSubcategoryId;
      const matchesDifficulty = activeDifficulty === 'all' || r.difficulty?.toLowerCase() === activeDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesSubcategory && matchesDifficulty;
    });
  }, [publishedRecipes, searchQuery, activeCategoryId, activeSubcategoryId, activeDifficulty]);

  // Handler for category change: resets subcategory filter
  const handleCategoryChange = (catId: string) => {
    setActiveCategoryId(catId);
    setActiveSubcategoryId('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1500] via-[#2A1D00] to-[#121212] p-6 sm:p-12 rounded-3xl border border-[#F4B400]/40 text-center space-y-4 shadow-2xl">
        <div className="inline-flex items-center gap-2 bg-[#F4B400]/15 text-[#F4B400] border border-[#F4B400]/30 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'दादांच्या गुपित शाकाहारी पाककृती' : "Dada's Secret Pure Veg Written Recipes"}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-marathi tracking-wide max-w-3xl mx-auto leading-tight">
          {language === 'mr' ? 'अस्सल १००% शाकाहारी गावरान चवीचे गुपित' : 'Authentic 100% Pure Veg Maharashtrian Recipes'}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl mx-auto font-marathi leading-relaxed">
          {language === 'mr' 
            ? 'दादाचा ढाबा विशेष कांदा लसूण व मसाल्यांचा वापर करून घरीच बनवा हॉटेलसारखा काळा रस्सा, शेव भाजी, झणझणीत मिसळ आणि पिठलं भाकरी.' 
            : 'Learn to cook hotel-style authentic Kolhapuri Kala Rassa, Shev Bhaji, and Dhaba gravies step-by-step using our hand-ground authentic spices.'}
        </p>

        {/* Search Bar inside Hero */}
        <div className="pt-3 max-w-xl mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'mr' ? 'रेसिपीचे नाव, उपश्रेणी किंवा मसाला शोधा (उदा. काळा रस्सा, शेव भाजी)...' : 'Search recipes, subcategories, ingredients or spices (e.g. Kala Rassa, Shev Bhaji)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414]/90 backdrop-blur-md border border-zinc-700 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white bg-zinc-800 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ERROR NOTICE / RETRY BAR */}
      {fetchError && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{language === 'mr' ? 'डेटा लोड करताना समस्या आली.' : 'Could not fetch live updates. Showing cached recipes.'}</span>
          </div>
          <button
            onClick={() => refetchData()}
            className="flex items-center gap-1.5 bg-red-900/60 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* FILTER BAR: MAIN CATEGORIES */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          {/* Categories Bar */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategoryId === 'all' 
                  ? 'bg-[#F4B400] text-[#111111] shadow-md font-black' 
                  : 'bg-[#181818] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'mr' ? 'सर्व पाककृती' : 'All Recipes'}</span>
              <span className="text-[10px] opacity-80">({publishedRecipes.length})</span>
            </button>

            {recipeCategories.map((cat) => {
              const count = publishedRecipes.filter((r) => r.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeCategoryId === cat.id 
                      ? 'bg-[#F4B400] text-[#111111] shadow-md font-black' 
                      : 'bg-[#181818] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{language === 'mr' ? cat.nameMr : cat.nameEn}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 self-end lg:self-auto flex-shrink-0">
            <span className="text-xs text-zinc-500 font-semibold">{language === 'mr' ? 'काठिण्य:' : 'Difficulty:'}</span>
            <select
              value={activeDifficulty}
              onChange={(e) => setActiveDifficulty(e.target.value)}
              className="bg-[#181818] border border-zinc-700 text-zinc-300 text-xs rounded-xl px-3 py-2 focus:border-[#F4B400] focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'mr' ? 'सर्व (All Levels)' : 'All Levels'}</option>
              <option value="easy">{language === 'mr' ? 'सोपे (Easy)' : 'Easy'}</option>
              <option value="medium">{language === 'mr' ? 'मध्यम (Medium)' : 'Medium'}</option>
              <option value="expert">{language === 'mr' ? 'विशेष (Expert)' : 'Expert'}</option>
            </select>
          </div>
        </div>

        {/* SUBCATEGORY PILLS (SUB-FILTER) */}
        {availableSubcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
              <Tag className="w-3 h-3 text-[#F4B400]" />
              <span>{language === 'mr' ? 'उपश्रेणी:' : 'Subcategory:'}</span>
            </span>

            <button
              onClick={() => setActiveSubcategoryId('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubcategoryId === 'all'
                  ? 'bg-zinc-200 text-black font-bold'
                  : 'bg-[#181818] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {language === 'mr' ? 'सर्व उपश्रेण्या' : 'All Subcategories'}
            </button>

            {availableSubcategories.map((sub) => {
              const subCount = publishedRecipes.filter((r) => r.subcategoryId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubcategoryId(sub.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeSubcategoryId === sub.id
                      ? 'bg-[#F4B400] text-black font-bold shadow'
                      : 'bg-[#181818] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{language === 'mr' ? sub.nameMr : sub.nameEn}</span>
                  {subCount > 0 && <span className="ml-1 text-[10px] opacity-75">({subCount})</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* LOADING STATE SKELETONS */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-[#161616] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl animate-pulse space-y-4 p-5">
              <div className="aspect-video bg-zinc-800 rounded-2xl"></div>
              <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
              <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-800 rounded w-full"></div>
              <div className="h-10 bg-zinc-800 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-12 sm:p-16 text-center space-y-4 shadow-xl">
          <BookOpen className="w-16 h-16 text-zinc-600 mx-auto" />
          <h3 className="text-xl font-bold text-white font-marathi">
            {language === 'mr' ? 'कोणतीही रेसिपी सापडली नाही' : 'No Recipes Found'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {language === 'mr' 
              ? 'निवडलेल्या निकषांसाठी रेसिपी उपलब्ध नाही. कृपया शोध शब्द किंवा श्रेणी बदला.' 
              : 'No published recipes match your current search or subcategory filter.'}
          </p>
          <button
            onClick={() => {
              setActiveCategoryId('all');
              setActiveSubcategoryId('all');
              setSearchQuery('');
              setActiveDifficulty('all');
            }}
            className="bg-[#F4B400] hover:bg-[#e0a400] text-[#111111] font-bold text-xs px-6 py-2.5 rounded-full transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'सर्व फिल्टर्स रीसेट करा' : 'Reset All Filters'}</span>
          </button>
        </div>
      ) : (
        /* RECIPES GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map((rec) => {
            const relatedProd = products.find((p) => p.id === rec.relatedProductId);

            return (
              <div 
                key={rec.id} 
                className="bg-[#161616] border border-zinc-800 hover:border-[#F4B400]/50 rounded-3xl overflow-hidden shadow-xl space-y-4 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1"
              >
                {/* Card Top: Image & Badges */}
                <div 
                  onClick={() => navigateTo('recipe-detail', { recipeId: rec.id })}
                  className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                >
                  <img 
                    src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'} 
                    alt={rec.titleEn} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  
                  {/* Difficulty badge */}
                  <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#F4B400] border border-[#F4B400]/40">
                    {rec.difficulty || 'Medium'}
                  </div>

                  {/* Pure Veg Green Dot Badge */}
                  <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>100% Veg</span>
                  </div>

                  {/* Subcategory Tag overlay if present */}
                  {rec.subcategoryName && (
                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-zinc-300 border border-zinc-700/80">
                      {rec.subcategoryName}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 pt-1 space-y-3.5 flex-1">
                  {/* Time and Servings info */}
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1" title="Prep time">
                      <Clock className="w-3.5 h-3.5 text-[#F4B400]" /> {rec.prepTime || '15m'} prep
                    </span>
                    <span className="flex items-center gap-1" title="Cook time">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> {rec.cookTime || '25m'} cook
                    </span>
                    <span className="flex items-center gap-1" title="Servings">
                      <Users className="w-3.5 h-3.5 text-zinc-400" /> Serves {rec.servings || '4'}
                    </span>
                  </div>

                  {/* Title & Category Tags */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rec.categoryName && (
                        <span className="text-[10px] font-bold text-[#F4B400] uppercase tracking-wider">
                          {rec.categoryName}
                        </span>
                      )}
                      {rec.subcategoryName && rec.categoryName && (
                        <span className="text-[10px] text-zinc-500">•</span>
                      )}
                      {rec.subcategoryName && (
                        <span className="text-[10px] font-semibold text-zinc-400">
                          {rec.subcategoryName}
                        </span>
                      )}
                    </div>

                    <h3 
                      onClick={() => navigateTo('recipe-detail', { recipeId: rec.id })}
                      className="text-xl font-black text-white font-marathi cursor-pointer group-hover:text-[#F4B400] transition-colors leading-snug line-clamp-1"
                    >
                      {language === 'mr' ? rec.titleMr : rec.titleEn}
                    </h3>
                    <h4 className="text-xs font-semibold text-zinc-400 line-clamp-1">
                      {language === 'mr' ? rec.titleEn : rec.titleMr}
                    </h4>
                  </div>

                  {/* Required Spice Pill */}
                  <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[10px] font-bold text-[#F4B400] uppercase tracking-wider block">
                      {language === 'mr' ? '🌶️ लागणारा खास मसाला:' : '🌶️ Required Spice:'}
                    </span>
                    <p className="text-xs text-zinc-200 font-bold truncate">
                      {rec.relatedProductName || (relatedProd ? (language === 'mr' ? relatedProd.nameMr : relatedProd.nameEn) : 'दादांचे स्पेशल कांदा लसूण मसाला')}
                    </p>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-zinc-400 line-clamp-2 font-marathi leading-relaxed">
                    {language === 'mr' ? ((rec as any).descriptionMr || rec.titleMr) : ((rec as any).descriptionEn || rec.titleEn)}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 space-y-2">
                  <button
                    onClick={() => navigateTo('recipe-detail', { recipeId: rec.id })}
                    className="w-full bg-[#1F1F1F] hover:bg-[#F4B400] hover:text-[#111111] text-white font-bold text-xs py-3 rounded-2xl border border-zinc-700 transition-all flex items-center justify-center gap-2 group-hover:border-[#F4B400]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{language === 'mr' ? 'संपूर्ण पाककृती वाचा (Read Recipe)' : 'Read Full Written Recipe'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {relatedProd && (
                    <button
                      onClick={() => {
                        addToCart(relatedProd, 1);
                        showToast(language === 'mr' ? 'मसाला कार्टमध्ये जोडला गेला!' : 'Required spice added to cart!');
                      }}
                      className="w-full bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 font-bold text-[11px] py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#F4B400]" />
                      <span>{language === 'mr' ? 'हा मसाला खरेदी करा (₹' + relatedProd.price + ')' : 'Buy Spice (' + relatedProd.nameEn + ' - ₹' + relatedProd.price + ')'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
