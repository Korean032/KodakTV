/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 'localstorage';
  if (storageType === 'localstorage') {
    return NextResponse.json(
      {
        error: '不支持本地存储进行管理员配置',
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const authInfo = getAuthInfoFromCookie(request);
    if (!authInfo || !authInfo.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const username = authInfo.username;

    const {
      SiteName,
      Announcement,
      SearchDownstreamMaxPage,
      SiteInterfaceCacheTime,
      DoubanProxyType,
      DoubanProxy,
      DoubanImageProxyType,
      DoubanImageProxy,
      DisableYellowFilter,
      FluidSearch,
      EnableYouTube,
      EnablePanSou,
      EnableShortDrama,
      EnableIPTV,
      EnableBangumi,
      EnableAIRecommend,
      EnableTMDB,
      AIModel,
      AISystemPrompt,
      AIProvider,
      AIAPIBase,
      AIAPIPath,
      OpenAIKey,
      AzureOpenAIEndpoint,
      AzureOpenAIDeployment,
      AzureOpenAIApiVersion,
      AIEnableRateLimit,
      AIRetryMaxAttempts,
      AIRetryDelayMs,
    } = body as {
      SiteName: string;
      Announcement: string;
      SearchDownstreamMaxPage: number;
      SiteInterfaceCacheTime: number;
      DoubanProxyType: string;
      DoubanProxy: string;
      DoubanImageProxyType: string;
      DoubanImageProxy: string;
      DisableYellowFilter: boolean;
      FluidSearch: boolean;
      EnableYouTube?: boolean;
      EnablePanSou?: boolean;
      EnableShortDrama?: boolean;
      EnableIPTV?: boolean;
      EnableBangumi?: boolean;
      EnableAIRecommend?: boolean;
      EnableTMDB?: boolean;
      AIModel?: string;
      AISystemPrompt?: string;
      AIProvider?: string;
      AIAPIBase?: string;
      AIAPIPath?: string;
      OpenAIKey?: string;
      AzureOpenAIEndpoint?: string;
      AzureOpenAIDeployment?: string;
      AzureOpenAIApiVersion?: string;
      AIEnableRateLimit?: boolean;
      AIRetryMaxAttempts?: number;
      AIRetryDelayMs?: number;
    };

    // 参数校验
    if (
      typeof SiteName !== 'string' ||
      typeof Announcement !== 'string' ||
      typeof SearchDownstreamMaxPage !== 'number' ||
      typeof SiteInterfaceCacheTime !== 'number' ||
      typeof DoubanProxyType !== 'string' ||
      typeof DoubanProxy !== 'string' ||
      typeof DoubanImageProxyType !== 'string' ||
      typeof DoubanImageProxy !== 'string' ||
      typeof DisableYellowFilter !== 'boolean' ||
      typeof FluidSearch !== 'boolean' ||
      (EnableYouTube !== undefined && typeof EnableYouTube !== 'boolean') ||
      (EnablePanSou !== undefined && typeof EnablePanSou !== 'boolean') ||
      (EnableShortDrama !== undefined && typeof EnableShortDrama !== 'boolean') ||
      (EnableIPTV !== undefined && typeof EnableIPTV !== 'boolean') ||
      (EnableBangumi !== undefined && typeof EnableBangumi !== 'boolean')
      || (EnableAIRecommend !== undefined && typeof EnableAIRecommend !== 'boolean')
      || (EnableTMDB !== undefined && typeof EnableTMDB !== 'boolean')
      || (AIModel !== undefined && typeof AIModel !== 'string')
      || (AISystemPrompt !== undefined && typeof AISystemPrompt !== 'string')
      || (AIProvider !== undefined && typeof AIProvider !== 'string')
      || (AIAPIBase !== undefined && typeof AIAPIBase !== 'string')
      || (AIAPIPath !== undefined && typeof AIAPIPath !== 'string')
      || (OpenAIKey !== undefined && typeof OpenAIKey !== 'string')
      || (AzureOpenAIEndpoint !== undefined && typeof AzureOpenAIEndpoint !== 'string')
      || (AzureOpenAIDeployment !== undefined && typeof AzureOpenAIDeployment !== 'string')
      || (AzureOpenAIApiVersion !== undefined && typeof AzureOpenAIApiVersion !== 'string')
      || (AIEnableRateLimit !== undefined && typeof AIEnableRateLimit !== 'boolean')
      || (AIRetryMaxAttempts !== undefined && typeof AIRetryMaxAttempts !== 'number')
      || (AIRetryDelayMs !== undefined && typeof AIRetryDelayMs !== 'number')
    ) {
      return NextResponse.json({ error: '参数格式错误' }, { status: 400 });
    }

    const adminConfig = await getConfig();

    // 权限校验
    if (username !== process.env.USERNAME) {
      // 管理员
      const user = adminConfig.UserConfig.Users.find(
        (u) => u.username === username
      );
      if (!user || user.role !== 'admin' || user.banned) {
        return NextResponse.json({ error: '权限不足' }, { status: 401 });
      }
    }

    // 更新缓存中的站点设置
    adminConfig.SiteConfig = {
      SiteName,
      Announcement,
      SearchDownstreamMaxPage,
      SiteInterfaceCacheTime,
      DoubanProxyType,
      DoubanProxy,
      DoubanImageProxyType,
      DoubanImageProxy,
      DisableYellowFilter,
      FluidSearch,
      EnableYouTube: !!EnableYouTube,
      EnablePanSou: !!EnablePanSou,
      EnableShortDrama: !!EnableShortDrama,
      EnableIPTV: EnableIPTV ?? adminConfig.SiteConfig.EnableIPTV ?? true,
      EnableBangumi: EnableBangumi ?? adminConfig.SiteConfig.EnableBangumi ?? true,
      EnableAIRecommend: EnableAIRecommend ?? adminConfig.SiteConfig.EnableAIRecommend ?? false,
      EnableTMDB: EnableTMDB ?? adminConfig.SiteConfig.EnableTMDB ?? true,
      AIModel: AIModel ?? adminConfig.SiteConfig.AIModel ?? '',
      AISystemPrompt: AISystemPrompt ?? adminConfig.SiteConfig.AISystemPrompt ?? '',
      AIProvider: AIProvider ?? adminConfig.SiteConfig.AIProvider ?? 'openai',
      AIAPIBase: AIAPIBase ?? adminConfig.SiteConfig.AIAPIBase ?? '',
      AIAPIPath: AIAPIPath ?? adminConfig.SiteConfig.AIAPIPath ?? '',
      OpenAIKey: OpenAIKey ?? adminConfig.SiteConfig.OpenAIKey ?? '',
      AzureOpenAIEndpoint: AzureOpenAIEndpoint ?? adminConfig.SiteConfig.AzureOpenAIEndpoint ?? '',
      AzureOpenAIDeployment: AzureOpenAIDeployment ?? adminConfig.SiteConfig.AzureOpenAIDeployment ?? '',
      AzureOpenAIApiVersion: AzureOpenAIApiVersion ?? adminConfig.SiteConfig.AzureOpenAIApiVersion ?? '',
      AIEnableRateLimit: AIEnableRateLimit ?? adminConfig.SiteConfig.AIEnableRateLimit ?? false,
      AIRetryMaxAttempts: AIRetryMaxAttempts ?? adminConfig.SiteConfig.AIRetryMaxAttempts ?? 2,
      AIRetryDelayMs: AIRetryDelayMs ?? adminConfig.SiteConfig.AIRetryDelayMs ?? 500,
    };

    // 写入数据库
    await db.saveAdminConfig(adminConfig);

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          'Cache-Control': 'no-store', // 不缓存结果
        },
      }
    );
  } catch (error) {
    console.error('更新站点配置失败:', error);
    return NextResponse.json(
      {
        error: '更新站点配置失败',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
