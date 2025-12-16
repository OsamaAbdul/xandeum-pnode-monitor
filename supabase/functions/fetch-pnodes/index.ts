import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PRPCResponse {
  jsonrpc: string;
  result?: {
    pods: PodInfo[];
    total_count: number;
  };
  error?: { code: number; message: string };
  id: number;
}

interface PodInfo {
  address: string;
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string;
  rpc_port: number;
  storage_committed: number;
  storage_usage_percent: number;
  storage_used: number;
  uptime: number; // seconds
  version: string;
}

interface GeoInfo {
  query: string;
  country: string;
  city: string;
  lat: number;
  lon: number;
}

async function makeRPCCall(url: string, method: string, params: unknown[] = []): Promise<PRPCResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error(`RPC call failed to ${url}:`, error);
    throw error;
  }
}

function extractIPAndPort(address: string): { ip: string; port: string } {
  const parts = address.split(':');
  return {
    ip: parts[0] || address,
    port: parts[1] || '9001',
  };
}

function calculateStatus(lastSeenTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const secondsAgo = now - lastSeenTimestamp;

  // Online: seen within last 5 minutes
  if (secondsAgo < 300) return 'online';
  // Degraded: seen within last 30 minutes
  if (secondsAgo < 1800) return 'degraded';
  // Offline: not seen for more than 30 minutes
  return 'offline';
}

