import { Provider, registerProvider, SearchResultItem } from './index';
// Placeholder: real implementation should query Bangumi/BGM/Douban server endpoints on the server.

const BangumiProvider: Provider = {
  key: 'bangumi',
  name: 'Bangumi',
  async search(_query: string): Promise<SearchResultItem[]> {
    return [];
  },
};

registerProvider(BangumiProvider);

export default BangumiProvider;
