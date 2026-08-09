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

/**
 * Register a new user with Supabase Auth
 * Creates entry in auth.users and updates user_profiles table
 */
export async function supabaseSignUp(email: string, password: string, fullName: string, phone: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client is not configured.') };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone,
      },
    },
  });

  if (error) {
    return { data: null, error };
  }

  if (data.user) {
    // Upsert into user_profiles
    const profileRecord = {
      user_id: data.user.id,
      full_name: fullName,
      email: email.toLowerCase(),
      phone: phone || '',
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase.from('user_profiles').upsert(profileRecord, { onConflict: 'user_id' });
    if (profileError) {
      console.warn('user_profiles upsert notice:', profileError.message);
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

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
    if (address.id && !address.id.startsWith('addr-')) {
      result = await supabase.from('user_addresses').update(payload).eq('id', address.id);
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
  if (!supabase || addressId.startsWith('addr-')) return null;

  try {
    const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
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
 * Save or submit product review to Supabase 'reviews' table
 */
export async function supabaseSaveReview(review: any) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('reviews').insert([
      {
        id: review.id || 'rev-' + Date.now(),
        product_id: review.productId,
        user_id: review.userId || null,
        user_name: review.userName,
        rating: review.rating,
        comment: review.comment,
        date: new Date().toISOString(),
      }
    ]);
    return { data, error };
  } catch (err) {
    console.warn('Supabase review insert error:', err);
    return null;
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

/**
 * Fetch products from Supabase 'products' table
 */
export async function supabaseGetProducts() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching products from Supabase:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase get products exception:', err);
    return [];
  }
}

/**
 * Save or Upsert product to Supabase 'products' table
 */
export async function supabaseSaveProduct(productRecord: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  try {
    const { data, error } = await supabase
      .from('products')
      .upsert([productRecord], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase save product notice:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err: any) {
    console.warn('Supabase save product exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete product from Supabase 'products' table
 */
export async function supabaseDeleteProduct(productId: string) {
  if (!supabase) return { success: false, error: new Error('Supabase not configured') };

  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Supabase delete product notice:', error.message);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Supabase delete product exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch categories from Supabase 'categories' table
 */
export async function supabaseGetCategories() {
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
}

/**
 * Save or Upsert category to Supabase 'categories' table
 */
export async function supabaseSaveCategory(categoryRecord: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  try {
    const { data, error } = await supabase
      .from('categories')
      .upsert([categoryRecord], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('Supabase save category notice:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err: any) {
    console.warn('Supabase save category exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete category from Supabase 'categories' table
 */
export async function supabaseDeleteCategory(categoryId: string) {
  if (!supabase) return { success: false, error: new Error('Supabase not configured') };

  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) {
      console.warn('Supabase delete category notice:', error.message);
      return { success: false, error };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.warn('Supabase delete category exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Update Order status in Supabase 'orders' table
 */
export async function supabaseUpdateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

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
      .eq('id', orderId)
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
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching site_settings:', error.message);
    }
    return data || null;
  } catch (err) {
    console.warn('Supabase site_settings fetch error:', err);
    return null;
  }
}

/**
 * Save / Upsert global site settings & branding configuration
 */
export async function supabaseSaveSiteSettings(settingsRecord: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  try {
    const existing = await supabaseGetSiteSettings();

    const recordPayload: Record<string, any> = {
      site_name: settingsRecord.site_name || 'Dadacha Dhaba',
      logo_url: settingsRecord.logo_url || null,
      logo_storage_path: settingsRecord.logo_storage_path || null,
      favicon_url: settingsRecord.favicon_url || null,
      favicon_storage_path: settingsRecord.favicon_storage_path || null,
      og_image_url: settingsRecord.og_image_url || null,
      og_image_storage_path: settingsRecord.og_image_storage_path || null,
      use_global_logo_for_header: settingsRecord.use_global_logo_for_header ?? true,
      use_global_logo_for_footer: settingsRecord.use_global_logo_for_footer ?? true,
      use_global_logo_for_login: settingsRecord.use_global_logo_for_login ?? true,
      use_global_logo_for_admin: settingsRecord.use_global_logo_for_admin ?? true,
      use_global_logo_for_invoice: settingsRecord.use_global_logo_for_invoice ?? true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing?.id) {
      result = await supabase
        .from('site_settings')
        .update(recordPayload)
        .eq('id', existing.id)
        .select();
    } else {
      result = await supabase
        .from('site_settings')
        .insert([recordPayload])
        .select();
    }

    if (result.error) {
      console.warn('Supabase site_settings save notice:', result.error.message);
      return { data: null, error: result.error };
    }
    return { data: result.data?.[0], error: null };
  } catch (err: any) {
    console.warn('Supabase site_settings save fetch warning:', err?.message || err);
    return { data: null, error: err };
  }
}

/**
 * Upload branding file asset to Supabase Storage bucket 'site-assets'
 * Bucket: 'site-assets', Folder: 'branding/logo', 'branding/favicon', etc.
 */
export async function supabaseUploadBrandingAsset(file: File, folder: string = 'branding'): Promise<{ publicUrl: string; storagePath: string } | null> {
  if (!supabase) return null;

  try {
    const bucketName = 'site-assets';
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    // Attempt upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage upload warning (falling back to Data URL if bucket missing):', error.message);
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
}

/**
 * Save or Upsert a media record in public.media_files
 */
export async function supabaseSaveMediaRecord(record: MediaFileRecord) {
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
      .eq('id', id);

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


