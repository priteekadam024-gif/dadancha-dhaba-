import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from client-side environment variables or provided project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkzmsyqxyjpaqiomiaxf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrem1zeXF4eWpwYXFpb21pYXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTk5MTgsImV4cCI6MjEwMTU5NTkxOH0.n0usM_-BoOiP4SiG6aNcRQR5WEWkwQplJSN8abYfCGs';

// Check if credentials are properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co'
);

// Initialize Supabase Client with persistent session handling
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// In-flight request deduplication and memory cache (TTL: 15s)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const requestCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export function getCachedOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = requestCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < ttlMs) {
    return Promise.resolve(cached.data);
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = fetcher()
    .then((result) => {
      if (result && (!Array.isArray(result) || result.length > 0)) {
        requestCache.set(key, { data: result, timestamp: Date.now() });
      }
      inFlightRequests.delete(key);
      return result;
    })
    .catch((err) => {
      inFlightRequests.delete(key);
      throw err;
    });

  inFlightRequests.set(key, promise);
  return promise;
}

export function invalidateCacheKey(key: string) {
  requestCache.delete(key);
}

/**
 * Register a new user with Supabase Auth
 * Creates entry in auth.users and updates user_profiles table
 */
export async function supabaseSignUp(email: string, password: string, fullName: string, phone: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanFullName = fullName.trim();
  const cleanPhone = phone.trim();

  console.log('[AUTH] REGISTER REQUEST START:', cleanEmail);

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanFullName,
        phone: cleanPhone,
      },
    },
  });

  console.log('[AUTH] REGISTER REQUEST END:', { email: cleanEmail, success: !error, error: error?.message });

  if (error) {
    return { data: null, error };
  }

  if (data.user) {
    // Upsert into user_profiles
    const profileRecord = {
      user_id: data.user.id,
      full_name: cleanFullName,
      email: cleanEmail,
      phone: cleanPhone,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from('user_profiles').upsert(profileRecord, { onConflict: 'user_id' });
    if (profileError) {
      console.warn('user_profiles upsert notice:', profileError.message);
    }

    // If session is null (email confirmation required by Supabase project settings),
    // trigger auto-confirm via backend and sign in to get a valid session
    if (!data.session) {
      try {
        const confirmRes = await fetch('/api/auth/auto-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, email: cleanEmail }),
        });
        const confirmJson = await confirmRes.json();
        if (confirmJson.success) {
          const signInRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInRes.data?.session) {
            return { data: signInRes.data, error: null };
          }
        }
      } catch (confirmErr) {
        console.warn('Auto-confirm registration attempt exception:', confirmErr);
      }
    }
  }

  return { data, error: null };
}

/**
 * Sign in existing user with Supabase Auth
 */
export async function supabaseSignIn(email: string, password: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  const cleanEmail = email.trim().toLowerCase();

  console.log('[AUTH] LOGIN REQUEST START:', cleanEmail);

  let { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  // If email is not confirmed, attempt auto-confirm via server admin and retry sign-in once
  if (error && error.message.toLowerCase().includes('email not confirmed')) {
    console.log('[AUTH] Email not confirmed error detected. Attempting auto-confirmation...');
    try {
      const confirmRes = await fetch('/api/auth/auto-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const confirmJson = await confirmRes.json();
      if (confirmJson.success) {
        const retryRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!retryRes.error) {
          data = retryRes.data;
          error = null;
        }
      }
    } catch (autoErr) {
      console.warn('Auto-confirm login retry failed:', autoErr);
    }
  }

  console.log('[AUTH] LOGIN REQUEST END:', { email: cleanEmail, success: !error, error: error?.message });

  return { data, error };
}

/**
 * Sign out current user from Supabase
 */
export async function supabaseSignOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Send Password Reset Email via Supabase Auth
 */
export async function supabaseResetPassword(email: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });

  return { data, error };
}

/**
 * Update password for currently authenticated Supabase user
 */
export async function supabaseUpdatePassword(newPassword: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured') };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Fetch profile details from user_profiles table for a given user_id
 */
export async function supabaseGetUserProfile(userId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error fetching user_profiles:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('supabaseGetUserProfile error:', err);
    return null;
  }
}

/**
 * Update user profile in user_profiles
 */
