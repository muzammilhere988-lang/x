-- ============================================================================
-- QR MENU - DIGITAL MENU SYSTEM
-- Migration 003: Secure Single-Admin Provisioning Template
--
-- IMPORTANT:
-- 1. First, create your ONE admin user in Supabase Dashboard:
--    Authentication -> Users -> "Add user" -> "Create new user"
--    Enter your real admin email and a strong password, and check "Auto Confirm User".
-- 2. Replace 'your-admin-email@example.com' below with that exact email.
-- 3. Run this script in the Supabase SQL Editor.
-- ============================================================================

INSERT INTO public.admin_profiles (auth_user_id, email)
SELECT id, email
FROM auth.users
WHERE lower(email) = lower('your-admin-email@example.com')
LIMIT 1
ON CONFLICT (singleton_guard) DO NOTHING;

-- Initialize empty business_settings row if none exists yet (no fake business name)
INSERT INTO public.business_settings (
  business_name,
  menu_heading,
  currency_symbol,
  menu_theme,
  public_menu_url
)
VALUES ('', 'Menu', '₹', 'warm-ivory', '')
ON CONFLICT (singleton_guard) DO NOTHING;
