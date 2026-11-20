import {ArrowRight, CheckCircle2, Circle, FolderOpen, QrCode, Settings, Utensils} from 'lucide-react';
import type {
  AdminSectionId,
  BusinessSettings,
  Category,
  DashboardStats,
  Product,
} from '../../types/menu';
import {resolvePermanentMenuUrl} from '../../utils/formatters';

interface OverviewSectionProps {
  products: Product[];
  categories: Category[];
  settings: BusinessSettings | null;
  loading: boolean;
  onNavigate: (section: AdminSectionId) => void;
}

export function OverviewSection({
  products,
  categories,
  settings,
  loading,
  onNavigate,
}: OverviewSectionProps) {
  const stats: DashboardStats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.is_active && p.is_available).length,
    hiddenProducts: products.filter((p) => !p.is_active || !p.is_available).length,
    totalCategories: categories.length,
  };

  const urlResolution = resolvePermanentMenuUrl(settings);

  const checklist = [
    {
      label: 'Set business name and currency',
      done: Boolean(settings?.business_name?.trim()),
      actionLabel: 'Open Settings',
      section: 'settings' as AdminSectionId,
    },
    {
      label: 'Create at least one menu category',
      done: categories.length > 0,
      actionLabel: 'Manage Categories',
      section: 'categories' as AdminSectionId,
    },
    {
      label: 'Add and publish your first product',
      done: stats.activeProducts > 0,
      actionLabel: 'Manage Products',
      section: 'products' as AdminSectionId,
    },
    {
      label: 'Configure production domain for your permanent QR code',
      done: urlResolution.isProductionConfigured,
      actionLabel: 'Configure QR Code',
      section: 'qr' as AdminSectionId,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Real Database Statistics */}
      <section aria-label="Menu statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Products" value={stats.totalProducts} loading={loading} />
          <StatCard label="Active on Menu" value={stats.activeProducts} loading={loading} />
          <StatCard label="Hidden / Unavailable" value={stats.hiddenProducts} loading={loading} />
          <StatCard label="Total Categories" value={stats.totalCategories} loading={loading} />
        </div>
      </section>

      {/* Quick Workspace Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-stone-900">Setup & Publishing Checklist</h2>
          <p className="mt-1 text-sm text-stone-500">
            Live status calculated directly from your Supabase database.
          </p>

          <ul className="mt-5 divide-y divide-stone-100">
            {checklist.map((item) => (
              <li
                key={item.label}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      item.done ? 'text-stone-600' : 'text-stone-900 font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(item.section)}
                  className="text-xs font-medium text-stone-700 hover:text-stone-900 whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-stone-500">
              Jump directly to common menu tasks.
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Utensils className="w-4 h-4" />
                  <span>Manage Products</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-stone-600" />
                  <span>Manage Categories</span>
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('qr')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <QrCode className="w-4 h-4 text-stone-600" />
                  <span>View & Print QR Code</span>
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-stone-600" />
                  <span>Business Settings</span>
                </span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({label, value, loading}: {label: string; value: number; loading: boolean}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 bg-stone-100 rounded animate-pulse" />
      ) : (
        <p className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900 tabular-nums">
          {value}
        </p>
      )}
    </div>
  );
}
