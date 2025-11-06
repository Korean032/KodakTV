/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthInfoFromCookie(req);
    if (!auth?.username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const adminConfig = await getConfig();
    const operatorIsOwner = auth.username === process.env.USERNAME;
    if (!operatorIsOwner) return NextResponse.json({ error: '仅站长可执行清理' }, { status: 401 });

    const { days, action } = await req.json().catch(()=>({})) as { days?: number; action?: 'ban'|'delete' };
    const retentionDays = days ?? adminConfig.SiteConfig.InactiveRetentionDays ?? 30;
    const cleanupAction = action ?? adminConfig.SiteConfig.InactiveCleanupAction ?? 'ban';
    const cutoff = Date.now() - retentionDays * 24 * 3600 * 1000;

    const users = await db.getAllUsers();
    const affected: { username: string; lastActive?: number }[] = [];

    for (const u of users) {
      const rec = await db.getAllPlayRecords(u);
      const lastActive = Object.values(rec || {}).reduce((m, r: any)=>Math.max(m, Number((r as any).save_time)||0), 0);
      // 若没有播放记录，则视为从未活跃
      const isInactive = (lastActive || 0) < cutoff;
      if (isInactive) {
        affected.push({ username: u, lastActive });
        const entry = adminConfig.UserConfig.Users.find(x=>x.username===u);
        if (entry && entry.role !== 'owner') {
          if (cleanupAction === 'delete') {
            await db.deleteUser(u);
            entry.banned = true; // 标记便于UI显示（物理删除后保留痕迹）
          } else {
            entry.banned = true;
          }
        }
      }
    }

    await db.saveAdminConfig(adminConfig);
    return NextResponse.json({ ok: true, retentionDays, action: cleanupAction, affected });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}