async function fetchCountries(ips: string[]): Promise<Record<string, GeoInfo>> {
  if (ips.length === 0) return {};

  const uniqueIps = [...new Set(ips)];
  const batches = [];
  const batchSize = 100; // ip-api batch limit

  for (let i = 0; i < uniqueIps.length; i += batchSize) {
    batches.push(uniqueIps.slice(i, i + batchSize));
  }

  const results: Record<string, GeoInfo> = {};

  for (const batch of batches) {
    try {
      const response = await fetch('http://ip-api.com/batch', {
        method: 'POST',
        body: JSON.stringify(batch),
      });
      const data = await response.json();

      data.forEach((item: any) => {
        if (item.status === 'success') {
          results[item.query] = {
            query: item.query,
            country: item.country,
            city: item.city,
            lat: item.lat,
            lon: item.lon
          };
        }
      });
    } catch (error) {
      console.error('Error fetching geo data:', error);
    }
  }

  return results;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bootstrapUrl } = await req.json();

    if (!bootstrapUrl) {
      return new Response(
        JSON.stringify({ error: 'Bootstrap URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching pNodes from bootstrap: ${bootstrapUrl}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check Cache (DB Freshness)
    // If the latest node update was less than 30 seconds ago, return cached data to save RPC/DB resources.
    const { data: latestNode } = await supabase
      .from('pnodes')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const CACHE_TTL_SECONDS = 60;
    const now = Date.now();
    const lastUpdate = latestNode?.updated_at ? new Date(latestNode.updated_at).getTime() : 0;

    if (now - lastUpdate < CACHE_TTL_SECONDS * 1000) {
      console.log('Returning cached data (freshness < 30s)');

      const { data: cachedPnodes } = await supabase
        .from('pnodes')
        .select('*');

      const { data: cachedStats } = await supabase
        .from('network_stats')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedPnodes && cachedPnodes.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
            pnodesCount: cachedPnodes.length,
            totalInNetwork: cachedPnodes.length, // approximation for cache
            networkStats: cachedStats || {},
            pnodes: cachedPnodes,
            cached: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Fetch from RPC (Cache Stale or Empty)
    const podsResponse = await makeRPCCall(bootstrapUrl, 'get-pods-with-stats');

    if (podsResponse.error) {
      console.error('Failed to get pods:', podsResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pods', details: podsResponse.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pods = podsResponse.result?.pods || [];
    const totalCount = podsResponse.result?.total_count || pods.length;

    console.log(`Found ${pods.length} pods in network (total: ${totalCount})`);

    if (pods.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pods found', pnodes: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract IPs for geo lookup
    const ips = pods.map(pod => extractIPAndPort(pod.address).ip);
    const geoData = await fetchCountries(ips);

    // Transform pod data to pnode format
    const pnodesData = pods.map((pod: PodInfo) => {
      const { ip, port } = extractIPAndPort(pod.address);
      const status = calculateStatus(pod.last_seen_timestamp);

      // Calculate availability score
      let uptimeScore = 0;
      if (status === 'online') uptimeScore = 99.9;
      else if (status === 'degraded') uptimeScore = 75.0;

      const geo = geoData[ip] || { country: 'Unknown', city: 'Unknown', lat: 0, lon: 0 };

      return {
        pubkey: pod.pubkey,
        ip,
        gossip: pod.address,
        version: pod.version,
        uptime: uptimeScore,
        storage_used_bytes: pod.storage_used,
        pods_count: 0,
        status,
        updated_at: new Date(pod.last_seen_timestamp * 1000).toISOString(),

        // New fields
        country: geo.country,
        city: geo.city,
        rpc_port: pod.rpc_port,
        storage_committed: pod.storage_committed,
        is_public: pod.is_public,
        lat: geo.lat,
        lon: geo.lon
      };
    });

    console.log(`Processed ${pnodesData.length} pNodes with geo data`);

    // Filter out invalid nodes and deduplicate
    const mobileMap = new Map();
    const validNodes = pnodesData.filter(p => {
      if (!p.pubkey) {
        console.warn('Dropping node with missing pubkey:', p);
        return false;
      }
      if (!p.ip) {
        console.warn('Dropping node with missing IP:', p.pubkey);
        return false;
      }
      return true;
    });

    validNodes.forEach(p => mobileMap.set(p.pubkey, p));
    const uniquePnodesData = Array.from(mobileMap.values());

    console.log(`Prepared ${uniquePnodesData.length} unique, valid pNodes for upsert (from ${pnodesData.length} raw)`);

    // Calculate network stats
    const onlineCount = uniquePnodesData.filter(p => p.status === 'online').length;
    const degradedCount = uniquePnodesData.filter(p => p.status === 'degraded').length;
    const avgUptime = uniquePnodesData.reduce((acc, p) => acc + p.uptime, 0) / (uniquePnodesData.length || 1);
    const totalStorage = uniquePnodesData.reduce((acc, p) => acc + (p.storage_committed || 0), 0);
    const healthScore = uniquePnodesData.length > 0 ? Math.round((onlineCount / uniquePnodesData.length) * 100) : 0;

    const liveStats = {
      total_pnodes: totalCount,
      active_nodes: onlineCount,
      avg_uptime: Math.round(avgUptime * 10) / 10,
      total_storage_bytes: totalStorage,
      active_pods: onlineCount + degradedCount,
      health_score: healthScore,
    };

    if (uniquePnodesData.length === 0) {
      console.log('No valid nodes to upsert');
      return new Response(
        JSON.stringify({
          success: true,
          pnodesCount: 0,
          totalInNetwork: totalCount,
          networkStats: liveStats,
          pnodes: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert pNodes data to database
    const { error: upsertError } = await supabase
      .from('pnodes')
      .upsert(uniquePnodesData, { onConflict: 'pubkey' });

    if (upsertError) {
      console.error('Failed to upsert pNodes:', upsertError);
    } else {
      console.log(`Successfully cached ${pnodesData.length} pNodes`);

      // Cleanup stale nodes
      const currentPubkeys = pnodesData.map(p => p.pubkey);
      let deleteQuery = supabase.from('pnodes').delete();

      if (currentPubkeys.length > 0) {
        deleteQuery = deleteQuery.not('pubkey', 'in', `(${currentPubkeys.join(',')})`);
      }

      const { error: deleteError, count: deletedCount } = await deleteQuery;

      if (deleteError) {
        console.error('Failed to clean up stale pNodes:', deleteError);
      } else {
        if (deletedCount) console.log(`Cleaned up ${deletedCount} stale pNodes`);
      }

      // Store stats only if upsert succeeded
      await supabase.from('network_stats').insert(liveStats);
    }
    // Return response with potential DB warnings
    return new Response(
      JSON.stringify({
        success: true,
        pnodesCount: uniquePnodesData.length,
        totalInNetwork: totalCount,
        networkStats: liveStats,
        pnodes: uniquePnodesData,
        dbError: upsertError ? upsertError.message : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-pnodes function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
