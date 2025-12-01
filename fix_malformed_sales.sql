-- Fix malformed sale_numbers in the database
-- This script will update any sale_numbers that don't match the expected format

-- First, check for malformed sale_numbers
SELECT id, sale_number, created_at 
FROM sales 
WHERE sale_number !~ '^SALE-\d{8}-\d{4}$'
ORDER BY created_at DESC;

-- If you find malformed sale_numbers, you can fix them with:
-- UPDATE sales 
-- SET sale_number = 'SALE-' || to_char(created_at, 'YYYYMMDD') || '-' || lpad(row_number() OVER (PARTITION BY date(created_at) ORDER BY created_at)::text, 4, '0')
-- WHERE sale_number !~ '^SALE-\d{8}-\d{4}$';

-- Or delete them if they're test data:
-- DELETE FROM sales WHERE sale_number !~ '^SALE-\d{8}-\d{4}$';

-- Check for products with barcode "51130-0001" that might be causing issues
SELECT id, name, barcode, sku 
FROM products 
WHERE barcode = '51130-0001' OR sku = '51130-0001';

