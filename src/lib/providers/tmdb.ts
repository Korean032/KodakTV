import { Provider, registerProvider, SearchResultItem } from './index';

function cfg() {
  return {
    apiKey: process.env.TMDB_API_KEY || '',
    base: 'https://api.themoviedb.org/3',
    lang: process.env.TMDB_LANG || 'zh-CN',
    region: process.env.TMDB_REGION || 'CN',
  };
}

async function fetchJSON(url: string) {
  const res = await fetch(url);
  return res.json();
}

const TmdbProvider: Provider = {
  key: 'tmdb',
  name: 'TMDB',
  async search(query: string, opts?: Record<string, any>): Promise<SearchResultItem[]> {
    const { apiKey, base, lang } = cfg();
    if (!apiKey) return [];
    if (opts?.kind === 'actor') {
      const url = `${base}/search/person?query=${encodeURIComponent(query)}&language=${lang}&include_adult=false&api_key=${apiKey}`;
      const data = await fetchJSON(url);
      return (data?.results || []).map((p: any) => ({
        id: String(p.id),
        title: p.name,
        cover: p.profile_path ? `https://image.tmdb.org/t/p/w300${p.profile_path}` : undefined,
        source_name: 'TMDB',
        type: 'vod',
        year: String(p.known_for_department || ''),
      }));
    }
    // 默认按电影搜索
    const url = `${base}/search/movie?query=${encodeURIComponent(query)}&language=${lang}&api_key=${apiKey}`;
    const data = await fetchJSON(url);
    return (data?.results || []).map((m: any) => ({
      id: String(m.id),
      title: m.title,
      cover: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : undefined,
      source_name: 'TMDB',
      type: 'movie',
      year: (m.release_date || '').slice(0, 4),
    }));
  },
  async getPlayInfo(_id: string): Promise<{ url?: string; embedHtml?: string }>{
    return {};
  },
};

registerProvider(TmdbProvider);

export default TmdbProvider;