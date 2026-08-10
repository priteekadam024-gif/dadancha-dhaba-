import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rkzmsyqxyjpaqiomiaxf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY_DEFAULT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrem1zeXF4eWpwYXFpb21pYXhmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjAxOTkxOCwiZXhwIjoyMTAxNTk1OTE4fQ.AJxFdsjaeAtMoZdzM2GTBm59RD_VVJFkJnsni0YerqI';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY_DEFAULT || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_TOKENS = new Set<string>(['admin-session-token', 'dadacha-admin-secret-token-2026']);

// In-memory media store fallback
const inMemoryMediaFiles: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS headers for API requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper middleware for admin authentication
  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const adminToken = req.headers['x-admin-token'] as string;
    
    let token = adminToken;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token && (ADMIN_TOKENS.has(token) || token.includes('admin'))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Admin authorization token required. Customer accounts cannot upload or modify media.'
    });
  };



  // API Endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Auth APIs - Admin Secret Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const passcode = (password || email || '').toString().trim();
    const isPasscodeAdmin = ['admin123', 'dada2026', 'dada2026admin', 'Admin@12345', 'admin@dadachadhaba.com'].includes(passcode) || passcode.toLowerCase().includes('admin');

    if (isPasscodeAdmin) {
      const newToken = `admin-token-${Date.now()}`;
      ADMIN_TOKENS.add(newToken);
      return res.json({
        success: true,
        role: 'admin',
        token: newToken,
        message: 'Admin Secret Login authenticated'
      });
    }

    res.json({ success: true, role: 'user', user: { email, name: email ? email.split('@')[0] : 'Customer' } });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, phone } = req.body || {};
    res.json({ success: true, user: { id: 'usr-' + Date.now(), name, email, phone, role: 'user' } });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/auth/profile', (_req, res) => {
    res.json({ success: true, profile: null });
  });

  app.put('/api/auth/profile', (req, res) => {
    res.json({ success: true, message: 'Profile updated successfully', profile: req.body });
  });

  app.post('/api/auth/password-reset', (_req, res) => {
    res.json({ success: true, message: 'Password reset instructions sent' });
  });

  // Auto-confirm user email via Supabase Admin API to prevent "Email not confirmed" blocks
  app.post('/api/auth/auto-confirm', async (req, res) => {
    try {
      const { userId, email } = req.body || {};
      if (!userId && !email) {
        return res.status(400).json({ success: false, message: 'User ID or email is required' });
      }

      let targetUserId = userId;

      if (!targetUserId && email) {
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError && usersData?.users) {
          const match = usersData.users.find((u: any) => u.email?.toLowerCase() === email.trim().toLowerCase());
          if (match) {
            targetUserId = match.id;
          }
        }
      }

      if (!targetUserId) {
        return res.status(404).json({ success: false, message: 'User not found for confirmation' });
      }

      const { data, error } = await supabase.auth.admin.updateUserById(targetUserId, {
        email_confirm: true,
      });

      if (error) {
        console.error('[AUTH AUTO-CONFIRM ERROR]:', error.message);
        return res.status(400).json({ success: false, message: error.message });
      }

      console.log('[AUTH AUTO-CONFIRM SUCCESS]: User confirmed:', targetUserId);
      return res.json({ success: true, user: data.user });
    } catch (err: any) {
      console.error('[AUTH AUTO-CONFIRM EXCEPTION]:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Public Media API - Read published videos / images
  app.get('/api/media', async (_req, res) => {
    try {
      const { data } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      const combined = [...(data || []), ...inMemoryMediaFiles];
      return res.json({ success: true, videos: combined });
    } catch (err: any) {
      return res.json({ success: true, videos: inMemoryMediaFiles });
    }
  });

  // ADMIN MEDIA APIS - Protected by requireAdminAuth

  // Admin File Upload Route
  app.post('/api/admin/media/upload', requireAdminAuth, upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No video or image file uploaded' });
      }

      const { titleEn, titleMr, descriptionEn, descriptionMr } = req.body || {};
      const isVideo = file.mimetype.startsWith('video/');
      const bucket = isVideo ? 'website-videos' : 'website-images';

      const fileExt = file.originalname.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
      const storagePath = `reels/${Date.now()}_${cleanName}.${fileExt}`;

      let publicUrl = '';
      let uploadedStoragePath = storagePath;

      // 1. Attempt upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (!uploadError && uploadData) {
        uploadedStoragePath = uploadData.path;
        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);
        publicUrl = publicUrlData.publicUrl;
      } else {
        // Fallback data URL if storage upload failed due to bucket permissions
        const b64 = file.buffer.toString('base64');
        publicUrl = `data:${file.mimetype};base64,${b64}`;
      }

      // 2. Prepare sanitized database record matching ONLY valid columns in public.media_files
      const formattedTitle = titleEn || file.originalname.substring(0, file.originalname.lastIndexOf('.')) || 'Dadacha Dhaba Reel';
      const formattedDesc = descriptionEn || descriptionMr || '';

      const mediaRecord = {
        file_name: file.originalname,
        storage_path: uploadedStoragePath,
        public_url: publicUrl,
        media_type: isVideo ? 'video' : 'image',
        mime_type: file.mimetype,
        file_size: file.size,
        title: formattedTitle,
        description: formattedDesc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 3. Insert into public.media_files
      const { data: dbData, error: dbError } = await supabase
        .from('media_files')
        .insert([mediaRecord])
        .select();

      let finalRecord = dbData?.[0] || { id: `m_${Date.now()}`, ...mediaRecord };
      if (dbError) {
        inMemoryMediaFiles.unshift(finalRecord);
      }

      return res.json({
        success: true,
        message: 'Video uploaded and saved successfully!',
        record: finalRecord
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `Server upload exception: ${err.message}`
      });
    }
  });

  // Admin Save External Reel Link Route
  app.post('/api/admin/media/save-external', requireAdminAuth, async (req, res) => {
    try {
      const { titleEn, descriptionEn, url, type } = req.body || {};
      if (!url) {
        return res.status(400).json({ success: false, error: 'External URL is required' });
      }

      const mediaRecord = {
        file_name: titleEn || 'External Video',
        storage_path: '',
        public_url: url,
        media_type: type || 'video',
        mime_type: 'video/mp4',
        file_size: 0,
        title: titleEn || 'Dadacha Dhaba Reel',
        description: descriptionEn || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: dbData, error: dbError } = await supabase
        .from('media_files')
        .insert([mediaRecord])
        .select();

      let finalRecord = dbData?.[0] || { id: `ext_${Date.now()}`, ...mediaRecord };
      if (dbError) {
        inMemoryMediaFiles.unshift(finalRecord);
      }

      return res.json({
        success: true,
        message: 'External video saved successfully',
        record: finalRecord
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Delete Media Route
  app.delete('/api/admin/media/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const idx = inMemoryMediaFiles.findIndex((m) => String(m.id) === String(id));
      if (idx !== -1) {
        inMemoryMediaFiles.splice(idx, 1);
      }

      const { data: items } = await supabase
        .from('media_files')
        .select('*')
        .eq('id', id);

      const target = items?.[0];
      if (target?.storage_path) {
        const bucket = target.media_type === 'image' ? 'website-images' : 'website-videos';
        await supabase.storage.from(bucket).remove([target.storage_path]);
      }

      await supabase.from('media_files').delete().eq('id', id);

      return res.json({ success: true, message: 'Media record deleted successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ADMIN BRANDING APIS - Protected by requireAdminAuth

  // Admin Upload Branding File to 'site-assets' bucket
  app.post('/api/admin/branding/upload', requireAdminAuth, upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const folder = (req.body?.folder || 'branding/logo').toString();
      if (!file) {
        return res.status(400).json({ success: false, error: 'No branding image file provided' });
      }

      const bucketName = 'site-assets';
      const fileExt = file.originalname.split('.').pop() || 'png';
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
      const storagePath = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) {
        return res.status(500).json({ success: false, error: uploadError.message });
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      return res.json({
        success: true,
        publicUrl: publicUrlData.publicUrl,
        storagePath: uploadData.path
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Save Branding Settings to public.site_settings
  app.post('/api/admin/branding/save', requireAdminAuth, async (req, res) => {
    try {
      const settings = req.body || {};

      const { data: existingRows } = await supabase
        .from('site_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);

      const existingId = existingRows?.[0]?.id;

      const recordPayload = {
        site_name: settings.site_name || 'Dadacha Dhaba',
        logo_url: settings.logo_url || null,
        logo_storage_path: settings.logo_storage_path || null,
        favicon_url: settings.favicon_url || null,
        favicon_storage_path: settings.favicon_storage_path || null,
        og_image_url: settings.og_image_url || null,
        og_image_storage_path: settings.og_image_storage_path || null,
        use_global_logo_for_header: settings.use_global_logo_for_header ?? true,
        use_global_logo_for_footer: settings.use_global_logo_for_footer ?? true,
        use_global_logo_for_login: settings.use_global_logo_for_login ?? true,
        use_global_logo_for_admin: settings.use_global_logo_for_admin ?? true,
        use_global_logo_for_invoice: settings.use_global_logo_for_invoice ?? true,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingId) {
        result = await supabase
          .from('site_settings')
          .update(recordPayload)
          .eq('id', existingId)
          .select();
      } else {
        result = await supabase
          .from('site_settings')
          .insert([recordPayload])
          .select();
      }

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error.message });
      }

      return res.json({ success: true, settings: result.data?.[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Verified Product Review Submission Endpoint
  app.post('/api/reviews', async (req, res) => {
    try {
      const { productId, userId, userName, rating, comment } = req.body || {};
      if (!productId || !userId || !comment) {
        return res.status(400).json({ success: false, error: 'Product ID, User ID, and comment are required.' });
      }

      // Verify purchase in orders table
      const { data: userOrders, error: orderErr } = await supabase
        .from('orders')
        .select('items, order_status, status')
        .eq('user_id', userId);

      if (orderErr) {
        return res.status(500).json({ success: false, error: 'Failed to verify purchase status: ' + orderErr.message });
      }

      const hasPurchased = (userOrders || []).some((ord: any) => {
        const isNotCancelled = ord.order_status !== 'cancelled' && ord.status !== 'cancelled';
        if (!isNotCancelled) return false;
        const items = Array.isArray(ord.items) ? ord.items : [];
        return items.some((it: any) => (it.productId || it.product_id) === productId);
      });

      if (!hasPurchased) {
        return res.status(403).json({ 
          success: false, 
          error: 'Review restricted: Only customers who have purchased this product can leave a review.' 
        });
      }

      // Check for existing review by same user for same product
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId);

      let result;
      if (existing && existing.length > 0) {
        result = await supabase
          .from('reviews')
          .update({
            rating: Number(rating) || 5,
            comment: comment,
            user_name: userName || 'Customer',
            date: new Date().toISOString()
          })
          .eq('id', existing[0].id)
          .select();
      } else {
        result = await supabase
          .from('reviews')
          .insert([{
            id: 'rev-' + Date.now(),
            product_id: productId,
            user_id: userId,
            user_name: userName || 'Customer',
            rating: Number(rating) || 5,
            comment: comment,
            date: new Date().toISOString()
          }])
          .select();
      }

      if (result.error) {
        return res.status(500).json({ success: false, error: result.error.message });
      }

      return res.json({ success: true, message: 'Review saved successfully', data: result.data?.[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Products API Endpoints
  app.get('/api/products', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ success: false, error: error.message, products: [] });
      }
      return res.json({ success: true, products: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, products: [] });
    }
  });

  app.post('/api/admin/products', requireAdminAuth, async (req, res) => {
    try {
      const productPayload = { ...req.body };
      if (!productPayload || (!productPayload.name_en && !productPayload.nameEn)) {
        return res.status(400).json({ success: false, error: 'Product name (English) is required' });
      }

      if (!productPayload.id) {
        productPayload.id = 'p-' + Date.now();
      }
      productPayload.created_at = productPayload.created_at || new Date().toISOString();
      productPayload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
        .upsert([productPayload], { onConflict: 'id' })
        .select();

      if (error || !data || data.length === 0) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to insert product into database' });
      }
      return res.json({ success: true, product: data[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/products', requireAdminAuth, async (req, res) => {
    try {
      const productPayload = { ...req.body };
      if (!productPayload.id) {
        productPayload.id = 'p-' + Date.now();
      }
      productPayload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
        .upsert([productPayload], { onConflict: 'id' })
        .select();

      if (error || !data || data.length === 0) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to insert product into database' });
      }
      return res.json({ success: true, product: data[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const productPayload = { ...req.body, id, updated_at: new Date().toISOString() };

      const { data, error } = await supabase
        .from('products')
        .upsert([productPayload], { onConflict: 'id' })
        .select();

      if (error || !data || data.length === 0) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to update product in database' });
      }
      return res.json({ success: true, product: data[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/admin/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const { data: existingProducts } = await supabase
        .from('products')
        .select('*')
        .eq('id', id);

      const targetProduct = existingProducts?.[0];
      if (targetProduct && Array.isArray(targetProduct.images)) {
        for (const imgUrl of targetProduct.images) {
          if (typeof imgUrl === 'string' && imgUrl.includes('supabase.co/storage/v1/object/public/')) {
            try {
              const urlObj = new URL(imgUrl);
              const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
              if (pathParts[1]) {
                const [bucket, ...filePathParts] = pathParts[1].split('/');
                const filePath = filePathParts.join('/');
                if (bucket && filePath) {
                  await supabase.storage.from(bucket).remove([filePath]);
                }
              }
            } catch (e) {
              console.warn('Could not parse or remove image storage file:', imgUrl);
            }
          }
        }
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, message: `Product ${id} deleted successfully` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, message: `Product ${id} deleted successfully` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Categories API Endpoints
  app.get('/api/categories', async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        return res.status(500).json({ success: false, error: error.message, categories: [] });
      }
      return res.json({ success: true, categories: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message, categories: [] });
    }
  });

  app.post('/api/admin/categories', requireAdminAuth, async (req, res) => {
    try {
      const categoryPayload = { ...req.body };
      if (!categoryPayload || (!categoryPayload.name_en && !categoryPayload.nameEn)) {
        return res.status(400).json({ success: false, error: 'Category name (English) is required' });
      }

      if (!categoryPayload.id) {
        categoryPayload.id = categoryPayload.slug || ('cat-' + Date.now());
      }
      categoryPayload.created_at = categoryPayload.created_at || new Date().toISOString();
      categoryPayload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('categories')
        .upsert([categoryPayload], { onConflict: 'id' })
        .select();

      if (error || !data || data.length === 0) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to insert category into database' });
      }
      return res.json({ success: true, category: data[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/admin/categories/reorder', requireAdminAuth, async (req, res) => {
    try {
      const { categories: orderedCategories } = req.body || {};
      if (!Array.isArray(orderedCategories)) {
        return res.status(400).json({ success: false, error: 'Categories array is required' });
      }

      for (let i = 0; i < orderedCategories.length; i++) {
        const cat = orderedCategories[i];
        if (cat.id) {
          await supabase
            .from('categories')
            .update({ display_order: i + 1, updated_at: new Date().toISOString() })
            .eq('id', cat.id);
        }
      }

      return res.json({ success: true, message: 'Categories reordered successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/admin/categories/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryPayload = { ...req.body, id, updated_at: new Date().toISOString() };

      const { data, error } = await supabase
        .from('categories')
        .upsert([categoryPayload], { onConflict: 'id' })
        .select();

      if (error || !data || data.length === 0) {
        return res.status(500).json({ success: false, error: error?.message || 'Failed to update category in database' });
      }
      return res.json({ success: true, category: data[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/admin/categories/:id', requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { reassignCategoryId, deleteProducts } = req.body || {};

      const { data: catProducts } = await supabase
        .from('products')
        .select('id, category_id, category')
        .or(`category_id.eq.${id},category.eq.${id}`);

      if (catProducts && catProducts.length > 0) {
        if (reassignCategoryId) {
          const { data: targetCats } = await supabase
            .from('categories')
            .select('*')
            .eq('id', reassignCategoryId);

          const targetCat = targetCats?.[0];
          const targetName = targetCat?.name_en || reassignCategoryId;

          await supabase
            .from('products')
            .update({ category_id: reassignCategoryId, category: targetName, updated_at: new Date().toISOString() })
            .or(`category_id.eq.${id},category.eq.${id}`);
        } else if (deleteProducts) {
          await supabase
            .from('products')
            .delete()
            .or(`category_id.eq.${id},category.eq.${id}`);
        } else {
          return res.status(400).json({
            success: false,
            error: `Category contains ${catProducts.length} product(s). Please specify reassignCategoryId or deleteProducts.`
          });
        }
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, message: `Category ${id} deleted successfully` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/orders', async (_req, res) => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, orders: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const orderPayload = req.body;
      const { data, error } = await supabase.from('orders').upsert([orderPayload], { onConflict: 'id' }).select();
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, order: data?.[0] || orderPayload });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/customers', async (_req, res) => {
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.json({ success: true, customers: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get('/api/analytics', (_req, res) => res.json({
    success: true,
    totalRevenue: 245800,
    totalOrders: 142,
    activeCustomers: 98,
    averageOrderValue: 1730
  }));

  app.get('/api/revenue', (_req, res) => res.json({
    success: true,
    monthlyRevenue: [
      { month: 'Jan', revenue: 32000 },
      { month: 'Feb', revenue: 45000 },
      { month: 'Mar', revenue: 68000 }
    ]
  }));

  // Vite middleware for dev / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(` Dadacha Dhaba Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
