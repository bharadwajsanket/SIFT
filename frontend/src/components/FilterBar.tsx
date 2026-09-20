'use client';

import React from 'react';
import { FilterIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface FilterBarProps {
  timeRange: string;
  setTimeRange: (val: string) => void;
  safeSearch: string;
  setSafeSearch: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
}

export function FilterBar({
  timeRange,
  setTimeRange,
  safeSearch,
  setSafeSearch,
  language,
  setLanguage,
}: FilterBarProps) {
  const isTimeActive = timeRange && timeRange !== 'all';
  const isLangActive = language && language !== 'all';
  const isSafeActive = safeSearch && safeSearch !== '1';

  return (
    <div className={styles.filterStrip}>
      <div className={styles.filterScrollTrack}>
        <div className={styles.filterGroup}>
          <div className={styles.filterIconWrapper} title="Search Filters">
            <FilterIcon size={13} className={styles.filterIcon} />
          </div>
          
          <div className={`${styles.filterItem} ${isTimeActive ? styles.filterItemActive : ''}`}>
            <select
              className={styles.filterSelect}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Filter by time range"
            >
              <option value="all">Any time</option>
              <option value="day">Past 24 hours</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
              <option value="year">Past year</option>
            </select>
          </div>

          <div className={`${styles.filterItem} ${isSafeActive ? styles.filterItemActive : ''}`}>
            <select
              className={styles.filterSelect}
              value={safeSearch}
              onChange={(e) => setSafeSearch(e.target.value)}
              aria-label="Filter by safe search"
            >
              <option value="1">SafeSearch: Moderate</option>
              <option value="2">SafeSearch: Strict</option>
              <option value="0">SafeSearch: Off</option>
            </select>
          </div>

          <div className={`${styles.filterItem} ${isLangActive ? styles.filterItemActive : ''}`}>
            <select
              className={styles.filterSelect}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Filter by language"
            >
              <option value="all">All Languages</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
