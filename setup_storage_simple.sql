-- =====================================================
-- SIMPLE STORAGE POLICY SETUP (Use this if the other one doesn't work)
-- =====================================================
-- This creates a single, simple policy that allows all authenticated users
-- to upload, update, and delete files in the products bucket

-- Drop all existing policies for the products bucket
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Create a single policy that allows authenticated users full access
CREATE POLICY "Authenticated users full access to products bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Allow public to read/view images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

