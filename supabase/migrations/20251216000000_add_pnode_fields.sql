-- Add new columns to pnodes table
ALTER TABLE public.pnodes 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS rpc_port INTEGER,
ADD COLUMN IF NOT EXISTS storage_committed BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create index for country lookups if needed
CREATE INDEX IF NOT EXISTS idx_pnodes_country ON public.pnodes(country);
