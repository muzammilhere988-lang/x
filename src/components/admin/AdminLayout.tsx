import {useState, type ReactNode} from 'react';
import {
  LayoutDashboard,
  Utensils,
  FolderOpen,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import type {AdminSectionId} from '../../types/menu';

interface AdminLayoutProps {
  activeSection: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  adminEmail: string;
  businessName: string;
  onSignOut: () => void;
  signingOut: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS: {id: AdminSectionId; label: string; icon: typeof LayoutDashboard}[] = [
  {id: 'overview', label: 'Overview', icon: LayoutDashboard},
  {id: 'products', label: 'Products', icon: Utensils},
  {id: 'categories', label: 'Categories', icon: FolderOpen},
  {id: 'qr', label: 'QR Code', icon: QrCode},
  {id: 'settings', label: 'Settings', icon: Settings},
];

const SECTION_TITLES: Record<AdminSectionId, string> = {
  overview: 'Overview',
  products: 'Products',
  categories: 'Categories',
  qr: 'Permanent QR Code',
  settings: 'Business Settings',
};

export function AdminLayout({
  activeSection,
  onSelectSection,
  adminEmail,
  businessName,
  onSignOut,
  signingOut,
  headerAction,
  children,
}: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (section: AdminSectionId) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-stone-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-stone-200">
        <div className="px-6 py-5 border-b border-stone-200">
          <p className="font-serif text-lg font-medium text-stone-900 truncate">
            {businessName.trim() || 'QR Menu Admin'}
          </p>
          <p className="text-xs text-stone-500 mt-0.5 truncate">{adminEmail}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-stone-200 space-y-1">
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <span>Open Public Menu</span>
            <ExternalLink className="w-4 h-4 text-stone-400" strokeWidth={1.75} />
          </a>

          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-stone-600 rounded-lg hover:bg-stone-100 hover:text-stone-900 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="no-print lg:hidden sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-serif text-base font-medium text-stone-900 truncate">
            {businessName.trim() || 'QR Menu Admin'}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 -mr-2 rounded-lg text-stone-700 hover:bg-stone-100"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-stone-200 bg-white px-3 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg ${
                    active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-stone-100 space-y-1">
              <a
                href="/menu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <span>Open Public Menu</span>
                <ExternalLink className="w-4 h-4 text-stone-400" />
              </a>
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-stone-600 rounded-lg hover:bg-stone-100"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="no-print bg-white border-b border-stone-200 px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-semibold text-stone-900 tracking-tight truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
