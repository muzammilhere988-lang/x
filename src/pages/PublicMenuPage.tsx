import {useCallback, useEffect, useMemo, useState} from 'react';
import {UtensilsCrossed} from 'lucide-react';
import {fetchPublicMenuData} from '../lib/menuApi';
import {isSupabaseConfigured} from '../lib/supabase';
import type {Category, PublicMenuData, PublicProduct} from '../types/menu';
import {formatPrice} from '../utils/formatters';
import {MenuImage} from '../components/common/MenuImage';
import {SetupRequiredState} from '../components/common/SetupRequiredState';
import {getMenuTheme} from '../components/public-menu/themeConfig';

interface CategoryGroup {
  category: Category;
  items: PublicProduct[];
}

export function PublicMenuPage() {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const loadMenu = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const result = await fetchPublicMenuData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load menu right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu(false);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadMenu(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [loadMenu]);

  const theme = getMenuTheme(data?.settings?.menu_theme);
  const currencySymbol = data?.settings?.currency_symbol || '₹';
  const businessName = data?.settings?.business_name?.trim() || '';
  const menuHeading = data?.settings?.menu_heading?.trim() || 'Menu';
  const businessLogo = data?.settings?.business_logo || null;

  // Group active, available products under their active categories.
  // Only categories containing at least 1 active product appear publicly.
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    if (!data) return [];
    const byCategory = new Map<string, PublicProduct[]>();

    for (const product of data.products) {
      const existing = byCategory.get(product.category_id) ?? [];
      existing.push(product);
      byCategory.set(product.category_id, existing);
    }

    return data.categories
      .filter((category) => (byCategory.get(category.id)?.length ?? 0) > 0)
      .map((category) => ({
        category,
        items: byCategory.get(category.id) ?? [],
      }));
  }, [data]);

  const visibleGroups = useMemo(() => {
    if (selectedCategoryId === 'all') return categoryGroups;
    return categoryGroups.filter((group) => group.category.id === selectedCategoryId);
  }, [categoryGroups, selectedCategoryId]);

  // Reset selected category if it no longer has visible items after refresh
  useEffect(() => {
    if (
      selectedCategoryId !== 'all' &&
      !categoryGroups.some((group) => group.category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId('all');
    }
  }, [categoryGroups, selectedCategoryId]);

  useEffect(() => {
    if (businessName) {
      document.title = `${businessName} — ${menuHeading}`;
    } else {
      document.title = menuHeading;
    }
  }, [businessName, menuHeading]);

  if (!isSupabaseConfigured) {
    return <SetupRequiredState context="public-menu" />;
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.textPrimary} transition-colors duration-200`}>
      {/* Business Header */}
      <header className={`border-b ${theme.border}`}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center">
          {businessLogo ? (
            <div className="mb-5 flex justify-center">
              <img
                src={businessLogo}
                alt={businessName || 'Business logo'}
                referrerPolicy="no-referrer"
                className="h-16 sm:h-20 w-auto max-w-[200px] object-contain"
              />
            </div>
          ) : null}

          {businessName ? (
            <p className={`text-xs sm:text-sm font-medium tracking-[0.16em] uppercase ${theme.textSecondary} mb-2`}>
              {businessName}
            </p>
          ) : null}

          <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight">
            {menuHeading}
          </h1>
        </div>
      </header>

      {/* Sticky Category Navigation (only when categories with active products exist) */}
      {!loading && !error && categoryGroups.length > 1 ? (
        <nav
          aria-label="Menu categories"
          className={`sticky top-0 z-20 ${theme.navBg} backdrop-blur-sm border-b ${theme.border}`}
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`py-3.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  selectedCategoryId === 'all' ? theme.activeTab : theme.inactiveTab
                }`}
              >
                All
              </button>
              {categoryGroups.map(({category}) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`py-3.5 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    selectedCategoryId === category.id ? theme.activeTab : theme.inactiveTab
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </nav>
      ) : null}

      {/* Main Catalogue */}
      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="space-y-12" aria-busy="true" aria-label="Loading menu">
            <div>
              <div className={`h-7 w-40 rounded ${theme.surfaceBg} mb-6 animate-pulse`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`rounded-xl overflow-hidden border ${theme.border} ${theme.cardBg}`}
                  >
                    <div className={`aspect-[4/3] w-full ${theme.surfaceBg} animate-pulse`} />
                    <div className="p-4 flex items-baseline justify-between gap-4">
                      <div className={`h-5 w-32 rounded ${theme.surfaceBg} animate-pulse`} />
                      <div className={`h-5 w-14 rounded ${theme.surfaceBg} animate-pulse`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className={`max-w-md mx-auto text-center border ${theme.border} ${theme.cardBg} rounded-xl p-8`}>
            <h2 className="font-serif text-xl font-medium">Unable to Load Menu</h2>
            <p className={`mt-2 text-sm ${theme.textSecondary}`}>{error}</p>
            <button
              type="button"
              onClick={() => loadMenu(false)}
              className={`mt-5 px-5 py-2.5 text-sm font-medium rounded-lg border ${theme.border} ${theme.surfaceBg} hover:opacity-90 transition-opacity`}
            >
              Try Again
            </button>
          </div>
        ) : categoryGroups.length === 0 ? (
          <div className="py-16 sm:py-24 text-center max-w-md mx-auto">
            <div
              className={`w-12 h-12 rounded-full ${theme.surfaceBg} mx-auto flex items-center justify-center mb-5`}
            >
              <UtensilsCrossed className={`w-5 h-5 ${theme.textSecondary}`} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium">
              Your menu is being prepared.
            </h2>
            <p className={`mt-3 text-sm leading-relaxed ${theme.textSecondary}`}>
              Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-14 sm:space-y-16">
            {visibleGroups.map(({category, items}) => (
              <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <div className={`pb-3 mb-6 sm:mb-8 border-b ${theme.border}`}>
                  <h2
                    id={`category-${category.id}`}
                    className="font-serif text-2xl sm:text-3xl font-medium tracking-tight"
                  >
                    {category.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {items.map((product) => (
                    <article
                      key={product.id}
                      className={`group rounded-xl overflow-hidden border ${theme.border} ${theme.cardBg} transition-transform duration-200 hover:-translate-y-0.5`}
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <MenuImage
                          src={product.image_url}
                          alt={product.name}
                          fallbackLabel={product.name}
                          darkSurface={theme.isDark}
                          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>

                      <div className="px-4 py-4 sm:px-5 sm:py-4 flex items-baseline justify-between gap-4">
                        <h3 className="text-base font-semibold leading-snug tracking-tight">
                          {product.name}
                        </h3>
                        <p className="text-[15px] font-medium tabular-nums whitespace-nowrap shrink-0">
                          {formatPrice(product.price, currencySymbol)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Quiet Footer (Strictly no admin links, no telemetry, no clutter) */}
      {businessName ? (
        <footer className={`border-t ${theme.border} mt-8`}>
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 text-center">
            <p className={`text-xs ${theme.textSecondary}`}>{businessName}</p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
