import { Provider, registerProvider, SearchResultItem } from './index';

function getYouTubeConfig() {
  return {
    apiKey: process.env.YOUTUBE_API_KEY || '',
    embedDomain: process.env.YOUTUBE_EMBED_DOMAIN || 'www.youtube-nocookie.com',
  };
}

const YouTubeProvider: Provider = {
  key: 'youtube',
  name: 'YouTube',
  async search(query: string): Promise<SearchResultItem[]> {
    const { apiKey } = getYouTubeConfig();
    if (!apiKey) {
      // fallback: return empty and expect client-side embed search later
      return [];
    }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url);
    const json = await res.json();
    const items: SearchResultItem[] = (json.items || []).map((it: any) => ({
      id: it.id.videoId,
      title: it.snippet.title,
      cover: it.snippet.thumbnails?.medium?.url,
      year: (it.snippet.publishedAt || '').slice(0, 4),
      source_name: 'YouTube',
      type: 'vod',
    }));
    return items;
  },
  async getPlayInfo(id: string) {
    const { embedDomain } = getYouTubeConfig();
    const embedHtml = `<iframe width="560" height="315" src="https://${embedDomain}/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    return { embedHtml };
  },
};

registerProvider(YouTubeProvider);

export default YouTubeProvider;