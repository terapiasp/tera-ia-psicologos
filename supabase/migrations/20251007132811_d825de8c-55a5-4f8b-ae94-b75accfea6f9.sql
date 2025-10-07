-- Alter pix_payments table to use text for amount and set proper defaults
ALTER TABLE pix_payments 
  ALTER COLUMN amount TYPE text USING amount::text,
  ALTER COLUMN amount SET DEFAULT '0.00',
  ALTER COLUMN description SET DEFAULT '***';