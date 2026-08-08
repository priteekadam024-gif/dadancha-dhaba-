import express from 'express';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = Number(process.env.PORT) || 10000;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_SECRET =
  process.env.ADMIN_SECRET;

if (!SUPABASE_URL) {
  throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is not configured');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
}

if (!ADMIN_SECRET) {
  throw new Error('ADMIN_SECRET is not configured');
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

// Active admin sessions.
// These are intentionally kept server-side.
const ADMIN_TOKENS = new Map<
  string,
  {
    createdAt: number;
  }
>();

// In-memory fallback for temporary runtime use only.
// Supabase remains the permanent source of truth.
const inMemoryMediaFiles: any[] = [];

const mockProducts: any[] = [
  {
    id: 'mas-1',
    nameEn: 'Kanda Lasun Masala',
    nameMr: 'कांदा लसूण मसाला',
    price: 220,
    category: 'spices',
    stock: 45
  },
  {
    id: 'mas-2',
    nameEn: 'Goda Masala',
    nameMr: 'गोडा मसाला',
    price: 180,
    category: 'spices',
    stock: 32
  },
  {
    id: 'brass-1',
    nameEn: 'Brass Kalai Handi',
    nameMr: 'पितळी कलई हांडी',
    price: 1450,
    category: 'cookware',
    stock: 12
  }
];

const mockOrders: any[] = [
  {
    id: 'ORD-1001',
    customerName: 'Customer',
    totalAmount: 890,
    status: 'delivered',
    createdAt: '2026-08-01'
  },
  {
    id: 'ORD-1002',
    customerName: 'Customer',
    totalAmount: 450,
    status: 'processing',
    createdAt: '2026-08-04'
  }
];

const mockCustomers: any[] = [];

/**
 * Securely compare two strings.
 */
function secureCompare(
  supplied: string,
  expected: string
): boolean {
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);

  if (suppliedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    suppliedBuffer,
    expectedBuffer
  );
}

/**
 * Generate a cryptographically secure admin session token.
 */
function createAdminToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extract admin token from request.
 */
function getAdminToken(
  req: express.Request
): string {
  const headerToken = req.headers['x-admin-token'];

  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }

  const authorization = req.headers.authorization;

  if (
    typeof authorization === 'string' &&
    authorization.startsWith('Bearer ')
  ) {
    return authorization.slice(7).trim();
  }

  return '';
}

/**
 * Admin-only middleware.
 */
function requireAdminAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const token = getAdminToken(req);

  if (!token) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized: Admin authorization token required.'
    });
  }

  const session = ADMIN_TOKENS.get(token);

  if (!session) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired admin session.'
    });
  }

  // 24-hour admin session.
  const SESSION_DURATION =
    24 * 60 * 60 * 1000;

  if (
    Date.now() - session.createdAt >
    SESSION_DURATION
  ) {
    ADMIN_TOKENS.delete(token);

    return res.status(403).json({
      success: false,
      error: 'Admin session expired. Please log in again.'
    });
  }

  return next();
}

