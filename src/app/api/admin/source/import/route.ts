/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
    if (storageType === 'localstorage') {
      return NextResponse.json(
        { error: '不支持本地存储进行管理员配置' },
        { status: 400 }
      );
    }

    const authInfo = getAuthInfoFromCookie(request);
    const username = authInfo?.username;
    if (!username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminConfig = await getConfig();
    if (username !== process.env.USERNAME) {
      const user = adminConfig.UserConfig.Users.find((u) => u.username === username);
      if (!user || user.role !== 'admin' || user.banned) {
        return NextResponse.json({ error: '权限不足' }, { status: 401 });
      }
    }

    const body = await request.json();
    const items = body?.items as Array<{ key: string; name: string; api: string; detail?: string; disabled?: boolean }>;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '导入数据为空或格式错误' }, { status: 400 });
    }

    const map = new Map(adminConfig.SourceConfig.map((s) => [s.key, s]));
    items.forEach((item) => {
      const { key, name, api, detail, disabled } = item || {} as any;
      if (!key || !name || !api) {
        return; // 跳过非法项
      }
      const existing = map.get(key);
      if (existing) {
        // 仅允许更新自定义源
        if (existing.from === 'custom') {
          existing.name = name;
          existing.api = api;
          existing.detail = detail;
          if (typeof disabled === 'boolean') existing.disabled = disabled;
        }
      } else {
        adminConfig.SourceConfig.push({
          key,
          name,
          api,
          detail,
          from: 'custom',
          disabled: !!disabled,
        });
      }
    });

    await db.saveAdminConfig(adminConfig);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('导入视频源失败:', error);
    return NextResponse.json(
      { error: '导入视频源失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}