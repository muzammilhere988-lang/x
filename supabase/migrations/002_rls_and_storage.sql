-- ============================================================================
-- QR MENU - DIGITAL MENU SYSTEM
-- Migration 002: Row Level Security (RLS), Column Protection & Storage Bucket
-- Run this second in the Supabase SQL Editor.
-- ============================================================================

-- Helper function: verifies whether the current authenticated user is the
-- authorized administrator registered in public.admin_profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE auth_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Grant schema usage and base table privileges
-- (RLS policies below still enforce row-level & admin restrictions)
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. ADMIN_PROFILES Policies
-- No anonymous access. Authenticated user can read only their own admin row.
-- Client-side inserts/updates/deletes are blocked (provisioned securely via SQL).
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.admin_profiles FROM anon;
REVOKE ALL ON public.admin_profiles FROM authenticated;
GRANT SELECT ON public.admin_profiles TO authenticated;

DROP POLICY IF EXISTS "Admin can read own profile" ON public.admin_profiles;
CREATE POLICY "Admin can read own profile"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES Policies
-- Public can read active categories. Only admin can manage all categories.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.categories FROM anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;

DROP POLICY IF EXISTS "Public can read active categories" ON public.categories;
CREATE POLICY "Public can read active categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin can read all categories" ON public.categories;
CREATE POLICY "Admin can read all categories"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert categories" ON public.categories;
CREATE POLICY "Admin can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update categories" ON public.categories;
CREATE POLICY "Admin can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete categories" ON public.categories;
CREATE POLICY "Admin can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS Policies & Column-Level Security
-- Public can read ONLY active & available products, and CANNOT read admin_notes.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.products FROM anon;
GRANT SELECT (
  id,
  name,
  image_path,
  image_url,
  price,
  category_id,
  is_active,
  is_available,
  created_at,
  updated_at
) ON public.products TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

DROP POLICY IF EXISTS "Public can read active available products" ON public.products;
CREATE POLICY "Public can read active available products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND is_available = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.categories c
      WHERE c.id = products.category_id
        AND c.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admin can read all products" ON public.products;
CREATE POLICY "Admin can read all products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
CREATE POLICY "Admin can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update products" ON public.products;
CREATE POLICY "Admin can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete products" ON public.products;
CREATE POLICY "Admin can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. BUSINESS_SETTINGS Policies
-- Public can read brand settings for the menu. Only admin can edit them.
-- ----------------------------------------------------------------------------
REVOKE ALL ON public.business_settings FROM anon;
GRANT SELECT ON public.business_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.business_settings TO authenticated;

DROP POLICY IF EXISTS "Public can read business settings" ON public.business_settings;
CREATE POLICY "Public can read business settings"
  ON public.business_settings
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admin can insert business settings" ON public.business_settings;
CREATE POLICY "Admin can insert business settings"
  ON public.business_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update business settings" ON public.business_settings;
CREATE POLICY "Admin can update business settings"
  ON public.business_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKET & POLICIES
-- Creates a public read bucket "menu-images" with strict admin-only writes.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
CREATE POLICY "Public can view menu images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Admin can upload menu images" ON storage.objects;
CREATE POLICY "Admin can upload menu images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can update menu images" ON storage.objects;
CREATE POLICY "Admin can update menu images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'menu-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can delete menu images" ON storage.objects;
CREATE POLICY "Admin can delete menu images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin());
