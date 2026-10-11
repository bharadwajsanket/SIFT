'use client';

import React, { useState, useEffect } from 'react';
import { CalculatorResult } from '@/lib/calculator';
import { CopyIcon, CheckIcon } from '@/components/icons';
import styles from './CalculatorPreview.module.css';

interface CalculatorPreviewProps {
  calculation: CalculatorResult;
  onWebSearch: (query: string) => void;
  onCopySuccess?: (copiedValue: string) => void;
  isCopied?: boolean;
  compact?: boolean;
}

export function CalculatorPreview({ 
  calculation, 
  onWebSearch, 
  onCopySuccess,
  isCopied = false,
  compact = false
}: CalculatorPreviewProps) {
  const [copied, setCopied] = useState(false);

  // Sync external copy notification (e.g. Enter key pressed in input)
  useEffect(() => {
    if (isCopied) {
      setCopied(true);
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Reset copied state if the calculation changes
  useEffect(() => {
    setCopied(false);
  }, [calculation.formattedResult, calculation.rawExpression]);

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(calculation.formattedResult).then(() => {
        setCopied(true);
        onCopySuccess?.(calculation.formattedResult);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback for clipboard failures
        try {
          const textarea = document.createElement('textarea');
          textarea.value = calculation.formattedResult;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopied(true);
          onCopySuccess?.(calculation.formattedResult);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      });
    }
  };

  return (
    <div 
      className={`${styles.calculatorCard} ${compact ? styles.compactCard : ''}`} 
      role="region" 
      aria-label="Calculator result"
    >
      <div className={styles.cardHeader}>
        <span className={styles.expressionText} title={calculation.formattedExpression}>
          {calculation.formattedExpression} =
        </span>
        <button
          type="button"
          className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
          onClick={handleCopy}
          aria-label={copied ? "Copied calculation result to clipboard" : "Copy calculation result"}
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div 
        className={styles.resultRow} 
        onClick={handleCopy} 
        title="Click to copy result"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCopy();
          }
        }}
      >
        <span className={styles.resultValue}>{calculation.formattedResult}</span>
      </div>

      <div className={styles.footerActions}>
        <span className={styles.enterHint}>Press Enter to copy</span>
        <button
          type="button"
          className={styles.webSearchBtn}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWebSearch(calculation.rawExpression);
          }}
          aria-label={`Search the web for ${calculation.rawExpression}`}
        >
          <span>Search web for &ldquo;{calculation.rawExpression}&rdquo; &rarr;</span>
        </button>
      </div>

      {/* Screen reader live announcement */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {copied ? `Result ${calculation.formattedResult} copied to clipboard` : `${calculation.formattedExpression} equals ${calculation.formattedResult}`}
      </div>
    </div>
  );
}
