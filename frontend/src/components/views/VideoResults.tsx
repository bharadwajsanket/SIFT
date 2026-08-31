import React, { useState } from 'react';
import { SiftResult } from '@/app/api/search/route';
import { VideoIcon, ClockIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface VideoResultsProps {
  results: SiftResult[];
  onSelectResult: (result: SiftResult) => void;
}

export function VideoResults({ results, onSelectResult }: VideoResultsProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <div className={styles.videoGrid}>
      {results.map((item, index) => {
        const thumb = item.thumbnailSrc || item.imgSrc;
        const isFailed = !thumb || failedImages[thumb];

        return (
          <article 
            key={`${item.url}-${index}`} 
            className={styles.videoCard}
            onClick={() => onSelectResult(item)}
          >
            <div className={styles.videoThumbWrapper}>
              {!isFailed && thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt={item.title}
                  className={styles.videoThumb}
                  loading="lazy"
                  onError={() => setFailedImages((prev) => ({ ...prev, [thumb]: true }))}
                />
              ) : (
                <div className={styles.videoFallback}>
                  <VideoIcon size={28} />
                </div>
              )}

              {item.length && (
                <span className={styles.durationBadge}>
                  <ClockIcon size={10} />
                  {item.length}
                </span>
              )}
            </div>

            <div className={styles.videoContent}>
              <div className={styles.videoMetaHeader}>
                <span className={styles.videoDomain}>{item.domain}</span>
                {item.uploader && (
                  <span className={styles.uploaderName}>• {item.uploader}</span>
                )}
              </div>

              <h3 className={styles.videoTitle}>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title}
                </a>
              </h3>

              {item.content && (
                <p className={styles.videoSnippet}>{item.content}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
