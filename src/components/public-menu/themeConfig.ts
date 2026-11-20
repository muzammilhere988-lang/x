import type {MenuThemeId} from '../../types/menu';

export interface MenuThemePalette {
  id: MenuThemeId;
  label: string;
  description: string;
  pageBg: string;
  surfaceBg: string;
  cardBg: string;
  navBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  activeTab: string;
  inactiveTab: string;
  isDark: boolean;
}

export const MENU_THEMES: Record<MenuThemeId, MenuThemePalette> = {
  'warm-ivory': {
    id: 'warm-ivory',
    label: 'Warm Ivory',
    description: 'Warm cream canvas with soft beige surfaces and espresso ink',
    pageBg: 'bg-[#FAF7F2]',
    surfaceBg: 'bg-[#F3EDE2]',
    cardBg: 'bg-[#FFFFFF]',
    navBg: 'bg-[#FAF7F2]/95',
    textPrimary: 'text-[#1F1B18]',
    textSecondary: 'text-[#6B6259]',
    border: 'border-[#E6DFD3]',
    activeTab: 'text-[#1F1B18] border-[#1F1B18]',
    inactiveTab: 'text-[#756B61] border-transparent hover:text-[#1F1B18]',
    isDark: false,
  },
  'linen-stone': {
    id: 'linen-stone',
    label: 'Linen & Stone',
    description: 'Crisp alabaster paper with muted stone surfaces and slate type',
    pageBg: 'bg-[#F6F5F1]',
    surfaceBg: 'bg-[#ECEAE3]',
    cardBg: 'bg-[#FFFFFF]',
    navBg: 'bg-[#F6F5F1]/95',
    textPrimary: 'text-[#1B1D1F]',
    textSecondary: 'text-[#5E6368]',
    border: 'border-[#E2DFD7]',
    activeTab: 'text-[#1B1D1F] border-[#1B1D1F]',
    inactiveTab: 'text-[#6D7175] border-transparent hover:text-[#1B1D1F]',
    isDark: false,
  },
  'evening-bistro': {
    id: 'evening-bistro',
    label: 'Evening Bistro',
    description: 'Deep charcoal canvas with warm espresso cards and ivory type',
    pageBg: 'bg-[#161412]',
    surfaceBg: 'bg-[#211D1A]',
    cardBg: 'bg-[#1F1B18]',
    navBg: 'bg-[#161412]/95',
    textPrimary: 'text-[#F5F0E8]',
    textSecondary: 'text-[#B5AA9C]',
    border: 'border-[#332D27]',
    activeTab: 'text-[#F5F0E8] border-[#F5F0E8]',
    inactiveTab: 'text-[#9F9486] border-transparent hover:text-[#F5F0E8]',
    isDark: true,
  },
};

export function getMenuTheme(themeId?: string | null): MenuThemePalette {
  if (themeId === 'linen-stone' || themeId === 'evening-bistro' || themeId === 'warm-ivory') {
    return MENU_THEMES[themeId];
  }
  return MENU_THEMES['warm-ivory'];
}
