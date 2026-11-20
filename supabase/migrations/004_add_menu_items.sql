-- ============================================================================
-- QR MENU - DIGITAL MENU SYSTEM
-- Migration 004: Add Menu Categories & Products from Menu Board Photo
-- Run this in the Supabase SQL Editor to publish all 7 categories and 52 items.
-- Safe to re-run (skips categories/products that already exist by name).
-- ============================================================================

DO $$
DECLARE
  v_wraps_id UUID;
  v_burgers_id UUID;
  v_sandwich_id UUID;
  v_salads_id UUID;
  v_pizza_id UUID;
  v_spicy_id UUID;
  v_combo_id UUID;
BEGIN
  -- Helper upsert pattern for categories (case-insensitive match by name)
  SELECT id INTO v_wraps_id FROM public.categories WHERE lower(trim(name)) = 'wraps' LIMIT 1;
  IF v_wraps_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Wraps', 1, TRUE)
    RETURNING id INTO v_wraps_id;
  END IF;

  SELECT id INTO v_burgers_id FROM public.categories WHERE lower(trim(name)) = 'burgers' LIMIT 1;
  IF v_burgers_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Burgers', 2, TRUE)
    RETURNING id INTO v_burgers_id;
  END IF;

  SELECT id INTO v_sandwich_id FROM public.categories WHERE lower(trim(name)) = 'sandwich' LIMIT 1;
  IF v_sandwich_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Sandwich', 3, TRUE)
    RETURNING id INTO v_sandwich_id;
  END IF;

  SELECT id INTO v_salads_id FROM public.categories WHERE lower(trim(name)) = 'salads' LIMIT 1;
  IF v_salads_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Salads', 4, TRUE)
    RETURNING id INTO v_salads_id;
  END IF;

  SELECT id INTO v_pizza_id FROM public.categories WHERE lower(trim(name)) = 'pizza' LIMIT 1;
  IF v_pizza_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Pizza', 5, TRUE)
    RETURNING id INTO v_pizza_id;
  END IF;

  SELECT id INTO v_spicy_id FROM public.categories WHERE lower(trim(name)) = 'spicy' LIMIT 1;
  IF v_spicy_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Spicy', 6, TRUE)
    RETURNING id INTO v_spicy_id;
  END IF;

  SELECT id INTO v_combo_id FROM public.categories WHERE lower(trim(name)) = 'beverage combo' LIMIT 1;
  IF v_combo_id IS NULL THEN
    INSERT INTO public.categories (name, display_order, is_active)
    VALUES ('Beverage Combo', 7, TRUE)
    RETURNING id INTO v_combo_id;
  END IF;

  -- Insert all 52 products (skipping any item whose name+category already exists)
  INSERT INTO public.products (name, image_path, image_url, price, category_id, is_active, is_available)
  SELECT v.name, 'no-image', 'no-image', v.price, v.category_id, TRUE, TRUE
  FROM (
    VALUES
      -- WRAPS (10 items)
      ('Broasted Chicken Wrap', 140.00, v_wraps_id),
      ('Paneer Wrap', 140.00, v_wraps_id),
      ('Chicken 65 Wrap', 140.00, v_wraps_id),
      ('Chicken Nuggets Wrap', 140.00, v_wraps_id),
      ('Subha', 130.00, v_wraps_id),
      ('Fish Wrap', 160.00, v_wraps_id),
      ('Broasted Fish Wrap', 160.00, v_wraps_id),
      ('Prawns Wrap', 160.00, v_wraps_id),
      ('Broasted Prawns Wrap', 160.00, v_wraps_id),
      ('Veg Wrap', 130.00, v_wraps_id),

      -- BURGERS (7 items)
      ('Broasted Chicken Burger', 140.00, v_burgers_id),
      ('Paneer Burger', 140.00, v_burgers_id),
      ('Chicken 65 Burger', 140.00, v_burgers_id),
      ('Chicken Nuggets Burger', 140.00, v_burgers_id),
      ('Broasted Fish Burger', 160.00, v_burgers_id),
      ('Broasted Prawns Burger', 160.00, v_burgers_id),
      ('Veg Burger', 120.00, v_burgers_id),

      -- SANDWICH (6 items)
      ('Veg Sandwich', 110.00, v_sandwich_id),
      ('Broasted Chicken Sandwich', 119.00, v_sandwich_id),
      ('Chicken 65 Sandwich', 119.00, v_sandwich_id),
      ('Chicken Nuggets Sandwich', 119.00, v_sandwich_id),
      ('Broasted Fish Sandwich', 140.00, v_sandwich_id),
      ('Broasted Prawns Sandwich', 140.00, v_sandwich_id),

      -- SALADS (6 items)
      ('Veg Salad', 180.00, v_salads_id),
      ('Chicken 65 Salad', 240.00, v_salads_id),
      ('Paneer Salad', 240.00, v_salads_id),
      ('Fish Salad', 280.00, v_salads_id),
      ('Malai Chicken Salad', 370.00, v_salads_id),
      ('Prawns Salad', 280.00, v_salads_id),

      -- PIZZA (8 items)
      ('Cheese Pizza', 200.00, v_pizza_id),
      ('Veg Pizza', 210.00, v_pizza_id),
      ('Chicken 65 Pizza', 240.00, v_pizza_id),
      ('Cheese Popcorn Pizza', 230.00, v_pizza_id),
      ('Paneer Pizza', 260.00, v_pizza_id),
      ('Paneer Pepper Pizza', 260.00, v_pizza_id),
      ('Fish Pizza', 270.00, v_pizza_id),
      ('Prawns Pizza', 290.00, v_pizza_id),

      -- SPICY (6 items)
      ('AA Spicy Chicken Wrap', 150.00, v_spicy_id),
      ('AA Spicy Paneer Wrap', 150.00, v_spicy_id),
      ('AA Spicy Paneer Burger', 150.00, v_spicy_id),
      ('AA Spicy Paneer Sandwich', 150.00, v_spicy_id),
      ('AA Spicy Chicken Burger', 150.00, v_spicy_id),
      ('AA Spicy Chicken Sandwich', 150.00, v_spicy_id),

      -- BEVERAGE COMBO (9 items)
      ('AA Saver Chicken Wrap', 159.00, v_combo_id),
      ('AA Saver Chicken Burger', 159.00, v_combo_id),
      ('AA Saver Chicken Sandwich', 159.00, v_combo_id),
      ('AA Saver Fish Wrap', 179.00, v_combo_id),
      ('AA Saver Fish Burger', 179.00, v_combo_id),
      ('AA Saver Fish Sandwich', 179.00, v_combo_id),
      ('AA Saver Prawns Wrap', 179.00, v_combo_id),
      ('AA Saver Prawns Burger', 179.00, v_combo_id),
      ('AA Saver Prawns Sandwich', 179.00, v_combo_id)
  ) AS v(name, price, category_id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.products p
    WHERE lower(trim(p.name)) = lower(trim(v.name))
      AND p.category_id = v.category_id
  );

  INSERT INTO public.business_settings (
    business_name,
    menu_heading,
    currency_symbol,
    menu_theme,
    public_menu_url
  )
  VALUES ('Al Arabian Wraps & Cafe®', 'Menu', '₹', 'warm-ivory', '')
  ON CONFLICT (singleton_guard)
  DO UPDATE SET
    business_name = CASE
      WHEN trim(public.business_settings.business_name) = '' THEN EXCLUDED.business_name
      ELSE public.business_settings.business_name
    END;
END $$;
