-- =========================================================
-- DADACHA DHABA PERMANENT CATALOG MIGRATION
-- Enables RLS and configures safe Public Read & Protected Service Role CRUD
-- Run this script in your Supabase SQL Editor (https://app.supabase.com)
-- =========================================================

-- 1. Ensure 'products' table exists with complete columns
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  slug TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  discount_percent NUMERIC DEFAULT 0,
  stock_quantity INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  sku TEXT,
  description_en TEXT,
  description_mr TEXT,
  ingredients_en TEXT,
  ingredients_mr TEXT,
  weight TEXT DEFAULT '250g',
  brand TEXT DEFAULT 'Dadacha Dhaba',
  category_id TEXT DEFAULT 'spices',
  category TEXT DEFAULT 'Spices',
  rating NUMERIC DEFAULT 5.0,
  review_count INT DEFAULT 1,
  images JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_special_masala BOOLEAN DEFAULT false,
  is_kitchen_appliance BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist safely if table was already created
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_mr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_mr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients_en TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients_mr TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight TEXT DEFAULT '250g';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'Dadacha Dhaba';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id TEXT DEFAULT 'spices';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Spices';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_special_masala BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_kitchen_appliance BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Ensure 'categories' table exists with complete columns
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  slug TEXT,
  description_en TEXT,
  description_mr TEXT,
  image_url TEXT,
  banner_url TEXT,
  mobile_banner_url TEXT,
  icon TEXT,
  display_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  item_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist safely if table was already created
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_mr TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description_mr TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS mobile_banner_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS item_count INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Create Public SELECT Policies (Website visitors can view catalog)
DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories
  FOR SELECT USING (true);

-- 5. Seed initial default categories if empty
INSERT INTO public.categories (id, name_en, name_mr, slug, display_order, is_active)
VALUES 
  ('spices', 'Traditional Spices', 'गावरान मसाले', 'spices', 1, true),
  ('cookware', 'Brass & Copper Cookware', 'पितळी व तांब्याची भांडी', 'cookware', 2, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed initial default products if empty
INSERT INTO public.products (id, name_en, name_mr, price, original_price, category_id, category, stock_quantity, in_stock, images)
VALUES
  ('mas-1', 'Kanda Lasun Masala', 'कांदा लसूण मसाला', 220, 280, 'spices', 'Traditional Spices', 45, true, '["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800"]'::jsonb),
  ('mas-2', 'Goda Masala', 'गोडा मसाला', 180, 220, 'spices', 'Traditional Spices', 32, true, '["https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&q=80&w=800"]'::jsonb),
  ('brass-1', 'Brass Kalai Handi', 'पितळी कलई हांडी', 1450, 1800, 'cookware', 'Brass & Copper Cookware', 12, true, '["https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&q=80&w=800"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
