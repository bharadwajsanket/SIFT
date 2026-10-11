'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiftLogo } from '@/components/SiftLogo';
import { 
  SearchIcon, 
  SettingsIcon, 
  CloseIcon, 
  ClockIcon,
  GlobeIcon, 
  ImageIcon, 
  VideoIcon, 
  NewsIcon, 
  CodeIcon, 
  AcademicIcon, 
  MapIcon
} from '@/components/icons';
import { SettingsPanel } from '@/components/SettingsPanel';
import { 
  SiftHomeConfig, 
  DEFAULT_HOME_CONFIG, 
  loadHomeConfig, 
  saveHomeConfig, 
  HomeZone 
} from '@/lib/homeModules';
import { HomeClock } from '@/components/home/HomeClock';
import { HomeWeather } from '@/components/home/HomeWeather';
import { HomeRecentSearches } from '@/components/home/HomeRecentSearches';
import { HomeShortcuts } from '@/components/home/HomeShortcuts';
import { evaluateCalculatorExpression, isCalculatorQuery } from '@/lib/calculator';
import { CalculatorPreview } from '@/components/CalculatorPreview';
import { recordSearch } from '@/lib/searchHistory';
import styles from './page.module.css';

const CATEGORIES = [
  { id: 'all', label: 'Web', icon: GlobeIcon },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: VideoIcon },
  { id: 'news', label: 'News', icon: NewsIcon },
  { id: 'code', label: 'Code', icon: CodeIcon },
  { id: 'academic', label: 'Academic', icon: AcademicIcon },
  { id: 'maps', label: 'Maps', icon: MapIcon },
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [homeConfig, setHomeConfig] = useState<SiftHomeConfig>(DEFAULT_HOME_CONFIG);
  const [isPending, startTransition] = useTransition();
  const [isCopied, setIsCopied] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Evaluate inline calculator expression locally (zero network requests)
  const calculatorResult = useMemo(() => evaluateCalculatorExpression(query), [query]);

  // Load home modules config
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHomeConfig(loadHomeConfig());
    }

    const handleConfigUpdate = (e: any) => {
      if (e.detail) {
        setHomeConfig(e.detail);
      }
    };

    window.addEventListener('sift-home-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('sift-home-config-updated', handleConfigUpdate);
  }, []);

  // Global keyboard shortcut listener for '⌘K', 'Ctrl+K', '/', and 'Escape'
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) ||
        (e.key === '/' && document.activeElement !== searchInputRef.current)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce (bypassed if calculator query is detected)
  useEffect(() => {
    const fetchPredictions = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const isEnabled = typeof window !== 'undefined' && localStorage.getItem('sift-autocomplete') !== 'false';
      if (!isEnabled || !query.trim() || isCalculatorQuery(query)) {
        setSuggestions([]);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setSuggestions(list.slice(0, 6));
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Autocomplete error:', err);
        }
      }
    };

    const timer = setTimeout(fetchPredictions, 100);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const executeSearch = (searchQuery: string, catId?: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const effectiveCategory = catId || selectedCategory;
    recordSearch(trimmed, effectiveCategory);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}&category=${effectiveCategory}`);
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (calculatorResult) {
        // Shift+Enter explicitly executes ordinary web search
        if (e.shiftKey) {
          setShowSuggestions(false);
          executeSearch(query);
          return;
        }
        // Normal Enter copies calculation result and prevents web request
        e.preventDefault();
        setIsCopied(true);
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(calculatorResult.formattedResult).catch(() => {});
        }
        return;
      }
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[activeSuggestion];
        setQuery(selected);
        setShowSuggestions(false);
        executeSearch(selected);
      }
    } else if (e.key === 'ArrowDown') {
      if (!calculatorResult) {
        e.preventDefault();
        setShowSuggestions(true);
        setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      if (!calculatorResult) {
        e.preventDefault();
        setShowSuggestions(true);
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  // Dismiss module handler: hides module while preserving all preferences
  const dismissModule = useCallback((moduleId: 'clock' | 'weather' | 'recentSearches' | 'shortcuts') => {
    setHomeConfig((prev) => {
      const updated: SiftHomeConfig = {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleId]: {
            ...prev.modules[moduleId],
            enabled: false,
          },
        },
      };
      saveHomeConfig(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sift-home-config-updated', { detail: updated }));
      }
      return updated;
    });
  }, []);

  // Helper to render individual modules by ID
  const renderModule = (moduleId: string) => {
    switch (moduleId) {
      case 'clock':
        return (
          <HomeClock
            key="clock"
            showDate={homeConfig.modules.clock.showDate}
            showSeconds={homeConfig.modules.clock.showSeconds}
            timezone={homeConfig.modules.clock.timezone}
            hourFormat={homeConfig.modules.clock.hourFormat}
            onDismiss={() => dismissModule('clock')}
          />
        );
      case 'weather':
        return (
          <HomeWeather
            key="weather"
            unit={homeConfig.modules.weather.unit}
            city={homeConfig.modules.weather.city}
            onDismiss={() => dismissModule('weather')}
          />
        );
      case 'recentSearches':
        return (
          <HomeRecentSearches
            key="recentSearches"
            onSelectSearch={(item, cat) => {
              setQuery(item);
              executeSearch(item, cat);
            }}
            onDismiss={() => dismissModule('recentSearches')}
            maxItems={homeConfig.modules.recentSearches.maxItems}
          />
        );
      case 'shortcuts':
        return <HomeShortcuts key="shortcuts" items={homeConfig.modules.shortcuts.items} />;
      default:
        return null;
    }
  };

  // Helper to extract modules assigned to a specific spatial zone
  const getZoneModules = (zone: HomeZone) => {
    const result: string[] = [];
    (Object.keys(homeConfig.modules) as Array<keyof typeof homeConfig.modules>).forEach((modKey) => {
      const mod = homeConfig.modules[modKey];
      if (mod.enabled && mod.zone === zone) {
        result.push(modKey);
      }
    });
    return result;
  };

  const topLeftMods = getZoneModules('top-left');
  const topRightMods = getZoneModules('top-right');
  const bottomLeftMods = getZoneModules('bottom-left');
  const bottomRightMods = getZoneModules('bottom-right');

  // Mobile dedicated ambient capsule: Clock & Weather in a single sleek horizontal pill
  const isClockEnabled = homeConfig.modules.clock.enabled;
  const isWeatherEnabled = homeConfig.modules.weather.enabled;
  const hasMobileTopPill = isClockEnabled || isWeatherEnabled;

  const mobileBottomMods: string[] = [];
  if (homeConfig.modules.shortcuts.enabled) mobileBottomMods.push('shortcuts');
  if (homeConfig.modules.recentSearches.enabled) mobileBottomMods.push('recentSearches');

  return (
    <div className={styles.pageContainer}>
      {/* Top Bar with Brand & Settings Toggle */}
      <header className={styles.topBar}>
        <div className={styles.topBrand}>
          <span className={styles.brandTitle}>SIFT</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/history"
            className={styles.settingsIconBtn}
            title="Search History"
            aria-label="Open search history"
          >
            <ClockIcon size={17} />
          </Link>
          <button 
            type="button" 
            className={styles.settingsIconBtn} 
            onClick={() => setIsSettingsOpen(true)}
            title="Preferences & Settings"
            aria-label="Open settings"
          >
            <SettingsIcon size={17} />
          </button>
        </div>
      </header>

      {/* Spatial Canvas Container (Desktop Corner Anchors + Responsive Flow) */}
      <div className={styles.spatialCanvas}>
        
        {/* Top-Left Peripheral Zone (Desktop) */}
        {topLeftMods.length > 0 && (
          <aside className={`${styles.spatialZone} ${styles.zoneTopLeft}`} aria-label="Top Left Module Zone">
            {topLeftMods.map(renderModule)}
          </aside>
        )}

        {/* Top-Right Peripheral Zone (Desktop) */}
        {topRightMods.length > 0 && (
          <aside className={`${styles.spatialZone} ${styles.zoneTopRight}`} aria-label="Top Right Module Zone">
            {topRightMods.map(renderModule)}
          </aside>
        )}

        {/* Central Search Epicenter */}
        <main className={styles.mainSection}>

          {/* Mobile Top Ambient Capsule (Single Horizontal Line Pill for Clock & Weather) */}
          {hasMobileTopPill && (
            <div className={styles.mobileAmbientCapsuleRow}>
              <div className={styles.ambientCapsule}>
                {isClockEnabled && (
                  <HomeClock
                    showDate={homeConfig.modules.clock.showDate}
                    showSeconds={false}
                    timezone={homeConfig.modules.clock.timezone}
                    hourFormat={homeConfig.modules.clock.hourFormat}
                    compact
                    onDismiss={() => dismissModule('clock')}
                  />
                )}
                {isClockEnabled && isWeatherEnabled && (
                  <span className={styles.ambientPillDivider}>•</span>
                )}
                {isWeatherEnabled && (
                  <HomeWeather
                    unit={homeConfig.modules.weather.unit}
                    city={homeConfig.modules.weather.city}
                    compact
                    onDismiss={() => dismissModule('weather')}
                  />
                )}
              </div>
            </div>
          )}

          <div className={styles.heroBrand}>
            <div className={styles.logoWrapper}>
              <SiftLogo 
                markSize={52} 
                orientation="vertical" 
                showTagline 
                variant="lavender" 
              />
            </div>
          </div>

          <div className={styles.searchBox} ref={searchBoxRef}>
            <form 
              className={styles.searchForm}
              onSubmit={(e) => {
                e.preventDefault();
                if (calculatorResult) {
                  setIsCopied(true);
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(calculatorResult.formattedResult).catch(() => {});
                  }
                  return;
                }
                executeSearch(query);
              }}
            >
              <div className={`${styles.inputGroup} ${calculatorResult ? styles.inputGroupActiveCalc : ''}`}>
                <SearchIcon size={18} className={styles.searchIcon} />
                
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.mainInput}
                  placeholder="Search anything..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestion(-1);
                  }}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />

                {query && (
                  <button 
                    type="button" 
                    className={styles.clearBtn}
                    onClick={() => {
                      setQuery('');
                      setSuggestions([]);
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search query"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}

                <div className={styles.keyboardHint} aria-hidden="true">
                  <span>⌘K</span>
                </div>

                <button 
                  type="submit" 
                  className={styles.searchSubmitAction}
                  disabled={isPending}
                  aria-label="Execute search"
                  onClick={() => {
                    if (calculatorResult) {
                      executeSearch(query);
                    }
                  }}
                >
                  <SearchIcon size={16} />
                </button>
              </div>
            </form>

            {calculatorResult && (
              <CalculatorPreview
                calculation={calculatorResult}
                onWebSearch={(q) => executeSearch(q)}
                isCopied={isCopied}
                onCopySuccess={() => setIsCopied(true)}
              />
            )}

            {!calculatorResult && showSuggestions && suggestions.length > 0 && (
              <ul className={styles.suggestionsDropdown} role="listbox">
                {suggestions.map((item, idx) => (
                  <li
                    key={item}
                    role="option"
                    aria-selected={idx === activeSuggestion}
                    className={`${styles.suggestionRow} ${idx === activeSuggestion ? styles.suggestionRowActive : ''}`}
                    onClick={() => {
                      setQuery(item);
                      setShowSuggestions(false);
                      executeSearch(item);
                    }}
                  >
                    <SearchIcon size={14} className={styles.suggestionIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav className={styles.categoryNav} aria-label="Search categories">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (query.trim()) {
                      executeSearch(query, cat.id);
                    }
                  }}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Bottom Widgets (Shortcuts & Recent Searches) */}
          {mobileBottomMods.length > 0 && (
            <div className={styles.mobileBottomWidgets}>
              {mobileBottomMods.map(renderModule)}
            </div>
          )}
        </main>

        {/* Bottom-Left Peripheral Zone (Desktop) */}
        {bottomLeftMods.length > 0 && (
          <aside className={`${styles.spatialZone} ${styles.zoneBottomLeft}`} aria-label="Bottom Left Module Zone">
            {bottomLeftMods.map(renderModule)}
          </aside>
        )}

        {/* Bottom-Right Peripheral Zone (Desktop) */}
        {bottomRightMods.length > 0 && (
          <aside className={`${styles.spatialZone} ${styles.zoneBottomRight}`} aria-label="Bottom Right Module Zone">
            {bottomRightMods.map(renderModule)}
          </aside>
        )}

      </div>

      {/* Subtle Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span>SIFT</span>
        </div>
        <div className={styles.footerLinks}>
          <span className={styles.footerShortcutHint}>Press <kbd>/</kbd> or <kbd>⌘K</kbd> to search</span>
        </div>
      </footer>

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
