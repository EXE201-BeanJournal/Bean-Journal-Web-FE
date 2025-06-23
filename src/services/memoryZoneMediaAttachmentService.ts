import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { MemoryZoneMediaAttachment } from '../types/supabase';

const TABLE_NAME = 'memory_zone_media_attachments';

export const addAttachment = async (
  supabase: SupabaseClient,
  attachment: Omit<MemoryZoneMediaAttachment, 'id' | 'created_at' | 'file_url_cached_expires_at'> & { public_url?: string }
): Promise<MemoryZoneMediaAttachment | null> => {
  delete attachment.public_url;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(attachment)
    .select()
    .single();
  if (error) {
    toast.error("Failed to add attachment", { description: error.message });
    return null;
  }
  return data;
};

export const getAttachmentsForZone = async (
  supabase: SupabaseClient,
  memory_zone_id: string
): Promise<MemoryZoneMediaAttachment[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('memory_zone_id', memory_zone_id)
    .order('created_at', { ascending: true });

  if (error) {
    toast.error("Failed to fetch attachments", { description: error.message });
    return [];
  }
  return data || [];
};

export const getAttachmentById = async (supabase: SupabaseClient, id: string): Promise<MemoryZoneMediaAttachment | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    toast.error("Failed to fetch attachment", { description: error.message });
    return null;
  }
  return data;
}

export const updateAttachment = async (
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<MemoryZoneMediaAttachment, 'id' | 'memory_zone_id' | 'uploader_id' | 'file_path'>>
): Promise<MemoryZoneMediaAttachment | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    toast.error("Failed to update attachment", { description: error.message });
    return null;
  }
  return data;
};

export const deleteAttachment = async (supabase: SupabaseClient, id: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) {
    toast.error("Failed to delete attachment record.", { description: error.message });
    // We do not throw here, as the file might have been deleted.
    // The calling function should handle this state.
    return false;
  }
  return true;
};

export const getAttachmentByFilePath = async (
  supabase: SupabaseClient,
  filePath: string
): Promise<Pick<MemoryZoneMediaAttachment, 'id' | 'file_name_original'> | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, file_name_original')
    .eq('file_path', filePath)
    .single();

  if (error) {
    console.error(`Error fetching attachment by file path: ${filePath}`, error);
    return null;
  }
  return data;
}; 