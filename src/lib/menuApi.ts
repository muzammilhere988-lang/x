import type {
  BusinessSettings,
  Category,
  MenuThemeId,
  Product,
  PublicMenuData,
  PublicProduct,
} from '../types/menu';
import {
  isValidUuid,
  validateExternalImageUrl,
  validatePublicMenuUrl,
} from '../utils/formatters';
import {getFriendlyErrorMessage, supabase} from './supabase';

const ALLOWED_MENU_THEMES = new Set<MenuThemeId>([
  'warm-ivory',
  'linen-stone',
  'evening-bistro',
]);

const SAFE_IMAGE_PATH_REGEX =
  /^(no-image|external-url|(products|logos)\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg))$/;

function assertValidPrice(price: number): number {
  if (typeof price !== 'number' || !Number.isFinite(price) || Number.isNaN(price)) {
    throw new Error('Price must be a valid finite number.');
  }
  if (price < 0 || price > 9999999.99) {
    throw new Error('Price must be between 0 and 9,999,999.99.');
  }
  return Math.round(price * 100) / 100;
}

function assertSafeStoragePath(path: string, allowExternal = true): string {
  const trimmed = path.trim();
  if (!SAFE_IMAGE_PATH_REGEX.test(trimmed)) {
    throw new Error('Invalid image storage path.');
  }
  if (!allowExternal && trimmed === 'external-url') {
    throw new Error('Invalid storage path.');
  }
  return trimmed;
}

function assertSafeProductImageUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed === 'no-image') {
    return 'no-image';
  }
  const check = validateExternalImageUrl(trimmed);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid product image URL.');
  }
  return check.normalized;
}

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

  const trimmedName = input.name.trim();
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error('Category name must be between 1 and 100 characters.');
  }
  const displayOrder = Number.isInteger(input.display_order) && input.display_order >= 0
    ? input.display_order
    : 0;

  const {data, error} = await supabase
    .from('categories')
    .insert({
      name: trimmedName,
      display_order: displayOrder,
      is_active: Boolean(input.is_active),
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
  if (!isValidUuid(id)) {
    throw new Error('Invalid category identifier.');
  }

  const payload: Partial<Pick<Category, 'name' | 'display_order' | 'is_active'>> = {};
  if (typeof updates.name === 'string') {
    const trimmedName = updates.name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      throw new Error('Category name must be between 1 and 100 characters.');
    }
    payload.name = trimmedName;
  }
  if (typeof updates.display_order === 'number') {
    if (!Number.isInteger(updates.display_order) || updates.display_order < 0) {
      throw new Error('Display order must be a non-negative whole number.');
    }
    payload.display_order = updates.display_order;
  }
  if (typeof updates.is_active === 'boolean') {
    payload.is_active = updates.is_active;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No valid category fields were provided to update.');
  }

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
  if (!isValidUuid(id)) {
    throw new Error('Invalid category identifier.');
  }

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

  const trimmedName = input.name.trim();
  if (!trimmedName || trimmedName.length > 140) {
    throw new Error('Product name must be between 1 and 140 characters.');
  }
  if (!isValidUuid(input.category_id)) {
    throw new Error('Please select a valid category.');
  }
  const safePrice = assertValidPrice(input.price);
  const trimmedNotes = input.admin_notes?.trim() ? input.admin_notes.trim() : null;
  if (trimmedNotes && trimmedNotes.length > 500) {
    throw new Error('Admin notes cannot exceed 500 characters.');
  }
  const safePath = assertSafeStoragePath(input.image_path, true);
  const safeUrl = assertSafeProductImageUrl(input.image_url);

  const {data, error} = await supabase
    .from('products')
    .insert({
      name: trimmedName,
      admin_notes: trimmedNotes,
      image_path: safePath,
      image_url: safeUrl,
      price: safePrice,
      category_id: input.category_id,
      is_active: Boolean(input.is_active),
      is_available: Boolean(input.is_available),
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
  if (!isValidUuid(id)) {
    throw new Error('Invalid product identifier.');
  }

  // Explicit field allowlisting prevents mass assignment of unintended columns
  const payload: Partial<{
    name: string;
    admin_notes: string | null;
    image_path: string;
    image_url: string;
    price: number;
    category_id: string;
    is_active: boolean;
    is_available: boolean;
  }> = {};

  if (typeof updates.name === 'string') {
    const trimmedName = updates.name.trim();
    if (!trimmedName || trimmedName.length > 140) {
      throw new Error('Product name must be between 1 and 140 characters.');
    }
    payload.name = trimmedName;
  }
  if (updates.admin_notes !== undefined) {
    const trimmedNotes = updates.admin_notes?.trim() ? updates.admin_notes.trim() : null;
    if (trimmedNotes && trimmedNotes.length > 500) {
      throw new Error('Admin notes cannot exceed 500 characters.');
    }
    payload.admin_notes = trimmedNotes;
  }
  if (typeof updates.price === 'number') {
    payload.price = assertValidPrice(updates.price);
  }
  if (typeof updates.category_id === 'string') {
    if (!isValidUuid(updates.category_id)) {
      throw new Error('Please select a valid category.');
    }
    payload.category_id = updates.category_id;
  }
  if (typeof updates.image_path === 'string') {
    payload.image_path = assertSafeStoragePath(updates.image_path, true);
  }
  if (typeof updates.image_url === 'string') {
    payload.image_url = assertSafeProductImageUrl(updates.image_url);
  }
  if (typeof updates.is_active === 'boolean') {
    payload.is_active = updates.is_active;
  }
  if (typeof updates.is_available === 'boolean') {
    payload.is_available = updates.is_available;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('No valid product fields were provided to update.');
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
  if (!isValidUuid(id)) {
    throw new Error('Invalid product identifier.');
  }

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

  if (existingId && !isValidUuid(existingId)) {
    throw new Error('Invalid settings record identifier.');
  }

  const businessName = input.business_name.trim();
  if (businessName.length > 120) {
    throw new Error('Business name cannot exceed 120 characters.');
  }

  const menuHeading = input.menu_heading.trim() || 'Menu';
  if (menuHeading.length > 80) {
    throw new Error('Menu heading cannot exceed 80 characters.');
  }

  const currencySymbol = input.currency_symbol.trim() || '₹';
  if (currencySymbol.length > 10) {
    throw new Error('Currency symbol cannot exceed 10 characters.');
  }

  if (!ALLOWED_MENU_THEMES.has(input.menu_theme)) {
    throw new Error('Invalid menu theme selection.');
  }

  const urlCheck = validatePublicMenuUrl(input.public_menu_url);
  if (!urlCheck.valid) {
    throw new Error(urlCheck.error || 'Invalid public menu URL.');
  }

  let safeLogoUrl: string | null = null;
  if (input.business_logo) {
    const logoCheck = validateExternalImageUrl(input.business_logo);
    if (!logoCheck.valid) {
      throw new Error(logoCheck.error || 'Invalid business logo URL.');
    }
    safeLogoUrl = logoCheck.normalized;
  }

  const safeLogoPath = input.business_logo_path
    ? assertSafeStoragePath(input.business_logo_path, false)
    : null;

  const payload = {
    business_name: businessName,
    business_logo: safeLogoUrl,
    business_logo_path: safeLogoPath,
    menu_heading: menuHeading,
    currency_symbol: currencySymbol,
    menu_theme: input.menu_theme,
    public_menu_url: urlCheck.normalized,
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
