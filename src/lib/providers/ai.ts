import { Provider, registerProvider, SearchResultItem } from './index';

function getAiConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY || process.env.OAI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    systemPrompt:
      process.env.AI_SYSTEM_PROMPT ||
      '你是一个影视推荐助手。根据用户喜好生成5条推荐，包含title与可选coverUrl。只返回JSON数组。',
  };
}

const AiProvider: Provider = {
  key: 'ai',
  name: 'AI Recommend',
  async search(prompt: string, opts?: Record<string, any>): Promise<SearchResultItem[]> {
    const { apiKey, model, systemPrompt } = getAiConfig();
    if (!apiKey) return [];

    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `类型: ${opts?.type || 'movie'}\n提示: ${prompt || '热门'}\n请仅返回JSON数组，每项包含title和可选coverUrl。`,
        },
      ],
      temperature: 0.7,
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
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content || '[]';
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, 10).map((it: any, idx: number) => ({
        id: String(idx + 1),
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