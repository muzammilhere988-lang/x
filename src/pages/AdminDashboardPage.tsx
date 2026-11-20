import {useCallback, useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {RefreshCw} from 'lucide-react';
import {signOutAdmin, type AuthorizedAdminSession} from '../lib/auth';
import {
  fetchAdminCategories,
  fetchAdminProducts,
  fetchBusinessSettings,
} from '../lib/menuApi';
import type {AdminSectionId, BusinessSettings, Category, Product} from '../types/menu';
import {AdminLayout} from '../components/admin/AdminLayout';
import {OverviewSection} from '../components/admin/OverviewSection';
import {ProductsSection} from '../components/admin/ProductsSection';
import {CategoriesSection} from '../components/admin/CategoriesSection';
import {QrCodeSection} from '../components/admin/QrCodeSection';
import {SettingsSection} from '../components/admin/SettingsSection';

interface AdminDashboardPageProps {
  auth: AuthorizedAdminSession;
}

const VALID_SECTIONS = new Set<AdminSectionId>([
  'overview',
  'products',
  'categories',
  'qr',
  'settings',
]);

export function AdminDashboardPage({auth}: AdminDashboardPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawSection = searchParams.get('section') as AdminSectionId | null;
  const activeSection: AdminSectionId =
    rawSection && VALID_SECTIONS.has(rawSection) ? rawSection : 'overview';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [productsData, categoriesData, settingsData] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminCategories(),
        fetchBusinessSettings(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load dashboard data from Supabase.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Admin Dashboard — QR Menu';
    loadAll();
  }, [loadAll]);

  const handleSelectSection = (section: AdminSectionId) => {
    setSearchParams(section === 'overview' ? {} : {section});
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutAdmin();
      navigate('/admin/login', {replace: true});
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to sign out.');
      setSigningOut(false);
    }
  };

  const currencySymbol = settings?.currency_symbol || '₹';

  return (
    <AdminLayout
      activeSection={activeSection}
      onSelectSection={handleSelectSection}
      adminEmail={auth.profile.email}
      businessName={settings?.business_name ?? ''}
      onSignOut={handleSignOut}
      signingOut={signingOut}
      headerAction={
        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-medium text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      }
    >
      {loadError ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between gap-4"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadAll}
            className="px-3 py-1.5 text-xs font-medium bg-red-800 text-white rounded-md hover:bg-red-900 shrink-0"
          >
            Retry
          </button>
        </div>
      ) : null}

      {activeSection === 'overview' ? (
        <OverviewSection
          products={products}
          categories={categories}
          settings={settings}
          loading={loading}
          onNavigate={handleSelectSection}
        />
      ) : null}

      {activeSection === 'products' ? (
        <ProductsSection
          products={products}
          categories={categories}
          currencySymbol={currencySymbol}
          loading={loading}
          onProductsChange={setProducts}
          onGoToCategories={() => handleSelectSection('categories')}
        />
      ) : null}

      {activeSection === 'categories' ? (
        <CategoriesSection
          categories={categories}
          products={products}
          loading={loading}
          onCategoriesChange={setCategories}
        />
      ) : null}

      {activeSection === 'qr' ? (
        <QrCodeSection settings={settings} onSettingsUpdated={setSettings} />
      ) : null}

      {activeSection === 'settings' ? (
        <SettingsSection
          settings={settings}
          loading={loading}
          onSettingsUpdated={setSettings}
        />
      ) : null}
    </AdminLayout>
  );
}
