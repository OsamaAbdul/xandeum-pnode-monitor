-- Add lat/lon columns to pnodes table for map visualization
ALTER TABLE public.pnodes 
ADD COLUMN IF NOT EXISTS lat NUMERIC,
ADD COLUMN IF NOT EXISTS lon NUMERIC;
