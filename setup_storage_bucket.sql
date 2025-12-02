-- =====================================================
-- SUPABASE STORAGE BUCKET SETUP FOR PRODUCT IMAGES
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- the products storage bucket with proper permissions

-- Create the products bucket (if it doesn't exist)
-- Note: You may need to create the bucket manually in the Supabase dashboard first
-- Then run the policies below

-- =====================================================
-- STORAGE POLICIES FOR PRODUCTS BUCKET
-- =====================================================

-- First, drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users full access to products" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to products" ON storage.objects;

-- Policy: Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Policy: Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Policy: Allow authenticated users to delete product images
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- Policy: Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy: Allow authenticated users to view product images
CREATE POLICY "Authenticated users can view product images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'products');

-- =====================================================
-- ALTERNATIVE: More permissive policies (if above doesn't work)
-- =====================================================
-- If the above policies don't work, try this simpler approach:

-- Drop all existing policies first
-- DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can view product images" ON storage.objects;

-- Then create a single permissive policy for authenticated users
-- CREATE POLICY "Authenticated users full access to products"
-- ON storage.objects FOR ALL
-- TO authenticated
-- USING (bucket_id = 'products')
-- WITH CHECK (bucket_id = 'products');

-- Allow public read access
-- CREATE POLICY "Public read access to products"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'products');

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Make sure the 'products' bucket exists in Storage
-- 2. Set the bucket to PUBLIC in the Supabase dashboard
-- 3. If policies already exist, you may need to drop them first:
--    DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
-- 4. After creating policies, test by uploading an image through the app

