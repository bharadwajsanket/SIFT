'use client';

import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, SparklesIcon } from '@/components/icons';
import styles from '@/app/page.module.css';

interface HomeWeatherProps {
  unit?: 'c' | 'f';
  city?: string;
  compact?: boolean;
}

export function HomeWeather({ unit = 'c', city = '', compact = false }: HomeWeatherProps) {
  const [temp, setTemp] = useState<number>(20);
  const [condition, setCondition] = useState<string>('Atmospheric Horizon');
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [isNight, setIsNight] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    const hour = new Date().getHours();
    const nightTime = hour < 6 || hour >= 19;
    setIsNight(nightTime);

    async function fetchOpenMeteoWeather() {
      if (!city || !city.trim()) {
        // Fallback natural atmospheric estimate
        const baseTemp = 18;
        const variation = Math.sin(((hour - 4) / 24) * 2 * Math.PI) * 6;
        if (active) {
          setTemp(Math.round(baseTemp + variation));
          setCondition(nightTime ? 'Midnight Sky' : hour >= 6 && hour < 12 ? 'Clear Daylight' : 'Atmospheric Horizon');
          setLocationLabel('');
        }
        return;
      }

      try {
        // 1. Geocode city via Open-Meteo (open-source, non-commercial, zero-tracking)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`);
        if (!geoRes.ok) throw new Error('Geocoding failed');
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('City not found');
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const name = location.name;
        const country = location.country_code ? location.country_code.toUpperCase() : '';

        // 2. Fetch current weather via Open-Meteo Forecast API
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (!weatherRes.ok) throw new Error('Weather fetch failed');
        const weatherData = await weatherRes.json();
        const current = weatherData.current_weather;

        if (active && current) {
          setTemp(Math.round(current.temperature));
          const wmoCode = current.weathercode;
          const isDay = current.is_day === 1;
          setIsNight(!isDay);

          let condText = 'Atmospheric';
          if (wmoCode === 0) condText = isDay ? 'Clear Sky' : 'Clear Night';
          else if (wmoCode <= 3) condText = 'Partly Cloudy';
          else if (wmoCode <= 48) condText = 'Misty Fog';
          else if (wmoCode <= 67) condText = 'Rain Showers';
          else if (wmoCode <= 77) condText = 'Snow Flurries';
          else if (wmoCode <= 99) condText = 'Thunderstorm';
          else condText = 'Atmospheric';

          setCondition(condText);
          setLocationLabel(country ? `${name}, ${country}` : name);
        }
      } catch {
        // Fallback gracefully to offline estimate with city name
        if (active) {
          const baseTemp = 19;
          const variation = Math.sin(((hour - 4) / 24) * 2 * Math.PI) * 5;
          setTemp(Math.round(baseTemp + variation));
          setCondition(nightTime ? 'Midnight Sky' : 'Clear Daylight');
          setLocationLabel(city.trim());
        }
      }
    }

    fetchOpenMeteoWeather();

    return () => {
      active = false;
    };
  }, [city]);

  const displayTemp = unit === 'f' ? Math.round((temp * 9) / 5 + 32) : temp;
  const unitSymbol = unit === 'f' ? '°F' : '°C';

  const weatherIconElement = isNight ? (
    <MoonIcon size={13} className={styles.weatherAtmosphereIcon} />
  ) : condition.toLowerCase().includes('clear') ? (
    <SunIcon size={13} className={styles.weatherAtmosphereIcon} />
  ) : (
    <SparklesIcon size={13} className={styles.weatherAtmosphereIcon} />
  );

  if (compact) {
    const shortCity = locationLabel ? locationLabel.split(',')[0] : '';
    return (
      <div className={styles.compactPillItem}>
        <div className={styles.compactWeatherIconWrap}>
          {weatherIconElement}
        </div>
        <span className={styles.compactTempText}>{displayTemp}{unitSymbol}</span>
        {shortCity && <span className={styles.compactCityText}>{shortCity}</span>}
      </div>
    );
  }

  return (
    <div className={`${styles.spatialModule} ${styles.atmosphericCard}`}>
      <div className={styles.weatherDisplay}>
        <div className={styles.weatherHeaderRow}>
          <div className={styles.weatherIconBadge}>
            {weatherIconElement}
          </div>
          <span className={styles.weatherTempText}>
            {displayTemp}{unitSymbol}
          </span>
        </div>
        <span className={styles.weatherConditionSub}>
          {locationLabel ? `${condition} • ${locationLabel}` : condition}
        </span>
      </div>
    </div>
  );
}
