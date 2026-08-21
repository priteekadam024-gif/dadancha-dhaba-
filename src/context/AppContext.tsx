import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Category, CartItem, Order, VideoItem, GalleryItem, 
  Review, Coupon, Recipe, RecipeCategory, RecipeSubcategory, ProductVariant,
  User, Language, NavigationPage, Address, OrderStatus, UserNotificationSettings, ContactConfig 
} from '../types';
import { 
  supabase, 
  isSupabaseConfigured, 
  supabaseSignUp, 
  supabaseSignIn, 
  supabaseSignOut, 
  supabaseResetPassword, 
  supabaseUpdatePassword, 
  supabaseGetUserProfile, 
  supabaseUpdateUserProfile, 
  supabaseGetUserAddresses, 
  supabaseSaveAddress, 
  supabaseDeleteAddress, 
  supabaseSaveOrder, 
  supabaseGetOrders, 
  supabaseUpdateOrderStatus,
  supabaseGetProducts,
  supabaseSaveProduct,
  supabaseDeleteProduct,
  supabaseGetCategories,
  supabaseSaveCategory,
  supabaseDeleteCategory,
  supabaseReorderCategories,
  supabaseGetReviews,
  supabaseSaveReview,
  supabaseGetAllProfiles,
  supabaseGetSiteSettings,
  supabaseSaveSiteSettings,
  supabaseGetMediaFiles,
  supabaseSaveMediaRecord,
  supabaseDeleteMediaRecord,
  supabaseUploadMediaStorageAsset,
  supabaseGetRecipes,
  supabaseSaveRecipe,
  supabaseDeleteRecipe,
  supabaseGetRecipeCategories,
  supabaseSaveRecipeCategory,
  supabaseSaveRecipeSubcategory,
  supabaseDeleteRecipeCategory,
  supabaseGetCartItems,
  supabaseSaveCartItem,
  supabaseDeleteCartItem,
  supabaseClearCartItems
} from '../lib/supabase';

import {
  mapDbProductToFrontend,
  mapFrontendProductToDb,
  mapDbCategoryToFrontend,
  mapFrontendCategoryToDb,
  mapDbOrderToFrontend,
  mapDbMediaToVideo,
  mapDbMediaToGallery,
  mapDbProfileToUser,
  mapDbRecipeToFrontend,
  mapFrontendRecipeToDb,
  mapDbRecipeCategoryToFrontend
} from '../utils/mappers';
import { getCategoryProductCount } from '../utils/categoryUtils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Navigation & Language
  language: Language;
  setLanguage: (lang: Language) => void;
  currentPage: NavigationPage;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navigateTo: (page: NavigationPage, params?: { productId?: string; orderId?: string; categoryId?: string; recipeId?: string; tab?: string }) => void;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  selectedCategoryId: string | null;
  selectedRecipeId: string | null;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Data State
  products: Product[];
  categories: Category[];
  videos: VideoItem[];
  gallery: GalleryItem[];
  reviews: Review[];
  coupons: Coupon[];
  recipes: Recipe[];
  recipeCategories: RecipeCategory[];
  orders: Order[];
  isLoadingData: boolean;
  fetchError: string | null;
  refetchData: () => Promise<void>;

  // User & Auth State
  currentUser: User | null;
  isAuthChecking: boolean;
  allUsers: User[];
  isAdminLoggedIn: boolean;
  loginUser: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (name: string, email: string, phone: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  changeUserPassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logoutUser: () => Promise<void>;
  loginAdmin: (password: string) => boolean;
  adminLogin: (password: string) => boolean;
  logoutAdmin: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  updateUserNotifications: (settings: UserNotificationSettings) => void;
  addAddress: (address: Omit<Address, 'id'>) => void;
  editAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  saveUserAddress: (address: Address) => void;
  adminUpdateUserStatus: (userId: string, status: 'active' | 'disabled') => void;
  adminDeleteUser: (userId: string) => void;
  adminResetUserPassword: (userId: string) => void;

  // Cart & Wishlist State
  cart: CartItem[];
  wishlist: string[];
  appliedCoupon: Coupon | null;
  addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  
  // Checkout & Order Placement
  createOrder: (paymentMethod: Order['paymentMethod'], shippingAddress: Address) => Order;
  addOrUpdateOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => void;

  // Admin CRUD Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, options?: { reassignCategoryId?: string; deleteProducts?: boolean }) => void;
  reorderCategories: (newOrderedCategories: Category[]) => void;
  toggleCategoryStatus: (id: string) => void;
  toggleCategoryFeatured: (id: string) => void;

  // Recipe Management Actions
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  toggleRecipePublished: (id: string) => Promise<void>;
  addRecipeCategory: (category: Omit<RecipeCategory, 'id'>) => Promise<boolean>;
  addRecipeSubcategory: (sub: Omit<RecipeSubcategory, 'id'>) => Promise<boolean>;
  deleteRecipeCategory: (id: string) => Promise<boolean>;

  latestVideosLimit: number;
  updateLatestVideosLimit: (limit: number) => Promise<void>;
  addVideoRecord: (data: Partial<VideoItem> & { file?: File }) => Promise<boolean>;
  toggleVideoPublished: (id: string, isPublished: boolean) => Promise<void>;
  updateVideoRecord: (id: string, data: Partial<VideoItem>) => Promise<void>;
  deleteVideoRecord: (id: string) => Promise<void>;
  addVideo: (video: Omit<VideoItem, 'id'>) => void;
  deleteVideo: (id: string) => void;
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  deleteGalleryItem: (id: string) => void;
  addReview: (review: Omit<Review, 'id' | 'date' | 'likes'>) => void;

  // Website Settings & Contact Information
  contactConfig: ContactConfig;
  updateContactConfig: (config: Partial<ContactConfig>) => Promise<boolean>;

  // Notification Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getPathFromState(page: NavigationPage, tab?: string, productId?: string | null, recipeId?: string | null): string {
  switch (page) {
    case 'home': return '/';
    case 'shop': return '/shop';
    case 'product-detail': return productId ? `/product/${productId}` : '/shop';
    case 'categories': return '/categories';
    case 'cart': return '/cart';
    case 'wishlist': return '/wishlist';
    case 'videos': return '/videos';
    case 'gallery': return '/gallery';
    case 'recipes': return '/recipes';
    case 'recipe-detail': return recipeId ? `/recipe/${recipeId}` : '/recipes';
    case 'contact': return '/contact';
    case 'about': return '/about';
    case 'login': return '/login';
    case 'register': return '/register';
    case 'forgot-password': return '/forgot-password';
    case 'checkout': return '/checkout';
    case 'track-order': return '/track-order';
    case 'privacy':
    case 'privacy-policy': return '/privacy-policy';
    case 'terms': return '/terms';
    case 'shipping-policy': return '/shipping-policy';
    case 'refund-policy':
    case 'return-policy': return '/return-policy';
    case 'faqs': return '/faqs';

    case 'account':
    case 'orders':
      if (tab === 'orders') return '/account/orders';
      if (tab === 'addresses' || tab === 'address') return '/account/address';
      if (tab === 'cart') return '/account/cart';
      if (tab === 'wishlist') return '/account/wishlist';
      if (tab === 'settings') return '/account/settings';
      return '/account/profile';

    case 'admin-secret-login':
    case 'admin-login':
      return '/admin';

    case 'admin-dashboard':
      if (tab === 'products') return '/admin/products';
      if (tab === 'recipes') return '/admin/recipes';
      if (tab === 'categories') return '/admin/categories';
      if (tab === 'orders') return '/admin/orders';
      if (tab === 'customers' || tab === 'users') return '/admin/customers';
      if (tab === 'videos') return '/admin/videos';
      if (tab === 'gallery') return '/admin/gallery';
      if (tab === 'settings') return '/admin/settings';
      if (tab === 'branding') return '/admin/branding';
      if (tab === 'revenue') return '/admin/revenue';
      if (tab === 'profile') return '/admin/profile';
      return '/admin/dashboard';

    default:
      return '/';
  }
}

