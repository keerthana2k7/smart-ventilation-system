-- Migration: Add last_updated, runtime_total to fans table
-- Date: 2024
-- Description: Adds new columns for tracking fan updates and total runtime

USE smart_ventilation_system;

-- Add last_updated column
ALTER TABLE fans 
  ADD COLUMN IF NOT EXISTS last_updated DATETIME NULL;

-- Add runtime_total column
ALTER TABLE fans 
  ADD COLUMN IF NOT EXISTS runtime_total DECIMAL(10,2) DEFAULT 0;

-- Ensure device_id has unique constraint per user
-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so wrap in try/catch
-- In application code, we handle this with try/catch

-- Update existing fans to set last_updated = created_at if null
UPDATE fans SET last_updated = created_at WHERE last_updated IS NULL;

-- Ensure fan_readings uses created_at (standardized naming)
-- Note: If timestamp column exists, migrate to created_at
-- ALTER TABLE fan_readings CHANGE COLUMN timestamp created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure motor_state is BOOLEAN in fan_readings
ALTER TABLE fan_readings 
  MODIFY COLUMN motor_state BOOLEAN DEFAULT FALSE;

-- Ensure motor_state is BOOLEAN in fan_runtime_log
ALTER TABLE fan_runtime_log 
  MODIFY COLUMN motor_state TINYINT(1) DEFAULT 0;

