import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface SiftResult {
  title: string;
  url: string;
  content: string;
  template: string;
  category: string;
  engine: string;
  engines: string[];
  positions: number[];
  score: number;
  domain: string;
  
  // Image specific
  thumbnailSrc?: string;
  imgSrc?: string;
  resolution?: string;
  
  // Video specific
  length?: string;
  uploader?: string;
  iframeSrc?: string;
  
  // News specific
  source?: string;
  publishedDate?: string;
  
  // Code / IT specific
  packageName?: string;
  maintainer?: string;
  popularity?: number;
  licenseName?: string;
  licenseUrl?: string;
  sourceCodeUrl?: string;
  homepage?: string;
  tags?: string[];
  
  // Science / Academic specific
  authors?: string[];
  journal?: string;
  doi?: string;
  pdfUrl?: string;
  citations?: string;
  
  // Map specific
  latitude?: number;
  longitude?: number;
  address?: {
    name?: string;
    road?: string;
    locality?: string;
    postcode?: string;
    country?: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const siftCategory = searchParams.get('category') || 'all';
  const page = searchParams.get('page') || '1';
  const timeRange = searchParams.get('time_range') || '';
  const safeSearch = searchParams.get('safesearch') || '1';
  const language = searchParams.get('language') || 'all';
  const engines = searchParams.get('engines') || '';

  // Map SIFT category to SearXNG category
  let searxCategory = 'general';
  switch (siftCategory) {
    case 'images':
      searxCategory = 'images';
      break;
    case 'videos':
      searxCategory = 'videos';
      break;
    case 'news':
      searxCategory = 'news';
      break;
    case 'code':
      searxCategory = 'it';
      break;
    case 'academic':
      searxCategory = 'science';
      break;
    case 'maps':
      searxCategory = 'map';
      break;
    default:
      searxCategory = 'general';
  }

  const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080';
  
  const targetUrl = new URL(`${searxngUrl}/search`);
  targetUrl.searchParams.set('q', query);
  targetUrl.searchParams.set('format', 'json');
  targetUrl.searchParams.set('categories', searxCategory);
  targetUrl.searchParams.set('pageno', page);
  targetUrl.searchParams.set('safesearch', safeSearch);
  
  if (engines) {
    targetUrl.searchParams.set('engines', engines);
  }
  if (timeRange && timeRange !== 'all') {
    targetUrl.searchParams.set('time_range', timeRange);
  }
  if (language && language !== 'all') {
    targetUrl.searchParams.set('language', language);
  }

  const startTime = Date.now();

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Search engine returned HTTP ${response.status}` },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data = await response.json();
    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Helper to strip raw HTML tags returned by some search engines
    const cleanText = (str?: string): string => {
      if (!str) return '';
      return str.replace(/<[^>]*>?/gm, '').trim();
    };

    // Normalize and preserve category specific fields
    const results: SiftResult[] = (data.results || []).map((item: any) => {
      let domain = '';
      try {
        if (item.url) {
          domain = new URL(item.url).hostname.replace(/^www\./, '');
        }
      } catch {
        domain = cleanText(item.url) || '';
      }

      const enginesList: string[] = Array.isArray(item.engines) 
        ? item.engines.map((e: any) => String(e).trim()).filter(Boolean)
        : item.engine 
          ? [String(item.engine).trim()] 
          : [];

      // Determine best thumbnail
      const thumbnailSrc = item.thumbnail_src || item.thumbnail || item.img_src || undefined;
      const imgSrc = item.img_src || item.thumbnail_src || undefined;

      const normalized: SiftResult = {
        title: cleanText(item.title) || domain || 'Untitled Result',
        url: item.url || '#',
        content: cleanText(item.content) || '',
        template: item.template || 'default.html',
        category: item.category || searxCategory,
        engine: item.engine || (enginesList[0] || 'unknown'),
        engines: enginesList,
        positions: Array.isArray(item.positions) ? item.positions : [],
        score: typeof item.score === 'number' ? item.score : 0,
        domain,
        
        // Media fields
        thumbnailSrc,
        imgSrc,
        resolution: item.resolution || undefined,
        
        // Video
        length: item.length || undefined,
        uploader: cleanText(item.metadata || item.author) || undefined,
        iframeSrc: item.iframe_src || undefined,
        
        // News
        source: cleanText(item.source) || undefined,
        publishedDate: item.publishedDate || item.pubdate || undefined,
        
        // Code / IT
        packageName: cleanText(item.package_name) || undefined,
        maintainer: cleanText(item.maintainer) || undefined,
        popularity: typeof item.popularity === 'number' ? item.popularity : undefined,
        licenseName: cleanText(item.license_name) || undefined,
        licenseUrl: item.license_url || undefined,
        sourceCodeUrl: item.source_code_url || undefined,
        homepage: item.homepage || undefined,
        tags: Array.isArray(item.tags) ? item.tags.map((t: any) => cleanText(String(t))).filter(Boolean) : undefined,
        
        // Academic
        authors: Array.isArray(item.authors) ? item.authors.map((a: any) => cleanText(String(a))).filter(Boolean) : undefined,
        journal: cleanText(item.journal || item.publisher) || undefined,
        doi: cleanText(item.doi) || undefined,
        pdfUrl: item.pdf_url || undefined,
        citations: cleanText(item.comments) || undefined,
        
        // Maps
        latitude: typeof item.latitude === 'number' ? item.latitude : undefined,
        longitude: typeof item.longitude === 'number' ? item.longitude : undefined,
        address: item.address || undefined,
      };

      return normalized;
    });

    return NextResponse.json({
      query: data.query || query,
      results,
      count: results.length,
      duration: durationSeconds,
      infoboxes: data.infoboxes || [],
      suggestions: data.suggestions || [],
      unresponsive_engines: data.unresponsive_engines || [],
    });
  } catch (error: any) {
    console.error('SIFT proxy fetch error:', error);
    
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Search aggregator timed out while contacting search engines.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to connect to SearXNG aggregation engine.' },
      { status: 503 }
    );
  }
}
