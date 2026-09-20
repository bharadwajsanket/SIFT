'use client';

import React from 'react';
import { SiftResult } from '@/app/api/search/route';
import { CloseIcon, LayersIcon, ExternalLinkIcon, DownloadIcon, ImageIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface ResultDetailsProps {
  result: SiftResult | null;
  onClose: () => void;
  onOpenLightbox?: (result: SiftResult) => void;
}

export function ResultDetails({ result, onClose, onOpenLightbox }: ResultDetailsProps) {
  if (!result) return null;

  const isImage = result.category === 'images' || result.template === 'images.html';
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
      console.warn('Download proxy error:', e);
    }
    // Fallback: Open original image directly in a new tab
    window.open(fullImageSrc, '_blank');
  };

  return (
    <div className={styles.inspectorCard} onClick={(e) => e.stopPropagation()}>
      <div className={styles.bottomSheetHandle} aria-hidden="true" />
      <div className={styles.inspectorHeader}>
        <div className={styles.inspectorTitle}>
          <LayersIcon size={14} />
          <span>{isImage ? 'Image Details' : 'Result Inspector'}</span>
        </div>
        <button 
          type="button" 
          className={styles.closeBtn} 
          onClick={onClose}
          aria-label="Close details"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className={styles.inspectorBody}>
        {/* Large Image Preview Card if Image Result */}
        {isImage && fullImageSrc && (
          <div className={styles.inspectorImageCard}>
            <div 
              className={styles.inspectorImagePreviewWrapper} 
              onClick={() => onOpenLightbox && onOpenLightbox(result)}
              title="Click to view full preview"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullImageSrc}
                alt={result.title}
                className={styles.inspectorImageThumb}
                loading="lazy"
              />
              <div className={styles.inspectorImageZoomHint}>
                <ImageIcon size={14} />
                <span>Click to Expand</span>
              </div>
            </div>

            <div className={styles.inspectorImageActions}>
              {onOpenLightbox && (
                <button
                  type="button"
                  className={styles.primaryActionButton}
                  onClick={() => onOpenLightbox(result)}
                >
                  <ImageIcon size={13} />
                  <span>Preview</span>
                </button>
              )}

              <button
                type="button"
                className={styles.primaryActionButton}
                onClick={handleDownload}
                title="Download or open original image"
              >
                <DownloadIcon size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}

        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Title</span>
          <h4 className={styles.detailHeading}>{result.title}</h4>
        </div>

        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Source Destination</span>
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.detailUrl}
          >
            <span>{result.url}</span>
            <ExternalLinkIcon size={11} />
          </a>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.gridItem}>
            <span className={styles.itemLabel}>Category</span>
            <span className={styles.itemValue}>{result.category}</span>
          </div>

          <div className={styles.gridItem}>
            <span className={styles.itemLabel}>Domain</span>
            <span className={styles.itemValue}>{result.domain}</span>
          </div>

          {result.resolution && (
            <div className={styles.gridItem}>
              <span className={styles.itemLabel}>Dimensions</span>
              <span className={styles.itemValue}>{result.resolution}</span>
            </div>
          )}

          {result.positions && result.positions.length > 0 && (
            <div className={styles.gridItem}>
              <span className={styles.itemLabel}>Aggregator Rank</span>
              <span className={styles.itemValue}>#{result.positions.join(', #')}</span>
            </div>
          )}

          {typeof result.score === 'number' && (
            <div className={styles.gridItem}>
              <span className={styles.itemLabel}>Backend Score</span>
              <span className={styles.itemValue}>{result.score.toFixed(4)}</span>
            </div>
          )}

          {result.licenseName && (
            <div className={styles.gridItem}>
              <span className={styles.itemLabel}>License</span>
              <span className={styles.itemValue}>{result.licenseName}</span>
            </div>
          )}
        </div>

        <div className={styles.detailSection}>
          <span className={styles.detailLabel}>Aggregated Search Engines</span>
          <div className={styles.engineTags}>
            {result.engines.map((eng) => (
              <span key={eng} className={styles.engineBadge}>
                {eng}
              </span>
            ))}
          </div>
        </div>

        {result.publishedDate && (
          <div className={styles.detailSection}>
            <span className={styles.detailLabel}>Published Date</span>
            <span className={styles.itemValue}>
              {new Date(result.publishedDate).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
