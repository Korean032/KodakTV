/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';
import { getAvailableApiSites, getCacheTime, getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';
import { yellowWords } from '@/lib/yellow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authInfo = getAuthInfoFromCookie(request);
  if (!authInfo || !authInfo.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    const cacheTime = await getCacheTime();
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  }

  const config = await getConfig();
  const apiSites = await getAvailableApiSites(authInfo.username);

  // 语言感知与模糊变体（简单版）
  const variants = new Set<string>();
  if (query) {
    const q = query.trim();
    variants.add(q);
    variants.add(q.replace(/\s+/g, ''));
    variants.add(q.replace(/[·・•]/g, ' '));
    // 中文：去除常见季/集修饰以扩展匹配
    if (/[^\x00-\x7F]/.test(q)) {
      variants.add(q.replace(/第[一二三四五六七八九十0-9]+季/g, '').trim());
      variants.add(q.replace(/第[一二三四五六七八九十0-9]+集/g, '').trim());
    }
  }

  // 添加超时控制和错误处理，避免慢接口拖累整体响应
  const searchPromises = apiSites.map((site) => {
    const perVariant = Array.from(variants).map((v) =>
      Promise.race([
        searchFromApi(site, v),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${site.name} timeout`)), 20000)),
      ]).catch((err) => {
        console.warn(`搜索失败 ${site.name}(${v}):`, err.message);
        return [] as any[];
      })
    );
    return Promise.all(perVariant).then((arrs) => arrs.flat());
  });

  try {
    const results = await Promise.allSettled(searchPromises);
    const successResults = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<any>).value);
    let flattenedResults = successResults.flat();
    // 去重：按标题+源
    const seen = new Set<string>();
    flattenedResults = flattenedResults.filter((r: any) => {
      const key = (r.title || '') + (r.source || r.source_name || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!config.SiteConfig.DisableYellowFilter) {
      flattenedResults = flattenedResults.filter((result) => {
        const typeName = result.type_name || '';
        return !yellowWords.some((word: string) => typeName.includes(word));
      });
    }
    const cacheTime = await getCacheTime();

    if (flattenedResults.length === 0) {
      // no cache if empty
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    return NextResponse.json(
      { results: flattenedResults },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}`,
          'CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheTime}`,
          'Netlify-Vary': 'query',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: '搜索失败' }, { status: 500 });
  }
}
