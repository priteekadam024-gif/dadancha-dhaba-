-- =========================================================
-- PERMANENT SUPABASE DATABASE SCHEMA FOR DADACHA DHABA
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- =========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create User Profiles Table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth TEXT,
  role TEXT DEFAULT 'user',
  points INT DEFAULT 100,
  status TEXT DEFAULT 'active',
  notifications JSONB DEFAULT '{"emailOffers": true, "smsOrderUpdates": true, "whatsAppTracking": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create User Saved Addresses Table
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'home',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Permanent Orders Table
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
  shipping_address JSONB,
  items JSONB,
  subtotal NUMERIC,
  discount_amount NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC,
  payment_method TEXT,
  payment_status TEXT,
  order_status TEXT,
  tracking_number TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Persistent Cart Table
CREATE TABLE IF NOT EXISTS public.user_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 6. Create Persistent Wishlist Table
CREATE TABLE IF NOT EXISTS public.user_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 7. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now()
);

-- 8. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create Products Catalog Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  weight TEXT,
  category TEXT,
  rating NUMERIC DEFAULT 5,
  review_count INT DEFAULT 0,
  images JSONB,
  in_stock BOOLEAN DEFAULT true,
  description_en TEXT,
  description_mr TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create Central Site Settings & Branding Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_name TEXT DEFAULT 'Dadacha Dhaba',
  tagline_mr TEXT DEFAULT 'चव आमची ओळख तुमची ! ❤️',
  tagline_en TEXT DEFAULT 'Taste, Service & Authentic Dhaba Love ❤️',
  logo_url TEXT DEFAULT '/assets/dadacha-dhaba-logo.png',
  logo_storage_path TEXT,
  favicon_url TEXT DEFAULT '/assets/dadacha-dhaba-logo.png',
  favicon_storage_path TEXT,
  login_logo_url TEXT,
  admin_logo_url TEXT,
  invoice_logo_url TEXT,
  og_image_url TEXT,
  use_global_for_favicon BOOLEAN DEFAULT true,
  use_global_for_login BOOLEAN DEFAULT true,
  use_global_for_admin BOOLEAN DEFAULT true,
  use_global_for_invoice BOOLEAN DEFAULT true,
  use_global_for_og BOOLEAN DEFAULT true,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- Whenever a user is created in auth.users, create user_profiles record
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: User A can NEVER access User B's data
-- =========================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER ADDRESSES POLICIES
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.user_addresses;
CREATE POLICY "Users can manage own addresses" ON public.user_addresses
  FOR ALL USING (auth.uid() = user_id);

-- ORDERS POLICIES
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- USER CART POLICIES
DROP POLICY IF EXISTS "Users can manage own cart" ON public.user_cart;
CREATE POLICY "Users can manage own cart" ON public.user_cart
  FOR ALL USING (auth.uid() = user_id);

-- USER WISHLIST POLICIES
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.user_wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.user_wishlist
  FOR ALL USING (auth.uid() = user_id);

-- PUBLIC ACCESS POLICIES
DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- SITE SETTINGS POLICIES
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can upsert site settings" ON public.site_settings;
CREATE POLICY "Anyone can upsert site settings" ON public.site_settings
  FOR ALL USING (true);

-- MEDIA FILES TABLE
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT,
  public_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  mime_type TEXT,
  file_size NUMERIC,
  title TEXT,
  description TEXT,
  external_url TEXT,
  source_type TEXT DEFAULT 'upload',
  product_id TEXT,
  category_id TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read media_files" ON public.media_files;
CREATE POLICY "Public can read media_files" ON public.media_files
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can manage media_files" ON public.media_files;
CREATE POLICY "Anyone can manage media_files" ON public.media_files
  FOR ALL USING (true);

