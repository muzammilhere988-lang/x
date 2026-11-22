import type {MenuThemeId} from '../../types/menu';

export interface MenuThemePalette {
  id: MenuThemeId;
  label: string;
  description: string;
  pageBg: string;
  pageHex: string;
  surfaceBg: string;
  cardBg: string;
  navBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  activeTab: string;
  inactiveTab: string;
  accentText: string;
  isDark: boolean;
}

export const MENU_THEMES: Record<MenuThemeId, MenuThemePalette> = {
  'warm-ivory': {
    id: 'warm-ivory',
    label: 'Alabaster & Champagne',
    description: 'Gallery alabaster silk canvas with obsidian ink and brushed champagne bronze',
    pageBg: 'bg-[#F8F7F4]',
    pageHex: '#F8F7F4',
    surfaceBg: 'bg-[#F0EEE9]',
    cardBg: 'bg-[#FFFFFF]',
    navBg: 'bg-[#F8F7F4]/92',
    textPrimary: 'text-[#141311]',
    textSecondary: 'text-[#615D55]',
    border: 'border-[#E5E1D8]',
    activeTab: 'text-[#141311] border-[#A88342]',
    inactiveTab: 'text-[#726D64] border-transparent hover:text-[#141311]',
    accentText: 'text-[#8F6B2D]',
    isDark: false,
  },
  'linen-stone': {
    id: 'linen-stone',
    label: 'Platinum & Slate',
    description: 'Architectural platinum stone canvas with deep charcoal type and muted bronze',
    pageBg: 'bg-[#F4F5F7]',
    pageHex: '#F4F5F7',
    surfaceBg: 'bg-[#E9ECEF]',
    cardBg: 'bg-[#FFFFFF]',
    navBg: 'bg-[#F4F5F7]/92',
    textPrimary: 'text-[#121417]',
    textSecondary: 'text-[#596069]',
    border: 'border-[#DDE1E6]',
    activeTab: 'text-[#121417] border-[#7B6135]',
    inactiveTab: 'text-[#68707A] border-transparent hover:text-[#121417]',
    accentText: 'text-[#7B6135]',
    isDark: false,
  },
  'evening-bistro': {
    id: 'evening-bistro',
    label: 'Midnight Obsidian',
    description: 'Velvet obsidian canvas with dark slate cards, silk ivory type, and champagne gold',
    pageBg: 'bg-[#0E0D0C]',
    pageHex: '#0E0D0C',
    surfaceBg: 'bg-[#181614]',
    cardBg: 'bg-[#151412]',
    navBg: 'bg-[#0E0D0C]/92',
    textPrimary: 'text-[#F5F2EB]',
    textSecondary: 'text-[#A39C91]',
    border: 'border-[#2A2723]',
    activeTab: 'text-[#F5F2EB] border-[#D1B072]',
    inactiveTab: 'text-[#8E877C] border-transparent hover:text-[#F5F2EB]',
    accentText: 'text-[#D5B576]',
    isDark: true,
  },
};

export function getMenuTheme(themeId?: string | null): MenuThemePalette {
  if (themeId === 'linen-stone' || themeId === 'evening-bistro' || themeId === 'warm-ivory') {
    return MENU_THEMES[themeId];
  }
  return MENU_THEMES['warm-ivory'];
}
