export type ThemeMode = 'dark' | 'light' | 'system';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';
export type MotionMode = 'full' | 'reduced' | 'off';
export type WallpaperSource = 'official' | 'upload' | 'url';
export type AccentMode = 'auto' | 'manual';

export interface SiftWallpaper {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  thumbnail: string;
  defaultAccent: string;
}

export const OFFICIAL_WALLPAPERS: SiftWallpaper[] = [
  {
    id: 'mountain',
    title: 'Alpine Moon',
    subtitle: 'Midnight Violet Mist',
    url: '/wallpapers/sift-mountain.jpg',
    thumbnail: '/wallpapers/sift-mountain.jpg',
    defaultAccent: '#a78bfa', // Lavender
  },
  {
    id: 'mist',
    title: 'Midnight Mist',
    subtitle: 'Nebula Lake Reflection',
    url: '/wallpapers/sift-mist.jpg',
    thumbnail: '/wallpapers/sift-mist.jpg',
    defaultAccent: '#c084fc', // Violet
  },
  {
    id: 'obsidian',
    title: 'Obsidian Peaks',
    subtitle: 'Cloud Inversion & Stars',
    url: '/wallpapers/sift-obsidian.jpg',
    thumbnail: '/wallpapers/sift-obsidian.jpg',
    defaultAccent: '#818cf8', // Indigo
  },
  {
    id: 'twilight',
    title: 'Twilight Ridge',
    subtitle: 'Lavender Gradient Valley',
    url: '/wallpapers/sift-twilight.jpg',
    thumbnail: '/wallpapers/sift-twilight.jpg',
    defaultAccent: '#f472b6', // Twilight Rose
  },
  {
    id: 'celestial',
    title: 'Celestial Horizon',
    subtitle: 'Deep Night & Aurora',
    url: '/wallpapers/sift-celestial.jpg',
    thumbnail: '/wallpapers/sift-celestial.jpg',
    defaultAccent: '#38bdf8', // Cyan Aurora
  },
];

export interface CuratedAccent {
  id: string;
  label: string;
  hex: string;
}

