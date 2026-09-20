'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, CopyIcon, CheckIcon, SendIcon } from '@/components/icons';
import { useAI } from '@/context/AIContext';
import styles from '@/app/search/search.module.css';

interface AIOverviewProps {
  query: string;
  category: string;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Lightweight, zero-dependency Markdown renderer for technical & concise search overviews
 */
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Parse markdown blocks (code blocks, lists, paragraphs)
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];
  let codeBlockIndex = 0;

  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push(
          <p key={key} className={styles.aiParagraph}>
            {renderInlineMarkdown(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={key} className={styles.aiList}>
          {listItems.map((item, idx) => (
            <li key={idx} className={styles.aiListItem}>
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block start / end
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        // Start code block
        flushParagraph(`p-${i}`);
        flushList(`list-${i}`);
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim() || 'sh';
        codeLines = [];
      } else {
        // End code block
        const codeText = codeLines.join('\n');
        const currentIndex = codeBlockIndex++;
        const isCopied = copiedIndex === currentIndex;

        blocks.push(
          <div key={`code-${i}`} className={styles.aiCodeBlock}>
            <div className={styles.aiCodeHeader}>
              <span className={styles.aiCodeLang}>{codeLanguage}</span>
              <button
                type="button"
                className={styles.aiCopyBtn}
                onClick={() => handleCopy(codeText, currentIndex)}
                title="Copy code"
                aria-label="Copy code to clipboard"
              >
                {isCopied ? (
                  <>
                    <CheckIcon size={12} className={styles.aiCopyCheck} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className={styles.aiCodePre}>
              <code>{codeText}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeLines = [];
        codeLanguage = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // List item (e.g. "- item" or "* item" or "1. item")
    const listMatch = line.match(/^(\s*[-*]|\s*\d+\.)\s+(.+)$/);
    if (listMatch) {
      flushParagraph(`p-${i}`);
      inList = true;
      listItems.push(listMatch[2]);
      continue;
    }

    // Empty line separates paragraphs / lists
    if (!trimmed) {
      flushParagraph(`p-${i}`);
      flushList(`list-${i}`);
      continue;
    }

    // Normal text line
    if (inList) {
      flushList(`list-${i}`);
    }
    currentParagraph.push(trimmed);
  }

  // Flush remaining blocks
  if (inCodeBlock && codeLines.length > 0) {
    const codeText = codeLines.join('\n');
    const currentIndex = codeBlockIndex++;
    blocks.push(
      <div key="code-final" className={styles.aiCodeBlock}>
        <div className={styles.aiCodeHeader}>
          <span className={styles.aiCodeLang}>{codeLanguage || 'sh'}</span>
          <button
            type="button"
            className={styles.aiCopyBtn}
            onClick={() => handleCopy(codeText, currentIndex)}
            title="Copy code"
          >
            {copiedIndex === currentIndex ? (
              <>
                <CheckIcon size={12} className={styles.aiCopyCheck} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <CopyIcon size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className={styles.aiCodePre}>
          <code>{codeText}</code>
        </pre>
      </div>
    );
  }

  flushParagraph('p-final');
  flushList('list-final');

  return <div className={styles.aiMarkdownBody}>{blocks}</div>;
}

/**
 * Parses inline formatting: `code`, **bold**, *italic*
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenize `code`, **bold**, *italic*
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className={styles.aiInlineCode}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export function AIOverview({ query, category }: AIOverviewProps) {
  const { aiEnabled, isReady } = useAI();

  const [status, setStatus] = useState<'idle' | 'loading' | 'streaming' | 'success' | 'unavailable' | 'empty'>('idle');
  const [responseContent, setResponseContent] = useState('');
  const [followUps, setFollowUps] = useState<ChatTurn[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowUpStreaming, setIsFollowUpStreaming] = useState(false);

  const activeAbortController = useRef<AbortController | null>(null);
  const followUpAbortController = useRef<AbortController | null>(null);
  const followUpInputRef = useRef<HTMLInputElement>(null);

  // Trigger main standalone AI answer whenever query changes
  useEffect(() => {
    // Only run on Web category ("all") and when user has AI enabled
    if (!isReady || !aiEnabled || category !== 'all' || !query.trim()) {
      setStatus('idle');
      setResponseContent('');
      setFollowUps([]);
      return;
    }

    // Cancel any ongoing fetch
    if (activeAbortController.current) {
      activeAbortController.current.abort();
    }
    if (followUpAbortController.current) {
      followUpAbortController.current.abort();
    }

    const controller = new AbortController();
    activeAbortController.current = controller;

    setStatus('loading');
    setResponseContent('');
    setFollowUps([]);
    setFollowUpInput('');

    const fetchAnswer = async () => {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim() }),
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 503) {
            setStatus('unavailable');
          } else {
            setStatus('empty');
          }
          return;
        }

        if (!res.body) {
          setStatus('empty');
          return;
        }

        setStatus('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setResponseContent(accumulated);
        }

        const finalTrimmed = accumulated.trim();
        if (finalTrimmed) {
          setStatus('success');
        } else {
          setStatus('empty');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setStatus('unavailable');
        }
      }
    };

    fetchAnswer();

    return () => {
      controller.abort();
    };
  }, [query, category, aiEnabled, isReady]);

  // Handle continuous follow-up question
  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = followUpInput.trim();
    if (!trimmed || isFollowUpStreaming || status !== 'success') return;

    if (followUpAbortController.current) {
      followUpAbortController.current.abort();
    }

    const controller = new AbortController();
    followUpAbortController.current = controller;

    // Construct small conversation context
    const currentHistory: ChatTurn[] = [
      { role: 'user', content: query },
      { role: 'assistant', content: responseContent },
      ...followUps,
    ];

    // Add user question to state immediately
    const nextTurns: ChatTurn[] = [
      ...followUps,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ];
    setFollowUps(nextTurns);
    setFollowUpInput('');
    setIsFollowUpStreaming(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          history: currentHistory.slice(-4), // Keep small context
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setFollowUps((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Local intelligence is currently unavailable.',
            };
          }
          return updated;
        });
        setIsFollowUpStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setFollowUps((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: accumulated,
            };
          }
          return updated;
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setFollowUps((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Local intelligence is currently unavailable.',
            };
          }
          return updated;
        });
      }
    } finally {
      setIsFollowUpStreaming(false);
    }
  };

  // If AI is disabled by user, not ready, wrong category, or empty response: DO NOT RENDER
  if (!isReady || !aiEnabled || category !== 'all' || status === 'idle' || status === 'empty') {
    return null;
  }

  return (
    <section className={styles.aiOverviewContainer} aria-label="Local AI Overview">
      <div className={styles.aiOverviewCard}>
        
        {/* Card Header */}
        <div className={styles.aiOverviewHeader}>
          <div className={styles.aiHeaderBrand}>
            <SparklesIcon size={14} className={styles.aiSparkleIcon} />
            <h2 className={styles.aiOverviewTitle}>AI Overview</h2>
          </div>
          <div className={styles.aiBadgePill}>Local</div>
        </div>

        {/* State: Loading */}
        {status === 'loading' && (
          <div className={styles.aiLoadingState}>
            <div className={styles.aiShimmerLine} style={{ width: '45%' }} />
            <div className={styles.aiShimmerLine} style={{ width: '85%' }} />
            <div className={styles.aiShimmerLine} style={{ width: '65%' }} />
            <span className={styles.aiGeneratingText}>Generating answer...</span>
          </div>
        )}

        {/* State: Unavailable */}
        {status === 'unavailable' && (
          <div className={styles.aiUnavailableState}>
            <p className={styles.aiUnavailableText}>
              Local intelligence is currently unavailable.
            </p>
          </div>
        )}

        {/* State: Streaming or Success */}
        {(status === 'streaming' || status === 'success') && (
          <div className={styles.aiContentBody}>
            <MarkdownRenderer content={responseContent} />

            {/* Continuous Follow-up Turns */}
            {followUps.length > 0 && (
              <div className={styles.aiFollowUpsList}>
                {followUps.map((turn, idx) => (
                  <div
                    key={idx}
                    className={turn.role === 'user' ? styles.aiTurnUser : styles.aiTurnAssistant}
                  >
                    {turn.role === 'user' ? (
                      <div className={styles.aiUserBubble}>{turn.content}</div>
                    ) : (
                      <div className={styles.aiAssistantResponse}>
                        {turn.content ? (
                          <MarkdownRenderer content={turn.content} />
                        ) : (
                          <div className={styles.aiSmallShimmer} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Continuous Small Chat Input */}
            {status === 'success' && (
              <form onSubmit={handleFollowUpSubmit} className={styles.aiFollowUpForm}>
                <div className={styles.aiFollowUpInputWrapper}>
                  <input
                    ref={followUpInputRef}
                    type="text"
                    className={styles.aiFollowUpInput}
                    placeholder="Ask about this..."
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    disabled={isFollowUpStreaming}
                    aria-label="Ask follow-up question about this answer"
                  />
                  <button
                    type="submit"
                    className={styles.aiFollowUpSubmitBtn}
                    disabled={!followUpInput.trim() || isFollowUpStreaming}
                    aria-label="Send follow-up query"
                  >
                    <SendIcon size={13} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
