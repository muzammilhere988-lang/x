import type {BusinessSettings} from '../types/menu';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }

  // IPv4 private / loopback / link-local ranges
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  // IPv6 loopback / link-local / unique-local
  if (/^(fe80:|fc00:|fd[0-9a-f]{2}:|::ffff:(127\.|10\.|169\.254\.|192\.168\.))/i.test(host)) {
    return true;
  }

  return false;
}

export function sanitizeImageSrc(
  raw: string | null | undefined,
  options: {allowBlob?: boolean} = {}
): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'no-image' || trimmed.length > 2048) {
    return null;
  }

  if (options.allowBlob && trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Allow safe root-relative asset paths (e.g. /assets/...), disallow protocol-relative //
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function validateExternalImageUrl(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {valid: false, normalized: '', error: 'Image URL is empty.'};
  }
  if (trimmed.length > 2048) {
    return {valid: false, normalized: '', error: 'Image URL is too long (max 2048 characters).'};
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        normalized: '',
        error: 'Image URL must start with https:// or http://',
      };
    }
    if (parsed.username || parsed.password) {
      return {
        valid: false,
        normalized: '',
        error: 'Image URL cannot contain embedded credentials.',
      };
    }
    if (isPrivateOrLoopbackHost(parsed.hostname)) {
      return {
        valid: false,
        normalized: '',
        error: 'Local or private network image URLs are not allowed.',
      };
    }
    return {valid: true, normalized: parsed.toString()};
  } catch {
    return {
      valid: false,
      normalized: '',
      error: 'Please enter a valid image URL starting with https://',
    };
  }
}

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

  // Reject explicit non-HTTP schemes before prepending https://
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch && schemeMatch[1].toLowerCase() !== 'http' && schemeMatch[1].toLowerCase() !== 'https') {
    return trimmed;
  }

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
  if (trimmed.length > 512) {
    return {valid: false, normalized: '', error: 'URL exceeds maximum length of 512 characters.'};
  }
  const normalized = normalizePublicMenuUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {valid: false, normalized: '', error: 'URL must begin with https:// or http://'};
    }
    if (parsed.username || parsed.password) {
      return {valid: false, normalized: '', error: 'URL cannot contain embedded credentials.'};
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
    return {valid: false, normalized: '', error: 'Enter a valid domain or URL (e.g. https://yourdomain.com/menu).'};
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
    const check = validatePublicMenuUrl(settingsUrl);
    if (check.valid && check.normalized) {
      return {
        url: check.normalized,
        isProductionConfigured: !isLocalOrTemporaryHost(check.normalized),
        source: 'settings',
      };
    }
  }

  const envBase = (import.meta.env.VITE_PUBLIC_MENU_BASE_URL ?? '').trim();
  if (envBase) {
    const check = validatePublicMenuUrl(envBase);
    if (check.valid && check.normalized) {
      return {
        url: check.normalized,
        isProductionConfigured: !isLocalOrTemporaryHost(check.normalized),
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
      isPrivateOrLoopbackHost(host) ||
      host.endsWith('.run.app') ||
      isAiStudioEditorUrl(urlStr)
    );
  } catch {
    return true;
  }
}
