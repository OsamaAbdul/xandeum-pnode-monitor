-- Create pnodes table for caching pNode data from pRPC API
CREATE TABLE public.pnodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pubkey TEXT NOT NULL UNIQUE,
  ip TEXT NOT NULL,
  gossip TEXT,
  version TEXT,
  uptime NUMERIC DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  pods_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'offline',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_pnodes_pubkey ON public.pnodes(pubkey);
CREATE INDEX idx_pnodes_status ON public.pnodes(status);
CREATE INDEX idx_pnodes_updated_at ON public.pnodes(updated_at);

-- Enable Row Level Security
ALTER TABLE public.pnodes ENABLE ROW LEVEL SECURITY;

-- Create public read policy (pNode data is public)
CREATE POLICY "Anyone can view pnodes" 
ON public.pnodes 
FOR SELECT 
USING (true);

-- Create service role insert/update policy (only edge functions can modify)
CREATE POLICY "Service role can insert pnodes"
ON public.pnodes
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update pnodes"
ON public.pnodes
FOR UPDATE
TO service_role
USING (true);

-- Enable realtime for pnodes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pnodes;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_pnodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pnodes_timestamp
BEFORE UPDATE ON public.pnodes
FOR EACH ROW
EXECUTE FUNCTION public.update_pnodes_updated_at();

-- Create network_stats table for historical data
CREATE TABLE public.network_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_pnodes INTEGER NOT NULL,
  avg_uptime NUMERIC NOT NULL,
  total_storage_bytes BIGINT NOT NULL,
  active_pods INTEGER NOT NULL,
  health_score NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for network_stats
ALTER TABLE public.network_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for network stats
CREATE POLICY "Anyone can view network_stats"
ON public.network_stats
FOR SELECT
USING (true);

-- Service role insert for network stats
CREATE POLICY "Service role can insert network_stats"
ON public.network_stats
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create index for time-based queries
CREATE INDEX idx_network_stats_recorded_at ON public.network_stats(recorded_at);