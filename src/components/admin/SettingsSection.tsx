import {useEffect, useRef, useState, type ChangeEvent, type FormEvent} from 'react';
import {Trash2, Upload} from 'lucide-react';
import {saveBusinessSettings} from '../../lib/menuApi';
import {deleteMenuImage, uploadMenuImage, validateImageFile} from '../../lib/storage';
import type {BusinessSettings, MenuThemeId} from '../../types/menu';
import {validatePublicMenuUrl} from '../../utils/formatters';
import {MENU_THEMES} from '../public-menu/themeConfig';

interface SettingsSectionProps {
  settings: BusinessSettings | null;
  loading: boolean;
  onSettingsUpdated: (next: BusinessSettings) => void;
}

const CURRENCY_OPTIONS = [
  {label: 'INR (₹)', value: '₹'},
  {label: 'USD ($)', value: '$'},
  {label: 'EUR (€)', value: '€'},
  {label: 'GBP (£)', value: '£'},
  {label: 'AED (د.إ)', value: 'د.إ'},
];

export function SettingsSection({
  settings,
  loading,
  onSettingsUpdated,
}: SettingsSectionProps) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [menuHeading, setMenuHeading] = useState('Menu');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [menuTheme, setMenuTheme] = useState<MenuThemeId>('warm-ivory');
  const [publicMenuUrl, setPublicMenuUrl] = useState('');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);
  const [removeExistingLogo, setRemoveExistingLogo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error'; message: string} | null>(
    null
  );

  useEffect(() => {
    if (!settings) return;
    setBusinessName(settings.business_name ?? '');
    setMenuHeading(settings.menu_heading || 'Menu');
    setCurrencySymbol(settings.currency_symbol || '₹');
    setMenuTheme(settings.menu_theme || 'warm-ivory');
    setPublicMenuUrl(settings.public_menu_url ?? '');
    setLogoUrl(settings.business_logo ?? null);
    setLogoPath(settings.business_logo_path ?? null);
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    setRemoveExistingLogo(false);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (pendingLogoPreview && pendingLogoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(pendingLogoPreview);
      }
    };
  }, [pendingLogoPreview]);

  const handleLogoPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateImageFile(file);
    if (!check.valid) {
      setFeedback({type: 'error', message: check.error || 'Invalid logo file.'});
      return;
    }

    if (pendingLogoPreview && pendingLogoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(pendingLogoPreview);
    }

    setFeedback(null);
    setPendingLogoFile(file);
    setPendingLogoPreview(URL.createObjectURL(file));
    setRemoveExistingLogo(false);
  };

  const handleRemoveLogo = () => {
    if (pendingLogoPreview && pendingLogoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(pendingLogoPreview);
    }
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    setRemoveExistingLogo(true);
    setLogoUrl(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const urlCheck = validatePublicMenuUrl(publicMenuUrl);
    if (!urlCheck.valid) {
      setFeedback({type: 'error', message: urlCheck.error || 'Invalid public menu URL.'});
      return;
    }

    if (!currencySymbol.trim()) {
      setFeedback({type: 'error', message: 'Currency symbol is required.'});
      return;
    }

    setSaving(true);
    let uploadedNewPath: string | null = null;

    try {
      let nextLogoUrl = removeExistingLogo ? null : logoUrl;
      let nextLogoPath = removeExistingLogo ? null : logoPath;

      if (pendingLogoFile) {
        const uploaded = await uploadMenuImage(pendingLogoFile, 'logos');
        nextLogoUrl = uploaded.publicUrl;
        nextLogoPath = uploaded.path;
        uploadedNewPath = uploaded.path;
      }

      const saved = await saveBusinessSettings(settings?.id ?? null, {
        business_name: businessName,
        business_logo: nextLogoUrl,
        business_logo_path: nextLogoPath,
        menu_heading: menuHeading,
        currency_symbol: currencySymbol,
        menu_theme: menuTheme,
        public_menu_url: urlCheck.normalized,
      });

      // Clean up old logo from Supabase Storage if replaced or removed
      if ((uploadedNewPath || removeExistingLogo) && settings?.business_logo_path) {
        if (settings.business_logo_path !== uploadedNewPath) {
          await deleteMenuImage(settings.business_logo_path);
        }
      }

      onSettingsUpdated(saved);
      setPendingLogoFile(null);
      setPendingLogoPreview(null);
      setRemoveExistingLogo(false);
      setFeedback({type: 'success', message: 'Business settings saved.'});
    } catch (err) {
      if (uploadedNewPath) {
        await deleteMenuImage(uploadedNewPath);
      }
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save business settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div className="h-5 w-48 bg-stone-100 rounded animate-pulse" />
        <div className="h-10 w-full bg-stone-100 rounded animate-pulse" />
        <div className="h-10 w-full bg-stone-100 rounded animate-pulse" />
      </div>
    );
  }

  const displayedLogo = pendingLogoPreview || logoUrl;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6" noValidate>
      {feedback ? (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Brand & Menu Display</h2>
          <p className="mt-1 text-sm text-stone-500">
            Appears at the top of your public customer menu.
          </p>
        </div>

        {/* Business Logo */}
        <div>
          <label className="block text-sm font-medium text-stone-800 mb-2">
            Business Logo (Optional)
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden shrink-0">
              {displayedLogo ? (
                <img
                  src={displayedLogo}
                  alt="Business logo preview"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <Upload className="w-5 h-5 text-stone-400" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoPick}
                disabled={saving}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={saving}
                className="px-3.5 py-2 text-sm font-medium bg-white border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50"
              >
                {displayedLogo ? 'Replace Logo' : 'Upload Logo'}
              </button>

              {displayedLogo ? (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-white border border-stone-200 rounded-lg hover:bg-red-50 inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Business Name & Menu Heading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-business-name"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Business Name
            </label>
            <input
              id="settings-business-name"
              type="text"
              maxLength={120}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={saving}
              placeholder="Enter your restaurant or café name"
              className="w-full h-11 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div>
            <label
              htmlFor="settings-menu-heading"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Menu Heading
            </label>
            <input
              id="settings-menu-heading"
              type="text"
              maxLength={80}
              value={menuHeading}
              onChange={(e) => setMenuHeading(e.target.value)}
              disabled={saving}
              placeholder="Menu"
              className="w-full h-11 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>
        </div>

        {/* Currency Symbol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="settings-currency-preset"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Currency Preset
            </label>
            <select
              id="settings-currency-preset"
              value={
                CURRENCY_OPTIONS.some((opt) => opt.value === currencySymbol)
                  ? currencySymbol
                  : 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setCurrencySymbol(e.target.value);
                }
              }}
              disabled={saving}
              className="w-full h-11 px-3 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option value="custom">Custom Symbol</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="settings-currency-symbol"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Currency Symbol
            </label>
            <input
              id="settings-currency-symbol"
              type="text"
              maxLength={10}
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              disabled={saving}
              placeholder="₹"
              className="w-full h-11 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>
        </div>
      </div>

      {/* Menu Theme */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Public Menu Theme</h2>
          <p className="mt-1 text-sm text-stone-500">
            Select the palette used when customers open your QR menu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.values(MENU_THEMES) as (typeof MENU_THEMES)[MenuThemeId][]).map((theme) => {
            const selected = menuTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setMenuTheme(theme.id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  selected
                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-stone-900">{theme.label}</span>
                  <span
                    className={`w-5 h-5 rounded-full border border-stone-300 ${theme.pageBg}`}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">{theme.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Permanent Public Menu URL */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
        <label
          htmlFor="settings-public-url"
          className="block text-base font-semibold text-stone-900"
        >
          Permanent Public Menu URL
        </label>
        <p className="text-sm text-stone-500">
          Used to generate your permanent QR code once your domain is connected (e.g.{' '}
          <code className="font-mono text-xs text-stone-700">https://yourdomain.com/menu</code>).
        </p>
        <input
          id="settings-public-url"
          type="url"
          value={publicMenuUrl}
          onChange={(e) => setPublicMenuUrl(e.target.value)}
          disabled={saving}
          placeholder="https://yourdomain.com/menu"
          className="w-full h-11 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="h-11 px-6 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving Settings...' : 'Save Business Settings'}
        </button>
      </div>
    </form>
  );
}
