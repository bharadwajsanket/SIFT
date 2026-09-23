'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/page.module.css';

interface HomeClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
  timezone?: string;
  hourFormat?: '12h' | '24h';
  compact?: boolean;
}

export function HomeClock({ 
  showDate = true, 
  showSeconds = false, 
  timezone = 'local',
  hourFormat = '24h',
  compact = false
}: HomeClockProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [secondsStr, setSecondsStr] = useState<string>('');
  const [amPmStr, setAmPmStr] = useState<string>('');
  const [tzLabel, setTzLabel] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const tz = timezone && timezone !== 'local' ? timezone : undefined;
      const is12h = hourFormat === '12h';

      try {
        const timeFormatter = new Intl.DateTimeFormat(undefined, {
          hour: is12h ? 'numeric' : '2-digit',
          minute: '2-digit',
          second: showSeconds ? '2-digit' : undefined,
          hour12: is12h,
          timeZone: tz,
        });

        const parts = timeFormatter.formatToParts(now);
        const hour = parts.find((p) => p.type === 'hour')?.value || '00';
        const minute = parts.find((p) => p.type === 'minute')?.value || '00';
        const second = parts.find((p) => p.type === 'second')?.value || '00';
        const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value || '';

        setTimeStr(`${hour}:${minute}`);
        setSecondsStr(second);
        setAmPmStr(dayPeriod.toUpperCase());

        const dateFormatter = new Intl.DateTimeFormat(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: tz,
        });
        setDateStr(dateFormatter.format(now));

        if (tz) {
          const tzShort = tz.split('/').pop()?.replace(/_/g, ' ') || tz;
          setTzLabel(tzShort);
        } else {
          setTzLabel('');
        }
      } catch {
        // Fallback to local
        const rawHours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        if (is12h) {
          const h12 = rawHours % 12 || 12;
          setTimeStr(`${h12}:${minutes}`);
          setAmPmStr(rawHours >= 12 ? 'PM' : 'AM');
        } else {
          setTimeStr(`${rawHours.toString().padStart(2, '0')}:${minutes}`);
          setAmPmStr('');
        }
        setDateStr(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [showSeconds, timezone, hourFormat]);

  if (!timeStr) return null;

  if (compact) {
    return (
      <div className={styles.compactPillItem}>
        <span className={styles.compactTimeText}>{timeStr}</span>
        {amPmStr && <span className={styles.compactAmPmText}>{amPmStr}</span>}
        {showDate && <span className={styles.compactDateText}>{dateStr}</span>}
        {tzLabel && <span className={styles.compactTzText}>{tzLabel}</span>}
      </div>
    );
  }

  return (
    <div className={`${styles.spatialModule} ${styles.atmosphericCard}`}>
      <div className={styles.clockDisplay}>
        <div className={styles.clockTimeRow}>
          <span className={styles.clockPrimaryTime}>{timeStr}</span>
          {amPmStr && <span className={styles.clockAmPmBadge}>{amPmStr}</span>}
          {showSeconds && <span className={styles.clockSeconds}>{secondsStr}</span>}
          {tzLabel && <span className={styles.clockTzBadge}>{tzLabel}</span>}
        </div>
        {showDate && <span className={styles.clockDateLabel}>{dateStr}</span>}
      </div>
    </div>
  );
}
