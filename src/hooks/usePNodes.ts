import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PNodeInfo, NetworkStats } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  calculateNetworkStats,
  calculateVersionDistribution,
  calculateUptimeBuckets,
  formatStorage
} from '@/lib/utils';

function mapDbToPNode(row: {
  id: string;
  pubkey: string;
  ip: string;
  gossip: string | null;
  version: string | null;
  uptime: number | null;
  storage_used_bytes: number | null;
  pods_count: number | null;
  status: string | null;
  updated_at: string;
  country?: string;
  city?: string;
  rpc_port?: number;
  storage_committed?: number;
  is_public?: boolean;
  lat?: number;
  lon?: number;
}): PNodeInfo {
  const storageBytes = row.storage_used_bytes || 0;
  const uptime = Number(row.uptime) || 0;

  return {
    id: row.id,
    pubkey: row.pubkey,
    ip: row.ip,
    gossip: row.gossip || '',
    version: row.version || 'unknown',
    uptime,
    storageUsed: formatStorage(storageBytes),
    storageUsedBytes: storageBytes,
    podsCount: row.pods_count || 0,
    updatedAt: new Date(row.updated_at),
    status: (row.status as 'online' | 'degraded' | 'offline') || 'offline',
    country: row.country || 'Unknown',
    city: row.city || 'Unknown',
    rpcPort: row.rpc_port,
    storageCommitted: row.storage_committed,
    isPublic: row.is_public,
    lat: row.lat,
    lon: row.lon
  };
}

export function usePNodes() {
  const [pnodes, setPNodes] = useState<PNodeInfo[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    totalPNodes: 0,
    activeNodes: 0,
    avgUptime: 0,
    totalStorage: '0 MB',
    totalStorageBytes: 0,
    totalCapacity: '0 MB',
    totalCapacityBytes: 0,
    activePods: 0,
    healthScore: 0,
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pNodes from database
  const fetchPNodes = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('pnodes')
        .select('*')
        .order('uptime', { ascending: false });

      if (fetchError) {

        setError(fetchError.message);
        return;
      }

      if (data) {
        const mappedPNodes = data.map(mapDbToPNode);
        setPNodes(mappedPNodes);
        setStats(calculateNetworkStats(mappedPNodes));
        setError(null);
      }
    } catch (err) {
      console.error('Error in fetchPNodes:', err);
      setError('Failed to fetch pNodes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch from pRPC API via edge function
  const refreshFromAPI = useCallback(async (bootstrapUrl?: string) => {
    setIsRefreshing(true);

    try {
      // If no bootstrap URL provided, just refresh from DB cache
      if (!bootstrapUrl) {
        await fetchPNodes();
        toast({
          title: 'Data refreshed',
          description: 'pNode data updated from cache',
        });
        setIsRefreshing(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('fetch-pnodes', {
        body: { bootstrapUrl },
      });

      if (fnError) {
        console.error('Error calling fetch-pnodes:', fnError);
        toast({
          title: 'Refresh failed',
          description: 'Could not fetch from pRPC API. Using cached data.',
          variant: 'destructive',
        });
        await fetchPNodes();
      } else {
        console.log('Fetch result:', data);

        // Update state immediately with the fresh data from API
        if (data.pnodes && data.pnodes.length > 0) {
          // Map the raw API data (which matches DB structure mostly) to PNodeInfo
          // The API returns data in the same shape as DB rows for convenience
          const mappedPNodes = data.pnodes.map((p: any) => mapDbToPNode({
            id: p.pubkey, // temporary ID
            ...p
          }));
          setPNodes(mappedPNodes);
          setStats(calculateNetworkStats(mappedPNodes));

          toast({
            title: 'Data refreshed',
            description: `Updated ${data.pnodesCount} pNodes from network`,
          });

          if (data.dbError) {
            console.error('Database write failed:', data.dbError);
            toast({
              title: 'Database Warning',
              description: `Fetched data but failed to save: ${data.dbError}. Did you run the migration?`,
              variant: 'destructive',
              duration: 6000,
            });
          }
        }

        // Also try to refresh from DB to ensure consistency
        await fetchPNodes();
      }
    } catch (err) {
      console.error('Error refreshing from API:', err);
      toast({
        title: 'Refresh failed',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPNodes]);

  // Subscribe to realtime updates
  useEffect(() => {
    // Initial fetch
    fetchPNodes();

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pnodes',
        },
        (payload) => {
          console.log('Realtime pnode update:', payload);
          fetchPNodes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'network_stats',
        },
        (payload) => {
          console.log('Realtime stats update:', payload);
          // We could fetch stats separately if we had a dedicated fetch for it, 
          // but fetching pnodes re-calculates stats client-side effectively.
          // Getting pNodes is safer to ensure consistency.
          fetchPNodes();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to realtime changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPNodes]);

  const versionDistribution = calculateVersionDistribution(pnodes);
  const uptimeBuckets = calculateUptimeBuckets(pnodes);
  const versions = [...new Set(pnodes.map(p => p.version))].sort().reverse();

  return {
    pnodes,
    stats,
    versionDistribution,
    uptimeBuckets,
    versions,
    isLoading,
    isRefreshing,
    error,
    refresh: fetchPNodes,
    refreshFromAPI,
  };
}
