import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryZone } from '../types/supabase';

const TABLE_NAME = 'memory_zones';

export const createMemoryZone = async (
  supabase: SupabaseClient,
  zone: Omit<MemoryZone, 'id' | 'created_at' | 'updated_at'>
): Promise<MemoryZone> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(zone)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getMemoryZoneById = async (supabase: SupabaseClient, id: string): Promise<MemoryZone | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error fetching memory zone:', error);
    return null;
  }
  return data;
};

export const getMemoryZonesByOwner = async (supabase: SupabaseClient, owner_id: string): Promise<MemoryZone[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('owner_id', owner_id);
  if (error) {
    console.error('Error fetching memory zones by owner:', error);
    return [];
  }
  return data || [];
};

export const updateMemoryZone = async (
  supabase: SupabaseClient,
  id: string,
  updates: Partial<MemoryZone>
): Promise<MemoryZone> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteMemoryZone = async (supabase: SupabaseClient, id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) throw new Error(error.message);
}; 