import { Provider, registerProvider, SearchResultItem } from './index';

function getPanSouConfig() {
  return {
    baseUrl: process.env.PANSOU_BASE_URL || 'https://www.pansou.com',
  };
}

const PanSouProvider: Provider = {
  key: 'pansou',
  name: 'PanSou',
  async search(query: string): Promise<SearchResultItem[]> {
    const { baseUrl } = getPanSouConfig();
    // NOTE: PanSou does not provide official API; this is a placeholder.
    // A server-side crawler or third-party API should be plugged here.
    // For now, return empty result list.
    return [];
  },
};

registerProvider(PanSouProvider);

export default PanSouProvider;