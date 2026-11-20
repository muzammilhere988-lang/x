import type {
  BusinessSettings,
  Category,
  MenuThemeId,
  Product,
  PublicMenuData,
  PublicProduct,
} from '../types/menu';
import {getFriendlyErrorMessage, supabase} from './supabase';

// ============================================================================
// PUBLIC MENU QUERIES (Anonymous, read-only, strictly active & available items)
// ============================================================================

export async function fetchPublicMenuData(): Promise<PublicMenuData> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const [settingsRes, categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('business_settings')
      .select(
        'id, business_name, business_logo, business_logo_path, menu_heading, currency_symbol, menu_theme, public_menu_url, updated_at'
      )
      .limit(1)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('id, name, display_order, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('display_order', {ascending: true})
      .order('created_at', {ascending: true}),
    // Explicitly omit admin_notes so private notes are never queried or exposed publicly
    supabase
      .from('products')
      .select('id, name, image_path, image_url, price, category_id')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('created_at', {ascending: true}),
  ]);

  if (settingsRes.error) {
    throw new Error(getFriendlyErrorMessage(settingsRes.error, 'Could not load menu settings.'));
  }
  if (categoriesRes.error) {
    throw new Error(getFriendlyErrorMessage(categoriesRes.error, 'Could not load menu categories.'));
  }
  if (productsRes.error) {
    throw new Error(getFriendlyErrorMessage(productsRes.error, 'Could not load menu products.'));
  }

  const products: PublicProduct[] = (productsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    image_path: row.image_path,
    image_url: row.image_url,
    price: Number(row.price),
    category_id: row.category_id,
  }));

  return {
    settings: settingsRes.data as BusinessSettings | null,
    categories: (categoriesRes.data ?? []) as Category[],
    products,
  };
}

// ============================================================================
// ADMIN QUERIES & MUTATIONS (Protected by RLS + Admin Session)
// ============================================================================

export async function fetchAdminCategories(): Promise<Category[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {data, error} = await supabase
    .from('categories')
    .select('id, name, display_order, is_active, created_at, updated_at')
    .order('display_order', {ascending: true})
    .order('created_at', {ascending: true});

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to fetch categories.'));
  }

  return (data ?? []) as Category[];
}

export async function createCategory(input: {
  name: string;
  display_order: number;
  is_active: boolean;
}): Promise<Category> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {data, error} = await supabase
    .from('categories')
    .insert({
      name: input.name.trim(),
      display_order: input.display_order,
      is_active: input.is_active,
    })
    .select('id, name, display_order, is_active, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to create category.'));
  }

  return data as Category;
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'display_order' | 'is_active'>>
): Promise<Category> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload: Record<string, unknown> = {};
  if (typeof updates.name === 'string') payload.name = updates.name.trim();
  if (typeof updates.display_order === 'number') payload.display_order = updates.display_order;
  if (typeof updates.is_active === 'boolean') payload.is_active = updates.is_active;

  const {data, error} = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('id, name, display_order, is_active, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to update category.'));
  }

  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {error} = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to delete category.'));
  }
}

export async function fetchAdminProducts(): Promise<Product[]> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {data, error} = await supabase
    .from('products')
    .select(
      'id, name, admin_notes, image_path, image_url, price, category_id, is_active, is_available, created_at, updated_at'
    )
    .order('created_at', {ascending: false});

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to fetch products.'));
  }

  return (data ?? []).map((row) => ({
    ...row,
    price: Number(row.price),
  })) as Product[];
}

export async function createProduct(input: {
  name: string;
  admin_notes: string | null;
  image_path: string;
  image_url: string;
  price: number;
  category_id: string;
  is_active: boolean;
  is_available: boolean;
}): Promise<Product> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {data, error} = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      admin_notes: input.admin_notes?.trim() ? input.admin_notes.trim() : null,
      image_path: input.image_path,
      image_url: input.image_url,
      price: input.price,
      category_id: input.category_id,
      is_active: input.is_active,
      is_available: input.is_available,
    })
    .select(
      'id, name, admin_notes, image_path, image_url, price, category_id, is_active, is_available, created_at, updated_at'
    )
    .single();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to create product.'));
  }

  return {...data, price: Number(data.price)} as Product;
}

export async function updateProduct(
  id: string,
  updates: Partial<{
    name: string;
    admin_notes: string | null;
    image_path: string;
    image_url: string;
    price: number;
    category_id: string;
    is_active: boolean;
    is_available: boolean;
  }>
): Promise<Product> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload: Record<string, unknown> = {...updates};
  if (typeof updates.name === 'string') {
    payload.name = updates.name.trim();
  }
  if (updates.admin_notes !== undefined) {
    payload.admin_notes = updates.admin_notes?.trim() ? updates.admin_notes.trim() : null;
  }

  const {data, error} = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select(
      'id, name, admin_notes, image_path, image_url, price, category_id, is_active, is_available, created_at, updated_at'
    )
    .single();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to update product.'));
  }

  return {...data, price: Number(data.price)} as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {error} = await supabase.from('products').delete().eq('id', id);
  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to delete product.'));
  }
}

export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const {data, error} = await supabase
    .from('business_settings')
    .select(
      'id, business_name, business_logo, business_logo_path, menu_heading, currency_symbol, menu_theme, public_menu_url, updated_at'
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to load business settings.'));
  }

  return data as BusinessSettings | null;
}

export async function saveBusinessSettings(
  existingId: string | null,
  input: {
    business_name: string;
    business_logo: string | null;
    business_logo_path: string | null;
    menu_heading: string;
    currency_symbol: string;
    menu_theme: MenuThemeId;
    public_menu_url: string;
  }
): Promise<BusinessSettings> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = {
    business_name: input.business_name.trim(),
    business_logo: input.business_logo,
    business_logo_path: input.business_logo_path,
    menu_heading: input.menu_heading.trim() || 'Menu',
    currency_symbol: input.currency_symbol.trim() || '₹',
    menu_theme: input.menu_theme,
    public_menu_url: input.public_menu_url.trim(),
  };

  if (existingId) {
    const {data, error} = await supabase
      .from('business_settings')
      .update(payload)
      .eq('id', existingId)
      .select(
        'id, business_name, business_logo, business_logo_path, menu_heading, currency_symbol, menu_theme, public_menu_url, updated_at'
      )
      .single();

    if (error) {
      throw new Error(getFriendlyErrorMessage(error, 'Failed to update business settings.'));
    }
    return data as BusinessSettings;
  }

  const {data, error} = await supabase
    .from('business_settings')
    .insert(payload)
    .select(
      'id, business_name, business_logo, business_logo_path, menu_heading, currency_symbol, menu_theme, public_menu_url, updated_at'
    )
    .single();

  if (error) {
    throw new Error(getFriendlyErrorMessage(error, 'Failed to save business settings.'));
  }
  return data as BusinessSettings;
}
