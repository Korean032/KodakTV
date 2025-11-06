/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 这里应校验 Telegram 的签名与 Bot Token；当前为占位逻辑
    const { username } = body as { username?: string };
    if (!username) return NextResponse.json({ ok: false, error: '缺少用户名' }, { status: 400 });
    const exist = await db.checkUserExist(username);
    if (!exist) {
      await db.registerUser(username, Math.random().toString(36).slice(2));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}