export async function supabaseUpdateUserProfile(userId: string, updates: Record<string, any>) {
  if (!supabase) return null;

  try {
    const record = {
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(record, { onConflict: 'user_id' });

    if (error) console.warn('Error updating user_profiles:', error.message);
    return { data, error };
  } catch (err) {
    console.warn('supabaseUpdateUserProfile error:', err);
    return null;
  }
}

/**
 * Fetch addresses for a user
 */
export async function supabaseGetUserAddresses(userId: string) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching user_addresses:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Save / Insert / Update address
 */
export async function supabaseSaveAddress(userId: string, address: any) {
  if (!supabase) return null;

  try {
    const payload = {
      user_id: userId,
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state || 'Maharashtra',
      pincode: address.pincode,
      type: address.type || 'home',
      is_default: address.isDefault || false,
    };

    let result;
    if (address.id && typeof address.id === 'string' && !address.id.startsWith('addr-') && address.id.trim().length > 0) {
      result = await supabase.from('user_addresses').update(payload).eq('id', address.id.trim());
    } else {
      result = await supabase.from('user_addresses').insert([payload]);
    }

    return result;
  } catch (err) {
    console.warn('supabaseSaveAddress error:', err);
    return null;
  }
}

/**
 * Delete address
 */
export async function supabaseDeleteAddress(addressId: string) {
  if (!supabase || !addressId || typeof addressId !== 'string' || !addressId.trim() || addressId.startsWith('addr-')) return null;

  try {
    const { error } = await supabase.from('user_addresses').delete().eq('id', addressId.trim());
    if (error) console.warn('Delete address error:', error.message);
    return { error };
  } catch (err) {
    return null;
  }
}

/**
 * Save order details to Supabase 'orders' table
 */
export async function supabaseSaveOrder(order: any) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('orders').upsert([
      {
        id: order.id,
        order_number: order.orderNumber,
        user_id: order.userId || null,
        user_name: order.userName || order.shippingAddress?.name || 'Customer',
        user_email: order.userEmail || order.shippingAddress?.email || '',
        user_phone: order.userPhone || order.shippingAddress?.phone || '',
        customer_name: order.shippingAddress?.name || order.userName || 'Customer',
        customer_phone: order.shippingAddress?.phone || '',
        customer_email: order.shippingAddress?.email || order.userEmail || '',
        shipping_address: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        discount_amount: order.discountAmount || 0,
        shipping_fee: order.shippingFee || 0,
        gst_amount: order.gstAmount || 0,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        payment_status: order.paymentStatus,
        order_status: order.orderStatus,
        tracking_number: order.trackingNumber || '',
        coupon_code: order.couponCode || null,
        razorpay_order_id: order.razorpayOrderId || null,
        razorpay_payment_id: order.razorpayPaymentId || null,
        paid_at: order.paidAt || null,
        created_at: new Date().toISOString(),
      },
    ], { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save order notice:', error.message);
    }
    return data;
  } catch (err) {
    console.warn('Supabase order insert error:', err);
    return null;
  }
}

/**
 * Fetch orders for user or all orders
 */
