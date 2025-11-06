import { Provider, registerProvider, SearchResultItem } from './index';
import { getConfig } from '@/lib/config';

async function getAiConfig() {
  try {
    const cfg = await getConfig();
    return {
      apiKey: process.env.OPENAI_API_KEY || process.env.OAI_API_KEY || '',
      model: (process.env.AI_MODEL || cfg.SiteConfig.AIModel || 'gpt-4o-mini') as string,
      systemPrompt:
        (process.env.AI_SYSTEM_PROMPT || cfg.SiteConfig.AISystemPrompt ||
          '你是一个影视推荐助手。只返回JSON对象，形如 {"items": [{"title": "...", "coverUrl": "..."}]}。不得输出除JSON外的任何文本。') as string,
    };
  } catch {
    return {
      apiKey: process.env.OPENAI_API_KEY || process.env.OAI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      systemPrompt:
        process.env.AI_SYSTEM_PROMPT ||
        '你是一个影视推荐助手。只返回JSON对象，形如 {"items": [{"title": "...", "coverUrl": "..."}]}。不得输出除JSON外的任何文本。',
    };
  }
}

const AiProvider: Provider = {
  key: 'ai',
  name: 'AI Recommend',
  async search(prompt: string, opts?: Record<string, any>): Promise<SearchResultItem[]> {
    const { apiKey, model, systemPrompt } = await getAiConfig();
    if (!apiKey) return [];

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `类型: ${opts?.type || 'movie'}\n提示: ${prompt || '热门'}\n请仅返回JSON对象: {"items": [{"title": "...", "coverUrl": "..."}]}，不得输出除JSON外的任何文本。`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    } as any;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return [];
      }
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content || '{"items": []}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        // 尝试从文本中提取第一个 JSON 数组
        const match = text.match(/\[\s*{[\s\S]*}\s*\]/);
        const arr = match ? JSON.parse(match[0]) : [];
        parsed = { items: arr };
      }
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      return items.slice(0, 10).map((it: any, idx: number) => ({
        id: String(it.id || idx + 1),
        title: String(it.title || it.name || '推荐条目'),
        cover: it.coverUrl || it.cover || undefined,
        source_name: 'AI',
        type: (opts?.type as any) || 'vod',
      }));
    } catch {
      return [];
    }
  },
};

registerProvider(AiProvider);

export default AiProvider;