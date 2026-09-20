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
        const enginesCount = item.engines.length;
        const enginesSummary = enginesCount <= 2 
          ? item.engines.join(', ')
          : `${item.engines.slice(0, 2).join(', ')} +${enginesCount - 2}`;

        return (
          <article 
            key={`${item.url}-${index}`} 
            className={`${styles.webCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelectResult(item)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.metaRow}>
              <span className={styles.domainDot} aria-hidden="true" />
              <span className={styles.domainName} title={item.domain}>{item.domain}</span>
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
                  <span>{enginesCount} {enginesCount === 1 ? 'source' : 'sources'}</span>
                </span>
                {enginesSummary && (
                  <span className={styles.sourceEngines} title={item.engines.join(', ')}>
                    ({enginesSummary})
                  </span>
                )}
              </div>

              <button 
                type="button"
                className={styles.inspectBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectResult(item);
                }}
                aria-label={`View details for ${item.title}`}
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
