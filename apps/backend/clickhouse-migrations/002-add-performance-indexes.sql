-- Migration: Add performance indexes
-- Date: 2024-01-02
-- Description: Adds additional indexes for better query performance on logs table

-- Add index for level-based queries
-- This will help with filtering logs by level (info, error, warning, etc.)
ALTER TABLE logs ADD INDEX idx_level level TYPE minmax GRANULARITY 1;

-- Add index for message text search (if needed for full-text search)
-- ALTER TABLE logs ADD INDEX idx_message_bloom message TYPE bloom_filter GRANULARITY 1;

-- Add index for projectId + level combination queries
ALTER TABLE logs
ADD INDEX idx_project_level (projectId, level) TYPE minmax GRANULARITY 1;

-- Add index for time-based queries within a project
ALTER TABLE logs
ADD INDEX idx_project_time (projectId, createdAt) TYPE minmax GRANULARITY 1;