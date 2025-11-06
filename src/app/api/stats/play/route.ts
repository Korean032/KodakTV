/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function aggregateRecords(records: Record<string, any>) {
  const values = Object.values(records || {}) as any[];
  const totalPlays = values.length;
  const totalTime = values.reduce((sum, r) => sum + (Number(r.total_time)||0), 0);
  const totalProgress = values.reduce((sum, r) => sum + (Number(r.play_time)||0), 0);
  // top titles by occurence
  const titleCount: Record<string, number> = {};
  values.forEach((r) => { const t = r.title || r.search_title || r.source_name; if (!t) return; titleCount[t] = (titleCount[t]||0)+1; });
  const topTitles = Object.entries(titleCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([title,count])=>({title,count}));
  return { totalPlays, totalTime, totalProgress, topTitles };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'user';

    if (scope === 'global') {
      const users = await db.getAllUsers();
      let aggregate = { totalPlays: 0, totalTime: 0, totalProgress: 0, topTitles: [] as any[] };
      const globalTitles: Record<string, number> = {};
      for (const u of users) {
        const rec = await db.getAllPlayRecords(u);
        const agg = aggregateRecords(rec);
        aggregate.totalPlays += agg.totalPlays;
        aggregate.totalTime += agg.totalTime;
        aggregate.totalProgress += agg.totalProgress;
        agg.topTitles.forEach(({title,count})=>{ globalTitles[title]=(globalTitles[title]||0)+count; });
      }
      aggregate.topTitles = Object.entries(globalTitles).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([title,count])=>({title,count}));
      return NextResponse.json({ ok: true, scope: 'global', ...aggregate });
    }

    const auth = getAuthInfoFromCookie(req);
    if (!auth?.username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rec = await db.getAllPlayRecords(auth.username);
    const agg = aggregateRecords(rec);
    return NextResponse.json({ ok: true, scope: 'user', user: auth.username, ...agg });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}