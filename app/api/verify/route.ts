import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      // Fetch the page
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
        redirect: 'follow',
      });

      if (!response.ok) {
        return NextResponse.json({
          verified: false,
          error: `HTTP ${response.status}: ${response.statusText}. The website may require authentication or block automated requests.`,
          errorType: 'http_error',
          url: targetUrl,
          suggestion: 'Try the "Verify (Browser)" button for manual verification.',
        });
      }

      const html = await response.text();
      
      if (!html || html.length < 100) {
        return NextResponse.json({
          verified: false,
          error: 'Received empty or invalid HTML response. The page may be dynamically loaded (SPA).',
          errorType: 'empty_response',
          url: targetUrl,
          suggestion: 'Use "Verify (Browser)" button - SPAs load scripts dynamically.',
        });
      }

      // Check for PixelPulse snippet
      const hasPixelPulseScript = html.includes('pixelpulse.js') || html.includes('PIXELPULSE');
      const hasToken = html.includes('PIXELPULSE_TOKEN');
      const hasEndpoint = html.includes('PIXELPULSE_ENDPOINT');

      // Try to find the actual script tag
      const scriptMatch = html.match(/<script[^>]*pixelpulse\.js[^>]*>/i);
      const tokenMatch = html.match(/PIXELPULSE_TOKEN\s*=\s*["']([^"']+)["']/i);

      return NextResponse.json({
        verified: hasPixelPulseScript,
        url: targetUrl,
        hasToken: hasToken,
        hasEndpoint: hasEndpoint,
        token: tokenMatch ? tokenMatch[1] : null,
        scriptTag: scriptMatch ? scriptMatch[0] : null,
        details: {
          foundScript: hasPixelPulseScript,
          foundToken: hasToken,
          foundEndpoint: hasEndpoint,
        },
      });
    } catch (fetchError: any) {
      // Check for specific error types
      let errorMessage = fetchError.message || 'Failed to fetch URL';
      let errorType = 'unknown';
      
      if (fetchError.name === 'AbortError' || errorMessage.includes('timeout')) {
        errorMessage = 'Request timed out. The website may be slow or blocking requests.';
        errorType = 'timeout';
      } else if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
        errorMessage = 'CORS blocked: This website blocks server-side verification. Use client-side verification instead.';
        errorType = 'cors';
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
        errorMessage = 'Domain not found. Please check the URL.';
        errorType = 'dns';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused. The website may be down or blocking requests.';
        errorType = 'connection';
      }
      
      return NextResponse.json({
        verified: false,
        error: errorMessage,
        errorType,
        url: targetUrl,
        suggestion: errorType === 'cors' ? 'Use the "Verify in Browser" button for client-side verification.' : null,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

