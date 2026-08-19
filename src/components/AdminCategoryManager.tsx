import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Product } from '../types';
import { getCategoryProducts, getCategoryProductCount } from '../utils/categoryUtils';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Star, ArrowUp, ArrowDown, 
  Folder, Image as ImageIcon, Search, Tag, Layers, Check, X, 
  Upload, MoveRight, HelpCircle, Palette, Globe, BarChart2,
  Package, ChevronRight, RefreshCw, AlertTriangle
} from 'lucide-react';

export const AdminCategoryManager: React.FC = () => {
  const { 
    language, categories, products, orders,
    addCategory, updateCategory, deleteCategory, 
    reorderCategories, toggleCategoryStatus, toggleCategoryFeatured,
    navigateTo, showToast
  } = useApp();

  // Safe fallbacks for data lists
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'featured'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const [deleteOption, setDeleteOption] = useState<'move' | 'delete'>('move');
  const [reassignCatId, setReassignCatId] = useState<string>('');
  
  // Category Products Modal
  const [viewProductsCat, setViewProductsCat] = useState<Category | null>(null);

  // Category Preview Modal
  const [previewCat, setPreviewCat] = useState<Category | null>(null);

  // Form State for Add / Edit
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'images' | 'style' | 'seo' | 'status'>('basic');
  const [formData, setFormData] = useState<Partial<Category>>({
    nameEn: '',
    nameMr: '',
    slug: '',
    descriptionEn: '',
    descriptionMr: '',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    bannerUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1600',
    mobileBannerUrl: '',
    icon: '🔥',
    backgroundColor: '#161616',
    textColor: '#FFFFFF',
    accentColor: '#F4B400',
    displayOrder: safeCategories.length + 1,
    isActive: true,
    isFeatured: false,
    parentId: null,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  // Calculate Category Analytics Helper
  const getCategoryStats = (catId: string) => {
    const targetCat = safeCategories.find(c => c.id === catId);
    const catProducts = getCategoryProducts(targetCat || catId, safeProducts);
    const productCount = catProducts.length;

    let totalOrdersCount = 0;
    let totalRevenue = 0;

    safeOrders.forEach((o) => {
      if (!o || !Array.isArray(o.items)) return;
      o.items.forEach((item: any) => {
        if (!item) return;
        const itemId = item.productId || item.product?.id || item.id;
        const itemPrice = typeof item.price === 'number' ? item.price : (item.product?.price || 0);
        const qty = typeof item.quantity === 'number' ? item.quantity : 1;

        if (itemId && catProducts.some((p) => p && p.id === itemId)) {
          totalOrdersCount += qty;
          totalRevenue += itemPrice * qty;
        }
      });
    });

    const topProduct = catProducts.length > 0
      ? catProducts.reduce((prev, curr) => ((curr?.reviewCount || 0) > (prev?.reviewCount || 0) ? curr : prev), catProducts[0])
      : null;

    return {
      productCount,
      totalOrdersCount,
      totalRevenue,
      topProduct: topProduct?.nameEn || 'N/A'
    };
  };

  // Open Create Form
  const handleOpenAddModal = () => {
    setFormData({
      nameEn: '',
      nameMr: '',
      slug: '',
      descriptionEn: '',
      descriptionMr: '',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
      bannerUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1600',
      mobileBannerUrl: '',
      icon: '🔥',
      backgroundColor: '#161616',
      textColor: '#FFFFFF',
      accentColor: '#F4B400',
      displayOrder: categories.length + 1,
      isActive: true,
      isFeatured: false,
      parentId: null,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setEditingCategory(null);
    setActiveFormTab('basic');
    setShowAddModal(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ ...cat });
    setActiveFormTab('basic');
    setShowAddModal(true);
  };

  // Auto-generate Slug from Name
  const handleNameChange = (val: string, lang: 'en' | 'mr') => {
    if (lang === 'en') {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setFormData((prev) => ({ ...prev, nameEn: val, slug: prev.slug ? prev.slug : slug }));
    } else {
      setFormData((prev) => ({ ...prev, nameMr: val }));
    }
  };

  // Save Category Handler
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn) {
      showToast('Category name in English is required', 'error');
      return;
    }

    const categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> = {
      nameEn: formData.nameEn || '',
      nameMr: formData.nameMr || formData.nameEn || '',
      slug: formData.slug || formData.nameEn.toLowerCase().replace(/\s+/g, '-'),
      descriptionEn: formData.descriptionEn || '',
      descriptionMr: formData.descriptionMr || '',
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
      bannerUrl: formData.bannerUrl || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1600',
      mobileBannerUrl: formData.mobileBannerUrl || formData.imageUrl,
      icon: formData.icon || '🏷️',
      backgroundColor: formData.backgroundColor || '#161616',
      textColor: formData.textColor || '#FFFFFF',
      accentColor: formData.accentColor || '#F4B400',
      buttonColor: formData.buttonColor || '#F4B400',
      displayOrder: Number(formData.displayOrder) || categories.length + 1,
      isActive: formData.isActive ?? true,
      isFeatured: formData.isFeatured ?? false,
      parentId: formData.parentId || null,
      seoTitle: formData.seoTitle || formData.nameEn,
      seoDescription: formData.seoDescription || formData.descriptionEn,
      seoKeywords: formData.seoKeywords || `${formData.nameEn}, dadacha dhaba spices`,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }

    setShowAddModal(false);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deleteCategoryTarget) return;

    if (deleteOption === 'move') {
      if (!reassignCatId) {
        showToast('Please select a target category to move products into', 'error');
        return;
      }
      deleteCategory(deleteCategoryTarget.id, { reassignCategoryId: reassignCatId });
    } else {
      deleteCategory(deleteCategoryTarget.id, { deleteProducts: true });
    }

    setDeleteCategoryTarget(null);
  };

  // Move Category Up / Down Order
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const newCats = [...sortedCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCats.length) return;

    const temp = newCats[index];
    newCats[index] = newCats[targetIndex];
    newCats[targetIndex] = temp;

    reorderCategories(newCats);
  };

  // Drag and Drop Upload Handler simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'bannerUrl' | 'mobileBannerUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
        showToast(`Image uploaded for ${field}`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter categories
  const filteredCategories = safeCategories.filter((cat) => {
    if (!cat) return false;
    const nameEn = cat.nameEn || '';
    const nameMr = cat.nameMr || '';
    const slug = cat.slug || '';
    const term = (searchTerm || '').toLowerCase();

    const matchesSearch = 
      nameEn.toLowerCase().includes(term) ||
      nameMr.toLowerCase().includes(term) ||
      slug.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return Boolean(cat.isActive);
    if (statusFilter === 'hidden') return !cat.isActive;
    if (statusFilter === 'featured') return Boolean(cat.isFeatured);

    return true;
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-black text-2xl text-white font-marathi flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#F4B400]" />
              <span>{language === 'mr' ? 'श्रेणी व्यवस्थापन प्रणाली' : 'Category Management System'}</span>
            </h2>
            <span className="bg-[#F4B400]/20 text-[#F4B400] font-mono text-xs font-bold px-2.5 py-1 rounded-full border border-[#F4B400]/40">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage storefront categories, subcategories, custom banners, display order, featured status, and colors.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-xs px-5 py-3 rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{language === 'mr' ? '+ नवीन श्रेणी जोडा' : '+ Add New Category'}</span>
        </button>
      </div>

      {/* Category Stats Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Active Categories</p>
            <p className="text-lg font-black text-white">{categories.filter(c => c.isActive).length}</p>
          </div>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Featured Categories</p>
            <p className="text-lg font-black text-white">{categories.filter(c => c.isFeatured).length}</p>
          </div>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Categorized Products</p>
            <p className="text-lg font-black text-white">{products.length}</p>
          </div>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">Subcategories</p>
            <p className="text-lg font-black text-white">{categories.filter(c => c.parentId).length}</p>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Toggle Bar */}
      <div className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories by name, slug..."
            className="w-full bg-[#111111] text-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'active', 'hidden', 'featured'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-[#F4B400] text-[#111111]'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}

          {/* View Toggle */}
          <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-zinc-800 ml-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-zinc-800 text-[#F4B400]' : 'text-zinc-500 hover:text-white'
              }`}
              title="Grid View"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-zinc-800 text-[#F4B400]' : 'text-zinc-500 hover:text-white'
              }`}
              title="Table View"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY LIST: GRID VIEW */}
      {viewMode === 'grid' && (
        sortedCategories.length === 0 ? (
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 col-span-full">
            <Folder className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#F4B400]" />
            <p className="font-bold text-base text-white">No categories added yet</p>
            <p className="text-xs text-zinc-400 mt-1">Click "Add New Category" to create your first product category in Supabase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedCategories.map((cat, index) => {
            const stats = getCategoryStats(cat.id);
            const parentCat = cat.parentId ? categories.find((c) => c.id === cat.parentId) : null;

            return (
              <div
                key={cat.id}
                className={`bg-[#161616] border rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:border-zinc-600 flex flex-col justify-between ${
                  !cat.isActive ? 'border-zinc-800 opacity-70 bg-zinc-950' : 'border-zinc-800'
                }`}
              >
                <div>
                  {/* Banner & Image Overlay */}
                  <div className="relative h-36 bg-zinc-900 overflow-hidden group">
                    <img
                      src={cat.bannerUrl || cat.imageUrl}
                      alt={cat.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-black/40 to-transparent" />

                    {/* Order Controls */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        className="text-zinc-300 hover:text-[#F4B400] disabled:opacity-30 disabled:hover:text-zinc-300 p-0.5"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-[#F4B400]">#{cat.displayOrder || index + 1}</span>
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === sortedCategories.length - 1}
                        className="text-zinc-300 hover:text-[#F4B400] disabled:opacity-30 disabled:hover:text-zinc-300 p-0.5"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {cat.isFeatured && (
                        <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <Star className="w-3 h-3 fill-black" />
                          <span>Featured</span>
                        </span>
                      )}

                      <button
                        onClick={() => toggleCategoryStatus(cat.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-1 transition-all ${
                          cat.isActive 
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50' 
                            : 'bg-zinc-900/90 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {cat.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{cat.isActive ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </div>

                    {/* Thumbnail Avatar */}
                    <div className="absolute -bottom-4 left-4 w-14 h-14 rounded-2xl border-2 border-[#161616] overflow-hidden shadow-2xl bg-zinc-800 shrink-0">
                      <img src={cat.imageUrl} alt={cat.nameEn} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 pt-6 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        {parentCat && (
                          <span className="text-[10px] uppercase font-bold text-[#F4B400] tracking-wider block">
                            Subcategory of {parentCat.nameEn}
                          </span>
                        )}
                        <h3 className="font-extrabold text-white text-base font-marathi leading-snug">
                          {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                          {cat.nameEn}
                        </h3>
                        <p className="text-xs text-zinc-400 font-marathi">{cat.nameMr}</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {cat.descriptionEn || 'No description added for this category.'}
                    </p>

                    {/* Analytics Grid */}
                    <div className="bg-[#111111] p-3 rounded-2xl border border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Products</p>
                        <p className="font-bold text-white mt-0.5">{stats.productCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Orders</p>
                        <p className="font-bold text-emerald-400 mt-0.5">{stats.totalOrdersCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Revenue</p>
                        <p className="font-bold text-[#F4B400] mt-0.5">₹{stats.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 border-t border-zinc-800/80 bg-[#111111]/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Toggle Featured */}
                    <button
                      onClick={() => toggleCategoryFeatured(cat.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                        cat.isFeatured 
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/50' 
                          : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                      }`}
                      title={cat.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                    >
                      <Star className={`w-3.5 h-3.5 ${cat.isFeatured ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* View Products */}
                    <button
                      onClick={() => setViewProductsCat(cat)}
                      className="p-2 rounded-xl text-xs font-bold bg-zinc-800/60 text-zinc-300 hover:text-white flex items-center gap-1"
                      title="Manage Category Products"
                    >
                      <Package className="w-3.5 h-3.5 text-[#F4B400]" />
                      <span className="text-[11px] font-mono">{stats.productCount}</span>
                    </button>

                    {/* Live Preview */}
                    <button
                      onClick={() => setPreviewCat(cat)}
                      className="p-2 rounded-xl text-xs font-bold bg-zinc-800/60 text-zinc-300 hover:text-white"
                      title="Preview Storefront Category Page"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#F4B400]" />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setDeleteCategoryTarget(cat);
                        setDeleteOption('move');
                        // default target category excluding target
                        const otherCat = categories.find((c) => c.id !== cat.id);
                        setReassignCatId(otherCat ? otherCat.id : '');
                      }}
                      className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/60 p-2 rounded-xl text-xs font-bold transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      )}

      {/* CATEGORY LIST: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#111111] text-zinc-400 uppercase font-bold text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">Revenue</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sortedCategories.map((cat, index) => {
                  const stats = getCategoryStats(cat.id);
                  return (
                    <tr key={cat.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#F4B400]">
                        #{cat.displayOrder || index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={cat.imageUrl} alt={cat.nameEn} className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shrink-0" />
                          <div>
                            <p className="font-extrabold text-white text-xs">{cat.nameEn}</p>
                            <p className="text-[11px] text-zinc-400">{cat.nameMr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">/{cat.slug}</td>
                      <td className="py-3 px-4 font-bold text-white">{stats.productCount}</td>
                      <td className="py-3 px-4 font-bold text-[#F4B400]">₹{stats.totalRevenue.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleCategoryStatus(cat.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cat.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {cat.isActive ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleCategoryFeatured(cat.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            cat.isFeatured ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {cat.isFeatured ? '⭐ Yes' : 'No'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewProductsCat(cat)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
                            title="View Products"
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteCategoryTarget(cat);
                              setDeleteOption('move');
                              const otherCat = categories.find((c) => c.id !== cat.id);
                              setReassignCatId(otherCat ? otherCat.id : '');
                            }}
                            className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg text-xs"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#111111]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F4B400]/20 border border-[#F4B400]/40 flex items-center justify-center text-[#F4B400]">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg font-marathi">
                    {editingCategory ? `Edit Category: ${editingCategory.nameEn}` : 'Create New Category'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Configure name, banners, subcategories, colors, display order, and SEO metadata.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs inside Form */}
            <div className="flex items-center border-b border-zinc-800 bg-[#111111]/80 px-6 gap-2 overflow-x-auto">
              {[
                { id: 'basic', label: '1. Basic Info', icon: Folder },
                { id: 'images', label: '2. Images & Banners', icon: ImageIcon },
                { id: 'style', label: '3. Branding & Colors', icon: Palette },
                { id: 'seo', label: '4. SEO Metadata', icon: Globe },
                { id: 'status', label: '5. Visibility & Order', icon: Layers },
              ].map((tab) => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeFormTab === tab.id
                        ? 'border-[#F4B400] text-[#F4B400]'
                        : 'border-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* TAB 1: BASIC INFORMATION */}
              {activeFormTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Category Name (English) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nameEn || ''}
                        onChange={(e) => handleNameChange(e.target.value, 'en')}
                        placeholder="e.g., Dadanche Special Masale"
                        className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Category Name (Marathi / मराठी)
                      </label>
                      <input
                        type="text"
                        value={formData.nameMr || ''}
                        onChange={(e) => handleNameChange(e.target.value, 'mr')}
                        placeholder="उदा. दादांचे स्पेशल मसाले"
                        className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] font-marathi"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        URL Slug
                      </label>
                      <div className="flex items-center">
                        <span className="bg-zinc-800 text-zinc-400 text-xs px-2.5 py-3 rounded-l-xl border border-r-0 border-zinc-700 font-mono">
                          /category/
                        </span>
                        <input
                          type="text"
                          required
                          value={formData.slug || ''}
                          onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                          placeholder="special-masale"
                          className="w-full bg-[#111111] text-white text-xs p-3 rounded-r-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">
                        Parent Category (Subcategory Hierarchy)
                      </label>
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value || null }))}
                        className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                      >
                        <option value="">None (Top Level Root Category)</option>
                        {categories
                          .filter((c) => c.id !== editingCategory?.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              📁 Subcategory of: {c.nameEn}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Description (English)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.descriptionEn || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                      placeholder="Authentic Maharashtrian masalas made with carefully selected spices."
                      className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Description (Marathi / मराठी वर्णन)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.descriptionMr || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, descriptionMr: e.target.value }))}
                      placeholder="पारंपारिक मसाल्यांपासून बनवलेले अस्सल सुगंधी मसाले."
                      className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] font-marathi"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGES & BANNERS */}
              {activeFormTab === 'images' && (
                <div className="space-y-6">
                  {/* Category Card Image */}
                  <div className="bg-[#111111] p-4 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">Category Card Image (Square / Grid Preview)</p>
                        <p className="text-[11px] text-zinc-400">Recommended size: 800 x 800px (JPG, PNG, WEBP)</p>
                      </div>
                      <label className="bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'imageUrl')} />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="Or enter Image URL"
                      className="w-full bg-[#161616] text-white text-xs p-2.5 rounded-xl border border-zinc-700 focus:outline-none"
                    />

                    {formData.imageUrl && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Desktop Banner */}
                  <div className="bg-[#111111] p-4 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">Desktop Category Banner</p>
                        <p className="text-[11px] text-zinc-400">Wide hero header banner (1600 x 600px)</p>
                      </div>
                      <label className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Banner</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'bannerUrl')} />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={formData.bannerUrl || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                      placeholder="Or enter Banner URL"
                      className="w-full bg-[#161616] text-white text-xs p-2.5 rounded-xl border border-zinc-700 focus:outline-none"
                    />

                    {formData.bannerUrl && (
                      <div className="h-28 rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
                        <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Mobile Banner */}
                  <div className="bg-[#111111] p-4 rounded-2xl border border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-white">Mobile Category Banner (Optional)</p>
                        <p className="text-[11px] text-zinc-400">Aspect ratio optimized for mobile screens (800 x 600px)</p>
                      </div>
                      <label className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Mobile Banner</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'mobileBannerUrl')} />
                      </label>
                    </div>

                    <input
                      type="text"
                      value={formData.mobileBannerUrl || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, mobileBannerUrl: e.target.value }))}
                      placeholder="Enter Mobile Banner URL (Optional)"
                      className="w-full bg-[#161616] text-white text-xs p-2.5 rounded-xl border border-zinc-700 focus:outline-none"
                    />
                  </div>

                  {/* Category Icon */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Category Icon / Emoji</label>
                    <input
                      type="text"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                      placeholder="e.g. 🔥 or 🍲 or 🧂"
                      className="w-28 bg-[#111111] text-white text-base text-center p-2.5 rounded-xl border border-zinc-700 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: BRANDING & COLORS */}
              {activeFormTab === 'style' && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400">
                    Customize background, text, and accent colors for this category's special promo cards.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Background Color</label>
                      <input
                        type="color"
                        value={formData.backgroundColor || '#161616'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-full h-10 rounded-xl bg-transparent border border-zinc-700 cursor-pointer p-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Text Color</label>
                      <input
                        type="color"
                        value={formData.textColor || '#FFFFFF'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, textColor: e.target.value }))}
                        className="w-full h-10 rounded-xl bg-transparent border border-zinc-700 cursor-pointer p-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Accent Color</label>
                      <input
                        type="color"
                        value={formData.accentColor || '#F4B400'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accentColor: e.target.value }))}
                        className="w-full h-10 rounded-xl bg-transparent border border-zinc-700 cursor-pointer p-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-300 block mb-1">Button Color</label>
                      <input
                        type="color"
                        value={formData.buttonColor || '#F4B400'}
                        onChange={(e) => setFormData((prev) => ({ ...prev, buttonColor: e.target.value }))}
                        className="w-full h-10 rounded-xl bg-transparent border border-zinc-700 cursor-pointer p-1"
                      />
                    </div>
                  </div>

                  {/* Live Style Preview Card */}
                  <div className="mt-4 p-5 rounded-2xl border border-zinc-700 space-y-2 shadow-2xl" style={{ backgroundColor: formData.backgroundColor || '#161616', color: formData.textColor || '#FFFFFF' }}>
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Live Card Style Preview</span>
                    <h4 className="font-extrabold text-lg flex items-center gap-2">
                      <span>{formData.icon || '🏷️'}</span>
                      <span>{formData.nameEn || 'Category Name'}</span>
                    </h4>
                    <p className="text-xs opacity-80">{formData.descriptionEn || 'Category description will appear here...'}</p>
                    <button className="px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ backgroundColor: formData.buttonColor || '#F4B400' }}>
                      Shop Now
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: SEO METADATA */}
              {activeFormTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="e.g. Dadanche Special Masale - Authentic Maharashtrian Spices"
                      className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">SEO Description</label>
                    <textarea
                      rows={3}
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="e.g. Buy authentic Maharashtrian Kala Masala, Goda Masala online directly from Dadacha Dhaba."
                      className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">SEO Keywords (Comma separated)</label>
                    <input
                      type="text"
                      value={formData.seoKeywords || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seoKeywords: e.target.value }))}
                      placeholder="kala masala, goda masala, maharashtrian spices, dadacha dhaba"
                      className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: VISIBILITY & ORDER */}
              {activeFormTab === 'status' && (
                <div className="space-y-4">
                  <div className="bg-[#111111] p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Category Visibility Status</p>
                      <p className="text-[11px] text-zinc-400">If hidden, category will be removed from navigation & homepage, but products remain safe.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formData.isActive ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {formData.isActive ? '✅ Visible' : '🙈 Hidden'}
                    </button>
                  </div>

                  <div className="bg-[#111111] p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Featured Category on Homepage</p>
                      <p className="text-[11px] text-zinc-400">Show this category in the Homepage "Featured Categories" highlight section.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formData.isFeatured ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {formData.isFeatured ? '⭐ Featured' : 'Standard'}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Display Order Priority (Numeric)</label>
                    <input
                      type="number"
                      value={formData.displayOrder || 1}
                      onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                      className="w-32 bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {activeFormTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'images') setActiveFormTab('basic');
                        if (activeFormTab === 'style') setActiveFormTab('images');
                        if (activeFormTab === 'seo') setActiveFormTab('style');
                        if (activeFormTab === 'status') setActiveFormTab('seo');
                      }}
                      className="bg-zinc-800 text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-zinc-700"
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-zinc-800 text-zinc-300 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-zinc-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-xs px-6 py-2.5 rounded-xl hover:scale-105 transition-all shadow-xl flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingCategory ? 'Save Changes' : 'Publish Category'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Delete Category?</h3>
                <p className="text-xs text-zinc-400">{deleteCategoryTarget.nameEn}</p>
              </div>
            </div>

            {/* Product count notice */}
            {(() => {
              const catProducts = getCategoryProducts(deleteCategoryTarget, products);
              const count = catProducts.length;

              return (
                <div className="space-y-4">
                  <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-2xl text-xs text-amber-200">
                    <p className="font-bold">⚠️ Notice: This category contains {count} products.</p>
                    <p className="text-[11px] mt-1 text-amber-300/80">Please select what to do with the products inside this category before deleting.</p>
                  </div>

                  {count > 0 && (
                    <div className="space-y-2 text-xs">
                      <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${deleteOption === 'move' ? 'bg-[#111111] border-[#F4B400]' : 'border-zinc-800 bg-[#161616]'}`}>
                        <input
                          type="radio"
                          name="deleteOpt"
                          checked={deleteOption === 'move'}
                          onChange={() => setDeleteOption('move')}
                          className="mt-0.5 accent-[#F4B400]"
                        />
                        <div>
                          <p className="font-bold text-white">Option 1: Move products to another category</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Safely reassign all {count} products to a new home category.</p>
                          {deleteOption === 'move' && (
                            <select
                              value={reassignCatId}
                              onChange={(e) => setReassignCatId(e.target.value)}
                              className="mt-2.5 w-full bg-[#161616] text-white text-xs p-2 rounded-xl border border-zinc-700"
                            >
                              {categories
                                .filter((c) => c.id !== deleteCategoryTarget.id)
                                .map((c) => (
                                   <option key={c.id} value={c.id}>
                                     Move to: {c.nameEn}
                                   </option>
                                 ))}
                            </select>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${deleteOption === 'delete' ? 'bg-red-950/20 border-red-800/60' : 'border-zinc-800 bg-[#161616]'}`}>
                        <input
                          type="radio"
                          name="deleteOpt"
                          checked={deleteOption === 'delete'}
                          onChange={() => setDeleteOption('delete')}
                          className="mt-0.5 accent-red-500"
                        />
                        <div>
                          <p className="font-bold text-red-400">Option 2: Delete category AND its {count} products</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Permanently remove this category and all products assigned to it.</p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setDeleteCategoryTarget(null)}
                      className="w-1/2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="w-1/2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-lg"
                    >
                      Confirm Permanent Delete
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CATEGORY PRODUCTS MODAL */}
      {viewProductsCat && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#F4B400]" />
                  <span>Category Products: {viewProductsCat.nameEn}</span>
                </h3>
                <p className="text-xs text-zinc-400">Products currently listed inside this category</p>
              </div>

              <button
                onClick={() => setViewProductsCat(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center hover:bg-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {getCategoryProducts(viewProductsCat, products).map((prod) => (
                <div key={prod.id} className="bg-[#111111] p-3 rounded-2xl border border-zinc-800 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <img src={prod.images[0]} alt={prod.nameEn} className="w-10 h-10 rounded-xl object-cover border border-zinc-800" />
                    <div>
                      <p className="font-extrabold text-white text-xs">{prod.nameEn}</p>
                      <p className="text-[11px] text-[#F4B400] font-bold">₹{prod.price} • Stock: {prod.stock}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setViewProductsCat(null);
                      navigateTo('shop');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-xl"
                  >
                    View Product
                  </button>
                </div>
              ))}

              {getCategoryProducts(viewProductsCat, products).length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  No products assigned to this category yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY PREVIEW MODAL */}
      {previewCat && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/40">
                  👁 Live Storefront Category Page Preview
                </span>
                <span className="text-xs text-zinc-400 font-mono">/category/{previewCat.slug}</span>
              </div>
              <button onClick={() => setPreviewCat(null)} className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Category Hero Banner */}
              <div className="relative h-48 rounded-3xl overflow-hidden border border-zinc-800">
                <img src={previewCat.bannerUrl || previewCat.imageUrl} alt={previewCat.nameEn} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex items-end p-6">
                  <div>
                    <h1 className="font-black text-2xl text-white font-marathi">{previewCat.nameEn}</h1>
                    <p className="text-xs text-zinc-300 mt-1 max-w-lg">{previewCat.descriptionEn}</p>
                  </div>
                </div>
              </div>

              {/* Sample Products Grid */}
              <div>
                <h4 className="font-extrabold text-white text-sm mb-3">Products in this Category</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getCategoryProducts(previewCat, products).map((p) => (
                    <div key={p.id} className="bg-[#161616] p-3 rounded-2xl border border-zinc-800">
                      <img src={p.images[0]} alt={p.nameEn} className="w-full h-24 object-cover rounded-xl mb-2" />
                      <p className="font-bold text-white text-xs truncate">{p.nameEn}</p>
                      <p className="text-[#F4B400] font-black text-xs mt-1">₹{p.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
