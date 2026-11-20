import {useEffect, useState, type FormEvent} from 'react';
import QRCode from 'qrcode';
import {AlertCircle, Check, Copy, Download, ExternalLink, Printer} from 'lucide-react';
import {saveBusinessSettings} from '../../lib/menuApi';
import type {BusinessSettings} from '../../types/menu';
import {resolvePermanentMenuUrl, validatePublicMenuUrl} from '../../utils/formatters';

interface QrCodeSectionProps {
  settings: BusinessSettings | null;
  onSettingsUpdated: (next: BusinessSettings) => void;
}

export function QrCodeSection({settings, onSettingsUpdated}: QrCodeSectionProps) {
  const resolution = resolvePermanentMenuUrl(settings);

  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const [domainInput, setDomainInput] = useState(settings?.public_menu_url ?? '');
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlFeedback, setUrlFeedback] = useState<{type: 'success' | 'error'; message: string} | null>(
    null
  );

  useEffect(() => {
    setDomainInput(settings?.public_menu_url ?? '');
  }, [settings?.public_menu_url]);

  useEffect(() => {
    let active = true;
    const generate = async () => {
      setQrError('');
      try {
        const [svg, png] = await Promise.all([
          QRCode.toString(resolution.url, {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 512,
            color: {
              dark: '#1F1B18',
              light: '#FFFFFF',
            },
          }),
          QRCode.toDataURL(resolution.url, {
            errorCorrectionLevel: 'H',
            margin: 3,
            width: 1024,
            color: {
              dark: '#1F1B18',
              light: '#FFFFFF',
            },
          }),
        ]);
        if (!active) return;
        setSvgMarkup(svg);
        setPngDataUrl(png);
      } catch (err) {
        if (!active) return;
        setQrError(err instanceof Error ? err.message : 'Unable to generate QR code.');
      }
    };
    generate();
    return () => {
      active = false;
    };
  }, [resolution.url]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(resolution.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setUrlFeedback({type: 'error', message: 'Could not copy URL to clipboard.'});
    }
  };

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = 'menu-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSvg = () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu-qr-code.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveProductionUrl = async (e: FormEvent) => {
    e.preventDefault();
    setUrlFeedback(null);

    const check = validatePublicMenuUrl(domainInput);
    if (!check.valid) {
      setUrlFeedback({type: 'error', message: check.error || 'Invalid URL.'});
      return;
    }

    setSavingUrl(true);
    try {
      const saved = await saveBusinessSettings(settings?.id ?? null, {
        business_name: settings?.business_name ?? '',
        business_logo: settings?.business_logo ?? null,
        business_logo_path: settings?.business_logo_path ?? null,
        menu_heading: settings?.menu_heading ?? 'Menu',
        currency_symbol: settings?.currency_symbol ?? '₹',
        menu_theme: settings?.menu_theme ?? 'warm-ivory',
        public_menu_url: check.normalized,
      });
      onSettingsUpdated(saved);
      setUrlFeedback({
        type: 'success',
        message: check.normalized
          ? 'Permanent production menu URL saved. Your QR code has been updated.'
          : 'Cleared custom URL. Reverted to current host URL.',
      });
    } catch (err) {
      setUrlFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save public menu URL.',
      });
    } finally {
      setSavingUrl(false);
    }
  };

  const businessTitle = settings?.business_name?.trim();

  return (
    <div className="space-y-6">
      {/* Temporary URL Warning when Production Domain is not configured */}
      {!resolution.isProductionConfigured ? (
        <div className="no-print rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-950">
            <p className="font-semibold">Using Temporary Preview URL (Not Public for Phone Scans Yet)</p>
            <p className="mt-1 text-amber-900 leading-relaxed">
              This QR code currently points to your temporary preview URL (
              <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">
                {resolution.url}
              </code>
              ). Development preview links require your private session and will redirect mobile
              phones to Google AI Studio instead of the menu. Once you deploy to Netlify, enter
              your live Netlify or custom domain URL below (for example:{' '}
              <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">
                https://your-menu.netlify.app/menu
              </code>
              ) to generate your permanent public QR code.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Printable QR Card Preview */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-8 flex flex-col items-center text-center">
          {businessTitle ? (
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-stone-500 mb-1">
              {businessTitle}
            </p>
          ) : null}
          <h2 className="font-serif text-2xl font-medium text-stone-900 mb-6">
            Scan for Menu
          </h2>

          <div className="w-64 h-64 p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-center">
            {qrError ? (
              <p className="text-xs text-red-700 px-4">{qrError}</p>
            ) : pngDataUrl ? (
              <img
                src={pngDataUrl}
                alt={`Permanent QR code for ${resolution.url}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-stone-100 animate-pulse rounded" />
            )}
          </div>

          <p className="mt-5 text-xs font-mono text-stone-500 break-all max-w-xs">
            {resolution.url}
          </p>
        </div>

        {/* Controls & Domain Configuration */}
        <div className="no-print lg:col-span-7 space-y-6">
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-stone-900">Universal Permanent QR Code</h3>
            <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">
              This single QR code links directly to your live public menu page. Whenever you add
              products, adjust prices, hide items, or upload new photos, customers scanning this
              same QR code automatically see the latest menu.
            </p>

            {/* Permanent URL Copy Box */}
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-700 break-all">
                {resolution.url}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium bg-white border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href="/menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3.5 inline-flex items-center gap-2 text-sm font-medium bg-white border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Download & Print Buttons */}
            <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!pngDataUrl}
                className="h-10 px-4 inline-flex items-center gap-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSvg}
                disabled={!svgMarkup}
                className="h-10 px-4 inline-flex items-center gap-2 text-sm font-medium bg-white border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download SVG</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={!pngDataUrl}
                className="h-10 px-4 inline-flex items-center gap-2 text-sm font-medium bg-white border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Code</span>
              </button>
            </div>
          </div>

          {/* Configure Production Domain URL */}
          <form
            onSubmit={handleSaveProductionUrl}
            className="bg-white border border-stone-200 rounded-xl p-6 space-y-4"
          >
            <div>
              <h3 className="text-base font-semibold text-stone-900">Production Menu URL</h3>
              <p className="mt-1 text-sm text-stone-500">
                Set your live Netlify or custom domain URL once deployed so your printed QR code
                stays permanent forever.
              </p>
            </div>

            {urlFeedback ? (
              <div
                role={urlFeedback.type === 'error' ? 'alert' : 'status'}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  urlFeedback.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                {urlFeedback.message}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={savingUrl}
                placeholder="https://your-menu.netlify.app/menu"
                aria-label="Production public menu URL"
                className="flex-1 h-10 px-3.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <button
                type="submit"
                disabled={savingUrl}
                className="h-10 px-5 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 whitespace-nowrap"
              >
                {savingUrl ? 'Saving...' : 'Save URL'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
