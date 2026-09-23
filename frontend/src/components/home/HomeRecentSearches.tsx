'use client';

import React from 'react';
import { ClockIcon, CloseIcon } from '@/components/icons';
import styles from '@/app/page.module.css';

interface HomeRecentSearchesProps {
  searches: string[];
  onSelectSearch: (query: string) => void;
  onDeleteSearch: (query: string) => void;
  onClearAll: () => void;
  maxItems?: number;
}

export function HomeRecentSearches({
  searches,
  onSelectSearch,
  onDeleteSearch,
  onClearAll,
  maxItems = 5,
}: HomeRecentSearchesProps) {
  if (!searches || searches.length === 0) return null;

  const displayItems = searches.slice(0, maxItems);

  return (
    <div className={styles.spatialModule}>
      <div className={styles.moduleCard}>
        <div className={styles.moduleHeader}>
          <div className={styles.moduleHeaderTitle}>
            <ClockIcon size={12} className={styles.moduleHeaderIcon} />
            <span className={styles.moduleLabel}>RECENT QUERIES</span>
          </div>
          <button
            type="button"
            className={styles.moduleActionBtn}
            onClick={onClearAll}
            title="Clear all recent searches"
          >
            Clear
          </button>
        </div>
        <div className={styles.recentList}>
          {displayItems.map((item) => (
            <div
              key={item}
              className={styles.recentItemRow}
              onClick={() => onSelectSearch(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSearch(item);
                }
              }}
            >
              <span className={styles.recentQueryText}>{item}</span>
              <button
                type="button"
                className={styles.recentDeleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSearch(item);
                }}
                aria-label={`Remove "${item}" from history`}
                title="Remove query"
              >
                <CloseIcon size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
