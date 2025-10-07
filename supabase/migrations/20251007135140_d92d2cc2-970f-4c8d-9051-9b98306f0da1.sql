-- Add pix_key_type column to pix_payments table
ALTER TABLE pix_payments 
  ADD COLUMN pix_key_type text;