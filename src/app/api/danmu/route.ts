import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DanmuItem = {
  time: number; // seconds
  text: string;
  color?: string;
  mode?: 'scroll' | 'top' | 'bottom';
};

function sampleDanmu(title?: string): DanmuItem[] {
  const base = [
    '欢迎观看～',
    '高能预警！',
    '精彩片段来了',
    '这段节奏很棒',
    '剧情反转真妙',
  ];
  const t = title ? [`${title} 开场`, `${title} 名场面`] : [];
  const arr = [...t, ...base];
  return arr.map((text, i) => ({ time: 2 + i * 5, text, color: '#22c55e', mode: 'scroll' }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || '';
  const id = searchParams.get('id') || '';
  const title = searchParams.get('title') || '';

  // TODO: integrate third-party danmu APIs by source
  // For now, return sample danmu with basic filtering (remove "预告")
  let items = sampleDanmu(title).filter((d) => !/预告/.test(d.text));

  return NextResponse.json({ items });
}