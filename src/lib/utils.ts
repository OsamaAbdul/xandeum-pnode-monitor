import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PNodeInfo, NetworkStats, VersionDistribution, UptimeBucket } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  return `${(bytes / 1e6).toFixed(2)} MB`;
}

export function calculateNetworkStats(pnodes: PNodeInfo[]): NetworkStats {
  const totalStorage = pnodes.reduce((acc, p) => acc + p.storageUsedBytes, 0);
  const avgUptime = pnodes.reduce((acc, p) => acc + p.uptime, 0) / pnodes.length;
  const activePods = pnodes.reduce((acc, p) => acc + p.podsCount, 0);
  const onlineCount = pnodes.filter(p => p.status === 'online').length;

  // Calculate total capacity strictly from real data
  const totalCapacity = pnodes.reduce((acc, p) => acc + (p.storageCommitted || 0), 0);

  const healthScore = pnodes.length > 0
    ? Math.round((onlineCount / pnodes.length) * 100)
    : 0;

  return {
    totalPNodes: pnodes.length,
    activeNodes: onlineCount,
    avgUptime: pnodes.length > 0 ? Math.round((avgUptime * 10) / 10) : 0,
    totalStorage: formatStorage(totalStorage),
    totalStorageBytes: totalStorage,
    totalCapacity: formatStorage(totalCapacity),
    totalCapacityBytes: totalCapacity,
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
