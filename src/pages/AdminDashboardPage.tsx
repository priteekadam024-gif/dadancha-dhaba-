import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, VideoItem } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { AdminProductManager } from '../components/AdminProductManager';
import { AdminCategoryManager } from '../components/AdminCategoryManager';
import { BrandingManager } from '../components/BrandingManager';
import { AdminMediaManager } from '../components/AdminMediaManager';
import { AdminReelsManager } from '../components/AdminReelsManager';
import { OfficialLogo } from '../components/OfficialLogo';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { findMatchingImages } from '../utils/imageSearch';
import { 
  TrendingUp, ShoppingBag, Package, Video, ShieldAlert, 
  Plus, Edit, Trash2, Printer, CheckCircle, AlertTriangle, 
  LogOut, ExternalLink, RefreshCw, Image as ImageIcon, Sparkles, Database, Copy, Check, UploadCloud, Upload
} from 'lucide-react';

interface AdminDashboardPageProps {
  defaultTab?: string;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ defaultTab }) => {
  const { 
    language, isAdminLoggedIn, logoutAdmin, products, categories, orders, 
    videos, allUsers, adminUpdateUserStatus, adminDeleteUser, adminResetUserPassword,
    updateOrderStatus, addProduct, deleteProduct, 
    addVideo, deleteVideo, navigateTo, showToast, activeTab: contextTab, setActiveTab: setContextTab,
    contactConfig, updateContactConfig, refetchData, isLoadingData
  } = useApp();

  // If defaultTab is provided via route (e.g. /admin/branding), sync with contextTab
  React.useEffect(() => {
    if (defaultTab) {
      setContextTab(defaultTab);
    }
  }, [defaultTab, setContextTab]);

  // Contact Settings Form State
  const [settingsPhone, setSettingsPhone] = useState(contactConfig.phone);
  const [settingsWhatsapp, setSettingsWhatsapp] = useState(contactConfig.whatsapp);
  const [settingsEmail, setSettingsEmail] = useState(contactConfig.email);
  const [settingsAddress, setSettingsAddress] = useState(contactConfig.address);
  const [settingsMapsUrl, setSettingsMapsUrl] = useState(contactConfig.mapsUrl);
  const [settingsBusinessHours, setSettingsBusinessHours] = useState(contactConfig.businessHours);
  const [settingsInstagram, setSettingsInstagram] = useState(contactConfig.instagramUrl || 'https://www.instagram.com/dadanchadhaba?igsh=MTIzajBqdG1pdHJ5aA==');
  const [settingsYoutube, setSettingsYoutube] = useState(contactConfig.youtubeUrl || 'https://youtube.com/@dadanchadhaba?si=3KnepBsTXtH6-Opz');
  const [settingsFacebook, setSettingsFacebook] = useState(contactConfig.facebookUrl || 'https://www.facebook.com/share/199iUku8xx/');
  const [settingsLogoUrl, setSettingsLogoUrl] = useState(contactConfig.logo_url || '/assets/dadacha-dhaba-logo.png');
  const [copiedSql, setCopiedSql] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast(language === 'mr' ? 'कृपया फक्त इमेज फाइल निवडा (PNG, JPG, SVG, WebP)' : 'Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSettingsLogoUrl(e.target.result as string);
        showToast(language === 'mr' ? 'नवीन लोगो लोड झाला! जतन करा वर क्लिक करा.' : 'New logo loaded! Click "Save All Settings" to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateContactConfig({
      phone: settingsPhone,
      whatsapp: settingsWhatsapp,
      email: settingsEmail,
      address: settingsAddress,
      mapsUrl: settingsMapsUrl,
      businessHours: settingsBusinessHours,
      instagramUrl: settingsInstagram,
      youtubeUrl: settingsYoutube,
      facebookUrl: settingsFacebook,
      logo_url: settingsLogoUrl,
    });
  };

  const validAdminTabs = ['analytics', 'products', 'categories', 'orders', 'videos', 'gallery', 'users', 'branding', 'media', 'settings', 'revenue'];
  const activeTab = validAdminTabs.includes(contextTab) ? contextTab : 'analytics';
  const setActiveTab = (tab: string) => {
    setContextTab(tab);
    if (window.history.pushState) {
      window.history.pushState({}, '', `/admin/${tab}`);
    }
  };
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);

  // New Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdNameMr, setNewProdNameMr] = useState('');
  const [newProdNameEn, setNewProdNameEn] = useState('');
  const [newProdCat, setNewProdCat] = useState('spices');
  const [newProdPrice, setNewProdPrice] = useState(250);
  const [newProdWeight, setNewProdWeight] = useState('250g');
  const [newProdImg, setNewProdImg] = useState('');

  // New Video Modal State
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [newVidTitleMr, setNewVidTitleMr] = useState('');
  const [newVidTitleEn, setNewVidTitleEn] = useState('');
  const [newVidUrl, setNewVidUrl] = useState('');
  const [newVidEmbedUrl, setNewVidEmbedUrl] = useState('');
  const [newVidType, setNewVidType] = useState<'instagram' | 'youtube'>('instagram');

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-zinc-400">Please authenticate with admin passcode first.</p>
        <button
          onClick={() => navigateTo('admin-secret-login')}
          className="bg-[#F4B400] text-[#111111] font-bold text-xs px-6 py-2.5 rounded-full"
        >
          Go to Admin Login
        </button>
      </div>
    );
  }

  // Analytics Metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.orderStatus !== 'delivered').length;
  const lowStockCount = products.filter((p) => p.stock < 20).length;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdNameEn || !newProdImg) {
      showToast('Please enter product name and image URL', 'error');
      return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      nameMr: newProdNameMr || newProdNameEn,
      nameEn: newProdNameEn,
      slug: newProdNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: newProdCat,
      categoryName: newProdCat.toUpperCase(),
      price: newProdPrice,
      originalPrice: Math.round(newProdPrice * 1.25),
      discountPercent: 20,
      weight: newProdWeight,
      ratings: 5.0,
      reviewCount: 1,
      images: [newProdImg],
      descriptionMr: 'दादांचा अस्सल गावरान मसाला.',
      descriptionEn: 'Pure handcrafted traditional Dadacha Dhaba recipe.',
      ingredientsMr: 'मिरची, धने, जिरे, लवंग, दालचिनी.',
      ingredientsEn: 'Red chilli, coriander, cumin, cloves, cinnamon.',
      isBestSeller: false,
      isFeatured: true,
      stock: 50,
      brand: 'Dadacha Dhaba',
      sku: `DD-SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addProduct(newProduct);
    setShowAddProductModal(false);
    setNewProdNameMr('');
    setNewProdNameEn('');
    setNewProdImg('');
  };

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVidTitleEn || !newVidUrl) {
      showToast('Please enter title and video URL', 'error');
      return;
    }

    const videoObj: VideoItem = {
      id: `vid-${Date.now()}`,
      titleMr: newVidTitleMr || newVidTitleEn,
      titleEn: newVidTitleEn,
      thumbnailUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800',
      embedUrl: newVidEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      originalUrl: newVidUrl,
      type: newVidType,
      category: 'recipes',
      date: 'Just Now',
      isPopular: true,
      isPublished: true,
    };

    addVideo(videoObj);
    setShowAddVideoModal(false);
    setNewVidTitleMr('');
    setNewVidTitleEn('');
    setNewVidUrl('');
  };

  const copySqlToClipboard = () => {
    const sqlScript = `-- SUPABASE DATABASE SCHEMA
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  points INT DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);`;
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    showToast(language === 'mr' ? 'SQL कोड कॉपी झाला!' : 'Database SQL script copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="bg-[#141414] border border-[#F4B400]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <OfficialLogo size="lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <span className="text-[10px] bg-[#F4B400] text-[#111111] font-black px-3 py-0.5 rounded-full uppercase inline-block">
                👑 MASTER ADMIN CONTROL PANEL
              </span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Realtime
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              दादाचा ढाबा - व्यवस्थापन कक्ष
            </h1>
            <p className="text-xs text-zinc-400">
              Realtime Database Engine • Live Analytics, Orders & Inventory Manager
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchData()}
            disabled={isLoadingData}
            className="bg-[#222222] hover:bg-[#333333] text-zinc-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Refresh Database Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#F4B400] ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>{isLoadingData ? 'Syncing...' : 'Refresh DB'}</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-800 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-semibold">Total Revenue</span>
            <TrendingUp className="w-5 h-5 text-[#F4B400]" />
          </div>
          <p className="text-3xl font-black text-white">₹{totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400 font-bold">↑ +18.4% this month</span>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-[#F4B400]" />
          </div>
          <p className="text-3xl font-black text-white">{orders.length}</p>
          <span className="text-[10px] text-zinc-400">{pendingOrders} Pending Fulfillment</span>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-semibold">Live Products</span>
            <Package className="w-5 h-5 text-[#F4B400]" />
          </div>
          <p className="text-3xl font-black text-white">{products.length}</p>
          <span className="text-[10px] text-rose-400 font-bold">{lowStockCount} Low stock items</span>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-2 shadow-xl">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-semibold">Reels & Videos</span>
            <Video className="w-5 h-5 text-[#F4B400]" />
          </div>
          <p className="text-3xl font-black text-white">{videos.length}</p>
          <span className="text-[10px] text-emerald-400 font-bold">Embedded & Active</span>
        </div>
      </div>

      {/* Dashboard Tabs Navigation */}
      <div className="flex border-b border-zinc-800 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'analytics' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          📊 Analytics & Stock Alerts
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          🛒 Orders Management ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'products' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          🌶️ Products Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'categories' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          📁 Category Management ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'videos' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          🎬 Videos & Reels ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          👥 Registered Users ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'branding' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          👑 Branding Manager
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'media' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          🖼️ Media & Storage Manager
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          ⚙️ Website & Contact Settings
        </button>
      </div>

      {/* TAB 1: Analytics & Stock */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Low Stock & Inventory Warnings</span>
            </h3>

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-[#111111] rounded-xl text-xs border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt="p" className="w-8 h-8 rounded object-cover" />
                    <span className="font-bold text-white font-marathi">{p.nameMr} ({p.weight})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      p.stock < 20 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {p.stock} in stock
                    </span>
                    <span className="font-bold text-[#F4B400]">₹{p.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-white text-lg">Manage Customer Orders</h3>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-[#161616] border border-zinc-800 p-12 rounded-3xl text-center space-y-2">
                <ShoppingBag className="w-12 h-12 mx-auto text-zinc-600 opacity-40" />
                <p className="text-white font-bold text-base">No orders received yet</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Live customer orders placed on the website will be stored in your Supabase database and displayed here in real time.
                </p>
              </div>
            ) : (
              orders.map((ord) => (
              <div key={ord.id} className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-base font-black text-[#F4B400]">{ord.orderNumber}</span>
                    <p className="text-xs text-zinc-400 mt-0.5">Customer: {ord.userName} ({ord.userPhone})</p>
                    <p className="text-[11px] text-zinc-500">Address: {ord.shippingAddress.street}, {ord.shippingAddress.city}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Select */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Status:</span>
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as any)}
                        className="bg-[#111111] text-emerald-400 font-bold border border-zinc-700 text-xs px-3 py-1.5 rounded-xl"
                      >
                        <option value="placed">Placed</option>
                        <option value="processing">Processing / Packing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <button
                      onClick={() => setSelectedOrderForInvoice(ord)}
                      className="bg-[#222222] hover:bg-[#F4B400] hover:text-[#111111] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-zinc-300">
                      <span>• {it.productNameEn} ({it.weight}) x {it.quantity}</span>
                      <span className="font-bold text-white">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-800 pt-2 flex justify-between text-xs font-bold text-[#F4B400]">
                  <span>Payment Method: {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})</span>
                  <span>Total Amount: ₹{ord.totalAmount}</span>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* TAB 3: Products Catalog */}
      {activeTab === 'products' && (
        <AdminProductManager />
      )}

      {/* TAB 4: Videos & Reels Manager */}
      {activeTab === 'videos' && (
        <ErrorBoundary fallbackTitle="Reels Manager Notice">
          <AdminReelsManager />
        </ErrorBoundary>
      )}

      {/* TAB 5: Registered Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base font-marathi">
                  ग्राहक आणि वापरकर्ता खाते व्यवस्थापन (User & Customer Accounts)
                </h3>
                <p className="text-xs text-zinc-400">
                  Manage customer profiles, enable/disable access, and monitor user ordering history.
                </p>
              </div>
              <span className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/30 text-xs font-bold px-3 py-1.5 rounded-full">
                Total Users: {allUsers.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase">
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Joined Date</th>
                    <th className="py-3 px-3">Orders / Spent</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-zinc-500">
                        <p className="font-bold text-sm text-zinc-400">No registered customers yet</p>
                        <p className="text-xs text-zinc-500 mt-1">Customer profiles created via Supabase Auth will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    allUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={usr.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                            alt={usr.name}
                            className="w-9 h-9 rounded-xl object-cover border border-zinc-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-white block font-marathi">{usr.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {usr.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 space-y-0.5">
                        <p className="text-zinc-300 font-medium">{usr.email}</p>
                        <p className="text-zinc-500 text-[10px]">{usr.phone || 'No phone'}</p>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          usr.status === 'active' || !usr.status 
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                            : 'bg-rose-950 text-rose-400 border-rose-800'
                        }`}>
                          {usr.status || 'active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-zinc-400">
                        {usr.createdAt || '2026-08-01'}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-white block">{usr.totalOrders ?? orders.filter(o => o.userEmail === usr.email).length} Orders</span>
                        <span className="text-zinc-500 text-[10px]">₹{usr.totalSpent ?? orders.filter(o => o.userEmail === usr.email).reduce((a, b) => a + b.totalAmount, 0)} Total</span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => adminUpdateUserStatus(usr.id, usr.status === 'disabled' ? 'active' : 'disabled')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              usr.status === 'disabled'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                                : 'bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900'
                            }`}
                          >
                            {usr.status === 'disabled' ? 'Enable' : 'Disable'}
                          </button>

                          <button
                            onClick={() => adminResetUserPassword(usr.id)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Reset Pass
                          </button>

                          <button
                            onClick={() => adminDeleteUser(usr.id)}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Category Management */}
      {activeTab === 'categories' && (
        <ErrorBoundary fallbackTitle="Admin Category Manager Notice">
          <AdminCategoryManager />
        </ErrorBoundary>
      )}

      {/* TAB: Branding Manager */}
      {activeTab === 'branding' && (
        <ErrorBoundary fallbackTitle="Branding Manager Notice">
          <BrandingManager />
        </ErrorBoundary>
      )}

      {/* TAB: Media & Storage Manager */}
      {activeTab === 'media' && (
        <ErrorBoundary fallbackTitle="Media Manager Notice">
          <AdminReelsManager />
        </ErrorBoundary>
      )}

      {/* TAB 6: Website Settings & Contact Information */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="font-black text-white text-xl flex items-center gap-2">
                <span>⚙️ Website Contact & Operational Settings</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Update official contact numbers, email, physical address, and store hours. Changes apply globally across the entire website instantly.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    📞 Official Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] font-mono"
                    placeholder="+91 91370 50018"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    📱 WhatsApp Business Number
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsWhatsapp}
                    onChange={(e) => setSettingsWhatsapp(e.target.value)}
                    className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] font-mono"
                    placeholder="+91 91370 50018"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  📧 Customer Support Email
                </label>
                <input
                  type="email"
                  required
                  value={settingsEmail}
                  onChange={(e) => setSettingsEmail(e.target.value)}
                  className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                  placeholder="support@dadachadhaba.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  📍 Store / Factory Address
                </label>
                <textarea
                  required
                  rows={3}
                  value={settingsAddress}
                  onChange={(e) => setSettingsAddress(e.target.value)}
                  className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                  placeholder="Dadacha Dhaba, Baner Road, Pune..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    🗺 Google Maps Location Link
                  </label>
                  <input
                    type="url"
                    value={settingsMapsUrl}
                    onChange={(e) => setSettingsMapsUrl(e.target.value)}
                    className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                    ⏰ Business Working Hours
                  </label>
                  <input
                    type="text"
                    value={settingsBusinessHours}
                    onChange={(e) => setSettingsBusinessHours(e.target.value)}
                    className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                    placeholder="Mon - Sun: 9:00 AM - 10:00 PM"
                  />
                </div>
              </div>

              {/* Official Branding & Logo Section */}
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <h4 className="text-sm font-bold text-[#F4B400] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Official Brand Logo & Asset Settings</span>
                </h4>
                
                <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-5 space-y-4">
                  {/* Current Logo Overview */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="p-1 bg-[#1A1A1A] border border-[#F4B400]/40 rounded-full shrink-0 shadow-md">
                        <OfficialLogo size="lg" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Current Active Global Logo</span>
                        <p className="text-[11px] text-zinc-400">
                          Applied across Header, Footer, Login, Register, Account, Admin, Checkout & 404 pages.
                        </p>
                        <span className="text-[10px] text-[#F4B400] font-mono block mt-1 break-all">
                          Source: {settingsLogoUrl.startsWith('data:') ? 'Custom Uploaded Data URL' : settingsLogoUrl}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSettingsLogoUrl('/assets/dadacha-dhaba-logo.png');
                        showToast(language === 'mr' ? 'मूळ अधिकृत लोगो पुनर्संचयित केला!' : 'Reset to default official logo!');
                      }}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-4 py-2 rounded-xl border border-zinc-700 transition-all text-center shrink-0"
                    >
                      Reset to Official Asset
                    </button>
                  </div>

                  {/* Drag & Drop Upload Zone */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2">
                      {language === 'mr' ? 'नवीन लोगो ड्रॅग आणि ड्रॉप करा किंवा अपलोड करा' : 'Drag & Drop New Logo or Browse File'}
                    </label>

                    <input
                      type="file"
                      ref={logoFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFileSelect(e.target.files[0]);
                        }
                      }}
                    />

                    <div
                      onDragOver={handleLogoDragOver}
                      onDragLeave={handleLogoDragLeave}
                      onDrop={handleLogoDrop}
                      onClick={() => logoFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                        isDraggingLogo
                          ? 'border-[#F4B400] bg-[#F4B400]/10 scale-[1.01]'
                          : 'border-zinc-700 hover:border-[#F4B400]/60 bg-[#171717] hover:bg-[#1C1C1C]'
                      }`}
                    >
                      <div className="p-3 bg-[#222222] text-[#F4B400] rounded-full border border-zinc-700 shadow-inner">
                        <UploadCloud className="w-6 h-6 animate-pulse" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          {language === 'mr' ? 'येथे नवीन लोगो इमेज ड्रॅग करा किंवा कॉम्प्युटरवरून निवडा' : 'Drag & drop new logo image here, or click to browse'}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Supports PNG, JPG, JPEG, SVG, WebP (Transparent PNG recommended)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          logoFileInputRef.current?.click();
                        }}
                        className="mt-1 text-xs bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-black px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{language === 'mr' ? 'फाइल निवडा' : 'Choose Logo File'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Advanced URL Input Fallback */}
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Or enter custom Logo Image URL manually:
                    </label>
                    <input
                      type="text"
                      value={settingsLogoUrl}
                      onChange={(e) => setSettingsLogoUrl(e.target.value)}
                      className="w-full bg-[#161616] text-white text-xs p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-[#F4B400] font-mono"
                      placeholder="/assets/dadacha-dhaba-logo.png or https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <h4 className="text-sm font-bold text-[#F4B400]">🌐 Official Social Media Handles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      📸 Instagram Page URL
                    </label>
                    <input
                      type="url"
                      value={settingsInstagram}
                      onChange={(e) => setSettingsInstagram(e.target.value)}
                      className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                      placeholder="https://www.instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      📺 YouTube Channel URL
                    </label>
                    <input
                      type="url"
                      value={settingsYoutube}
                      onChange={(e) => setSettingsYoutube(e.target.value)}
                      className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                      placeholder="https://youtube.com/@..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                      👍 Facebook Page URL
                    </label>
                    <input
                      type="url"
                      value={settingsFacebook}
                      onChange={(e) => setSettingsFacebook(e.target.value)}
                      className="w-full bg-[#111111] text-white text-xs p-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                      placeholder="https://www.facebook.com/..."
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-sm px-8 py-3.5 rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Save & Publish Contact Settings</span>
              </button>
            </form>
          </div>

          {/* Supabase SQL Setup Info Box */}
          <div className="bg-[#141414] border border-[#F4B400]/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-[#F4B400]" />
              <div>
                <h4 className="text-base font-bold text-white">Supabase PostgreSQL Schema Script</h4>
                <p className="text-xs text-zinc-400">Copy & paste into your Supabase SQL Editor if resetting tables.</p>
              </div>
            </div>

            <button
              onClick={copySqlToClipboard}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#F4B400]" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Supabase SQL Schema'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-[#141414] border border-[#F4B400] rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-bold text-white text-lg font-marathi">नवीन उत्पादन जोडा (Add New Product)</h3>
            
            <input
              type="text"
              required
              placeholder="Product English Name (e.g. Malvani Spice)"
              value={newProdNameEn}
              onChange={(e) => setNewProdNameEn(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
            />

            <input
              type="text"
              placeholder="Product Marathi Name (उदा. अस्सल मालवणी मसाला)"
              value={newProdNameMr}
              onChange={(e) => setNewProdNameMr(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-marathi"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                required
                placeholder="Price ₹"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(Number(e.target.value))}
                className="bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
              />
              <input
                type="text"
                placeholder="Weight (e.g. 500g)"
                value={newProdWeight}
                onChange={(e) => setNewProdWeight(e.target.value)}
                className="bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-zinc-400 font-bold">Product Image URL</label>
                <button
                  type="button"
                  onClick={() => {
                    const matches = findMatchingImages(newProdNameEn || newProdNameMr);
                    if (matches.length > 0) {
                      setNewProdImg(matches[0]);
                      showToast(language === 'mr' ? 'उच्च-गुणवत्तेची छायाचित्रे शोधली गेली!' : 'High-resolution images found & selected!');
                    }
                  }}
                  className="text-[11px] bg-[#F4B400]/10 text-[#F4B400] hover:bg-[#F4B400] hover:text-[#111111] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>✨ Auto-Find HD Images</span>
                </button>
              </div>

              <input
                type="url"
                required
                placeholder="Image URL (Unsplash or direct image link)"
                value={newProdImg}
                onChange={(e) => setNewProdImg(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
              />

              {/* HD Image Thumbnails Suggestion Bar */}
              {(newProdNameEn || newProdNameMr) && (
                <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Suggested High-Res Photos:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {findMatchingImages(newProdNameEn || newProdNameMr).map((img, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setNewProdImg(img)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          newProdImg === img ? 'border-[#F4B400] scale-105 shadow-lg' : 'border-zinc-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Suggested" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="w-1/2 bg-[#222222] text-white font-bold text-xs py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-[#F4B400] text-[#111111] font-bold text-xs py-3 rounded-xl hover:bg-[#FF8C00]"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateVideo} className="bg-[#141414] border border-[#F4B400] rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h3 className="font-bold text-white text-lg font-marathi">व्हिडिओ किंवा रील जोडा (Add Video)</h3>

            <input
              type="text"
              required
              placeholder="Title (English)"
              value={newVidTitleEn}
              onChange={(e) => setNewVidTitleEn(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
            />

            <input
              type="text"
              placeholder="शीर्षक (मराठी)"
              value={newVidTitleMr}
              onChange={(e) => setNewVidTitleMr(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700 font-marathi"
            />

            <select
              value={newVidType}
              onChange={(e) => setNewVidType(e.target.value as any)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
            >
              <option value="instagram">Instagram Reel</option>
              <option value="youtube">YouTube Video / Short</option>
            </select>

            <input
              type="url"
              required
              placeholder="Video Link (Instagram or YouTube URL)"
              value={newVidUrl}
              onChange={(e) => setNewVidUrl(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
            />

            <input
              type="url"
              placeholder="Embed URL (e.g. https://www.youtube.com/embed/...)"
              value={newVidEmbedUrl}
              onChange={(e) => setNewVidEmbedUrl(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVideoModal(false)}
                className="w-1/2 bg-[#222222] text-white font-bold text-xs py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-[#F4B400] text-[#111111] font-bold text-xs py-3 rounded-xl hover:bg-[#FF8C00]"
              >
                Publish Video
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <InvoiceModal order={selectedOrderForInvoice} onClose={() => setSelectedOrderForInvoice(null)} />
      )}
    </div>
  );
};
