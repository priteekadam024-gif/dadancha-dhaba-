import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product, ProductVariant } from '../types';
import { findMatchingImages } from '../utils/imageSearch';
import { isProductInCategory } from '../utils/categoryUtils';
import { 
  Plus, Edit, Trash2, Eye, Search, Filter, ArrowUpDown, 
  Upload, X, Check, Sparkles, Image as ImageIcon, Download, 
  CheckSquare, Square, AlertCircle, Tag, Package, Layers, 
  RotateCcw, ChevronLeft, ChevronRight, Star, Flame, Grid, List,
  ArrowUp, ArrowDown, Scale, CreditCard, Receipt, Smartphone, Banknote
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
  const [formWeight, setFormWeight] = useState('250 g');
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

  // Payment Methods and GST Settings State
  const [formPaymentMethods, setFormPaymentMethods] = useState<string[]>([
    'cod',
    'bhim_upi',
    'google_pay',
    'phonepe',
    'razorpay',
  ]);
  const [formGstEnabled, setFormGstEnabled] = useState<boolean>(true);
  const [formGstRate, setFormGstRate] = useState<number>(5);

  // Pack Sizes / Weight Options State
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([
    { id: 'v-1', weight: '250 g', price: 149, originalPrice: 180, stock: 50, isActive: true },
    { id: 'v-2', weight: '500 g', price: 279, originalPrice: 320, stock: 50, isActive: true },
    { id: 'v-3', weight: '1 kg', price: 499, originalPrice: 580, stock: 50, isActive: true }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pack size / Variant Handlers
  const handleAddVariant = (weightPreset?: string, pricePreset?: number) => {
    const newWeight = weightPreset || '250 g';
    const newPrice = pricePreset || 199;
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      weight: newWeight,
      size: newWeight,
      price: newPrice,
      originalPrice: Math.round(newPrice * 1.25),
      stock: 50,
      sku: `DD-${newWeight.replace(/\s+/g, '').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      isActive: true,
    };
    setFormVariants((prev) => [...prev, newVariant]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setFormVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'weight') {
        copy[index].size = value;
      }
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    if (formVariants.length <= 1) {
      showToast('At least one pack size option is required', 'error');
      return;
    }
    setFormVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveVariant = (index: number, direction: 'up' | 'down') => {
    setFormVariants((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Filter Products
  const filteredProducts = products.filter((p) => {
    if (!p) return false;
    const q = (searchQuery || '').toLowerCase().trim();
    const nameEn = (p.nameEn || '').toLowerCase();
    const nameMr = (p.nameMr || '');
    const sku = (p.sku || '').toLowerCase();
    const catName = (p.categoryName || '').toLowerCase();

    const matchesSearch = 
      !q ||
      nameEn.includes(q) ||
      nameMr.includes(q) ||
      sku.includes(q) ||
      catName.includes(q);

    const matchesCategory = categoryFilter === 'all' || isProductInCategory(p, categoryFilter);

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
    setFormPrice(149);
    setFormOriginalPrice(180);
    setFormStock(50);
    setFormSku(`DD-SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormWeight('250 g');
    setFormBrand('Dadacha Dhaba');
    setFormDescEn('Authentic traditional recipe handcrafted in Kolhapur.');
    setFormDescMr('कोल्हापुरी परंपरेनुसार बनवलेला अस्सल गावरान मसाला.');
    setFormIngredientsEn('Red chilli, coriander, cumin, garlic, sesame, dry coconut, spices.');
    setFormIngredientsMr('मिरची, धने, जिरे, लसूण, तीळ, सुके खोबरे, खडा मसाला.');
    setFormIsFeatured(true);
    setFormIsTrending(false);
    setFormPaymentMethods(['cod', 'bhim_upi', 'google_pay', 'phonepe', 'razorpay']);
    setFormGstEnabled(true);
    setFormGstRate(5);
    setFormImages([
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800'
    ]);
    // Default 3 common pack sizes with independent prices
    setFormVariants([
      { id: `v-${Date.now()}-1`, weight: '250 g', size: '250 g', price: 149, originalPrice: 180, stock: 50, isActive: true },
      { id: `v-${Date.now()}-2`, weight: '500 g', size: '500 g', price: 279, originalPrice: 320, stock: 50, isActive: true },
      { id: `v-${Date.now()}-3`, weight: '1 kg', size: '1 kg', price: 499, originalPrice: 580, stock: 50, isActive: true }
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
    setFormPaymentMethods(
      Array.isArray(product.paymentMethods) && product.paymentMethods.length > 0
        ? [...product.paymentMethods]
        : ['cod', 'bhim_upi', 'google_pay', 'phonepe', 'razorpay']
    );
    setFormGstEnabled(product.gstEnabled !== undefined ? Boolean(product.gstEnabled) : true);
    setFormGstRate(product.gstRate !== undefined ? Number(product.gstRate) : 5);
    setFormImages(product.images.length > 0 ? [...product.images] : ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800']);
    
    // Load existing variants or initialize from product weight and price
    if (product.variants && product.variants.length > 0) {
      setFormVariants(product.variants.map((v, i) => ({
        ...v,
        id: v.id || `v-${Date.now()}-${i}`,
        weight: v.weight || v.size || '250 g',
        size: v.size || v.weight || '250 g',
        price: Number(v.price) || product.price,
        originalPrice: v.originalPrice || Math.round((Number(v.price) || product.price) * 1.25),
        stock: v.stock !== undefined ? Number(v.stock) : product.stock,
        isActive: v.isActive !== undefined ? v.isActive : true
      })));
    } else {
      setFormVariants([
        { 
          id: `v-${Date.now()}-1`, 
          weight: product.weight || '250 g', 
          size: product.weight || '250 g',
          price: product.price || 149, 
          originalPrice: product.originalPrice || Math.round((product.price || 149) * 1.25), 
          stock: product.stock || 50, 
          isActive: true 
        }
      ]);
    }
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

    // Validate Variants
    if (!formVariants || formVariants.length === 0) {
      showToast('At least one Pack Size / Weight option is required', 'error');
      return;
    }

    const seenWeights = new Set<string>();
    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      const normalizedWeight = (v.weight || v.size || '').trim();
      if (!normalizedWeight) {
        showToast(`Pack size #${i + 1} has an empty weight. Please enter a valid weight (e.g. 250 g, 500 g).`, 'error');
        return;
      }
      if (!v.price || Number(v.price) <= 0) {
        showToast(`Please enter a valid price (> 0) for pack size "${normalizedWeight}".`, 'error');
        return;
      }
      const lowerWeight = normalizedWeight.toLowerCase().replace(/\s+/g, '');
      if (seenWeights.has(lowerWeight)) {
        showToast(`Duplicate pack size "${normalizedWeight}" found. Each option must have a unique weight.`, 'error');
        return;
      }
      seenWeights.add(lowerWeight);
    }

    // Validate Payment Methods
    if (formPaymentMethods.length === 0) {
      showToast('Please select at least one payment method for this product', 'error');
      return;
    }

    // Validate GST Rate
    const numericGstRate = Number(formGstRate);
    if (formGstEnabled && (isNaN(numericGstRate) || numericGstRate < 0)) {
      showToast('Please enter a valid GST rate percentage (e.g. 0, 5, 12, 18, 28)', 'error');
      return;
    }

    const categoryObj = categories.find((c) => c.id === formCategory);
    const categoryName = categoryObj ? categoryObj.nameEn : formCategory.toUpperCase();

    // Primary variant will dictate default price & weight
    const primaryVariant = formVariants[0];
    const effectivePrice = Number(primaryVariant.price) || Number(formPrice);
    const effectiveOriginalPrice = primaryVariant.originalPrice ? Number(primaryVariant.originalPrice) : Number(formOriginalPrice);
    const effectiveWeight = primaryVariant.weight || formWeight || '250 g';

    const discountPercent = effectiveOriginalPrice > effectivePrice 
      ? Math.round(((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100) 
      : 0;

    const productPayload: Omit<Product, 'id' | 'createdAt'> = {
      nameEn: formNameEn,
      nameMr: formNameMr || formNameEn,
      slug: formNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: formCategory,
      categoryName,
      price: effectivePrice,
      originalPrice: effectiveOriginalPrice,
      discountPercent,
      stock: Number(formStock),
      sku: formSku || `DD-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      weight: effectiveWeight,
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
      paymentMethods: formPaymentMethods,
      gstEnabled: formGstEnabled,
      gstRate: formGstEnabled ? (isNaN(numericGstRate) ? 5 : Math.max(0, numericGstRate)) : 0,
      variants: formVariants.map((v) => ({
        id: v.id || `v-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        weight: (v.weight || v.size || '').trim(),
        size: (v.size || v.weight || '').trim(),
        price: Number(v.price),
        originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
        stock: v.stock !== undefined ? Number(v.stock) : undefined,
        sku: v.sku || undefined,
        isActive: v.isActive !== undefined ? v.isActive : true
      }))
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
                              {p.variants && p.variants.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {p.variants.map((v, vIdx) => (
                                    <span key={vIdx} className="bg-[#222222] text-[#F4B400] text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-700">
                                      {v.weight || v.size}: ₹{v.price}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-zinc-500 text-[10px]">{p.weight}</span>
                              )}
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
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              p.gstEnabled !== false
                                ? 'bg-blue-950/60 text-blue-300 border-blue-800/50'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                              GST: {p.gstEnabled !== false ? `${p.gstRate ?? 5}%` : 'Exempt'}
                            </span>
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

              {/* PACK SIZES / WEIGHT OPTIONS SECTION (वजन पर्याय व स्वतंत्र किमती) */}
              <div className="bg-[#181818] border-2 border-[#F4B400]/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-[#F4B400]" />
                      <h4 className="font-extrabold text-sm sm:text-base text-white">
                        Pack Sizes & Weight Options (वजन पर्याय व स्वतंत्र किमती)
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Configure multiple pack sizes (e.g. 250 g, 500 g, 1 kg). Each weight option has its own independent price and is saved permanently to Supabase.
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 mr-1">Quick Add:</span>
                    {[
                      { label: '+ 100 g', weight: '100 g', price: 99 },
                      { label: '+ 250 g', weight: '250 g', price: 149 },
                      { label: '+ 500 g', weight: '500 g', price: 279 },
                      { label: '+ 1 kg', weight: '1 kg', price: 499 },
                      { label: '+ 5 kg', weight: '5 kg', price: 2199 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleAddVariant(preset.weight, preset.price)}
                        className="bg-[#242424] hover:bg-[#F4B400] hover:text-[#111111] text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700 transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Variants List */}
                <div className="space-y-3">
                  {formVariants.map((variant, index) => (
                    <div 
                      key={variant.id || index}
                      className="bg-[#121212] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-all"
                    >
                      {/* Reorder and Index Indicator */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveVariant(index, 'up')}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formVariants.length - 1}
                            onClick={() => handleMoveVariant(index, 'down')}
                            className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="w-6 text-center text-xs font-mono font-bold text-[#F4B400]">
                          #{index + 1}
                        </span>
                      </div>

                      {/* Weight / Pack Size */}
                      <div className="flex-1 min-w-[130px]">
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                          Weight / Pack Size *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 250 g or 1 kg"
                          value={variant.weight || variant.size || ''}
                          onChange={(e) => handleUpdateVariant(index, 'weight', e.target.value)}
                          className="w-full bg-[#1C1C1C] text-white font-bold text-xs p-2.5 rounded-xl border border-zinc-700 focus:border-[#F4B400] focus:outline-none"
                        />
                      </div>

                      {/* Selling Price (₹) */}
                      <div className="w-full sm:w-28">
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                          Selling Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder="₹149"
                          value={variant.price}
                          onChange={(e) => handleUpdateVariant(index, 'price', Number(e.target.value))}
                          className="w-full bg-[#1C1C1C] text-[#F4B400] font-black text-xs p-2.5 rounded-xl border border-zinc-700 focus:border-[#F4B400] focus:outline-none"
                        />
                      </div>

                      {/* Original MRP Price (₹) */}
                      <div className="w-full sm:w-28">
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                          MRP Price (₹)
                        </label>
                        <input
                          type="number"
                          min={1}
                          placeholder="₹180"
                          value={variant.originalPrice || ''}
                          onChange={(e) => handleUpdateVariant(index, 'originalPrice', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full bg-[#1C1C1C] text-zinc-400 text-xs p-2.5 rounded-xl border border-zinc-700 focus:border-[#F4B400] focus:outline-none"
                        />
                      </div>

                      {/* Stock */}
                      <div className="w-full sm:w-24">
                        <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                          Stock
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder="50"
                          value={variant.stock !== undefined ? variant.stock : formStock}
                          onChange={(e) => handleUpdateVariant(index, 'stock', Number(e.target.value))}
                          className="w-full bg-[#1C1C1C] text-white text-xs p-2.5 rounded-xl border border-zinc-700 focus:border-[#F4B400] focus:outline-none"
                        />
                      </div>

                      {/* Status / Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 sm:pt-4">
                        {index === 0 && (
                          <span className="bg-[#F4B400]/20 text-[#F4B400] text-[9px] font-extrabold px-2 py-1 rounded-md border border-[#F4B400]/40">
                            DEFAULT
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-2 bg-rose-950/60 hover:bg-rose-800 text-rose-400 hover:text-white rounded-xl transition-all"
                          title="Remove Weight Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Weight Option Button */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddVariant('1 kg', 499)}
                    className="bg-[#262626] hover:bg-[#333333] text-[#F4B400] hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-[#F4B400]/40 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Pack Size / Weight Option</span>
                  </button>

                  <span className="text-[11px] text-zinc-500 font-mono">
                    {formVariants.length} option{formVariants.length > 1 ? 's' : ''} configured
                  </span>
                </div>
              </div>

              {/* Category, SKU, Default Weight & Brand */}
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
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Base SKU Code</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Primary Weight Label</label>
                  <input
                    type="text"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    placeholder="e.g. 250 g"
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
              <div className="flex flex-wrap items-center gap-6 bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800">
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

              {/* PAYMENT METHODS SECTION */}
              <div className="bg-[#181818] border border-zinc-800 p-5 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#F4B400]" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Payment Methods (उपलब्ध पेमेंट पर्याय)
                    </h4>
                  </div>

                  {/* Quick Select Preset Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethods(['cod', 'bhim_upi', 'google_pay', 'phonepe', 'razorpay'])}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded font-semibold transition-colors"
                    >
                      All Methods
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethods(['bhim_upi', 'google_pay', 'phonepe', 'razorpay'])}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded font-semibold transition-colors"
                    >
                      Online Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMethods(['cod'])}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded font-semibold transition-colors"
                    >
                      COD Only
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400">
                  Select which payment methods are accepted for this specific product. At checkout, if multiple products are purchased together, only payment methods common to all items will be available.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* Cash on Delivery */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPaymentMethods.includes('cod')
                        ? 'bg-emerald-950/20 border-emerald-600/50 text-white'
                        : 'bg-[#121212] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formPaymentMethods.includes('cod')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormPaymentMethods((prev) => Array.from(new Set([...prev, 'cod'])));
                        } else {
                          setFormPaymentMethods((prev) => prev.filter((m) => m !== 'cod'));
                        }
                      }}
                      className="rounded accent-emerald-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold block flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] text-zinc-400">Pay cash upon home delivery</span>
                    </div>
                  </label>

                  {/* BHIM UPI */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPaymentMethods.includes('bhim_upi')
                        ? 'bg-amber-950/20 border-amber-500/50 text-white'
                        : 'bg-[#121212] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formPaymentMethods.includes('bhim_upi')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormPaymentMethods((prev) => Array.from(new Set([...prev, 'bhim_upi'])));
                        } else {
                          setFormPaymentMethods((prev) => prev.filter((m) => m !== 'bhim_upi'));
                        }
                      }}
                      className="rounded accent-[#F4B400] w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold block flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#F4B400]" />
                        BHIM UPI
                      </span>
                      <span className="text-[10px] text-zinc-400">Direct BHIM UPI payments</span>
                    </div>
                  </label>

                  {/* Google Pay */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPaymentMethods.includes('google_pay')
                        ? 'bg-blue-950/20 border-blue-500/50 text-white'
                        : 'bg-[#121212] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formPaymentMethods.includes('google_pay')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormPaymentMethods((prev) => Array.from(new Set([...prev, 'google_pay'])));
                        } else {
                          setFormPaymentMethods((prev) => prev.filter((m) => m !== 'google_pay'));
                        }
                      }}
                      className="rounded accent-blue-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold block flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                        Google Pay
                      </span>
                      <span className="text-[10px] text-zinc-400">GPay UPI checkout</span>
                    </div>
                  </label>

                  {/* PhonePe */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPaymentMethods.includes('phonepe')
                        ? 'bg-purple-950/20 border-purple-500/50 text-white'
                        : 'bg-[#121212] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formPaymentMethods.includes('phonepe')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormPaymentMethods((prev) => Array.from(new Set([...prev, 'phonepe'])));
                        } else {
                          setFormPaymentMethods((prev) => prev.filter((m) => m !== 'phonepe'));
                        }
                      }}
                      className="rounded accent-purple-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold block flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                        PhonePe
                      </span>
                      <span className="text-[10px] text-zinc-400">PhonePe UPI checkout</span>
                    </div>
                  </label>

                  {/* Razorpay */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      formPaymentMethods.includes('razorpay')
                        ? 'bg-amber-950/20 border-amber-500/50 text-white'
                        : 'bg-[#121212] border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formPaymentMethods.includes('razorpay')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormPaymentMethods((prev) => Array.from(new Set([...prev, 'razorpay'])));
                        } else {
                          setFormPaymentMethods((prev) => prev.filter((m) => m !== 'razorpay'));
                        }
                      }}
                      className="rounded accent-[#F4B400] w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold block flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#F4B400]" />
                        Razorpay
                      </span>
                      <span className="text-[10px] text-zinc-400">Cards, Netbanking & Wallets</span>
                    </div>
                  </label>
                </div>

                {formPaymentMethods.length === 0 && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Warning: You must select at least one payment method so customers can buy this product.
                  </p>
                )}
              </div>

              {/* GST SETTINGS SECTION */}
              <div className="bg-[#181818] border border-zinc-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Receipt className="w-4 h-4 text-[#F4B400]" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    GST Settings (जीएसटी कर दर)
                  </h4>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Enable / Disable GST Checkbox */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formGstEnabled}
                      onChange={(e) => setFormGstEnabled(e.target.checked)}
                      className="rounded accent-[#F4B400] w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Apply GST to this product
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {formGstEnabled ? 'Tax is calculated at checkout based on configured rate' : 'Product is tax-exempt (0% GST)'}
                      </span>
                    </div>
                  </label>

                  {/* GST Rate Input */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-zinc-300 whitespace-nowrap">
                      GST Rate (%):
                    </label>
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!formGstEnabled}
                        value={formGstEnabled ? formGstRate : 0}
                        onChange={(e) => setFormGstRate(Number(e.target.value))}
                        className={`w-full bg-[#111111] text-white text-xs font-bold px-3 py-2 rounded-xl border ${
                          formGstEnabled ? 'border-zinc-700 focus:border-[#F4B400]' : 'border-zinc-800 opacity-50 cursor-not-allowed'
                        }`}
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-zinc-500 pointer-events-none">%</span>
                    </div>
                  </div>
                </div>

                {/* Common Presets */}
                {formGstEnabled && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-zinc-400 mr-1">Quick Presets:</span>
                    {[0, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setFormGstRate(rate)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                          Number(formGstRate) === rate
                            ? 'bg-[#F4B400] text-[#111111]'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {rate}% {rate === 5 ? '(Spices Standard)' : rate === 0 ? '(Exempt)' : ''}
                      </button>
                    ))}
                  </div>
                )}

                {/* Calculation preview hint */}
                <div className="bg-[#121212] p-3 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400">
                  {formGstEnabled ? (
                    <span>
                      💡 <strong>Calculation Preview:</strong> For a pack priced at ₹{formVariants[0]?.price || formPrice}, GST @ {formGstRate}% will be{' '}
                      <strong className="text-[#F4B400]">
                        ₹{(((Number(formVariants[0]?.price || formPrice) || 0) * (Number(formGstRate) || 0)) / 100).toFixed(2)}
                      </strong>{' '}
                      per unit.
                    </span>
                  ) : (
                    <span>
                      💡 <strong>Tax Exempt:</strong> No GST will be charged for this item during checkout.
                    </span>
                  )}
                </div>
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
