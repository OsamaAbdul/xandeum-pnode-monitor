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
  version: string;
  last_seen: string;
  last_seen_timestamp: number;
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

function generatePubkey(address: string): string {
  // Generate a deterministic pubkey from address for consistency
  // In production, this should come from the actual node
  const encoder = new TextEncoder();
  const data = encoder.encode(address);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash |= 0;
  }
  return `pnode_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

serve(async (req) => {
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

    // Initialize Supabase client with service role for database writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pods using the correct RPC method
    const podsResponse = await makeRPCCall(bootstrapUrl, 'get-pods');
    
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

    // Transform pod data to pnode format
    const pnodesData = pods.map((pod: PodInfo) => {
      const { ip, port } = extractIPAndPort(pod.address);
      const status = calculateStatus(pod.last_seen_timestamp);
      
      // Calculate uptime based on status (approximation)
      let uptime = 0;
      if (status === 'online') uptime = 99;
      else if (status === 'degraded') uptime = 85;
      
      return {
        pubkey: generatePubkey(pod.address),
        ip,
        gossip: pod.address,
        version: pod.version,
        uptime,
        storage_used_bytes: 0, // Not provided by API
        pods_count: 0, // Not provided by API
        status,
        updated_at: new Date(pod.last_seen_timestamp * 1000).toISOString(),
      };
    });

    console.log(`Processed ${pnodesData.length} pNodes`);

    // Upsert pNodes data to database
    const { error: upsertError } = await supabase
      .from('pnodes')
      .upsert(pnodesData, { onConflict: 'pubkey' });

    if (upsertError) {
      console.error('Failed to upsert pNodes:', upsertError);
    } else {
      console.log(`Successfully cached ${pnodesData.length} pNodes`);
    }

    // Calculate and store network stats
    const onlineCount = pnodesData.filter(p => p.status === 'online').length;
    const degradedCount = pnodesData.filter(p => p.status === 'degraded').length;
    const avgUptime = pnodesData.reduce((acc, p) => acc + p.uptime, 0) / pnodesData.length;
    const healthScore = Math.round((onlineCount / pnodesData.length) * 100);

    const networkStats = {
      total_pnodes: totalCount,
      avg_uptime: Math.round(avgUptime * 10) / 10,
      total_storage_bytes: 0,
      active_pods: onlineCount + degradedCount,
      health_score: healthScore,
    };

    await supabase.from('network_stats').insert(networkStats);

    return new Response(
      JSON.stringify({
        success: true,
        pnodesCount: pnodesData.length,
        totalInNetwork: totalCount,
        networkStats,
        pnodes: pnodesData,
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
