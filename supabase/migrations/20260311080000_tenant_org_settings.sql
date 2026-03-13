-- Add settings JSONB column to tenants and organisations for property inheritance
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';

-- Optional: If we want to automatically inherit on creation using a trigger/process
-- But for now, we'll handle it in the UI as requested.
