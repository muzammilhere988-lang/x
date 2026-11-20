export type MenuThemeId = 'warm-ivory' | 'linen-stone' | 'evening-bistro';

export interface AdminProfile {
  id: string;
  auth_user_id: string;
  email: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  admin_notes: string | null;
  image_path: string;
  image_url: string;
  price: number;
  category_id: string;
  is_active: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  image_path: string;
  image_url: string;
  price: number;
  category_id: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  business_logo: string | null;
  business_logo_path: string | null;
  menu_heading: string;
  currency_symbol: string;
  menu_theme: MenuThemeId;
  public_menu_url: string;
  updated_at: string;
}

export interface PublicMenuData {
  settings: BusinessSettings | null;
  categories: Category[];
  products: PublicProduct[];
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  hiddenProducts: number;
  totalCategories: number;
}

export type AdminSectionId = 'overview' | 'products' | 'categories' | 'qr' | 'settings';
