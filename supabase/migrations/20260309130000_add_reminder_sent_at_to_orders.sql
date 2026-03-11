-- Add reminder_sent_at column to orders table for tracking abandoned cart emails
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
