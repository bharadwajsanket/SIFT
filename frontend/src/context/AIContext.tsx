'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AIBackendStatus = 'local' | 'offline' | 'disabled' | 'checking';

interface AIContextType {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  aiStatus: AIBackendStatus;
  aiModelName: string;
  checkStatus: () => Promise<void>;
  isReady: boolean;
}

const AI_STORAGE_KEY = 'sift-ai-enabled';
const DEFAULT_AI_ENABLED = true;

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [aiEnabled, setAiEnabledState] = useState<boolean>(DEFAULT_AI_ENABLED);
  const [aiStatus, setAiStatus] = useState<AIBackendStatus>('checking');
  const [aiModelName, setAiModelName] = useState<string>('Qwen3-4B-Instruct-2507');
  const [isReady, setIsReady] = useState(false);

  // Probe backend status
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data.status || (data.available ? 'local' : 'offline'));
        if (data.model) {
          setAiModelName(data.model);
        }
      } else {
        setAiStatus('offline');
      }
    } catch {
      setAiStatus('offline');
    }
  }, []);

  // Initialize preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(AI_STORAGE_KEY);
        if (stored !== null) {
          setAiEnabledState(stored === 'true');
        } else {
          setAiEnabledState(DEFAULT_AI_ENABLED);
        }
      } catch (e) {
        console.warn('Failed to read AI preference from localStorage:', e);
      }
      setIsReady(true);
      checkStatus();
    }
  }, [checkStatus]);

  const setAiEnabled = useCallback((enabled: boolean) => {
    setAiEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AI_STORAGE_KEY, enabled ? 'true' : 'false');
      } catch (e) {
        console.error('Failed to persist AI preference to localStorage:', e);
      }
    }
  }, []);

  return (
    <AIContext.Provider
      value={{
        aiEnabled,
        setAiEnabled,
        aiStatus,
        aiModelName,
        checkStatus,
        isReady,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
