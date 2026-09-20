'use client';

import React, { useState } from 'react';
import { SiftResult } from '@/app/api/search/route';
import { ImageIcon, ExternalLinkIcon, MaximizeIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface ImageResultsProps {
  results: SiftResult[];
  selectedResult?: SiftResult | null;
  onSelectResult: (result: SiftResult) => void;
  onOpenLightbox?: (result: SiftResult, index: number) => void;
}

export function ImageResults({ 
  results, 
  selectedResult, 
  onSelectResult,
  onOpenLightbox 
}: ImageResultsProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (url: string) => {
    setFailedImages((prev) => ({ ...prev, [url]: true }));
  };

  const handleClick = (item: SiftResult, index: number) => {
    onSelectResult(item);
    if (onOpenLightbox) {
      onOpenLightbox(item, index);
    }
  };

  return (
    <div className={styles.imageMasonryGrid}>
      {results.map((item, index) => {
        const imageSource = item.thumbnailSrc || item.imgSrc;
        const isFailed = !imageSource || failedImages[imageSource];
        const isSelected = selectedResult === item;

        return (
          <div 
            key={`${item.url}-${index}`} 
            className={`${styles.imageMasonryCard} ${isSelected ? styles.imageMasonryCardSelected : ''}`}
            onClick={() => handleClick(item, index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(item, index);
              }
            }}
            title={item.title || 'Click to enlarge image'}
          >
            <div className={styles.imageMasonryWrapper}>
              {!isFailed && imageSource ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSource}
                  alt={item.title || 'Image search result'}
                  className={styles.imageMasonryThumb}
                  loading="lazy"
                  onError={() => handleImageError(imageSource)}
                />
              ) : (
                <div className={styles.imageFallback}>
                  <ImageIcon size={22} className={styles.fallbackIcon} />
                  <span>Preview unavailable</span>
                </div>
              )}

              <div className={styles.imageOverlayAction}>
                <MaximizeIcon size={14} />
              </div>

              {item.resolution && (
                <span className={styles.imageResolution}>{item.resolution}</span>
              )}
            </div>

            <div className={styles.imageInfo}>
              <h3 className={styles.imageTitle} title={item.title}>
                {item.title || item.domain}
              </h3>
              <div className={styles.imageMeta}>
                <span className={styles.imageDomain}>{item.domain}</span>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.imageLink}
                  onClick={(e) => e.stopPropagation()}
                  title="Open source page"
                >
                  <ExternalLinkIcon size={11} />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
