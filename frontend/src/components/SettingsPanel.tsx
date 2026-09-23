'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  CloseIcon, 
  SunIcon, 
  MoonIcon, 
  ComputerIcon, 
  SparklesIcon, 
  RotateCcwIcon,
  CheckIcon,
  TrashIcon,
  UploadIcon,
  ClockIcon,
  GlobeIcon
} from '@/components/icons';
import { 
  OFFICIAL_WALLPAPERS, 
  CURATED_ACCENTS, 
  DensityMode, 
  MotionMode
} from '@/lib/appearance';
import { 
  SiftHomeConfig, 
  DEFAULT_HOME_CONFIG, 
  loadHomeConfig, 
  saveHomeConfig, 
  HomeZone 
} from '@/lib/homeModules';
import { useAppearance } from '@/context/AppearanceContext';
import { useAI } from '@/context/AIContext';
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

const PLACEMENT_ZONES: { id: HomeZone; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'appearance' | 'home' | 'general' | 'search' | 'providers' | 'maps' | 'privacy'>('appearance');
  const [wallpaperFilter, setWallpaperFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [homeConfig, setHomeConfig] = useState<SiftHomeConfig>(DEFAULT_HOME_CONFIG);
  
  // Appearance from Context
  const { 
    config, 
    updateConfig, 
    resetToDefaults, 
    uploadedWallpaperUrl, 
    uploadWallpaper, 
    removeUploadedWallpaper,
    activeAccent
  } = useAppearance();

  // Local AI Overview from Context
  const { 
    aiEnabled, 
    setAiEnabled, 
    aiStatus, 
    aiModelName, 
    checkStatus 
  } = useAI();

  // Non-appearance operational settings
  const [safeSearch, setSafeSearch] = useState<string>('1');
  const [language, setLanguage] = useState<string>('all');
  const [autocompleteEnabled, setAutocompleteEnabled] = useState<boolean>(true);
  const [mapProvider, setMapProvider] = useState<string>(DEFAULT_MAP_PROVIDER_ID);
  const [locationMode, setLocationMode] = useState<'never' | 'ask' | 'allow'>('never');
  const [enabledEngines, setEnabledEngines] = useState<Record<string, boolean>>(DEFAULT_ENABLED_ENGINES);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [urlInput, setUrlInput] = useState(config.wallpaperCustomUrl || '');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newShortcutTitle, setNewShortcutTitle] = useState<string>('');
  const [newShortcutUrl, setNewShortcutUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        checkStatus();
        setHomeConfig(loadHomeConfig());
      }
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
      } catch {}

      setSafeSearch(storedSafeSearch);
      setLanguage(storedLanguage);
      setAutocompleteEnabled(storedAutocomplete);
      setMapProvider(storedMapProvider);
      setLocationMode(storedLocationMode);
      setUrlInput(config.wallpaperCustomUrl || '');
    }
  }, [isOpen, config.wallpaperCustomUrl, checkStatus]);

  const updateHomeModule = (moduleId: keyof SiftHomeConfig['modules'], partial: any) => {
    setHomeConfig((prev) => {
      const updated = {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleId]: {
            ...prev.modules[moduleId],
            ...partial,
          },
        },
      };
      saveHomeConfig(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sift-home-config-updated', { detail: updated }));
      }
      return updated;
    });
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image size should be under 25MB for optimal performance.');
      return;
    }

    try {
      await uploadWallpaper(file);
    } catch {
      setUploadError('Failed to save wallpaper locally in IndexedDB.');
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    updateConfig({
      wallpaperSource: 'url',
      wallpaperCustomUrl: urlInput.trim(),
    });
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newShortcutTitle.trim();
    const url = newShortcutUrl.trim();
    if (!title || !url) return;

    const currentShortcuts = homeConfig.modules.shortcuts.items || [];
    const newId = 'sc_' + Date.now().toString(36);
    const updated = [...currentShortcuts, { id: newId, label: title, url }];
    
    updateHomeModule('shortcuts', { items: updated });
    setNewShortcutTitle('');
    setNewShortcutUrl('');
  };

  const handleDeleteShortcut = (id: string) => {
    const currentShortcuts = homeConfig.modules.shortcuts.items || [];
    const updated = currentShortcuts.filter((s) => s.id !== id);
    updateHomeModule('shortcuts', { items: updated });
  };

  const handleResetAll = async () => {
    await resetToDefaults();
    const defaultHome = { ...DEFAULT_HOME_CONFIG };
    setHomeConfig(defaultHome);
    saveHomeConfig(defaultHome);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sift-home-config-updated', { detail: defaultHome }));
    }
    setShowResetConfirm(false);
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

  const filteredWallpapers = OFFICIAL_WALLPAPERS.filter((wp) => {
    if (wallpaperFilter === 'dark') return wp.theme === 'dark';
    if (wallpaperFilter === 'light') return wp.theme === 'light';
    return true;
  });

  return (
    <div className={styles.drawerOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
      <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleGroup}>
            <SparklesIcon size={16} className={styles.drawerHeaderIcon} />
            <h2 id="settings-drawer-title" className={styles.drawerTitle}>
              Customize SIFT
            </h2>
          </div>
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
            aria-selected={activeTab === 'appearance'}
            className={`${styles.tabBtn} ${activeTab === 'appearance' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'home'}
            className={`${styles.tabBtn} ${activeTab === 'home' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
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
          {/* ==========================================================
              1. APPEARANCE TAB
             ========================================================== */}
          {activeTab === 'appearance' && (
            <div className={styles.settingsSection}>
              
              {/* Visual Style — Apple Segmented Control */}
              <div className={styles.settingItem}>
                <div className={styles.sectionHeaderRow}>
                  <label className={styles.settingLabel}>Visual Style</label>
                  <span className={styles.localBadge}>{config.visualStyle.toUpperCase()}</span>
                </div>
                <div className={styles.appleSegmentTrack}>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.visualStyle === 'glass' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ visualStyle: 'glass' })}
                    aria-pressed={config.visualStyle === 'glass'}
                  >
                    <span>Glass</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.visualStyle === 'matte' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ visualStyle: 'matte' })}
                    aria-pressed={config.visualStyle === 'matte'}
                  >
                    <span>Matte</span>
                  </button>
                </div>
                <span className={styles.settingDesc}>
                  {config.visualStyle === 'glass'
                    ? 'Glass — atmospheric and immersive'
                    : 'Matte — minimal and distraction-free'}
                </span>
              </div>

              {/* Theme Mode — Apple Segmented Control */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Theme Mode</label>
                <div className={styles.appleSegmentTrack}>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.theme === 'system' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ theme: 'system' })}
                  >
                    <ComputerIcon size={13} />
                    <span>System</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.theme === 'light' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ theme: 'light' })}
                  >
                    <SunIcon size={13} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.theme === 'dark' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ theme: 'dark' })}
                  >
                    <MoonIcon size={13} />
                    <span>Dark</span>
                  </button>
                </div>
              </div>

              {/* Wallpaper Environment */}
              <div className={styles.settingItem}>
                <div className={styles.sectionHeaderRow}>
                  <label className={styles.settingLabel}>Wallpaper Environment</label>
                  <span className={styles.localBadge}>LOCAL STORAGE ONLY</span>
                </div>
                <span className={styles.settingDesc}>
                  SIFT includes curated Dark &amp; Light atmospheric collections with automatic system theme pairing.
                </span>
                {config.visualStyle === 'matte' && (
                  <span className={styles.pairedHintText} style={{ marginTop: '0.2rem' }}>
                    ⓘ Atmospheric wallpaper is suppressed in Matte mode. Your wallpaper choice is preserved when returning to Glass.
                  </span>
                )}

                {/* Source Subtabs */}
                <div className={styles.wallpaperSourceTabs}>
                  <button
                    type="button"
                    className={`${styles.sourceTabBtn} ${config.wallpaperSource === 'official' ? styles.sourceTabBtnActive : ''}`}
                    onClick={() => updateConfig({ wallpaperSource: 'official' })}
                  >
                    Official Catalog
                  </button>
                  <button
                    type="button"
                    className={`${styles.sourceTabBtn} ${config.wallpaperSource === 'upload' ? styles.sourceTabBtnActive : ''}`}
                    onClick={() => updateConfig({ wallpaperSource: 'upload' })}
                  >
                    Local Upload
                  </button>
                  <button
                    type="button"
                    className={`${styles.sourceTabBtn} ${config.wallpaperSource === 'url' ? styles.sourceTabBtnActive : ''}`}
                    onClick={() => updateConfig({ wallpaperSource: 'url' })}
                  >
                    Custom URL
                  </button>
                </div>

                {/* 1. Official Collection Filter & Grid */}
                {config.wallpaperSource === 'official' && (
                  <>
                    <div className={styles.wallpaperThemeFilter}>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${wallpaperFilter === 'all' ? styles.filterPillActive : ''}`}
                        onClick={() => setWallpaperFilter('all')}
                      >
                        All ({OFFICIAL_WALLPAPERS.length})
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${wallpaperFilter === 'dark' ? styles.filterPillActive : ''}`}
                        onClick={() => setWallpaperFilter('dark')}
                      >
                        <MoonIcon size={11} />
                        <span>Dark Wallpapers</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.filterPill} ${wallpaperFilter === 'light' ? styles.filterPillActive : ''}`}
                        onClick={() => setWallpaperFilter('light')}
                      >
                        <SunIcon size={11} />
                        <span>Light Wallpapers</span>
                      </button>
                    </div>

                    <div className={styles.wallpaperGrid}>
                      {filteredWallpapers.map((wp) => {
                        const isSelected = config.wallpaperSource === 'official' && config.wallpaperId === wp.id;
                        const pairedName = wp.pairedId ? OFFICIAL_WALLPAPERS.find(p => p.id === wp.pairedId)?.title : null;

                        return (
                          <div
                            key={wp.id}
                            className={`${styles.wallpaperCard} ${isSelected ? styles.wallpaperCardSelected : ''}`}
                            onClick={() => updateConfig({ wallpaperId: wp.id, wallpaperSource: 'official' })}
                            role="button"
                            tabIndex={0}
                          >
                            <div className={styles.wallpaperThumbWrapper}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={wp.thumbnail} alt={wp.title} className={styles.wallpaperThumb} />
                              <div className={styles.themeBadge}>
                                {wp.theme === 'light' ? 'LIGHT' : 'DARK'}
                              </div>
                              {isSelected && (
                                <div className={styles.selectedCheckOverlay}>
                                  <CheckIcon size={14} />
                                </div>
                              )}
                            </div>
                            <div className={styles.wallpaperCardInfo}>
                              <div className={styles.wallpaperCardHeader}>
                                <span className={styles.wallpaperCardTitle}>{wp.title}</span>
                              </div>
                              <span className={styles.wallpaperCardSub}>{wp.subtitle}</span>
                              {pairedName && (
                                <span className={styles.pairedHintText}>
                                  ⇄ Auto-pairs with {pairedName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* 2. Local Device Upload */}
                {config.wallpaperSource === 'upload' && (
                  <div className={styles.uploadContainer}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />

                    {uploadedWallpaperUrl ? (
                      <div className={styles.uploadedPreviewCard}>
                        <div className={styles.uploadedThumbWrapper}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={uploadedWallpaperUrl} alt="Uploaded wallpaper preview" className={styles.uploadedThumb} />
                          <div className={styles.activePillBadge}>Active in IndexedDB</div>
                        </div>
                        <div className={styles.uploadActionsRow}>
                          <button
                            type="button"
                            className={styles.uploadActionBtn}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadIcon size={13} />
                            <span>Replace</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.uploadActionBtn} ${styles.deleteActionBtn}`}
                            onClick={removeUploadedWallpaper}
                          >
                            <TrashIcon size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className={styles.uploadDropzone}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                      >
                        <UploadIcon size={24} className={styles.uploadIcon} />
                        <span className={styles.dropzoneTitle}>Choose image from device</span>
                        <span className={styles.dropzoneSub}>Saved strictly in your browser&apos;s IndexedDB</span>
                      </div>
                    )}

                    {uploadError && <p className={styles.uploadErrorText}>{uploadError}</p>}
                  </div>
                )}

                {/* 3. Custom URL */}
                {config.wallpaperSource === 'url' && (
                  <form onSubmit={handleCustomUrlSubmit} className={styles.urlForm}>
                    <div className={styles.urlInputRow}>
                      <input
                        type="url"
                        placeholder="https://example.com/wallpaper.jpg"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className={styles.urlInputField}
                      />
                      <button type="submit" className={styles.urlApplyBtn}>
                        Apply
                      </button>
                    </div>
                    <span className={styles.settingDesc}>
                      Image is loaded directly by your browser. No server proxying.
                    </span>
                  </form>
                )}
              </div>

              {/* Wallpaper Controls */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Wallpaper Tuning</label>
                
                <div className={styles.slidersGroup}>
                  {/* Opacity */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Opacity</span>
                      <span className={styles.sliderVal}>{Math.round(config.wallpaperOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.02"
                      value={config.wallpaperOpacity}
                      onChange={(e) => updateConfig({ wallpaperOpacity: parseFloat(e.target.value) })}
                      className={styles.rangeInput}
                    />
                  </div>

                  {/* Blur */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Atmospheric Blur</span>
                      <span className={styles.sliderVal}>{config.wallpaperBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="1"
                      value={config.wallpaperBlur}
                      onChange={(e) => updateConfig({ wallpaperBlur: parseInt(e.target.value, 10) })}
                      className={styles.rangeInput}
                    />
                  </div>

                  {/* Overlay Darkness */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Readability Scrim Darkness</span>
                      <span className={styles.sliderVal}>{Math.round(config.overlayDarkness * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.85"
                      step="0.05"
                      value={config.overlayDarkness}
                      onChange={(e) => updateConfig({ overlayDarkness: parseFloat(e.target.value) })}
                      className={styles.rangeInput}
                    />
                  </div>

                  {/* Position — Apple Segmented Control */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Alignment</span>
                    </div>
                    <div className={styles.appleSegmentTrack}>
                      {[
                        { id: 'center top', label: 'Top' },
                        { id: 'center 30%', label: 'Upper' },
                        { id: 'center center', label: 'Center' },
                        { id: 'center bottom', label: 'Bottom' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          className={`${styles.appleSegmentItem} ${config.wallpaperPosition === pos.id ? styles.appleSegmentActive : ''}`}
                          onClick={() => updateConfig({ wallpaperPosition: pos.id })}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scale */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Scale</span>
                      <span className={styles.sliderVal}>{Math.round(config.wallpaperScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="1.25"
                      step="0.01"
                      value={config.wallpaperScale}
                      onChange={(e) => updateConfig({ wallpaperScale: parseFloat(e.target.value) })}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>
              </div>

              {/* Glass Material Controls */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Translucent Glass Material</label>
                
                <div className={styles.slidersGroup}>
                  {/* Glass Opacity */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Surface Opacity</span>
                      <span className={styles.sliderVal}>{Math.round(config.glassOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="0.9"
                      step="0.02"
                      value={config.glassOpacity}
                      onChange={(e) => updateConfig({ glassOpacity: parseFloat(e.target.value) })}
                      className={styles.rangeInput}
                    />
                  </div>

                  {/* Glass Blur */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Backdrop Blur</span>
                      <span className={styles.sliderVal}>{config.glassBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      step="1"
                      value={config.glassBlur}
                      onChange={(e) => updateConfig({ glassBlur: parseInt(e.target.value, 10) })}
                      className={styles.rangeInput}
                    />
                  </div>

                  {/* Border Intensity */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Border &amp; Highlight Strength</span>
                      <span className={styles.sliderVal}>{Math.round(config.borderIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.8"
                      step="0.05"
                      value={config.borderIntensity}
                      onChange={(e) => updateConfig({ borderIntensity: parseFloat(e.target.value) })}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Accent Color System</label>
                
                <div className={styles.appleSegmentTrack} style={{ marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.accentMode === 'auto' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ accentMode: 'auto' })}
                  >
                    Automatic (Wallpaper Tone)
                  </button>
                  <button
                    type="button"
                    className={`${styles.appleSegmentItem} ${config.accentMode === 'manual' ? styles.appleSegmentActive : ''}`}
                    onClick={() => updateConfig({ accentMode: 'manual' })}
                  >
                    Curated Palette
                  </button>
                </div>

                {config.accentMode === 'auto' ? (
                  <div className={styles.autoAccentNotice}>
                    <div className={styles.colorDot} style={{ backgroundColor: activeAccent }} />
                    <span>Active Tone: <strong>{activeAccent}</strong> automatically paired with your current wallpaper.</span>
                  </div>
                ) : (
                  <div className={styles.swatchGrid}>
                    {CURATED_ACCENTS.map((swatch) => {
                      const isSelected = config.accentColor.toLowerCase() === swatch.hex.toLowerCase();
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          className={`${styles.swatchBtn} ${isSelected ? styles.swatchBtnSelected : ''}`}
                          onClick={() => updateConfig({ accentColor: swatch.hex, accentMode: 'manual' })}
                          title={swatch.label}
                          aria-label={swatch.label}
                        >
                          <span className={styles.swatchCircle} style={{ backgroundColor: swatch.hex }}>
                            {isSelected && <CheckIcon size={12} className={styles.swatchCheck} />}
                          </span>
                          <span className={styles.swatchLabel}>{swatch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interface Density — Apple Segmented Control */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Interface Density</label>
                <div className={styles.appleSegmentTrack}>
                  {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`${styles.appleSegmentItem} ${config.density === d ? styles.appleSegmentActive : ''}`}
                      onClick={() => updateConfig({ density: d })}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Intensity — Apple Segmented Control */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Motion &amp; Animations</label>
                <div className={styles.appleSegmentTrack}>
                  {(['full', 'reduced', 'off'] as MotionMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.appleSegmentItem} ${config.motion === m ? styles.appleSegmentActive : ''}`}
                      onClick={() => updateConfig({ motion: m })}
                    >
                      {m === 'full' ? 'Full' : m === 'reduced' ? 'Reduced' : 'Off'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Section */}
              <div className={styles.resetSectionWrapper}>
                {!showResetConfirm ? (
                  <button
                    type="button"
                    className={styles.resetButton}
                    onClick={() => setShowResetConfirm(true)}
                  >
                    <RotateCcwIcon size={13} />
                    <span>Reset to SIFT Defaults</span>
                  </button>
                ) : (
                  <div className={styles.resetConfirmBox}>
                    <p className={styles.resetConfirmText}>
                      Reset all visual preferences, wallpaper, and glass settings back to original defaults?
                    </p>
                    <div className={styles.resetConfirmActions}>
                      <button
                        type="button"
                        className={styles.confirmYesBtn}
                        onClick={handleResetAll}
                      >
                        Yes, Reset Everything
                      </button>
                      <button
                        type="button"
                        className={styles.confirmCancelBtn}
                        onClick={() => setShowResetConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==========================================================
              2. HOME CANVAS TAB (Integrated Spatial Modules)
             ========================================================== */}
          {activeTab === 'home' && (
            <div className={styles.settingsSection}>
              <div className={styles.settingItem}>
                <div className={styles.sectionHeaderRow}>
                  <label className={styles.settingLabel}>Spatial Canvas Modules</label>
                  <span className={styles.localBadge}>DESKTOP SPATIAL CANVAS</span>
                </div>
                <span className={styles.settingDesc}>
                  Enable subtle peripheral modules on desktop. On tablet &amp; mobile, modules gracefully collapse into standard flow.
                </span>
              </div>

              {/* Module 1: Clock & Date */}
              <div className={styles.moduleControlCard}>
                <div className={styles.moduleControlHeader}>
                  <div className={styles.moduleControlTitleGroup}>
                    <ClockIcon size={15} className={styles.moduleControlIcon} />
                    <div>
                      <h3 className={styles.moduleControlTitle}>Time &amp; Date</h3>
                      <p className={styles.moduleControlSub}>Live updating typographic clock and localized day</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={homeConfig.modules.clock.enabled}
                    aria-label="Toggle Time & Date Module"
                    className={`${styles.appleSwitch} ${homeConfig.modules.clock.enabled ? styles.appleSwitchOn : ''}`}
                    onClick={() => updateHomeModule('clock', { enabled: !homeConfig.modules.clock.enabled })}
                  >
                    <span className={styles.appleSwitchThumb} />
                  </button>
                </div>

                {homeConfig.modules.clock.enabled && (
                  <>
                    <div className={styles.moduleZoneSelector}>
                      <span className={styles.zoneLabel}>Placement Zone</span>
                      <div className={styles.appleSegmentTrack}>
                        {PLACEMENT_ZONES.map((z) => (
                          <button
                            key={z.id}
                            type="button"
                            className={`${styles.appleSegmentItem} ${homeConfig.modules.clock.zone === z.id ? styles.appleSegmentActive : ''}`}
                            onClick={() => updateHomeModule('clock', { zone: z.id })}
                          >
                            {z.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span className={styles.zoneLabel}>Time Format</span>
                      <div className={styles.appleSegmentTrack} style={{ maxWidth: '240px' }}>
                        <button
                          type="button"
                          className={`${styles.appleSegmentItem} ${(homeConfig.modules.clock.hourFormat || '24h') === '24h' ? styles.appleSegmentActive : ''}`}
                          onClick={() => updateHomeModule('clock', { hourFormat: '24h' })}
                        >
                          24-Hour (00:00)
                        </button>
                        <button
                          type="button"
                          className={`${styles.appleSegmentItem} ${homeConfig.modules.clock.hourFormat === '12h' ? styles.appleSegmentActive : ''}`}
                          onClick={() => updateHomeModule('clock', { hourFormat: '12h' })}
                        >
                          12-Hour (12:00 AM)
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span className={styles.zoneLabel}>Clock Timezone</span>
                      <select
                        value={homeConfig.modules.clock.timezone || 'local'}
                        onChange={(e) => updateHomeModule('clock', { timezone: e.target.value })}
                        className={styles.settingSelect}
                        style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                      >
                        <option value="local">Local Browser Time</option>
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">New York (EST/EDT)</option>
                        <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                        <option value="America/Chicago">Chicago (CST/CDT)</option>
                        <option value="Europe/London">London (GMT/BST)</option>
                        <option value="Europe/Paris">Paris / Berlin (CET/CEST)</option>
                        <option value="Asia/Kolkata">India / New Delhi (IST)</option>
                        <option value="Asia/Dubai">Dubai (GST)</option>
                        <option value="Asia/Singapore">Singapore (SGT)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                        <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Module 2: Atmosphere & Weather */}
              <div className={styles.moduleControlCard}>
                <div className={styles.moduleControlHeader}>
                  <div className={styles.moduleControlTitleGroup}>
                    <SunIcon size={15} className={styles.moduleControlIcon} />
                    <div>
                      <h3 className={styles.moduleControlTitle}>Atmosphere &amp; Climate</h3>
                      <p className={styles.moduleControlSub}>Live temperature, sky condition, and weather status</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={homeConfig.modules.weather.enabled}
                    aria-label="Toggle Atmosphere & Weather Module"
                    className={`${styles.appleSwitch} ${homeConfig.modules.weather.enabled ? styles.appleSwitchOn : ''}`}
                    onClick={() => updateHomeModule('weather', { enabled: !homeConfig.modules.weather.enabled })}
                  >
                    <span className={styles.appleSwitchThumb} />
                  </button>
                </div>

                {homeConfig.modules.weather.enabled && (
                  <>
                    <div className={styles.moduleZoneSelector}>
                      <span className={styles.zoneLabel}>Placement Zone</span>
                      <div className={styles.appleSegmentTrack}>
                        {PLACEMENT_ZONES.map((z) => (
                          <button
                            key={z.id}
                            type="button"
                            className={`${styles.appleSegmentItem} ${homeConfig.modules.weather.zone === z.id ? styles.appleSegmentActive : ''}`}
                            onClick={() => updateHomeModule('weather', { zone: z.id })}
                          >
                            {z.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span className={styles.zoneLabel}>Temperature Unit</span>
                      <div className={styles.appleSegmentTrack} style={{ maxWidth: '240px' }}>
                        <button
                          type="button"
                          className={`${styles.appleSegmentItem} ${homeConfig.modules.weather.unit === 'c' ? styles.appleSegmentActive : ''}`}
                          onClick={() => updateHomeModule('weather', { unit: 'c' })}
                        >
                          °C (Celsius)
                        </button>
                        <button
                          type="button"
                          className={`${styles.appleSegmentItem} ${homeConfig.modules.weather.unit === 'f' ? styles.appleSegmentActive : ''}`}
                          onClick={() => updateHomeModule('weather', { unit: 'f' })}
                        >
                          °F (Fahrenheit)
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span className={styles.zoneLabel}>Custom City / Location</span>
                      <input
                        type="text"
                        placeholder="e.g. London, San Francisco, Tokyo (empty for auto)"
                        value={homeConfig.modules.weather.city || ''}
                        onChange={(e) => updateHomeModule('weather', { city: e.target.value })}
                        className={styles.urlInputField}
                        style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                      />
                      <span className={styles.settingDesc} style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                        ⓘ Weather &amp; geocoding queries are fetched directly from <strong>Open-Meteo API</strong> (open-meteo.com — open-source, non-commercial, zero telemetry, no personal data sent or stored).
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Module 3: Recent Searches */}
              <div className={styles.moduleControlCard}>
                <div className={styles.moduleControlHeader}>
                  <div className={styles.moduleControlTitleGroup}>
                    <ClockIcon size={15} className={styles.moduleControlIcon} />
                    <div>
                      <h3 className={styles.moduleControlTitle}>Recent Queries</h3>
                      <p className={styles.moduleControlSub}>Fast one-click access to recent local search history</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={homeConfig.modules.recentSearches.enabled}
                    aria-label="Toggle Recent Queries Module"
                    className={`${styles.appleSwitch} ${homeConfig.modules.recentSearches.enabled ? styles.appleSwitchOn : ''}`}
                    onClick={() => updateHomeModule('recentSearches', { enabled: !homeConfig.modules.recentSearches.enabled })}
                  >
                    <span className={styles.appleSwitchThumb} />
                  </button>
                </div>

                {homeConfig.modules.recentSearches.enabled && (
                  <div className={styles.moduleZoneSelector}>
                    <span className={styles.zoneLabel}>Placement Zone</span>
                    <div className={styles.appleSegmentTrack}>
                      {PLACEMENT_ZONES.map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          className={`${styles.appleSegmentItem} ${homeConfig.modules.recentSearches.zone === z.id ? styles.appleSegmentActive : ''}`}
                          onClick={() => updateHomeModule('recentSearches', { zone: z.id })}
                        >
                          {z.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Module 4: Pinned Shortcuts */}
              <div className={styles.moduleControlCard}>
                <div className={styles.moduleControlHeader}>
                  <div className={styles.moduleControlTitleGroup}>
                    <GlobeIcon size={15} className={styles.moduleControlIcon} />
                    <div>
                      <h3 className={styles.moduleControlTitle}>Pinned Shortcuts</h3>
                      <p className={styles.moduleControlSub}>Direct link launcher with auto-fetched favicons</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={homeConfig.modules.shortcuts.enabled}
                    aria-label="Toggle Pinned Shortcuts Module"
                    className={`${styles.appleSwitch} ${homeConfig.modules.shortcuts.enabled ? styles.appleSwitchOn : ''}`}
                    onClick={() => updateHomeModule('shortcuts', { enabled: !homeConfig.modules.shortcuts.enabled })}
                  >
                    <span className={styles.appleSwitchThumb} />
                  </button>
                </div>

                {homeConfig.modules.shortcuts.enabled && (
                  <>
                    <div className={styles.moduleZoneSelector}>
                      <span className={styles.zoneLabel}>Placement Zone</span>
                      <div className={styles.appleSegmentTrack}>
                        {PLACEMENT_ZONES.map((z) => (
                          <button
                            key={z.id}
                            type="button"
                            className={`${styles.appleSegmentItem} ${homeConfig.modules.shortcuts.zone === z.id ? styles.appleSegmentActive : ''}`}
                            onClick={() => updateHomeModule('shortcuts', { zone: z.id })}
                          >
                            {z.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Shortcuts Manager List */}
                    <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <span className={styles.zoneLabel}>Pinned Links List</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {(homeConfig.modules.shortcuts.items || []).map((sc) => (
                          <div 
                            key={sc.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '0.45rem 0.65rem', 
                              background: 'var(--glass-surface)', 
                              border: '1px solid var(--glass-border)', 
                              borderRadius: 'var(--radius-xs)',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                              <GlobeIcon size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{sc.label}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sc.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteShortcut(sc.id)}
                              style={{ color: 'var(--text-muted)', padding: '0.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                              title="Delete shortcut"
                            >
                              <TrashIcon size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add New Shortcut Form */}
                      <form onSubmit={handleAddShortcut} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                        <input
                          type="text"
                          placeholder="Title (e.g. GitHub)"
                          value={newShortcutTitle}
                          onChange={(e) => setNewShortcutTitle(e.target.value)}
                          className={styles.urlInputField}
                          style={{ width: '130px', padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                        />
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={newShortcutUrl}
                          onChange={(e) => setNewShortcutUrl(e.target.value)}
                          className={styles.urlInputField}
                          style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                        />
                        <button
                          type="submit"
                          className={styles.urlApplyBtn}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>

            </div>
          )}

          {/* ==========================================================
              3. GENERAL TAB
             ========================================================== */}
          {activeTab === 'general' && (
            <div className={styles.settingsSection}>
              
              {/* Local AI Overview Controls — Apple Sliding Switch */}
              <div className={styles.settingItem}>
                <div className={styles.sectionHeaderRow}>
                  <label className={styles.settingLabel}>AI Overview</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: aiStatus === 'local' ? 'var(--success)' : aiStatus === 'offline' ? 'var(--error)' : 'var(--text-dim)',
                        boxShadow: aiStatus === 'local' ? '0 0 6px var(--success)' : 'none',
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                    <span className={styles.localBadge}>
                      {aiStatus === 'local' ? 'Local GGUF' : aiStatus === 'disabled' ? 'Disabled' : 'Offline'}
                    </span>
                  </div>
                </div>
                <span className={styles.settingDesc}>
                  Deliver concise standalone answers directly above search results using your local GGUF model.
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', marginTop: '0.45rem' }}>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text)' }}>Enable Local AI Overview</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiEnabled}
                    aria-label="Toggle Local AI Overview"
                    className={`${styles.appleSwitch} ${aiEnabled ? styles.appleSwitchOn : ''}`}
                    onClick={() => setAiEnabled(!aiEnabled)}
                  >
                    <span className={styles.appleSwitchThumb} />
                  </button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>AI Model</label>
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--glass-surface)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{aiModelName}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GGUF / llama.cpp</span>
                </div>
                <span className={styles.settingDesc}>
                  Configured local LLM model for CPU inference. Private LAN only, zero cloud telemetry.
                </span>
              </div>

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

          {/* ==========================================================
              4. SEARCH TAB
             ========================================================== */}
          {activeTab === 'search' && (
            <div className={styles.settingsSection}>
              {/* SafeSearch — Apple Segmented Control */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>
                  SafeSearch Content Filtering
                </label>
                <div className={styles.appleSegmentTrack}>
                  {[
                    { id: '0', label: 'Off' },
                    { id: '1', label: 'Moderate' },
                    { id: '2', label: 'Strict' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${styles.appleSegmentItem} ${safeSearch === opt.id ? styles.appleSegmentActive : ''}`}
                      onClick={() => applySafeSearch(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span className={styles.settingDesc}>
                  Controls explicit material filtering forwarded to search engine backends.
                </span>
              </div>

              {/* Autocomplete — Apple Switch */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Autocomplete Query Predictions</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', backgroundColor: 'var(--glass-surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', marginTop: '0.45rem' }}>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text)' }}>Real-time search suggestions</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autocompleteEnabled}
                    aria-label="Toggle Autocomplete Predictions"
                    className={`${styles.appleSwitch} ${autocompleteEnabled ? styles.appleSwitchOn : ''}`}
                    onClick={() => applyAutocomplete(!autocompleteEnabled)}
                  >
                    <span className={styles.appleSwitchThumb} />
                  </button>
                </div>
                <span className={styles.settingDesc}>
                  Queries OpenSearch suggestions anonymously via the self-hosted SIFT instance.
                </span>
              </div>
            </div>
          )}

          {/* ==========================================================
              5. PROVIDERS TAB
             ========================================================== */}
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

          {/* ==========================================================
              6. MAPS TAB
             ========================================================== */}
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

              {/* Location Permission Mode — Apple Segmented Control */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Location Permission Mode</label>
                <div className={styles.appleSegmentTrack}>
                  {[
                    { id: 'never', label: 'Never' },
                    { id: 'ask', label: 'Ask When Needed' },
                    { id: 'allow', label: 'Always Allow' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      className={`${styles.appleSegmentItem} ${locationMode === mode.id ? styles.appleSegmentActive : ''}`}
                      onClick={() => applyLocationMode(mode.id as 'never' | 'ask' | 'allow')}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <span className={styles.settingDesc}>
                  SIFT never silently tracks coordinates. Coordinates are held in volatile session memory only.
                </span>
              </div>
            </div>
          )}

          {/* ==========================================================
              7. PRIVACY TAB
             ========================================================== */}
          {activeTab === 'privacy' && (
            <div className={styles.privacyContent}>
              <div className={styles.privacyBlock}>
                <h4>Zero-Log Local-First Architecture</h4>
                <p>
                  SIFT runs without tracking cookies, advertising analytics, remote user profiles, or cloud synchronization. All appearance configurations, spatial home modules, and custom wallpapers are stored locally on this device.
                </p>
              </div>

              <div className={styles.privacyBlock}>
                <h4>Search Aggregation &amp; Third Parties</h4>
                <p>
                  When you execute a search, SIFT contacts upstream search engines anonymously through your self-hosted backend.
                </p>
                <ul>
                  <li>Searches are proxied without personal telemetry.</li>
                  <li>Custom wallpapers in IndexedDB never leave your browser.</li>
                  <li>Location permissions remain strictly in session memory.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
