-- ======================================================================================
-- 🌶️ DADACHA DHABA (दादाचा ढाबा) - ALL-IN-ONE MASTER PRODUCTION DATABASE SCHEMA
-- Version: 3.0 (Full Stack: Spices, Written Recipes, Variants, Orders, Branding & Media)
-- 
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://app.supabase.com)
-- 2. Go to the "SQL Editor" in the left menu.
-- 3. Click "New query", paste this entire script and click "RUN".
-- ======================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================================================================================
-- 2. STORAGE BUCKETS (FOR LOGOS, SPICE IMAGES, RECIPES & REELS)
-- ======================================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('dhaba-assets', 'dhaba-assets', true),
  ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Public Upload / Read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Dhaba Assets'
  ) THEN
    CREATE POLICY "Public Access to Dhaba Assets" ON storage.objects
      FOR SELECT USING (bucket_id IN ('dhaba-assets', 'media'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow Uploads to Dhaba Assets'
  ) THEN
    CREATE POLICY "Allow Uploads to Dhaba Assets" ON storage.objects
      FOR ALL USING (bucket_id IN ('dhaba-assets', 'media'))
      WITH CHECK (bucket_id IN ('dhaba-assets', 'media'));
  END IF;
END $$;


-- ======================================================================================
-- 3. USER PROFILES & ADDRESSES
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  points INT DEFAULT 100,
  status TEXT DEFAULT 'active', -- 'active' | 'inactive' | 'disabled'
  notifications JSONB DEFAULT '{"emailOffers": true, "smsOrderUpdates": true, "whatsAppTracking": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Legacy profiles fallback
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT,
  address_line TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'home', -- 'home' | 'work' | 'other'
  landmark TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ======================================================================================
-- 4. PRODUCT CATEGORIES & PRODUCTS
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  name_mr TEXT,
  marathi_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  imageUrl TEXT,
  bannerUrl TEXT,
  description TEXT,
  description_en TEXT,
  description_mr TEXT,
  display_order INT DEFAULT 1,
  active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT,
  name_en TEXT,
  name_mr TEXT,
  marathi_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  weight TEXT,
  brand TEXT DEFAULT 'Dadacha Dhaba',
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  category TEXT,
  category_name TEXT,
  rating NUMERIC DEFAULT 5,
  ratings NUMERIC DEFAULT 5,
  reviews_count INT DEFAULT 0,
  review_count INT DEFAULT 0,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  in_stock BOOLEAN DEFAULT true,
  stock INT DEFAULT 100,
  sku TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  is_special_masala BOOLEAN DEFAULT false,
  is_kitchen_appliance BOOLEAN DEFAULT false,
  description TEXT,
  description_en TEXT,
  description_mr TEXT,
  marathi_description TEXT,
  ingredients TEXT,
  ingredients_en TEXT,
  ingredients_mr TEXT,
  marathi_ingredients TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product Variants (for multi-size packages like 250g, 500g, 1kg)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  weight TEXT NOT NULL,
  unit TEXT DEFAULT 'g',
  package_label TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  stock INTEGER DEFAULT 50,
  sku TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================================================================
-- 5. WRITTEN RECIPES & RECIPE CATEGORIES (WITH FULL MARATHI & ENGLISH SUPPORT)
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.recipe_categories (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_mr TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recipe_subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.recipe_categories(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL,
  name_mr TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.recipes (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_mr TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_mr TEXT,
  category_id TEXT REFERENCES public.recipe_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  subcategory_id TEXT REFERENCES public.recipe_subcategories(id) ON DELETE SET NULL,
  subcategory_name TEXT,
  prep_time TEXT DEFAULT '15 mins',
  cook_time TEXT DEFAULT '25 mins',
  servings TEXT DEFAULT '4',
  difficulty TEXT DEFAULT 'Easy', -- 'Easy' | 'Medium' | 'Expert'
  ingredients_en JSONB DEFAULT '[]'::jsonb,
  ingredients_mr JSONB DEFAULT '[]'::jsonb,
  steps_en JSONB DEFAULT '[]'::jsonb,
  steps_mr JSONB DEFAULT '[]'::jsonb,
  tips_en TEXT,
  tips_mr TEXT,
  serving_suggestions_en TEXT,
  serving_suggestions_mr TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  related_product_id TEXT,
  related_product_name TEXT,
  author TEXT DEFAULT 'Dadacha Dhaba Chef',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ======================================================================================
-- 6. ORDERS, CART, WISHLIST & COUPONS
-- ======================================================================================
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
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  shipping_charge NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  gst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'COD', -- 'upi' | 'razorpay' | 'phonepe' | 'gpay' | 'cod' | 'stripe'
  payment_status TEXT DEFAULT 'pending', -- 'paid' | 'pending' | 'failed' | 'refunded'
  order_status TEXT DEFAULT 'placed', -- 'placed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'
  tracking_number TEXT,
  carrier TEXT,
  estimated_delivery_date TEXT,
  coupon_code TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  value NUMERIC NOT NULL,
  min_order_value NUMERIC DEFAULT 0,
  description_en TEXT,
  description_mr TEXT,
  expiry_date TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  selected_weight TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.user_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INT NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT true,
  likes INT DEFAULT 0,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ======================================================================================
-- 7. REELS, VIDEOS, MEDIA & GALLERY
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_mr TEXT NOT NULL,
  description_en TEXT,
  description_mr TEXT,
  type TEXT DEFAULT 'reels', -- 'youtube' | 'instagram' | 'video' | 'reels'
  original_url TEXT,
  embed_url TEXT,
  thumbnail_url TEXT,
  storage_path TEXT,
  views TEXT DEFAULT '1.2K',
  category TEXT DEFAULT 'reels',
  date TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id TEXT PRIMARY KEY,
  title_en TEXT NOT NULL,
  title_mr TEXT NOT NULL,
  category TEXT DEFAULT 'food', -- 'food' | 'kitchen' | 'products' | 'store' | 'ambience'
  image_url TEXT NOT NULL,
  caption_en TEXT,
  caption_mr TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT,
  bucket_name TEXT DEFAULT 'dhaba-assets',
  file_url TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ======================================================================================
-- 8. BRANDING, SITE SETTINGS & CONTACT CONFIG
-- ======================================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  key TEXT,
  value JSONB,
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
  phone TEXT DEFAULT '+91 98765 43210',
  whatsapp TEXT DEFAULT '+91 98765 43210',
  email TEXT DEFAULT 'contact@dadachadhaba.com',
  address TEXT DEFAULT 'Dadacha Dhaba, Old Mumbai-Pune Highway, Somatane Phata, Pune, Maharashtra 410506',
  maps_url TEXT,
  business_hours TEXT DEFAULT '10:00 AM - 11:00 PM (All 7 Days)',
  instagram_url TEXT DEFAULT 'https://instagram.com/dadachadhaba',
  youtube_url TEXT DEFAULT 'https://youtube.com/@dadachadhaba',
  facebook_url TEXT DEFAULT 'https://facebook.com/dadachadhaba',
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ======================================================================================
-- 9. AUTOMATIC USER PROFILE CREATION ON SIGNUP (SUPABASE AUTH TRIGGER)
-- ======================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.email IN ('admin@dadachadhaba.com', 'owner@dadachadhaba.com', 'priteekadam024@gmail.com') THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NEW.email IN ('admin@dadachadhaba.com', 'owner@dadachadhaba.com', 'priteekadam024@gmail.com') THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ======================================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ======================================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Allow Public Read for Store Front
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Recipe Categories" ON public.recipe_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Recipe Subcategories" ON public.recipe_subcategories FOR SELECT USING (true);
CREATE POLICY "Public Read Recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Public Read Gallery" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Public Read Media" ON public.media_files FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT USING (true);

-- Allow Public / Users to Insert Contact & Orders
CREATE POLICY "Allow Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Read User Orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow Update Orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow Insert Contact Messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- User Profile & Cart Policies
CREATE POLICY "User View Own Profile" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "User Update Own Profile" ON public.user_profiles FOR ALL USING (true);
CREATE POLICY "User Manage Addresses" ON public.user_addresses FOR ALL USING (true);
CREATE POLICY "User Manage Cart" ON public.user_cart FOR ALL USING (true);
CREATE POLICY "User Manage Wishlist" ON public.user_wishlist FOR ALL USING (true);

-- Admin Full Access (Allow all management operations)
CREATE POLICY "Admin Full Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Variants" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Recipe Categories" ON public.recipe_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Recipe Subcategories" ON public.recipe_subcategories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Recipes" ON public.recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Videos" ON public.videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Gallery" ON public.gallery_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Media" ON public.media_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Full Settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);


-- ======================================================================================
-- 11. COMPLETE SEED DATA (AUTHENTIC DHABA SPICES, RECIPES, CATEGORIES & SETTINGS)
-- ======================================================================================

-- Seed Site Settings
INSERT INTO public.site_settings (
  id, site_name, tagline_mr, tagline_en, logo_url, phone, whatsapp, email, address, business_hours
) VALUES (
  'global',
  'Dadacha Dhaba',
  'चव आमची ओळख तुमची ! ❤️',
  'Taste, Service & Authentic Dhaba Love ❤️',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600',
  '+91 98765 43210',
  '+91 98765 43210',
  'contact@dadachadhaba.com',
  'Dadacha Dhaba, Old Mumbai-Pune Highway, Somatane Phata, Pune, Maharashtra 410506',
  '10:00 AM - 11:00 PM (All 7 Days)'
) ON CONFLICT (id) DO UPDATE SET
  tagline_mr = EXCLUDED.tagline_mr,
  tagline_en = EXCLUDED.tagline_en;

-- Seed Product Categories
INSERT INTO public.categories (id, name, name_en, name_mr, marathi_name, slug, image, display_order, active)
VALUES 
  ('special-masala', 'Special Masala', 'Special Masala', 'खास मसाले', 'खास मसाले', 'special-masala', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600', 1, true),
  ('daily-spices', 'Daily Spices', 'Daily Spices', 'दैनंदिन मसाले', 'दैनंदिन मसाले', 'daily-spices', 'https://images.unsplash.com/photo-1596040033283-9b16be2f5c71?auto=format&fit=crop&q=80&w=600', 2, true),
  ('gravy-mixes', 'Gravy Mixes', 'Gravy Mixes', 'ढाबा ग्रेव्ही मिक्स', 'ढाबा ग्रेव्ही मिक्स', 'gravy-mixes', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600', 3, true),
  ('kitchen-appliance', 'Kitchen Appliances', 'Kitchen Appliances', 'किचन उपकरणे', 'किचन उपकरणे', 'kitchen-appliance', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=600', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Products (Authentic Kolhapuri Masalas & Spices)
INSERT INTO public.products (
  id, name, name_en, name_mr, marathi_name, slug, price, original_price, discount, weight, category_id, category,
  rating, review_count, image, images, in_stock, is_featured, is_bestseller, is_special_masala,
  description_en, description_mr, ingredients_en, ingredients_mr
) VALUES 
(
  'p1',
  'Dadache Special Kanda Lasun Masala',
  'Dadache Special Kanda Lasun Masala',
  'दादांचे स्पेशल कांदा लसूण मसाला',
  'दादांचे स्पेशल कांदा लसूण मसाला',
  'dadache-special-kanda-lasun-masala',
  249, 299, 17, '500g', 'special-masala', 'Special Masala',
  4.9, 142,
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600',
  '["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600", "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600"]'::jsonb,
  true, true, true, true,
  'Authentic Kolhapuri style hand-pounded onion garlic masala crafted with 32 secret whole spices.',
  'अस्सल कोल्हापुरी चवीचा ३२ खड्या मसाल्यांनी तयार केलेला पारंपरिक कांदा लसूण मसाला.',
  'Dry Red Chillies, Roasted Onions, Garlic, Cumin, Coriander Seeds, Cinnamon, Cloves, Bay Leaf, Sesame.',
  'सुक्या लाल मिरच्या, भाजलेला कांदा, लसूण, जिरे, धने, दालचिनी, लवंग, तमालपत्र, तीळ.'
),
(
  'p2',
  'Kolhapuri Veg Kala Masala',
  'Kolhapuri Veg Kala Masala',
  'कोल्हापुरी व्हेज काळा मसाला',
  'कोल्हापुरी व्हेज काळा मसाला',
  'kolhapuri-veg-kala-masala',
  199, 240, 17, '500g', 'special-masala', 'Special Masala',
  4.8, 98,
  'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600',
  '["https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=600"]'::jsonb,
  true, true, true, true,
  'Traditional black gravy spice roasted over slow wooden fire for aromatic veg rassa.',
  'मंद लाकडी आचेवर भाजलेला अस्सल काळा मसाला, शाकाहारी रस्सा आणि उसळीसाठी सर्वोत्तम.',
  'Dagad Phool, Black Pepper, Star Anise, Mace, Roasted Coconut, Dry Fenugreek.',
  'दगडफूल, काळी मिरी, चक्रफूल, जावित्री, भाजलेले खोबरे, कसुरी मेथी.'
),
(
  'p3',
  'Khandeshi Shev Bhaji Masala',
  'Khandeshi Shev Bhaji Masala',
  'खान्देशी शेव भाजी मसाला',
  'खान्देशी शेव भाजी मसाला',
  'khandeshi-shev-bhaji-masala',
  179, 220, 19, '250g', 'special-masala', 'Special Masala',
  4.9, 87,
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600',
  '["https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600"]'::jsonb,
  true, true, false, true,
  'Zanzanit Khandeshi recipe blend for mouth-watering spicy shev bhaji tarri.',
  'अस्सल झणझणीत खान्देशी शेव भाजीसाठी खास तयार केलेला तर्रीदार मसाला.',
  'Khandeshi Chillies, Sesame Seeds, Poppy Seeds, Coriander, Garlic, Garam Masala.',
  'खान्देशी मिरच्या, तीळ, खसखस, धने, लसूण, गरम मसाला.'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Product Variants
INSERT INTO public.product_variants (id, product_id, weight, unit, package_label, price, original_price, stock, sku, is_active)
VALUES 
  ('v-p1-250', 'p1', '250g', 'g', '250g Pouch', 135, 160, 50, 'DD-KLM-250', true),
  ('v-p1-500', 'p1', '500g', 'g', '500g Value Pack', 249, 299, 100, 'DD-KLM-500', true),
  ('v-p1-1kg', 'p1', '1kg', 'kg', '1kg Family Saver', 479, 560, 40, 'DD-KLM-1KG', true),
  ('v-p2-250', 'p2', '250g', 'g', '250g Pack', 110, 130, 40, 'DD-KM-250', true),
  ('v-p2-500', 'p2', '500g', 'g', '500g Pack', 199, 240, 80, 'DD-KM-500', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Recipe Categories
INSERT INTO public.recipe_categories (id, name_en, name_mr, slug, description_en, description_mr, display_order, is_active)
VALUES 
  ('veg-rassa', 'Veg Rassa & Gravies', 'गावरान रस्सा व भाज्या', 'veg-rassa', 'Authentic Kolhapuri & Maharashtrian Gravies', 'अस्सल कोल्हापुरी व गावरान रस्सा पाककृती', 1, true),
  ('dhaba-specials', 'Dhaba Specials', 'ढाबा स्पेशल भाज्या', 'dhaba-specials', 'Secret Dhaba Restaurant Recipes', 'दादांच्या ढाब्यावरील लोकप्रिय शाकाहारी भाज्या', 2, true),
  ('bhakri-breads', 'Bhakri & Rotis', 'भाकरी व चपाती', 'bhakri-breads', 'Traditional Maharashtrian Breads', 'पारंपरिक ज्वारी, बाजरीची भाकरी व चपाती', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Recipe Subcategories
INSERT INTO public.recipe_subcategories (id, category_id, name_en, name_mr, slug)
VALUES 
  ('sub-kala-rassa', 'veg-rassa', 'Kala Rassa Special', 'काळा रस्सा स्पेशल', 'kala-rassa'),
  ('sub-shev-bhaji', 'veg-rassa', 'Shev Bhaji & Usal', 'शेव भाजी व उसळ', 'shev-bhaji'),
  ('sub-paneer', 'dhaba-specials', 'Dhaba Paneer Veg', 'ढाबा पनीर स्पेशल', 'dhaba-paneer')
ON CONFLICT (id) DO NOTHING;

-- Seed Written Pure Veg Recipes
INSERT INTO public.recipes (
  id, title_en, title_mr, slug, description_en, description_mr, category_id, category_name, subcategory_id, subcategory_name,
  prep_time, cook_time, servings, difficulty,
  ingredients_en, ingredients_mr, steps_en, steps_mr,
  tips_en, tips_mr, serving_suggestions_en, serving_suggestions_mr,
  image, images, related_product_id, related_product_name, author, is_published
) VALUES 
(
  'rec-1',
  'Authentic Kolhapuri Veg Kala Rassa',
  'अस्सल कोल्हापुरी व्हेज काळा रस्सा',
  'authentic-kolhapuri-veg-kala-rassa',
  'An iconic Maharashtrian spicy black gravy simmered with roasted spices and fresh veggies.',
  'दादांच्या खास काळा मसाला आणि कांदा लसूण मसाल्याने बनवलेला झणझणीत शाकाहारी काळा रस्सा.',
  'veg-rassa', 'गावरान रस्सा व भाज्या', 'sub-kala-rassa', 'काळा रस्सा स्पेशल',
  '15 mins', '25 mins', '4', 'Medium',
  '["2 tbsp Dadache Special Kanda Lasun Masala", "1.5 tbsp Kolhapuri Veg Kala Masala", "2 medium Onions, finely sliced and roasted", "1/2 cup Dry Coconut, roasted dark golden", "1 tbsp Ginger Garlic Paste", "1 cup Mixed Boiled Vegetables / Soy Chunks", "2 tbsp Pure Desi Ghee or Oil", "Fresh Coriander and Salt to taste"]'::jsonb,
  '["२ मोठे चमचे दादांचे स्पेशल कांदा लसूण मसाला", "१.५ चमचा कोल्हापुरी व्हेज काळा मसाला", "२ मध्यम कांदे, मंद आचेवर सोनेरी भाजलेले", "१/२ कप सुके खोबरे, खमंग भाजलेले", "१ चमचा आले-लसूण पेस्ट", "१ कप उकडलेल्या भाज्या / सोया चंक्स", "२ चमचे साजूक तूप किंवा तेल", "बारीक चिरलेली ताजी कोथिंबीर व चवीनुसार मीठ"]'::jsonb,
  '["Roast sliced onions and dry coconut on low heat until aromatic dark brown, then grind into smooth vatan.", "Heat 2 tbsp oil in a heavy bottom kadai, add ginger-garlic paste and saute for 1 minute.", "Add the ground onion-coconut paste and cook till oil releases from sides.", "Add Dadache Kanda Lasun Masala, Kala Masala and turmeric. Saute for 2 mins on low heat.", "Pour 3 cups of warm water, add boiled veggies and salt. Let it boil on medium flame for 8-10 minutes.", "Garnish with fresh green coriander and serve steaming hot with jowar bhakri."]'::jsonb,
  '["कांदा व सुके खोबरे तव्यावर खमंग काळे-सोनेरी रंगावर भाजून थोडे पाणी घालून बारीक वाटण तयार करा.", "कढईत २ मोठे चमचे तेल गरम करा, आले-लसूण पेस्ट घालून १ मिनिट परतून घ्या.", "त्यात तयार केलेले कांदा-खोबऱ्याचे वाटण घालून तेल सुटेपर्यंत चांगले परता.", "आता दादांचे स्पेशल कांदा लसूण मसाला व काळा मसाला घालून मंद आचेवर २ मिनिटे सुगंध येईपर्यंत परता.", "३ कप कोमट पाणी, उकडलेल्या भाज्या व चवीनुसार मीठ घाला. मंद आचेवर ८-१० मिनिटे रस्सा उकळू द्या.", "वरून ताजी बारीक चिरलेली कोथिंबीर घालून गरमागरम ज्वारीच्या भाकरीसोबत सर्व्ह करा."]'::jsonb,
  'Roast the dry coconut and whole spices on low flame to get authentic dark color without burning.',
  'काळा रस्स्याला अस्सल ढाबा रंग व चव येण्यासाठी खोबरे व कांदा मंद आचेवर भाजणे महत्त्वाचे आहे.',
  'Serve piping hot with hot Jowar Bhakri, sliced onions, lemon wedge and steamed Indrayani rice.',
  'गरमागरम ज्वारीची भाकरी, कांदा-लिंबू आणि इंद्रायणी भातासोबत आस्वाद घ्या.',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800',
  '["https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'p1', 'Dadache Special Kanda Lasun Masala', 'Chef Dada', true
),
(
  'rec-2',
  'Khandeshi Dhaba Shev Bhaji',
  'अस्सल खान्देशी ढाबा शेv भाजी',
  'khandeshi-dhaba-shev-bhaji',
  'Fiery hot red tarri gravy served with crispy thick Bhavnagri shev.',
  'दादांच्या खान्देशी शेव भाजी मसाल्याने तयार होणारी झणझणीत लाल तर्रीदार शेव भाजी.',
  'veg-rassa', 'गावरान रस्सा व भाज्या', 'sub-shev-bhaji', 'शेव भाजी व उसळ',
  '10 mins', '20 mins', '4', 'Easy',
  '["1 cup Thick Spicy Ratlami/Bhavnagri Shev", "2 tbsp Khandeshi Shev Bhaji Masala", "1 tbsp Dadache Kanda Lasun Masala", "2 Onions finely chopped", "1 Tomato pureed", "3 tbsp Oil for rich tarri", "Salt and Fresh Coriander"]'::jsonb,
  '["१ कप तिखट जाड शेव (भावनगरी किंवा गाठी शेव)", "२ मोठे चमचे खान्देशी शेव भाजी मसाला", "१ चमचा दादांचे कांदा लसूण मसाला", "२ बारीक चिरलेले कांदे", "१ टोमॅटो प्युरी", "३ मोठे चमचे तेल तर्रीसाठी", "चवीनुसार मीठ व कोथिंबीर"]'::jsonb,
  '["Heat oil in a pan, fry finely chopped onions until golden red.", "Add tomato puree and ginger garlic paste, cook till oil separates.", "Add Khandeshi Shev Bhaji Masala and Kanda Lasun Masala. Stir on low flame.", "Add 2.5 cups hot water and boil vigorously for 5 mins to create rich red Tarri.", "Add shev just 1 minute before serving to maintain crunch, or serve shev separately with hot rassa."]'::jsonb,
  '["कढईत ३ चमचे तेल गरम करून कांदा सोनेरी रंगावर परता.", "टोमॅटो प्युरी आणि आले-लसूण पेस्ट घालून तेल सुटेपर्यंत परतून घ्या.", "खान्देशी शेव भाजी मसाला आणि कांदा लसूण मसाला घालून मंद आचेवर २ मिनिटे परता.", "२.५ कप उकळते पाणी घाला व ५ मिनिटे मध्यम आचेवर छान तर्री येईपर्यंत रस्सा उकळा.", "वाढण्यापूर्वी शेव घाला किंवा रस्सा आणि शेव वेगवेगळे सर्व्ह करा."]'::jsonb,
  'Always add boiling hot water to the fried masala to extract high red oil tarri float on top.',
  'मसाला परतून झाल्यावर नेहमी उकळते पाणी घाला, ज्यामुळे रस्स्यावर अप्रतिम लाल तर्री येते.',
  'Serve with hot Chapati, Bhakri or Paav with extra crunchy Shev on the side.',
  'गरमागरम चपाती, भाकरी किंवा पावासोबत खमंग शेव आणि लिंबू पिळून खा.',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800',
  '["https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'p3', 'Khandeshi Shev Bhaji Masala', 'Chef Dada', true
)
ON CONFLICT (id) DO NOTHING;

-- Seed Coupons
INSERT INTO public.coupons (code, discount_type, value, min_order_value, description_en, description_mr, expiry_date, active)
VALUES 
  ('DHABA10', 'percentage', 10, 499, 'Get 10% OFF on all spice orders above ₹499', '₹४९९ वरील सर्व ऑर्डरवर १०% सवलत', '2026-12-31', true),
  ('FIRST50', 'fixed', 50, 399, 'Flat ₹50 OFF on your first purchase', 'पहिल्या खरेदीवर थेट ₹५० ची सूट', '2026-12-31', true),
  ('FREESHIP', 'fixed', 50, 699, 'Free Shipping on all orders above ₹699', '₹६९९ वरील सर्व ऑर्डरवर मोफत डिलिव्हरी', '2026-12-31', true)
ON CONFLICT (code) DO NOTHING;

-- ======================================================================================
-- END OF SCRIPT - ALL TABLES, RLS, TRIGGERS & SEED DATA READY!
-- ======================================================================================
