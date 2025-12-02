# Supabase Storage Bucket Setup Guide

This guide will help you set up the `products` storage bucket in Supabase for uploading product images.

## Step 1: Create the Storage Bucket

1. **Go to your Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open Storage**
   - Click on **"Storage"** in the left sidebar
   - You should see a list of buckets (if any exist)

3. **Create New Bucket**
   - Click the **"New bucket"** button (usually at the top right)
   - Enter the bucket name: `products`
   - **Important**: Set the bucket to **"Public"** (not private)
     - This allows images to be accessed via public URLs
   - Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies to allow authenticated users to upload images.

1. **Open SQL Editor**
   - In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run the Setup SQL**
   - Open the file `setup_storage_bucket.sql` from your project
   - Copy all the SQL code
   - Paste it into the SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)

   This will create the necessary policies:
   - Authenticated users can upload images
   - Authenticated users can update/delete images
   - Public can view images (for displaying in the app)

## Step 3: Verify Setup

1. **Check the Bucket**
   - Go back to **Storage** → **Buckets**
   - You should see the `products` bucket listed
   - Make sure it shows as **"Public"**

2. **Test Upload**
   - Go to your app
   - Navigate to Inventory → Add Product
   - Try uploading an image
   - It should work now!

## Troubleshooting

### Error: "Storage bucket does not exist"
- Make sure you created the bucket in Step 1
- Check that the bucket name is exactly `products` (lowercase, no spaces)

### Error: "row-level security policy"
- Make sure you ran the SQL from `setup_storage_bucket.sql` in Step 2
- Check the SQL Editor for any errors when running the script

### Error: "Permission denied"
- Verify the bucket is set to **Public**
- Make sure you're logged in as an authenticated user
- Re-run the SQL policies if needed

### Images not displaying
- Check that the bucket is set to **Public**
- Verify the image URLs are correct in the database
- Check browser console for any CORS or loading errors

## Alternative: Create Bucket via SQL (Advanced)

If you prefer to create the bucket via SQL, you can use:

```sql
-- Note: This requires service_role key, so it's better to use the dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;
```

However, it's recommended to create the bucket through the dashboard as shown in Step 1.

