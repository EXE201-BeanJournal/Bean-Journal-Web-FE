import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryZoneContent } from '../types/supabase';

const TABLE_NAME = 'memory_zone_content';

export const getMemoryZoneContent = async (
  supabase: SupabaseClient,
  memory_zone_id: string
): Promise<MemoryZoneContent | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('memory_zone_id', memory_zone_id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = 'single row not found'
    console.error('Error fetching memory zone content:', error);
    throw new Error(error.message);
  }

  return data;
};

export const upsertMemoryZoneContent = async (
  supabase: SupabaseClient,
  content: MemoryZoneContent
): Promise<MemoryZoneContent> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .upsert(content, { onConflict: 'memory_zone_id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting memory zone content:', error);
    throw new Error(error.message);
  }

  return data;
}; 