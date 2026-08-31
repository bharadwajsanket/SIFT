import React from 'react';
import { SiftResult } from '@/app/api/search/route';
import { NewsIcon, LayersIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface NewsResultsProps {
  results: SiftResult[];
  selectedResult: SiftResult | null;
  onSelectResult: (result: SiftResult) => void;
}

export function NewsResults({ results, selectedResult, onSelectResult }: NewsResultsProps) {
  return (
    <div className={styles.newsList}>
      {results.map((item, index) => {
        const isSelected = selectedResult === item;
        const outlet = item.source || item.domain;
        const dateStr = item.publishedDate 
          ? new Date(item.publishedDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : null;

        return (
          <article 
            key={`${item.url}-${index}`} 
            className={`${styles.newsCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelectResult(item)}
          >
            <div className={styles.newsMain}>
              <div className={styles.newsHeader}>
                <span className={styles.newsOutlet}>
                  <NewsIcon size={12} />
                  {outlet}
                </span>
                {dateStr && <span className={styles.newsDate}>• {dateStr}</span>}
              </div>

              <h2 className={styles.newsTitle}>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title}
                </a>
              </h2>

              {item.content && (
                <p className={styles.newsSnippet}>{item.content}</p>
              )}

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
            </div>

            {item.thumbnailSrc && (
              <div className={styles.newsThumbWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={item.thumbnailSrc} 
                  alt="" 
                  className={styles.newsThumb}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
