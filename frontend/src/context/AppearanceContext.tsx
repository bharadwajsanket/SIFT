'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  SiftAppearanceConfig,
  DEFAULT_APPEARANCE_CONFIG,
  APPEARANCE_STORAGE_KEY,
  sanitizeAppearanceConfig,
  resolveAppearanceState,
  applyAppearanceToDOM,
} from '@/lib/appearance';
import {
  saveUploadedWallpaper,
  getUploadedWallpaper,
  deleteUploadedWallpaper,
} from '@/lib/wallpaperDb';

interface AppearanceContextType {
  config: SiftAppearanceConfig;
  updateConfig: (partial: Partial<SiftAppearanceConfig>) => void;
  resetToDefaults: () => Promise<void>;
  uploadedWallpaperUrl: string | null;
  uploadWallpaper: (file: File) => Promise<void>;
  removeUploadedWallpaper: () => Promise<void>;
  activeWallpaperUrl: string;
  activeAccent: string;
  isReady: boolean;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiftAppearanceConfig>(DEFAULT_APPEARANCE_CONFIG);
  const [uploadedWallpaperUrl, setUploadedWallpaperUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const prevObjectURLRef = useRef<string | null>(null);

  // Helper to safely revoke old object URLs
  const setAndManageObjectURL = useCallback((newUrl: string | null) => {
    if (prevObjectURLRef.current && prevObjectURLRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(prevObjectURLRef.current);
    }
    prevObjectURLRef.current = newUrl;
    setUploadedWallpaperUrl(newUrl);
  }, []);

  // Initial load from localStorage & IndexedDB
  useEffect(() => {
    let active = true;

    async function initAppearance() {
      let initialConfig = DEFAULT_APPEARANCE_CONFIG;
      try {
        const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
        if (stored) {
          initialConfig = sanitizeAppearanceConfig(JSON.parse(stored));
        } else {
          // Check for legacy Phase 1 keys if upgrading
          const legacyTheme = localStorage.getItem('sift-theme');
          const legacyDensity = localStorage.getItem('sift-density');
          if (legacyTheme || legacyDensity) {
            initialConfig = {
              ...DEFAULT_APPEARANCE_CONFIG,
              theme: (legacyTheme as any) || DEFAULT_APPEARANCE_CONFIG.theme,
              density: (legacyDensity as any) || DEFAULT_APPEARANCE_CONFIG.density,
            };
          }
        }
      } catch (e) {
        console.warn('Failed to load appearance preferences from localStorage:', e);
      }

      let uploadedUrl: string | null = null;
      if (initialConfig.hasUploadedWallpaper) {
        try {
          const blob = await getUploadedWallpaper();
          if (blob && active) {
            uploadedUrl = URL.createObjectURL(blob);
          } else {
            initialConfig = { ...initialConfig, hasUploadedWallpaper: false };
          }
        } catch (err) {
          console.warn('Failed to restore uploaded wallpaper from IndexedDB:', err);
          initialConfig = { ...initialConfig, hasUploadedWallpaper: false };
        }
      }

      if (active) {
        setConfig(initialConfig);
        setAndManageObjectURL(uploadedUrl);
        setIsReady(true);

        const { wallpaperUrl, accentColor } = resolveAppearanceState(initialConfig, uploadedUrl);
        applyAppearanceToDOM(initialConfig, wallpaperUrl, accentColor);
      }
    }

    initAppearance();

    return () => {
      active = false;
      if (prevObjectURLRef.current && prevObjectURLRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevObjectURLRef.current);
      }
    };
  }, [setAndManageObjectURL]);

  // System theme changes listener
  useEffect(() => {
    if (config.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const { wallpaperUrl, accentColor } = resolveAppearanceState(config, uploadedWallpaperUrl);
      applyAppearanceToDOM(config, wallpaperUrl, accentColor);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config, uploadedWallpaperUrl]);

  // Update configuration (live preview & auto-persistence)
  const updateConfig = useCallback((partial: Partial<SiftAppearanceConfig>) => {
    setConfig((prev) => {
      const merged = sanitizeAppearanceConfig({ ...prev, ...partial });
      
      // Save to localStorage immediately
      try {
        localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(merged));
        // Keep legacy keys in sync for external compatibility
        localStorage.setItem('sift-theme', merged.theme);
        localStorage.setItem('sift-density', merged.density);
      } catch (err) {
        console.error('Failed to save appearance config to localStorage:', err);
      }

      const { wallpaperUrl, accentColor } = resolveAppearanceState(merged, uploadedWallpaperUrl);
      applyAppearanceToDOM(merged, wallpaperUrl, accentColor);

      return merged;
    });
  }, [uploadedWallpaperUrl]);

  // Upload local wallpaper into IndexedDB
  const uploadWallpaper = useCallback(async (file: File) => {
    try {
      await saveUploadedWallpaper(file);
      const newUrl = URL.createObjectURL(file);
      setAndManageObjectURL(newUrl);

      updateConfig({
        wallpaperSource: 'upload',
        hasUploadedWallpaper: true,
      });
    } catch (err) {
      console.error('Failed to save uploaded wallpaper:', err);
      throw err;
    }
  }, [setAndManageObjectURL, updateConfig]);

  // Remove uploaded wallpaper from IndexedDB
  const removeUploadedWallpaper = useCallback(async () => {
    try {
      await deleteUploadedWallpaper();
      setAndManageObjectURL(null);

      updateConfig({
        wallpaperSource: 'official',
        wallpaperId: 'mountain',
        hasUploadedWallpaper: false,
      });
    } catch (err) {
      console.error('Failed to remove uploaded wallpaper:', err);
    }
  }, [setAndManageObjectURL, updateConfig]);

  // Reset all appearance settings to defaults
  const resetToDefaults = useCallback(async () => {
    try {
      await deleteUploadedWallpaper();
      setAndManageObjectURL(null);

      const defaults = { ...DEFAULT_APPEARANCE_CONFIG };
      setConfig(defaults);

      try {
        localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(defaults));
        localStorage.setItem('sift-theme', defaults.theme);
        localStorage.setItem('sift-density', defaults.density);
      } catch {}

      const { wallpaperUrl, accentColor } = resolveAppearanceState(defaults, null);
      applyAppearanceToDOM(defaults, wallpaperUrl, accentColor);
    } catch (err) {
      console.error('Failed to reset appearance:', err);
    }
  }, [setAndManageObjectURL]);

  const { wallpaperUrl: activeWallpaperUrl, accentColor: activeAccent } = resolveAppearanceState(
    config,
    uploadedWallpaperUrl
  );

  return (
    <AppearanceContext.Provider
      value={{
        config,
        updateConfig,
        resetToDefaults,
        uploadedWallpaperUrl,
        uploadWallpaper,
        removeUploadedWallpaper,
        activeWallpaperUrl,
        activeAccent,
        isReady,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