async function startServer() {
  const app = express();

  app.use(
    express.json({
      limit: '50mb'
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: '50mb'
    })
  );

  /**
   * HEALTH CHECK
   */
  app.get('/api/health', (_req, res) => {
    return res.status(200).json({
      status: 'ok',
      time: new Date().toISOString()
    });
  });

  /**
   * ADMIN LOGIN
   *
   * Password is checked ONLY against
   * Render's ADMIN_SECRET environment variable.
   */
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } =
        req.body || {};

      const suppliedPassword =
        typeof password === 'string'
          ? password.trim()
          : '';

      if (!suppliedPassword) {
        return res.status(400).json({
          success: false,
          message: 'Admin password is required.'
        });
      }

      if (
        !secureCompare(
          suppliedPassword,
          ADMIN_SECRET
        )
      ) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin password.'
        });
      }

      const token = createAdminToken();

      ADMIN_TOKENS.set(token, {
        createdAt: Date.now()
      });

      return res.status(200).json({
        success: true,
        role: 'admin',
        token,
        message: 'Admin Secret Login authenticated'
      });
    } catch (error: any) {
      console.error(
        'Admin login error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Admin login failed.'
      });
    }
  });

  /**
   * ADMIN LOGOUT
   */
  app.post(
    '/api/auth/logout',
    (req, res) => {
      const token = getAdminToken(req);

      if (token) {
        ADMIN_TOKENS.delete(token);
      }

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  );

  /**
   * CUSTOMER REGISTER
   *
   * NOTE:
   * This is kept compatible with your
   * existing frontend. Real customer
   * authentication should use Supabase Auth.
   */
  app.post(
    '/api/auth/register',
    (req, res) => {
      const {
        name,
        email,
        phone
      } = req.body || {};

      return res.json({
        success: true,
        user: {
          id: 'usr-' + Date.now(),
          name,
          email,
          phone,
          role: 'user'
        }
      });
    }
  );

  /**
   * CUSTOMER PROFILE
   */
  app.get(
    '/api/auth/profile',
    (_req, res) => {
      return res.json({
        success: true,
        profile:
          mockCustomers[0] || null
      });
    }
  );

  app.put(
    '/api/auth/profile',
    (req, res) => {
      return res.json({
        success: true,
        message:
          'Profile updated successfully',
        profile: req.body
      });
    }
  );

  /**
   * Password reset placeholder.
   *
   * Real customer password resets
   * should be handled by Supabase Auth.
   */
  app.post(
    '/api/auth/password-reset',
    (_req, res) => {
      return res.json({
        success: true,
        message:
          'Customer password reset should be handled through Supabase Auth.'
      });
    }
  );

  /**
   * PUBLIC MEDIA
   *
   * Customers can read media.
   * They cannot write/delete media.
   */
  app.get(
    '/api/media',
    async (_req, res) => {
      try {
        const {
          data,
          error
        } = await supabase
          .from('media_files')
          .select('*')
          .order('created_at', {
            ascending: false
          });

        if (error) {
          console.error(
            'Media fetch error:',
            error
          );

          return res.json({
            success: true,
            videos:
              inMemoryMediaFiles
          });
        }

        return res.json({
          success: true,
          videos: data || []
        });
      } catch (error: any) {
        console.error(
          'Media API error:',
          error
        );

        return res.json({
          success: true,
          videos:
            inMemoryMediaFiles
        });
      }
    }
  );

  /**
   * ADMIN MEDIA UPLOAD
   *
   * Only authenticated admin sessions
   * can reach this route.
   */
  app.post(
    '/api/admin/media/upload',
    requireAdminAuth,
    upload.single('file'),
    async (req, res) => {
      let uploadedStoragePath = '';
      let uploadedBucket = '';

      try {
        const file = req.file;

        if (!file) {
          return res.status(400).json({
            success: false,
            error:
              'No video or image file uploaded.'
          });
        }

        const {
          titleEn,
          titleMr,
          descriptionEn,
          descriptionMr
        } = req.body || {};

        const isVideo =
          file.mimetype.startsWith(
            'video/'
          );

        const bucket = isVideo
          ? 'website-videos'
          : 'website-images';

        uploadedBucket = bucket;

        const originalExtension =
          file.originalname
            .split('.')
            .pop()
            ?.toLowerCase() ||
          (isVideo ? 'mp4' : 'jpg');

        const cleanName =
          file.originalname
            .replace(
              /\.[^/.]+$/,
              ''
            )
            .replace(
              /[^a-zA-Z0-9_-]/g,
              '_'
            );

        const storagePath =
          `reels/${Date.now()}_${cleanName}.${originalExtension}`;

        /**
         * Upload to Supabase Storage.
         */
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage
          .from(bucket)
          .upload(
            storagePath,
            file.buffer,
            {
              contentType:
                file.mimetype,
              upsert: false
            }
          );

        if (
          uploadError ||
          !uploadData
        ) {
          console.error(
            'Supabase Storage upload error:',
            uploadError
          );

          return res.status(500).json({
            success: false,
            error:
              uploadError?.message ||
              'Storage upload failed.'
          });
        }

        uploadedStoragePath =
          uploadData.path;

        const {
          data: publicUrlData
        } = supabase.storage
          .from(bucket)
          .getPublicUrl(
            uploadData.path
          );

        const publicUrl =
          publicUrlData.publicUrl;

        const formattedTitle =
          titleEn ||
          titleMr ||
          file.originalname.replace(
            /\.[^/.]+$/,
            ''
          ) ||
          'Dadacha Dhaba Reel';

        const formattedDescription =
          descriptionEn ||
          descriptionMr ||
          '';

        const now =
          new Date().toISOString();

        /**
         * Database record.
         *
         * Only columns known to exist
         * in your current media_files schema
         * are sent.
         */
        const mediaRecord = {
          file_name:
            file.originalname,

          storage_path:
            uploadedStoragePath,

          public_url:
            publicUrl,

          media_type:
            isVideo
              ? 'video'
              : 'image',

          mime_type:
            file.mimetype,

          file_size:
            file.size,

          title:
            formattedTitle,

          description:
            formattedDescription,

          created_at: now,

          updated_at: now
        };

        const {
          data: dbData,
          error: dbError
        } = await supabase
          .from('media_files')
          .insert([
            mediaRecord
          ])
          .select()
          .single();

        /**
         * If DB insertion fails,
         * remove the uploaded file.
         *
         * This prevents orphaned files.
         */
        if (
          dbError ||
          !dbData
        ) {
          console.error(
            'media_files insert error:',
            dbError
          );

          await supabase.storage
            .from(bucket)
            .remove([
              uploadedStoragePath
            ]);

          return res.status(500).json({
            success: false,
            error:
              dbError?.message ||
              'Media database record could not be created.'
          });
        }

        /**
         * Only now report success.
         */
        return res.status(200).json({
          success: true,
          message:
            'Video/image uploaded and saved successfully.',
          record: dbData
        });
      } catch (error: any) {
        console.error(
          'Admin media upload exception:',
          error
        );

        /**
         * Cleanup if something failed
         * after storage upload.
         */
        if (
          uploadedBucket &&
          uploadedStoragePath
        ) {
          try {
            await supabase.storage
              .from(uploadedBucket)
              .remove([
                uploadedStoragePath
              ]);
          } catch (cleanupError) {
            console.error(
              'Storage cleanup error:',
              cleanupError
            );
          }
        }

        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            'Server upload failed.'
        });
      }
    }
  );

  /**
   * ADMIN SAVE EXTERNAL REEL
   */
  app.post(
    '/api/admin/media/save-external',
    requireAdminAuth,
    async (req, res) => {
      try {
        const {
          titleEn,
          descriptionEn,
          url,
          type
        } = req.body || {};

        if (
          !url ||
          typeof url !== 'string'
        ) {
          return res.status(400).json({
            success: false,
            error:
              'External URL is required.'
          });
        }

        const now =
          new Date().toISOString();

        const mediaRecord = {
          file_name:
            titleEn ||
            'External Video',

          storage_path: '',

          public_url:
            url,

          media_type:
            type || 'video',

          mime_type:
            'video/mp4',

          file_size: 0,

          title:
            titleEn ||
            'Dadacha Dhaba Reel',

          description:
            descriptionEn || '',

          created_at: now,

          updated_at: now
        };

        const {
          data,
          error
        } = await supabase
          .from('media_files')
          .insert([
            mediaRecord
          ])
          .select()
          .single();

        if (error || !data) {
          return res.status(500).json({
            success: false,
            error:
              error?.message ||
              'Could not save external media.'
          });
        }

        return res.status(200).json({
          success: true,
          message:
            'External video saved successfully.',
          record: data
        });
      } catch (error: any) {
        console.error(
          'External media error:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            'Failed to save external media.'
        });
      }
    }
  );

  /**
   * ADMIN DELETE MEDIA
   */
  app.delete(
    '/api/admin/media/:id',
    requireAdminAuth,
    async (req, res) => {
      try {
        const { id } =
          req.params;

        /**
         * Get record before deleting it.
         */
        const {
          data: items,
          error: lookupError
        } = await supabase
          .from('media_files')
          .select('*')
          .eq('id', id)
          .limit(1);

        if (lookupError) {
          return res.status(500).json({
            success: false,
            error:
              lookupError.message
          });
        }

        const target =
          items?.[0];

        /**
         * Remove Storage asset first
         * when one exists.
         */
        if (target?.storage_path) {
          const bucket =
            target.media_type === 'image'
              ? 'website-images'
              : 'website-videos';

          const { error: storageError } =
            await supabase.storage
              .from(bucket)
              .remove([target.storage_path]);

          if (storageError) {
            console.error(
              'Storage deletion error:',
              storageError
            );

            return res.status(500).json({
              success: false,
              error:
                storageError.message ||
                'Could not delete the uploaded storage file.'
            });
          }
        }

        /**
         * Delete database record using the server-side
         * Supabase service-role client.
         */
        const {
          data: deletedRows,
          error: deleteError
        } = await supabase
          .from('media_files')
          .delete()
          .eq('id', id)
          .select('id');

        if (deleteError) {
          return res.status(500).json({
            success: false,
            error:
              deleteError.message
          });
        }

        if (!deletedRows || deletedRows.length === 0) {
          return res.status(404).json({
            success: false,
            error:
              'Media record was not found or could not be deleted.'
          });
        }

        /**
         * Remove temporary in-memory copy.
         */
        const index =
          inMemoryMediaFiles.findIndex(
            (media) =>
              String(media.id) ===
              String(id)
          );

        if (index !== -1) {
          inMemoryMediaFiles.splice(
            index,
            1
          );
        }

        return res.json({
          success: true,
          message:
            'Media record deleted successfully.'
        });
      } catch (error: any) {
        console.error(
          'Media deletion error:',
          error
        );

        return res.status(500).json({
          success: false,
          error:
            error?.message ||
            'Failed to delete media.'
        });
      }
    }
  );

  /**
   * EXISTING E-COMMERCE COMPATIBILITY APIs
   *
   * These are retained so your current
   * frontend does not suddenly break.
   *
   * IMPORTANT:
   * These are still demo/in-memory endpoints.
   * They should later be replaced with
   * Supabase database operations.
   */

  app.get(
    '/api/products',
    (_req, res) => {
      return res.json({
        success: true,
        products:
          mockProducts
      });
    }
  );

  app.post(
    '/api/products',
    requireAdminAuth,
    (req, res) => {
      const newProduct = {
        id:
          'prod-' +
          Date.now(),
        ...req.body
      };

      mockProducts.push(
        newProduct
      );

      return res.json({
        success: true,
        product:
          newProduct
      });
    }
  );

  app.delete(
    '/api/products/:id',
    requireAdminAuth,
    (req, res) => {
      const id =
        req.params.id;

      const index =
        mockProducts.findIndex(
          (product) =>
            String(product.id) ===
            String(id)
        );

      if (index !== -1) {
        mockProducts.splice(
          index,
          1
        );
      }

      return res.json({
        success: true,
        message:
          `Product ${id} deleted`
      });
    }
  );

  app.get(
    '/api/categories',
    (_req, res) => {
      return res.json({
        success: true,
        categories: [
          {
            id: 'spices',
            nameEn:
              'Traditional Spices',
            nameMr:
              'गावरान मसाले'
          },
          {
            id: 'cookware',
            nameEn:
              'Brass & Copper',
            nameMr:
              'पितळी व तांब्याची भांडी'
          }
        ]
      });
    }
  );

  app.get(
    '/api/orders',
    (_req, res) => {
      return res.json({
        success: true,
        orders:
          mockOrders
      });
    }
  );

  app.post(
    '/api/orders',
    (req, res) => {
      const newOrder = {
        id:
          'ORD-' +
          Math.floor(
            1000 +
              Math.random() *
                9000
          ),
        ...req.body
      };

      mockOrders.push(
        newOrder
      );

      return res.json({
        success: true,
        order:
          newOrder
      });
    }
  );

  app.get(
    '/api/customers',
    (_req, res) => {
      return res.json({
        success: true,
        customers:
          mockCustomers
      });
    }
  );

  app.get(
    '/api/analytics',
    (_req, res) => {
      return res.json({
        success: true,
        totalRevenue: 0,
        totalOrders:
          mockOrders.length,
        activeCustomers:
          mockCustomers.length,
        averageOrderValue: 0
      });
    }
  );

  app.get(
    '/api/revenue',
    (_req, res) => {
      return res.json({
        success: true,
        monthlyRevenue: []
      });
    }
  );

  /**
   * Vite middleware for development.
   */
  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true
        },
        appType: 'spa'
      });

    app.use(
      vite.middlewares
    );
  } else {
    /**
     * Serve React production build.
     */
    const distPath =
      path.join(
        process.cwd(),
        'dist'
      );

    app.use(
      express.static(
        distPath
      )
    );

    /**
     * SPA fallback.
     *
     * API routes above this point
     * have already been handled.
     */
    app.get(
      '*',
      (_req, res) => {
        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );
      }
    );
  }

  /**
   * Start server.
   */
  app.listen(
    PORT,
    '0.0.0.0',
    () => {
      console.log(
        `Dadacha Dhaba backend running on port ${PORT}`
      );
    }
  );
}

startServer().catch(
  (error) => {
    console.error(
      'Failed to start Dadacha Dhaba backend:',
      error
    );

    process.exit(1);
  }
);
