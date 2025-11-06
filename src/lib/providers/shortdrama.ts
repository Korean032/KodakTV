import { Provider, registerProvider, SearchResultItem } from './index';

function getShortDramaConfig() {
  return {
    apiBase: process.env.SHORTDRAMA_API_BASE || '',
    proxyBase: process.env.MOBILE_PROXY_BASE || '',
  };
}

const ShortDramaProvider: Provider = {
  key: 'shortdrama',
  name: '短剧',
  async search(query: string): Promise<SearchResultItem[]> {
    const { apiBase } = getShortDramaConfig();
    if (!apiBase) return [];
    const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    const items: SearchResultItem[] = (json.items || []).map((it: any) => ({
      id: it.id,
      title: it.title,
      cover: it.cover,
      source_name: '短剧',
      type: 'short',
    }));
    return items;
  },
  async getPlayInfo(id: string) {
    const { apiBase, proxyBase } = getShortDramaConfig();
    if (!apiBase) return { url: undefined, embedHtml: undefined };
    const res = await fetch(`${apiBase}/play/${id}`);
    const json = await res.json();
    const url = proxyBase ? `${proxyBase}${encodeURIComponent(json.url)}` : json.url;
    return { url };
  },
};

registerProvider(ShortDramaProvider);

export default ShortDramaProvider;