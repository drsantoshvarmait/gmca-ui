-- Add settings JSONB column to tenants and organisations for property inheritance
-- Targeting core schema because public tables might be views
ALTER TABLE core.tenants ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';
ALTER TABLE core.organisations ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';
