import { Provider, registerProvider, SearchResultItem } from './index';
import { getConfig } from '@/lib/config';
import { searchFromApi } from '@/lib/downstream';

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

function getAiEndpoint(apiKey: string) {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  if (provider === 'azure') {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || '';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01';
    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    };
    return { url, headers };
  } else {
    // OpenAI 兼容接口（OpenAI、OpenRouter、Groq、Together 等）
    const base = (process.env.AI_API_BASE || 'https://api.openai.com/v1').replace(/\/$/, '');
    const path = process.env.AI_API_PATH || '/chat/completions';
    const url = `${base}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    return { url, headers };
  }
}

const AiProvider: Provider = {
  key: 'ai',
  name: 'AI Recommend',
  async search(prompt: string, opts?: Record<string, any>): Promise<SearchResultItem[]> {
    const { apiKey, model, systemPrompt } = await getAiConfig();
    // 无密钥时的降级：使用站点源进行聚合搜索，作为“启用即用”的智能推荐
    if (!apiKey) {
      try {
        const cfg = await getConfig();
        const query = prompt || '热门';
        const sources = (cfg.SourceConfig || []).slice(0, 4); // 最多取前4个源以控时
        const tasks = sources.map((s) => searchFromApi(s as any, query).catch(()=>[]));
        const results = await Promise.all(tasks);
        const flat = results.flat();
        const dedupByTitle = new Map<string, any>();
        flat.forEach((r: any) => {
          const key = (r.title || '') + (r.source_name || '');
          if (!dedupByTitle.has(key)) dedupByTitle.set(key, r);
        });
        const picked = Array.from(dedupByTitle.values()).slice(0, 10);
        return picked.map((r: any, idx: number) => ({
          id: String(r.douban_id || r.id || idx + 1),
          title: r.title,
          cover: r.poster,
          source_name: r.source_name || '聚合',
          type: (opts?.type as any) || 'vod',
        }));
      } catch {
        return [];
      }
    }

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
      const { url, headers } = getAiEndpoint(apiKey);
      // 首次请求（带 response_format）
      let res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      // 某些免费或兼容接口不支持 response_format，降级重试
      if (!res.ok) {
        const fallbackBody = { ...body };
        delete (fallbackBody as any).response_format;
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(fallbackBody),
        });
        if (!res.ok) {
          return [];
        }
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