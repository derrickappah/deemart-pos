import { supabase } from '../lib/supabaseClient';

/**
 * Upload an image file to Supabase storage bucket
 * @param {File} file - The image file to upload
 * @param {string} bucketName - The bucket name (default: 'products')
 * @param {string} folder - Optional folder path within the bucket
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadImage = async (file, bucketName = 'products', folder = '') => {
    try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Image size must be less than 5MB');
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        // Note: Skip bucket existence check - the upload will fail with a clear error if bucket doesn't exist

        // Upload file to Supabase storage
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            
            // Provide more helpful error messages
            if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.message?.includes('policy')) {
                throw new Error(
                    `Permission denied: Storage bucket "${bucketName}" RLS policies are blocking the upload. ` +
                    `Please go to Storage → Buckets → products → Policies tab in Supabase dashboard, ` +
                    `or run the SQL from setup_storage_bucket.sql in the SQL Editor to set up the correct policies.`
                );
            }
            
            if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
                throw new Error(`Storage bucket "${bucketName}" not found. Please create it in the Supabase dashboard under Storage.`);
            }
            
            // Check error code for more specific messages
            if (error.statusCode === 400 || error.statusCode === 403) {
                throw new Error(
                    `Upload failed: ${error.message}. ` +
                    `This is usually due to missing RLS policies. ` +
                    `Please check the Policies tab for the "${bucketName}" bucket in Supabase Storage, ` +
                    `or run setup_storage_bucket.sql in the SQL Editor.`
                );
            }
            
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
            throw new Error('Failed to get public URL for uploaded image');
        }

        return {
            success: true,
            url: urlData.publicUrl
        };
    } catch (error) {
        console.error('Error uploading image:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload image'
        };
    }
};

/**
 * Delete an image from Supabase storage
 * @param {string} filePath - The path to the file in storage
 * @param {string} bucketName - The bucket name (default: 'products')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteImage = async (filePath, bucketName = 'products') => {
    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete image'
        };
    }
};

/**
 * Extract file path from Supabase storage URL
 * @param {string} url - The public URL from Supabase storage
 * @returns {string|null} - The file path or null if not a Supabase storage URL
 */
export const extractFilePathFromUrl = (url) => {
    if (!url) return null;
    
    try {
        const urlObj = new URL(url);
        // Supabase storage URLs typically have the bucket name in the path
        // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        return pathMatch ? pathMatch[1] : null;
    } catch {
        return null;
    }
};

