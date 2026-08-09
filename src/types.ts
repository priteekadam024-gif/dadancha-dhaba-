export type Language = 'mr' | 'en';

export type NavigationPage = 
  | 'home'
  | 'shop'
  | 'product-detail'
  | 'categories'
  | 'videos'
  | 'gallery'
  | 'contact'
  | 'cart'
  | 'checkout'
  | 'wishlist'
  | 'account'
  | 'orders'
  | 'track-order'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'recipes'
  | 'about'
  | 'privacy'
  | 'privacy-policy'
  | 'terms'
  | 'shipping-policy'
  | 'refund-policy'
  | 'return-policy'
  | 'faqs'
  | 'admin-login'
  | 'admin-secret-login'
  | 'admin-dashboard'
  | 'admin-branding'
  | 'admin-media'
  | '404';

export interface Category {
  id: string;
  nameEn: string;
  nameMr: string;
  slug: string;
  descriptionEn?: string;
  descriptionMr?: string;
  imageUrl: string;
  bannerUrl?: string;
  mobileBannerUrl?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  buttonColor?: string;
  displayOrder: number;
  isActive: boolean;
  isFeatured?: boolean;
  parentId?: string | null;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  nameEn: string;
  nameMr: string;
  slug: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  sku: string;
  descriptionEn: string;
  descriptionMr: string;
  ingredientsEn: string;
  ingredientsMr: string;
  weight: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  ratings: number;
  reviewCount: number;
  images: string[];
  isFeatured?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isSpecialMasala?: boolean;
  isKitchenAppliance?: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  likes: number;
  userLiked?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  type: 'home' | 'work' | 'other';
}

export interface OrderItem {
  productId: string;
  productNameEn: string;
  productNameMr: string;
  image: string;
  price: number;
  quantity: number;
  weight: string;
}

export type PaymentMethod = 'upi' | 'razorpay' | 'phonepe' | 'gpay' | 'cod' | 'stripe';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type OrderStatus = 'placed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId?: string;
  orderNumber: string;
  date: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  couponCode?: string;
}

export interface VideoItem {
  id: string;
  titleEn: string;
  titleMr: string;
  descriptionEn?: string;
  descriptionMr?: string;
  type: 'youtube' | 'instagram' | 'video' | 'image' | 'reels' | 'post';
  originalUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  storagePath?: string;
  views?: string;
  category: 'recipes' | 'products' | 'behind_scenes' | 'customer_stories' | 'reels' | string;
  date: string;
  isPopular?: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  titleEn: string;
  titleMr: string;
  category: 'food' | 'kitchen' | 'products' | 'store' | 'ambience';
  imageUrl: string;
  captionEn?: string;
  captionMr?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  descriptionEn: string;
  descriptionMr: string;
  expiryDate: string;
  active: boolean;
}

export interface UserNotificationSettings {
  emailOffers: boolean;
  smsOrderUpdates: boolean;
  whatsAppTracking: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  addresses: Address[];
  points: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  status: 'active' | 'inactive' | 'disabled';
  notifications?: UserNotificationSettings;
  totalOrders?: number;
  totalSpent?: number;
  wishlistCount?: number;
}

export interface Recipe {
  id: string;
  titleEn: string;
  titleMr: string;
  slug: string;
  readTime: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: 'Easy' | 'Medium' | 'Expert';
  ingredientsEn: string[];
  ingredientsMr: string[];
  stepsEn: string[];
  stepsMr: string[];
  image: string;
  relatedProductId?: string;
  author: string;
}

export interface ContactConfig {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  mapsUrl: string;
  businessHours: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  logo_url?: string;
}

