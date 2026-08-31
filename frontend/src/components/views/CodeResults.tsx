import React from 'react';
import { SiftResult } from '@/app/api/search/route';
import { CodeIcon, StarIcon, ExternalLinkIcon, LayersIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface CodeResultsProps {
  results: SiftResult[];
  selectedResult: SiftResult | null;
  onSelectResult: (result: SiftResult) => void;
}

export function CodeResults({ results, selectedResult, onSelectResult }: CodeResultsProps) {
  return (
    <div className={styles.codeList}>
      {results.map((item, index) => {
        const isSelected = selectedResult === item;
        const displayName = item.packageName || item.title;

        return (
          <article 
            key={`${item.url}-${index}`} 
            className={`${styles.codeCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelectResult(item)}
          >
            <div className={styles.codeHeader}>
              <div className={styles.codeMeta}>
                <CodeIcon size={14} className={styles.codeIcon} />
                <span className={styles.domainName}>{item.domain}</span>
                {item.maintainer && (
                  <span className={styles.maintainerTag}>by {item.maintainer}</span>
                )}
              </div>

              {typeof item.popularity === 'number' && item.popularity > 0 && (
                <div className={styles.starBadge} title="Stars / Popularity">
                  <StarIcon size={12} />
                  <span>{item.popularity.toLocaleString()}</span>
                </div>
              )}
            </div>

            <h2 className={styles.codeTitle}>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {displayName}
              </a>
            </h2>

            {item.content && (
              <p className={styles.snippet}>{item.content}</p>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className={styles.tagsRow}>
                {item.tags.slice(0, 6).map((tag, tIdx) => (
                  <span key={tIdx} className={styles.tagBadge}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.cardFooter}>
              <div className={styles.codeLinks}>
                {item.licenseName && (
                  <span className={styles.licenseBadge}>
                    {item.licenseName}
                  </span>
                )}
                {item.homepage && (
                  <a 
                    href={item.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.subLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Homepage <ExternalLinkIcon size={10} />
                  </a>
                )}
              </div>

              <div className={styles.sourceBadges}>
                <span className={styles.sourceCount}>
                  <LayersIcon size={12} />
                  {item.engines.length} {item.engines.length === 1 ? 'source' : 'sources'}
                </span>
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
          </article>
        );
      })}
    </div>
  );
}
