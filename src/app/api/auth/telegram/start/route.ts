/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cfg = await getConfig();
    const baseUrl = process.env.PUBLIC_BASE_URL || '';
    // 生成一个用于绑定的 magic link（占位实现）
    const token = Math.random().toString(36).slice(2);
    const link = `${baseUrl}/api/auth/telegram/webhook?token=${token}`;
    return NextResponse.json({ ok: true, link, token });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}