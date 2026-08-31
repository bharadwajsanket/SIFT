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
  MapIcon 
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
    ].slice(0, 5);
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

  // Keyboard shortcut listener for '⌘K', 'Ctrl+K', '/', and 'Escape'
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

  const executeSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(trimmed)}&category=${selectedCategory}`);
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
        <div className={styles.topBrand}>SIFT</div>
        <button 
          type="button" 
          className={styles.iconBtn} 
          onClick={() => setIsSettingsOpen(true)}
          title="Preferences & Settings"
          aria-label="Open settings"
        >
          <SettingsIcon size={16} />
        </button>
      </header>

      <main className={styles.mainSection}>
        <div className={styles.heroBrand}>
          <div className={styles.logoWrapper}>
            <SiftLogo 
              markSize={44} 
              orientation="vertical" 
              showTagline 
              variant="color" 
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
              <SearchIcon size={17} className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.mainInput}
                placeholder="What are you looking for?"
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

              <button 
                type="submit" 
                className={styles.searchSubmitAction}
                disabled={isPending}
                aria-label="Execute search"
              >
                <SearchIcon size={15} />
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
                  <SearchIcon size={13} className={styles.suggestionIcon} />
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
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {recentSearches.length > 0 ? (
          <div className={styles.recentContainer}>
            <div className={styles.recentHeader}>
              <span className={styles.recentTitle}>RECENT</span>
              <button 
                type="button" 
                className={styles.clearHistoryBtn}
                onClick={clearAllHistory}
              >
                Clear history
              </button>
            </div>
            <div className={styles.recentList}>
              {recentSearches.slice(0, 5).map((item) => (
                <div 
                  key={item} 
                  className={styles.recentRow}
                  onClick={() => {
                    setQuery(item);
                    executeSearch(item);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className={styles.recentText}>{item}</span>
                  <button
                    type="button"
                    className={styles.recentDeleteBtn}
                    onClick={(e) => deleteRecentSearch(e, item)}
                    aria-label={`Remove ${item}`}
                  >
                    <CloseIcon size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.signatureLine}>
            <span>LOCAL INSTANCE</span>
            <span className={styles.signatureSep}>/</span>
            <span>MULTI-ENGINE</span>
            <span className={styles.signatureSep}>/</span>
            <span>PRIVATE</span>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <span>SIFT</span>
        <div className={styles.footerLinks}>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
