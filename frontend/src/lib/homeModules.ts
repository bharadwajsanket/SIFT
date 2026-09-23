export type HomeZone = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';

export type ModuleId = 'clock' | 'weather' | 'recentSearches' | 'shortcuts';

export interface SiftShortcutItem {
  id: string;
  label: string;
  url: string;
}

export interface SiftHomeConfig {
  version: number;
  modules: {
    clock: {
      enabled: boolean;
      zone: HomeZone;
      showSeconds: boolean;
      showDate: boolean;
      timezone: string; // 'local' or IANA timezone e.g. 'America/New_York', 'Asia/Kolkata', 'Europe/London'
      hourFormat: '12h' | '24h';
    };
    weather: {
      enabled: boolean;
      zone: HomeZone;
      unit: 'c' | 'f';
      city: string; // empty for auto/local estimate, or custom city name e.g. 'San Francisco', 'London', 'Tokyo'
    };
    recentSearches: {
      enabled: boolean;
      zone: HomeZone;
      maxItems: number;
    };
    shortcuts: {
      enabled: boolean;
      zone: HomeZone;
      items: SiftShortcutItem[];
    };
  };
}

export const HOME_CONFIG_VERSION = 1;
export const HOME_STORAGE_KEY = 'sift_home_config_v1';

export const DEFAULT_SHORTCUTS: SiftShortcutItem[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com' },
  { id: 'hn', label: 'Hacker News', url: 'https://news.ycombinator.com' },
  { id: 'wiki', label: 'Wikipedia', url: 'https://wikipedia.org' },
  { id: 'arxiv', label: 'arXiv', url: 'https://arxiv.org' },
];

export const DEFAULT_HOME_CONFIG: SiftHomeConfig = {
  version: HOME_CONFIG_VERSION,
  modules: {
    clock: {
      enabled: true,
      zone: 'top-left',
      showSeconds: false,
      showDate: true,
      timezone: 'local',
      hourFormat: '24h',
    },
    weather: {
      enabled: true,
      zone: 'top-right',
      unit: 'c',
      city: '',
    },
    recentSearches: {
      enabled: false,
      zone: 'bottom-left',
      maxItems: 5,
    },
    shortcuts: {
      enabled: false,
      zone: 'none',
      items: DEFAULT_SHORTCUTS,
    },
  },
};

const VALID_ZONES: HomeZone[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'none'];

/**
 * Validate and safely sanitize Home Modules configuration
 */
export function sanitizeHomeConfig(raw: any): SiftHomeConfig {
  if (!raw || typeof raw !== 'object' || !raw.modules) {
    return { ...DEFAULT_HOME_CONFIG };
  }

  const rawMods = raw.modules || {};

  const sanitizeZone = (zone: any, defaultZone: HomeZone): HomeZone => {
    return VALID_ZONES.includes(zone) ? zone : defaultZone;
  };

  const sanitizeShortcuts = (items: any): SiftShortcutItem[] => {
    if (!Array.isArray(items)) return DEFAULT_SHORTCUTS;
    return items
      .filter((item) => item && typeof item.label === 'string' && typeof item.url === 'string')
      .map((item) => ({
        id: String(item.id || Date.now() + Math.random().toString(36).substring(2, 6)),
        label: String(item.label).trim().slice(0, 30),
        url: String(item.url).trim(),
      }))
      .slice(0, 12);
  };

  return {
    version: HOME_CONFIG_VERSION,
    modules: {
      clock: {
        enabled: typeof rawMods.clock?.enabled === 'boolean' ? rawMods.clock.enabled : DEFAULT_HOME_CONFIG.modules.clock.enabled,
        zone: sanitizeZone(rawMods.clock?.zone, DEFAULT_HOME_CONFIG.modules.clock.zone),
        showSeconds: Boolean(rawMods.clock?.showSeconds),
        showDate: typeof rawMods.clock?.showDate === 'boolean' ? rawMods.clock.showDate : true,
        timezone: typeof rawMods.clock?.timezone === 'string' ? rawMods.clock.timezone : 'local',
        hourFormat: rawMods.clock?.hourFormat === '12h' ? '12h' : '24h',
      },
      weather: {
        enabled: typeof rawMods.weather?.enabled === 'boolean' ? rawMods.weather.enabled : DEFAULT_HOME_CONFIG.modules.weather.enabled,
        zone: sanitizeZone(rawMods.weather?.zone, DEFAULT_HOME_CONFIG.modules.weather.zone),
        unit: rawMods.weather?.unit === 'f' ? 'f' : 'c',
        city: typeof rawMods.weather?.city === 'string' ? rawMods.weather.city.trim() : '',
      },
      recentSearches: {
        enabled: typeof rawMods.recentSearches?.enabled === 'boolean' ? rawMods.recentSearches.enabled : DEFAULT_HOME_CONFIG.modules.recentSearches.enabled,
        zone: sanitizeZone(rawMods.recentSearches?.zone, DEFAULT_HOME_CONFIG.modules.recentSearches.zone),
        maxItems: typeof rawMods.recentSearches?.maxItems === 'number' ? Math.min(Math.max(rawMods.recentSearches.maxItems, 1), 8) : 5,
      },
      shortcuts: {
        enabled: typeof rawMods.shortcuts?.enabled === 'boolean' ? rawMods.shortcuts.enabled : DEFAULT_HOME_CONFIG.modules.shortcuts.enabled,
        zone: sanitizeZone(rawMods.shortcuts?.zone, DEFAULT_HOME_CONFIG.modules.shortcuts.zone),
        items: sanitizeShortcuts(rawMods.shortcuts?.items),
      },
    },
  };
}

/**
 * Load Home Config from LocalStorage
 */
export function loadHomeConfig(): SiftHomeConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_HOME_CONFIG };
  try {
    const stored = localStorage.getItem(HOME_STORAGE_KEY);
    if (stored) {
      return sanitizeHomeConfig(JSON.parse(stored));
    }
  } catch (e) {
    console.warn('Failed to parse home config from localStorage:', e);
  }
  return { ...DEFAULT_HOME_CONFIG };
}

/**
 * Save Home Config to LocalStorage
 */
export function saveHomeConfig(config: SiftHomeConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save home config to localStorage:', e);
  }
}
