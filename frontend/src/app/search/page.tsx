'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SiftResult } from '@/app/api/search/route';
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
  ArrowLeftIcon,
  ArrowRightIcon
} from '@/components/icons';
import { WebResults } from '@/components/views/WebResults';
import { ImageResults } from '@/components/views/ImageResults';
import { VideoResults } from '@/components/views/VideoResults';
import { NewsResults } from '@/components/views/NewsResults';
import { CodeResults } from '@/components/views/CodeResults';
import { AcademicResults } from '@/components/views/AcademicResults';
import { MapResults } from '@/components/views/MapResults';
import { ResultDetails } from '@/components/ResultDetails';
import { FilterBar } from '@/components/FilterBar';
import { SettingsPanel } from '@/components/SettingsPanel';
import { LocationPrompt } from '@/components/LocationPrompt';
import { ImageLightbox } from '@/components/ImageLightbox';
import styles from './search.module.css';

const CATEGORIES = [
  { id: 'all', label: 'Web', icon: GlobeIcon },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: VideoIcon },
  { id: 'news', label: 'News', icon: NewsIcon },
  { id: 'code', label: 'Code', icon: CodeIcon },
  { id: 'academic', label: 'Academic', icon: AcademicIcon },
  { id: 'maps', label: 'Maps', icon: MapIcon },
];

