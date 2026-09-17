import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side NSE option-chain scrape (v3).
 * Used as a fallback when the Nest API on Render cannot reach NSE
 * (datacenter IPs are often blocked). Nest calls this via FRONTEND_URL.
 *
 * Auth: optional NSE_PROXY_SECRET header (x-nse-proxy-secret).
 * If the env var is set, the header must match.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

function mergeCookies(existing: string, res: Response): string {
  let cookies = existing;
  const list =
    typeof (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (res.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
      : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie') as string]
        : [];
  for (const raw of list) {
    const first = raw.split(';')[0]?.trim();
    if (!first) continue;
    cookies = cookies ? `${cookies}; ${first}` : first;
  }
  return cookies;
}

async function warmSession(): Promise<string> {
  let cookies = '';
  for (const url of ['https://www.nseindia.com', 'https://www.nseindia.com/option-chain']) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: cookies,
        },
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
      });
      cookies = mergeCookies(cookies, res);
    } catch {
      /* continue */
    }
  }
  return cookies;
}

async function fetchJson(url: string, cookies: string): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      Cookie: cookies,
      Referer: 'https://www.nseindia.com/option-chain',
      'X-Requested-With': 'XMLHttpRequest',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, json: null };
  }
  return { ok: true, status: res.status, json: await res.json() };
}

export async function GET(req: NextRequest) {
  const secret = process.env.NSE_PROXY_SECRET;
  if (secret) {
    const hdr = req.headers.get('x-nse-proxy-secret');
    if (hdr !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'NIFTY').toUpperCase();
  const expiryParam = searchParams.get('expiry') || '';

  try {
    const cookies = await warmSession();
    if (!cookies) {
      return NextResponse.json(
        { success: false, error: 'NSE session warm failed' },
        { status: 502 },
      );
    }

    const info = await fetchJson(
      `https://www.nseindia.com/api/option-chain-contract-info?symbol=${encodeURIComponent(symbol)}`,
      cookies,
    );
    if (!info.ok || !info.json) {
      return NextResponse.json(
        { success: false, error: `contract-info ${info.status}` },
        { status: 502 },
      );
    }

    const raw = info.json as { expiryDates?: string[] };
    const rawExpiryDates = raw.expiryDates || [];
    if (!rawExpiryDates.length) {
      return NextResponse.json(
        { success: false, error: 'No expiries from NSE' },
        { status: 502 },
      );
    }

    const normalize = (d: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      const m = /^(\d{1,2})[-/\s]([A-Za-z]{3})[-/\s](\d{4})$/.exec(d);
      if (m) {
        const months: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
        };
        const mm = months[m[2].toLowerCase()];
        if (mm) return `${m[3]}-${mm}-${m[1].padStart(2, '0')}`;
      }
      const dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(d);
      if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
      return d;
    };

    const expiryDatesIso = rawExpiryDates.map(normalize);
    const targetIso = expiryParam ? normalize(expiryParam) : expiryDatesIso[0];
    const idx = Math.max(0, expiryDatesIso.indexOf(targetIso));
    const nseExpiry = rawExpiryDates[idx] || rawExpiryDates[0];

    const isIndex = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX'].includes(symbol);
    const type = isIndex ? 'Indices' : 'Equity';
    const chainUrl =
      `https://www.nseindia.com/api/option-chain-v3?type=${type}` +
      `&symbol=${encodeURIComponent(symbol)}&expiry=${encodeURIComponent(nseExpiry)}`;

    const chain = await fetchJson(chainUrl, cookies);
    if (!chain.ok || !chain.json) {
      return NextResponse.json(
        { success: false, error: `option-chain-v3 ${chain.status}` },
        { status: 502 },
      );
    }

    const payload = chain.json as { records?: Record<string, unknown> };
    const merged = {
      ...payload,
      records: {
        ...(payload.records || {}),
        expiryDates: rawExpiryDates,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        selectedExpiryIso: targetIso || expiryDatesIso[0],
        rawExpiryDates,
        nseJson: merged,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'NSE proxy failed';
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