export const CURATED_ACCENTS: CuratedAccent[] = [
  { id: 'lavender', label: 'Lavender', hex: '#a78bfa' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { id: 'blue', label: 'Blue', hex: '#3b82f6' },
  { id: 'cyan', label: 'Cyan', hex: '#38bdf8' },
  { id: 'teal', label: 'Teal', hex: '#14b8a6' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'pink', label: 'Pink', hex: '#ec4899' },
  { id: 'purple', label: 'Purple', hex: '#a855f7' },
  { id: 'slate', label: 'Slate', hex: '#94a3b8' },
  { id: 'silver', label: 'Silver', hex: '#e2e8f0' },
];

export interface SiftAppearanceConfig {
  version: number;
  theme: ThemeMode;
  density: DensityMode;
  motion: MotionMode;
  
  // Wallpaper
  wallpaperSource: WallpaperSource;
  wallpaperId: string;
  wallpaperCustomUrl: string;
  hasUploadedWallpaper: boolean;
  
  wallpaperOpacity: number; // 0.1 to 1.0 (default 0.92)
  wallpaperBlur: number; // 0 to 24 (px, default 0)
  overlayDarkness: number; // 0.1 to 0.9 (default 0.45)
  wallpaperPosition: string; // 'center 30%', 'center top', 'center center', 'center bottom'
  wallpaperScale: number; // 1.0 to 1.3 (default 1.0)
  
  // Glass material
  glassOpacity: number; // 0.2 to 0.95 (default 0.58)
  glassBlur: number; // 0 to 36 (px, default 20)
  borderIntensity: number; // 0.2 to 2.0 (multiplier, default 1.0)
  glassSaturation: number; // 100 to 180 (%, default 100)
  
  // Accent
  accentMode: AccentMode;
  accentColor: string;
}

export const APPEARANCE_CONFIG_VERSION = 1;
export const APPEARANCE_STORAGE_KEY = 'sift_appearance_v1';

export const DEFAULT_APPEARANCE_CONFIG: SiftAppearanceConfig = {
  version: APPEARANCE_CONFIG_VERSION,
  theme: 'dark',
  density: 'comfortable',
  motion: 'full',
  
  wallpaperSource: 'official',
  wallpaperId: 'mountain',
  wallpaperCustomUrl: '',
  hasUploadedWallpaper: false,
  
  wallpaperOpacity: 0.92,
  wallpaperBlur: 0,
  overlayDarkness: 0.45,
  wallpaperPosition: 'center 30%',
  wallpaperScale: 1.0,
  
  glassOpacity: 0.58,
  glassBlur: 20,
  borderIntensity: 1.0,
  glassSaturation: 100,
  
  accentMode: 'auto',
  accentColor: '#a78bfa',
};

function clamp(val: number, min: number, max: number): number {
  if (isNaN(val)) return min;
  return Math.min(Math.max(val, min), max);
}

/**
 * Validate and safely sanitize an appearance configuration object
 */
export function sanitizeAppearanceConfig(raw: any): SiftAppearanceConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_APPEARANCE_CONFIG };
  }

  const theme: ThemeMode = ['dark', 'light', 'system'].includes(raw.theme) ? raw.theme : DEFAULT_APPEARANCE_CONFIG.theme;
  const density: DensityMode = ['compact', 'comfortable', 'spacious'].includes(raw.density) ? raw.density : DEFAULT_APPEARANCE_CONFIG.density;
  const motion: MotionMode = ['full', 'reduced', 'off'].includes(raw.motion) ? raw.motion : DEFAULT_APPEARANCE_CONFIG.motion;
  const wallpaperSource: WallpaperSource = ['official', 'upload', 'url'].includes(raw.wallpaperSource) ? raw.wallpaperSource : DEFAULT_APPEARANCE_CONFIG.wallpaperSource;
  const accentMode: AccentMode = ['auto', 'manual'].includes(raw.accentMode) ? raw.accentMode : DEFAULT_APPEARANCE_CONFIG.accentMode;

  const validOfficialIds = OFFICIAL_WALLPAPERS.map((w) => w.id);
  const wallpaperId = validOfficialIds.includes(raw.wallpaperId) ? raw.wallpaperId : DEFAULT_APPEARANCE_CONFIG.wallpaperId;

  return {
    version: APPEARANCE_CONFIG_VERSION,
    theme,
    density,
    motion,
    wallpaperSource,
    wallpaperId,
    wallpaperCustomUrl: typeof raw.wallpaperCustomUrl === 'string' ? raw.wallpaperCustomUrl : '',
    hasUploadedWallpaper: Boolean(raw.hasUploadedWallpaper),
    
    wallpaperOpacity: clamp(Number(raw.wallpaperOpacity ?? DEFAULT_APPEARANCE_CONFIG.wallpaperOpacity), 0.1, 1.0),
    wallpaperBlur: clamp(Number(raw.wallpaperBlur ?? DEFAULT_APPEARANCE_CONFIG.wallpaperBlur), 0, 24),
    overlayDarkness: clamp(Number(raw.overlayDarkness ?? DEFAULT_APPEARANCE_CONFIG.overlayDarkness), 0.1, 0.9),
    wallpaperPosition: typeof raw.wallpaperPosition === 'string' ? raw.wallpaperPosition : DEFAULT_APPEARANCE_CONFIG.wallpaperPosition,
    wallpaperScale: clamp(Number(raw.wallpaperScale ?? DEFAULT_APPEARANCE_CONFIG.wallpaperScale), 1.0, 1.3),
    
    glassOpacity: clamp(Number(raw.glassOpacity ?? DEFAULT_APPEARANCE_CONFIG.glassOpacity), 0.2, 0.95),
    glassBlur: clamp(Number(raw.glassBlur ?? DEFAULT_APPEARANCE_CONFIG.glassBlur), 0, 36),
    borderIntensity: clamp(Number(raw.borderIntensity ?? DEFAULT_APPEARANCE_CONFIG.borderIntensity), 0.2, 2.0),
    glassSaturation: clamp(Number(raw.glassSaturation ?? DEFAULT_APPEARANCE_CONFIG.glassSaturation), 100, 180),
    
    accentMode,
    accentColor: typeof raw.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.accentColor) ? raw.accentColor : DEFAULT_APPEARANCE_CONFIG.accentColor,
  };
}

/**
 * Resolves the effective wallpaper URL and accent color
 */
