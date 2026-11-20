import type {BusinessSettings} from '../types/menu';

export function formatPrice(amount: number, currencySymbol = '₹'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const hasDecimals = Math.round(safeAmount * 100) % 100 !== 0;

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  const symbol = (currencySymbol || '₹').trim();
  return `${symbol}${formattedNumber}`;
}

export function validateMonetaryPrice(raw: string): {valid: boolean; value: number; error?: string} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {valid: false, value: 0, error: 'Price is required.'};
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return {valid: false, value: 0, error: 'Enter a valid numeric price.'};
  }
  if (parsed < 0) {
    return {valid: false, value: 0, error: 'Price cannot be negative.'};
  }
  if (parsed > 9999999.99) {
    return {valid: false, value: 0, error: 'Price exceeds maximum allowed value.'};
  }
  const rounded = Math.round(parsed * 100) / 100;
  return {valid: true, value: rounded};
}

export function normalizePublicMenuUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/menu';
    }
    return url.toString().replace(/\/+$/, '');
  } catch {
    return trimmed;
  }
}

export function isAiStudioEditorUrl(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return host === 'ai.studio' || host.endsWith('.ai.studio') || host === 'aistudio.google.com';
  } catch {
    return false;
  }
}

export function validatePublicMenuUrl(input: string): {valid: boolean; normalized: string; error?: string} {
  const trimmed = input.trim();
  if (!trimmed) {
    return {valid: true, normalized: ''};
  }
  const normalized = normalizePublicMenuUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {valid: false, normalized, error: 'URL must begin with https:// or http://'};
    }
    if (isAiStudioEditorUrl(normalized)) {
      return {
        valid: false,
        normalized,
        error:
          'Do not enter an ai.studio editor link. Enter your live Netlify or custom website URL (e.g. https://your-site.netlify.app/menu).',
      };
    }
    return {valid: true, normalized};
  } catch {
    return {valid: false, normalized, error: 'Enter a valid domain or URL (e.g. https://yourdomain.com/menu).'};
  }
}

export interface PermanentMenuUrlResolution {
  url: string;
  isProductionConfigured: boolean;
  source: 'settings' | 'env' | 'temporary-origin';
}

export function resolvePermanentMenuUrl(settings: BusinessSettings | null): PermanentMenuUrlResolution {
  const settingsUrl = settings?.public_menu_url?.trim() ?? '';
  if (settingsUrl) {
    const normalized = normalizePublicMenuUrl(settingsUrl);
    if (!isAiStudioEditorUrl(normalized)) {
      return {
        url: normalized,
        isProductionConfigured: !isLocalOrTemporaryHost(normalized),
        source: 'settings',
      };
    }
  }

  const envBase = (import.meta.env.VITE_PUBLIC_MENU_BASE_URL ?? '').trim();
  if (envBase) {
    const normalized = normalizePublicMenuUrl(envBase);
    if (!isAiStudioEditorUrl(normalized)) {
      return {
        url: normalized,
        isProductionConfigured: !isLocalOrTemporaryHost(normalized),
        source: 'env',
      };
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fallbackUrl = origin ? `${origin}/menu` : '/menu';
  return {
    url: fallbackUrl,
    isProductionConfigured: Boolean(origin) && !isLocalOrTemporaryHost(fallbackUrl),
    source: 'temporary-origin',
  };
}

function isLocalOrTemporaryHost(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host.endsWith('.run.app') ||
      isAiStudioEditorUrl(urlStr)
    );
  } catch {
    return true;
  }
}
