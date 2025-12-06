import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PNodeInfo, NetworkStats } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  mockPNodes,
  mockNetworkStats,
  calculateNetworkStats,
  calculateVersionDistribution,
  calculateUptimeBuckets,
} from '@/lib/mockData';

function formatStorage(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  return `${(bytes / 1e6).toFixed(2)} MB`;
}

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
  };
}

export function usePNodes() {
  const [pnodes, setPNodes] = useState<PNodeInfo[]>(mockPNodes);
  const [stats, setStats] = useState<NetworkStats>(mockNetworkStats);
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
        console.error('Error fetching pNodes:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data && data.length > 0) {
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
        await fetchPNodes();
        toast({
          title: 'Data refreshed',
          description: `Updated ${data.pnodesCount} pNodes from network`,
        });
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
    fetchPNodes();

    const channel = supabase
      .channel('pnodes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pnodes',
        },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchPNodes();
        }
      )
      .subscribe();

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
