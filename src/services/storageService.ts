import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// --- Storage Functions ---
/**
 * Uploads a file to a specified Supabase storage bucket.
 * @param supabase - The Supabase client instance.
 * @param bucket - The name of the storage bucket.
 * @param path - The path and filename for the file in the bucket.
 * @param file - The file object to upload.
 * @param options - Optional file upload options, like `upsert`.
 * @returns The path of the uploaded file, or null if an error occurred.
 */
export const uploadFile = async (
    supabase: SupabaseClient, 
    bucket: string, 
    path: string, 
    file: File,
    options?: { upsert?: boolean; contentType?: string; cacheControl?: string }
): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);
    if (error) {
        console.error('Error uploading file:', error.message);
        toast.error("File upload failed", { description: error.message });
        return null;
    }
    return data?.path ?? null;
};

/**
 * Downloads a file from Supabase Storage.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param filePath The path of the file to download.
 * @returns A Blob containing the file data or null if an error occurred.
 */
export const downloadFile = async (
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string
) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  if (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
  return data;
};

/**
 * Deletes a file from Supabase Storage.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param filePaths An array of file paths to delete.
 * @returns True if successful, false otherwise.
 */
export const deleteFiles = async (
  supabase: SupabaseClient,
  bucketName: string,
  filePaths: string[]
) => {
  console.log(
    `[storageService] Attempting to delete files from bucket: ${bucketName}`,
    filePaths
  );
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove(filePaths);
  if (error) {
    console.error('Error deleting files:', error);
    throw error;
  }
  return data !== null;
};

/**
 * Retrieves the public URL for a file in a Supabase storage bucket.
 * @param supabase - The Supabase client instance.
 * @param bucket - The name of the storage bucket.
 * @param path - The path of the file in the bucket.
 * @returns The public URL of the file.
 */
export const getPublicUrl = (
    supabase: SupabaseClient, 
    bucket: string, 
    path: string
): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Lists files in a Supabase Storage bucket path.
 * @param supabase The SupabaseClient instance.
 * @param bucketName The name of the storage bucket.
 * @param path The path within the bucket to list files from.
 * @param options Optional listing options.
 * @returns An array of file objects or null if an error occurred.
 */
export const listFiles = async (
  supabase: SupabaseClient,
  bucketName: string,
  path?: string,
  options?: { limit?: number; offset?: number; search?: string }
) => {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(path, options);
  if (error) {
    console.error('Error listing files:', error);
    throw error;
  }
  return data;
};

/**
 * Deletes a file from a specified Supabase storage bucket.
 * @param supabase - The Supabase client instance.
 * @param bucket - The name of the storage bucket.
 * @param path - The path of the file to delete.
 * @returns True if the file was deleted successfully, false otherwise.
 */
export const deleteFile = async (
    supabase: SupabaseClient,
    bucket: string,
    path: string
): Promise<boolean> => {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
        console.error('Error deleting file:', error.message);
        toast.error("File deletion failed", { description: error.message });
        return false;
    }
    return true;
}; 