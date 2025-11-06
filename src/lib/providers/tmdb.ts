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
    if (opts?.kind === 'calendar') {
      const region = cfg().region;
      const urls = [
        `${base}/movie/upcoming?language=${lang}&region=${region}&api_key=${apiKey}`,
        `${base}/tv/on_the_air?language=${lang}&api_key=${apiKey}`,
      ];
      const results: SearchResultItem[] = [];
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);
      if (opts?.week === 'next') {
        // 下一周范围
        const day = now.getDay(); // 0-6
        const daysUntilNextMonday = ((8 - day) % 7) || 7;
        start.setDate(now.getDate() + daysUntilNextMonday);
        end.setDate(start.getDate() + 6);
      } else {
        // 本周范围（周一至周日）
        const day = now.getDay(); // 周日=0
        const diffToMonday = day === 0 ? -6 : 1 - day;
        start.setDate(now.getDate() + diffToMonday);
        end.setDate(start.getDate() + 6);
      }
      const inRange = (d?: string) => {
        if (!d) return false;
        const dt = new Date(d);
        return dt >= new Date(start.toDateString()) && dt <= new Date(end.toDateString());
      };
      for (const url of urls) {
        try {
          const data = await fetchJSON(url);
          (data?.results || []).forEach((m: any) => {
            const title = m.title || m.name;
            const cover = m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : undefined;
            const year = (m.release_date || m.first_air_date || '').slice(0, 4);
            const date = m.release_date || m.first_air_date || '';
            if (!opts?.week || inRange(date)) {
              results.push({
                id: String(m.id),
                title,
                cover,
                source_name: 'TMDB',
                type: m.title ? 'movie' : 'tv',
                year,
                date,
              });
            }
          });
        } catch {
          // ignore
        }
      }
      return results;
    }
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