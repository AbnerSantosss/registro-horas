import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandOption {
  id: string;
  label: string;
  logo: {
    light: string; // logo para tema claro
    dark: string;  // logo para tema escuro
  };
  icon: {
    light: string;
    dark: string;
  };
}

export const ADMIN_BRANDS: BrandOption[] = [
  {
    id: 'geralbet',
    label: 'Geralbet',
    logo: {
      light: '/logos/geralbet-azul.png',
      dark: '/logos/geralbet-branca.png',
    },
    icon: {
      light: '/logos/icon_geralbet_azul.png',
      dark: '/logos/icon_geralbet_branco.png',
    },
  },
  {
    id: 'liderbet',
    label: 'Liderbet',
    logo: {
      light: '/logos/liderbet-preto.png',
      dark: '/logos/liderbet-branco.png',
    },
    icon: {
      light: '/logos/icon_liderbet_preto.png',
      dark: '/logos/icon_liderbet_branco.png',
    },
  },
];

// Marcas disponíveis no modal de criação de tarefa
export const TASK_BRANDS = ['Geralbet', 'Liderbet'];

/* ── Brand color palettes ────────────────────────── */
const BRAND_PALETTES: Record<string, Record<string, string>> = {
  /* LogaMe — paleta padrão do sistema (vermelho + preto) */
  logame: {
    '--brand-50':  '#fef2f2',
    '--brand-100': '#fee2e2',
    '--brand-200': '#fecaca',
    '--brand-300': '#fca5a5',
    '--brand-400': '#f87171',
    '--brand-500': '#e63232',
    '--brand-600': '#c02020',
    '--brand-700': '#a31b1b',
    '--brand-800': '#7f1d1d',
    '--accent-400': '#fb923c',
    '--accent-500': '#f97316',
    '--accent-600': '#ea580c',
    '--shadow-brand': '0 4px 16px rgb(230 50 50 / 0.35)',
    '--grad-brand':  'linear-gradient(135deg, #e63232 0%, #c02020 100%)',
  },
  geralbet: {
    '--brand-50':  '#eef2ff',
    '--brand-100': '#e0e7ff',
    '--brand-200': '#c7d2fe',
    '--brand-300': '#a5b4fc',
    '--brand-400': '#818cf8',
    '--brand-500': '#6366f1',
    '--brand-600': '#4f46e5',
    '--brand-700': '#4338ca',
    '--brand-800': '#3730a3',
    '--accent-400': '#a78bfa',
    '--accent-500': '#8b5cf6',
    '--accent-600': '#7c3aed',
    '--shadow-brand': '0 4px 16px rgb(79 70 229 / 0.35)',
    '--grad-brand':  'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
  },
  liderbet: {
    '--brand-50':  '#fff5f4',
    '--brand-100': '#ffe0de',
    '--brand-200': '#ffc2bd',
    '--brand-300': '#ff938b',
    '--brand-400': '#f5594e',
    '--brand-500': '#E03326',
    '--brand-600': '#c82a1f',
    '--brand-700': '#a82219',
    '--brand-800': '#8a1c14',
    '--accent-400': '#22d3ee',
    '--accent-500': '#06b6d4',
    '--accent-600': '#0891b2',
    '--shadow-brand': '0 4px 16px rgb(224 51 38 / 0.40)',
    '--grad-brand':  'linear-gradient(135deg, #E03326 0%, #06b6d4 100%)',
  },
};

const CSS_VAR_KEYS = Object.keys(BRAND_PALETTES.logame);

interface BrandContextType {
  selectedBrand: BrandOption | null;
  setSelectedBrand: (brand: BrandOption | null) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBrand, setSelectedBrand] = useState<BrandOption | null>(null);

  /* Inject CSS variables whenever the active brand changes */
  useEffect(() => {
    const root = document.documentElement;
    const palette = BRAND_PALETTES[selectedBrand?.id ?? 'logame'];

    CSS_VAR_KEYS.forEach(key => {
      root.style.setProperty(key, palette[key]);
    });

    // data-brand attribute for targeted CSS rules
    root.setAttribute('data-brand', selectedBrand?.id ?? 'logame');
  }, [selectedBrand]);

  return (
    <BrandContext.Provider value={{ selectedBrand, setSelectedBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be inside BrandProvider');
  return ctx;
};
