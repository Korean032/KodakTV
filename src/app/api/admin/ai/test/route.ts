/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

import { getAuthInfoFromCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildEndpoint(provider: string, apiKey: string, base?: string, path?: string, azure?: { endpoint?: string; deployment?: string; apiVersion?: string }) {
  provider = (provider || 'openai').toLowerCase();
  if (provider === 'azure') {
    const endpoint = (azure?.endpoint || '').replace(/\/$/, '');
    const deployment = azure?.deployment || '';
    const apiVersion = azure?.apiVersion || '2024-02-01';
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const headers = { 'Content-Type': 'application/json', 'api-key': apiKey } as Record<string, string>;
    return { url, headers };
  }
  const apiBase = (base || 'https://api.openai.com/v1').replace(/\/$/, '');
  const apiPath = path || '/chat/completions';
  const url = `${apiBase}${apiPath}`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` } as Record<string, string>;
  return { url, headers };
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthInfoFromCookie(req);
    if (!auth?.username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      apiKey,
      provider,
      base,
      path,
      model,
      systemPrompt,
      azureEndpoint,
      azureDeployment,
      azureApiVersion,
      prompt = '热门',
      type = 'movie',
      enableRateLimit,
      retryMaxAttempts,
      retryDelayMs,
    } = body as Record<string, any>;

    if (!apiKey) return NextResponse.json({ ok: false, error: '缺少 apiKey' }, { status: 400 });

    const { url, headers } = buildEndpoint(provider, apiKey, base, path, {
      endpoint: azureEndpoint,
      deployment: azureDeployment,
      apiVersion: azureApiVersion,
    });

    const payload = {
      model: model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt || '你是一个影视推荐助手。只返回JSON对象: {"items": [{"title": "..."}]}' },
        { role: 'user', content: `类型: ${type}\n提示: ${prompt}\n请仅返回JSON对象: {"items": [{"title": "..."}]}` },
      ],
      temperature: 0.7,
    };

    const started = Date.now();
    let resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...payload, response_format: { type: 'json_object' } }) });
    if (!resp.ok) {
      const maxAttempts = Number(retryMaxAttempts || 2);
      const delayMs = Number(retryDelayMs || 500);
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, delayMs));
        resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
        if (resp.ok) break;
      }
    }
    const json = await resp.json().catch(() => ({}));
    const text = json?.choices?.[0]?.message?.content || '';
    let items: any[] = [];
    try {
      const parsed = JSON.parse(text);
      items = Array.isArray(parsed?.items) ? parsed.items : [];
    } catch {
      const match = text?.match(/\[\s*{[\s\S]*}\s*\]/);
      items = match ? JSON.parse(match[0]) : [];
    }
    const elapsed = Date.now() - started;
    return NextResponse.json({ ok: true, status: resp.status, itemsCount: items.length, ms: elapsed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}