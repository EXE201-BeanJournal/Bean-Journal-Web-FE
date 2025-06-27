import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { MemoryZone } from '../types/supabase';
import { getSharedZoneIds } from './memoryZoneCollaboratorService';

const TABLE_NAME = 'memory_zones';

export const createMemoryZone = async (
  supabase: SupabaseClient,
  zone: Omit<MemoryZone, 'id' | 'created_at' | 'updated_at'>
): Promise<MemoryZone | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(zone)
    .select()
    .single();
  if (error) {
    toast.error("Failed to create memory zone", { description: error.message });
    return null;
  }
  return data;
};

export const getMemoryZoneById = async (supabase: SupabaseClient, id: string): Promise<MemoryZone | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    toast.error("Failed to fetch memory zone", { description: error.message });
    return null;
  }
  return data;
};

export const getAccessibleMemoryZones = async (supabase: SupabaseClient, userId: string | null | undefined): Promise<MemoryZone[]> => {
  if (!userId) {
    // This case should be handled by the route guard, but as a fallback:
    return [];
  }

  const sharedZoneIds = await getSharedZoneIds(supabase, userId);

  let query = supabase
    .from(TABLE_NAME)
    .select('*');

  const ownerFilter = `owner_id.eq.${userId}`;
  
  if (sharedZoneIds.length > 0) {
    const collaboratorFilter = `id.in.(${sharedZoneIds.join(',')})`;
    query = query.or(`${ownerFilter},${collaboratorFilter}`);
  } else {
    // If they are not a collaborator on any zone, only fetch their owned zones.
    query = query.eq('owner_id', userId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    toast.error("Failed to fetch memory zones", { description: error.message });
    return [];
  }

  return data || [];
};

export const updateMemoryZone = async (
  supabase: SupabaseClient,
  id: string,
  updates: Partial<MemoryZone>
): Promise<boolean> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id);

  if (error) {
    toast.error("Error saving content", { description: error.message });
    return false;
  }
  return true;
};

export const deleteMemoryZone = async (supabase: SupabaseClient, id: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) {
    toast.error("Failed to delete memory zone", { description: error.message });
    return false;
  }
  return true;
}; 