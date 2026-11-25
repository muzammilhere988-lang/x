import {createClient, type SupabaseClient} from '@supabase/supabase-js';

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const rawSupabaseUrl = stripQuotes(import.meta.env.VITE_SUPABASE_URL ?? '');
const rawSupabaseAnonKey = stripQuotes(import.meta.env.VITE_SUPABASE_ANON_KEY ?? '');

const PLACEHOLDER_URL = 'your-project-ref.supabase.co';
const PLACEHOLDER_KEY = 'your-supabase-publishable-anon-key';

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export interface SupabaseConfigInspection {
  isConfigured: boolean;
  normalizedUrl: string;
  issueMessage: string | null;
}

export function inspectSupabaseConfig(
  urlInput = rawSupabaseUrl,
  keyInput = rawSupabaseAnonKey
): SupabaseConfigInspection {
  if (!urlInput || !keyInput) {
    return {
      isConfigured: false,
      normalizedUrl: '',
      issueMessage: null,
    };
  }

  if (urlInput.includes(PLACEHOLDER_URL) || keyInput.includes(PLACEHOLDER_KEY)) {
    return {
      isConfigured: false,
      normalizedUrl: '',
      issueMessage: null,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlInput);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    return {
      isConfigured: false,
      normalizedUrl: '',
      issueMessage:
        'VITE_SUPABASE_URL is not a valid URL. It must look like https://your-project-ref.supabase.co.',
    };
  }

  const host = parsed.hostname.toLowerCase();

  // Detect if user pasted the Supabase Dashboard web URL instead of the Project API URL
  if (host === 'supabase.com' || host === 'www.supabase.com' || host === 'app.supabase.com') {
    const match = parsed.pathname.match(/\/project\/([a-z0-9]+)/i);
    const suggested = match ? `https://${match[1]}.supabase.co` : 'https://your-project-ref.supabase.co';
    return {
      isConfigured: false,
      normalizedUrl: '',
      issueMessage: `VITE_SUPABASE_URL is set to the Supabase Dashboard URL instead of your Project API URL. Change it to ${suggested} (found in Supabase under Project Settings -> Data API).`,
    };
  }

  // If user pasted a *.supabase.co URL with an extra path (e.g. /rest/v1), strip the path to origin
  if ((host.endsWith('.supabase.co') || host.endsWith('.supabase.in')) && parsed.pathname !== '/') {
    return {
      isConfigured: true,
      normalizedUrl: parsed.origin,
      issueMessage: null,
    };
  }

  // Reject arbitrary URLs with extra path segments that would break /rest/v1 resolution
  if (parsed.pathname && parsed.pathname !== '/') {
    return {
      isConfigured: false,
      normalizedUrl: '',
      issueMessage: `VITE_SUPABASE_URL should be your root Supabase Project URL (${parsed.origin}) without any extra path (${parsed.pathname}).`,
    };
  }

  return {
    isConfigured: true,
    normalizedUrl: parsed.origin,
    issueMessage: null,
  };
}

const configInspection = inspectSupabaseConfig();

export const isSupabaseConfigured: boolean = configInspection.isConfigured;
export const supabaseConfigIssue: string | null = configInspection.issueMessage;

export const supabase: SupabaseClient | null = configInspection.isConfigured
  ? createClient(configInspection.normalizedUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: 'no-store',
          }),
      },
    })
  : null;

export function getFriendlyErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return fallback;

  const errObj = error as {message?: string; code?: string};
  const message = errObj.message ?? '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid path specified in request url')) {
    return 'Invalid Supabase URL path configuration. Check your VITE_SUPABASE_URL setting.';
  }
  if (errObj.code === '23503') {
    return 'This item is referenced by existing products. Remove or reassign those products first.';
  }
  if (errObj.code === '23505') {
    return 'A record with this value already exists.';
  }
  if (errObj.code === '23514') {
    return 'One or more fields failed validation rules. Please check your input values.';
  }
  if (errObj.code === '42501' || lower.includes('row-level security')) {
    return 'Permission denied by database security policy. Please sign in as the authorized administrator.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Unable to reach the server. Please check your internet connection.';
  }
  return fallback;
}
