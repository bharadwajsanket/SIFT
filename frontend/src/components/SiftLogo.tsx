import React from 'react';

export type SiftLogoVariant = 'color' | 'mono-dark' | 'mono-light' | 'outline';

interface SiftMarkProps {
  size?: number;
  className?: string;
  variant?: SiftLogoVariant;
}

export function SiftMark({ size = 28, className = '', variant = 'color' }: SiftMarkProps) {
  const gradientId = `sift-chevron-grad-${variant}-${size}`;
  const dotGradientId = `sift-signal-grad-${variant}-${size}`;

  let chevronStroke = `url(#${gradientId})`;
  let signalFill = '#22C1C3';
  let noiseFill = '#8A9199';
  let noiseOpacity = '0.75';

  if (variant === 'mono-dark') {
    chevronStroke = '#F4F5F7';
    signalFill = '#F4F5F7';
    noiseFill = '#A8AFB8';
    noiseOpacity = '0.65';
  } else if (variant === 'mono-light') {
    chevronStroke = '#1A1D23';
    signalFill = '#1A1D23';
    noiseFill = '#6B7280';
    noiseOpacity = '0.75';
  } else if (variant === 'outline') {
    chevronStroke = 'currentColor';
    signalFill = 'none';
    noiseFill = 'currentColor';
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradientId} x1="23" y1="10" x2="33" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>
        <linearGradient id={dotGradientId} x1="37" y1="20" x2="45" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C1C3" />
          <stop offset="100%" stopColor="#4A90E2" />
        </linearGradient>
      </defs>

      {/* Noise Dots (Scattered Left) */}
      <g fill={noiseFill} opacity={noiseOpacity}>
        <circle cx="8" cy="14" r="1.5" />
        <circle cx="15" cy="18" r="1.75" />
        <circle cx="6" cy="24" r="1.35" />
        <circle cx="12" cy="24" r="2" />
        <circle cx="18" cy="24" r="1.75" />
        <circle cx="8" cy="34" r="1.5" />
        <circle cx="15" cy="30" r="1.75" />
        <circle cx="11" cy="10" r="1.25" />
        <circle cx="11" cy="38" r="1.25" />
      </g>

      {/* Filter Chevron (Center) */}
      <path
        d="M23 10L32.5 24L23 38"
        stroke={chevronStroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Signal Dot (Right) */}
      {variant === 'outline' ? (
        <circle
          cx="41"
          cy="24"
          r="3.2"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
      ) : (
        <circle
          cx="41"
          cy="24"
          r="3.5"
          fill={variant === 'color' ? `url(#${dotGradientId})` : signalFill}
        />
      )}
    </svg>
  );
}

interface SiftLogoProps {
  markSize?: number;
  className?: string;
  variant?: SiftLogoVariant;
  showTagline?: boolean;
  showSubtitle?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function SiftLogo({
  markSize = 26,
  className = '',
  variant = 'color',
  showTagline = false,
  showSubtitle = false,
  orientation = 'horizontal',
}: SiftLogoProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isVertical ? 'center' : 'flex-start',
        gap: isVertical ? '0.65rem' : '0.65rem',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <SiftMark size={markSize} variant={variant} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isVertical ? 'center' : 'flex-start',
          textAlign: isVertical ? 'center' : 'left',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 800,
            fontSize: isVertical ? `${Math.max(28, markSize * 0.75)}px` : `${Math.max(16, markSize * 0.7)}px`,
            letterSpacing: '0.06em',
            color: 'var(--text)',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          SIFT
        </span>

        {showSubtitle && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginTop: '0.35rem',
              textTransform: 'uppercase',
            }}
          >
            Search & Information Filtering Tool
          </span>
        )}

        {showTagline && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              marginTop: '0.35rem',
              letterSpacing: '-0.01em',
            }}
          >
            Search privately. Find clearly.
          </span>
        )}
      </div>
    </div>
  );
}
