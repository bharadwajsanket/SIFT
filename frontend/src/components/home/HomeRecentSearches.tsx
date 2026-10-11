'use client';

import React from 'react';
import Link from 'next/link';
import { ClockIcon, CloseIcon, ArrowRightIcon } from '@/components/icons';
import { useSearchHistory, type SearchHistoryEntry } from '@/lib/searchHistory';
import styles from '@/app/page.module.css';

interface HomeRecentSearchesProps {
  onSelectSearch: (query: string, category?: string) => void;
  maxItems?: number;
  onDismiss?: () => void;
}

export function HomeRecentSearches({
  onSelectSearch,
  maxItems = 5,
  onDismiss,
}: HomeRecentSearchesProps) {
  const { history, isLoading, remove, clear } = useSearchHistory({
    limit: maxItems,
  });

  return (
    <div className={styles.spatialModule}>
      <div className={styles.moduleCard}>
        <div className={styles.moduleHeader}>
          <div className={styles.moduleHeaderTitle}>
            <ClockIcon size={12} className={styles.moduleHeaderIcon} />
            <span className={styles.moduleLabel}>RECENT QUERIES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {history.length > 0 && (
              <button
                type="button"
                className={styles.moduleActionBtn}
                onClick={() => clear()}
                title="Clear all recent searches"
                aria-label="Clear all recent searches"
              >
                Clear
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                className={styles.moduleActionBtn}
                onClick={onDismiss}
                title="Hide module"
                aria-label="Hide recent searches module"
              >
                <CloseIcon size={11} />
              </button>
            )}
          </div>
        </div>

        {history.length > 0 ? (
          <>
            <div className={styles.recentList}>
              {history.map((entry: SearchHistoryEntry) => (
                <div
                  key={entry.id}
                  className={styles.recentItemRow}
                  onClick={() => onSelectSearch(entry.query, entry.category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSearch(entry.query, entry.category);
                    }
                  }}
                  title={entry.query}
                >
                  <span className={styles.recentItemQuery}>{entry.query}</span>
                  <button
                    type="button"
                    className={styles.recentDeleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(entry.id);
                    }}
                    aria-label={`Remove "${entry.query}" from history`}
                    title="Remove query"
                  >
                    <CloseIcon size={11} />
                  </button>
                </div>
              ))}
            </div>
            <Link href="/history" className={styles.recentFooterLink}>
              <span>Full history</span>
              <ArrowRightIcon size={11} />
            </Link>
          </>
        ) : !isLoading ? (
          <div className={styles.recentEmptyState}>
            <span>No recent searches</span>
            <div style={{ marginTop: '0.35rem' }}>
              <Link href="/history" className={styles.recentFooterLink} style={{ justifyContent: 'center' }}>
                <span>Open History</span>
                <ArrowRightIcon size={11} />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
