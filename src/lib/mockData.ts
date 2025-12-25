import { PNodeInfo, NetworkStats, VersionDistribution, UptimeBucket } from './types';
import { calculateNetworkStats, calculateVersionDistribution, calculateUptimeBuckets, formatStorage } from './utils';

const versions = ['1.18.23', '1.18.22', '1.18.21', '1.17.35', '1.17.34'];

function generatePubkey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export function generateMockPNodes(count: number = 150): PNodeInfo[] {
  return Array.from({ length: count }, (_, i) => {
    const storageBytes = Math.floor(Math.random() * 5e12) + 1e10;
    const uptime = Math.floor(Math.random() * 30) + 70;
    const status = uptime > 95 ? 'online' : uptime > 80 ? 'degraded' : 'offline';

    return {
      id: `pnode-${i + 1}`,
      pubkey: generatePubkey(),
      ip: generateIP(),
      gossip: `${generateIP()}:8001`,
      version: versions[Math.floor(Math.random() * versions.length)],
      uptime,
      storageUsed: formatStorage(storageBytes),
      storageUsedBytes: storageBytes,
      storageCommitted: storageBytes * (Math.floor(Math.random() * 3) + 2), // 2x to 5x of used
      podsCount: Math.floor(Math.random() * 50) + 1,
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
      status,
    };
  });
}

// Initial mock data
export const mockPNodes = generateMockPNodes(150);
export const mockNetworkStats = calculateNetworkStats(mockPNodes);
export const mockVersionDistribution = calculateVersionDistribution(mockPNodes);
export const mockUptimeBuckets = calculateUptimeBuckets(mockPNodes);
