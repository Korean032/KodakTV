/* eslint-disable no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
    // 仅站长或管理员可导出
    if (username !== process.env.USERNAME) {
      const user = config.UserConfig.Users.find((u) => u.username === username);
      if (!user || user.role !== 'admin' || user.banned) {
        return NextResponse.json({ error: '权限不足' }, { status: 401 });
      }
    }

    const items = (config.SourceConfig || []).map(({ key, name, api, detail, disabled }) => ({
      key,
      name,
      api,
      detail,
      disabled: !!disabled,
    }));

    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('导出视频源失败:', error);
    return NextResponse.json(
      { error: '导出视频源失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}