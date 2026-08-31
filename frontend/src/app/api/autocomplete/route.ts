import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080';
  const targetUrl = new URL(`${searxngUrl}/autocompleter`);
  targetUrl.searchParams.set('q', query);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(3000), // Fast timeout for autocomplete
    });

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();
    
    // OpenSearch format: [query, [suggestion1, suggestion2, ...], ...]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return NextResponse.json(data[1]);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('SIFT autocomplete error:', error);
    return NextResponse.json([]);
  }
}