function SearchController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(queryParam);
  const [searchInput, setSearchInput] = useState(queryParam);
  const [category, setCategory] = useState(categoryParam);

  // Filters
  const [timeRange, setTimeRange] = useState('all');
  const [language, setLanguage] = useState('all');
  const [safeSearch, setSafeSearch] = useState('1');
  const [page, setPage] = useState(1);

  // Results & metadata
  const [results, setResults] = useState<SiftResult[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [duration, setDuration] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Location privacy state (strictly ephemeral session memory)
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocationDismissed, setIsLocationDismissed] = useState(false);

  // Inspector, Lightbox & Settings
  const [selectedResult, setSelectedResult] = useState<SiftResult | null>(null);
  const [lightboxResult, setLightboxResult] = useState<SiftResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync params from URL
  useEffect(() => {
    setQuery(queryParam);
    setSearchInput(queryParam);
    setCategory(categoryParam);
    setPage(1);
  }, [queryParam, categoryParam]);

  // Load safeSearch setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sift-safesearch') || '1';
      setSafeSearch(stored);
    }
  }, [isSettingsOpen]);

  // Main search fetcher
  useEffect(() => {
    const executeFetch = async () => {
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      setSelectedResult(null);

      try {
        const url = new URL('/api/search', window.location.origin);
        
        let effectiveQuery = query;
        if (isLocationActive && userLocation) {
          effectiveQuery = `${query} ${userLocation.lat.toFixed(4)},${userLocation.lon.toFixed(4)}`;
        }

        url.searchParams.set('q', effectiveQuery);
        url.searchParams.set('category', category);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('time_range', timeRange);
        url.searchParams.set('language', language);
        url.searchParams.set('safesearch', safeSearch);

        // Read user-configured engines if any
        try {
          const storedEngines = localStorage.getItem('sift-engines');
          if (storedEngines) {
            const parsed = JSON.parse(storedEngines);
            const enabledList = Object.entries(parsed)
              .filter(([_, enabled]) => enabled)
              .map(([eng]) => eng);
            if (enabledList.length > 0) {
              url.searchParams.set('engines', enabledList.join(','));
            }
          }
        } catch {}

        const response = await fetch(url.toString());
        const data = await response.json();

        if (response.ok) {
          setResults(data.results || []);
          setResultCount(data.count || 0);
          setDuration(data.duration || '0.00');
          if (data.results && data.results.length > 0) {
            setSelectedResult(data.results[0]);
          }
        } else {
          setError(data.error || 'Failed to retrieve search results.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Unable to contact SIFT aggregator.');
      } finally {
        setLoading(false);
      }
    };

    executeFetch();
  }, [query, category, page, timeRange, language, safeSearch, isLocationActive, userLocation]);

  // Explicit location permission handler
  const handleEnableLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          setIsLocationActive(true);
        },
        (err) => {
          console.warn('Geolocation permission denied or unavailable:', err);
          setIsLocationDismissed(true);
        },
        { timeout: 8000 }
      );
    }
  };

  const handleDisableLocation = () => {
    setIsLocationActive(false);
    setUserLocation(null);
  };

  // Header autocomplete
  useEffect(() => {
    const fetchPredictions = async () => {
      if (!searchInput.trim()) {
        setSuggestions([]);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(searchInput)}`, {
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
  }, [searchInput]);

  // Global keydown listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (newQuery: string) => {
    const trimmed = newQuery.trim();
    if (!trimmed) return;
    setShowSuggestions(false);
    setQuery(trimmed);

    // Save recent searches
    try {
      const stored = localStorage.getItem('sift-recent-searches');
      const list = stored ? JSON.parse(stored) : [];
      const updated = [trimmed, ...list.filter((q: string) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      localStorage.setItem('sift-recent-searches', JSON.stringify(updated));
    } catch {}

    const params = new URLSearchParams();
    params.set('q', trimmed);
    params.set('category', category);
    router.push(`/search?${params.toString()}`);
  };

  const handleCategorySwitch = (catId: string) => {
    setCategory(catId);
    setPage(1);
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('category', catId);
    router.push(`/search?${params.toString()}`);
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
        setSearchInput(selected);
        handleSearchSubmit(selected);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  return (
    <div className={styles.searchContainer}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand} onClick={() => router.push('/')} title="Return to SIFT Home" role="button" tabIndex={0}>
            <SiftLogo markSize={24} variant="color" />
          </div>

          <div className={styles.searchFormWrapper} ref={searchBoxRef}>
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(searchInput); }}>
              <div className={styles.inputGroup}>
                <SearchIcon size={16} className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestion(-1);
                  }}
                  onKeyDown={handleInputKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  autoComplete="off"
                  spellCheck="false"
                />

                {searchInput && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={() => {
                      setSearchInput('');
                      setSuggestions([]);
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear query"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}

                <button type="submit" className={styles.searchSubmitBtn} aria-label="Submit search">
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
                      setSearchInput(item);
                      handleSearchSubmit(item);
                    }}
                  >
                    <SearchIcon size={14} className={styles.suggestionIcon} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setIsSettingsOpen(true)}
              title="Preferences & Settings"
              aria-label="Open settings"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>

        <nav className={styles.categoryBar} aria-label="Categories">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ''}`}
                onClick={() => handleCategorySwitch(cat.id)}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <FilterBar
        timeRange={timeRange}
        setTimeRange={(val) => { setTimeRange(val); setPage(1); }}
        safeSearch={safeSearch}
        setSafeSearch={(val) => { setSafeSearch(val); setPage(1); }}
        language={language}
        setLanguage={(val) => { setLanguage(val); setPage(1); }}
      />

      <LocationPrompt
        query={query}
        isLocationActive={isLocationActive}
        onEnableLocation={handleEnableLocation}
        onDisableLocation={handleDisableLocation}
        onDismiss={() => setIsLocationDismissed(true)}
        isDismissed={isLocationDismissed}
      />

      <main className={`${styles.mainLayout} ${!selectedResult ? styles.singleColumnLayout : ''}`}>
        <section className={styles.resultsArea}>
          {!loading && !error && results.length > 0 && (
            <div className={styles.metricsRow}>
              <span>{resultCount} results</span>
              <span> ({duration}s)</span>
            </div>
          )}

          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonLine} style={{ width: '25%', height: '10px' }} />
                  <div className={styles.skeletonLine} style={{ width: '60%', height: '16px' }} />
                  <div className={styles.skeletonLine} style={{ width: '90%', height: '12px' }} />
                  <div className={styles.skeletonLine} style={{ width: '75%', height: '12px' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={styles.errorBox}>
              <h2 className={styles.errorTitle}>Aggregation Error</h2>
              <p className={styles.errorMsg}>{error}</p>
              <button type="button" className={styles.retryBtn} onClick={() => setQuery(query)}>
                Retry Search
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className={styles.errorBox}>
              <h2 className={styles.errorTitle} style={{ color: 'var(--text)' }}>No Results Found</h2>
              <p className={styles.errorMsg}>
                No entries found for &quot;{query}&quot; in category &quot;{category}&quot;. Try broadening search terms or changing filters.
              </p>
            </div>
          ) : (
            <>
              {category === 'images' && (
                <ImageResults 
                  results={results} 
                  selectedResult={selectedResult}
                  onSelectResult={(item) => setSelectedResult(item)} 
                />
              )}
              {category === 'videos' && (
                <VideoResults results={results} onSelectResult={setSelectedResult} />
              )}
              {category === 'news' && (
                <NewsResults results={results} selectedResult={selectedResult} onSelectResult={setSelectedResult} />
              )}
              {category === 'code' && (
                <CodeResults results={results} selectedResult={selectedResult} onSelectResult={setSelectedResult} />
              )}
              {category === 'academic' && (
                <AcademicResults results={results} selectedResult={selectedResult} onSelectResult={setSelectedResult} />
              )}
              {category === 'maps' && (
                <MapResults results={results} selectedResult={selectedResult} onSelectResult={setSelectedResult} />
              )}
              {category === 'all' && (
                <WebResults results={results} selectedResult={selectedResult} onSelectResult={setSelectedResult} />
              )}

              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                >
                  <ArrowLeftIcon size={12} />
                  <span>Previous</span>
                </button>
                
                <span className={styles.pageNumber}>Page {page}</span>
                
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={results.length < 5}
                >
                  <span>Next</span>
                  <ArrowRightIcon size={12} />
                </button>
              </div>
            </>
          )}
        </section>

        {!loading && selectedResult && (
          <aside 
            className={styles.sideColumn}
            onClick={() => {
              if (window.innerWidth <= 900) {
                setSelectedResult(null);
              }
            }}
          >
            <ResultDetails 
              result={selectedResult} 
              onClose={() => setSelectedResult(null)} 
              onOpenLightbox={(res) => setLightboxResult(res)}
            />
          </aside>
        )}
      </main>

      <ImageLightbox 
        result={lightboxResult} 
        onClose={() => setLightboxResult(null)} 
      />

      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0d0e12', color: '#f4f5f7', fontFamily: 'monospace' }}>
        Loading SIFT search...
      </div>
    }>
      <SearchController />
    </Suspense>
  );
}
