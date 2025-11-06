export type SearchResultItem = {
  id: string;
  title: string;
  cover?: string;
  year?: string;
  source_name?: string;
  type?: 'movie' | 'tv' | 'short' | 'live' | 'vod';
  // optional fields for calendar/grouping
  date?: string;
};

export interface Provider {
  key: string;
  name: string;
  // Basic search
  search?: (query: string, opts?: Record<string, any>) => Promise<SearchResultItem[]>;
  // Playback url or embed info
  getPlayInfo?: (id: string, opts?: Record<string, any>) => Promise<{ url?: string; embedHtml?: string; } >;
  // Live specific
  getLiveChannels?: (opts?: Record<string, any>) => Promise<any>;
  getEPG?: (channelId: string, opts?: Record<string, any>) => Promise<any>;
}

export const providersRegistry: Record<string, Provider> = {};

export function registerProvider(p: Provider) {
  providersRegistry[p.key] = p;
}

export function getProvider(key: string): Provider | undefined {
  return providersRegistry[key];
}