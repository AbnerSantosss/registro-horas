import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface BrandOption {
  id: string;
  name: string;
  color: string;
  logoUrl: string | null;
  iconUrl: string | null;
}

/* ── Brand color palettes ────────────────────────── */
const BRAND_PALETTES: Record<string, Record<string, string>> = {
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
  certeiro: {
    '--brand-50':  '#fefce8',
    '--brand-100': '#fef9c3',
    '--brand-200': '#fef08a',
    '--brand-300': '#fde047',
    '--brand-400': '#facc15',
    '--brand-500': '#fac302',
    '--brand-600': '#ca8a04',
    '--brand-700': '#a16207',
    '--brand-800': '#854d0e',
    '--accent-400': '#10b981',
    '--accent-500': '#059669',
    '--accent-600': '#047857',
    '--shadow-brand': '0 4px 16px rgb(250 195 2 / 0.40)',
    '--grad-brand':  'linear-gradient(135deg, #fac302 0%, #facc15 100%)',
  }
};

const CSS_VAR_KEYS = Object.keys(BRAND_PALETTES.logame);

// Hex to RGB to generate dynamic tints/shades
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Very basic generator for unknown custom brands that provides an approximated palette
function generatePaletteForBrand(baseColor: string): Record<string, string> {
  const [r, g, b] = hexToRgb(baseColor);
  return {
    '--brand-50':  `${baseColor}11`,
    '--brand-100': `${baseColor}22`,
    '--brand-200': `${baseColor}44`,
    '--brand-300': `${baseColor}66`,
    '--brand-400': `${baseColor}aa`,
    '--brand-500': baseColor,
    '--brand-600': `${baseColor}cc`,
    '--brand-700': `${baseColor}dd`,
    '--brand-800': `${baseColor}ee`,
    '--accent-400': '#fb923c',
    '--accent-500': '#f97316',
    '--accent-600': '#ea580c',
    '--shadow-brand': `0 4px 16px rgba(${r}, ${g}, ${b}, 0.35)`,
    '--grad-brand':  `linear-gradient(135deg, ${baseColor} 0%, ${baseColor} 100%)`,
  };
}

interface BrandContextType {
  brands: BrandOption[];
  selectedBrand: BrandOption | null;
  setSelectedBrand: (brand: BrandOption | null) => void;
  createBrand: (data: Partial<BrandOption>) => Promise<void>;
  updateBrand: (id: string, data: Partial<BrandOption>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandOption | null>(null);

  const fetchBrands = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/brands', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBrands(data);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchBrands();
  }, [token, fetchBrands]);

  const createBrand = async (data: Partial<BrandOption>) => {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) await fetchBrands();
  };

  const updateBrand = async (id: string, data: Partial<BrandOption>) => {
    const res = await fetch(`/api/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (res.ok) await fetchBrands();
  };

  const deleteBrand = async (id: string) => {
    const res = await fetch(`/api/brands/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) await fetchBrands();
  };

  /* Inject CSS variables whenever the active brand changes */
  useEffect(() => {
    const root = document.documentElement;
    const activeId = selectedBrand?.id ?? 'logame';
    
    let palette = BRAND_PALETTES[activeId];
    if (!palette) {
      // If brand doesn't have a hardcoded palette but has a color in DB
      palette = selectedBrand?.color ? generatePaletteForBrand(selectedBrand.color) : BRAND_PALETTES['logame'];
    }

    CSS_VAR_KEYS.forEach(key => {
      root.style.setProperty(key, palette[key]);
    });

    root.setAttribute('data-brand', activeId);
  }, [selectedBrand]);

  return (
    <BrandContext.Provider value={{ brands, selectedBrand, setSelectedBrand, createBrand, updateBrand, deleteBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be inside BrandProvider');
  return ctx;
};
