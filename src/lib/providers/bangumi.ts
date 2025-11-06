import { Provider, registerProvider, SearchResultItem } from './index';
import { getDoubanRecommends } from '@/lib/douban.client';

const BangumiProvider: Provider = {
  key: 'bangumi',
  name: 'Bangumi',
  async search(query: string): Promise<SearchResultItem[]> {
    // Leverage existing douban/bangumi client for anime info (placeholder)
    const res = await getDoubanRecommends({ kind: 'tv', pageLimit: 20, label: '动漫' });
    return (res.items || []).filter((it: any) => it.title?.includes(query)).map((it: any) => ({
      id: String(it.id),
      title: it.title,
      cover: it.poster,
      year: it.year,
      source_name: 'Bangumi',
      type: 'tv',
    }));
  },
};

registerProvider(BangumiProvider);

export default BangumiProvider;