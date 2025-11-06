import { Provider, registerProvider } from './index';
import { LiveChannels } from '@/lib/live';

function getIptvConfig() {
  return {
    epgSources: (process.env.IPTV_EPG_SOURCES || '').split(',').filter(Boolean),
    logoProxy: process.env.IPTV_LOGO_PROXY || '',
  };
}

// Minimal stub; real implementation should reuse lib/live.ts
const IptvProvider: Provider = {
  key: 'iptv',
  name: 'IPTV',
  async getLiveChannels(): Promise<LiveChannels | null> {
    // Delegate to existing live mechanisms later
    return null;
  },
  async getEPG(channelId: string): Promise<any> {
    const { epgSources } = getIptvConfig();
    return { channelId, epgSources };
  },
};

registerProvider(IptvProvider);

export default IptvProvider;