import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Clock, Users, Flame, ChefHat, ArrowLeft, Share2, Printer, 
  Check, CheckSquare, Square, ShoppingBag, Star, Heart, 
  Sparkles, BookOpen, AlertCircle, ChevronRight, MessageCircle, ArrowRight
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

export const RecipeDetailPage: React.FC = () => {
  const { 
    language, recipes, selectedRecipeId, navigateTo, products, 
    addToCart, showToast 
  } = useApp();

  const [activeLang, setActiveLang] = useState<'mr' | 'en'>(language === 'mr' ? 'mr' : 'en');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);

  // Sync activeLang with global language changes
  useEffect(() => {
    setActiveLang(language === 'mr' ? 'mr' : 'en');
  }, [language]);

  // Find the selected recipe
  const recipe = recipes.find((r) => r.id === selectedRecipeId || r.slug === selectedRecipeId) || recipes[0];

  // If no recipe found, show fallback
  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <BookOpen className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white font-marathi">
          {language === 'mr' ? 'पाककृती सापडली नाही' : 'Recipe Not Found'}
        </h2>
        <p className="text-xs text-zinc-400">
          The recipe you are looking for does not exist or has been removed.
        </p>
        <button
          onClick={() => navigateTo('recipes')}
          className="bg-[#F4B400] text-[#111111] font-bold text-xs px-6 py-3 rounded-full"
        >
          {language === 'mr' ? 'सर्व पाककृती पहा' : 'View All Recipes'}
        </button>
      </div>
    );
  }

  const images = recipe.images && recipe.images.length > 0 ? recipe.images : [recipe.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'];
  const currentImage = images[selectedImageIndex] || images[0];

  // Related product from store
  const relatedProduct = products.find((p) => 
    p && (p.id === recipe.relatedProductId || 
    (p.nameEn && p.nameEn.toLowerCase().includes('kanda')) || 
    (p.nameEn && p.nameEn.toLowerCase().includes('masala')))
  ) || products[0];

  // Ingredients and Steps depending on language or toggle
  const ingredients = (activeLang === 'mr' && recipe.ingredientsMr && recipe.ingredientsMr.length > 0)
    ? recipe.ingredientsMr
    : (recipe.ingredientsEn || recipe.ingredientsMr || []);

  const steps = (activeLang === 'mr' && recipe.stepsMr && recipe.stepsMr.length > 0)
    ? recipe.stepsMr
    : (recipe.stepsEn || recipe.stepsMr || []);

  const description = (activeLang === 'mr' && recipe.descriptionMr)
    ? recipe.descriptionMr
    : (recipe.descriptionEn || recipe.descriptionMr || '');

  const tips = (activeLang === 'mr' && recipe.tipsMr)
    ? recipe.tipsMr
    : (recipe.tipsEn || recipe.tipsMr || '');

  const servingSuggestions = (activeLang === 'mr' && recipe.servingSuggestionsMr)
    ? recipe.servingSuggestionsMr
    : (recipe.servingSuggestionsEn || recipe.servingSuggestionsMr || '');

  // Toggle Ingredient Check
  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Toggle Step Completed
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Share on WhatsApp
  const handleShareWhatsApp = () => {
    const title = activeLang === 'mr' ? (recipe.titleMr || recipe.titleEn) : (recipe.titleEn || recipe.titleMr);
    const url = window.location.href;
    const text = encodeURIComponent(
      `🍲 *${title}* — दादाचा ढाबा अस्सल गावरान चवीची लेखी पाककृती!\n\n` +
      `⏱️ वेळ: ${recipe.cookTime} | 👨‍🍳 शेफ: ${recipe.author || 'Chef Dada'}\n` +
      `👉 संपूर्ण पाककृती येथे वाचा: ${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    showToast(language === 'mr' ? 'रेसिपीची लिंक कॉपी झाली!' : 'Recipe link copied to clipboard!');
    setTimeout(() => setCopiedShare(false), 3000);
  };

  // Print Recipe
  const handlePrint = () => {
    window.print();
  };

  // Other related recipes
  const relatedRecipes = recipes
    .filter((r) => r.id !== recipe.id && (r.categoryId === recipe.categoryId || r.difficulty === recipe.difficulty))
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 print:py-0 print:px-0">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigateTo('recipes')}
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-[#F4B400] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'mr' ? 'सर्व लेखी पाककृती कडे परत जा' : 'Back to All Recipes'}</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Language Toggle for this recipe */}
          <div className="bg-[#1C1C1C] border border-zinc-800 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setActiveLang('mr')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeLang === 'mr' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setActiveLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeLang === 'en' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          <button
            onClick={handleShareWhatsApp}
            className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Share on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="bg-[#222222] hover:bg-[#333333] text-zinc-300 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Copy Recipe Link"
          >
            {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-[#F4B400]" />}
            <span className="hidden sm:inline">{copiedShare ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-[#222222] hover:bg-[#333333] text-zinc-300 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Print Recipe"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* HERO SECTION: RECIPE HEADER & IMAGE GALLERY */}
      <div className="bg-[#141414] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 bg-black flex flex-col justify-between p-4 sm:p-6 space-y-4">
            <div className="relative aspect-video sm:aspect-4/3 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
              <img
                src={currentImage}
                alt={recipe.titleEn}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#111111]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#F4B400] border border-[#F4B400]/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>१००% शुद्ध शाकाहारी (100% Pure Veg)</span>
              </div>
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImageIndex === idx ? 'border-[#F4B400] scale-105 shadow-md' : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recipe Meta & Highlights */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/30 font-bold px-3 py-0.5 rounded-full uppercase">
                  {recipe.categoryName || 'Maharashtrian Special'}
                </span>
                {recipe.subcategoryName && (
                  <span className="text-[10px] bg-[#222222] text-zinc-300 font-bold px-3 py-0.5 rounded-full">
                    {recipe.subcategoryName}
                  </span>
                )}
                <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800 font-bold px-3 py-0.5 rounded-full">
                  Level: {recipe.difficulty || 'Medium'}
                </span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-marathi tracking-wide leading-snug">
                  {activeLang === 'mr' ? recipe.titleMr : recipe.titleEn}
                </h1>
                {recipe.titleMr && recipe.titleEn && (
                  <h2 className="text-sm font-semibold text-zinc-400 font-sans">
                    {activeLang === 'mr' ? recipe.titleEn : recipe.titleMr}
                  </h2>
                )}
              </div>

              {description && (
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-marathi">
                  {description}
                </p>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-[#F4B400]">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Prep</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white">{recipe.prepTime || '15 mins'}</p>
              </div>

              <div className="space-y-1 border-x border-zinc-800">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cook</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white">{recipe.cookTime || '25 mins'}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-emerald-400">
                  <Users className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Servings</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white">{recipe.servings || '4'} persons</p>
              </div>
            </div>

            {/* Author Credit */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-[#F4B400]" />
                <span>Recipe by: <strong className="text-white font-marathi">{recipe.author || 'दादांचा ढाबा शेफ'}</strong></span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Verified Pure Veg Recipe</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID: INGREDIENTS (LEFT) & STEP-BY-STEP COOKING (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INGREDIENTS CHECKLIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl sticky top-24">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-marathi">
                  <span>🧂 लागणारे साहित्य (Ingredients)</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {language === 'mr' ? 'तयारी करताना साहित्य टिक करा' : 'Check off items as you gather ingredients'}
                </p>
              </div>
              <span className="text-xs bg-[#F4B400]/10 text-[#F4B400] font-bold px-2.5 py-1 rounded-full">
                {ingredients.length} items
              </span>
            </div>

            {/* Interactive Ingredients List */}
            <div className="space-y-3">
              {ingredients.map((ing, idx) => {
                const isChecked = !!checkedIngredients[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      isChecked 
                        ? 'bg-emerald-950/20 border-emerald-800/50 text-zinc-400 line-through' 
                        : 'bg-[#1A1A1A] border-zinc-800 hover:border-zinc-700 text-zinc-200'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-marathi leading-relaxed flex-1">
                      {ing}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* DIRECT BUY REQUIRED SPICE CTA CARD */}
            {relatedProduct && (
              <div className="bg-gradient-to-br from-[#1F1600] to-[#121212] border border-[#F4B400]/40 rounded-2xl p-4 space-y-3 shadow-lg print:hidden">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F4B400]" />
                  <span className="text-[10px] font-bold text-[#F4B400] uppercase tracking-wider">
                    {language === 'mr' ? 'या रेसिपीसाठी खास मसाला' : 'Required Spice for this Recipe'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={relatedProduct.images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=300'}
                    alt={relatedProduct.nameEn}
                    className="w-14 h-14 rounded-xl object-cover border border-zinc-700 shrink-0"
                  />
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h4 className="font-bold text-white text-xs font-marathi truncate">
                      {language === 'mr' ? relatedProduct.nameMr : relatedProduct.nameEn}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      ₹{relatedProduct.price} • {relatedProduct.weight}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    addToCart(relatedProduct, 1);
                    showToast(language === 'mr' ? 'मसाला कार्टमध्ये जोडला गेला!' : 'Spice added to cart!');
                  }}
                  className="w-full bg-[#F4B400] hover:bg-[#E0A000] text-[#111111] font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'हा मसाला खरेदी करा (Add to Cart)' : 'Buy Required Spice'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: STEP-BY-STEP INSTRUCTIONS & CHEF TIPS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2 font-marathi">
                  <ChefHat className="w-5 h-5 text-[#F4B400]" />
                  <span>कृती आणि पद्धत (Step-by-Step Instructions)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {language === 'mr' ? 'दादांच्या ढाब्याप्रमाणे चवदार बनवण्यासाठी प्रत्येक पायरी काळजीपूर्वक वाचा' : 'Follow the step-by-step method to achieve authentic Dhaba taste'}
                </p>
              </div>
            </div>

            {/* Numbered Steps */}
            <div className="space-y-4">
              {steps.map((stp, idx) => {
                const isDone = !!completedSteps[idx];
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-3 ${
                      isDone 
                        ? 'bg-emerald-950/15 border-emerald-800/40' 
                        : 'bg-[#191919] border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-md ${
                          isDone 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-[#F4B400] text-[#111111]'
                        }`}>
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Step {idx + 1}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleStep(idx)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${
                          isDone 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {isDone ? '✓ Completed' : 'Mark as done'}
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-marathi pl-1">
                      {stp}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CHEF DADA'S SECRET TIPS BOX */}
            {tips && (
              <div className="bg-gradient-to-r from-amber-950/40 via-[#1C1400] to-transparent border border-amber-800/60 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-[#F4B400]">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    {language === 'mr' ? 'दादांची खास गुपित टीप (Chef Secret Tip)' : "Chef Dada's Secret Cooking Tip"}
                  </h4>
                </div>
                <p className="text-xs text-zinc-300 font-marathi leading-relaxed">
                  {tips}
                </p>
              </div>
            )}

            {/* SERVING SUGGESTIONS BOX */}
            {servingSuggestions && (
              <div className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-5 space-y-2">
                <h4 className="font-bold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <span>🍽️ {language === 'mr' ? 'सर्व्हिंग सूचना (Serving Suggestions)' : 'Serving Suggestions'}</span>
                </h4>
                <p className="text-xs text-zinc-400 font-marathi leading-relaxed">
                  {servingSuggestions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED RECIPES CAROUSEL / SECTION */}
      {relatedRecipes.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-zinc-800 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#F4B400] uppercase tracking-wider">
                {language === 'mr' ? 'इतर लोकप्रिय रेसिपी' : 'Explore More Recipes'}
              </span>
              <h3 className="text-xl font-bold text-white font-marathi">
                {language === 'mr' ? 'आणखी अस्सल गावरान पाककृती' : 'Related Dhaba Pure Veg Recipes'}
              </h3>
            </div>
            <button
              onClick={() => navigateTo('recipes')}
              className="text-xs text-[#F4B400] hover:underline font-bold flex items-center gap-1"
            >
              <span>{language === 'mr' ? 'सर्व रेसिपी पहा' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedRecipes.map((rec) => (
              <div
                key={rec.id}
                onClick={() => {
                  navigateTo('recipe-detail', { recipeId: rec.id });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#161616] border border-zinc-800 hover:border-[#F4B400]/60 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between cursor-pointer group transition-all"
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'}
                    alt={rec.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#F4B400]">
                    {rec.difficulty || 'Medium'}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F4B400]" /> {rec.cookTime || '25m'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-zinc-400" /> {rec.servings || '4'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white font-marathi group-hover:text-[#F4B400] transition-colors line-clamp-1">
                    {language === 'mr' ? rec.titleMr : rec.titleEn}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 font-marathi">
                    {language === 'mr' ? (rec.descriptionMr || rec.titleMr) : (rec.descriptionEn || rec.titleEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
