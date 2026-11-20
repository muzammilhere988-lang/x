-- ============================================================================
-- QR MENU - DIGITAL MENU SYSTEM
-- Migration 001: Initial PostgreSQL Schema
-- Run this first in the Supabase SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Shared trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. ADMIN PROFILES (Strictly Single Administrator)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  singleton_guard BOOLEAN NOT NULL DEFAULT TRUE CHECK (singleton_guard = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_profiles_single_admin_only UNIQUE (singleton_guard)
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_auth_user_id
  ON public.admin_profiles (auth_user_id);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 100),
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active_order
  ON public.categories (is_active, display_order, created_at);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 140),
  admin_notes TEXT CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 500),
  image_path TEXT NOT NULL CHECK (char_length(trim(image_path)) > 0),
  image_url TEXT NOT NULL CHECK (char_length(trim(image_url)) > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_visibility
  ON public.products (category_id, is_active, is_available, created_at);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. BUSINESS SETTINGS (Single Configuration Row)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT '',
  business_logo TEXT,
  business_logo_path TEXT,
  menu_heading TEXT NOT NULL DEFAULT 'Menu',
  currency_symbol TEXT NOT NULL DEFAULT '₹' CHECK (char_length(trim(currency_symbol)) > 0 AND char_length(currency_symbol) <= 10),
  menu_theme TEXT NOT NULL DEFAULT 'warm-ivory' CHECK (menu_theme IN ('warm-ivory', 'linen-stone', 'evening-bistro')),
  public_menu_url TEXT NOT NULL DEFAULT '',
  singleton_guard BOOLEAN NOT NULL DEFAULT TRUE CHECK (singleton_guard = TRUE),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_settings_single_row_only UNIQUE (singleton_guard)
);

DROP TRIGGER IF EXISTS trg_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER trg_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
