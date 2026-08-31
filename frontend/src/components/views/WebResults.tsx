import React from 'react';
import { SiftResult } from '@/app/api/search/route';
import { LayersIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface WebResultsProps {
  results: SiftResult[];
  selectedResult: SiftResult | null;
  onSelectResult: (result: SiftResult) => void;
}

export function WebResults({ results, selectedResult, onSelectResult }: WebResultsProps) {
  return (
    <div className={styles.webList}>
      {results.map((item, index) => {
        const isSelected = selectedResult === item;
        return (
          <article 
            key={`${item.url}-${index}`} 
            className={`${styles.webCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelectResult(item)}
          >
            <div className={styles.metaRow}>
              <span className={styles.domainName}>{item.domain}</span>
              {item.publishedDate && (
                <span className={styles.pubDate}>
                  • {new Date(item.publishedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <h2 className={styles.resultTitle}>
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
              <p className={styles.snippet}>{item.content}</p>
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
          </article>
        );
      })}
    </div>
  );
}
