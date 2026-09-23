'use client';

import React from 'react';
import { ExternalLinkIcon, GlobeIcon } from '@/components/icons';
import { SiftShortcutItem, DEFAULT_SHORTCUTS } from '@/lib/homeModules';
import styles from '@/app/page.module.css';

interface HomeShortcutsProps {
  items?: SiftShortcutItem[];
}

export function HomeShortcuts({ items = DEFAULT_SHORTCUTS }: HomeShortcutsProps) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_SHORTCUTS;

  return (
    <div className={styles.spatialModule}>
      <div className={styles.moduleCard}>
        <div className={styles.moduleHeader}>
          <span className={styles.moduleLabel}>PINNED SHORTCUTS</span>
        </div>
        <div className={styles.shortcutsGrid}>
          {displayItems.map((item) => {
            const domain = (() => {
              try {
                return new URL(item.url.startsWith('http') ? item.url : `https://${item.url}`).hostname;
              } catch {
                return '';
              }
            })();

            const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(domain)}&sz=32` : '';

            return (
              <a
                key={item.id}
                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shortcutItem}
                title={`Open ${item.label}`}
              >
                {faviconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={faviconUrl}
                    alt=""
                    className={styles.shortcutFavicon}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <GlobeIcon size={13} className={styles.shortcutIcon} />
                )}
                <span className={styles.shortcutTitle}>{item.label}</span>
                <ExternalLinkIcon size={9} className={styles.shortcutExt} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
