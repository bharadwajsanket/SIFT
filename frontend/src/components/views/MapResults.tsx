'use client';

import React, { useState, useEffect } from 'react';
import { SiftResult } from '@/app/api/search/route';
import { MapIcon, ExternalLinkIcon, LayersIcon } from '@/components/icons';
import { getMapProvider, MAP_PROVIDERS, DEFAULT_MAP_PROVIDER_ID } from '@/lib/mapProviders';
import styles from '@/app/search/search.module.css';

interface MapResultsProps {
  results: SiftResult[];
  selectedResult: SiftResult | null;
  onSelectResult: (result: SiftResult) => void;
}

export function MapResults({ results, selectedResult, onSelectResult }: MapResultsProps) {
  const [providerId, setProviderId] = useState<string>(DEFAULT_MAP_PROVIDER_ID);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sift-map-provider') || DEFAULT_MAP_PROVIDER_ID;
      setProviderId(stored);
    }
  }, []);

  const activeProvider = getMapProvider(providerId);

  return (
    <div className={styles.mapList}>
      {results.map((item, index) => {
        const isSelected = selectedResult === item;
        const addressParts = [];
        if (item.address?.road) addressParts.push(item.address.road);
        if (item.address?.locality) addressParts.push(item.address.locality);
        if (item.address?.country) addressParts.push(item.address.country);

        const primaryMapUrl = activeProvider.buildPlaceUrl(item.title, item.latitude, item.longitude);

        return (
          <article 
            key={`${item.url}-${index}`} 
            className={`${styles.mapCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelectResult(item)}
          >
            <div className={styles.mapHeader}>
              <div className={styles.mapMeta}>
                <MapIcon size={14} className={styles.mapIcon} />
                <span className={styles.domainName}>{item.domain}</span>
                {typeof item.latitude === 'number' && typeof item.longitude === 'number' && (
                  <span className={styles.coordsTag}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </span>
                )}
              </div>

              <a 
                href={primaryMapUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.primaryMapAction}
                onClick={(e) => e.stopPropagation()}
                title={`Open in ${activeProvider.displayName}`}
              >
                <span>Open in {activeProvider.displayName}</span>
                <ExternalLinkIcon size={11} />
              </a>
            </div>

            <h2 className={styles.mapTitle}>
              <a 
                href={primaryMapUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {item.title}
              </a>
            </h2>

            {addressParts.length > 0 && (
              <p className={styles.addressLine}>
                {addressParts.join(', ')}
              </p>
            )}

            {item.content && (
              <p className={styles.snippet}>{item.content}</p>
            )}

            <div className={styles.mapAltRow}>
              <span className={styles.altLabel}>Alternative destinations:</span>
              <div className={styles.altLinks}>
                {Object.values(MAP_PROVIDERS)
                  .filter((p) => p.id !== activeProvider.id)
                  .map((p) => (
                    <a
                      key={p.id}
                      href={p.buildPlaceUrl(item.title, item.latitude, item.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.altLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.displayName}
                    </a>
                  ))}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.sourceBadges}>
                <span className={styles.sourceCount}>
                  <LayersIcon size={12} />
                  {item.engines.length} {item.engines.length === 1 ? 'source' : 'sources'}
                </span>
                <span className={styles.sourceEngines}>
                  ({item.engines.join(', ')})
                </span>
              </div>

              <button 
                type="button"
                className={styles.inspectBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectResult(item);
                }}
              >
                Details
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
