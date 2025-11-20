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
          'User-Agent': 'Mozilla/5.0 (compatible; PixelPulse/1.0)',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return NextResponse.json({
          verified: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          url: targetUrl,
        });
      }

      const html = await response.text();

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
      return NextResponse.json({
        verified: false,
        error: fetchError.message || 'Failed to fetch URL',
        url: targetUrl,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