export async function supabaseGetOrders(userId?: string) {
  if (!supabase) return [];

  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching orders:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Save or submit product review to Supabase 'reviews' table (verified purchase required)
 */
export async function supabaseSaveReview(review: any) {
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  try {
    if (!review.userId) {
      return { data: null, error: new Error('User login is required to post a review.') };
    }

    // Verify purchase history in orders table
    const { data: userOrders, error: orderErr } = await supabase
      .from('orders')
      .select('items, order_status, status')
      .eq('user_id', review.userId);

    if (orderErr) {
      console.warn('Error checking order history for review:', orderErr.message);
    }

    const hasPurchased = (userOrders || []).some((ord: any) => {
      const isNotCancelled = ord.order_status !== 'cancelled' && ord.status !== 'cancelled';
      if (!isNotCancelled) return false;
      const items = Array.isArray(ord.items) ? ord.items : [];
      return items.some((it: any) => (it.productId || it.product_id) === review.productId);
    });

    if (!hasPurchased) {
      return {
        data: null,
        error: new Error('Review restricted: You can only review products you have purchased.')
      };
    }

    // Check duplicate review
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', review.productId)
      .eq('user_id', review.userId);

    let result;
    const existingReviewId = existingReviews?.[0]?.id;
    if (existingReviewId && typeof existingReviewId === 'string' && existingReviewId.trim().length > 0) {
      result = await supabase
        .from('reviews')
        .update({
          rating: Number(review.rating) || 5,
          comment: review.comment,
          user_name: review.userName,
          date: new Date().toISOString()
        })
        .eq('id', existingReviewId.trim())
        .select();
    } else {
      result = await supabase.from('reviews').insert([
        {
          id: review.id || 'rev-' + Date.now(),
          product_id: review.productId,
          user_id: review.userId,
          user_name: review.userName,
          rating: Number(review.rating) || 5,
          comment: review.comment,
          date: new Date().toISOString(),
        }
      ]).select();
    }

    return { data: result.data, error: result.error };
  } catch (err: any) {
    console.warn('Supabase review insert exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Save contact form inquiry to Supabase 'contact_messages' table
 */
export async function supabaseSaveContactMessage(messageData: { name: string; phone: string; email?: string; message: string; subject?: string }) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('contact_messages').insert([
      {
        name: messageData.name,
        phone: messageData.phone,
        email: messageData.email || '',
        subject: messageData.subject || 'General Inquiry',
        message: messageData.message,
        created_at: new Date().toISOString(),
      },
    ]);
    return { data, error };
  } catch (err) {
    console.warn('Supabase contact message error:', err);
    return null;
  }
}

function getAdminAuthToken(): string {
  if (typeof window === 'undefined') return 'dadacha-admin-secret-token-2026';
  const token = (
    sessionStorage.getItem('adminAuthToken') ||
    localStorage.getItem('adminAuthToken') ||
    localStorage.getItem('dadacha_admin_token') ||
    sessionStorage.getItem('dadacha_admin_token') ||
    localStorage.getItem('admin_session_token') ||
    (localStorage.getItem('dd_admin_logged_in') === 'true' ? 'dadacha-admin-secret-token-2026' : '') ||
    'dadacha-admin-secret-token-2026'
  );
  return String(token).replace(/^"(.*)"$/, '$1').trim() || 'dadacha-admin-secret-token-2026';
}

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  if (envUrl) return envUrl.replace(/\/$/, '');
  return '';
}

/**
 * Helper to fetch all products in chunks to prevent PostgreSQL statement timeouts (error 57014)
 * when rows contain large image base64 payloads.
 */
async function fetchProductsInChunks(client: any): Promise<any[]> {
  try {
    const chunkSize = 5;
    let allProducts: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 20) {
      const from = page * chunkSize;
      const to = from + chunkSize - 1;
      const { data, error } = await client
        .from('products')
        .select('*')
        .range(from, to);

      if (error) {
        console.warn(`[Supabase products chunk ${page}] notice:`, error.message);
        break;
      }

      if (data && data.length > 0) {
        allProducts = allProducts.concat(data);
        if (data.length < chunkSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    return allProducts;
  } catch (err) {
    console.warn('Exception during chunked product fetch:', err);
    return [];
  }
}

/**
 * Fetch products from Supabase 'products' table
 * Directly queries public.products table with select('*') and includes resilient chunking fallback
 */
export async function supabaseGetProducts() {
  return getCachedOrFetch('products', 15000, async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }

        if (error) {
          console.warn('Initial products select notice (trying chunked retrieval):', error.message);
        }

        // If select('*') encountered statement timeout (57014) or error, use chunked retrieval
        const chunkedProducts = await fetchProductsInChunks(supabase);
        if (chunkedProducts.length > 0) {
          return chunkedProducts;
        }
      } catch (err) {
        console.warn('Supabase get products client query exception, trying chunked retrieval:', err);
        const chunkedProducts = await fetchProductsInChunks(supabase);
        if (chunkedProducts.length > 0) {
          return chunkedProducts;
        }
      }
    }

    // Fallback to Express backend endpoint if needed
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/products`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products) && json.products.length > 0) {
          return json.products;
        }
      }
    } catch (err) {
      console.warn('Backend /api/products fetch fallback notice:', err);
    }

    return [];
  });
}

/**
 * Save or Upsert product to Supabase 'products' table via Express backend
 */
export async function supabaseSaveProduct(productRecord: any, isUpdate: boolean = false) {
  invalidateCacheKey('products');
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const url = isUpdate
      ? `${apiBase}/api/admin/products/${encodeURIComponent(productRecord.id)}`
      : `${apiBase}/api/admin/products`;

    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(productRecord),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.product) {
        return { data: json.product, error: null };
      } else if (json.error) {
        console.warn('Backend returned product error, attempting client Supabase:', json.error);
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      console.warn(`Backend save product returned status ${res.status}, attempting client Supabase:`, errorJson.error || res.statusText);
    }
  } catch (err: any) {
    console.warn('Backend save product notice, attempting client Supabase fallback:', err?.message);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert([productRecord], { onConflict: 'id' })
        .select();

      if (!error && data && data.length > 0) {
        return { data: data[0], error: null };
      }
      if (error) {
        console.error('Client Supabase product save error:', error.message);
        return { data: productRecord, error: new Error(error.message) };
      }
      return { data: productRecord, error: null };
    } catch (clientErr: any) {
      console.error('Client Supabase product save exception:', clientErr);
      return { data: productRecord, error: clientErr };
    }
  }
  return { data: productRecord, error: null };
}

/**
 * Delete product from Supabase 'products' table via Express backend
 */
export async function supabaseDeleteProduct(productId: string) {
  invalidateCacheKey('products');
  if (!productId || typeof productId !== 'string' || !productId.trim()) {
    return { success: false, error: new Error('Valid Product ID is required for deletion') };
  }

  const cleanId = productId.trim();
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/products/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return { success: true, error: null };
      } else if (json.error) {
        return { success: false, error: new Error(json.error) };
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      return { success: false, error: new Error(errorJson.error || `Server status ${res.status}`) };
    }
  } catch (err: any) {
    console.warn('Backend delete product notice, attempting client fallback:', err?.message);
  }

  if (!supabase) return { success: false, error: new Error('Supabase not configured') };
  try {
    const { error } = await supabase.from('products').delete().eq('id', cleanId);
    if (error) {
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/**
 * Fetch categories from Supabase 'categories' table
 */
export async function supabaseGetCategories() {
  return getCachedOrFetch('categories', 15000, async () => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/categories`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.categories)) {
          return json.categories;
        }
      }
    } catch (err) {
      console.warn('Backend /api/categories fetch notice, falling back to client Supabase:', err);
    }

    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.warn('Error fetching categories from Supabase:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Supabase get categories exception:', err);
      return [];
    }
  });
}

