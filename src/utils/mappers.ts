import { Product, Category, Order, VideoItem, GalleryItem, Review, User, Recipe, RecipeCategory } from '../types';

/**
 * Maps Supabase 'products' row to frontend Product type
 */
export function mapDbProductToFrontend(row: any): Product {
  let imagesArr: string[] = [];
  if (Array.isArray(row.images)) {
    imagesArr = row.images;
  } else if (typeof row.images === 'string') {
    try {
      imagesArr = JSON.parse(row.images);
    } catch {
      imagesArr = [row.images];
    }
  }
  if (!imagesArr || imagesArr.length === 0) {
    imagesArr = ['https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800'];
  }

  let variantsArr: any[] = [];
  if (Array.isArray(row.variants)) {
    variantsArr = row.variants;
  } else if (typeof row.variants === 'string') {
    try {
      variantsArr = JSON.parse(row.variants);
    } catch {
      variantsArr = [];
    }
  }

  const basePrice = Number(row.price) || 0;
  const baseWeight = row.weight || '250g';

  const cleanedVariants = Array.isArray(variantsArr) && variantsArr.length > 0
    ? variantsArr
        .filter((v) => v && (v.weight || v.size) && Number(v.price) > 0)
        .map((v, idx) => ({
          id: String(v.id || `v-${row.id || 'p'}-${idx + 1}`),
          weight: String(v.weight || v.size || '').trim(),
          size: String(v.size || v.weight || '').trim(),
          unit: v.unit || '',
          packageLabel: v.packageLabel || '',
          price: Number(v.price) || basePrice,
          originalPrice: v.originalPrice ? Number(v.originalPrice) : Math.round((Number(v.price) || basePrice) * 1.25),
          stock: v.stock !== undefined ? Number(v.stock) : Number(row.stock_quantity ?? row.stock ?? 100),
          sku: v.sku || `${row.sku || 'DD'}-${String(v.weight || v.size || idx).replace(/[^a-zA-Z0-9]/g, '')}`,
          isActive: v.isActive !== false,
        }))
    : undefined;

  const nameEn = (row.name_en || row.name || row.nameEn || row.title_en || 'Product').trim();
  const nameMr = (row.name_mr || row.marathi_name || row.nameMr || row.title_mr || nameEn).trim();
  const rawStock = row.stock_quantity !== undefined ? Number(row.stock_quantity) : (row.stock !== undefined ? Number(row.stock) : (row.in_stock ? 50 : 0));

  let paymentMethodsArr: string[] = ['cod', 'bhim_upi', 'google_pay', 'phonepe', 'razorpay'];
  if (Array.isArray(row.payment_methods)) {
    paymentMethodsArr = row.payment_methods;
  } else if (typeof row.payment_methods === 'string') {
    try {
      const parsed = JSON.parse(row.payment_methods);
      if (Array.isArray(parsed) && parsed.length > 0) {
        paymentMethodsArr = parsed;
      }
    } catch {}
  } else if (Array.isArray(row.paymentMethods)) {
    paymentMethodsArr = row.paymentMethods;
  }

  const gstEnabled = row.gst_enabled !== undefined ? Boolean(row.gst_enabled) : (row.gstEnabled !== undefined ? Boolean(row.gstEnabled) : true);
  const gstRate = row.gst_rate !== undefined ? Number(row.gst_rate) : (row.gstRate !== undefined ? Number(row.gstRate) : 5);

  return {
    id: String(row.id),
    nameEn: nameEn,
    nameMr: nameMr,
    slug: row.slug || (nameEn ? nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') : String(row.id)),
    price: basePrice,
    originalPrice: Number(row.original_price || row.originalPrice) || Math.round(basePrice * 1.25),
    discountPercent: Number(row.discount_percent || row.discount || row.discountPercent) || 0,
    stock: isNaN(rawStock) ? 50 : rawStock,
    sku: row.sku || `DD-${row.id}`,
    descriptionEn: row.description_en || row.descriptionEn || '',
    descriptionMr: row.description_mr || row.descriptionMr || '',
    ingredientsEn: row.ingredients_en || row.ingredients || row.ingredientsEn || '',
    ingredientsMr: row.ingredients_mr || row.marathi_ingredients || row.ingredientsMr || '',
    weight: baseWeight,
    brand: row.brand || 'Dadacha Dhaba',
    categoryId: row.category_id || row.category || 'special masale',
    categoryName: row.category || row.category_name || 'Dadanche Special masale',
    ratings: Number(row.rating || row.ratings) || 5.0,
    reviewCount: Number(row.review_count || row.reviewCount) || 0,
    images: imagesArr,
    variants: cleanedVariants,
    isFeatured: Boolean(row.is_featured || row.isFeatured),
    isTrending: Boolean(row.is_trending || row.isTrending),
    isBestSeller: Boolean(row.is_bestseller || row.isBestSeller),
    isSpecialMasala: Boolean(row.is_special_masala || row.isSpecialMasala),
    isKitchenAppliance: Boolean(row.is_kitchen_appliance || row.isKitchenAppliance),
    paymentMethods: paymentMethodsArr,
    gstEnabled: gstEnabled,
    gstRate: isNaN(gstRate) ? 5 : gstRate,
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

/**
 * Maps frontend Product to Supabase 'products' database row
 */
export function mapFrontendProductToDb(p: Product): any {
  return {
    id: p.id,
    name_en: p.nameEn,
    name_mr: p.nameMr,
    slug: p.slug || p.id,
    price: p.price,
    original_price: p.originalPrice,
    discount_percent: p.discountPercent,
    stock_quantity: p.stock,
    in_stock: p.stock > 0,
    sku: p.sku,
    description_en: p.descriptionEn,
    description_mr: p.descriptionMr,
    ingredients_en: p.ingredientsEn,
    ingredients_mr: p.ingredientsMr,
    weight: p.weight,
    brand: p.brand,
    category_id: p.categoryId,
    category: p.categoryName || p.categoryId,
    rating: p.ratings,
    review_count: p.reviewCount,
    images: p.images,
    variants: p.variants && p.variants.length > 0 ? p.variants : [],
    is_featured: p.isFeatured,
    is_trending: p.isTrending,
    is_bestseller: p.isBestSeller,
    is_special_masala: p.isSpecialMasala,
    is_kitchen_appliance: p.isKitchenAppliance,
    payment_methods: p.paymentMethods || ['cod', 'bhim_upi', 'google_pay', 'phonepe', 'razorpay'],
    gst_enabled: p.gstEnabled !== undefined ? p.gstEnabled : true,
    gst_rate: p.gstRate !== undefined ? Number(p.gstRate) : 5,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps Supabase 'categories' row to frontend Category type
 */
export function mapDbCategoryToFrontend(row: any): Category {
  return {
    id: String(row.id),
    nameEn: row.name_en || row.nameEn || 'Category',
    nameMr: row.name_mr || row.nameMr || row.name_en || 'श्रेणी',
    slug: row.slug || String(row.id),
    descriptionEn: row.description_en || row.descriptionEn || '',
    descriptionMr: row.description_mr || row.descriptionMr || '',
    imageUrl: row.image_url || row.imageUrl || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800',
    bannerUrl: row.banner_url || row.bannerUrl || '',
    mobileBannerUrl: row.mobile_banner_url || row.mobileBannerUrl || '',
    icon: row.icon || '',
    displayOrder: Number(row.display_order || row.displayOrder) || 1,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    isFeatured: Boolean(row.is_featured || row.isFeatured),
    itemCount: Number(row.item_count || row.itemCount) || 0,
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    updatedAt: row.updated_at ? row.updated_at.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

/**
 * Maps frontend Category to Supabase 'categories' database row
 */
export function mapFrontendCategoryToDb(c: Category): any {
  return {
    id: c.id,
    name_en: c.nameEn,
    name_mr: c.nameMr,
    slug: c.slug || c.id,
    description_en: c.descriptionEn,
    description_mr: c.descriptionMr,
    image_url: c.imageUrl,
    banner_url: c.bannerUrl || '',
    mobile_banner_url: c.mobileBannerUrl || '',
    display_order: c.displayOrder,
    is_active: c.isActive,
    is_featured: c.isFeatured,
    item_count: c.itemCount || 0,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps Supabase 'orders' row to frontend Order type
 */
export function mapDbOrderToFrontend(row: any): Order {
  let address: any = {};
  if (typeof row.shipping_address === 'string') {
    try {
      address = JSON.parse(row.shipping_address);
    } catch {
      address = {};
    }
  } else if (row.shipping_address && typeof row.shipping_address === 'object') {
    address = row.shipping_address;
  }

  let items: any[] = [];
  if (typeof row.items === 'string') {
    try {
      items = JSON.parse(row.items);
    } catch {
      items = [];
    }
  } else if (Array.isArray(row.items)) {
    items = row.items;
  }

  return {
    id: String(row.id),
    userId: row.user_id || undefined,
    orderNumber: row.order_number || row.orderNumber || `DD-${row.id}`,
    date: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    userName: row.user_name || row.customer_name || address.name || 'Customer',
    userEmail: row.user_email || row.customer_email || address.email || '',
    userPhone: row.user_phone || row.customer_phone || address.phone || '',
    shippingAddress: {
      id: address.id || 'addr-order',
      name: address.name || row.user_name || 'Customer',
      phone: address.phone || row.user_phone || '',
      street: address.street || '',
      city: address.city || '',
      state: address.state || 'Maharashtra',
      pincode: address.pincode || '',
      type: address.type || 'home',
    },
    items: items.map((it: any) => ({
      productId: it.productId || it.product_id || '',
      productNameEn: it.productNameEn || it.product_name_en || 'Product',
      productNameMr: it.productNameMr || it.product_name_mr || 'उत्पादन',
      image: it.image || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800',
      price: Number(it.price || it.unitPrice || 0),
      quantity: Number(it.quantity) || 1,
      weight: it.weight || it.selectedWeight || it.selectedVariantSize || '250g',
      variantId: it.variantId || it.variant_id || it.selectedVariantId || undefined,
      packageLabel: it.packageLabel || undefined,
      unitPrice: Number(it.unitPrice || it.price || 0),
      lineTotal: Number(it.lineTotal || (Number(it.price || 0) * Number(it.quantity || 1))),
    })),
    subtotal: Number(row.subtotal) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    shippingFee: Number(row.shipping_fee) || 0,
    gstAmount: Number(row.gst_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paymentMethod: row.payment_method || 'cod',
    paymentStatus: row.payment_status || 'pending',
    orderStatus: row.order_status || 'placed',
    trackingNumber: row.tracking_number || '',
    couponCode: row.coupon_code || undefined,
    razorpayOrderId: row.razorpay_order_id || row.razorpayOrderId || undefined,
    razorpayPaymentId: row.razorpay_payment_id || row.razorpayPaymentId || undefined,
    paidAt: row.paid_at || row.paidAt || undefined,
  };
}

/**
 * Maps Supabase 'media_files' row to VideoItem
 */
export function mapDbMediaToVideo(row: any): VideoItem {
  const isPub = row.is_published !== undefined 
    ? Boolean(row.is_published) 
    : (row.is_active !== undefined ? Boolean(row.is_active) : true);

  return {
    id: String(row.id),
    titleEn: row.title || row.file_name || 'Dadacha Dhaba Reel',
    titleMr: row.title_mr || row.title || 'दादाचा ढाबा रील',
    descriptionEn: row.description || '',
    descriptionMr: row.description_mr || row.description || '',
    type: (row.media_type as any) || 'video',
    originalUrl: row.public_url || row.external_url || '',
    embedUrl: row.external_url || row.public_url || '',
    thumbnailUrl: row.thumbnail_url || row.public_url || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800',
    storagePath: row.storage_path || '',
    views: row.views ? String(row.views) : undefined,
    category: row.category || 'reels',
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
    isPopular: Boolean(row.is_active),
    isPublished: isPub,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Supabase 'media_files' row to GalleryItem
 */
export function mapDbMediaToGallery(row: any): GalleryItem {
  return {
    id: String(row.id),
    titleEn: row.title || row.file_name || 'Gallery Image',
    titleMr: row.title_mr || row.title || 'गॅलरी फोटो',
    category: 'products',
    imageUrl: row.public_url || '',
  };
}

/**
 * Maps Supabase 'user_profiles' row to User
 */
export function mapDbProfileToUser(row: any): User {
  return {
    id: String(row.user_id || row.id),
    name: row.full_name || row.email?.split('@')[0] || 'Customer',
    email: row.email || '',
    phone: row.phone || '',
    avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: row.role || 'user',
    addresses: [],
    points: Number(row.points) || 100,
    emailVerified: true,
    phoneVerified: true,
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    status: row.status || 'active',
    notifications: row.notifications || {
      emailOffers: true,
      smsOrderUpdates: true,
      whatsAppTracking: true,
    },
    totalOrders: 0,
    totalSpent: 0,
    wishlistCount: 0,
  };
}

/**
 * Maps Supabase 'recipes' row to frontend Recipe type
 */
export function mapDbRecipeToFrontend(row: any): Recipe {
  let imagesArr: string[] = [];
  if (Array.isArray(row.images)) {
    imagesArr = row.images;
  } else if (typeof row.images === 'string') {
    try {
      imagesArr = JSON.parse(row.images);
    } catch {
      imagesArr = [row.images];
    }
  }

  let ingredientsEn: string[] = [];
  if (Array.isArray(row.ingredients_en)) {
    ingredientsEn = row.ingredients_en;
  } else if (typeof row.ingredients_en === 'string') {
    try {
      ingredientsEn = JSON.parse(row.ingredients_en);
    } catch {
      ingredientsEn = row.ingredients_en.split('\n').filter(Boolean);
    }
  }

  let ingredientsMr: string[] = [];
  if (Array.isArray(row.ingredients_mr)) {
    ingredientsMr = row.ingredients_mr;
  } else if (typeof row.ingredients_mr === 'string') {
    try {
      ingredientsMr = JSON.parse(row.ingredients_mr);
    } catch {
      ingredientsMr = row.ingredients_mr.split('\n').filter(Boolean);
    }
  }

  let stepsEn: string[] = [];
  if (Array.isArray(row.steps_en)) {
    stepsEn = row.steps_en;
  } else if (typeof row.steps_en === 'string') {
    try {
      stepsEn = JSON.parse(row.steps_en);
    } catch {
      stepsEn = row.steps_en.split('\n').filter(Boolean);
    }
  }

  let stepsMr: string[] = [];
  if (Array.isArray(row.steps_mr)) {
    stepsMr = row.steps_mr;
  } else if (typeof row.steps_mr === 'string') {
    try {
      stepsMr = JSON.parse(row.steps_mr);
    } catch {
      stepsMr = row.steps_mr.split('\n').filter(Boolean);
    }
  }

  const primaryImg = row.image || row.image_url || imagesArr[0] || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800';

  return {
    id: String(row.id),
    titleEn: row.title_en || row.titleEn || row.title || 'Recipe',
    titleMr: row.title_mr || row.titleMr || row.title || 'रेसिपी',
    slug: row.slug || String(row.id),
    descriptionEn: row.description_en || row.descriptionEn || '',
    descriptionMr: row.description_mr || row.descriptionMr || '',
    categoryId: row.category_id || row.categoryId || 'traditional',
    categoryName: row.category_name || row.categoryName || 'Traditional Recipes',
    subcategoryId: row.subcategory_id || row.subcategoryId || undefined,
    subcategoryName: row.subcategory_name || row.subcategoryName || undefined,
    readTime: row.read_time || row.readTime || '5 min read',
    prepTime: row.prep_time || row.prepTime || '15 mins',
    cookTime: row.cook_time || row.cookTime || '30 mins',
    servings: row.servings ? String(row.servings) : '4 Persons',
    difficulty: (row.difficulty as any) || 'Medium',
    ingredientsEn,
    ingredientsMr,
    stepsEn,
    stepsMr,
    tipsEn: row.tips_en || row.tipsEn || '',
    tipsMr: row.tips_mr || row.tipsMr || '',
    servingSuggestionsEn: row.serving_suggestions_en || row.servingSuggestionsEn || '',
    servingSuggestionsMr: row.serving_suggestions_mr || row.servingSuggestionsMr || '',
    image: primaryImg,
    images: imagesArr.length > 0 ? imagesArr : [primaryImg],
    relatedProductId: row.related_product_id || row.relatedProductId || undefined,
    relatedProductName: row.related_product_name || row.relatedProductName || undefined,
    author: row.author || 'Dadacha Dhaba Master Chef',
    isPublished: row.is_published !== undefined ? Boolean(row.is_published) : true,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps frontend Recipe to Supabase 'recipes' database row
 */
export function mapFrontendRecipeToDb(r: Recipe): any {
  const primaryImg = r.image || (r.images && r.images[0]) || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800';
  return {
    id: r.id,
    title_en: r.titleEn || r.titleMr || 'Recipe',
    title_mr: r.titleMr || r.titleEn || 'रेसिपी',
    slug: r.slug || r.id,
    description_en: r.descriptionEn || '',
    description_mr: r.descriptionMr || '',
    category_id: r.categoryId || 'traditional',
    category_name: r.categoryName || 'Traditional Recipes',
    subcategory_id: r.subcategoryId || null,
    subcategory_name: r.subcategoryName || null,
    read_time: r.readTime || '5 min read',
    prep_time: r.prepTime || '15 mins',
    cook_time: r.cookTime || '30 mins',
    servings: r.servings || '4 Persons',
    difficulty: r.difficulty || 'Medium',
    ingredients_en: Array.isArray(r.ingredientsEn) ? r.ingredientsEn : [],
    ingredients_mr: Array.isArray(r.ingredientsMr) ? r.ingredientsMr : [],
    steps_en: Array.isArray(r.stepsEn) ? r.stepsEn : [],
    steps_mr: Array.isArray(r.stepsMr) ? r.stepsMr : [],
    tips_en: r.tipsEn || '',
    tips_mr: r.tipsMr || '',
    serving_suggestions_en: r.servingSuggestionsEn || '',
    serving_suggestions_mr: r.servingSuggestionsMr || '',
    image: primaryImg,
    image_url: primaryImg,
    images: Array.isArray(r.images) && r.images.length > 0 ? r.images : [primaryImg],
    related_product_id: r.relatedProductId || null,
    related_product_name: r.relatedProductName || null,
    author: r.author || 'Dadacha Dhaba Chef',
    is_published: r.isPublished !== undefined ? r.isPublished : true,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps Supabase 'recipe_categories' row to frontend RecipeCategory type
 */
export function mapDbRecipeCategoryToFrontend(row: any): RecipeCategory {
  let subcategories: any[] = [];
  if (Array.isArray(row.subcategories)) {
    subcategories = row.subcategories;
  } else if (typeof row.subcategories === 'string') {
    try {
      subcategories = JSON.parse(row.subcategories);
    } catch {
      subcategories = [];
    }
  }

  return {
    id: String(row.id),
    nameEn: row.name_en || row.nameEn || 'Category',
    nameMr: row.name_mr || row.nameMr || row.name_en || 'श्रेणी',
    slug: row.slug || String(row.id),
    descriptionEn: row.description_en || row.descriptionEn || '',
    descriptionMr: row.description_mr || row.descriptionMr || '',
    imageUrl: row.image_url || row.imageUrl || '',
    subcategories: subcategories.map((sub: any) => ({
      id: String(sub.id),
      categoryId: String(row.id),
      nameEn: sub.name_en || sub.nameEn || 'Subcategory',
      nameMr: sub.name_mr || sub.nameMr || sub.name_en || 'उपश्रेणी',
      slug: sub.slug || String(sub.id),
    })),
    displayOrder: Number(row.display_order || row.displayOrder) || 1,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
  };
}
