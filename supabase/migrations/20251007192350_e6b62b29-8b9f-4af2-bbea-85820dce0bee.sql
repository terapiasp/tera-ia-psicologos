-- Remove default '***' from description column in pix_payments table
ALTER TABLE pix_payments 
  ALTER COLUMN description SET DEFAULT NULL;