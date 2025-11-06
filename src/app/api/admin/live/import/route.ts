/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';
import { refreshLiveChannels } from '@/lib/live';

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

    const config = await getConfig();
    if (username !== process.env.USERNAME) {
      const user = config.UserConfig.Users.find((u) => u.username === username);
      if (!user || user.role !== 'admin' || user.banned) {
        return NextResponse.json({ error: '权限不足' }, { status: 401 });
      }
    }

    const body = await request.json();
    const items = body?.items as Array<{ key: string; name: string; url: string; ua?: string; epg?: string; disabled?: boolean }>;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '导入数据为空或格式错误' }, { status: 400 });
    }

    const map = new Map((config.LiveConfig || []).map((l) => [l.key, l]));
    items.forEach((item) => {
      const { key, name, url, ua, epg, disabled } = item || {} as any;
      if (!key || !name || !url) {
        return; // 跳过非法项
      }
      const existing = map.get(key);
      if (existing) {
        if (existing.from === 'custom') {
          existing.name = name;
          existing.url = url;
          existing.ua = ua || '';
          existing.epg = epg || '';
          if (typeof disabled === 'boolean') existing.disabled = disabled;
        }
      } else {
        const liveInfo = {
          key,
          name,
          url,
          ua: ua || '',
          epg: epg || '',
          from: 'custom' as const,
          channelNumber: 0,
          disabled: !!disabled,
        };
        config.LiveConfig = config.LiveConfig || [];
        config.LiveConfig.push(liveInfo);
      }
    });

    // 刷新频道数量（最佳努力）
    const refreshPromises = (config.LiveConfig || []).map(async (liveInfo) => {
      try {
        const nums = await refreshLiveChannels(liveInfo);
        liveInfo.channelNumber = nums;
      } catch (_) {
        // ignore
      }
    });
    await Promise.all(refreshPromises);

    await db.saveAdminConfig(config);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('导入直播源失败:', error);
    return NextResponse.json(
      { error: '导入直播源失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}