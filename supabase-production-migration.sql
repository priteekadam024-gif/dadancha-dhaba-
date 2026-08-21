-- ============================================================================
-- DADACHA DHABA - COMPLETE PRODUCTION DATABASE MIGRATION
-- Compatible with PostgreSQL 14+ / Supabase
-- Safety: IDEMPOTENT, NON-DESTRUCTIVE (Preserves all existing data)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS & UTILITY FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable timestamp updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. SITE SETTINGS & BRANDING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE DEFAULT 'global',
  site_name TEXT DEFAULT 'Dadacha Dhaba',
  tagline_en TEXT DEFAULT 'Authentic Maharashtrian Spices & Homemade Taste',
  tagline_mr TEXT DEFAULT 'अस्सल महाराष्ट्रीयन चव आणि घरगुती मसाले',
  logo_url TEXT,
  logo_storage_path TEXT,
  favicon_url TEXT,
  favicon_storage_path TEXT,
  og_image_url TEXT,
  og_image_storage_path TEXT,
  login_logo_url TEXT,
  admin_logo_url TEXT,
  invoice_logo_url TEXT,
  use_global_logo_for_header BOOLEAN DEFAULT true,
  use_global_logo_for_footer BOOLEAN DEFAULT true,
  use_global_logo_for_login BOOLEAN DEFAULT true,
  use_global_logo_for_admin BOOLEAN DEFAULT true,
  use_global_logo_for_invoice BOOLEAN DEFAULT true,
  use_global_for_favicon BOOLEAN DEFAULT true,
  use_global_for_login BOOLEAN DEFAULT true,
  use_global_for_admin BOOLEAN DEFAULT true,
  use_global_for_invoice BOOLEAN DEFAULT true,
  use_global_for_og BOOLEAN DEFAULT true,
  phone TEXT DEFAULT '+91 98765 43210',
  whatsapp TEXT DEFAULT '+91 98765 43210',
  email TEXT DEFAULT 'contact@dadachadhaba.com',
  address TEXT DEFAULT 'Dadacha Dhaba, Pune-Nashik Highway, Maharashtra 410505',
  maps_url TEXT DEFAULT 'https://maps.google.com',
  business_hours TEXT DEFAULT 'Mon - Sun: 9:00 AM - 10:00 PM',
  instagram_url TEXT,
  youtube_url TEXT,
  facebook_url TEXT,
  latest_videos_count INTEGER DEFAULT 6,
  history JSONB DEFAULT '[]'::jsonb,
  contact_phone TEXT,
  contact_phone_secondary TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  contact_address_en TEXT,
  contact_address_mr TEXT,
  delivery_timelines_en TEXT DEFAULT 'Standard Delivery: 3-5 business days across Maharashtra',
  delivery_timelines_mr TEXT DEFAULT 'मानक वितरण: महाराष्ट्रात ३-५ कामकाजाचे दिवस',
  free_delivery_threshold NUMERIC(10,2) DEFAULT 499.00,
  standard_delivery_fee NUMERIC(10,2) DEFAULT 49.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure missing columns exist on existing table
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS setting_key TEXT DEFAULT 'global';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS site_name TEXT DEFAULT 'Dadacha Dhaba';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tagline_en TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tagline_mr TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS logo_storage_path TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS favicon_storage_path TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS og_image_storage_path TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS login_logo_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS admin_logo_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS invoice_logo_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_logo_for_header BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_logo_for_footer BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_logo_for_login BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_logo_for_admin BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_logo_for_invoice BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_for_favicon BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_for_login BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_for_admin BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_for_invoice BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS use_global_for_og BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS maps_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS latest_videos_count INTEGER DEFAULT 6;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_phone_secondary TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_whatsapp TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_address_en TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_address_mr TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS delivery_timelines_en TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS delivery_timelines_mr TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC(10,2) DEFAULT 499.00;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS standard_delivery_fee NUMERIC(10,2) DEFAULT 49.00;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Backfill setting_key for existing rows and ensure unique index
UPDATE public.site_settings SET setting_key = 'global' WHERE setting_key IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_setting_key ON public.site_settings(setting_key);

-- Insert default row ONLY if no row exists with setting_key = 'global' (Safe for UUID primary key)
INSERT INTO public.site_settings (setting_key, site_name)
VALUES ('global', 'Dadacha Dhaba')
ON CONFLICT (setting_key) DO NOTHING;

