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
  return (
    <div className={styles.filterStrip}>
      <div className={styles.filterGroup}>
        <FilterIcon size={13} className={styles.filterIcon} />
        
        <select
          className={styles.filterSelect}
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          aria-label="Time range"
        >
          <option value="all">Any time</option>
          <option value="day">Past 24 hours</option>
          <option value="week">Past week</option>
          <option value="month">Past month</option>
          <option value="year">Past year</option>
        </select>

        <select
          className={styles.filterSelect}
          value={safeSearch}
          onChange={(e) => setSafeSearch(e.target.value)}
          aria-label="SafeSearch"
        >
          <option value="1">SafeSearch: Moderate</option>
          <option value="2">SafeSearch: Strict</option>
          <option value="0">SafeSearch: Off</option>
        </select>

        <select
          className={styles.filterSelect}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Language"
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
  );
}
