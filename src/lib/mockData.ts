import { PNodeInfo, NetworkStats, VersionDistribution, UptimeBucket } from './types';

const versions = ['1.18.23', '1.18.22', '1.18.21', '1.17.35', '1.17.34'];
const statuses: ('online' | 'degraded' | 'offline')[] = ['online', 'online', 'online', 'online', 'degraded', 'offline'];

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

function formatStorage(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  return `${(bytes / 1e6).toFixed(2)} MB`;
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
      podsCount: Math.floor(Math.random() * 50) + 1,
      updatedAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
      status,
    };
  });
}

export function calculateNetworkStats(pnodes: PNodeInfo[]): NetworkStats {
  const totalStorage = pnodes.reduce((acc, p) => acc + p.storageUsedBytes, 0);
  const avgUptime = pnodes.reduce((acc, p) => acc + p.uptime, 0) / pnodes.length;
  const activePods = pnodes.reduce((acc, p) => acc + p.podsCount, 0);
  const onlineCount = pnodes.filter(p => p.status === 'online').length;
  const healthScore = pnodes.length > 0
    ? Math.round((onlineCount / pnodes.length) * 100)
    : 0;

  return {
    totalPNodes: pnodes.length,
    activeNodes: onlineCount,
    avgUptime: pnodes.length > 0 ? Math.round((avgUptime * 10) / 10) : 0,
    totalStorage: formatStorage(totalStorage),
    totalStorageBytes: totalStorage,
    activePods,
    healthScore,
    lastUpdated: new Date(),
  };
}

export function calculateVersionDistribution(pnodes: PNodeInfo[]): VersionDistribution[] {
  const counts: Record<string, number> = {};
  pnodes.forEach(p => {
    counts[p.version] = (counts[p.version] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([version, count]) => ({
      version,
      count,
      percentage: Math.round((count / pnodes.length) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateUptimeBuckets(pnodes: PNodeInfo[]): UptimeBucket[] {
  const buckets = [
    { range: '<80%', min: 0, max: 80, count: 0 },
    { range: '80-90%', min: 80, max: 90, count: 0 },
    { range: '90-95%', min: 90, max: 95, count: 0 },
    { range: '>95%', min: 95, max: 101, count: 0 },
  ];

  pnodes.forEach(p => {
    const bucket = buckets.find(b => p.uptime >= b.min && p.uptime < b.max);
    if (bucket) bucket.count++;
  });

  return buckets.map(b => ({
    range: b.range,
    count: b.count,
    percentage: Math.round((b.count / pnodes.length) * 1000) / 10,
  }));
}

// Initial mock data
export const mockPNodes = generateMockPNodes(150);
export const mockNetworkStats = calculateNetworkStats(mockPNodes);
export const mockVersionDistribution = calculateVersionDistribution(mockPNodes);
export const mockUptimeBuckets = calculateUptimeBuckets(mockPNodes);