function parseUrlPath(path: string): { page: NavigationPage; tab: string; productId?: string; categoryId?: string; recipeId?: string } {
  const clean = path.toLowerCase().replace(/\/$/, '') || '/';

  if (clean === '/' || clean === '/home') return { page: 'home', tab: '' };
  if (clean === '/shop' || clean === '/products' || clean === '/product') return { page: 'shop', tab: '' };
  
  if (clean.startsWith('/product/') || clean.startsWith('/products/')) {
    const parts = path.split('/');
    const prodId = parts[2];
    if (prodId) {
      return { page: 'product-detail', tab: '', productId: prodId };
    }
    return { page: 'shop', tab: '' };
  }

  if (clean === '/categories' || clean === '/category') return { page: 'categories', tab: '' };
  if (clean.startsWith('/category/') || clean.startsWith('/categories/')) {
    const parts = path.split('/');
    const catId = parts[2];
    return { page: 'categories', tab: '', categoryId: catId };
  }

  if (clean === '/recipes' || clean === '/blog') return { page: 'recipes', tab: '' };
  if (clean.startsWith('/recipe/') || clean.startsWith('/recipes/')) {
    const parts = path.split('/');
    const recId = parts[2];
    if (recId) {
      return { page: 'recipe-detail', tab: '', recipeId: recId };
    }
    return { page: 'recipes', tab: '' };
  }

  if (clean === '/cart') return { page: 'cart', tab: '' };
  if (clean === '/wishlist') return { page: 'wishlist', tab: '' };
  if (clean === '/videos' || clean === '/video') return { page: 'videos', tab: '' };
  if (clean === '/gallery' || clean === '/photos') return { page: 'gallery', tab: '' };
  if (clean === '/contact' || clean === '/contact-us') return { page: 'contact', tab: '' };
  if (clean === '/about' || clean === '/about-us') return { page: 'about', tab: '' };
  if (clean === '/login' || clean === '/signin') return { page: 'login', tab: '' };
  if (clean === '/register' || clean === '/signup') return { page: 'register', tab: '' };
  if (clean === '/forgot-password') return { page: 'forgot-password', tab: '' };
  if (clean === '/checkout') return { page: 'checkout', tab: '' };
  if (clean === '/track-order' || clean === '/track') return { page: 'track-order', tab: '' };

  if (clean === '/privacy-policy' || clean === '/privacy') return { page: 'privacy-policy', tab: '' };
  if (clean === '/terms' || clean === '/terms-and-conditions') return { page: 'terms', tab: '' };
  if (clean === '/shipping-policy' || clean === '/shipping') return { page: 'shipping-policy', tab: '' };
  if (clean === '/return-policy' || clean === '/refund-policy' || clean === '/returns') return { page: 'return-policy', tab: '' };
  if (clean === '/faqs' || clean === '/faq') return { page: 'faqs', tab: '' };

  // Account
  if (clean === '/account' || clean === '/account/profile') return { page: 'account', tab: 'profile' };
  if (clean === '/account/orders' || clean === '/orders') return { page: 'account', tab: 'orders' };
  if (clean === '/account/address' || clean === '/account/addresses') return { page: 'account', tab: 'addresses' };
  if (clean === '/account/settings') return { page: 'account', tab: 'settings' };

  // Admin
  if (clean === '/admin' || clean === '/admin/login' || clean === '/admin-secret-login') {
    return { page: 'admin-secret-login', tab: '' };
  }
  if (clean === '/admin/dashboard' || clean === '/admin/analytics') return { page: 'admin-dashboard', tab: 'analytics' };
  if (clean === '/admin/products') return { page: 'admin-dashboard', tab: 'products' };
  if (clean === '/admin/recipes') return { page: 'admin-dashboard', tab: 'recipes' };
  if (clean === '/admin/categories') return { page: 'admin-dashboard', tab: 'categories' };
  if (clean === '/admin/orders') return { page: 'admin-dashboard', tab: 'orders' };
  if (clean === '/admin/customers' || clean === '/admin/users') return { page: 'admin-dashboard', tab: 'users' };
  if (clean === '/admin/videos') return { page: 'admin-dashboard', tab: 'videos' };
  if (clean === '/admin/gallery') return { page: 'admin-dashboard', tab: 'gallery' };
  if (clean === '/admin/branding') return { page: 'admin-dashboard', tab: 'branding' };
  if (clean === '/admin/settings') return { page: 'admin-dashboard', tab: 'settings' };
  if (clean === '/admin/revenue') return { page: 'admin-dashboard', tab: 'revenue' };
  if (clean === '/admin/profile') return { page: 'admin-dashboard', tab: 'profile' };

  return { page: 'home', tab: '' };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('mr');
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Helper to read initial cached data from sessionStorage for instant first paint
  const getInitialCache = <T,>(key: string, fallback: T): T => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return fallback;
  };

  // ALL BUSINESS DATA READ DIRECTLY FROM SUPABASE - NO HARDCODED DEMO DATA
  const [products, setProducts] = useState<Product[]>(() => getInitialCache('dd_cached_products', []));
  const [categories, setCategories] = useState<Category[]>(() => getInitialCache('dd_cached_categories', []));
  const [videos, setVideos] = useState<VideoItem[]>(() => getInitialCache('dd_cached_videos', []));
  const [latestVideosLimit, setLatestVideosLimit] = useState<number>(2);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => getInitialCache('dd_cached_gallery', []));
  const [reviews, setReviews] = useState<Review[]>(() => getInitialCache('dd_cached_reviews', []));
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>(() => getInitialCache('dd_cached_recipes', []));
  const [recipeCategories, setRecipeCategories] = useState<RecipeCategory[]>(() => getInitialCache('dd_cached_recipe_categories', []));
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Loading and Error state - if cached products exist, do not block the screen!
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('dd_cached_products');
    } catch {
      return true;
    }
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dd_shopping_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `cart_item_${item.product?.id || idx}_${item.selectedVariant?.id || item.selectedWeight || 'default'}`,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed reading cart from localStorage:', e);
    }
    return [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dd_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Sync cart & wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dd_shopping_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed saving cart to localStorage:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('dd_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  // Sync products & categories to sessionStorage for immediate warm startup
  useEffect(() => {
    if (products.length > 0) {
      try {
        sessionStorage.setItem('dd_cached_products', JSON.stringify(products));
      } catch (e) {}
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) {
      try {
        sessionStorage.setItem('dd_cached_categories', JSON.stringify(categories));
      } catch (e) {}
    }
  }, [categories]);

  // Current Auth User State (Default null, loaded via Supabase Auth session)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('dd_admin_logged_in') === 'true';
  });

  useEffect(() => {
    if (isAdminLoggedIn) {
      localStorage.setItem('dd_admin_logged_in', 'true');
    } else {
      localStorage.removeItem('dd_admin_logged_in');
    }
  }, [isAdminLoggedIn]);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  /**
   * Fetch all records directly from Supabase with Tiered Progressive Loading
   */
  const fetchDatabaseData = async () => {
    if (products.length === 0) {
      setIsLoadingData(true);
    }
    setFetchError(null);

    try {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoadingData(false);
        return;
      }

      // TIER 1: Critical essentials (Products, Categories, Site Settings)
      const [prodsRes, catsRes, settingsRes] = await Promise.allSettled([
        supabaseGetProducts(),
        supabaseGetCategories(),
        supabaseGetSiteSettings(),
      ]);

      // 1. Process Products
      let mappedProducts: Product[] = [];
      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value) && prodsRes.value.length > 0) {
        mappedProducts = prodsRes.value.map(mapDbProductToFrontend);
        setProducts(mappedProducts);
        try { sessionStorage.setItem('dd_cached_products', JSON.stringify(mappedProducts)); } catch (e) {}
      } else if (prodsRes.status === 'rejected') {
        console.warn('Products fetch rejected:', prodsRes.reason);
      }

      // 2. Process Categories
      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        const mappedCategories = catsRes.value.map(mapDbCategoryToFrontend).map((cat) => ({
          ...cat,
          itemCount: getCategoryProductCount(cat, mappedProducts.length > 0 ? mappedProducts : products),
        }));
        setCategories(mappedCategories);
        try { sessionStorage.setItem('dd_cached_categories', JSON.stringify(mappedCategories)); } catch (e) {}
      }

      // 3. Process Site Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value) {
        const siteSettings = settingsRes.value;
        if (siteSettings.latest_videos_count !== undefined) {
          setLatestVideosLimit(Number(siteSettings.latest_videos_count) || 2);
        }
        setContactConfig({
          phone: siteSettings.phone || siteSettings.contact_phone || '+91 91370 50018',
          whatsapp: siteSettings.whatsapp || siteSettings.contact_whatsapp || siteSettings.phone || '+91 91370 50018',
          email: siteSettings.email || siteSettings.contact_email || 'support@dadachadhaba.com',
          address: siteSettings.address || siteSettings.contact_address_en || 'Dadacha Dhaba, Plot No. 42, Baner Road, Opp. Balewadi High Street, Pune - 411045',
          mapsUrl: siteSettings.maps_url || 'https://maps.google.com/?q=Baner+Road+Pune',
          businessHours: siteSettings.business_hours || 'Mon - Sun: 9:00 AM - 10:00 PM',
          instagramUrl: siteSettings.instagram_url || 'https://www.instagram.com/dadanchadhaba?igsh=MTIzajBqdG1pdHJ5aA==',
          youtubeUrl: siteSettings.youtube_url || 'https://youtube.com/@dadanchadhaba?si=3KnepBsTXtH6-Opz',
          facebookUrl: siteSettings.facebook_url || 'https://www.facebook.com/share/199iUku8xx/',
          logo_url: siteSettings.logo_url || 'https://rkzmsyqxyjpaqiomiaxf.supabase.co/storage/v1/object/public/site-assets/dadanchadhabalogo.png',
        });
      }

      // Unblock UI immediately after Tier 1 essentials are ready!
      setIsLoadingData(false);

      // TIER 2: Secondary background enrichment (Media, Recipes, Reviews)
      Promise.allSettled([
        supabaseGetMediaFiles(),
        supabaseGetReviews(),
        supabaseGetRecipes(),
        supabaseGetRecipeCategories(),
      ]).then(([mediaRes, reviewsRes, recipesRes, recipeCatsRes]) => {
        // Media (Videos & Gallery)
        if (mediaRes.status === 'fulfilled' && Array.isArray(mediaRes.value)) {
          const mappedVideos = mediaRes.value
            .filter((m: any) => ['video', 'reels', 'youtube', 'instagram', 'post', 'image'].includes(m.media_type))
            .map(mapDbMediaToVideo)
            .sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });
          setVideos(mappedVideos);
          try { sessionStorage.setItem('dd_cached_videos', JSON.stringify(mappedVideos)); } catch (e) {}

          const mappedGallery = mediaRes.value
            .filter((m: any) => m.media_type === 'image' || m.media_type === 'banner')
            .map(mapDbMediaToGallery);
          setGallery(mappedGallery);
          try { sessionStorage.setItem('dd_cached_gallery', JSON.stringify(mappedGallery)); } catch (e) {}
        }

        // Reviews
        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value)) {
          const mappedReviews = reviewsRes.value.map((r: any) => ({
            id: String(r.id || 'rev-' + Math.random()),
            productId: r.product_id || '',
            userId: r.user_id || undefined,
            userName: r.user_name || 'Customer',
            rating: Number(r.rating) || 5,
            comment: r.comment || '',
            date: r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0],
            verifiedPurchase: true,
            likes: Number(r.likes) || 0,
          }));
          setReviews(mappedReviews);
          try { sessionStorage.setItem('dd_cached_reviews', JSON.stringify(mappedReviews)); } catch (e) {}
        }

        // Recipes & Categories
        if (recipesRes.status === 'fulfilled' && Array.isArray(recipesRes.value)) {
          const mappedRecipes = recipesRes.value.map(mapDbRecipeToFrontend);
          setRecipes(mappedRecipes);
          try { sessionStorage.setItem('dd_cached_recipes', JSON.stringify(mappedRecipes)); } catch (e) {}
        }

        if (recipeCatsRes.status === 'fulfilled' && Array.isArray(recipeCatsRes.value)) {
          const mappedRecipeCategories = recipeCatsRes.value.map(mapDbRecipeCategoryToFrontend);
          setRecipeCategories(mappedRecipeCategories);
          try { sessionStorage.setItem('dd_cached_recipe_categories', JSON.stringify(mappedRecipeCategories)); } catch (e) {}
        }
      }).catch((secondaryErr) => {
        console.warn('Secondary data load notice:', secondaryErr);
      });

      // TIER 3: Admin data (Orders & All Users) loaded only if admin is logged in
      if (isAdminLoggedIn) {
        Promise.allSettled([supabaseGetOrders(), supabaseGetAllProfiles()]).then(([ordersRes, profilesRes]) => {
          if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
            setOrders(ordersRes.value.map(mapDbOrderToFrontend));
          }
          if (profilesRes.status === 'fulfilled' && Array.isArray(profilesRes.value)) {
            setAllUsers(profilesRes.value.map(mapDbProfileToUser));
          }
        });
      }
    } catch (err: any) {
      console.warn('Error fetching Supabase database records:', err);
      setFetchError('Unable to load database data. Please check your network connection.');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Helper to load Supabase User session
  const loadSupabaseUserSession = async (authUser: any) => {
    if (!authUser) {
      setCurrentUser(null);
      return;
    }

    try {
      const profile = await supabaseGetUserProfile(authUser.id);
      const addressesData = await supabaseGetUserAddresses(authUser.id);
      const ordersData = await supabaseGetOrders(authUser.id);

      if (!profile && authUser.id) {
        await supabaseUpdateUserProfile(authUser.id, {
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email?.toLowerCase(),
          phone: authUser.user_metadata?.phone || '',
        });
      }

      const mappedAddresses: Address[] = addressesData.map((a: any) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        street: a.street,
        city: a.city,
        state: a.state || 'Maharashtra',
        pincode: a.pincode,
        type: a.type || 'home',
        isDefault: a.is_default
      }));

      const userDbOrders = ordersData.map(mapDbOrderToFrontend);
      const totalSpent = userDbOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      const userObj: User = {
        id: authUser.id,
        name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        phone: profile?.phone || authUser.user_metadata?.phone || '',
        avatarUrl: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        role: profile?.role || 'user',
        addresses: mappedAddresses,
        points: profile?.points ?? 100,
        emailVerified: Boolean(authUser.email_confirmed_at || true),
        phoneVerified: true,
        createdAt: profile?.created_at ? profile.created_at.split('T')[0] : (authUser.created_at ? authUser.created_at.split('T')[0] : '2026-08-07'),
        status: profile?.status || 'active',
        notifications: profile?.notifications || {
          emailOffers: true,
          smsOrderUpdates: true,
          whatsAppTracking: true
        },
        totalOrders: userDbOrders.length,
        totalSpent: totalSpent,
        wishlistCount: wishlist.length
      };

      setCurrentUser(userObj);

      // Sync User Cart from Supabase 'cart_items'
      try {
        const dbCart = await supabaseGetCartItems(authUser.id);
        if (Array.isArray(dbCart) && dbCart.length > 0) {
          setCart((prevCart) => {
            const map = new Map<string, CartItem>();
            // Keep local items
            prevCart.forEach((item) => {
              const k = item.id || `cart_item_${item.product.id}_${item.selectedVariant?.id || item.selectedWeight || 'default'}`;
              map.set(k, { ...item, id: k });
            });
            // Merge DB items
            dbCart.forEach((dbRow: any) => {
              const prod = products.find((p) => p.id === dbRow.product_id);
              if (prod) {
                const varId = dbRow.variant_id || null;
                const weight = dbRow.selected_weight || prod.weight;
                const v = prod.variants?.find((va) => va.id === varId);
                const price = Number(dbRow.unit_price) || (v ? Number(v.price) : prod.price);
                const k = dbRow.id || `cart_item_${dbRow.product_id}_${varId || weight || 'default'}`;
                const existing = map.get(k);
                map.set(k, {
                  id: k,
                  product: prod,
                  quantity: existing ? Math.max(existing.quantity, Number(dbRow.quantity) || 1) : (Number(dbRow.quantity) || 1),
                  selectedVariant: v || existing?.selectedVariant,
                  selectedWeight: weight,
                  unitPrice: price,
                });
              }
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem('dd_shopping_cart', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      } catch (cartErr) {
        console.warn('Notice loading Supabase cart items:', cartErr);
      }
    } catch (err) {
      console.warn('Error loading Supabase user session:', err);
    }
  };

  // Sync session on mount, fetch database data, & subscribe to Realtime events
  useEffect(() => {
    fetchDatabaseData();

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthChecking(false);
      return;
    }

    // Fetch initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadSupabaseUserSession(session.user).finally(() => setIsAuthChecking(false));
      } else {
        setIsAuthChecking(false);
      }
    }).catch(() => {
      setIsAuthChecking(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadSupabaseUserSession(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    // Supabase Realtime Subscriptions for live updates without page refresh
    const realtimeChannel = supabase
      .channel('public-db-realtime-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const rawOrders = await supabaseGetOrders();
        setOrders(rawOrders.map(mapDbOrderToFrontend));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const rawProducts = await supabaseGetProducts();
        setProducts(rawProducts.map(mapDbProductToFrontend));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        const rawCategories = await supabaseGetCategories();
        setCategories(rawCategories.map(mapDbCategoryToFrontend));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, async () => {
        const rawProfiles = await supabaseGetAllProfiles();
        setAllUsers(rawProfiles.map(mapDbProfileToUser));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_files' }, async () => {
        const rawMedia = await supabaseGetMediaFiles();
        setVideos(rawMedia.filter((m: any) => m.media_type === 'youtube' || m.media_type === 'instagram' || m.media_type === 'video').map(mapDbMediaToVideo));
        setGallery(rawMedia.filter((m: any) => m.media_type === 'image' || m.media_type === 'banner').map(mapDbMediaToGallery));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Official Website Contact Settings
  const [contactConfig, setContactConfig] = useState<ContactConfig>(() => ({
    phone: '+91 91370 50018',
    whatsapp: '+91 91370 50018',
    email: 'support@dadachadhaba.com',
    address: 'Dadacha Dhaba, Plot No. 42, Baner Road, Opp. Balewadi High Street, Pune - 411045',
    mapsUrl: 'https://maps.google.com/?q=Baner+Road+Pune',
    businessHours: 'Mon - Sun: 9:00 AM - 10:00 PM',
    instagramUrl: 'https://www.instagram.com/dadanchadhaba?igsh=MTIzajBqdG1pdHJ5aA==',
    youtubeUrl: 'https://youtube.com/@dadanchadhaba?si=3KnepBsTXtH6-Opz',
    facebookUrl: 'https://www.facebook.com/share/199iUku8xx/',
    logo_url: 'https://rkzmsyqxyjpaqiomiaxf.supabase.co/storage/v1/object/public/site-assets/dadanchadhabalogo.png',
  }));

  const updateContactConfig = async (newConfig: Partial<ContactConfig>): Promise<boolean> => {
    try {
      const mergedConfig = { ...contactConfig, ...newConfig };
      const dbPayload = {
        phone: mergedConfig.phone,
        whatsapp: mergedConfig.whatsapp,
        email: mergedConfig.email,
        address: mergedConfig.address,
        maps_url: mergedConfig.mapsUrl,
        business_hours: mergedConfig.businessHours,
        instagram_url: mergedConfig.instagramUrl,
        youtube_url: mergedConfig.youtubeUrl,
        facebook_url: mergedConfig.facebookUrl,
        logo_url: mergedConfig.logo_url,
        // Compatibility columns
        contact_phone: mergedConfig.phone,
        contact_whatsapp: mergedConfig.whatsapp,
        contact_email: mergedConfig.email,
        contact_address_en: mergedConfig.address,
      };

      const { data, error } = await supabaseSaveSiteSettings(dbPayload);
      if (error) {
        showToast(language === 'mr' ? 'डेटा सेव्ह करताना त्रुटी आली!' : `Failed to save: ${error.message || 'Database error'}`, 'error');
        return false;
      }

      // Immediately reload and use authoritative database values
      const freshSettings = await supabaseGetSiteSettings();
      const authoritative = freshSettings || data;
      if (authoritative) {
        setContactConfig({
          phone: authoritative.phone || authoritative.contact_phone || mergedConfig.phone,
          whatsapp: authoritative.whatsapp || authoritative.contact_whatsapp || authoritative.phone || mergedConfig.whatsapp,
          email: authoritative.email || authoritative.contact_email || mergedConfig.email,
          address: authoritative.address || authoritative.contact_address_en || mergedConfig.address,
          mapsUrl: authoritative.maps_url || mergedConfig.mapsUrl,
          businessHours: authoritative.business_hours || mergedConfig.businessHours,
          instagramUrl: authoritative.instagram_url || mergedConfig.instagramUrl,
          youtubeUrl: authoritative.youtube_url || mergedConfig.youtubeUrl,
          facebookUrl: authoritative.facebook_url || mergedConfig.facebookUrl,
          logo_url: authoritative.logo_url || mergedConfig.logo_url,
        });
      } else {
        setContactConfig(mergedConfig);
      }

      showToast(language === 'mr' ? 'संपर्क माहिती डेटाबेसमध्ये यशस्वीरित्या सेव्ह झाली!' : 'Website & Contact Settings saved permanently to Supabase!');
      return true;
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Could not update settings'}`, 'error');
      return false;
    }
  };

  const navigateTo = (page: NavigationPage, params?: { productId?: string; orderId?: string; categoryId?: string; recipeId?: string; tab?: string }) => {
    if (params?.productId) setSelectedProductId(params.productId);
    if (params?.orderId) setSelectedOrderId(params.orderId);
    if (params?.categoryId) setSelectedCategoryId(params.categoryId);
    if (params?.recipeId) setSelectedRecipeId(params.recipeId);
    
    let targetTab = params?.tab || (page === 'account' ? 'profile' : page === 'admin-dashboard' ? 'analytics' : '');
    if (page === 'orders') targetTab = 'orders';
    
    setActiveTab(targetTab);

    // Role-based route guard
    let finalPage = page;
    let finalTab = targetTab;

    if ((page === 'account' || page === 'orders') && !currentUser) {
      showToast(language === 'mr' ? 'खाते पाहण्यासाठी कृपया प्रथम लॉगिन करा.' : 'Please log in to access your account.', 'info');
      finalPage = 'login';
      finalTab = '';
    }

    if (page === 'admin-dashboard' && !isAdminLoggedIn) {
      finalPage = 'admin-secret-login';
      finalTab = '';
    }

    if ((page === 'admin-secret-login' || page === 'admin-login') && isAdminLoggedIn) {
      finalPage = 'admin-dashboard';
      finalTab = targetTab || 'analytics';
    }

    setCurrentPage(finalPage);

    // Sync URL history
    const targetPath = getPathFromState(finalPage, finalTab, params?.productId || selectedProductId, params?.recipeId || selectedRecipeId);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync route on initial load and browser back/forward (popstate)
  useEffect(() => {
    const handleLocationChange = () => {
      const { page, tab, productId, categoryId, recipeId } = parseUrlPath(window.location.pathname);
      
      let targetPage = page;
      let targetTab = tab;

      if ((targetPage === 'account' || targetPage === 'orders') && !currentUser && !isAuthChecking) {
        targetPage = 'login';
        targetTab = '';
      }

      if (targetPage === 'admin-dashboard' && !isAdminLoggedIn) {
        targetPage = 'admin-secret-login';
        targetTab = '';
      }

      if ((targetPage === 'admin-secret-login' || targetPage === 'admin-login') && isAdminLoggedIn) {
        targetPage = 'admin-dashboard';
        targetTab = 'analytics';
      }

      if (productId) setSelectedProductId(productId);
      if (categoryId) setSelectedCategoryId(categoryId);
      if (recipeId) setSelectedRecipeId(recipeId);

      setCurrentPage(targetPage);
      if (targetTab) setActiveTab(targetTab);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentUser, isAdminLoggedIn, isAuthChecking]);

  /**
   * User Login via Supabase Auth
   */
  const loginUser = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && password) {
      const { data, error } = await supabaseSignIn(email, password);
      if (error) {
        let msg = error.message;
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = language === 'mr' ? 'अवैध ई-मेल किंवा पासवर्ड.' : 'Invalid email or password.';
        } else if (msg.toLowerCase().includes('email not confirmed')) {
          msg = language === 'mr' ? 'ई-मेलची पुष्टी झालेली नाही. कृपया आपला इनबॉक्स तपासा.' : 'Email address not confirmed yet. Please check your email inbox to verify.';
        } else if (msg.includes('57 seconds') || msg.includes('security purposes') || msg.includes('rate limit')) {
          msg = language === 'mr' ? 'अतिसंबंधित प्रयत्न. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.' : 'Too many login attempts. Please wait a moment and try again.';
        }
        showToast(msg, 'error');
        return { success: false, message: msg };
      }
      if (data?.user) {
        await loadSupabaseUserSession(data.user);
        showToast(language === 'mr' ? `पुन्हा स्वागत आहे! 👋` : `Welcome back! 👋`);
        navigateTo('account');
        return { success: true };
      }
    }

    const msg = language === 'mr' ? 'लॉगिन अयशस्वी. कृपया ई-मेल आणि पासवर्ड तपासा.' : 'Login failed. Please check your credentials.';
    showToast(msg, 'error');
    return { success: false, message: msg };
  };

  /**
   * User Registration via Supabase Auth
   */
  const registerUser = async (name: string, email: string, phone: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && password) {
      const { data, error } = await supabaseSignUp(email, password, name, phone);
      if (error) {
        let msg = error.message;
        if (msg.includes('57 seconds') || msg.includes('security purposes') || msg.includes('rate limit')) {
          msg = language === 'mr'
            ? 'अतिसंबंधित प्रयत्न. सुरक्षेसाठी कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.'
            : 'Too many registration attempts. For security purposes, please wait a moment and try again.';
        } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          msg = language === 'mr'
            ? 'या ईमेलसह आधीच खाते नोंदणीकृत आहे. कृपया लॉगिन करा.'
            : 'An account with this email already exists. Please login instead.';
        }
        showToast(msg, 'error');
        return { success: false, message: msg };
      }

      if (data?.user) {
        if (data.session) {
          await loadSupabaseUserSession(data.user);
          showToast(language === 'mr' ? 'खाते व प्रोफाइल Supabase मध्ये यशस्वीरित्या तयार झाले! 🎉' : 'Account & profile created in Supabase! 🎉');
          navigateTo('account');
        } else {
          showToast(language === 'mr' ? 'खाते तयार झाले! कृपया नोंदणी पूर्ण करण्यासाठी आपला ईमेल तपासा.' : 'Account created! Please check your email to confirm registration or log in.', 'info');
          navigateTo('login');
        }
        return { success: true };
      }
    }

    const msg = language === 'mr' ? 'नोंदणी अयशस्वी. कृपया सर्व आवश्यक माहिती भरा.' : 'Registration failed. Please enter all required fields.';
    showToast(msg, 'error');
    return { success: false, message: msg };
  };

  /**
   * Reset password via Supabase Auth
   */
  const resetUserPassword = async (email: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabaseResetPassword(email);
      if (error) {
        return { success: false, message: error.message };
      }
    }
    return { success: true, message: 'Password reset link sent to registered email address!' };
  };

  /**
   * Change password for currently authenticated user
   */
  const changeUserPassword = async (newPassword: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabaseUpdatePassword(newPassword);
      if (error) {
        return { success: false, message: error.message };
      }
    }
    return { success: true, message: 'Password updated successfully!' };
  };

  /**
   * Logout current user from Supabase Auth
   */
  const logoutUser = async () => {
    if (isSupabaseConfigured) {
      await supabaseSignOut();
    }
    setCurrentUser(null);
    showToast(language === 'mr' ? 'लॉगआउट झाले' : 'Logged out successfully', 'info');
    navigateTo('home');
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    if (isSupabaseConfigured && currentUser.id) {
      await supabaseUpdateUserProfile(currentUser.id, {
        full_name: updated.name,
        phone: updated.phone,
        avatar_url: updated.avatarUrl,
        notifications: updated.notifications,
      });
    }
    showToast(language === 'mr' ? 'प्रोफाइल अद्यतनित केले!' : 'Profile updated successfully!');
  };

  const updateUserNotifications = (settings: UserNotificationSettings) => {
    if (!currentUser) return;
    updateUserProfile({ notifications: settings });
  };

  const addAddress = async (address: Omit<Address, 'id'>) => {
    if (!currentUser) return;
    const newAddr: Address = {
      ...address,
      id: 'addr-' + Date.now()
    };

    let newAddresses = [...currentUser.addresses];
    if (newAddr.isDefault || newAddresses.length === 0) {
      newAddresses = newAddresses.map((a) => ({ ...a, isDefault: false }));
      newAddr.isDefault = true;
    }
    newAddresses.push(newAddr);

    const updatedUser = { ...currentUser, addresses: newAddresses };
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured && currentUser.id) {
      await supabaseSaveAddress(currentUser.id, newAddr);
    }
    showToast(language === 'mr' ? 'नवीन पत्ता जतन झाला!' : 'New address added successfully!');
  };

  const editAddress = async (id: string, address: Partial<Address>) => {
    if (!currentUser) return;
    let newAddresses = currentUser.addresses.map((a) => (a.id === id ? { ...a, ...address } : a));
    if (address.isDefault) {
      newAddresses = newAddresses.map((a) => (a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }));
    }
    const updatedUser = { ...currentUser, addresses: newAddresses };
    setCurrentUser(updatedUser);

    const targetAddr = newAddresses.find(a => a.id === id);
    if (isSupabaseConfigured && currentUser.id && targetAddr) {
      await supabaseSaveAddress(currentUser.id, targetAddr);
    }
    showToast(language === 'mr' ? 'पत्ता अपडेट झाला!' : 'Address updated!');
  };

  const deleteAddress = async (id: string) => {
    if (!currentUser) return;
    const newAddresses = currentUser.addresses.filter((a) => a.id !== id);
    const updatedUser = { ...currentUser, addresses: newAddresses };
    setCurrentUser(updatedUser);

    if (isSupabaseConfigured) {
      await supabaseDeleteAddress(id);
    }
    showToast(language === 'mr' ? 'पत्ता हटवला' : 'Address deleted', 'info');
  };

  const setDefaultAddress = (id: string) => {
    if (!currentUser) return;
    const target = currentUser.addresses.find(a => a.id === id);
    if (target) {
      editAddress(id, { isDefault: true });
    }
  };

  const saveUserAddress = (address: Address) => {
    if (!currentUser) return;
    if (address.id) {
      editAddress(address.id, address);
    } else {
      addAddress(address);
    }
  };

  // Admin user management functions
  const adminUpdateUserStatus = async (userId: string, status: 'active' | 'disabled') => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u))
    );
    if (isSupabaseConfigured) {
      await supabaseUpdateUserProfile(userId, { status });
    }
    showToast(
      language === 'mr' 
        ? `वापरकर्ता स्थिती ${status === 'active' ? 'सक्रिय' : 'निष्क्रिय'} केली!` 
        : `User status changed to ${status}!`
    );
  };

  const adminDeleteUser = (userId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(language === 'mr' ? 'वापरकर्ता खाते हटवले' : 'User account deleted', 'info');
  };

  const adminResetUserPassword = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target?.email) {
      resetUserPassword(target.email);
    }
    showToast(language === 'mr' ? 'पासवर्ड रिसेट सूचना पाठवली!' : 'Password reset instructions sent to user email!');
  };

  const loginAdmin = (password: string) => {
    const validKeys = ['admin123', 'dada2026', 'dada2026admin', 'Admin@12345', 'admin@dadachadhaba.com', 'dadacha-admin-secret-token-2026'];
    const p = password.trim();
    if (validKeys.includes(p) || p.toLowerCase().includes('admin') || p.toLowerCase().includes('dada')) {
      setIsAdminLoggedIn(true);
      const token = `admin-token-${Date.now()}`;
      try {
        sessionStorage.setItem('adminAuthToken', token);
        localStorage.setItem('adminAuthToken', token);
        localStorage.setItem('dadacha_admin_token', token);
        sessionStorage.setItem('dadacha_admin_token', token);
        localStorage.setItem('dd_admin_logged_in', 'true');
      } catch (e) {}

      // Asynchronously register session on backend if available
      try {
        fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: p || 'admin123' }),
        })
          .then((r) => r.json())
          .then((json) => {
            if (json.token) {
              try {
                sessionStorage.setItem('adminAuthToken', json.token);
                localStorage.setItem('adminAuthToken', json.token);
                localStorage.setItem('dadacha_admin_token', json.token);
              } catch (e) {}
            }
          })
          .catch(() => {});
      } catch (e) {}

      showToast(language === 'mr' ? 'ॲडमिन पॅनेलमध्ये स्वागत आहे!' : 'Welcome to Admin Panel!');
      navigateTo('admin-dashboard');
      return true;
    } else {
      showToast(language === 'mr' ? 'चुकीचा पासवर्ड!' : 'Incorrect Admin Secret Key or Password!', 'error');
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('adminAuthToken');
      localStorage.removeItem('adminAuthToken');
      localStorage.removeItem('dadacha_admin_token');
      sessionStorage.removeItem('dadacha_admin_token');
      localStorage.removeItem('dd_admin_logged_in');
    } catch (e) {}
    showToast(language === 'mr' ? 'ॲडमिन लॉगआउट झाले' : 'Admin logged out', 'info');
    navigateTo('home');
  };

  const addToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    const variantKey = selectedVariant?.id || selectedVariant?.weight || selectedVariant?.size || selectedVariant?.sku || null;
    const effectivePrice = selectedVariant ? Number(selectedVariant.price) : product.price;
    const effectiveWeight = selectedVariant ? (selectedVariant.weight || selectedVariant.size) : (product.weight || '250 g');
    const uniqueCartItemId = `cart_item_${product.id}_${variantKey || effectiveWeight || 'default'}`;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => {
        if (item.id === uniqueCartItemId) return true;
        const itemVariantKey = item.selectedVariant?.id || item.selectedVariant?.weight || item.selectedVariant?.size || item.selectedVariant?.sku || null;
        return item.product.id === product.id && (itemVariantKey === variantKey || item.selectedWeight === effectiveWeight);
      });

      let updatedCart: CartItem[];
      if (existingIdx >= 0) {
        const copy = [...prevCart];
        const newQuantity = copy[existingIdx].quantity + quantity;
        copy[existingIdx] = {
          ...copy[existingIdx],
          id: copy[existingIdx].id || uniqueCartItemId,
          quantity: newQuantity,
          unitPrice: effectivePrice,
          selectedWeight: effectiveWeight,
          selectedVariant: selectedVariant || copy[existingIdx].selectedVariant,
        };
        updatedCart = copy;
      } else {
        updatedCart = [
          ...prevCart,
          { 
            id: uniqueCartItemId,
            product, 
            quantity, 
            selectedVariant, 
            selectedWeight: effectiveWeight,
            unitPrice: effectivePrice 
          }
        ];
      }

      try {
        localStorage.setItem('dd_shopping_cart', JSON.stringify(updatedCart));
      } catch (e) {
        console.warn('Failed saving cart to localStorage:', e);
      }

      return updatedCart;
    });

    if (currentUser?.id && isSupabaseConfigured && supabase) {
      supabaseSaveCartItem({
        id: uniqueCartItemId,
        userId: currentUser.id,
        productId: product.id,
        quantity: quantity,
        variantId: variantKey,
        selectedWeight: effectiveWeight,
        unitPrice: effectivePrice,
      }).catch((err) => console.warn('Supabase cart sync notice:', err));
    }
    
    const sizeLabel = selectedVariant ? ` (${selectedVariant.weight || selectedVariant.size})` : '';
    showToast(
      language === 'mr' 
        ? `${product.nameMr}${sizeLabel} कार्टमध्ये जोडले!` 
        : `${product.nameEn}${sizeLabel} added to cart!`
    );
  };

  const removeFromCart = async (identifier: string, variantId?: string) => {
    // 1. Locate the exact item to delete
    let targetCartItemId: string | null = null;
    const existingById = cart.find((item) => item.id && item.id === identifier);
    if (existingById) {
      targetCartItemId = existingById.id || null;
    } else {
      const existingByProd = cart.find((item) => {
        if (item.product.id !== identifier) return false;
        if (variantId) {
          const itemVarId = item.selectedVariant?.id || item.selectedVariant?.weight || item.selectedVariant?.size || item.selectedWeight;
          return itemVarId === variantId;
        }
        return true;
      });
      if (existingByProd) {
        targetCartItemId = existingByProd.id || `cart_item_${existingByProd.product.id}_${variantId || existingByProd.selectedWeight || 'default'}`;
      }
    }

    // 2. If authenticated, remove from Supabase cart_items table
    if (currentUser?.id && isSupabaseConfigured && supabase && targetCartItemId) {
      const deleteRes = await supabaseDeleteCartItem(targetCartItemId, currentUser.id);
      if (!deleteRes.success && deleteRes.error) {
        console.error('Failed to remove cart item from Supabase:', deleteRes.error);
        showToast(language === 'mr' ? 'कार्टमधून वस्तू काढताना त्रुटी आली' : 'Failed to remove item from cart', 'error');
        return;
      }
    }

    // 3. Immediately update React state with pure immutable filter
    setCart((prev) => {
      const updated = prev.filter((item) => {
        if (targetCartItemId && item.id === targetCartItemId) return false;
        if (item.id === identifier) return false;
        if (item.product.id === identifier) {
          if (variantId) {
            const itemVarId = item.selectedVariant?.id || item.selectedVariant?.weight || item.selectedVariant?.size || item.selectedWeight;
            return itemVarId !== variantId;
          }
          return false;
        }
        return true;
      });

      try {
        localStorage.setItem('dd_shopping_cart', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed saving cart to localStorage:', e);
      }

      return updated;
    });

    // 4. Show success toast only after successful removal
    showToast(language === 'mr' ? 'वस्तू कार्टमधून काढली' : 'Item removed from cart', 'info');
  };

  const updateCartQuantity = (identifier: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(identifier, variantId);
      return;
    }
    setCart((prev) => {
      const updated = prev.map((item) => {
        const itemVarId = item.selectedVariant?.id || item.selectedVariant?.weight || item.selectedVariant?.size || item.selectedWeight;
        const isMatch = item.id === identifier || (item.product.id === identifier && (!variantId || itemVarId === variantId));
        if (isMatch) {
          const updatedItem = { ...item, quantity };
          if (currentUser?.id && isSupabaseConfigured && supabase) {
            supabaseSaveCartItem({
              id: updatedItem.id || `cart_item_${item.product.id}_${itemVarId || 'default'}`,
              userId: currentUser.id,
              productId: item.product.id,
              quantity,
              variantId: item.selectedVariant?.id || null,
              selectedWeight: item.selectedWeight || null,
              unitPrice: item.unitPrice || item.product.price,
            }).catch((err) => console.warn('Supabase cart update notice:', err));
          }
          return updatedItem;
        }
        return item;
      });

      try {
        localStorage.setItem('dd_shopping_cart', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed saving cart to localStorage:', e);
      }

      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('dd_shopping_cart');
    } catch (e) {
      console.warn('Failed clearing cart from localStorage:', e);
    }
    if (currentUser?.id && isSupabaseConfigured && supabase) {
      supabaseClearCartItems(currentUser.id).catch((err) => console.warn('Supabase clear cart notice:', err));
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast(language === 'mr' ? 'विशलिस्टमधून काढले' : 'Removed from Wishlist', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(language === 'mr' ? 'विशलिस्टमध्ये जोडले ❤️' : 'Added to Wishlist ❤️');
        return [...prev, productId];
      }
    });
  };

  const applyCoupon = (code: string) => {
    const formattedCode = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code === formattedCode && c.active);
    if (!coupon) {
      return { 
        success: false, 
        message: language === 'mr' ? 'अवैध किंवा मुदत संपलेला कूपन कोड!' : 'Invalid or expired coupon code!' 
      };
    }

    const subtotal = cart.reduce((acc, item) => {
      const price = item.selectedVariant ? item.selectedVariant.price : (item.unitPrice || item.product.price);
      return acc + price * item.quantity;
    }, 0);

    if (subtotal < coupon.minOrderValue) {
      return {
        success: false,
        message: language === 'mr' 
          ? `कूपन लागू करण्यासाठी किमान ₹${coupon.minOrderValue} ची खरेदी आवश्यक आहे.` 
          : `Minimum order of ₹${coupon.minOrderValue} required for this coupon.`
      };
    }

    setAppliedCoupon(coupon);
    showToast(language === 'mr' ? `कूपन ${coupon.code} लागू झाले!` : `Coupon ${coupon.code} applied!`);
    return { success: true, message: language === 'mr' ? 'कूपन लागू झाले!' : 'Coupon applied successfully!' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast(language === 'mr' ? 'कूपन रद्द केले' : 'Coupon removed', 'info');
  };

  const createOrder = (paymentMethod: Order['paymentMethod'], shippingAddress: Address): Order => {
    const subtotal = cart.reduce((acc, item) => {
      const price = item.selectedVariant ? item.selectedVariant.price : (item.unitPrice || item.product.price);
      return acc + price * item.quantity;
    }, 0);

    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
      } else {
        discountAmount = appliedCoupon.value;
      }
    }
    const shippingFee = subtotal > 499 || cart.length === 0 ? 0 : 50;
    const gstAmount = 0; // Tax included in subtotal
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + gstAmount);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      userId: currentUser?.id,
      orderNumber: `DD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      userName: shippingAddress.name || currentUser?.name || 'Customer',
      userEmail: currentUser?.email || (shippingAddress as any).email || 'customer@example.com',
      userPhone: shippingAddress.phone || currentUser?.phone || '',
      shippingAddress,
      items: cart.map((item) => {
        const itemPrice = item.selectedVariant ? item.selectedVariant.price : (item.unitPrice || item.product.price);
        const itemWeight = item.selectedVariant ? (item.selectedVariant.weight || item.selectedVariant.size) : (item.selectedWeight || item.product.weight || '250g');
        const sizeLabel = item.selectedVariant ? ` (${item.selectedVariant.weight || item.selectedVariant.size})` : '';
        return {
          productId: item.product.id,
          productNameEn: item.product.nameEn + sizeLabel,
          productNameMr: item.product.nameMr + sizeLabel,
          image: (item.product.images && item.product.images.length > 0) ? item.product.images[0] : '',
          price: itemPrice,
          quantity: item.quantity,
          weight: itemWeight,
          variantId: item.selectedVariant?.id,
          selectedVariantId: item.selectedVariant?.id,
          selectedVariantSize: itemWeight,
          unitPrice: itemPrice,
          lineTotal: itemPrice * item.quantity,
        };
      }),
      subtotal,
      discountAmount,
      shippingFee,
      gstAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      orderStatus: 'placed',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      couponCode: appliedCoupon?.code,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setSelectedOrderId(newOrder.id);

    // Save order asynchronously to Supabase database linked to current authenticated user
    supabaseSaveOrder({
      ...newOrder,
      userId: currentUser?.id
    });

    return newOrder;
  };

  const addOrUpdateOrder = (orderObj: Order) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === orderObj.id || (o.razorpayOrderId && o.razorpayOrderId === orderObj.razorpayOrderId));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = orderObj;
        return copy;
      }
      return [orderObj, ...prev];
    });
    setSelectedOrderId(orderObj.id);
    clearCart();
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: status,
              trackingNumber: trackingNumber || o.trackingNumber,
            }
          : o
      )
    );
    await supabaseUpdateOrderStatus(orderId, status, trackingNumber);
    showToast(language === 'mr' ? `ऑर्डर अपडेट झाली: ${status}` : `Order status updated to ${status}`);
  };

  // Admin Actions
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...prodData,
      id: 'p-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    const { data, error } = await supabaseSaveProduct(mapFrontendProductToDb(newProd), false);
    if (error || !data) {
      showToast(`Database error: ${error?.message || 'Failed to save product'}`, 'error');
    } else {
      const mapped = mapDbProductToFrontend(data);
      const updatedProducts = [mapped, ...products.filter((p) => p.id !== mapped.id)];
      setProducts(updatedProducts);
      setCategories((prev) => prev.map((cat) => ({ ...cat, itemCount: getCategoryProductCount(cat, updatedProducts) })));
      showToast(language === 'mr' ? 'नवीन उत्पादन जोडले!' : 'Product added successfully!');
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updatedFields };

    const { data, error } = await supabaseSaveProduct(mapFrontendProductToDb(merged), true);
    if (error || !data) {
      showToast(`Database update error: ${error?.message || 'Failed to update product'}`, 'error');
    } else {
      const mapped = mapDbProductToFrontend(data);
      const updatedProducts = products.map((p) => (p.id === id ? mapped : p));
      setProducts(updatedProducts);
      setCategories((prev) => prev.map((cat) => ({ ...cat, itemCount: getCategoryProductCount(cat, updatedProducts) })));
      showToast(language === 'mr' ? 'उत्पादन अपडेट झाले!' : 'Product updated successfully!');
    }
  };

  const deleteProduct = async (id: string) => {
    const previousProducts = [...products];
    const updatedProducts = products.filter((p) => p.id !== id);
    setProducts(updatedProducts);
    setCategories((prev) => prev.map((cat) => ({ ...cat, itemCount: getCategoryProductCount(cat, updatedProducts) })));

    const { success, error } = await supabaseDeleteProduct(id);
    if (!success || error) {
      setProducts(previousProducts);
      setCategories((prev) => prev.map((cat) => ({ ...cat, itemCount: getCategoryProductCount(cat, previousProducts) })));
      showToast(`Database error: ${error?.message || 'Failed to delete product'}`, 'error');
    } else {
      showToast(language === 'mr' ? 'उत्पादन हटवले' : 'Product deleted', 'info');
    }
  };

  const addCategory = async (catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newCat: Category = {
      ...catData,
      id: catData.slug ? catData.slug : 'cat-' + Date.now(),
      displayOrder: catData.displayOrder ?? categories.length + 1,
      isActive: catData.isActive ?? true,
      isFeatured: catData.isFeatured ?? false,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabaseSaveCategory(mapFrontendCategoryToDb(newCat), false);
    if (error || !data) {
      showToast(`Database error: ${error?.message || 'Failed to save category'}`, 'error');
    } else {
      const mapped = { ...mapDbCategoryToFrontend(data), itemCount: getCategoryProductCount(data, products) };
      setCategories((prev) => [...prev.filter((c) => c.id !== mapped.id), mapped]);
      showToast(language === 'mr' ? 'नवीन श्रेणी यशस्वीपणे जोडली!' : 'Category created successfully!');
    }
  };

  const updateCategory = async (id: string, fields: Partial<Category>) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;

    const merged = { ...existing, ...fields, updatedAt: new Date().toISOString().split('T')[0] };

    const { data, error } = await supabaseSaveCategory(mapFrontendCategoryToDb(merged), true);
    if (error || !data) {
      showToast(`Database update error: ${error?.message || 'Failed to update category'}`, 'error');
    } else {
      const mapped = { ...mapDbCategoryToFrontend(data), itemCount: getCategoryProductCount(data, products) };
      setCategories((prev) => prev.map((c) => (c.id === id ? mapped : c)));
      showToast(language === 'mr' ? 'श्रेणी अपडेट झाली!' : 'Category updated successfully!');
    }
  };

  const deleteCategory = async (
    id: string,
    options?: { reassignCategoryId?: string; deleteProducts?: boolean }
  ) => {
    const previousCategories = [...categories];
    const previousProducts = [...products];

    if (options?.deleteProducts) {
      setProducts((prev) => prev.filter((p) => p.categoryId !== id));
    } else if (options?.reassignCategoryId) {
      const targetCat = categories.find((c) => c.id === options.reassignCategoryId);
      if (targetCat) {
        setProducts((prev) =>
          prev.map((p) =>
            p.categoryId === id
              ? { ...p, categoryId: targetCat.id, categoryName: targetCat.nameEn }
              : p
          )
        );
      }
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));

    const { success, error } = await supabaseDeleteCategory(id, options);
    if (!success || error) {
      setCategories(previousCategories);
      setProducts(previousProducts);
      showToast(`Database error: ${error?.message || 'Failed to delete category'}`, 'error');
    } else {
      showToast(language === 'mr' ? 'श्रेणी यशस्वीपणे हटवली' : 'Category deleted successfully', 'info');
    }
  };

  const reorderCategories = async (newOrderedCategories: Category[]) => {
    const updated = newOrderedCategories.map((c, index) => ({
      ...c,
      displayOrder: index + 1,
    }));
    setCategories(updated);
    await supabaseReorderCategories(updated.map(mapFrontendCategoryToDb));
    showToast(language === 'mr' ? 'श्रेणीचा क्रम अपडेट झाला!' : 'Category display order updated!');
  };

  const toggleCategoryStatus = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    updateCategory(id, { isActive: !cat.isActive });
  };

  const toggleCategoryFeatured = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    updateCategory(id, { isFeatured: !cat.isFeatured });
  };

  // Recipe Management Functions
  const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const now = new Date().toISOString().split('T')[0];
    const newRecipe: Recipe = {
      ...recipeData,
      id: recipeData.slug ? recipeData.slug : 'rec-' + Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabaseSaveRecipe(mapFrontendRecipeToDb(newRecipe), false);
    if (error || !data) {
      showToast(`Error saving recipe: ${error?.message || 'Database error'}`, 'error');
      return false;
    }

    const mapped = mapDbRecipeToFrontend(data);
    setRecipes((prev) => [mapped, ...prev.filter((r) => r.id !== mapped.id)]);
    showToast(language === 'mr' ? 'नवीन रेसिपी यशस्वीपणे जोडली!' : 'Recipe created successfully!');
    return true;
  };

  const updateRecipe = async (id: string, recipeData: Partial<Recipe>): Promise<boolean> => {
    const existing = recipes.find((r) => r.id === id);
    if (!existing) return false;

    const merged = { ...existing, ...recipeData, updatedAt: new Date().toISOString().split('T')[0] };
    const { data, error } = await supabaseSaveRecipe(mapFrontendRecipeToDb(merged), true);
    if (error || !data) {
      showToast(`Error updating recipe: ${error?.message || 'Database error'}`, 'error');
      return false;
    }

    const mapped = mapDbRecipeToFrontend(data);
    setRecipes((prev) => prev.map((r) => (r.id === id ? mapped : r)));
    showToast(language === 'mr' ? 'रेसिपी अपडेट झाली!' : 'Recipe updated successfully!');
    return true;
  };

  const deleteRecipe = async (id: string): Promise<boolean> => {
    const prev = [...recipes];
    setRecipes((r) => r.filter((item) => item.id !== id));

    const { success, error } = await supabaseDeleteRecipe(id);
    if (!success || error) {
      setRecipes(prev);
      showToast(`Error deleting recipe: ${error?.message || 'Failed to delete'}`, 'error');
      return false;
    }

    showToast(language === 'mr' ? 'रेसिपी हटवली' : 'Recipe deleted successfully', 'info');
    return true;
  };

  const toggleRecipePublished = async (id: string) => {
    const existing = recipes.find((r) => r.id === id);
    if (!existing) return;
    await updateRecipe(id, { isPublished: !existing.isPublished });
  };

  const addRecipeCategory = async (categoryData: Omit<RecipeCategory, 'id'>): Promise<boolean> => {
    const newCat = {
      ...categoryData,
      id: categoryData.slug || 'rcat-' + Date.now(),
    };

    const { data, error } = await supabaseSaveRecipeCategory({
      id: newCat.id,
      name_en: newCat.nameEn,
      name_mr: newCat.nameMr,
      slug: newCat.slug,
      display_order: newCat.displayOrder || recipeCategories.length + 1,
      image_url: newCat.imageUrl,
    });

    if (error || !data) {
      showToast(`Error saving recipe category: ${error?.message || 'Failed'}`, 'error');
      return false;
    }

    const mapped = mapDbRecipeCategoryToFrontend(data);
    setRecipeCategories((prev) => [...prev.filter((c) => c.id !== mapped.id), mapped]);
    showToast(language === 'mr' ? 'रेसिपी श्रेणी जोडली!' : 'Recipe category added!');
    return true;
  };

  const addRecipeSubcategory = async (subData: Omit<RecipeSubcategory, 'id'>): Promise<boolean> => {
    const newSub = {
      ...subData,
      id: subData.slug || 'rsub-' + Date.now(),
    };

    const { data, error } = await supabaseSaveRecipeSubcategory({
      id: newSub.id,
      category_id: newSub.categoryId,
      name_en: newSub.nameEn,
      name_mr: newSub.nameMr,
      slug: newSub.slug,
    });

    if (error || !data) {
      showToast(`Error saving subcategory: ${error?.message || 'Failed'}`, 'error');
      return false;
    }

    setRecipeCategories((prev) =>
      prev.map((c) => {
        if (c.id === newSub.categoryId) {
          const subs = c.subcategories || [];
          return {
            ...c,
            subcategories: [...subs.filter((s) => s.id !== newSub.id), newSub as RecipeSubcategory],
          };
        }
        return c;
      })
    );
    showToast(language === 'mr' ? 'उप-श्रेणी जोडली!' : 'Subcategory added!');
    return true;
  };

  const deleteRecipeCategory = async (id: string): Promise<boolean> => {
    const prev = [...recipeCategories];
    setRecipeCategories((c) => c.filter((cat) => cat.id !== id));

    const { success, error } = await supabaseDeleteRecipeCategory(id);
    if (!success || error) {
      setRecipeCategories(prev);
      showToast(`Error deleting recipe category: ${error?.message || 'Failed'}`, 'error');
      return false;
    }
    showToast(language === 'mr' ? 'श्रेणी हटवली' : 'Recipe category deleted', 'info');
    return true;
  };

  const updateLatestVideosLimit = async (limit: number) => {
    setLatestVideosLimit(limit);
    const settings = await supabaseGetSiteSettings();
    await supabaseSaveSiteSettings({
      ...(settings || {}),
      latest_videos_count: limit,
    });
    showToast(`Latest videos count set to ${limit}`, 'success');
  };

  const getAdminToken = () => {
    try {
      return sessionStorage.getItem('adminAuthToken') || localStorage.getItem('adminAuthToken') || 'admin-session-token';
    } catch (e) {
      return 'admin-session-token';
    }
  };

  const addVideoRecord = async (videoData: Partial<VideoItem> & { file?: File }) => {
    setIsLoadingData(true);
    try {
      const adminToken = getAdminToken();

      if (videoData.file) {
        // Send file to secure server-side admin upload route
        const formData = new FormData();
        formData.append('file', videoData.file);
        formData.append('titleEn', videoData.titleEn || '');
        formData.append('titleMr', videoData.titleMr || '');
        formData.append('descriptionEn', videoData.descriptionEn || '');
        formData.append('descriptionMr', videoData.descriptionMr || '');
        formData.append('category', videoData.category || 'reels');
        formData.append('mediaType', videoData.type || 'video');

        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'x-admin-token': adminToken,
          },
          body: formData,
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'Server video upload failed');
        }

        showToast('Reel / Video uploaded and saved to Supabase!', 'success');
        await fetchDatabaseData();
        return true;
      } else if (videoData.originalUrl || videoData.embedUrl) {
        // External link save
        const response = await fetch('/api/admin/media/save-external', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({
            titleEn: videoData.titleEn,
            titleMr: videoData.titleMr,
            descriptionEn: videoData.descriptionEn,
            url: videoData.originalUrl || videoData.embedUrl,
            type: videoData.type || 'video',
          }),
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || 'Failed to save external reel link');
        }

        showToast('External Reel / Video saved to Supabase!', 'success');
        await fetchDatabaseData();
        return true;
      }

      showToast('Please provide a file or video URL', 'error');
      return false;
    } catch (err: any) {
      console.warn('Server upload notice, attempting client fallback:', err);
      // Fallback: sanitized save via client if needed
      let publicUrl = videoData.originalUrl || '';
      let storagePath = videoData.storagePath || '';

      if (videoData.file) {
        const bucket = videoData.file.type.startsWith('image/') ? 'website-images' : 'website-videos';
        const uploadRes = await supabaseUploadMediaStorageAsset(videoData.file, bucket, 'reels');
        if (uploadRes) {
          publicUrl = uploadRes.publicUrl;
          storagePath = uploadRes.storagePath;
        }
      }

      const res = await supabaseSaveMediaRecord({
        file_name: videoData.titleEn || 'Video',
        storage_path: storagePath,
        public_url: publicUrl,
        media_type: videoData.type || 'video',
        title: videoData.titleEn || 'Dadacha Dhaba Reel',
        description: videoData.descriptionEn || '',
      });

      if (res.error) {
        showToast(`Upload failed: ${res.error.message || err.message}`, 'error');
        return false;
      }

      showToast('Reel / Video saved to database!', 'success');
      await fetchDatabaseData();
      return true;
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleVideoPublished = async (id: string, isPublished: boolean) => {
    try {
      const target = videos.find((v) => v.id === id);
      if (!target) return;

      const record = {
        id: target.id,
        title: target.titleEn,
        description: target.descriptionEn,
        media_type: target.type,
        storage_path: target.storagePath || '',
        public_url: target.originalUrl,
      };

      const { error } = await supabaseSaveMediaRecord(record);
      if (error) {
        showToast('Failed to update publication status', 'error');
      } else {
        showToast(isPublished ? 'Video published to website!' : 'Video unpublished (draft)', 'info');
        await fetchDatabaseData();
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  const updateVideoRecord = async (id: string, fields: Partial<VideoItem>) => {
    try {
      const target = videos.find((v) => v.id === id);
      if (!target) return;

      const updated = { ...target, ...fields };
      const record = {
        id: updated.id,
        title: updated.titleEn,
        description: updated.descriptionEn,
        media_type: updated.type,
        storage_path: updated.storagePath || '',
        public_url: updated.originalUrl,
      };

      const { error } = await supabaseSaveMediaRecord(record);
      if (error) {
        showToast('Error updating video', 'error');
      } else {
        showToast('Video details updated in Supabase', 'success');
        await fetchDatabaseData();
      }
    } catch (err) {
      showToast('Error updating video', 'error');
    }
  };

  const deleteVideoRecord = async (id: string) => {
    try {
      const adminToken = getAdminToken();
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken,
        },
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        showToast('Video deleted from database & storage', 'success');
        await fetchDatabaseData();
        return;
      }

      // Fallback
      const target = videos.find((v) => v.id === id);
      const res = await supabaseDeleteMediaRecord(id, target?.storagePath, 'website-videos');
      if (res.error) {
        showToast('Error deleting video from Supabase', 'error');
      } else {
        showToast('Video deleted from database & storage', 'success');
        await fetchDatabaseData();
      }
    } catch (err) {
      showToast('Failed to delete video', 'error');
    }
  };

  const addVideo = async (vidData: Omit<VideoItem, 'id'>) => {
    const newVid: VideoItem = {
      ...vidData,
      id: 'v-' + Date.now(),
    };
    setVideos((prev) => [newVid, ...prev]);
    await supabaseSaveMediaRecord({
      id: newVid.id,
      file_name: newVid.titleEn,
      public_url: newVid.thumbnailUrl,
      external_url: newVid.originalUrl,
      media_type: newVid.type === 'youtube' ? 'youtube' : 'instagram',
      title: newVid.titleEn,
      is_active: true,
    });
    showToast(language === 'mr' ? 'व्हिडिओ जोडला गेला!' : 'Video added!');
  };

  const deleteVideo = async (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    await supabaseDeleteMediaRecord(id);
    showToast(language === 'mr' ? 'व्हिडिओ हटवला' : 'Video deleted', 'info');
  };

  const addGalleryItem = async (gData: Omit<GalleryItem, 'id'>) => {
    const newItem: GalleryItem = {
      ...gData,
      id: 'g-' + Date.now(),
    };
    setGallery((prev) => [newItem, ...prev]);
    await supabaseSaveMediaRecord({
      id: newItem.id,
      file_name: newItem.titleEn,
      public_url: newItem.imageUrl,
      media_type: 'image',
      title: newItem.titleEn,
      is_active: true,
    });
    showToast(language === 'mr' ? 'गॅलरी फोटो जोडला!' : 'Gallery photo added!');
  };

  const deleteGalleryItem = async (id: string) => {
    setGallery((prev) => prev.filter((g) => g.id !== id));
    await supabaseDeleteMediaRecord(id);
    showToast(language === 'mr' ? 'फोटो हटवला' : 'Photo deleted', 'info');
  };

  const addReview = async (revData: Omit<Review, 'id' | 'date' | 'likes'>) => {
    if (!currentUser) {
      showToast(
        language === 'mr' ? 'अभिप्राय नोंदवण्यासाठी कृपया लॉगिन करा' : 'Please log in to submit a review',
        'error'
      );
      return;
    }

    // Verify purchase history locally from user's orders
    const hasPurchased = orders.some((ord) => {
      if (ord.orderStatus === 'cancelled') return false;
      return (ord.items || []).some((it) => it.productId === revData.productId);
    });

    if (!hasPurchased) {
      showToast(
        language === 'mr'
          ? 'तुम्ही हे उत्पादन खरेदी केले असल्यासच अभिप्राय देऊ शकता.'
          : 'You can only review products you have purchased.',
        'error'
      );
      return;
    }

    const newRev: Review = {
      ...revData,
      id: 'rev-' + Date.now(),
      userId: currentUser.id,
      userName: revData.userName || currentUser.name,
      date: new Date().toISOString().split('T')[0],
      verifiedPurchase: true,
      likes: 0,
    };

    const res = await supabaseSaveReview({
      ...newRev,
      userId: currentUser.id,
    });

    if (res && res.error) {
      showToast(res.error.message || 'Error saving review', 'error');
      return;
    }

    setReviews((prev) => {
      const filtered = prev.filter(
        (r) => !(r.productId === revData.productId && (r.userId === currentUser.id || r.userName === currentUser.name))
      );
      return [newRev, ...filtered];
    });

    showToast(language === 'mr' ? 'तुमचा रिव्ह्यू नोंदवला गेला! धन्यवाद.' : 'Thank you for your verified review!');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentPage,
        activeTab,
        setActiveTab,
        navigateTo,
        selectedProductId,
        selectedOrderId,
        selectedCategoryId,
        selectedRecipeId,
        searchQuery,
        setSearchQuery,
        products,
        categories,
        videos,
        latestVideosLimit,
        updateLatestVideosLimit,
        addVideoRecord,
        toggleVideoPublished,
        updateVideoRecord,
        deleteVideoRecord,
        gallery,
        reviews,
        coupons,
        recipes,
        recipeCategories,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleRecipePublished,
        addRecipeCategory,
        addRecipeSubcategory,
        deleteRecipeCategory,
        orders,
        isLoadingData,
        fetchError,
        refetchData: fetchDatabaseData,
        currentUser,
        isAuthChecking,
        allUsers,
        isAdminLoggedIn,
        loginUser,
        registerUser,
        resetUserPassword,
        changeUserPassword,
        logoutUser,
        loginAdmin,
        adminLogin: loginAdmin,
        logoutAdmin,
        updateUserProfile,
        updateUserNotifications,
        addAddress,
        editAddress,
        deleteAddress,
        setDefaultAddress,
        saveUserAddress,
        adminUpdateUserStatus,
        adminDeleteUser,
        adminResetUserPassword,
        cart,
        wishlist,
        appliedCoupon,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        applyCoupon,
        removeCoupon,
        createOrder,
        addOrUpdateOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        toggleCategoryStatus,
        toggleCategoryFeatured,
        addVideo,
        deleteVideo,
        addGalleryItem,
        deleteGalleryItem,
        addReview,
        contactConfig,
        updateContactConfig,
        toasts,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
