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
  UploadIcon
} from '@/components/icons';
import { 
  OFFICIAL_WALLPAPERS, 
  CURATED_ACCENTS, 
  DensityMode, 
  MotionMode
} from '@/lib/appearance';
import { useAppearance } from '@/context/AppearanceContext';
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
  const [activeTab, setActiveTab] = useState<'appearance' | 'general' | 'search' | 'providers' | 'maps' | 'privacy'>('appearance');
  
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
  }, [isOpen, config.wallpaperCustomUrl]);

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

    // Limit to reasonable client image size (e.g. 25MB)
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

  const handleResetAll = async () => {
    await resetToDefaults();
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
          {activeTab === 'appearance' && (
            <div className={styles.settingsSection}>
              
              {/* Wallpaper Source Selection */}
              <div className={styles.settingItem}>
                <div className={styles.sectionHeaderRow}>
                  <label className={styles.settingLabel}>Wallpaper Environment</label>
                  <span className={styles.localBadge}>LOCAL STORAGE ONLY</span>
                </div>
                <span className={styles.settingDesc}>
                  Select from the official SIFT collection, upload a local file, or specify an image URL.
                </span>

                {/* Source Subtabs */}
                <div className={styles.wallpaperSourceTabs}>
                  <button
                    type="button"
                    className={`${styles.sourceTabBtn} ${config.wallpaperSource === 'official' ? styles.sourceTabBtnActive : ''}`}
                    onClick={() => updateConfig({ wallpaperSource: 'official' })}
                  >
                    Official Collection
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

                {/* 1. Official Collection Cards */}
                {config.wallpaperSource === 'official' && (
                  <div className={styles.wallpaperGrid}>
                    {OFFICIAL_WALLPAPERS.map((wp) => {
                      const isSelected = config.wallpaperSource === 'official' && config.wallpaperId === wp.id;
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
                            {isSelected && (
                              <div className={styles.selectedCheckOverlay}>
                                <CheckIcon size={14} />
                              </div>
                            )}
                          </div>
                          <div className={styles.wallpaperCardInfo}>
                            <span className={styles.wallpaperCardTitle}>{wp.title}</span>
                            <span className={styles.wallpaperCardSub}>{wp.subtitle}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                      <span>Background Blur</span>
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

                  {/* Position */}
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHeader}>
                      <span>Alignment</span>
                    </div>
                    <div className={styles.segmentGroup}>
                      {[
                        { id: 'center top', label: 'Top' },
                        { id: 'center 30%', label: 'Upper' },
                        { id: 'center center', label: 'Center' },
                        { id: 'center bottom', label: 'Bottom' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          className={`${styles.segmentBtn} ${config.wallpaperPosition === pos.id ? styles.segmentBtnActive : ''}`}
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
                
                <div className={styles.segmentGroup} style={{ marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className={`${styles.segmentBtn} ${config.accentMode === 'auto' ? styles.segmentBtnActive : ''}`}
                    onClick={() => updateConfig({ accentMode: 'auto' })}
                  >
                    Automatic (Wallpaper Derived)
                  </button>
                  <button
                    type="button"
                    className={`${styles.segmentBtn} ${config.accentMode === 'manual' ? styles.segmentBtnActive : ''}`}
                    onClick={() => updateConfig({ accentMode: 'manual' })}
                  >
                    Manual Curated
                  </button>
                </div>

                {config.accentMode === 'auto' ? (
                  <div className={styles.autoAccentNotice}>
                    <div className={styles.colorDot} style={{ backgroundColor: activeAccent }} />
                    <span>Derived tone: <strong>{activeAccent}</strong> dynamically paired with your wallpaper.</span>
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

              {/* Theme Mode */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Theme Mode</label>
                <div className={styles.themeGrid}>
                  <button
                    type="button"
                    className={`${styles.themeOption} ${config.theme === 'dark' ? styles.themeOptionActive : ''}`}
                    onClick={() => updateConfig({ theme: 'dark' })}
                  >
                    <MoonIcon size={14} />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.themeOption} ${config.theme === 'light' ? styles.themeOptionActive : ''}`}
                    onClick={() => updateConfig({ theme: 'light' })}
                  >
                    <SunIcon size={14} />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.themeOption} ${config.theme === 'system' ? styles.themeOptionActive : ''}`}
                    onClick={() => updateConfig({ theme: 'system' })}
                  >
                    <ComputerIcon size={14} />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Interface Density */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Interface Density</label>
                <div className={styles.segmentGroup}>
                  {(['compact', 'comfortable', 'spacious'] as DensityMode[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`${styles.segmentBtn} ${config.density === d ? styles.segmentBtnActive : ''}`}
                      onClick={() => updateConfig({ density: d })}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Intensity */}
              <div className={styles.settingItem}>
                <label className={styles.settingLabel}>Motion &amp; Animations</label>
                <div className={styles.segmentGroup}>
                  {(['full', 'reduced', 'off'] as MotionMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.segmentBtn} ${config.motion === m ? styles.segmentBtnActive : ''}`}
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
                <h4>Zero-Log Local-First Architecture</h4>
                <p>
                  SIFT runs without tracking cookies, advertising analytics, remote user profiles, or cloud synchronization. All appearance configurations and custom wallpapers are stored locally on this device.
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
