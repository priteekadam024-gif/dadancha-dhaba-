import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { findMatchingImages } from '../utils/imageSearch';
import { 
  Plus, Edit, Trash2, Eye, Search, Filter, ArrowUpDown, 
  Upload, X, Check, Sparkles, Image as ImageIcon, Download, 
  CheckSquare, Square, AlertCircle, Tag, Package, Layers, 
  RotateCcw, ChevronLeft, ChevronRight, Star, Flame, Grid, List
} from 'lucide-react';

export const AdminProductManager: React.FC = () => {
  const { 
    language, products, categories, addProduct, updateProduct, 
    deleteProduct, showToast 
  } = useApp();

  // Search, Filter, Sort & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock' | 'featured' | 'trending'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'stock' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Bulk Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkStock, setBulkStock] = useState<number | ''>('');
  const [bulkStatus, setBulkStatus] = useState<'' | 'featured' | 'trending' | 'active'>('');

  // Modals State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Form Fields State
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameMr, setFormNameMr] = useState('');
  const [formCategory, setFormCategory] = useState('spices');
  const [formPrice, setFormPrice] = useState(250);
  const [formOriginalPrice, setFormOriginalPrice] = useState(300);
  const [formStock, setFormStock] = useState(50);
  const [formSku, setFormSku] = useState('');
  const [formWeight, setFormWeight] = useState('250g');
  const [formBrand, setFormBrand] = useState('Dadacha Dhaba');
  const [formDescEn, setFormDescEn] = useState('');
  const [formDescMr, setFormDescMr] = useState('');
  const [formIngredientsEn, setFormIngredientsEn] = useState('');
  const [formIngredientsMr, setFormIngredientsMr] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsTrending, setFormIsTrending] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameMr.includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'active') matchesStock = p.stock > 0;
    else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 20;
    else if (stockFilter === 'out_of_stock') matchesStock = p.stock <= 0;
    else if (stockFilter === 'featured') matchesStock = !!p.isFeatured;
    else if (stockFilter === 'trending') matchesStock = !!p.isTrending;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sort Products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'stock') return a.stock - b.stock;
    if (sortBy === 'name') return a.nameEn.localeCompare(b.nameEn);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedProductIds.length === paginatedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Form for Adding
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormNameEn('');
    setFormNameMr('');
    setFormCategory(categories[0]?.id || 'spices');
    setFormPrice(220);
    setFormOriginalPrice(280);
    setFormStock(50);
    setFormSku(`DD-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormWeight('250g');
    setFormBrand('Dadacha Dhaba');
    setFormDescEn('Authentic traditional recipe handcrafted in Kolhapur.');
    setFormDescMr('कोल्हापुरी परंपरेनुसार बनवलेला अस्सल गावरान मसाला.');
    setFormIngredientsEn('Red chilli, coriander, cumin, garlic, sesame, dry coconut, spices.');
    setFormIngredientsMr('मिरची, धने, जिरे, लसूण, तीळ, सुके खोबरे, खडा मसाला.');
    setFormIsFeatured(true);
    setFormIsTrending(false);
    setFormImages([
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800'
    ]);
    setShowFormModal(true);
  };

  // Open Form for Editing
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormNameEn(product.nameEn);
    setFormNameMr(product.nameMr);
    setFormCategory(product.categoryId);
    setFormPrice(product.price);
    setFormOriginalPrice(product.originalPrice || Math.round(product.price * 1.25));
    setFormStock(product.stock);
    setFormSku(product.sku || `DD-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormWeight(product.weight);
    setFormBrand(product.brand || 'Dadacha Dhaba');
    setFormDescEn(product.descriptionEn);
    setFormDescMr(product.descriptionMr);
    setFormIngredientsEn(product.ingredientsEn);
    setFormIngredientsMr(product.ingredientsMr);
    setFormIsFeatured(!!product.isFeatured);
    setFormIsTrending(!!product.isTrending);
    setFormImages(product.images.length > 0 ? [...product.images] : ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800']);
    setShowFormModal(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameEn.trim()) {
      showToast('Product name in English is required', 'error');
      return;
    }
    if (formImages.length === 0) {
      showToast('Please add at least one product image', 'error');
      return;
    }

    const categoryObj = categories.find((c) => c.id === formCategory);
    const categoryName = categoryObj ? categoryObj.nameEn : formCategory.toUpperCase();
    const discountPercent = formOriginalPrice > formPrice 
      ? Math.round(((formOriginalPrice - formPrice) / formOriginalPrice) * 100) 
      : 0;

    const productPayload: Omit<Product, 'id' | 'createdAt'> = {
      nameEn: formNameEn,
      nameMr: formNameMr || formNameEn,
      slug: formNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: formCategory,
      categoryName,
      price: Number(formPrice),
      originalPrice: Number(formOriginalPrice),
      discountPercent,
      stock: Number(formStock),
      sku: formSku || `DD-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      weight: formWeight,
      brand: formBrand,
      descriptionEn: formDescEn,
      descriptionMr: formDescMr || formDescEn,
      ingredientsEn: formIngredientsEn,
      ingredientsMr: formIngredientsMr || formIngredientsEn,
      ratings: editingProduct ? editingProduct.ratings : 5.0,
      reviewCount: editingProduct ? editingProduct.reviewCount : 1,
      images: formImages,
      isFeatured: formIsFeatured,
      isTrending: formIsTrending,
      isBestSeller: editingProduct ? editingProduct.isBestSeller : false,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    setShowFormModal(false);
  };

  // Delete Single Product
  const handleConfirmDeleteSingle = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    setSelectedProductIds((prev) => prev.filter((id) => id !== deletingProduct.id));
    setDeletingProduct(null);
  };

  // Delete Bulk Products
  const handleConfirmBulkDelete = () => {
    selectedProductIds.forEach((id) => deleteProduct(id));
    setSelectedProductIds([]);
    setShowBulkDeleteConfirm(false);
    showToast(`${selectedProductIds.length} products deleted successfully!`);
  };

  // Bulk Apply Changes
  const handleApplyBulkEdit = () => {
    selectedProductIds.forEach((id) => {
      const updates: Partial<Product> = {};
      if (bulkCategory) updates.categoryId = bulkCategory;
      if (bulkStock !== '') updates.stock = Number(bulkStock);
      if (bulkStatus === 'featured') updates.isFeatured = true;
      if (bulkStatus === 'trending') updates.isTrending = true;
      updateProduct(id, updates);
    });
    setShowBulkEditModal(false);
    setSelectedProductIds([]);
    showToast(`Updated ${selectedProductIds.length} products!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedProductIds.length > 0 
      ? products.filter((p) => selectedProductIds.includes(p.id)) 
      : products;

    const headers = ['ID', 'SKU', 'Name (EN)', 'Name (MR)', 'Category', 'Price (INR)', 'Original Price', 'Stock', 'Weight', 'Date Added'];
    const rows = listToExport.map((p) => [
      p.id,
      p.sku,
      `"${p.nameEn.replace(/"/g, '""')}"`,
      `"${p.nameMr.replace(/"/g, '""')}"`,
      p.categoryName,
      p.price,
      p.originalPrice,
      p.stock,
      p.weight,
      p.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dadacha_dhaba_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Product catalog CSV exported!');
  };

  // Image Upload Handler with Validation
  const processFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast(`File ${file.name} exceeds 10MB limit`, 'error');
        return;
      }
      // Validate image format
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast(`File ${file.name} is not a valid format (JPG, PNG, WEBP allowed)`, 'error');
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    setUploadProgress(20);
    const readers = validFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((dataUrls) => {
      setUploadProgress(100);
      setFormImages((prev) => [...prev, ...dataUrls]);
      setTimeout(() => setUploadProgress(null), 600);
      showToast(`${validFiles.length} image(s) processed successfully!`);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetFeaturedImage = (index: number) => {
    setFormImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.unshift(moved);
      return copy;
    });
    showToast('Selected image set as cover photo');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141414] border border-zinc-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-[#F4B400]" />
            <h2 className="text-2xl font-black text-white font-marathi">
              उत्पादन व्यवस्थापन सूची (Product Inventory Management)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Total {products.length} products live in catalog. Add, edit, manage stock & upload high-res images directly.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="bg-[#222222] hover:bg-zinc-700 text-zinc-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition-colors flex items-center gap-2"
            title="Export catalog as CSV"
          >
            <Download className="w-4 h-4 text-[#F4B400]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-xs px-5 py-2.5 rounded-xl hover:scale-[1.02] transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Bulk Operations Toolbar */}
      <div className="bg-[#161616] border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#111111] text-zinc-200 text-xs px-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn} ({c.nameMr})
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-[#111111] text-zinc-200 text-xs px-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
          >
            <option value="all">All Stock Status</option>
            <option value="active">In Stock (&gt; 0)</option>
            <option value="low_stock">Low Stock (≤ 20)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
            <option value="featured">Featured Items</option>
            <option value="trending">Trending Items</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#111111] text-zinc-200 text-xs px-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price_low">Sort: Price Low to High</option>
            <option value="price_high">Sort: Price High to Low</option>
            <option value="stock">Sort: Stock Quantity</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>

        {/* Action Controls & Bulk Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-semibold"
            >
              {selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#F4B400]" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
              <span>Select Page ({paginatedProducts.length})</span>
            </button>

            {selectedProductIds.length > 0 && (
              <span className="bg-[#F4B400]/20 text-[#F4B400] text-[11px] font-bold px-3 py-1 rounded-full border border-[#F4B400]/40">
                {selectedProductIds.length} Selected
              </span>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedProductIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-800 transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bulk Modify</span>
              </button>

              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs px-3 py-1.5 rounded-xl border border-rose-800 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedProductIds.length})</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">View Mode:</span>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg border transition-all ${
                  viewMode === 'table' ? 'bg-[#F4B400] text-[#111111] border-[#F4B400]' : 'bg-[#111111] text-zinc-400 border-zinc-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg border transition-all ${
                  viewMode === 'grid' ? 'bg-[#F4B400] text-[#111111] border-[#F4B400]' : 'bg-[#111111] text-zinc-400 border-zinc-800'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRODUCTS TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#111111] border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded accent-[#F4B400]"
                    />
                  </th>
                  <th className="py-4 px-4">Product Details</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price & Discount</th>
                  <th className="py-4 px-4">Stock Status</th>
                  <th className="py-4 px-4">SKU & Badges</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-bold text-sm">No products found</p>
                      <p className="text-xs">Try clearing your search or filter queries.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    const isLowStock = p.stock > 0 && p.stock <= 20;
                    const isOutOfStock = p.stock <= 0;

                    return (
                      <tr key={p.id} className={`hover:bg-zinc-900/60 transition-colors ${isSelected ? 'bg-[#F4B400]/5' : ''}`}>
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(p.id)}
                            className="rounded accent-[#F4B400]"
                          />
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200'}
                              alt={p.nameEn}
                              className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0 bg-zinc-900"
                            />
                            <div>
                              <span className="font-bold text-white block text-sm font-marathi">{p.nameMr}</span>
                              <span className="text-zinc-400 text-xs block">{p.nameEn}</span>
                              <span className="text-zinc-500 text-[10px]">{p.weight}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="bg-zinc-800/80 text-zinc-300 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                            {p.categoryName || p.categoryId}
                          </span>
                        </td>

                        <td className="py-4 px-4 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[#F4B400] text-sm">₹{p.price}</span>
                            {p.originalPrice > p.price && (
                              <span className="text-zinc-500 line-through text-[11px]">₹{p.originalPrice}</span>
                            )}
                          </div>
                          {p.discountPercent > 0 && (
                            <span className="text-emerald-400 font-bold text-[10px] block">
                              {p.discountPercent}% Off
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block border ${
                              isOutOfStock 
                                ? 'bg-rose-950 text-rose-400 border-rose-800' 
                                : isLowStock 
                                ? 'bg-amber-950 text-amber-400 border-amber-800' 
                                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            }`}>
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${p.stock})` : `In Stock (${p.stock})`}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 space-y-1">
                          <span className="font-mono text-[10px] text-zinc-400 block">{p.sku}</span>
                          <div className="flex gap-1 flex-wrap">
                            {p.isFeatured && (
                              <span className="bg-amber-400/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                                Featured
                              </span>
                            )}
                            {p.isTrending && (
                              <span className="bg-rose-500/10 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-500/30">
                                Trending
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewProduct(p)}
                              className="p-2 bg-zinc-800 hover:bg-[#F4B400] hover:text-[#111111] text-zinc-300 rounded-xl transition-all"
                              title="Live Storefront Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 rounded-xl transition-all"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="p-2 bg-rose-950/60 hover:bg-rose-800 text-rose-400 hover:text-white rounded-xl transition-all"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#111111] border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span>
                Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({sortedProducts.length} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedProducts.map((p) => (
            <div key={p.id} className="bg-[#161616] border border-zinc-800 rounded-3xl p-4 space-y-3 flex flex-col justify-between shadow-xl">
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                  <img src={p.images[0]} alt={p.nameEn} className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-black/80 text-[#F4B400] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#F4B400]/40">
                    ₹{p.price}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base font-marathi">{p.nameMr}</h4>
                  <p className="text-xs text-zinc-400">{p.nameEn}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{p.sku} | Stock: {p.stock}</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                <button onClick={() => setPreviewProduct(p)} className="text-xs text-[#F4B400] hover:underline flex items-center gap-1 font-bold">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEditModal(p)} className="text-xs text-amber-400 hover:underline font-bold">
                    Edit
                  </button>
                  <button onClick={() => setDeletingProduct(p)} className="text-xs text-rose-400 hover:underline font-bold">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#F4B400]/80 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F4B400]" />
                <h3 className="text-xl font-bold text-white font-marathi">
                  {editingProduct ? 'उत्पादनात बदल करा (Edit Product)' : 'नवीन उत्पादन जोडा (Add New Product)'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Product Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Product Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolhapuri Kanda Lasun Masala"
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">उत्पादनाचे नाव (मराठी) *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. कोल्हापुरी कांदा लसूण मसाला"
                    value={formNameMr}
                    onChange={(e) => setFormNameMr(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-marathi focus:outline-none focus:border-[#F4B400]"
                  />
                </div>
              </div>

              {/* Category, SKU, Weight & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameEn} ({c.nameMr})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Weight / Pack</label>
                  <input
                    type="text"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    placeholder="e.g. 500g"
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>
              </div>

              {/* Price, Original Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] text-[#F4B400] font-black text-sm p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Original MRP Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] text-zinc-400 text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>
              </div>

              {/* Descriptions & Ingredients */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">वर्णन (मराठी)</label>
                  <textarea
                    rows={2}
                    value={formDescMr}
                    onChange={(e) => setFormDescMr(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-marathi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Ingredients (English)</label>
                  <input
                    type="text"
                    value={formIngredientsEn}
                    onChange={(e) => setFormIngredientsEn(e.target.value)}
                    placeholder="Chilli, Cumin, Clove..."
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">सामग्री (मराठी)</label>
                  <input
                    type="text"
                    value={formIngredientsMr}
                    onChange={(e) => setFormIngredientsMr(e.target.value)}
                    placeholder="मिरची, धने, जिरे, लवंग..."
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-marathi"
                  />
                </div>
              </div>

              {/* Product Badges Checkboxes */}
              <div className="flex items-center gap-6 bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-200">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="rounded accent-[#F4B400] w-4 h-4"
                  />
                  <Star className="w-4 h-4 text-[#F4B400]" />
                  <span>Featured Product (मुख्य पृष्ठावर दाखवा)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-200">
                  <input
                    type="checkbox"
                    checked={formIsTrending}
                    onChange={(e) => setFormIsTrending(e.target.checked)}
                    className="rounded accent-[#F4B400] w-4 h-4"
                  />
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Trending Product (ट्रेंडिंग मध्ये जोडा)</span>
                </label>
              </div>

              {/* IMAGE UPLOADER & MULTI-IMAGE GALLERY */}
              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#F4B400]" />
                    <span>Product Images & Uploads ({formImages.length})</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      const matches = findMatchingImages(formNameEn || formNameMr);
                      if (matches.length > 0) {
                        setFormImages((prev) => Array.from(new Set([...prev, ...matches])));
                        showToast('Suggested HD images added!');
                      }
                    }}
                    className="text-[11px] bg-[#F4B400]/10 text-[#F4B400] hover:bg-[#F4B400] hover:text-[#111111] px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Suggest HD Photos</span>
                  </button>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging ? 'border-[#F4B400] bg-[#F4B400]/10 scale-[1.01]' : 'border-zinc-700 bg-[#1A1A1A] hover:border-[#F4B400]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-[#F4B400] mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-white">Drag & drop files here, or click to upload from device</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Supports JPG, PNG, WEBP (Max 10MB per image)</p>
                </div>

                {uploadProgress !== null && (
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#F4B400] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                {/* Images Preview list */}
                {formImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-zinc-700 group bg-black">
                        <img src={img} alt={`prod-${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#F4B400] text-[#111111] text-[9px] font-black px-1.5 py-0.5 rounded">
                            COVER
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetFeaturedImage(idx)}
                              className="bg-amber-500 text-black text-[10px] font-bold p-1 rounded"
                              title="Set as Cover Image"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="bg-rose-600 text-white p-1 rounded"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="w-1/2 bg-[#222222] hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-3.5 rounded-2xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-xs py-3.5 rounded-2xl hover:scale-[1.01] transition-all shadow-xl"
                >
                  {editingProduct ? 'Save Product Changes' : 'Publish Product to Storefront'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-rose-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Delete Product Permanently?</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to delete <strong className="text-white">{deletingProduct.nameEn}</strong>? This action cannot be undone and will remove it instantly from the storefront.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="w-1/2 bg-zinc-800 text-zinc-300 text-xs font-bold py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSingle}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-rose-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Delete {selectedProductIds.length} Products?</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to permanently delete these selected products?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="w-1/2 bg-zinc-800 text-zinc-300 text-xs font-bold py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl"
              >
                Delete All Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK EDIT MODAL */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#F4B400] rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Bulk Update ({selectedProductIds.length} items)</h3>
            
            <div>
              <label className="text-xs text-zinc-300 font-bold block mb-1">Set Category</label>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
              >
                <option value="">Keep Existing Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameEn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-300 font-bold block mb-1">Set Stock Quantity</label>
              <input
                type="number"
                placeholder="Leave blank to keep current stock"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-300 font-bold block mb-1">Set Featured / Trending Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as any)}
                className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
              >
                <option value="">No change</option>
                <option value="featured">Mark as Featured</option>
                <option value="trending">Mark as Trending</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="w-1/2 bg-zinc-800 text-zinc-300 text-xs font-bold py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBulkEdit}
                className="w-1/2 bg-[#F4B400] text-[#111111] text-xs font-bold py-3 rounded-xl"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOREFRONT LIVE PREVIEW MODAL */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] border border-[#F4B400]/60 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <span className="text-[10px] bg-[#F4B400] text-[#111111] font-black px-2.5 py-0.5 rounded uppercase">
                👁️ Live Storefront Preview
              </span>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-square rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900">
                <img src={previewProduct.images[0]} alt={previewProduct.nameEn} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">{previewProduct.categoryName}</span>
                <h3 className="text-xl font-bold text-white font-marathi">{previewProduct.nameMr}</h3>
                <p className="text-xs text-zinc-400">{previewProduct.nameEn}</p>

                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#F4B400]">₹{previewProduct.price}</span>
                  {previewProduct.originalPrice > previewProduct.price && (
                    <span className="text-xs text-zinc-500 line-through">₹{previewProduct.originalPrice}</span>
                  )}
                  {previewProduct.discountPercent > 0 && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800">
                      {previewProduct.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 font-marathi leading-relaxed">{previewProduct.descriptionMr}</p>
                <p className="text-[11px] text-zinc-500">Pack: {previewProduct.weight} | SKU: {previewProduct.sku}</p>

                <div className="pt-2">
                  <button
                    disabled
                    className="w-full bg-[#F4B400] text-[#111111] font-bold text-xs py-3 rounded-xl shadow-lg opacity-90 cursor-default"
                  >
                    खरेदी करा (Add to Cart Preview)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
