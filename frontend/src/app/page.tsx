'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SiftLogo } from '@/components/SiftLogo';
import { 
  SearchIcon, 
  SettingsIcon, 
  CloseIcon, 
  GlobeIcon, 
  ImageIcon, 
  VideoIcon, 
  NewsIcon, 
  CodeIcon, 
  AcademicIcon, 
  MapIcon,
  ClockIcon,
  LayersIcon
} from '@/components/icons';
import { SettingsPanel } from '@/components/SettingsPanel';
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sift-recent-searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load recent searches:', e);
      }
    }
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const updated = [
      trimmed,
      ...recentSearches.filter((q) => q.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('sift-recent-searches', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('sift-recent-searches');
  };

  const deleteRecentSearch = (e: React.MouseEvent, qToDelete: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((q) => q !== qToDelete);
    setRecentSearches(updated);
    localStorage.setItem('sift-recent-searches', JSON.stringify(updated));
  };

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

  // Fetch suggestions with debounce
  useEffect(() => {
    const fetchPredictions = async () => {
      const isEnabled = typeof window !== 'undefined' && localStorage.getItem('sift-autocomplete') !== 'false';
      if (!isEnabled || !query.trim()) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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
    saveRecentSearch(trimmed);
    const effectiveCategory = catId || selectedCategory;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}&category=${effectiveCategory}`);
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[activeSuggestion];
        setQuery(selected);
        setShowSuggestions(false);
        executeSearch(selected);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.topBar}>
        <div className={styles.topBrand}>
          <span className={styles.brandTitle}>SIFT</span>
          <span className={styles.brandSubtitle}>SEARCH WORKSTATION</span>
        </div>
        <button 
          type="button" 
          className={styles.settingsIconBtn} 
          onClick={() => setIsSettingsOpen(true)}
          title="Preferences & Settings"
          aria-label="Open settings"
        >
          <SettingsIcon size={17} />
        </button>
      </header>

      <main className={styles.mainSection}>
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
              executeSearch(query);
            }}
          >
            <div className={styles.inputGroup}>
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
              >
                <SearchIcon size={16} />
              </button>
            </div>
          </form>

          {showSuggestions && suggestions.length > 0 && (
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

        {recentSearches.length > 0 ? (
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <div className={styles.recentTitleGroup}>
                <ClockIcon size={12} />
                <span className={styles.recentTitle}>RECENT SEARCHES</span>
              </div>
              <button 
                type="button" 
                className={styles.clearHistoryBtn}
                onClick={clearAllHistory}
              >
                Clear all
              </button>
            </div>

            <div className={styles.recentGrid}>
              {recentSearches.slice(0, 6).map((item) => (
                <div 
                  key={item} 
                  className={styles.recentChip}
                  onClick={() => {
                    setQuery(item);
                    executeSearch(item);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className={styles.recentChipText}>{item}</span>
                  <button
                    type="button"
                    className={styles.recentChipDeleteBtn}
                    onClick={(e) => deleteRecentSearch(e, item)}
                    aria-label={`Remove ${item} from history`}
                  >
                    <CloseIcon size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.statusPillsRow}>
            <div className={styles.statusPill}>
              <span className={styles.statusDot} />
              <span>LOCAL INSTANCE</span>
            </div>
            <div className={styles.statusDivider}>•</div>
            <div className={styles.statusPill}>
              <LayersIcon size={11} />
              <span>MULTI-ENGINE AGGREGATE</span>
            </div>
            <div className={styles.statusDivider}>•</div>
            <div className={styles.statusPill}>
              <span>ZERO TELEMETRY</span>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <span>SIFT</span>
          <span className={styles.footerDot}>•</span>
          <span className={styles.footerTag}>PRIVATE WORKSTATION</span>
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
