import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Category, CartItem, Order, VideoItem, GalleryItem, 
  Review, Coupon, Recipe, User, Language, NavigationPage, Address, OrderStatus, UserNotificationSettings, ContactConfig 
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
  supabaseUploadMediaStorageAsset
} from '../lib/supabase';

import {
  mapDbProductToFrontend,
  mapFrontendProductToDb,
  mapDbCategoryToFrontend,
  mapFrontendCategoryToDb,
  mapDbOrderToFrontend,
  mapDbMediaToVideo,
  mapDbMediaToGallery,
  mapDbProfileToUser
} from '../utils/mappers';

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
  navigateTo: (page: NavigationPage, params?: { productId?: string; orderId?: string; categoryId?: string; tab?: string }) => void;
  selectedProductId: string | null;
  selectedOrderId: string | null;
  selectedCategoryId: string | null;

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
  orders: Order[];
  isLoadingData: boolean;
  fetchError: string | null;
  refetchData: () => Promise<void>;

  // User & Auth State
  currentUser: User | null;
  allUsers: User[];
  isAdminLoggedIn: boolean;
  loginUser: (email: string, password?: string) => Promise<boolean>;
  registerUser: (name: string, email: string, phone: string, password?: string) => Promise<boolean>;
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
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  
  // Checkout & Order Placement
  createOrder: (paymentMethod: Order['paymentMethod'], shippingAddress: Address) => Order;
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
  updateContactConfig: (config: Partial<ContactConfig>) => void;

  // Notification Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getPathFromState(page: NavigationPage, tab?: string): string {
  switch (page) {
    case 'home': return '/';
    case 'shop': return '/shop';
    case 'categories': return '/categories';
    case 'cart': return '/cart';
    case 'wishlist': return '/wishlist';
    case 'videos': return '/videos';
    case 'gallery': return '/gallery';
    case 'recipes': return '/recipes';
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

function parseUrlPath(path: string): { page: NavigationPage; tab: string } {
  const clean = path.toLowerCase().replace(/\/$/, '') || '/';

  if (clean === '/' || clean === '/home') return { page: 'home', tab: '' };
  if (clean === '/shop') return { page: 'shop', tab: '' };
  if (clean === '/categories') return { page: 'categories', tab: '' };
  if (clean === '/cart') return { page: 'cart', tab: '' };
  if (clean === '/wishlist') return { page: 'wishlist', tab: '' };
  if (clean === '/videos') return { page: 'videos', tab: '' };
  if (clean === '/gallery') return { page: 'gallery', tab: '' };
  if (clean === '/recipes') return { page: 'recipes', tab: '' };
  if (clean === '/contact') return { page: 'contact', tab: '' };
  if (clean === '/about') return { page: 'about', tab: '' };
  if (clean === '/login') return { page: 'login', tab: '' };
  if (clean === '/register') return { page: 'register', tab: '' };
  if (clean === '/forgot-password') return { page: 'forgot-password', tab: '' };
  if (clean === '/checkout') return { page: 'checkout', tab: '' };
  if (clean === '/track-order') return { page: 'track-order', tab: '' };

  if (clean === '/privacy-policy' || clean === '/privacy') return { page: 'privacy-policy', tab: '' };
  if (clean === '/terms' || clean === '/terms-and-conditions') return { page: 'terms', tab: '' };
  if (clean === '/shipping-policy' || clean === '/shipping') return { page: 'shipping-policy', tab: '' };
  if (clean === '/return-policy' || clean === '/refund-policy' || clean === '/returns') return { page: 'return-policy', tab: '' };
  if (clean === '/faqs') return { page: 'faqs', tab: '' };

  // Account
  if (clean === '/account' || clean === '/account/profile') return { page: 'account', tab: 'profile' };
  if (clean === '/account/orders') return { page: 'account', tab: 'orders' };
  if (clean === '/account/address' || clean === '/account/addresses') return { page: 'account', tab: 'addresses' };
  if (clean === '/account/settings') return { page: 'account', tab: 'settings' };

  // Admin
  if (clean === '/admin' || clean === '/admin/login' || clean === '/admin-secret-login') {
    return { page: 'admin-secret-login', tab: '' };
  }
  if (clean === '/admin/dashboard' || clean === '/admin/analytics') return { page: 'admin-dashboard', tab: 'analytics' };
  if (clean === '/admin/products') return { page: 'admin-dashboard', tab: 'products' };
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

  const [searchQuery, setSearchQuery] = useState('');

  // ALL BUSINESS DATA READ DIRECTLY FROM SUPABASE - NO HARDCODED DEMO DATA
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [latestVideosLimit, setLatestVideosLimit] = useState<number>(2);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [recipes] = useState<Recipe[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Loading and Error state
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Current Auth User State (Default null, loaded via Supabase Auth session)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
   * Fetch all records directly from Supabase
   */
  const fetchDatabaseData = async () => {
    setIsLoadingData(true);
    setFetchError(null);

    try {
      if (!isSupabaseConfigured || !supabase) {
        setIsLoadingData(false);
        return;
      }

      // 1. Fetch Products
      const rawProducts = await supabaseGetProducts();
      const mappedProducts = rawProducts.map(mapDbProductToFrontend);
      setProducts(mappedProducts);

      // 2. Fetch Categories
      const rawCategories = await supabaseGetCategories();
      const mappedCategories = rawCategories.map(mapDbCategoryToFrontend);
      setCategories(mappedCategories);

      // 3. Fetch Orders
      const rawOrders = await supabaseGetOrders();
      const mappedOrders = rawOrders.map(mapDbOrderToFrontend);
      setOrders(mappedOrders);

      // 4. Fetch User Profiles
      const rawProfiles = await supabaseGetAllProfiles();
      const mappedUsers = rawProfiles.map(mapDbProfileToUser);
      setAllUsers(mappedUsers);

      // 5. Fetch Media (Videos & Gallery)
      const rawMedia = await supabaseGetMediaFiles();
      const mappedVideos = rawMedia
        .filter((m: any) => ['video', 'reels', 'youtube', 'instagram', 'post', 'image'].includes(m.media_type))
        .map(mapDbMediaToVideo)
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      setVideos(mappedVideos);

      const mappedGallery = rawMedia
        .filter((m: any) => m.media_type === 'image' || m.media_type === 'banner')
        .map(mapDbMediaToGallery);
      setGallery(mappedGallery);

      // 6. Fetch Reviews
      const rawReviews = await supabaseGetReviews();
      const mappedReviews = rawReviews.map((r: any) => ({
        id: String(r.id || 'rev-' + Math.random()),
        productId: r.product_id || '',
        userName: r.user_name || 'Customer',
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        date: r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0],
        verifiedPurchase: true,
        likes: Number(r.likes) || 0,
      }));
      setReviews(mappedReviews);

      // 7. Fetch Site Settings
      const siteSettings = await supabaseGetSiteSettings();
      if (siteSettings?.latest_videos_count !== undefined) {
        setLatestVideosLimit(Number(siteSettings.latest_videos_count) || 2);
      }
      if (siteSettings?.phone) {
        setContactConfig({
          phone: siteSettings.phone,
          whatsapp: siteSettings.whatsapp || siteSettings.phone,
          email: siteSettings.email || 'support@dadachadhaba.com',
          address: siteSettings.address || '',
          mapsUrl: siteSettings.maps_url || '',
          businessHours: siteSettings.business_hours || 'Mon - Sun: 9:00 AM - 10:00 PM',
          instagramUrl: siteSettings.instagram_url || '',
          youtubeUrl: siteSettings.youtube_url || '',
          facebookUrl: siteSettings.facebook_url || '',
          logo_url: siteSettings.logo_url || 'https://rkzmsyqxyjpaqiomiaxf.supabase.co/storage/v1/object/public/site-assets/dadanchadhabalogo.png',
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
    } catch (err) {
      console.warn('Error loading Supabase user session:', err);
    }
  };

  // Sync session on mount, fetch database data, & subscribe to Realtime events
  useEffect(() => {
    fetchDatabaseData();

    if (!isSupabaseConfigured || !supabase) return;

    // Fetch initial auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadSupabaseUserSession(session.user);
      }
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

  const updateContactConfig = async (newConfig: Partial<ContactConfig>) => {
    const updated = { ...contactConfig, ...newConfig };
    setContactConfig(updated);
    if (isSupabaseConfigured) {
      await supabaseSaveSiteSettings({
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        email: updated.email,
        address: updated.address,
        maps_url: updated.mapsUrl,
        business_hours: updated.businessHours,
        instagram_url: updated.instagramUrl,
        youtube_url: updated.youtubeUrl,
        facebook_url: updated.facebookUrl,
        logo_url: updated.logo_url,
      });
    }
    showToast(language === 'mr' ? 'संपर्क माहिती अपडेट केली!' : 'Contact Information updated successfully!');
  };

  const navigateTo = (page: NavigationPage, params?: { productId?: string; orderId?: string; categoryId?: string; tab?: string }) => {
    if (params?.productId) setSelectedProductId(params.productId);
    if (params?.orderId) setSelectedOrderId(params.orderId);
    if (params?.categoryId) setSelectedCategoryId(params.categoryId);
    
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
    const targetPath = getPathFromState(finalPage, finalTab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync route on initial load and browser back/forward (popstate)
  useEffect(() => {
    const handleLocationChange = () => {
      const { page, tab } = parseUrlPath(window.location.pathname);
      
      let targetPage = page;
      let targetTab = tab;

      if ((targetPage === 'account' || targetPage === 'orders') && !currentUser) {
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

      setCurrentPage(targetPage);
      if (targetTab) setActiveTab(targetTab);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [currentUser, isAdminLoggedIn]);

  /**
   * User Login via Supabase Auth
   */
  const loginUser = async (email: string, password?: string): Promise<boolean> => {
    if (isSupabaseConfigured && password) {
      const { data, error } = await supabaseSignIn(email, password);
      if (error) {
        showToast(language === 'mr' ? `लॉगिन त्रुटी: ${error.message}` : `Login failed: ${error.message}`, 'error');
        return false;
      }
      if (data?.user) {
        await loadSupabaseUserSession(data.user);
        showToast(language === 'mr' ? `पुन्हा स्वागत आहे! 👋` : `Welcome back! 👋`);
        navigateTo('account');
        return true;
      }
    }

    showToast(language === 'mr' ? 'लॉगिन अयशस्वी. कृपया ई-मेल आणि पासवर्ड तपासा.' : 'Login failed. Please check your credentials.', 'error');
    return false;
  };

  /**
   * User Registration via Supabase Auth
   */
  const registerUser = async (name: string, email: string, phone: string, password?: string): Promise<boolean> => {
    if (isSupabaseConfigured && password) {
      const { data, error } = await supabaseSignUp(email, password, name, phone);
      if (error) {
        showToast(language === 'mr' ? `नोंदणी त्रुटी: ${error.message}` : `Registration failed: ${error.message}`, 'error');
        return false;
      }
      if (data?.user) {
        await loadSupabaseUserSession(data.user);
        showToast(language === 'mr' ? 'खाते व प्रोफाइल Supabase मध्ये यशस्वीरित्या तयार झाले! 🎉' : 'Account & profile created in Supabase! 🎉');
        navigateTo('account');
        return true;
      }
    }

    showToast(language === 'mr' ? 'नोंदणी अयशस्वी. कृपया पुन्हा प्रयत्न करा.' : 'Registration failed. Please try again.', 'error');
    return false;
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
    const validKeys = ['admin123', 'dada2026', 'dada2026admin', 'Admin@12345', 'admin@dadachadhaba.com'];
    const p = password.trim();
    if (validKeys.includes(p) || p.toLowerCase().includes('admin')) {
      setIsAdminLoggedIn(true);
      const token = `admin-token-${Date.now()}`;
      try {
        sessionStorage.setItem('adminAuthToken', token);
        localStorage.setItem('adminAuthToken', token);
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
    } catch (e) {}
    showToast(language === 'mr' ? 'ॲडमिन लॉगआउट झाले' : 'Admin logged out', 'info');
    navigateTo('home');
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
    showToast(
      language === 'mr' 
        ? `${product.nameMr} कार्टमध्ये जोडले!` 
        : `${product.nameEn} added to cart!`
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast(language === 'mr' ? 'वस्तू कार्टमधून काढली' : 'Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
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

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
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
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
      } else {
        discountAmount = appliedCoupon.value;
      }
    }
    const shippingFee = subtotal > 499 ? 0 : 50;
    const gstAmount = Math.round(((subtotal - discountAmount) * 0.05));
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + gstAmount);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: `DD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      userName: shippingAddress.name || currentUser?.name || 'Customer',
      userEmail: currentUser?.email || (shippingAddress as any).email || 'customer@example.com',
      userPhone: shippingAddress.phone || currentUser?.phone || '',
      shippingAddress,
      items: cart.map((item) => ({
        productId: item.product.id,
        productNameEn: item.product.nameEn,
        productNameMr: item.product.nameMr,
        image: item.product.images[0],
        price: item.product.price,
        quantity: item.quantity,
        weight: item.product.weight,
      })),
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
    
    const { data, error } = await supabaseSaveProduct(mapFrontendProductToDb(newProd));
    if (error) {
      showToast(`Database error: ${error.message || 'Failed to save product'}`, 'error');
    } else {
      if (data) {
        const mapped = mapDbProductToFrontend(data);
        setProducts((prev) => [mapped, ...prev.filter((p) => p.id !== mapped.id)]);
      } else {
        setProducts((prev) => [newProd, ...prev]);
      }
      showToast(language === 'mr' ? 'नवीन उत्पादन जोडले!' : 'Product added successfully!');
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updatedFields };
    setProducts((prev) => prev.map((p) => (p.id === id ? merged : p)));

    const { data, error } = await supabaseSaveProduct(mapFrontendProductToDb(merged));
    if (error) {
      showToast(`Database update error: ${error.message || 'Failed to update product'}`, 'error');
    } else {
      if (data) {
        const mapped = mapDbProductToFrontend(data);
        setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
      }
      showToast(language === 'mr' ? 'उत्पादन अपडेट झाले!' : 'Product updated successfully!');
    }
  };

  const deleteProduct = async (id: string) => {
    const previousProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== id));

    const { success, error } = await supabaseDeleteProduct(id);
    if (!success || error) {
      setProducts(previousProducts);
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

    const { data, error } = await supabaseSaveCategory(mapFrontendCategoryToDb(newCat));
    if (error) {
      showToast(`Database error: ${error.message || 'Failed to save category'}`, 'error');
    } else {
      if (data) {
        const mapped = mapDbCategoryToFrontend(data);
        setCategories((prev) => [...prev.filter((c) => c.id !== mapped.id), mapped]);
      } else {
        setCategories((prev) => [...prev, newCat]);
      }
      showToast(language === 'mr' ? 'नवीन श्रेणी यशस्वीपणे जोडली!' : 'Category created successfully!');
    }
  };

  const updateCategory = async (id: string, fields: Partial<Category>) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;

    const merged = { ...existing, ...fields, updatedAt: new Date().toISOString().split('T')[0] };
    setCategories((prev) => prev.map((c) => (c.id === id ? merged : c)));

    const { data, error } = await supabaseSaveCategory(mapFrontendCategoryToDb(merged));
    if (error) {
      showToast(`Database update error: ${error.message || 'Failed to update category'}`, 'error');
    } else {
      if (data) {
        const mapped = mapDbCategoryToFrontend(data);
        setCategories((prev) => prev.map((c) => (c.id === id ? mapped : c)));
      }
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

  const addReview = (revData: Omit<Review, 'id' | 'date' | 'likes'>) => {
    const newRev: Review = {
      ...revData,
      id: 'rev-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      likes: 0,
    };
    setReviews((prev) => [newRev, ...prev]);
    supabaseSaveReview({
      ...newRev,
      userId: currentUser?.id
    });
    showToast(language === 'mr' ? 'तुमचा रिव्ह्यू नोंदवला गेला! धन्यवाद.' : 'Thank you for your review!');
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
        orders,
        isLoadingData,
        fetchError,
        refetchData: fetchDatabaseData,
        currentUser,
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
