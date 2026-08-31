'use client';

import React, { useEffect, useState } from 'react';
import { SiftResult } from '@/app/api/search/route';
import { CloseIcon, DownloadIcon, ExternalLinkIcon, ImageIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface ImageLightboxProps {
  result: SiftResult | null;
  onClose: () => void;
}

export function ImageLightbox({ result, onClose }: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [result]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!result) return null;

  const fullImageSrc = result.imgSrc || result.thumbnailSrc;

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
    // Fallback: Open original image directly in a new tab
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
      <div className={styles.lightboxContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.lightboxHeader}>
          <div className={styles.lightboxMeta}>
            <span className={styles.lightboxDomain}>{result.domain}</span>
            {result.resolution && (
              <span className={styles.lightboxResolution}>{result.resolution}</span>
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
        </div>

        <div className={styles.lightboxFooter}>
          <h3 id="lightbox-title" className={styles.lightboxTitle}>
            {result.title}
          </h3>
        </div>
      </div>
    </div>
  );
}