-- Branding history table
CREATE TABLE IF NOT EXISTS public.branding_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  login_logo_url TEXT,
  admin_logo_url TEXT,
  invoice_logo_url TEXT,
  og_image_url TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_mr TEXT,
  image_url TEXT,
  banner_url TEXT,
  mobile_banner_url TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_mr TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description_mr TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS mobile_banner_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS & VARIANTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  name TEXT,
  marathi_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  original_price NUMERIC(10,2) DEFAULT 0.00,
  discount_percent INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 100,
  in_stock BOOLEAN DEFAULT true,
  sku TEXT,
  description_en TEXT,
  description_mr TEXT,
  ingredients_en TEXT,
  ingredients_mr TEXT,
  ingredients TEXT,
  marathi_ingredients TEXT,
  weight TEXT DEFAULT '250g',
  brand TEXT DEFAULT 'Dadacha Dhaba',
  category_id TEXT,
  category TEXT,
  rating NUMERIC(3,2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_special_masala BOOLEAN DEFAULT false,
  is_kitchen_appliance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_mr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS marathi_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_mr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients_mr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT DEFAULT '250g';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'Dadacha Dhaba';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_special_masala BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_kitchen_appliance BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Normalized Product Variants Table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  weight TEXT NOT NULL,
  unit TEXT DEFAULT 'g',
  package_label TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount_percent INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 100,
  sku TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Normalized Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. RECIPES, CATEGORIES & SUBCATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_mr TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.recipe_categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.recipe_categories ADD COLUMN IF NOT EXISTS name_mr TEXT;
ALTER TABLE public.recipe_categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.recipe_categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.recipe_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.recipe_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS public.recipe_subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  slug TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.recipe_subcategories ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.recipe_subcategories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.recipe_subcategories ADD COLUMN IF NOT EXISTS name_mr TEXT;
ALTER TABLE public.recipe_subcategories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.recipe_subcategories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.recipe_subcategories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS public.recipes (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_mr TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_mr TEXT,
  category_id TEXT,
  category_name TEXT,
  subcategory_id TEXT,
  subcategory_name TEXT,
  read_time TEXT DEFAULT '5 min read',
  prep_time TEXT DEFAULT '15 mins',
  cook_time TEXT DEFAULT '30 mins',
  servings TEXT DEFAULT '4 Persons',
  difficulty TEXT DEFAULT 'Medium',
  ingredients_en JSONB DEFAULT '[]'::jsonb,
  ingredients_mr JSONB DEFAULT '[]'::jsonb,
  steps_en JSONB DEFAULT '[]'::jsonb,
  steps_mr JSONB DEFAULT '[]'::jsonb,
  tips_en TEXT,
  tips_mr TEXT,
  serving_suggestions_en TEXT,
  serving_suggestions_mr TEXT,
  image TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  related_product_id TEXT,
  related_product_name TEXT,
  author TEXT DEFAULT 'Dadacha Dhaba Chef',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS title_mr TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS description_mr TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS subcategory_id TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS subcategory_name TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS ingredients_en JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS ingredients_mr JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS steps_en JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS steps_mr JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 5. USER PROFILES & ADDRESSES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  role TEXT DEFAULT 'customer',
  points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  notifications JSONB DEFAULT '{"orders":true,"promotions":false,"recipes":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS notifications JSONB;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT,
  street TEXT,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  landmark TEXT,
  type TEXT DEFAULT 'home',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra';
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'home';
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE public.user_addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Automatic Auth User to user_profiles Trigger
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 6. ORDERS, ORDER ITEMS & PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  shipping_charge NUMERIC(10,2) DEFAULT 0.00,
  shipping_fee NUMERIC(10,2) DEFAULT 0.00,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  discount NUMERIC(10,2) DEFAULT 0.00,
  gst_amount NUMERIC(10,2) DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) DEFAULT 0.00,
  payment_method TEXT DEFAULT 'razorpay',
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  tracking_number TEXT,
  carrier TEXT,
  estimated_delivery_date TIMESTAMPTZ,
  coupon_code TEXT,
  date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  payment_amount_paise BIGINT,
  paid_at TIMESTAMPTZ,
  payment_failure_reason TEXT,
  payment_error TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_signature TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Dedicated Normalized Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  variant_id TEXT,
  product_name TEXT NOT NULL,
  variant_weight TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount NUMERIC(10,2) DEFAULT 0.00,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Dedicated Razorpay Payments Log Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT DEFAULT 'razorpay',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  failure_code TEXT,
  failure_description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. REVIEWS (VERIFIED PURCHASE LINKED)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 5.0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 8. CART & WISHLIST
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_weight TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id, selected_weight)
);

CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id)
);

