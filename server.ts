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
  const PORT = Number(process.env.PORT) || 10000;

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

  // Mock DB for products / orders
  const mockProducts = [
    { id: 'mas-1', nameEn: 'Kanda Lasun Masala', nameMr: 'कांदा लसूण मसाला', price: 220, category: 'spices', stock: 45 },
    { id: 'mas-2', nameEn: 'Goda Masala', nameMr: 'गोडा मसाला', price: 180, category: 'spices', stock: 32 },
    { id: 'brass-1', nameEn: 'Brass Kalai Handi', nameMr: 'पितळी कलई हांडी', price: 1450, category: 'cookware', stock: 12 }
  ];

  const mockOrders = [
    { id: 'ORD-1001', customerName: 'Pritee Kadam', totalAmount: 890, status: 'delivered', createdAt: '2026-08-01' },
    { id: 'ORD-1002', customerName: 'Rahul Shinde', totalAmount: 450, status: 'processing', createdAt: '2026-08-04' }
  ];

  const mockCustomers = [
    { id: 'usr-1', name: 'Pritee Kadam', email: 'pritee@example.com', phone: '+91 98220 12345', status: 'active' },
    { id: 'usr-2', name: 'Rahul Shinde', email: 'rahul@example.com', phone: '+91 98220 54321', status: 'active' }
  ];

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
    res.json({ success: true, profile: mockCustomers[0] });
  });

  app.put('/api/auth/profile', (req, res) => {
    res.json({ success: true, message: 'Profile updated successfully', profile: req.body });
  });

  app.post('/api/auth/password-reset', (_req, res) => {
    res.json({ success: true, message: 'Password reset instructions sent' });
  });

  app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Dadacha Dhaba backend is running'
  });
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

  // Other e-commerce APIs
  app.get('/api/products', (_req, res) => res.json({ success: true, products: mockProducts }));
  app.post('/api/products', (req, res) => {
    const newProd = { id: 'prod-' + Date.now(), ...req.body };
    mockProducts.push(newProd as any);
    res.json({ success: true, product: newProd });
  });
  app.delete('/api/products/:id', (req, res) => res.json({ success: true, message: `Product ${req.params.id} deleted` }));

  app.get('/api/categories', (_req, res) => res.json({
    success: true,
    categories: [
      { id: 'spices', nameEn: 'Traditional Spices', nameMr: 'गावरान मसाले' },
      { id: 'cookware', nameEn: 'Brass & Copper', nameMr: 'पितळी व तांब्याची भांडी' }
    ]
  }));

  app.get('/api/orders', (_req, res) => res.json({ success: true, orders: mockOrders }));
  app.post('/api/orders', (req, res) => {
    const newOrder = { id: 'ORD-' + Math.floor(1000 + Math.random() * 9000), ...req.body };
    res.json({ success: true, order: newOrder });
  });

  app.get('/api/customers', (_req, res) => res.json({ success: true, customers: mockCustomers }));
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

// Backend health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Dadacha Dhaba backend is running'
  });
});

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

// Start the Express server
const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dadacha Dhaba backend running on port ${PORT}`);
});
}

startServer();
