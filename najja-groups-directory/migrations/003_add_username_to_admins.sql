-- Add username column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;