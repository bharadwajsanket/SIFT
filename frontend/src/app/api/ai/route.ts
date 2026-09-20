import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are SIFT's concise technical search assistant.
Answer the user's query directly, accurately, and concisely.

Strict Instructions:
- Answer the query directly.
- Do not introduce yourself or use conversational filler.
- Never say "As an AI", "Certainly!", or "I hope this helps".
- Do not repeat or restate the user's question.
- For technical, CLI, command, or programming questions, show the exact command/code first.
- Use clean Markdown (code blocks with language tags, bold terms, concise bullet points).
- Keep answers short and high-signal (roughly 1 to 5 short paragraphs or equivalent).
- Do not produce internal thinking, chain-of-thought, or <think> tags.
- Do not fabricate sources, links, or citations.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Helper to clean up model name for UI presentation
 */
function formatModelName(modelPath?: string): string {
  if (!modelPath) return 'Qwen3-4B-Instruct-2507';
  const basename = modelPath.split('/').pop() || modelPath;
  return basename.replace(/\.gguf$/i, '').replace(/[-_]Q[0-9]_[A-Z0-9_]+/i, '') || 'Qwen3-4B-Instruct-2507';
}

/**
 * GET /api/ai
 * Lightweight health check & model metadata endpoint for SIFT settings & status indicators.
 */
export async function GET() {
  const isEnabled = process.env.SIFT_LLM_ENABLED !== 'false';
  const rawModel = process.env.SIFT_LLM_MODEL || 'Qwen3-4B-Instruct-2507-Q4_K_M.gguf';
  const modelName = formatModelName(rawModel);

  if (!isEnabled) {
    return NextResponse.json({
      enabled: false,
      available: false,
      model: modelName,
      status: 'disabled',
    });
  }

  const llmUrl = process.env.SIFT_LLM_URL || 'http://llama-server:8080';

  try {
    // Probe llama.cpp server with a fast 2.5s timeout
    const res = await fetch(`${llmUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      return NextResponse.json({
        enabled: true,
        available: true,
        model: modelName,
        status: 'local',
      });
    }

    // Fallback probe to /v1/models if /health returns non-200
    const modelsRes = await fetch(`${llmUrl}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
      headers: { 'Accept': 'application/json' },
    });

    if (modelsRes.ok) {
      return NextResponse.json({
        enabled: true,
        available: true,
        model: modelName,
        status: 'local',
      });
    }

    return NextResponse.json({
      enabled: true,
      available: false,
      model: modelName,
      status: 'offline',
    });
  } catch {
    return NextResponse.json({
      enabled: true,
      available: false,
      model: modelName,
      status: 'offline',
    });
  }
}

/**
 * POST /api/ai
 * Streaming endpoint for standalone Local AI Overview answers & continuous follow-ups.
 */
export async function POST(request: Request) {
  const isEnabled = process.env.SIFT_LLM_ENABLED !== 'false';
  if (!isEnabled) {
    return NextResponse.json(
      { error: 'Local intelligence is disabled on this server.', enabled: false },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (!query || query.length > 1000) {
    return NextResponse.json(
      { error: 'Query parameter is required and must be between 1 and 1000 characters.' },
      { status: 400 }
    );
  }

  // Sanitize small conversation history (up to 6 turns)
  const incomingHistory = Array.isArray(body.history) ? body.history : [];
  const safeHistory: ChatMessage[] = incomingHistory
    .slice(-6)
    .filter((msg: any) => (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
    .map((msg: any) => ({
      role: msg.role,
      content: String(msg.content).slice(0, 1500),
    }));

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...safeHistory,
    { role: 'user', content: query },
  ];

  const llmUrl = process.env.SIFT_LLM_URL || 'http://llama-server:8080';

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${llmUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        messages,
        stream: true,
        temperature: 0.2,
        max_tokens: 512,
      }),
      signal: AbortSignal.timeout(25000), // 25s timeout for CPU inference
    });
  } catch {
    return NextResponse.json(
      { error: 'Local intelligence is currently unavailable.' },
      { status: 503 }
    );
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return NextResponse.json(
      { error: 'Local intelligence is currently unavailable.' },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamReader = upstreamResponse.body.getReader();

  let insideThinkTag = false;
  let buffer = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await upstreamReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue; // Ignore keep-alive comments

            if (trimmed === 'data: [DONE]') {
              continue;
            }

            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const deltaContent = parsed.choices?.[0]?.delta?.content;

                if (deltaContent) {
                  let cleaned = deltaContent;

                  // Handle <think> tags from thinking models
                  if (cleaned.includes('<think>')) {
                    insideThinkTag = true;
                    cleaned = cleaned.replace(/<think>[\s\S]*?(<\/think>|$)/g, '');
                  }
                  if (insideThinkTag) {
                    if (cleaned.includes('</think>')) {
                      insideThinkTag = false;
                      cleaned = cleaned.split('</think>')[1] || '';
                    } else {
                      cleaned = '';
                    }
                  }

                  if (cleaned) {
                    controller.enqueue(encoder.encode(cleaned));
                  }
                }
              } catch {
                // Non-JSON SSE line or partial parse, continue
              }
            }
          }
        }

        // Process remaining buffer if any
        if (buffer.trim().startsWith('data: ')) {
          const jsonStr = buffer.trim().slice(6);
          if (jsonStr !== '[DONE]') {
            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent && !insideThinkTag) {
                controller.enqueue(encoder.encode(deltaContent));
              }
            } catch {}
          }
        }

        controller.close();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          controller.error(err);
        } else {
          controller.close();
        }
      } finally {
        try {
          upstreamReader.releaseLock();
        } catch {}
      }
    },
    cancel() {
      try {
        upstreamReader.cancel();
      } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