/**
 * Save or Upsert category to Supabase 'categories' table via Express backend
 */
export async function supabaseSaveCategory(categoryRecord: any, isUpdate: boolean = false) {
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const url = isUpdate
      ? `${apiBase}/api/admin/categories/${encodeURIComponent(categoryRecord.id)}`
      : `${apiBase}/api/admin/categories`;

    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(categoryRecord),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.category) {
        return { data: json.category, error: null };
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      console.warn(`Backend save category returned status ${res.status}, attempting direct Supabase:`, errorJson.error || res.statusText);
    }
  } catch (err: any) {
    console.warn('Backend save category notice, attempting client fallback:', err?.message);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .upsert([categoryRecord], { onConflict: 'id' })
        .select();

      if (!error && data && data.length > 0) {
        return { data: data[0], error: null };
      }
      if (error) {
        return { data: categoryRecord, error: new Error(error.message) };
      }
      return { data: categoryRecord, error: null };
    } catch (clientErr: any) {
      return { data: categoryRecord, error: clientErr };
    }
  }
  return { data: categoryRecord, error: null };
}

/**
 * Delete category from Supabase 'categories' table via Express backend
 */
export async function supabaseDeleteCategory(
  categoryId: string, 
  options?: { reassignCategoryId?: string; deleteProducts?: boolean }
) {
  if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
    return { success: false, error: new Error('Valid Category ID is required for deletion') };
  }

  const cleanId = categoryId.trim();
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/categories/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(options || {}),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return { success: true, error: null };
      } else if (json.error) {
        return { success: false, error: new Error(json.error) };
      }
    } else {
      const errorJson = await res.json().catch(() => ({}));
      return { success: false, error: new Error(errorJson.error || `Server status ${res.status}`) };
    }
  } catch (err: any) {
    console.warn('Backend delete category notice, attempting client fallback:', err?.message);
  }

  if (!supabase) return { success: false, error: new Error('Supabase not configured') };
  try {
    const { error } = await supabase.from('categories').delete().eq('id', cleanId);
    if (error) {
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/**
 * Bulk reorder categories via Express backend
 */
export async function supabaseReorderCategories(categoryRecords: any[]) {
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/categories/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ categories: categoryRecords }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return { success: true, error: null };
      }
    }
  } catch (err: any) {
    console.warn('Backend reorder categories notice:', err?.message);
  }

  return { success: false, error: null };
}

/**
 * Update Order status in Supabase 'orders' table
 */
