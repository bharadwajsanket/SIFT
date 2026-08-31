import React from 'react';
import { SiftResult } from '@/app/api/search/route';
import { AcademicIcon, PdfIcon, LayersIcon } from '@/components/icons';
import styles from '@/app/search/search.module.css';

interface AcademicResultsProps {
  results: SiftResult[];
  selectedResult: SiftResult | null;
  onSelectResult: (result: SiftResult) => void;
}

export function AcademicResults({ results, selectedResult, onSelectResult }: AcademicResultsProps) {
  return (
    <div className={styles.academicList}>
      {results.map((item, index) => {
        const isSelected = selectedResult === item;
        const authorsText = item.authors && item.authors.length > 0 
          ? item.authors.slice(0, 4).join(', ') + (item.authors.length > 4 ? ` et al.` : '')
          : null;

        return (
          <article 
            key={`${item.url}-${index}`} 
            className={`${styles.academicCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => onSelectResult(item)}
          >
            <div className={styles.academicHeader}>
              <div className={styles.academicMeta}>
                <AcademicIcon size={14} className={styles.academicIcon} />
                <span className={styles.domainName}>{item.domain}</span>
                {item.journal && (
                  <span className={styles.journalName}>• {item.journal}</span>
                )}
              </div>

              {item.pdfUrl && (
                <a 
                  href={item.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.pdfBadge}
                  onClick={(e) => e.stopPropagation()}
                  title="Open PDF document"
                >
                  <PdfIcon size={12} />
                  PDF
                </a>
              )}
            </div>

            <h2 className={styles.academicTitle}>
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {item.title}
              </a>
            </h2>

            {authorsText && (
              <div className={styles.authorsRow}>
                <span className={styles.authorsLabel}>Authors:</span> {authorsText}
              </div>
            )}

            {item.content && (
              <p className={styles.snippet}>{item.content}</p>
            )}

            <div className={styles.cardFooter}>
              <div className={styles.academicLinks}>
                {item.doi && (
                  <span className={styles.doiBadge}>DOI: {item.doi}</span>
                )}
                {item.citations && (
                  <span className={styles.citationsBadge}>{item.citations}</span>
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
