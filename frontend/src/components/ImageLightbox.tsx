'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SiftResult } from '@/app/api/search/route';
import { 
  CloseIcon, 
  DownloadIcon, 
  ExternalLinkIcon, 
  ImageIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface ImageLightboxProps {
  result: SiftResult | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export function ImageLightbox({ 
  result, 
  onClose, 
  onPrev, 
  onNext, 
  hasPrev = false, 
  hasNext = false,
  currentIndex,
  totalCount 
}: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [result]);

  const handlePrev = useCallback(() => {
    if (hasPrev && onPrev) onPrev();
  }, [hasPrev, onPrev]);

  const handleNext = useCallback(() => {
    if (hasNext && onNext) onNext();
  }, [hasNext, onNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!result) return null;

  const fullImageSrc = result.imgSrc || result.thumbnailSrc;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && hasNext) {
      handleNext();
    } else if (isRightSwipe && hasPrev) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleDownload = async () => {
    if (!fullImageSrc) return;
    try {
      const downloadUrl = `/api/image-proxy?url=${encodeURIComponent(fullImageSrc)}`;
      const res = await fetch(downloadUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `sift-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        return;
      }
    } catch (e) {
      console.warn('Download error:', e);
    }
    window.open(fullImageSrc, '_blank');
  };

  return (
    <div 
      className={styles.lightboxOverlay} 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="lightbox-title"
    >
      <div 
        className={styles.lightboxContainer} 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.lightboxHeader}>
          <div className={styles.lightboxMeta}>
            <span className={styles.lightboxDomain}>{result.domain}</span>
            {result.resolution && (
              <span className={styles.lightboxResolution}>{result.resolution}</span>
            )}
            {currentIndex !== undefined && totalCount !== undefined && totalCount > 0 && (
              <span className={styles.lightboxCounter}>
                {currentIndex + 1} / {totalCount}
              </span>
            )}
          </div>

          <div className={styles.lightboxTopActions}>
            <button
              type="button"
              className={styles.lightboxActionBtn}
              onClick={handleDownload}
              title="Download image"
              aria-label="Download image"
            >
              <DownloadIcon size={14} />
              <span>Download</span>
            </button>

            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.lightboxActionBtn}
              title="Open source page"
            >
              <span>Source</span>
              <ExternalLinkIcon size={12} />
            </a>

            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={onClose}
              aria-label="Close preview"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className={styles.lightboxImageArea}>
          {hasPrev && (
            <button
              type="button"
              className={`${styles.lightboxNavBtn} ${styles.lightboxNavPrev}`}
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              aria-label="Previous image"
              title="Previous image (←)"
            >
              <ChevronLeftIcon size={24} />
            </button>
          )}

          {!error && fullImageSrc ? (
            <>
              {!loaded && (
                <div className={styles.lightboxLoading}>
                  <span>Loading full resolution...</span>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullImageSrc}
                alt={result.title}
                className={`${styles.lightboxImage} ${loaded ? styles.lightboxImageVisible : ''}`}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
              />
            </>
          ) : (
            <div className={styles.lightboxFallback}>
              <ImageIcon size={36} />
              <p>Full preview unavailable from host</p>
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.fallbackLink}
              >
                Visit original page <ExternalLinkIcon size={12} />
              </a>
            </div>
          )}

          {hasNext && (
            <button
              type="button"
              className={`${styles.lightboxNavBtn} ${styles.lightboxNavNext}`}
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              aria-label="Next image"
              title="Next image (→)"
            >
              <ChevronRightIcon size={24} />
            </button>
          )}
        </div>

        <div className={styles.lightboxFooter}>
          <div className={styles.lightboxFooterContent}>
            <h3 id="lightbox-title" className={styles.lightboxTitle}>
              {result.title}
            </h3>
            {result.content && (
              <p className={styles.lightboxSnippet}>{result.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
