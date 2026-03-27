import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBrand, BrandOption } from '../context/BrandContext';
import { LogOut, LayoutDashboard, Users, Moon, Sun, FileText, ChevronDown, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS_COMMON = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
];

const NAV_ITEMS_ADMIN = [
  { to: '/team', label: 'Equipe', icon: Users },
  { to: '/reports', label: 'Relatórios', icon: FileText },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

/** Helper: retorna o logo correto para o tema atual */
function useBrandLogo(brand: BrandOption | null, type: 'logo' | 'icon' = 'logo') {
  if (!brand) return null;
  return type === 'logo' ? brand.logoUrl : brand.iconUrl;
}

/** Select de marca para admins */
function BrandSelector() {
  const { brands, selectedBrand, setSelectedBrand } = useBrand();
  const { theme } = useTheme();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (brand: BrandOption | null) => {
    setSelectedBrand(brand);
    setOpen(false);
  };

  const getIcon = (brand: BrandOption) => brand.iconUrl || '/logos/icon_geralbet_azul.png';

  return (
    <div ref={ref} className="relative px-2.5 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>
        Filtrar por Marca
      </p>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          color: 'var(--text-1)',
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedBrand ? (
            <>
              <img
                src={getIcon(selectedBrand)}
                alt={selectedBrand.name}
                className="w-5 h-5 rounded object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="truncate">{selectedBrand.name}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-3)' }}>Todas as marcas</span>
          )}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--text-3)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-2.5 right-2.5 mt-1 rounded-xl overflow-hidden animate-scale-in z-50"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <button
            onClick={() => choose(null)}
            className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: selectedBrand === null ? 'var(--brand-600)' : 'var(--text-2)' }}
          >
            Todas as marcas
          </button>
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => choose(brand)}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: selectedBrand?.id === brand.id ? 'var(--brand-600)' : 'var(--text-1)' }}
            >
              <img
                src={getIcon(brand)}
                alt={brand.name}
                className="w-5 h-5 rounded object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {brand.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Logo area: mostra logo da marca selecionada (admin) ou logo LogaMe padrão */
function SidebarLogo() {
  const { selectedBrand } = useBrand();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const logoSrc = useBrandLogo(selectedBrand, 'logo');

  const isAdmin = user?.role === 'admin';

  return (
    <div className="px-4 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2.5 min-w-0">
        {isAdmin && selectedBrand && logoSrc ? (
          <img
            src={logoSrc}
            alt={selectedBrand.name}
            className="h-8 w-auto max-w-[120px] object-contain"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <img
            src="/logos/Logo-Logame.png"
            alt="LogaMe"
            className="h-8 w-auto max-w-[130px] object-contain"
          />
        )}
      </div>
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--surface-3)] shrink-0"
        style={{ color: 'var(--text-3)' }}
        title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="w-56 flex flex-col shrink-0 transition-colors"
        style={{
          background: 'var(--surface-1)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <SidebarLogo />

        {/* Filtro de marca (apenas admin) */}
        {user?.role === 'admin' && <BrandSelector />}

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5">
          {NAV_ITEMS_COMMON.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? 'nav-active' : 'hover:bg-[var(--surface-3)]'
                }`
              }
              style={({ isActive }) =>
                isActive ? {} : { color: 'var(--text-2)' }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} style={{ opacity: isActive ? 1 : 0.65 }} />
                  {label}
                </>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div
                className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-3)' }}
              >
                Admin
              </div>
              {NAV_ITEMS_ADMIN.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive ? 'nav-active' : 'hover:bg-[var(--surface-3)]'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? {} : { color: 'var(--text-2)' }
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} style={{ opacity: isActive ? 1 : 0.65 }} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="px-2.5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <NavLink
            to="/profile"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1 transition-all duration-150"
            style={({ isActive }) => ({
              background: isActive ? 'var(--brand-50)' : 'var(--surface-2)',
              border: isActive ? '1px solid var(--brand-200)' : '1px solid transparent',
            })}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{
                  background: 'var(--grad-brand)',
                  boxShadow: '0 2px 8px rgb(79 70 229 / 0.35)',
                }}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: 'var(--text-1)' }}>
                {user?.name}
              </p>
              <p className="text-[11px] truncate leading-tight capitalize" style={{ color: 'var(--text-3)' }}>
                {user?.position ?? user?.role}
              </p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgb(254 242 242)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-3)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background LogaMe com overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/logos/background-logame.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
        {/* Overlay escuro + blur para não atrapalhar o conteúdo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--bg-overlay, rgba(8, 11, 16, 0.88))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 1,
          }}
        />
        <main className="flex-1 overflow-x-auto overflow-y-auto relative" style={{ zIndex: 2 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
