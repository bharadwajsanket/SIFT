'use client';

import React from 'react';
import { MapIcon, CloseIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface LocationPromptProps {
  query: string;
  isLocationActive: boolean;
  onEnableLocation: () => void;
  onDisableLocation: () => void;
  onDismiss: () => void;
  isDismissed: boolean;
}

export function LocationPrompt({
  query,
  isLocationActive,
  onEnableLocation,
  onDisableLocation,
  onDismiss,
  isDismissed,
}: LocationPromptProps) {
  const isNearbyQuery = /\b(near me|nearby|around here|closest|local)\b/i.test(query);

  if (isLocationActive) {
    return (
      <div className={styles.locationActiveBanner}>
        <div className={styles.locationActiveInfo}>
          <span className={styles.locationDot} />
          <span>Location: Active for this search</span>
        </div>
        <button
          type="button"
          className={styles.disableLocationBtn}
          onClick={onDisableLocation}
          title="Disable location"
        >
          Disable
        </button>
      </div>
    );
  }

  if (!isNearbyQuery || isDismissed) {
    return null;
  }

  return (
    <div className={styles.locationPromptBanner}>
      <div className={styles.locationPromptContent}>
        <MapIcon size={16} className={styles.locationPromptIcon} />
        <div className={styles.locationPromptText}>
          <strong>Location required:</strong> This search can use your location to find nearby places.
        </div>
      </div>

      <div className={styles.locationPromptActions}>
        <button
          type="button"
          className={styles.useLocationBtn}
          onClick={onEnableLocation}
        >
          Use my location
        </button>
        <button
          type="button"
          className={styles.dismissPromptBtn}
          onClick={onDismiss}
          aria-label="Dismiss location request"
        >
          <CloseIcon size={14} />
        </button>
      </div>
    </div>
  );
}
