import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function computeLevel(totalTime: number) {
  // 简易等级：<2h 新人、<10h 进阶、<50h 高玩、>=50h 大师
  const hours = totalTime / 3600;
  if (hours < 2) return '新人';
  if (hours < 10) return '进阶';
  if (hours < 50) return '高玩';
  return '大师';
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthInfoFromCookie(req);
    if (!auth?.username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rec = await db.getAllPlayRecords(auth.username);
    const totalTime = Object.values(rec || {}).reduce((sum, r: any) => sum + (Number((r as any).total_time)||0), 0);
    const level = computeLevel(totalTime);
    return NextResponse.json({ ok: true, user: auth.username, totalTime, level });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}