import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DanmuItem = {
  time: number; // seconds
  text: string;
  color?: string;
  mode?: 'scroll' | 'top' | 'bottom';
};

const IN_MEMORY_CACHE = new Map<string, { ts: number; items: DanmuItem[] }>();
const TTL_MS = 30 * 60 * 1000; // 30 minutes

function cacheKey(provider: string, source: string, id: string, title: string) {
  return `${provider}|${source}|${id}|${title}`;
}

function isExpired(entry?: { ts: number }) {
  if (!entry) return true;
  return Date.now() - entry.ts > TTL_MS;
}

function sampleDanmu(title?: string): DanmuItem[] {
  const base = [
    '欢迎观看～',
    '高能预警！',
    '精彩片段来了',
    '这段节奏很棒',
    '剧情反转真妙',
  ];
  const t = title ? [`${title} 开场`, `${title} 名场面`] : [];
  const arr = [...t, ...base];
  return arr.map((text, i) => ({ time: 2 + i * 5, text, color: '#22c55e', mode: 'scroll' }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || '';
  const id = searchParams.get('id') || '';
  const title = searchParams.get('title') || '';
  const provider = (searchParams.get('provider') || 'caiji').toLowerCase();
  const from = Number(searchParams.get('from') || 0);
  const to = Number(searchParams.get('to') || 0);
  const limit = Number(searchParams.get('limit') || 300);

  const key = cacheKey(provider, source, id, title);
  const cached = IN_MEMORY_CACHE.get(key);
  if (cached && !isExpired(cached)) {
    let items = cached.items;
    if (to > 0) items = items.filter((d) => d.time >= from && d.time <= to);
    return NextResponse.json({ items: items.slice(0, limit) });
  }

  // Third-party danmu aggregation (configurable base)
  const base = process.env.DANMU_AGGREGATOR_BASE || '';
  let items: DanmuItem[] = [];
  if (base) {
    try {
      const url = `${base.replace(/\/$/,'')}/danmu?provider=${provider}&source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json().catch(()=>({}));
        const raw: any[] = json.items || json.data || [];
        items = raw.map((r: any) => ({
          time: Number(r.time || r.t || 0),
          text: String(r.text || r.content || ''),
          color: r.color || undefined,
          mode: (r.mode || 'scroll') as DanmuItem['mode'],
        })).filter((d)=>d.text && d.time>=0);
      }
    } catch {
      // ignore network errors, fallback to sample
    }
  }

  if (items.length === 0) {
    items = sampleDanmu(title);
  }

  // Smart content filtering: remove commentary/trailer/etc.
  const badWords = ['解说','预告','混剪','吐槽','推广','广告','预热','前瞻','片段合集'];
  items = items.filter((d) => !badWords.some((w)=> d.text.includes(w)));

  // Range filter and limit
  if (to > 0) items = items.filter((d) => d.time >= from && d.time <= to);
  items = items.slice(0, limit);

  // Cache
  IN_MEMORY_CACHE.set(key, { ts: Date.now(), items });

  return NextResponse.json({ items });
}