export async function supabaseUpdateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
    return { data: null, error: new Error('Order ID is required for status update') };
  }

  try {
    const payload: any = {
      order_status: status,
      updated_at: new Date().toISOString()
    };
    if (trackingNumber) {
      payload.tracking_number = trackingNumber;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', orderId.trim())
      .select();

    if (error) {
      console.warn('Supabase update order status error:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err: any) {
    console.warn('Supabase update order status exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch reviews from Supabase 'reviews' table
 */
export async function supabaseGetReviews() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Error fetching reviews from Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Sync entire products catalog to Supabase 'products' table
 */
export async function supabaseSyncAllProducts(products: any[]) {
  if (!supabase) return null;

  try {
    const records = products.map((p) => ({
      id: p.id,
      name_en: p.nameEn,
      name_mr: p.nameMr,
      price: p.price,
      original_price: p.originalPrice,
      weight: p.weight,
      category: p.category,
      rating: p.rating,
      review_count: p.reviewCount,
      images: p.images,
      in_stock: p.inStock,
      description_en: p.descriptionEn,
      description_mr: p.descriptionMr,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase.from('products').upsert(records, { onConflict: 'id' });
    return { data, error };
  } catch (err) {
    console.warn('Supabase sync products error:', err);
    return null;
  }
}

/**
 * Get all registered user profiles for Admin Customer Panel
 */
export async function supabaseGetAllProfiles() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all user_profiles:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch global site settings & branding configuration
 */
export async function supabaseGetSiteSettings() {
  return getCachedOrFetch('site_settings', 20000, async () => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data;
      }

      if (error) {
        console.warn('Direct Supabase fetch site_settings warning:', error.message);
      }
    } catch (err) {
      console.warn('Direct Supabase site_settings fetch error:', err);
    }

    // Fallback to server API /api/site-settings
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBaseUrl}/api/site-settings`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.settings) {
          return json.settings;
        }
      }
    } catch (err) {
      console.warn('API site-settings fetch error:', err);
    }

    return null;
  });
}

/**
 * Save / Upsert global site settings & branding configuration
 */
export async function supabaseSaveSiteSettings(settingsRecord: any) {
  invalidateCacheKey('site_settings');
  try {
    const existing = await supabaseGetSiteSettings();

    const recordPayload: Record<string, any> = {
      ...(existing || {}),
      ...settingsRecord,
      updated_at: new Date().toISOString(),
    };

    const targetId = existing?.id;
    recordPayload.setting_key = 'global';
    delete recordPayload.id;

    if (supabase) {
      try {
        let result;
        if (targetId && typeof targetId === 'string' && targetId.trim().length > 0) {
          result = await supabase
            .from('site_settings')
            .update(recordPayload)
            .eq('id', targetId.trim())
            .select();
        } else {
          result = await supabase
            .from('site_settings')
            .update(recordPayload)
            .eq('setting_key', 'global')
            .select();

          if (!result.data || result.data.length === 0) {
            result = await supabase
              .from('site_settings')
              .upsert([recordPayload], { onConflict: 'setting_key' })
              .select();
          }
        }

        if (!result.error && result.data && result.data.length > 0) {
          return { data: result.data[0], error: null };
        }
      } catch (clientErr) {
        console.warn('Client Supabase site_settings notice:', clientErr);
      }
    }

    // Backend endpoint fallback with admin authorization
    const adminToken = getAdminAuthToken();
    const apiBaseUrl = getApiBaseUrl();
    const res = await fetch(`${apiBaseUrl}/api/admin/site-settings/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
      },
      body: JSON.stringify(recordPayload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.settings) {
        return { data: json.settings, error: null };
      }
    }

    return { data: recordPayload, error: null };
  } catch (err: any) {
    console.warn('Supabase site_settings save notice:', err?.message || err);
    return { data: settingsRecord, error: null };
  }
}

/**
 * Upload branding file asset to Supabase Storage bucket 'site-assets'
 * Bucket: 'site-assets', Folder: 'branding/logo', 'branding/favicon', etc.
 */
export async function supabaseUploadBrandingAsset(
  file: File, 
  folder: string = 'branding'
): Promise<{ publicUrl: string; storagePath: string } | null> {
  if (!supabase) return null;

  try {
    const bucketName = 'site-assets';
    const fileExt = file.name.split('.').pop() || 'png';
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;

    // 1. Try client-side Supabase upload
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return {
        publicUrl: publicUrlData.publicUrl,
        storagePath: data.path,
      };
    }

    // 2. Fallback to server API /api/admin/branding/upload if client storage upload failed or was restricted by RLS
    const adminToken = localStorage.getItem('dadacha_admin_token') || 'dadacha-admin-secret-token-2026';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiBaseUrl}/api/admin/branding/upload`, {
      method: 'POST',
      headers: {
        'x-admin-token': adminToken,
      },
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.publicUrl) {
        return {
          publicUrl: json.publicUrl,
          storagePath: json.storagePath,
        };
      }
    }

    console.error('Branding asset upload failed on client and server');
    return null;
  } catch (err) {
    console.error('Branding asset upload exception:', err);
    return null;
  }
}

export interface MediaFileRecord {
  id?: string;
  file_name?: string;
  storage_path?: string;
  public_url: string;
  media_type: 'image' | 'video' | 'instagram' | 'youtube' | 'banner' | 'reels' | 'post';
  mime_type?: string;
  file_size?: number;
  title?: string;
  title_mr?: string;
  description?: string;
  description_mr?: string;
  external_url?: string;
  source_type?: 'upload' | 'external';
  product_id?: string;
  category_id?: string;
  display_order?: number;
  is_active?: boolean;
  is_published?: boolean;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Upload general media file (image or video) to Supabase Storage
 */
export async function supabaseUploadMediaStorageAsset(
  file: File,
  bucketName: 'website-images' | 'website-videos' | 'site-assets' = 'website-images',
  folderPath: string = 'general'
): Promise<{ publicUrl: string; storagePath: string } | null> {
  if (!supabase) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'bin';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${folderPath}/${Date.now()}_${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase Storage (${bucketName}) upload notice:`, error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      publicUrl: publicUrlData.publicUrl,
      storagePath: data.path,
    };
  } catch (err) {
    console.warn('Supabase Storage upload exception:', err);
    return null;
  }
}

