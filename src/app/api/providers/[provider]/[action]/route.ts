import { NextRequest, NextResponse } from 'next/server';
import '../../../../../lib/providers/youtube';
import '../../../../../lib/providers/pansou';
import '../../../../../lib/providers/shortdrama';
import '../../../../../lib/providers/iptv';
import '../../../../../lib/providers/bangumi';
import '../../../../../lib/providers/ai';
import '../../../../../lib/providers/tmdb';
import { getProvider } from '@/lib/providers';

export async function GET(req: NextRequest, { params }: { params: { provider: string; action: string } }) {
  const { provider, action } = params;
  const p = getProvider(provider);
  if (!p) {
    return NextResponse.json({ error: 'provider_not_found' }, { status: 404 });
  }
  const { searchParams } = new URL(req.url);
  // Build options from query params
  const opts: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (key !== 'q' && key !== 'id') {
      opts[key] = value;
    }
  });
  try {
    switch (action) {
      case 'search': {
        const q = searchParams.get('q') || '';
        const res = await (p.search?.(q, opts) || Promise.resolve([]));
        return NextResponse.json({ items: res });
      }
      case 'play': {
        const id = searchParams.get('id') || '';
        const res = await (p.getPlayInfo?.(id, opts) || Promise.resolve({}));
        return NextResponse.json(res);
      }
      case 'live': {
        const res = await (p.getLiveChannels?.(opts) || Promise.resolve(null));
        return NextResponse.json(res);
      }
      case 'epg': {
        const channelId = searchParams.get('id') || '';
        const res = await (p.getEPG?.(channelId, opts) || Promise.resolve({}));
        return NextResponse.json(res);
      }
      default:
        return NextResponse.json({ error: 'action_not_supported' }, { status: 501 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'provider_error', message: e?.message }, { status: 500 });
  }
}