-- ----------------------------------------------------------------------------
-- 9. COUPONS & DISCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
  value NUMERIC(10,2) NOT NULL,
  minimum_order_value NUMERIC(10,2) DEFAULT 0.00,
  max_discount NUMERIC(10,2),
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. MEDIA FILES & GALLERY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by TEXT,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  public_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  mime_type TEXT,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS public_url TEXT;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 11. CONTACT MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT DEFAULT 'General Inquiry',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied'
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);

CREATE INDEX IF NOT EXISTS idx_recipes_slug ON public.recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON public.recipes(category_id);
CREATE INDEX IF NOT EXISTS idx_recipes_published ON public.recipes(is_published);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON public.recipes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_categories_slug ON public.recipe_categories(slug);
CREATE INDEX IF NOT EXISTS idx_recipe_subcategories_cat ON public.recipe_subcategories(category_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_rzp_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_rzp_payment_id ON public.payments(razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ----------------------------------------------------------------------------
-- 13. AUTOMATED UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'site_settings', 'categories', 'products', 'product_variants',
      'recipe_categories', 'recipe_subcategories', 'recipes',
      'user_profiles', 'user_addresses', 'orders', 'payments',
      'reviews', 'cart_items', 'coupons', 'media_files', 'contact_messages'
    )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl, tbl);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 14. DYNAMIC CATEGORY PRODUCT COUNT HELPER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_category_item_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.categories c
  SET item_count = (
    SELECT COUNT(*)
    FROM public.products p
    WHERE p.category_id = c.id
       OR p.category = c.name_en
       OR p.category = c.slug
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep category item counts updated when products change
CREATE OR REPLACE FUNCTION public.trigger_update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_category_item_counts();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_category_count ON public.products;
CREATE TRIGGER trg_products_category_count
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_update_category_count();

-- Initial sync of category counts
SELECT public.sync_category_item_counts();

-- ----------------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 15.1 Site Settings & Branding (Public Read, Service Role / Admin Write)
DROP POLICY IF EXISTS "Public can view site_settings" ON public.site_settings;
CREATE POLICY "Public can view site_settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view branding_history" ON public.branding_history;
CREATE POLICY "Public can view branding_history" ON public.branding_history FOR SELECT USING (true);

-- 15.2 Categories & Products (Public Read Active/Published)
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public can view in-stock products" ON public.products;
CREATE POLICY "Public can view in-stock products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active product variants" ON public.product_variants;
CREATE POLICY "Public can view active product variants" ON public.product_variants FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);

-- 15.3 Recipes & Recipe Taxonomy
DROP POLICY IF EXISTS "Public can view active recipe categories" ON public.recipe_categories;
CREATE POLICY "Public can view active recipe categories" ON public.recipe_categories FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public can view active recipe subcategories" ON public.recipe_subcategories;
CREATE POLICY "Public can view active recipe subcategories" ON public.recipe_subcategories FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Public can view published recipes" ON public.recipes;
CREATE POLICY "Public can view published recipes" ON public.recipes FOR SELECT USING (is_published = true OR auth.role() = 'service_role');

-- 15.4 User Profiles & Addresses (Self Only)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own addresses" ON public.user_addresses;
CREATE POLICY "Users can view own addresses" ON public.user_addresses FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.user_addresses;
CREATE POLICY "Users can insert own addresses" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.user_addresses;
CREATE POLICY "Users can update own addresses" ON public.user_addresses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.user_addresses;
CREATE POLICY "Users can delete own addresses" ON public.user_addresses FOR DELETE USING (auth.uid() = user_id);

-- 15.5 Orders & Order Items (Customer can view own; backend writes/updates)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR o.user_id IS NULL OR auth.role() = 'service_role')
  )
);

-- 15.6 Payments (Read own payment logs; server manages mutations)
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 15.7 Reviews (Public Read; Authenticated Insert/Update for own)
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own review" ON public.reviews;
CREATE POLICY "Users can insert own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
CREATE POLICY "Users can update own review" ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15.8 Cart & Wishlist (Self Only)
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15.9 Coupons (Public View Active)
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

-- 15.10 Media Files (Public View Active)
DROP POLICY IF EXISTS "Public can view active media files" ON public.media_files;
CREATE POLICY "Public can view active media files" ON public.media_files FOR SELECT USING (is_active = true OR auth.role() = 'service_role');

-- 15.11 Contact Messages (Public Insert; Admin Read)
DROP POLICY IF EXISTS "Public can submit contact messages" ON public.contact_messages;
CREATE POLICY "Public can submit contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can read contact messages" ON public.contact_messages;
CREATE POLICY "Service role can read contact messages" ON public.contact_messages FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
