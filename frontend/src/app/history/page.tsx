'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiftLogo } from '@/components/SiftLogo';
import {
  ClockIcon,
  SearchIcon,
  TrashIcon,
  CloseIcon,
  ArrowLeftIcon,
  SettingsIcon,
} from '@/components/icons';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useSearchHistory, type HistorySortOrder, type SearchHistoryEntry } from '@/lib/searchHistory';
import styles from './history.module.css';

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [filterText, setFilterText] = useState('');
  const [sortOrder, setSortOrder] = useState<HistorySortOrder>('newest');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const modalCancelBtnRef = useRef<HTMLButtonElement>(null);

  const {
    history,
    isLoading,
    error,
    remove,
    clear,
    refresh,
  } = useSearchHistory({
    filter: filterText,
    sort: sortOrder,
  });

  // Set document title
  useEffect(() => {
    document.title = 'Search History — SIFT';
  }, []);

  // Keyboard shortcut listener (Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isClearModalOpen) {
        setIsClearModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClearModalOpen]);

  // Focus cancel button when modal opens
  useEffect(() => {
    if (isClearModalOpen) {
      modalCancelBtnRef.current?.focus();
    }
  }, [isClearModalOpen]);

  const handleSelectEntry = (query: string, category?: string) => {
    const cat = category || 'general';
    router.push(`/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}`);
  };

  const handleConfirmClear = async () => {
    await clear();
    setIsClearModalOpen(false);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Bar with Brand & Navigation */}
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.backHomeBtn} aria-label="Return to SIFT Home">
            <ArrowLeftIcon size={14} />
            <span>Home</span>
          </Link>
          <SiftLogo markSize={24} />
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open settings"
            title="Preferences & Settings"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageHeading}>
            <ClockIcon size={24} className={styles.headingIcon} />
            <span>Search History</span>
            <span className={styles.localBadge} title="Stored entirely on this device using IndexedDB">
              Local only
            </span>
          </h1>
          <p className={styles.pageSubtitle}>
            Your past web queries stored securely and privately in this browser.
          </p>
        </div>

        {/* Error notification if storage error occurs */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <span>{error}</span>
            <button
              type="button"
              className={styles.modalCancelBtn}
              onClick={() => refresh()}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Toolbar: Filter Search & Sort Controls */}
        <div className={styles.toolbarCard}>
          <div className={styles.searchRow}>
            <div className={styles.filterInputWrapper}>
              <SearchIcon size={15} className={styles.filterSearchIcon} />
              <input
                ref={filterInputRef}
                type="text"
                className={styles.filterInput}
                placeholder="Filter search history..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                aria-label="Filter search history"
                autoComplete="off"
                spellCheck={false}
              />
              {filterText && (
                <button
                  type="button"
                  className={styles.filterClearBtn}
                  onClick={() => {
                    setFilterText('');
                    filterInputRef.current?.focus();
                  }}
                  aria-label="Clear filter text"
                  title="Clear filter"
                >
                  <CloseIcon size={13} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.sortGroup}>
              <label htmlFor="history-sort" className={styles.sortLabel}>
                Sort
              </label>
              <select
                id="history-sort"
                className={styles.sortSelect}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as HistorySortOrder)}
                aria-label="Sort history entries"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="alpha">Alphabetical (A–Z)</option>
              </select>
            </div>

            {history.length > 0 && (
              <button
                type="button"
                className={styles.clearAllBtn}
                onClick={() => setIsClearModalOpen(true)}
                aria-label="Clear all search history"
              >
                <TrashIcon size={13} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* History Entry List or Empty State */}
        {history.length > 0 ? (
          <ul className={styles.historyList} aria-label="Search history entries">
            {history.map((entry: SearchHistoryEntry) => (
              <li
                key={entry.id}
                className={styles.historyRow}
                onClick={() => handleSelectEntry(entry.query, entry.category)}
                role="button"
                tabIndex={0}
                aria-label={`Search for "${entry.query}"`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectEntry(entry.query, entry.category);
                  }
                }}
              >
                <div className={styles.rowMain}>
                  <ClockIcon size={14} className={styles.rowIcon} />
                  <span className={styles.queryText} title={entry.query}>
                    {entry.query}
                  </span>
                </div>

                <div className={styles.rowMeta}>
                  {entry.category && entry.category !== 'general' && (
                    <span className={styles.categoryTag}>{entry.category}</span>
                  )}
                  <span className={styles.timeTag}>{formatTimeAgo(entry.timestamp)}</span>
                  <button
                    type="button"
                    className={styles.deleteItemBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(entry.id);
                    }}
                    aria-label={`Remove "${entry.query}" from history`}
                    title="Remove entry"
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : !isLoading ? (
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyIconCircle}>
              {filterText ? <SearchIcon size={22} /> : <ClockIcon size={22} />}
            </div>
            {filterText ? (
              <>
                <h2 className={styles.emptyTitle}>No matching queries</h2>
                <p className={styles.emptyDesc}>
                  No saved searches match &ldquo;{filterText}&rdquo;. Try another term or clear the filter.
                </p>
                <button
                  type="button"
                  className={styles.emptyActionBtn}
                  onClick={() => {
                    setFilterText('');
                    filterInputRef.current?.focus();
                  }}
                >
                  Clear filter
                </button>
              </>
            ) : (
              <>
                <h2 className={styles.emptyTitle}>No search history yet</h2>
                <p className={styles.emptyDesc}>
                  Your web searches will be preserved privately here. Pure arithmetic evaluations and keystrokes are never recorded.
                </p>
                <Link href="/" className={styles.emptyActionBtn}>
                  Start searching
                </Link>
              </>
            )}
          </div>
        ) : null}
      </main>

      {/* Confirmation Modal for Clear All */}
      {isClearModalOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
          onClick={() => setIsClearModalOpen(false)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <TrashIcon size={20} className={styles.modalWarnIcon} />
              <h2 id="clear-modal-title" className={styles.modalTitle}>
                Clear search history?
              </h2>
            </div>
            <p className={styles.modalBody}>
              This will permanently delete all stored search queries from this browser&apos;s local storage. This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                ref={modalCancelBtnRef}
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setIsClearModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleConfirmClear}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences & Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