export function resolveAppearanceState(
  config: SiftAppearanceConfig,
  uploadedUrl: string | null
): { wallpaperUrl: string; accentColor: string } {
  let wallpaperUrl = OFFICIAL_WALLPAPERS[0].url;
  let autoAccent = OFFICIAL_WALLPAPERS[0].defaultAccent;

  if (config.wallpaperSource === 'upload' && uploadedUrl) {
    wallpaperUrl = uploadedUrl;
    autoAccent = '#a78bfa';
  } else if (config.wallpaperSource === 'url' && config.wallpaperCustomUrl.trim()) {
    wallpaperUrl = config.wallpaperCustomUrl.trim();
    autoAccent = '#a78bfa';
  } else {
    const found = OFFICIAL_WALLPAPERS.find((w) => w.id === config.wallpaperId);
    if (found) {
      wallpaperUrl = found.url;
      autoAccent = found.defaultAccent;
    }
  }

  const accentColor = config.accentMode === 'auto' ? autoAccent : config.accentColor;

  return { wallpaperUrl, accentColor };
}

/**
 * Apply CSS custom properties and data attributes directly to the document element
 */
export function applyAppearanceToDOM(
  config: SiftAppearanceConfig,
  wallpaperUrl: string,
  accentColor: string
) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Resolve Theme
  let effectiveTheme = config.theme;
  if (config.theme === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = isDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', effectiveTheme);
  root.setAttribute('data-density', config.density);
  root.setAttribute('data-motion', config.motion);

  // Set Wallpaper Tokens
  root.style.setProperty('--bg-wallpaper', `url('${wallpaperUrl}')`);
  root.style.setProperty('--bg-wallpaper-opacity', `${config.wallpaperOpacity}`);
  root.style.setProperty('--bg-wallpaper-blur', `${config.wallpaperBlur}px`);
  root.style.setProperty('--bg-wallpaper-scale', `${config.wallpaperScale}`);
  root.style.setProperty('--bg-wallpaper-position', config.wallpaperPosition);

  // Overlay Darkness
  const darkVal = config.overlayDarkness;
  root.style.setProperty('--overlay-scrim', `rgba(8, 7, 15, ${darkVal})`);
  root.style.setProperty(
    '--overlay-gradient',
    `linear-gradient(180deg, rgba(9, 10, 16, ${Math.max(0, darkVal - 0.2)}) 0%, rgba(9, 10, 16, ${darkVal}) 45%, rgba(8, 7, 15, ${Math.min(1, darkVal + 0.35)}) 100%)`
  );

  // Glass Material Tokens
  if (effectiveTheme === 'dark') {
    root.style.setProperty('--glass-surface', `rgba(18, 16, 28, ${config.glassOpacity})`);
    root.style.setProperty('--glass-surface-hover', `rgba(26, 22, 40, ${Math.min(0.98, config.glassOpacity + 0.14)})`);
    root.style.setProperty('--glass-surface-active', `rgba(35, 30, 54, ${Math.min(1, config.glassOpacity + 0.24)})`);
    root.style.setProperty('--glass-border', `rgba(255, 255, 255, ${(0.08 * config.borderIntensity).toFixed(3)})`);
    root.style.setProperty('--glass-border-strong', `rgba(255, 255, 255, ${(0.14 * config.borderIntensity).toFixed(3)})`);
    root.style.setProperty('--glass-border-subtle', `rgba(255, 255, 255, ${(0.05 * config.borderIntensity).toFixed(3)})`);
  } else {
    root.style.setProperty('--glass-surface', `rgba(255, 255, 255, ${Math.min(0.95, config.glassOpacity + 0.2)})`);
    root.style.setProperty('--glass-surface-hover', `rgba(255, 255, 255, ${Math.min(1, config.glassOpacity + 0.3)})`);
    root.style.setProperty('--glass-surface-active', `#ffffff`);
    root.style.setProperty('--glass-border', `rgba(0, 0, 0, ${(0.08 * config.borderIntensity).toFixed(3)})`);
    root.style.setProperty('--glass-border-strong', `rgba(0, 0, 0, ${(0.14 * config.borderIntensity).toFixed(3)})`);
    root.style.setProperty('--glass-border-subtle', `rgba(0, 0, 0, ${(0.04 * config.borderIntensity).toFixed(3)})`);
  }

  root.style.setProperty('--glass-blur', `${config.glassBlur}px`);
  root.style.setProperty('--glass-border-focus', `${accentColor}88`);

  // Accent Tokens
  root.style.setProperty('--accent', accentColor);
  root.style.setProperty('--accent-surface', `${accentColor}1f`);
  root.style.setProperty('--accent-border', `${accentColor}47`);
  root.style.setProperty('--accent-glow', `${accentColor}40`);
}
