export interface PNodeInfo {
  id: string;
  pubkey: string;
  ip: string;
  gossip: string;
  version: string;
  uptime: number; // 0-100
  storageUsed: string; // e.g., "1.2 TB"
  storageUsedBytes: number;
  podsCount: number;
  updatedAt: Date;
  status: 'online' | 'degraded' | 'offline';
  country?: string;
  city?: string;
  rpcPort?: number;
  storageCommitted?: number;
  isPublic?: boolean;
  lat?: number;
  lon?: number;
}

export interface NetworkStats {
  totalPNodes: number;
  activeNodes: number;
  avgUptime: number;
  totalStorage: string;
  totalStorageBytes: number;
  activePods: number;
  healthScore: number;
  lastUpdated: Date;
}

export interface VersionDistribution {
  version: string;
  count: number;
  percentage: number;
}

export interface UptimeBucket {
  range: string;
  count: number;
  percentage: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: keyof PNodeInfo;
  direction: SortDirection;
}

export interface FilterConfig {
  search: string;
  version: string | null;
  uptimeMin: number;
  storageMin: number;
  status: string | null;
}
