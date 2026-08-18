import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Recipe, RecipeCategory, RecipeSubcategory } from '../types';
import { 
  Plus, Edit, Trash2, Eye, Search, Filter, 
  Upload, X, Check, Sparkles, Image as ImageIcon,
  Clock, Users, ChefHat, CheckCircle2,
  BookOpen, Layers, Globe, Tag, ExternalLink, ArrowRight,
  Flame, ToggleLeft, ToggleRight, AlertCircle, ShoppingBag
} from 'lucide-react';

export const AdminRecipeManager: React.FC = () => {
  const { 
    language, recipes, recipeCategories, products,
    addRecipe, updateRecipe, deleteRecipe, toggleRecipePublished,
    addRecipeCategory, addRecipeSubcategory, deleteRecipeCategory,
    showToast, navigateTo
  } = useApp();

  // Search, Filter & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'recipes' | 'categories'>('recipes');

  // Modals & States
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  
  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameMr, setNewCatNameMr] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState<string>('');
  const [newSubNameEn, setNewSubNameEn] = useState('');
  const [newSubNameMr, setNewSubNameMr] = useState('');

  // Recipe Form State
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTitleMr, setFormTitleMr] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescMr, setFormDescMr] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSubcategoryId, setFormSubcategoryId] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('15 mins');
  const [formCookTime, setFormCookTime] = useState('25 mins');
  const [formServings, setFormServings] = useState('4');
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Expert'>('Medium');
  const [formAuthor, setFormAuthor] = useState('Chef Dada');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formImageUrlInput, setFormImageUrlInput] = useState('');
  const [formRelatedProductId, setFormRelatedProductId] = useState('');
  const [formTipsEn, setFormTipsEn] = useState('');
  const [formTipsMr, setFormTipsMr] = useState('');
  const [formServingSuggestionsEn, setFormServingSuggestionsEn] = useState('');
  const [formServingSuggestionsMr, setFormServingSuggestionsMr] = useState('');

  // Structured Ingredients State
  const [ingredientsList, setIngredientsList] = useState<{ en: string; mr: string }[]>([
    { en: '2 tbsp Dadache Special Kanda Lasun Masala', mr: '२ चमचे दादांचे स्पेशल कांदा लसूण मसाला' },
    { en: '2 medium Onions, finely chopped', mr: '२ मध्यम कांदे, बारीक चिरलेले' }
  ]);

  // Structured Steps State
  const [stepsList, setStepsList] = useState<{ en: string; mr: string }[]>([
    { en: 'Heat 2 tbsp oil in a heavy bottom pan and saute onions until golden brown.', mr: 'कढईत २ मोठे चमचे तेल गरम करून कांदा सोनेरी रंगावर परता.' },
    { en: 'Add Dadache Special Masala and cook for 2 minutes on low flame.', mr: 'दादांचे स्पेशल मसाला घालून मंद आचेवर २ मिनिटे परतून घ्या.' }
  ]);

  // Inline Subcategory Creation State
  const [showInlineSubModal, setShowInlineSubModal] = useState(false);
  const [inlineSubNameEn, setInlineSubNameEn] = useState('');
  const [inlineSubNameMr, setInlineSubNameMr] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or Reset Recipe Form
  const openNewRecipeModal = () => {
    setEditingRecipe(null);
    setFormTitleEn('');
    setFormTitleMr('');
    setFormSlug('');
    setFormDescEn('');
    setFormDescMr('');
    setFormCategoryId(recipeCategories[0]?.id || 'veg-curries');
    setFormSubcategoryId('');
    setFormPrepTime('15 mins');
    setFormCookTime('25 mins');
    setFormServings('4');
    setFormDifficulty('Medium');
    setFormAuthor('Chef Dada');
    setFormIsPublished(true);
    setFormImages(['https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800']);
    setFormImageUrlInput('');
    setFormRelatedProductId(products[0]?.id || '');
    setFormTipsEn('For extra rich aroma, roast the masala on low flame with pure desi ghee.');
    setFormTipsMr('उत्तम चवीसाठी मसाला मंद आचेवर साजूक तुपात २ मिनिटे परतावा.');
    setFormServingSuggestionsEn('Serve hot with hot Jowar Bhakri, Chapati or steamed rice.');
    setFormServingSuggestionsMr('गरमागरम ज्वारीची भाकरी, चपाती किंवा भातासोबत सर्व्ह करा.');
    setIngredientsList([
      { en: '2 tbsp Dadache Special Kanda Lasun Masala', mr: '२ चमचे दादांचे स्पेशल कांदा लसूण मसाला' },
      { en: '2 medium Onions, finely chopped', mr: '२ मध्यम कांदे, बारीक चिरलेले' },
      { en: '1 cup Boiled Veggies / Paneer / Shev', mr: '१ कप उकडलेल्या भाज्या / पनीर / शेव' },
      { en: 'Salt to taste and fresh coriander', mr: 'चवीनुसार मीठ व ताजी कोथिंबीर' }
    ]);
    setStepsList([
      { en: 'Heat 2 tbsp oil in a kadai and add chopped onions and ginger-garlic paste.', mr: 'कढईत २ चमचे तेल गरम करून बारीक चिरलेला कांदा व आले-लसूण पेस्ट परतून घ्या.' },
      { en: 'Add tomatoes and cook until soft and oil separates from the edges.', mr: 'टोमॅटो घालून तेल सुटेपर्यंत चांगले परतून घ्या.' },
      { en: 'Add Dadache Special Masala, turmeric and salt. Mix thoroughly on low heat.', mr: 'दादांचे स्पेशल मसाला, हळद व मीठ घालून मंद आचेवर परता.' },
      { en: 'Add warm water as per desired gravy consistency and simmer for 5-7 minutes.', mr: 'आवश्यकतेनुसार कोमट पाणी घालून ५-७ मिनिटे मंद आचेवर रस्सा उकळू द्या.' },
      { en: 'Garnish with freshly chopped green coriander and serve piping hot.', mr: 'वरून ताजी बारीक चिरलेली कोथिंबीर घालून गरमागरम वाढा.' }
    ]);
    setShowRecipeModal(true);
  };

  const openEditRecipeModal = (rec: Recipe) => {
    setEditingRecipe(rec);
    setFormTitleEn(rec.titleEn);
    setFormTitleMr(rec.titleMr);
    setFormSlug(rec.slug);
    setFormDescEn(rec.descriptionEn || '');
    setFormDescMr(rec.descriptionMr || '');
    setFormCategoryId(rec.categoryId);
    setFormSubcategoryId(rec.subcategoryId || '');
    setFormPrepTime(rec.prepTime || '15 mins');
    setFormCookTime(rec.cookTime || '25 mins');
    setFormServings(rec.servings || '4');
    setFormDifficulty(rec.difficulty || 'Medium');
    setFormAuthor(rec.author || 'Chef Dada');
    setFormIsPublished(rec.isPublished);
    setFormImages(rec.images && rec.images.length > 0 ? rec.images : [rec.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800']);
    setFormRelatedProductId(rec.relatedProductId || '');
    setFormTipsEn(rec.tipsEn || '');
    setFormTipsMr(rec.tipsMr || '');
    setFormServingSuggestionsEn(rec.servingSuggestionsEn || '');
    setFormServingSuggestionsMr(rec.servingSuggestionsMr || '');

    // Map ingredients
    const maxIngs = Math.max(rec.ingredientsEn?.length || 0, rec.ingredientsMr?.length || 0);
    const ings: { en: string; mr: string }[] = [];
    for (let i = 0; i < maxIngs; i++) {
      ings.push({
        en: rec.ingredientsEn?.[i] || '',
        mr: rec.ingredientsMr?.[i] || ''
      });
    }
    setIngredientsList(ings.length > 0 ? ings : [{ en: '', mr: '' }]);

    // Map steps
    const maxSteps = Math.max(rec.stepsEn?.length || 0, rec.stepsMr?.length || 0);
    const stps: { en: string; mr: string }[] = [];
    for (let i = 0; i < maxSteps; i++) {
      stps.push({
        en: rec.stepsEn?.[i] || '',
        mr: rec.stepsMr?.[i] || ''
      });
    }
    setStepsList(stps.length > 0 ? stps : [{ en: '', mr: '' }]);

    setShowRecipeModal(true);
  };

  // Image Upload Handling
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormImages((prev) => [...prev, e.target!.result as string]);
        showToast('Recipe image added!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!formImageUrlInput.trim()) return;
    setFormImages((prev) => [...prev, formImageUrlInput.trim()]);
    setFormImageUrlInput('');
    showToast('Image URL added!', 'success');
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add / Remove ingredient row
  const addIngredientRow = () => {
    setIngredientsList((prev) => [...prev, { en: '', mr: '' }]);
  };
  const removeIngredientRow = (idx: number) => {
    setIngredientsList((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateIngredientRow = (idx: number, field: 'en' | 'mr', val: string) => {
    setIngredientsList((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  // Add / Remove step row
  const addStepRow = () => {
    setStepsList((prev) => [...prev, { en: '', mr: '' }]);
  };
  const removeStepRow = (idx: number) => {
    setStepsList((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateStepRow = (idx: number, field: 'en' | 'mr', val: string) => {
    setStepsList((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  // Handle Save Recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleEn.trim() && !formTitleMr.trim()) {
      showToast('Please enter a Recipe Title in Marathi or English', 'error');
      return;
    }

    const currentCat = recipeCategories.find((c) => c.id === formCategoryId);
    const currentSub = currentCat?.subcategories.find((s) => s.id === formSubcategoryId);
    const relatedProd = products.find((p) => p.id === formRelatedProductId);

    const validIngredientsEn = ingredientsList.map((i) => i.en.trim()).filter(Boolean);
    const validIngredientsMr = ingredientsList.map((i) => i.mr.trim()).filter(Boolean);
    const validStepsEn = stepsList.map((s) => s.en.trim()).filter(Boolean);
    const validStepsMr = stepsList.map((s) => s.mr.trim()).filter(Boolean);

    const generatedSlug = formSlug.trim() 
      || formTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      || 'recipe-' + Date.now();

    const recipePayload = {
      titleEn: formTitleEn.trim() || formTitleMr.trim(),
      titleMr: formTitleMr.trim() || formTitleEn.trim(),
      slug: generatedSlug,
      descriptionEn: formDescEn.trim(),
      descriptionMr: formDescMr.trim(),
      categoryId: formCategoryId,
      categoryName: currentCat?.nameEn || 'General',
      subcategoryId: formSubcategoryId || undefined,
      subcategoryName: currentSub?.nameEn || undefined,
      prepTime: formPrepTime.trim(),
      cookTime: formCookTime.trim(),
      servings: formServings.trim(),
      difficulty: formDifficulty,
      author: formAuthor.trim() || 'Chef Dada',
      isPublished: formIsPublished,
      image: formImages[0] || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800',
      images: formImages.length > 0 ? formImages : ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'],
      ingredientsEn: validIngredientsEn,
      ingredientsMr: validIngredientsMr,
      stepsEn: validStepsEn,
      stepsMr: validStepsMr,
      tipsEn: formTipsEn.trim(),
      tipsMr: formTipsMr.trim(),
      servingSuggestionsEn: formServingSuggestionsEn.trim(),
      servingSuggestionsMr: formServingSuggestionsMr.trim(),
      relatedProductId: formRelatedProductId || undefined,
      relatedProductName: relatedProd ? relatedProd.nameEn : undefined,
    };

    if (editingRecipe) {
      const ok = await updateRecipe(editingRecipe.id, recipePayload);
      if (ok) setShowRecipeModal(false);
    } else {
      const ok = await addRecipe(recipePayload);
      if (ok) setShowRecipeModal(false);
    }
  };

  // Handle Quick Inline Subcategory creation
  const handleCreateInlineSubcategory = async () => {
    if (!inlineSubNameEn.trim() && !inlineSubNameMr.trim()) {
      showToast('Please enter subcategory name', 'error');
      return;
    }
    if (!formCategoryId) {
      showToast('Please select a Category first', 'error');
      return;
    }

    const slug = (inlineSubNameEn || inlineSubNameMr).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ok = await addRecipeSubcategory({
      categoryId: formCategoryId,
      nameEn: inlineSubNameEn.trim() || inlineSubNameMr.trim(),
      nameMr: inlineSubNameMr.trim() || inlineSubNameEn.trim(),
      slug: slug || 'sub-' + Date.now(),
    });

    if (ok) {
      setFormSubcategoryId(slug);
      setShowInlineSubModal(false);
      setInlineSubNameEn('');
      setInlineSubNameMr('');
    }
  };

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNameEn.trim() && !newCatNameMr.trim()) {
      showToast('Please enter category name in Marathi or English', 'error');
      return;
    }
    const slug = (newCatNameEn || newCatNameMr).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ok = await addRecipeCategory({
      nameEn: newCatNameEn.trim() || newCatNameMr.trim(),
      nameMr: newCatNameMr.trim() || newCatNameEn.trim(),
      slug: slug || 'cat-' + Date.now(),
      displayOrder: recipeCategories.length + 1,
      isActive: true,
      subcategories: [],
    });
    if (ok) {
      setNewCatNameEn('');
      setNewCatNameMr('');
    }
  };

  // Handle Subcategory Creation under dedicated modal
  const handleAddSubToCategory = async (catId: string) => {
    if (!newSubNameEn.trim() && !newSubNameMr.trim()) {
      showToast('Please enter subcategory name', 'error');
      return;
    }
    const slug = (newSubNameEn || newSubNameMr).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ok = await addRecipeSubcategory({
      categoryId: catId,
      nameEn: newSubNameEn.trim() || newSubNameMr.trim(),
      nameMr: newSubNameMr.trim() || newSubNameEn.trim(),
      slug: slug || 'sub-' + Date.now(),
    });
    if (ok) {
      setNewSubNameEn('');
      setNewSubNameMr('');
      setSelectedCatForSub('');
    }
  };

  // Filtered Recipes
  const filteredRecipes = recipes.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      rec.titleEn.toLowerCase().includes(q) ||
      rec.titleMr.includes(q) ||
      (rec.descriptionEn && rec.descriptionEn.toLowerCase().includes(q)) ||
      (rec.descriptionMr && rec.descriptionMr.includes(q)) ||
      rec.ingredientsEn?.some((i) => i.toLowerCase().includes(q)) ||
      rec.ingredientsMr?.some((i) => i.includes(q));

    const matchesCategory = categoryFilter === 'all' || rec.categoryId === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'published') matchesStatus = rec.isPublished === true;
    else if (statusFilter === 'draft') matchesStatus = rec.isPublished === false;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedCategoryObj = recipeCategories.find((c) => c.id === formCategoryId);

  return (
    <div className="space-y-8">
      {/* Top Banner & Action Header */}
      <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-[#F4B400] text-[#111111] font-black px-3 py-0.5 rounded-full uppercase">
              📖 WRITTEN RECIPES MANAGEMENT
            </span>
            <span className="bg-amber-950/80 text-amber-400 border border-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              Pure Veg & Dhaba Secrets
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi">
            लेखी पाककृती व्यवस्थापन (Written Recipes)
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            येथे नवीन लेखी पाककृती (Recipes) जोडा, संपादित करा, साहित्य (Ingredients), कृती (Steps) आणि लागणारे मसाले (Spices) थेट ग्राहकांसाठी प्रकाशित करा.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <button
            onClick={() => setActiveSubTab(activeSubTab === 'recipes' ? 'categories' : 'recipes')}
            className="flex-1 md:flex-initial bg-[#222222] hover:bg-[#333333] text-zinc-200 font-bold text-xs px-4 py-3 rounded-2xl border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Layers className="w-4 h-4 text-[#F4B400]" />
            <span>{activeSubTab === 'recipes' ? 'Manage Recipe Categories' : 'Back to Recipes'}</span>
          </button>

          <button
            onClick={openNewRecipeModal}
            className="flex-1 md:flex-initial bg-[#F4B400] hover:bg-[#E0A000] text-[#111111] font-black text-xs px-6 py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'mr' ? 'नवीन रेसिपी जोडा' : 'Add New Recipe'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs: Recipes vs Categories */}
      {activeSubTab === 'categories' ? (
        /* CATEGORY & SUBCATEGORY MANAGEMENT */
        <div className="space-y-6">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#F4B400]" />
                  <span>Recipe Categories & Subcategories</span>
                </h3>
                <p className="text-xs text-zinc-400">Manage categories like "Veg Rassa", "Dhaba Gravies", "Bhakri & Rotis" and subcategories.</p>
              </div>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} className="bg-[#111111] p-4 rounded-2xl border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Category Name (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtrian Gravies"
                  value={newCatNameEn}
                  onChange={(e) => setNewCatNameEn(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">श्रेणीचे नाव (मराठी)</label>
                <input
                  type="text"
                  placeholder="उदा. गावरान रस्सा व भाज्या"
                  value={newCatNameMr}
                  onChange={(e) => setNewCatNameMr(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-[#F4B400] text-[#111111] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#E0A000] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </form>

            {/* Category List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recipeCategories.map((cat) => (
                <div key={cat.id} className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm font-marathi">{cat.nameMr} ({cat.nameEn})</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">Slug: {cat.slug}</span>
                    </div>
                    <button
                      onClick={() => deleteRecipeCategory(cat.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#F4B400] uppercase tracking-wider block">Subcategories:</span>
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        cat.subcategories.map((sub) => (
                          <span key={sub.id} className="bg-[#1F1F1F] border border-zinc-700 text-zinc-300 text-[11px] px-3 py-1 rounded-full font-marathi">
                            {sub.nameMr} <span className="text-zinc-500 text-[9px]">({sub.nameEn})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-500 italic">No subcategories yet</span>
                      )}
                    </div>
                  </div>

                  {/* Add Subcategory Quick Form */}
                  {selectedCatForSub === cat.id ? (
                    <div className="bg-[#181818] p-3 rounded-xl border border-zinc-700 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Subcategory (English)"
                          value={newSubNameEn}
                          onChange={(e) => setNewSubNameEn(e.target.value)}
                          className="bg-[#111] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="उप-श्रेणी (मराठी)"
                          value={newSubNameMr}
                          onChange={(e) => setNewSubNameMr(e.target.value)}
                          className="bg-[#111] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCatForSub('')}
                          className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSubToCategory(cat.id)}
                          className="bg-[#F4B400] text-[#111111] font-bold text-xs px-3 py-1 rounded-lg"
                        >
                          Save Subcategory
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCatForSub(cat.id);
                        setNewSubNameEn('');
                        setNewSubNameMr('');
                      }}
                      className="text-xs text-[#F4B400] hover:underline font-bold flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subcategory to {cat.nameEn}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* RECIPE LIST & FILTER VIEW */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'mr' ? 'रेसिपी शोधा (नाव, मसाला, साहित्य)...' : 'Search recipes by title or ingredient...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-zinc-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#111111] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:border-[#F4B400] focus:outline-none"
              >
                <option value="all">All Categories ({recipes.length})</option>
                {recipeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameMr} ({c.nameEn})
                  </option>
                ))}
              </select>

              <div className="flex bg-[#111111] p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    statusFilter === 'all' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({recipes.length})
                </button>
                <button
                  onClick={() => setStatusFilter('published')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    statusFilter === 'published' ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Live ({recipes.filter((r) => r.isPublished).length})
                </button>
                <button
                  onClick={() => setStatusFilter('draft')}
                  className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                    statusFilter === 'draft' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Drafts ({recipes.filter((r) => !r.isPublished).length})
                </button>
              </div>
            </div>
          </div>

          {/* Recipes Grid */}
          {filteredRecipes.length === 0 ? (
            <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Recipes Found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No written recipes match your search criteria. Click below to publish your first written Dhaba recipe.
              </p>
              <button
                onClick={openNewRecipeModal}
                className="bg-[#F4B400] text-[#111111] font-bold text-xs px-5 py-2.5 rounded-full"
              >
                + Create Recipe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((rec) => (
                <div 
                  key={rec.id} 
                  className="bg-[#161616] border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 group"
                >
                  {/* Card Top: Image & Badges */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img 
                      src={rec.image || (rec.images && rec.images[0]) || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800'} 
                      alt={rec.titleEn} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-[#111111]/80 backdrop-blur-md text-[#F4B400] border border-[#F4B400]/40 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {rec.difficulty || 'Medium'}
                      </span>
                      {rec.categoryName && (
                        <span className="bg-black/70 backdrop-blur-md text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {rec.categoryName}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => toggleRecipePublished(rec.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md transition-all shadow-md ${
                          rec.isPublished 
                            ? 'bg-emerald-500/90 text-white border border-emerald-400' 
                            : 'bg-zinc-800/90 text-zinc-300 border border-zinc-600'
                        }`}
                        title={rec.isPublished ? 'Click to unpublish' : 'Click to publish'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.isPublished ? 'bg-white animate-pulse' : 'bg-zinc-400'}`} />
                        <span>{rec.isPublished ? 'Published' : 'Draft'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3 flex-1">
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#F4B400]" /> {rec.prepTime || '15m'} prep
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> {rec.cookTime || '25m'} cook
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" /> {rec.servings || '4'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white font-marathi line-clamp-1">
                        {rec.titleMr || rec.titleEn}
                      </h3>
                      <h4 className="text-xs font-semibold text-zinc-400 line-clamp-1">
                        {rec.titleEn}
                      </h4>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-zinc-400">
                      <span className="bg-[#1F1F1F] px-2.5 py-0.5 rounded-md border border-zinc-800">
                        🧂 {rec.ingredientsEn?.length || rec.ingredientsMr?.length || 0} Ingredients
                      </span>
                      <span className="bg-[#1F1F1F] px-2.5 py-0.5 rounded-md border border-zinc-800">
                        👨‍🍳 {rec.stepsEn?.length || rec.stepsMr?.length || 0} Steps
                      </span>
                      {rec.relatedProductName && (
                        <span className="bg-amber-950/40 border border-amber-800/60 text-amber-300 px-2.5 py-0.5 rounded-md line-clamp-1">
                          🌶️ {rec.relatedProductName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 border-t border-zinc-800 flex items-center justify-between gap-2 bg-[#141414]">
                    <button
                      onClick={() => navigateTo('recipe-detail', { recipeId: rec.id })}
                      className="text-xs text-zinc-400 hover:text-[#F4B400] font-bold flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors"
                      title="View public recipe page"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditRecipeModal(rec)}
                        className="bg-[#222222] hover:bg-[#333333] text-zinc-200 font-bold text-xs px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#F4B400]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingRecipe(rec)}
                        className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 p-2 rounded-xl border border-rose-900/60 transition-colors"
                        title="Delete recipe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT RECIPE MODAL */}
      {showRecipeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-[#161616]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#F4B400]/10 border border-[#F4B400]/20 text-[#F4B400]">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-marathi">
                    {editingRecipe ? 'पाककृती संपादित करा (Edit Recipe)' : 'नवीन लेखी पाककृती जोडा (Add New Recipe)'}
                  </h3>
                  <p className="text-xs text-zinc-400">Fill in title, ingredients, step-by-step instructions and images</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecipeModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveRecipe} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              {/* SECTION 1: TITLES & SLUG */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#F4B400] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>1. Recipe Titles & Details (मथळा व माहिती)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      रेसिपीचे नाव (मराठी) *
                    </label>
                    <input
                      type="text"
                      placeholder="उदा. कोल्हापुरी गावरान काळा रस्सा"
                      value={formTitleMr}
                      onChange={(e) => setFormTitleMr(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Recipe Title (English) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kolhapuri Veg Kala Rassa"
                      value={formTitleEn}
                      onChange={(e) => setFormTitleEn(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      पाककृती थोडक्यात वर्णन (मराठी)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="या चविष्ट अस्सल गावरान रस्स्याची ओळख..."
                      value={formDescMr}
                      onChange={(e) => setFormDescMr(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Recipe Short Introduction (English)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Authentic aromatic Maharashtrian curry made with hand-pounded spices..."
                      value={formDescEn}
                      onChange={(e) => setFormDescEn(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CATEGORY, SUBCATEGORY & ATTRIBUTES */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-[#F4B400] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>2. Category & Cooking Metrics (श्रेणी व वेळ)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Category (श्रेणी) *
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => {
                        setFormCategoryId(e.target.value);
                        setFormSubcategoryId('');
                      }}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    >
                      {recipeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameMr} ({c.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-300">
                        Subcategory (उप-श्रेणी)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowInlineSubModal(true)}
                        className="text-[10px] text-[#F4B400] hover:underline font-bold"
                      >
                        + Create New Subcategory
                      </button>
                    </div>
                    <select
                      value={formSubcategoryId}
                      onChange={(e) => setFormSubcategoryId(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    >
                      <option value="">None / General</option>
                      {selectedCategoryObj?.subcategories?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameMr} ({s.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    >
                      <option value="Easy">Easy (सोपे)</option>
                      <option value="Medium">Medium (मध्यम)</option>
                      <option value="Expert">Expert (विशेष)</option>
                    </select>
                  </div>

                  {/* Prep Time */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Preparation Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15 mins"
                      value={formPrepTime}
                      onChange={(e) => setFormPrepTime(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>

                  {/* Cook Time */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Cooking Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 25 mins"
                      value={formCookTime}
                      onChange={(e) => setFormCookTime(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>

                  {/* Servings */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Serving Quantity
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4 Persons"
                      value={formServings}
                      onChange={(e) => setFormServings(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INGREDIENTS (STRUCTURED LIST) */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F4B400] uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span>3. Ingredients List (लागणारे साहित्य - मराठी व English)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="bg-[#222222] hover:bg-[#333333] text-[#F4B400] text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient Row</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {ingredientsList.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#111111] p-2 rounded-xl border border-zinc-800">
                      <span className="text-[11px] font-mono text-zinc-500 w-6 text-center">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="साहित्य (मराठी) - उदा. २ चमचे कांदा लसूण मसाला"
                        value={ing.mr}
                        onChange={(e) => updateIngredientRow(idx, 'mr', e.target.value)}
                        className="flex-1 bg-[#1A1A1A] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-marathi focus:border-[#F4B400] focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Ingredient (English) - e.g. 2 tbsp Kanda Lasun Masala"
                        value={ing.en}
                        onChange={(e) => updateIngredientRow(idx, 'en', e.target.value)}
                        className="flex-1 bg-[#1A1A1A] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                      />
                      {ingredientsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(idx)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: STEP-BY-STEP COOKING INSTRUCTIONS */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F4B400] uppercase tracking-wider flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4" />
                    <span>4. Step-by-Step Cooking Steps (कृती - पायरीनुसार)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addStepRow}
                    className="bg-[#222222] hover:bg-[#333333] text-[#F4B400] text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-700 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {stepsList.map((stp, idx) => (
                    <div key={idx} className="bg-[#111111] p-3 rounded-2xl border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-2.5 py-0.5 rounded-full">
                          Step {idx + 1}
                        </span>
                        {stepsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStepRow(idx)}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Step</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-0.5">पायरी (मराठी)</label>
                          <textarea
                            rows={2}
                            placeholder="पायरीची माहिती मराठीत लिहा..."
                            value={stp.mr}
                            onChange={(e) => updateStepRow(idx, 'mr', e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl p-2 text-xs text-white font-marathi focus:border-[#F4B400] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400 mb-0.5">Step Instruction (English)</label>
                          <textarea
                            rows={2}
                            placeholder="Write instruction in English..."
                            value={stp.en}
                            onChange={(e) => updateStepRow(idx, 'en', e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl p-2 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: RECIPE IMAGES */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-[#F4B400] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  <span>5. Recipe Images (छायाचित्रे)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (e.g. https://...)"
                      value={formImageUrlInput}
                      onChange={(e) => setFormImageUrlInput(e.target.value)}
                      className="flex-1 bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-[#222222] hover:bg-[#333333] text-[#F4B400] text-xs font-bold px-3 py-2 rounded-xl border border-zinc-700"
                    >
                      + Add URL
                    </button>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-[#222222] hover:bg-[#333333] text-zinc-200 text-xs font-bold py-2.5 rounded-xl border border-zinc-700 flex items-center justify-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#F4B400]" />
                      <span>Upload Image File</span>
                    </button>
                  </div>
                </div>

                {/* Preview Thumbnail Strip */}
                {formImages.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto p-2 bg-[#111111] rounded-2xl border border-zinc-800">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700 group">
                        <img src={img} alt="recipe" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-black/80 text-rose-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#F4B400] text-[#111111] text-[8px] font-black px-1.5 py-0.2 rounded">
                            PRIMARY
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 6: PRODUCT LINKING & CHEF TIPS */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold text-[#F4B400] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>6. Product Link & Chef Tips (मसाला लिंक व खास टिप्स)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Related Product */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Link Required Product / Spice (लागणारे उत्पादन)
                    </label>
                    <select
                      value={formRelatedProductId}
                      onChange={(e) => setFormRelatedProductId(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    >
                      <option value="">None / Custom Spice</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nameMr} ({p.nameEn}) - ₹{p.price}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      This attaches a direct "Buy This Spice" card on the recipe page with 1-click cart purchase.
                    </p>
                  </div>

                  {/* Publishing Status */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Publishing Status
                    </label>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setFormIsPublished(!formIsPublished)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formIsPublished 
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${formIsPublished ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                        <span>{formIsPublished ? 'Published (Live on Website)' : 'Draft (Hidden from Public)'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Chef Tips (मराठी)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="उदा. उत्तम चवीसाठी मसाला मंद आचेवर साजूक तुपात परतावा..."
                      value={formTipsMr}
                      onChange={(e) => setFormTipsMr(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl p-2 text-xs text-white font-marathi focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Chef Tips (English)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Cook on low flame with pure desi ghee for richer aroma..."
                      value={formTipsEn}
                      onChange={(e) => setFormTipsEn(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl p-2 text-xs text-white focus:border-[#F4B400] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-[#161616] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 sm:px-8 py-4">
                <button
                  type="button"
                  onClick={() => setShowRecipeModal(false)}
                  className="bg-[#222222] hover:bg-[#333333] text-zinc-300 font-bold text-xs px-5 py-2.5 rounded-xl border border-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#F4B400] hover:bg-[#E0A000] text-[#111111] font-black text-xs px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRecipe ? 'Save Changes' : 'Publish Recipe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE SUBCATEGORY MODAL */}
      {showInlineSubModal && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-zinc-800 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base font-marathi">नवीन उप-श्रेणी जोडा (Add Subcategory)</h3>
              <button onClick={() => setShowInlineSubModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">Subcategory Name (English)</label>
                <input
                  type="text"
                  placeholder="e.g. Kolhapuri Special"
                  value={inlineSubNameEn}
                  onChange={(e) => setInlineSubNameEn(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">उप-श्रेणीचे नाव (मराठी)</label>
                <input
                  type="text"
                  placeholder="उदा. कोल्हापुरी स्पेशल"
                  value={inlineSubNameMr}
                  onChange={(e) => setInlineSubNameMr(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInlineSubModal(false)}
                className="text-xs text-zinc-400 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateInlineSubcategory}
                className="bg-[#F4B400] text-[#111111] font-bold text-xs px-4 py-2 rounded-xl"
              >
                Create & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRecipe && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-rose-900/60 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Delete Recipe?</h3>
              <p className="text-xs text-zinc-400 font-marathi">
                तुम्हाला खात्री आहे की ही रेसिपी कायमची हटवायची आहे? <br />
                <span className="text-white font-bold">"{deletingRecipe.titleMr || deletingRecipe.titleEn}"</span>
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeletingRecipe(null)}
                className="bg-[#222222] hover:bg-[#333333] text-zinc-300 font-bold text-xs px-5 py-2.5 rounded-xl border border-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteRecipe(deletingRecipe.id);
                  setDeletingRecipe(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
              >
                Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