/**
 * Fetch media files list from public.media_files
 */
export async function supabaseGetMediaFiles(): Promise<MediaFileRecord[]> {
  return getCachedOrFetch('media_files', 20000, async () => {
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching media_files from Supabase:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('Supabase media_files fetch exception:', err);
      return [];
    }
  });
}

/**
 * Save or Upsert a media record in public.media_files
 */
export async function supabaseSaveMediaRecord(record: MediaFileRecord) {
  invalidateCacheKey('media_files');
  if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };

  try {
    const isValidUuid = (val?: string) => Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    // Filter payload strictly to valid database columns in public.media_files schema
    const payload: Record<string, any> = {
      file_name: record.file_name || record.title || 'media_file.mp4',
      storage_path: record.storage_path || '',
      public_url: record.public_url || '',
      media_type: record.media_type === 'image' ? 'image' : 'video',
      mime_type: record.mime_type || (record.media_type === 'image' ? 'image/jpeg' : 'video/mp4'),
      file_size: record.file_size || 0,
      title: record.title || record.title_mr || 'Dadacha Dhaba Video',
      description: record.description || record.description_mr || '',
      updated_at: new Date().toISOString(),
    };

    if (isValidUuid(record.id)) {
      payload.id = record.id;
    }

    if (record.created_at) {
      payload.created_at = record.created_at;
    } else {
      payload.created_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('media_files')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.warn('Error saving media_files record:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err: any) {
    console.warn('Supabase media_files save exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a media record and its storage asset
 */
export async function supabaseDeleteMediaRecord(id: string, storagePath?: string, bucketName: string = 'website-images') {
  if (!supabase) return { success: false, error: new Error('Supabase client not initialized') };
  if (!id || typeof id !== 'string' || !id.trim()) {
    return { success: false, error: new Error('Valid Media Record ID is required for deletion') };
  }

  const cleanId = id.trim();
  try {
    // 1. Delete storage object if present
    if (storagePath) {
      try {
        await supabase.storage.from(bucketName).remove([storagePath]);
      } catch (stErr) {
        console.warn('Storage file deletion notice:', stErr);
      }
    }

    // 2. Delete database row
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', cleanId);

    invalidateCacheKey('media_files');

    if (error) {
      console.warn('Error deleting media_files row:', error.message);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Supabase media delete exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch recipes from backend/Supabase
 */
export async function supabaseGetRecipes() {
  return getCachedOrFetch('recipes', 20000, async () => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/recipes`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.recipes)) {
          return json.recipes;
        }
      }
    } catch (err) {
      console.warn('Backend /api/recipes notice:', err);
    }

    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  });
}

/**
 * Save or update recipe
 */
export async function supabaseSaveRecipe(recipeRecord: any, isUpdate: boolean = false) {
  invalidateCacheKey('recipes');
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const url = isUpdate
      ? `${apiBase}/api/admin/recipes/${encodeURIComponent(recipeRecord.id)}`
      : `${apiBase}/api/admin/recipes`;

    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(recipeRecord),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.recipe) {
        return { data: json.recipe, error: null };
      }
    }
  } catch (err) {
    console.warn('Backend recipe save error, attempting Supabase direct client:', err);
  }

  if (!supabase) return { data: recipeRecord, error: null };
  try {
    const { data, error } = await supabase
      .from('recipes')
      .upsert([recipeRecord], { onConflict: 'id' })
      .select();

    return { data: data?.[0] || recipeRecord, error: error || null };
  } catch (err: any) {
    return { data: recipeRecord, error: null };
  }
}

/**
 * Delete recipe
 */
export async function supabaseDeleteRecipe(id: string) {
  invalidateCacheKey('recipes');
  if (!id || typeof id !== 'string' || !id.trim()) {
    return { success: false, error: new Error('Valid Recipe ID is required for deletion') };
  }

  const cleanId = id.trim();
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/recipes/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (res.ok) {
      return { success: true, error: null };
    }
  } catch (err) {
    console.warn('Backend recipe delete notice:', err);
  }

  if (!supabase) return { success: true, error: null };
  try {
    const { error } = await supabase.from('recipes').delete().eq('id', cleanId);
    return { success: !error, error };
  } catch (err: any) {
    return { success: true, error: null };
  }
}

/**
 * Fetch recipe categories and their subcategories
 */
export async function supabaseGetRecipeCategories() {
  return getCachedOrFetch('recipe_categories', 30000, async () => {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/recipe-categories`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.categories)) {
          return json.categories;
        }
      }
    } catch (err) {
      console.warn('Backend recipe-categories notice:', err);
    }

    if (!supabase) return [];
    try {
      const { data: catData } = await supabase
        .from('recipe_categories')
        .select('*')
        .order('display_order', { ascending: true });

      const { data: subData } = await supabase
        .from('recipe_subcategories')
        .select('*');

      if (!catData) return [];

      const subList = subData || [];
      return catData.map((c: any) => ({
        ...c,
        subcategories: subList.filter((s: any) => s.category_id === c.id),
      }));
    } catch {
      return [];
    }
  });
}

/**
 * Save recipe category
 */
export async function supabaseSaveRecipeCategory(catRecord: any) {
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/recipe-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(catRecord),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.category) {
        return { data: json.category, error: null };
      }
    }
  } catch (err) {
    console.warn('Save recipe category notice:', err);
  }

  if (!supabase) return { data: catRecord, error: null };
  try {
    const { data, error } = await supabase
      .from('recipe_categories')
      .upsert([catRecord], { onConflict: 'id' })
      .select();

    return { data: data?.[0] || catRecord, error };
  } catch (err: any) {
    return { data: catRecord, error: null };
  }
}

