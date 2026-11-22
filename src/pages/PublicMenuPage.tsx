import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowDown, Search, UtensilsCrossed, X} from 'lucide-react';
import heroSpreadImg from '../assets/images/hero_arabian_wraps_spread_1795342092198.jpg';
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

interface SelectedDish {
  product: PublicProduct;
  categoryName: string;
}

const DEFAULT_SHOP_NAME = 'Al Arabian Wraps & Cafe®';

export function PublicMenuPage() {
  const [data, setData] = useState<PublicMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [selectedDish, setSelectedDish] = useState<SelectedDish | null>(null);

  const catalogueRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

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

  useEffect(() => {
    if (!selectedDish) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDish(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDish]);

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

  const totalCatalogueItems = useMemo(
    () => categoryGroups.reduce((sum, group) => sum + group.items.length, 0),
    [categoryGroups]
  );

  // Pick up to 3 signature dishes for the top "House Favourites" strip (prioritizing dishes with real photos)
  const spotlightDishes = useMemo<SelectedDish[]>(() => {
    if (categoryGroups.length === 0) return [];
    const categoryNameMap = new Map(
      categoryGroups.map(({category}) => [category.id, category.name])
    );

    const allWithCategory: SelectedDish[] = [];
    for (const group of categoryGroups) {
      for (const product of group.items) {
        allWithCategory.push({
          product,
          categoryName: categoryNameMap.get(product.category_id) ?? group.category.name,
        });
      }
    }

    const withRealPhotos = allWithCategory.filter(
      ({product}) => product.image_url && product.image_url !== 'no-image'
    );

    if (withRealPhotos.length >= 3) {
      return withRealPhotos.slice(0, 3);
    }

    const seenIds = new Set(withRealPhotos.map((entry) => entry.product.id));
    const combined = [...withRealPhotos];
    for (const entry of allWithCategory) {
      if (combined.length >= 3) break;
      if (!seenIds.has(entry.product.id)) {
        combined.push(entry);
        seenIds.add(entry.product.id);
      }
    }
    return combined;
  }, [categoryGroups]);

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

  const scrollToCatalogue = () => {
    catalogueRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  const focusSearch = () => {
    catalogueRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 260);
  };

  const jumpToCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    catalogueRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  if (!isSupabaseConfigured) {
    return <SetupRequiredState context="public-menu" />;
  }

  const showSpotlight =
    !loading &&
    !error &&
    !normalizedSearch &&
    selectedCategoryId === 'all' &&
    spotlightDishes.length >= 3;

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
          onComplete={handleIntroComplete}
        />
      ) : null}

      {/* Editorial Storefront Hero for Al Arabian Wraps & Cafe® */}
      <header className="relative overflow-hidden bg-[#150F0B] text-[#FAF5EC] border-b border-[#33241A]">
        {/* Warm Candlelight Gradient + Subtle Arabian Geometric Lattice */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 65% 80% at 78% 28%, rgba(217, 152, 67, 0.24), transparent 65%), radial-gradient(ellipse 60% 70% at 15% 15%, rgba(196, 124, 43, 0.14), transparent 60%), linear-gradient(180deg, rgba(21, 15, 11, 0.94) 0%, rgba(17, 12, 9, 0.99) 100%)',
          }}
        />
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none text-[#E9C488]"
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

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-5 pb-10 sm:pb-14">
          {/* Top Bar Contract: Brand wordmark — Quick category links — 1 discreet action */}
          <div className="flex items-center justify-between gap-8 pb-7 sm:pb-10 border-b border-[#E9C488]/12">
            <span className="font-serif text-base sm:text-lg font-medium tracking-tight text-[#FFF8EC] whitespace-nowrap shrink-0">
              {businessName}
            </span>

            {categoryGroups.length > 0 ? (
              <nav
                aria-label="Quick sections"
                className="hidden md:flex items-center gap-6 text-xs font-medium text-[#D6C5B0]"
              >
                {categoryGroups.slice(0, 4).map(({category}) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => jumpToCategory(category.id)}
                    className="hover:text-[#FFF8EC] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            ) : null}

            <Link
              to="/admin/login"
              className="text-xs font-medium text-[#E5D5BF] hover:text-white hover:underline underline-offset-4 whitespace-nowrap shrink-0 transition-colors"
            >
              Admin Login
            </Link>
          </div>

          {/* Asymmetric Split Campaign Focal Area */}
          <div className="pt-8 sm:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Brand Typography & Immediate Actions */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="flex items-center gap-3.5">
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt={businessName}
                    referrerPolicy="no-referrer"
                    className="h-12 w-auto max-w-[140px] object-contain rounded-lg border border-[#E9C488]/25 bg-[#221811] p-1"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-11 h-11 rounded-xl border border-[#D99843]/40 bg-[#261B13] flex items-center justify-center text-[#E8B86D] shrink-0"
                  >
                    <UtensilsCrossed className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                )}
                <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#D9A760]">
                  {menuHeading} · Arabian Grill &amp; Cafe Kitchen
                </p>
              </div>

              <h1 className="font-serif text-[clamp(2.15rem,4.4vw,3.55rem)] font-medium tracking-tight leading-[1.08] text-balance text-[#FFF9F0]">
                Flame-Grilled Wraps, Crispy Classics &amp;{' '}
                <span className="italic text-[#E8B466]">Cafe Signatures.</span>
              </h1>

              <p className="text-sm sm:text-base text-[#D7C6B1] leading-relaxed max-w-xl">
                Hand-rolled shawarma wraps, crisp broasted tenders, juicy burgers, wood-baked pizzas,
                and chilled house coolers — prepared fresh to order.
              </p>

              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToCatalogue}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D99843] text-[#17100A] hover:bg-[#E5A956] text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Menu</span>
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={focusSearch}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E9C488]/30 text-[#FAF5EC] hover:bg-white/5 text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#E8B466]" />
                  <span>Find a Dish</span>
                </button>
              </div>

              {/* Clean Unboxed Specialty Metadata Line */}
              <div className="pt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#C8AE8A] tabular-nums">
                {totalCatalogueItems > 0 ? (
                  <>
                    <span>{totalCatalogueItems} Fresh Dishes</span>
                    <span aria-hidden="true">·</span>
                    <span>{categoryGroups.length} Kitchen Sections</span>
                    <span aria-hidden="true">·</span>
                  </>
                ) : null}
                <span>Grilled Fresh to Order</span>
                <span aria-hidden="true">·</span>
                <span>Dine-In &amp; Takeaway</span>
              </div>
            </div>

            {/* Right Column: Rich Culinary Photography Showcase */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-[#E9C488]/25 bg-[#231912] shadow-2xl">
                {heroImgFailed ? (
                  <DishArtwork
                    productName="Arabian Grilled Wraps & Cafe Platter"
                    categoryName="Wraps"
                    darkSurface={true}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={heroSpreadImg}
                    alt="Signature grilled Arabian shawarma wraps, crispy broasted strips, and mint lime cooler"
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Measured Contrast Scrim + Caption */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#120C08]/90 via-[#120C08]/25 to-transparent pointer-events-none"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-[#E8B86D]">
                      House Signature Spread
                    </p>
                    <p className="font-serif text-lg sm:text-xl font-medium text-[#FFF8EC] leading-snug mt-0.5">
                      Charred Shawarma Wraps &amp; Crispy Strips
                    </p>
                  </div>
                  <span className="hidden sm:inline-block text-xs text-[#E5D5BF] whitespace-nowrap shrink-0">
                    Served Hot Daily
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slim Sticky Category Navigation (well under 15% mobile viewport height) */}
      {!loading && !error && categoryGroups.length > 1 ? (
        <nav
          aria-label="Menu categories"
          className={`sticky top-0 z-20 ${theme.navBg} backdrop-blur-md border-b ${theme.border}`}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('all')}
                className={`py-3 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  selectedCategoryId === 'all' ? theme.activeTab : theme.inactiveTab
                }`}
              >
                All ({totalCatalogueItems})
              </button>
              {categoryGroups.map(({category, items}) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`py-3 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    selectedCategoryId === category.id ? theme.activeTab : theme.inactiveTab
                  }`}
                >
                  {category.name}{' '}
                  <span className="opacity-55 text-xs tabular-nums">({items.length})</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      ) : null}

      {/* Main Catalogue */}
      <main
        ref={catalogueRef}
        id="menu-catalogue"
        className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12 scroll-mt-14"
      >
        {/* Live Search & Results Bar */}
        {!loading && !error && categoryGroups.length > 0 ? (
          <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search
                className={`w-4 h-4 ${theme.textSecondary} absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none`}
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wraps, burgers, paneer, pizza, coolers..."
                aria-label="Search menu items"
                className={`w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm rounded-xl border ${theme.border} ${theme.cardBg} ${theme.textPrimary} placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#C88432] transition-shadow`}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg ${theme.textSecondary} hover:opacity-80 cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {normalizedSearch ? (
              <div className={`flex items-center gap-3 text-xs ${theme.textSecondary}`}>
                <span className="tabular-nums">
                  {totalMatchingItems} {totalMatchingItems === 1 ? 'dish' : 'dishes'} matching &ldquo;
                  {searchQuery.trim()}&rdquo;
                </span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryId('all');
                  }}
                  className="font-medium underline underline-offset-4 hover:opacity-80 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            ) : (
              <p className={`text-xs ${theme.textSecondary} tabular-nums hidden sm:block`}>
                Tap any dish for a closer look
              </p>
            )}
          </div>
        ) : null}

        {/* Chef's Spotlight Row (shown on initial All view when >= 3 dishes exist) */}
        {showSpotlight ? (
          <section aria-labelledby="spotlight-heading" className="mb-12 sm:mb-14">
            <div className={`pb-3 mb-6 border-b ${theme.border} flex items-baseline justify-between gap-4`}>
              <div>
                <p className={`text-[11px] font-medium tracking-[0.14em] uppercase ${theme.textSecondary}`}>
                  Recommended First Bites
                </p>
                <h2
                  id="spotlight-heading"
                  className="font-serif text-2xl sm:text-3xl font-medium tracking-tight mt-0.5"
                >
                  House Favourites
                </h2>
              </div>
              <span className={`text-xs ${theme.textSecondary} hidden sm:inline`}>
                Popular picks from our grill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
              {spotlightDishes.map(({product, categoryName}) => {
                const hasPhoto = Boolean(product.image_url && product.image_url !== 'no-image');
                return (
                  <button
                    key={`spotlight-${product.id}`}
                    type="button"
                    onClick={() => setSelectedDish({product, categoryName})}
                    className={`group text-left rounded-xl overflow-hidden border ${theme.border} ${theme.cardBg} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C88432]`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      {hasPhoto ? (
                        <MenuImage
                          src={product.image_url}
                          alt={product.name}
                          fallbackLabel={product.name}
                          priority={true}
                          darkSurface={theme.isDark}
                          className="h-full w-full"
                        />
                      ) : (
                        <DishArtwork
                          productName={product.name}
                          categoryName={categoryName}
                          darkSurface={theme.isDark}
                          className="transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>

                    <div className={`w-full px-4 py-3.5 sm:px-5 border-t ${theme.border}`}>
                      <p className={`text-[11px] uppercase tracking-[0.12em] ${theme.textSecondary}`}>
                        {categoryName}
                      </p>
                      <div className="mt-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-base font-semibold leading-snug tracking-tight">
                          {product.name}
                        </h3>
                        <p
                          className={`text-[15px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                            theme.isDark ? 'text-[#E8B466]' : 'text-[#A85F12]'
                          }`}
                        >
                          {formatPrice(product.price, currencySymbol)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
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
              className={`mt-5 min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-lg border ${theme.border} ${theme.surfaceBg} hover:opacity-90 transition-opacity cursor-pointer`}
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
                  className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border ${theme.border} ${theme.surfaceBg} hover:opacity-90 transition-opacity cursor-pointer`}
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
                className={`min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg border ${theme.border} hover:opacity-80 transition-opacity cursor-pointer`}
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {visibleGroups.map(({category, items}, groupIndex) => {
              const sectionNumber = String(groupIndex + 1).padStart(2, '0');
              return (
                <section key={category.id} aria-labelledby={`category-${category.id}`}>
                  <div
                    className={`pb-3 mb-6 border-b ${theme.border} flex items-baseline justify-between gap-4`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span
                        aria-hidden="true"
                        className={`font-mono text-xs tabular-nums ${theme.textSecondary} opacity-75`}
                      >
                        {sectionNumber}.
                      </span>
                      <h2
                        id={`category-${category.id}`}
                        className="font-serif text-2xl sm:text-3xl font-medium tracking-tight"
                      >
                        {category.name}
                      </h2>
                    </div>
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
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            setSelectedDish({product, categoryName: category.name})
                          }
                          className={`group text-left rounded-xl overflow-hidden border ${theme.border} ${theme.cardBg} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C88432]`}
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

                          <div
                            className={`w-full px-4 py-4 sm:px-5 border-t ${theme.border} flex items-baseline justify-between gap-4`}
                          >
                            <div className="min-w-0">
                              <p
                                className={`text-[11px] uppercase tracking-[0.12em] ${theme.textSecondary} truncate`}
                              >
                                {category.name}
                              </p>
                              <h3 className="mt-0.5 text-base font-semibold leading-snug tracking-tight">
                                {product.name}
                              </h3>
                            </div>
                            <p
                              className={`text-[15px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                                theme.isDark ? 'text-[#E8B466]' : 'text-[#A85F12]'
                              }`}
                            >
                              {formatPrice(product.price, currencySymbol)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Interactive Dish Detail Modal */}
      {selectedDish ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-modal-title"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl overflow-hidden border ${theme.border} ${theme.cardBg} ${theme.textPrimary} shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[4/3] w-full relative overflow-hidden">
              {selectedDish.product.image_url &&
              selectedDish.product.image_url !== 'no-image' ? (
                <MenuImage
                  src={selectedDish.product.image_url}
                  alt={selectedDish.product.name}
                  fallbackLabel={selectedDish.product.name}
                  priority={true}
                  darkSurface={theme.isDark}
                  className="h-full w-full"
                />
              ) : (
                <DishArtwork
                  productName={selectedDish.product.name}
                  categoryName={selectedDish.categoryName}
                  darkSurface={theme.isDark}
                />
              )}

              <button
                type="button"
                onClick={() => setSelectedDish(null)}
                aria-label="Close dish preview"
                className="absolute top-3 right-3 min-w-[40px] min-h-[40px] rounded-full bg-black/65 text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-5 sm:p-6 border-t ${theme.border}`}>
              <p className={`text-xs uppercase tracking-[0.14em] ${theme.textSecondary}`}>
                {selectedDish.categoryName} · {businessName}
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-4">
                <h2
                  id="dish-modal-title"
                  className="font-serif text-2xl font-medium tracking-tight"
                >
                  {selectedDish.product.name}
                </h2>
                <span
                  className={`text-xl font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                    theme.isDark ? 'text-[#E8B466]' : 'text-[#A85F12]'
                  }`}
                >
                  {formatPrice(selectedDish.product.price, currencySymbol)}
                </span>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDish(null)}
                  className={`min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-xl border ${theme.border} ${theme.surfaceBg} hover:opacity-90 transition-opacity cursor-pointer`}
                >
                  Back to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Quiet Footer with discreet Admin Login link & creator credit */}
      <footer className={`border-t ${theme.border} mt-8`}>
        <div
          className={`max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-center gap-3 text-xs ${theme.textSecondary}`}
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
