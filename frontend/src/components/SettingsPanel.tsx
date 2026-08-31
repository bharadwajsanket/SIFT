'use client';

import React, { useState, useEffect } from 'react';
import { CloseIcon, SunIcon, MoonIcon, ComputerIcon } from '@/components/icons';
import { MAP_PROVIDERS, DEFAULT_MAP_PROVIDER_ID } from '@/lib/mapProviders';
import styles from '@/app/page.module.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CURATED_ENGINES = {
  web: [
    { id: 'google', label: 'Google' },
    { id: 'brave', label: 'Brave' },
    { id: 'bing', label: 'Bing' },
    { id: 'duckduckgo', label: 'DuckDuckGo' },
    { id: 'wikipedia', label: 'Wikipedia' },
    { id: 'github', label: 'GitHub' },
  ],
  images: [
    { id: 'bing images', label: 'Bing Images' },
    { id: 'duckduckgo images', label: 'DuckDuckGo Images' },
    { id: 'google images', label: 'Google Images' },
  ],
  videos: [
    { id: 'bing videos', label: 'Bing Videos' },
    { id: 'duckduckgo videos', label: 'DuckDuckGo Videos' },
    { id: 'google videos', label: 'Google Videos' },
  ],
  news: [
    { id: 'bing news', label: 'Bing News' },
    { id: 'duckduckgo news', label: 'DuckDuckGo News' },
    { id: 'google news', label: 'Google News' },
  ],
  code: [
    { id: 'github', label: 'GitHub' },
    { id: 'gitlab', label: 'GitLab' },
    { id: 'sourcegraph', label: 'Sourcegraph' },
  ],
};