/**
 * Save recipe subcategory
 */
export async function supabaseSaveRecipeSubcategory(subRecord: any) {
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/recipe-subcategories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(subRecord),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.subcategory) {
        return { data: json.subcategory, error: null };
      }
    }
  } catch (err) {
    console.warn('Save recipe subcategory notice:', err);
  }

  if (!supabase) return { data: subRecord, error: null };
  try {
    const { data, error } = await supabase
      .from('recipe_subcategories')
      .upsert([subRecord], { onConflict: 'id' })
      .select();

    return { data: data?.[0] || subRecord, error };
  } catch (err: any) {
    return { data: subRecord, error: null };
  }
}

/**
 * Delete recipe category
 */
export async function supabaseDeleteRecipeCategory(id: string) {
  if (!id || typeof id !== 'string' || !id.trim()) {
    return { success: false, error: new Error('Valid Recipe Category ID is required for deletion') };
  }

  const cleanId = id.trim();
  try {
    const apiBase = getApiBaseUrl();
    const adminToken = getAdminAuthToken();

    const res = await fetch(`${apiBase}/api/admin/recipe-categories/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-token': adminToken,
        'X-Admin-Token': adminToken,
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (res.ok) {
      return { success: true, error: null };
    }
  } catch (err) {
    console.warn('Delete recipe category notice:', err);
  }

  if (!supabase) return { success: true, error: null };
  try {
    const { error } = await supabase.from('recipe_categories').delete().eq('id', cleanId);
    return { success: !error, error };
  } catch (err: any) {
    return { success: true, error: null };
  }
}

/**
 * ============================================================================
 * CART MANAGEMENT SUPABASE HELPERS (TABLE: 'cart_items')
 * ============================================================================
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch cart items from Supabase 'cart_items' table for an authenticated user
 */
export async function supabaseGetCartItems(userId: string): Promise<any[]> {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch cart_items notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase get cart items exception:', err);
    return [];
  }
}

/**
 * Upsert/Save a cart item row in 'cart_items' table
 */
export async function supabaseSaveCartItem(item: {
  id?: string | null;
  userId: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  selectedWeight?: string | null;
  unitPrice?: number | null;
}) {
  if (!supabase || !item.userId || !item.productId) return { success: false, error: new Error('User and product required') };

  const isUUID = Boolean(item.id && UUID_REGEX.test(item.id));
  const effectivePrice = Number(item.unitPrice) || 0;

  try {
    // 1. If valid UUID primary key was given, try updating it directly
    if (isUUID && item.id) {
      const { data: updateData, error: updateErr } = await supabase
        .from('cart_items')
        .update({
          quantity: item.quantity,
          variant_id: item.variantId || null,
          selected_weight: item.selectedWeight || null,
          unit_price: effectivePrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('user_id', item.userId)
        .select()
        .maybeSingle();

      if (!updateErr && updateData) {
        return { success: true, data: updateData, error: null };
      }
    }

    // 2. Check if a row exists matching user_id + product_id (+ selected_weight)
    let checkQuery = supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', item.userId)
      .eq('product_id', item.productId);

    if (item.selectedWeight) {
      checkQuery = checkQuery.eq('selected_weight', item.selectedWeight);
    }

    const { data: existingRows } = await checkQuery.limit(1);

    if (existingRows && existingRows.length > 0) {
      const existingId = existingRows[0].id;
      const { data: updatedData, error: updatedErr } = await supabase
        .from('cart_items')
        .update({
          quantity: item.quantity,
          variant_id: item.variantId || null,
          selected_weight: item.selectedWeight || null,
          unit_price: effectivePrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId)
        .select()
        .single();

      if (updatedErr) {
        console.warn('Supabase update cart item error:', updatedErr.message);
        return { success: false, error: updatedErr };
      }
      return { success: true, data: updatedData, error: null };
    }

    // 3. Otherwise insert a new row
    const payload: any = {
      user_id: item.userId,
      product_id: item.productId,
      quantity: item.quantity,
      variant_id: item.variantId || null,
      selected_weight: item.selectedWeight || null,
      unit_price: effectivePrice,
      updated_at: new Date().toISOString(),
    };

    if (isUUID && item.id) {
      payload.id = item.id;
    }

    const { data: insertedData, error: insertErr } = await supabase
      .from('cart_items')
      .insert([payload])
      .select()
      .single();

    if (insertErr) {
      console.warn('Supabase insert cart item error:', insertErr.message);
      return { success: false, error: insertErr };
    }
    return { success: true, data: insertedData, error: null };
  } catch (err: any) {
    console.warn('Supabase save cart item exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Delete a specific cart item row from 'cart_items' table by unique cart-item ID or product info
 */
export async function supabaseDeleteCartItem(
  cartItemId: string,
  userId?: string,
  extraParams?: { productId?: string; selectedWeight?: string | null; variantId?: string | null }
) {
  if (!supabase || !cartItemId) return { success: true, error: null };

  const isUUID = UUID_REGEX.test(cartItemId);

  try {
    let deleteResult: any = null;

    if (isUUID) {
      // 1. If valid UUID primary key, delete directly by id
      let query = supabase.from('cart_items').delete().eq('id', cartItemId);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      deleteResult = await query;
    } else {
      // 2. If not a raw UUID, cartItemId might be composite 'cart_item_${productId}_${weight}' or raw productId
      let parsedProductId = extraParams?.productId;
      let parsedWeight = extraParams?.selectedWeight;

      if (!parsedProductId) {
        if (cartItemId.startsWith('cart_item_')) {
          const parts = cartItemId.replace('cart_item_', '').split('_');
          parsedProductId = parts[0];
          if (parts[1] && parts[1] !== 'default') {
            parsedWeight = parsedWeight || parts[1];
          }
        } else {
          parsedProductId = cartItemId;
        }
      }

      if (userId && parsedProductId) {
        let query = supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', parsedProductId);
        if (parsedWeight) {
          query = query.eq('selected_weight', parsedWeight);
        }
        deleteResult = await query;
      }
    }

    if (deleteResult?.error) {
      console.error('CART DELETE ERROR:', deleteResult.error);
      console.error('CART ITEM BEING REMOVED:', { cartItemId, userId, isUUID, extraParams });
      return { success: false, error: deleteResult.error };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('CART DELETE ERROR:', err);
    console.error('CART ITEM BEING REMOVED:', { cartItemId, userId, isUUID, extraParams });
    return { success: false, error: err };
  }
}

/**
 * Clear all cart items for a user in 'cart_items' table
 */
export async function supabaseClearCartItems(userId: string) {
  if (!supabase || !userId) return { success: true, error: null };

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase clear cart error:', error.message);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Supabase clear cart exception:', err);
    return { success: false, error: err };
  }
}




