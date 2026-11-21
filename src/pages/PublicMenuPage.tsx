import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Search, UtensilsCrossed, X} from 'lucide-react';
import {fetchPublicMenuData} from '../lib/menuApi';
import {isSupabaseConfigured} from '../lib/supabase';
import type {Category, PublicMenuData, PublicProduct} from '../types/menu';
import {formatPrice} from '../utils/formatters';
import {DishArtwork} from '../components/common/DishArtwork';
import {MenuImage} from '../components/common/MenuImage';
import {SetupRequiredState} from '../components/common/SetupRequiredState';
import {ChefCookingIntro} from '../components/public-menu/ChefCookingIntro';
import {getMenuTheme} from '../components/public-menu/themeConfig';

interface CategoryGroup {
  category: Category;
  items: PublicProduct[];
}

const DEFAULT_SHOP_NAME = 'Al Arabian Wraps & Cafe®';

export function PublicMenuPage() {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIntro, setShowIntro] = useState(true);

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
  const businessName = data?.settings?.business_name?.trim() || DEFAULT_SHOP_NAME;
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

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    const categoryFiltered =
      selectedCategoryId === 'all'
        ? categoryGroups
        : categoryGroups.filter((group) => group.category.id === selectedCategoryId);

    if (!normalizedSearch) {
      return categoryFiltered;
    }

    return categoryFiltered
      .map((group) => {
        const categoryMatches = group.category.name.toLowerCase().includes(normalizedSearch);
        const matchingItems = categoryMatches
          ? group.items
          : group.items.filter((item) => item.name.toLowerCase().includes(normalizedSearch));
        return {
          category: group.category,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [categoryGroups, selectedCategoryId, normalizedSearch]);

  const totalMatchingItems = useMemo(
    () => visibleGroups.reduce((sum, group) => sum + group.items.length, 0),
    [visibleGroups]
  );

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
    document.title = `${businessName} — ${menuHeading}`;
  }, [businessName, menuHeading]);

  if (!isSupabaseConfigured) {
    return <SetupRequiredState context="public-menu" />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${theme.pageBg} ${theme.textPrimary} transition-colors duration-200`}
    >
      {showIntro ? (
        <ChefCookingIntro
          businessName={businessName}
          themeBgClass={theme.pageBg}
          themeTextClass={theme.textPrimary}
          themeSubTextClass={theme.textSecondary}
          themeBorderClass={theme.border}
          backgroundColorHex={theme.pageHex}
          isDarkTheme={theme.isDark}
          onComplete={() => setShowIntro(false)}
        />
      ) : null}

      {/* Editorial Hero Banner for Al Arabian Wraps & Cafe® */}
      <header className="relative overflow-hidden bg-[#1D1510] text-[#FAF5EC] border-b border-[#3A2B21]">
        {/* Subtle Arabian Geometric Arch & Warm Glow Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 75% 85% at 50% 10%, rgba(217, 152, 67, 0.22), transparent 68%), linear-gradient(180deg, rgba(29, 21, 16, 0.92) 0%, rgba(22, 16, 12, 0.98) 100%)',
          }}
        />
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none text-[#E9C488]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="arabian-lattice" width="56" height="56" patternUnits="userSpaceOnUse">
              <path
                d="M28 0L56 28L28 56L0 28Z M28 10L46 28L28 46L10 28Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle cx="28" cy="28" r="3.5" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arabian-lattice)" />
        </svg>

        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-5 pb-10 sm:pb-12">
          {/* Top Utility Bar inside Banner */}
          <div className="flex items-center justify-between gap-4 pb-6 sm:pb-8">
            <span className="text-xs font-medium tracking-[0.16em] uppercase text-[#D8C5AD]">
              {menuHeading}
            </span>
            <Link
              to="/admin/login"
              className="text-xs font-medium text-[#E5D5BF] hover:text-white hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors"
            >
              Admin Login
            </Link>
          </div>

          {/* Centerpiece Brand & Culinary Identity */}
          <div className="text-center max-w-2xl mx-auto">
            {businessLogo ? (
              <div className="mb-4 flex justify-center">
                <img
                  src={businessLogo}
                  alt={businessName}
                  referrerPolicy="no-referrer"
                  className="h-16 sm:h-20 w-auto max-w-[200px] object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="mb-4 flex justify-center" aria-hidden="true">
                <div className="w-12 h-12 rounded-full border border-[#D99843]/40 bg-[#2C1F16] flex items-center justify-center text-[#E8B86D]">
                  <UtensilsCrossed className="w-5 h-5" strokeWidth={1.6} />
                </div>
              </div>
            )}

            <h1 className="font-serif text-3xl sm:text-5xl font-medium tracking-tight text-balance text-[#FFF9F0]">
              {businessName}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#D6C5B0] leading-relaxed">
              Freshly grilled wraps, crisp broasted classics, burgers, pizzas, and cafe favorites.
            </p>

            {/* Unboxed Metadata Line */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-[#C7A77B]">
              <span>Wraps</span>
              <span aria-hidden="true">·</span>
              <span>Burgers</span>
              <span aria-hidden="true">·</span>
              <span>Sandwiches</span>
              <span aria-hidden="true">·</span>
              <span>Salads</span>
              <span aria-hidden="true">·</span>
              <span>Pizza</span>
              <span aria-hidden="true">·</span>
              <span>Beverage Combos</span>
            </div>
          </div>
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
                className={`py-3 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
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
                  className={`py-3 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Live Search Bar */}
        {!loading && !error && categoryGroups.length > 0 ? (
          <div className="mb-8 sm:mb-10">
            <div className="relative max-w-xl">
              <Search
                className={`w-4 h-4 ${theme.textSecondary} absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none`}
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wraps, burgers, paneer, pizza..."
                aria-label="Search menu items"
                className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm rounded-xl border ${theme.border} ${theme.cardBg} ${theme.textPrimary} placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#C88432] transition-shadow`}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg ${theme.textSecondary} hover:opacity-80`}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {normalizedSearch ? (
              <div className={`mt-2.5 flex items-center gap-3 text-xs ${theme.textSecondary}`}>
                <span className="tabular-nums">
                  {totalMatchingItems} {totalMatchingItems === 1 ? 'item' : 'items'} matching &ldquo;
                  {searchQuery.trim()}&rdquo;
                </span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('all');
                  }}
                  className="font-medium underline underline-offset-4 hover:opacity-80"
                >
                  Reset
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

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
          <div
            className={`max-w-md mx-auto text-center border ${theme.border} ${theme.cardBg} rounded-xl p-8`}
          >
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
        ) : visibleGroups.length === 0 ? (
          <div
            className={`py-14 px-6 text-center max-w-md mx-auto border ${theme.border} ${theme.cardBg} rounded-xl`}
          >
            <h2 className="font-serif text-xl font-medium">No dishes found</h2>
            <p className={`mt-2 text-sm ${theme.textSecondary}`}>
              Nothing matched &ldquo;{searchQuery.trim()}&rdquo;
              {selectedCategoryId !== 'all' ? ' in this category' : ''}.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {selectedCategoryId !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border ${theme.border} ${theme.surfaceBg} hover:opacity-90 transition-opacity`}
                >
                  Search All Categories
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId('all');
                }}
                className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border ${theme.border} hover:opacity-80 transition-opacity`}
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-14">
            {visibleGroups.map(({category, items}) => (
              <section key={category.id} aria-labelledby={`category-${category.id}`}>
                <div className={`pb-3 mb-6 border-b ${theme.border} flex items-baseline justify-between gap-4`}>
                  <h2
                    id={`category-${category.id}`}
                    className="font-serif text-2xl sm:text-3xl font-medium tracking-tight"
                  >
                    {category.name}
                  </h2>
                  <span className={`text-xs tabular-nums ${theme.textSecondary}`}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {items.map((product) => {
                    const hasPhoto = Boolean(
                      product.image_url && product.image_url !== 'no-image'
                    );
                    return (
                      <article
                        key={product.id}
                        className={`group rounded-xl overflow-hidden border ${theme.border} ${theme.cardBg} transition-transform duration-200 hover:-translate-y-0.5 flex flex-col justify-between`}
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden">
                          {hasPhoto ? (
                            <MenuImage
                              src={product.image_url}
                              alt={product.name}
                              fallbackLabel={product.name}
                              darkSurface={theme.isDark}
                              className="h-full w-full"
                            />
                          ) : (
                            <DishArtwork
                              productName={product.name}
                              categoryName={category.name}
                              darkSurface={theme.isDark}
                              className="transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          )}
                        </div>

                        <div className="px-4 py-4 sm:px-5 flex items-baseline justify-between gap-4">
                          <h3 className="text-base font-semibold leading-snug tracking-tight">
                            {product.name}
                          </h3>
                          <p className="text-[15px] font-medium tabular-nums whitespace-nowrap shrink-0">
                            {formatPrice(product.price, currencySymbol)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Quiet Footer with discreet Admin Login link & creator credit */}
      <footer className={`border-t ${theme.border} mt-8`}>
        <div
          className={`max-w-5xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-center gap-3 text-xs ${theme.textSecondary}`}
        >
          <span>{businessName}</span>
          <span aria-hidden="true">·</span>
          <span>Built by Muzammil Tech</span>
          <span aria-hidden="true">·</span>
          <Link
            to="/admin/login"
            className="hover:underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Admin Login
          </Link>
        </div>
      </footer>
    </div>
  );
}
