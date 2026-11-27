-- ============================================================================
-- QR MENU - DIGITAL MENU SYSTEM
-- Migration 005: Security Hardening (Non-Destructive Additive Migration)
-- Run this in your Supabase Dashboard -> SQL Editor.
-- Safe to run on an existing live database without deleting or resetting data.
-- ============================================================================

-- 1. Lock search_path on trigger function to prevent search_path hijacking
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Restrict public.is_admin() execution strictly to authenticated users
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Prevent non-admin authenticated users from reading private products.admin_notes
--    via public SELECT policies if user signups are ever enabled in Supabase Auth.
--    Note: The authorized admin uses the separate "Admin can read all ..." policies.
DROP POLICY IF EXISTS "Public can read active categories" ON public.categories;
CREATE POLICY "Public can read active categories"
  ON public.categories
  FOR SELECT
  TO anon
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Public can read active available products" ON public.products;
CREATE POLICY "Public can read active available products"
  ON public.products
  FOR SELECT
  TO anon
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

-- 4. Defense-in-depth privilege revocations on sensitive tables
REVOKE INSERT, UPDATE, DELETE ON public.admin_profiles FROM anon, authenticated;
REVOKE DELETE ON public.business_settings FROM anon, authenticated;

-- 5. Tighten Supabase Storage policies for the 'menu-images' bucket:
--    - Bucket remains public = TRUE so direct /object/public/menu-images/* URLs work.
--    - Remove anonymous SELECT on storage.objects so unauthenticated users cannot
--      call Storage list APIs to enumerate bucket contents.
--    - Confine admin uploads/updates strictly to 'products/' and 'logos/' folders.
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view menu images" ON storage.objects;
CREATE POLICY "Admin can view menu images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin can upload menu images" ON storage.objects;
CREATE POLICY "Admin can upload menu images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images'
    AND public.is_admin()
    AND (storage.foldername(name))[1] IN ('products', 'logos')
  );

DROP POLICY IF EXISTS "Admin can update menu images" ON storage.objects;
CREATE POLICY "Admin can update menu images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_admin())
  WITH CHECK (
    bucket_id = 'menu-images'
    AND public.is_admin()
    AND (storage.foldername(name))[1] IN ('products', 'logos')
  );

-- 6. Database-level CHECK constraints for future writes (NOT VALID preserves
--    existing live rows without blocking this migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_price_max_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_max_check
      CHECK (price <= 9999999.99) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_image_url_protocol_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_image_url_protocol_check
      CHECK (image_url = 'no-image' OR image_url ~* '^https://') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_settings_url_protocol_check'
  ) THEN
    ALTER TABLE public.business_settings
      ADD CONSTRAINT business_settings_url_protocol_check
      CHECK (public_menu_url = '' OR public_menu_url ~* '^https?://') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'business_settings_logo_protocol_check'
  ) THEN
    ALTER TABLE public.business_settings
      ADD CONSTRAINT business_settings_logo_protocol_check
      CHECK (business_logo IS NULL OR business_logo ~* '^https://') NOT VALID;
  END IF;
END $$;