export const DEFAULT_ENABLED_ENGINES: Record<string, boolean> = {
  'google': true,
  'brave': true,
  'bing': true,
  'duckduckgo': true,
  'wikipedia': true,
  'github': true,
  'bing images': true,
  'duckduckgo images': true,
  'google images': true,
  'bing videos': true,
  'duckduckgo videos': true,
  'google videos': true,
  'bing news': true,
  'duckduckgo news': true,
  'google news': true,
  'gitlab': true,
  'sourcegraph': true,
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'search' | 'providers' | 'appearance' | 'maps' | 'privacy'>('general');
  const [theme, setTheme] = useState<string>('dark');
  const [density, setDensity] = useState<string>('comfortable');
  const [safeSearch, setSafeSearch] = useState<string>('1');
  const [language, setLanguage] = useState<string>('all');
  const [autocompleteEnabled, setAutocompleteEnabled] = useState<boolean>(true);
  const [mapProvider, setMapProvider] = useState<string>(DEFAULT_MAP_PROVIDER_ID);
  const [locationMode, setLocationMode] = useState<'never' | 'ask' | 'allow'>('never');
  const [enabledEngines, setEnabledEngines] = useState<Record<string, boolean>>(DEFAULT_ENABLED_ENGINES);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('sift-theme') || 'dark';
      const storedDensity = localStorage.getItem('sift-density') || 'comfortable';
      const storedSafeSearch = localStorage.getItem('sift-safesearch') || '1';
      const storedLanguage = localStorage.getItem('sift-language') || 'all';
      const storedAutocomplete = localStorage.getItem('sift-autocomplete') !== 'false';
      const storedMapProvider = localStorage.getItem('sift-map-provider') || DEFAULT_MAP_PROVIDER_ID;
      const storedLocationMode = (localStorage.getItem('sift-location-mode') as 'never' | 'ask' | 'allow') || 'never';
      
      try {
        const storedEngines = localStorage.getItem('sift-engines');
        if (storedEngines) {
          setEnabledEngines({ ...DEFAULT_ENABLED_ENGINES, ...JSON.parse(storedEngines) });
        }
      } catch (e) {
        console.error('Failed to parse stored engines:', e);
      }

      setTheme(storedTheme);
      setDensity(storedDensity);
      setSafeSearch(storedSafeSearch);
      setLanguage(storedLanguage);
      setAutocompleteEnabled(storedAutocomplete);
      setMapProvider(storedMapProvider);
      setLocationMode(storedLocationMode);
    }
  }, [isOpen]);

  const applyTheme = (val: string) => {
    setTheme(val);
    localStorage.setItem('sift-theme', val);
    if (val === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', val);
    }
  };

  const applyDensity = (val: string) => {
    setDensity(val);
    localStorage.setItem('sift-density', val);
    document.documentElement.setAttribute('data-density', val);
  };

  const applySafeSearch = (val: string) => {
    setSafeSearch(val);
    localStorage.setItem('sift-safesearch', val);
  };

  const applyLanguage = (val: string) => {
    setLanguage(val);
    localStorage.setItem('sift-language', val);
  };

  const applyAutocomplete = (val: boolean) => {
    setAutocompleteEnabled(val);
    localStorage.setItem('sift-autocomplete', val ? 'true' : 'false');
  };

  const applyMapProvider = (val: string) => {
    setMapProvider(val);
    localStorage.setItem('sift-map-provider', val);
  };

  const applyLocationMode = (val: 'never' | 'ask' | 'allow') => {
    setLocationMode(val);
    localStorage.setItem('sift-location-mode', val);
  };

  const toggleEngine = (engineId: string) => {
    const updated = {
      ...enabledEngines,
      [engineId]: !enabledEngines[engineId],
    };
    setEnabledEngines(updated);
    localStorage.setItem('sift-engines', JSON.stringify(updated));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.drawerOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
      <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h2 id="settings-drawer-title" className={styles.drawerTitle}>
            Settings &amp; Preferences
          </h2>
          <button 
            type="button" 
            className={styles.closeBtn} 
            onClick={onClose} 
            aria-label="Close settings drawer"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className={styles.drawerTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'general'}
            className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'search'}
            className={`${styles.tabBtn} ${activeTab === 'search' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'providers'}
            className={`${styles.tabBtn} ${activeTab === 'providers' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            Providers
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'appearance'}
            className={`${styles.tabBtn} ${activeTab === 'appearance' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'maps'}
            className={`${styles.tabBtn} ${activeTab === 'maps' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('maps')}
          >
            Maps
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'privacy'}
            className={`${styles.tabBtn} ${activeTab === 'privacy' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
        </div>

        <div className={styles.drawerBody}>
          {activeTab === 'general' && (
            <div className={styles.settingsSection}>
              <div className={styles.settingItem}>
                <label htmlFor="setting-language" className={styles.settingLabel}>
                  Default Search Language
                </label>
                <select
                  id="setting-language"
                  className={styles.settingSelect}
                  value={language}
                  onChange={(e) => applyLanguage(e.target.value)}
                >
                  <option value="all">Auto-detect (All languages)</option>
                  <option value="en">English</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="fr">French (Français)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="ja">Japanese (日本語)</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
                <span className={styles.settingDesc}>
                  Limits search queries to documents published in the chosen language.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className={styles.settingsSection}>
              <div className={styles.settingItem}>
                <label htmlFor="setting-safesearch" className={styles.settingLabel}>
                  SafeSearch Content Filtering
                </label>
                <select
                  id="setting-safesearch"
                  className={styles.settingSelect}
                  value={safeSearch}
                  onChange={(e) => applySafeSearch(e.target.value)}
                >
                  <option value="0">Off (Strict filtering disabled)</option>
                  <option value="1">Moderate (Filter explicit thumbnails/links)</option>
                  <option value="2">Strict (Aggressive adult filter)</option>
                </select>
                <span className={styles.settingDesc}>
                  Controls explicit material filtering forwarded to search engine backends.
                </span>
              </div>

              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Autocomplete Query Predictions</label>
                <div className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    id="toggle-autocomplete"
                    className={styles.checkboxInput}
                    checked={autocompleteEnabled}
                    onChange={(e) => applyAutocomplete(e.target.checked)}
                  />
                  <label htmlFor="toggle-autocomplete" className={styles.checkboxLabel}>
                    Fetch real-time OpenSearch predictions while typing
                  </label>
                </div>
                <span className={styles.settingDesc}>
                  Queries OpenSearch suggestions anonymously via the self-hosted SIFT instance.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className={styles.settingsSection}>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Active Search Providers</label>
                <span className={styles.settingDesc} style={{ marginBottom: '0.75rem' }}>
                  Select which search engines participate in aggregated search results.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Web Search
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {CURATED_ENGINES.web.map((eng) => (
                        <label key={eng.id} className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={enabledEngines[eng.id] !== false}
                            onChange={() => toggleEngine(eng.id)}
                          />
                          <span>{eng.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Media &amp; News
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {[...CURATED_ENGINES.images, ...CURATED_ENGINES.news].map((eng) => (
                        <label key={eng.id} className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={enabledEngines[eng.id] !== false}
                            onChange={() => toggleEngine(eng.id)}
                          />
                          <span>{eng.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--text)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Code &amp; Repositories
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {CURATED_ENGINES.code.map((eng) => (
                        <label key={eng.id} className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={enabledEngines[eng.id] !== false}
                            onChange={() => toggleEngine(eng.id)}
                          />
                          <span>{eng.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className={styles.settingsSection}>
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Theme Mode</label>
                <div className={styles.themeGrid}>
                  <button
                    type="button"
                    className={`${styles.themeOption} ${theme === 'dark' ? styles.themeOptionActive : ''}`}
                    onClick={() => applyTheme('dark')}
                  >
                    <MoonIcon size={14} />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.themeOption} ${theme === 'light' ? styles.themeOptionActive : ''}`}
                    onClick={() => applyTheme('light')}
                  >
                    <SunIcon size={14} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.themeOption} ${theme === 'system' ? styles.themeOptionActive : ''}`}
                    onClick={() => applyTheme('system')}
                  >
                    <ComputerIcon size={14} />
                    <span>System</span>
                  </button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Information Density</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="density"
                      value="comfortable"
                      checked={density === 'comfortable'}
                      onChange={() => applyDensity('comfortable')}
                    />
                    <span>Comfortable (Standard typography and spacing)</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="density"
                      value="compact"
                      checked={density === 'compact'}
                      onChange={() => applyDensity('compact')}
                    />
                    <span>Compact (High information density, condensed paddings)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maps' && (
            <div className={styles.settingsSection}>
              <div className={styles.settingItem}>
                <label htmlFor="setting-map-provider" className={styles.settingLabel}>
                  Preferred External Map Provider
                </label>
                <select
                  id="setting-map-provider"
                  className={styles.settingSelect}
                  value={mapProvider}
                  onChange={(e) => applyMapProvider(e.target.value)}
                >
                  {Object.values(MAP_PROVIDERS).map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.displayName}
                    </option>
                  ))}
                </select>
                <span className={styles.settingDesc}>
                  Opening a place, coordinate, or map result directs you externally to this provider.
                </span>
              </div>

              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Location Permission Mode</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="locationMode"
                      value="never"
                      checked={locationMode === 'never'}
                      onChange={() => applyLocationMode('never')}
                    />
                    <span>Never (Default: Never ask or use geolocation)</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="locationMode"
                      value="ask"
                      checked={locationMode === 'ask'}
                      onChange={() => applyLocationMode('ask')}
                    />
                    <span>Ask when needed (Prompt on local queries like &quot;near me&quot;)</span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="locationMode"
                      value="allow"
                      checked={locationMode === 'allow'}
                      onChange={() => applyLocationMode('allow')}
                    />
                    <span>Allow (Request browser geolocation for map queries)</span>
                  </label>
                </div>
                <span className={styles.settingDesc}>
                  SIFT never silently tracks coordinates. Coordinates are held in volatile session memory only.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className={styles.privacyContent}>
              <div className={styles.privacyBlock}>
                <h4>Zero-Log Aggregate Architecture</h4>
                <p>
                  SIFT acts as an aggregator interface. Queries are processed server-side without user identifiers, search history logging, or third-party behavioral analytics tracking.
                </p>
              </div>

              <div className={styles.privacyBlock}>
                <h4>Search Aggregation &amp; Third-Party Services</h4>
                <p>
                  When you execute a search, SIFT contacts your configured upstream engines (Google, Brave, Bing, DuckDuckGo, OpenStreetMap) anonymously on your behalf.
                </p>
                <ul>
                  <li>Searches are proxied without tracking cookies.</li>
                  <li>Opening external links redirects to the respective destination.</li>
                  <li>Location data is strictly ephemeral and never stored.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
