import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryZoneCollaborator } from '../types/supabase';

const TABLE_NAME = 'memory_zone_collaborators';

export const addCollaborator = async (
  supabase: SupabaseClient,
  collaborator: Omit<MemoryZoneCollaborator, 'id' | 'created_at' | 'joined_at'>
): Promise<MemoryZoneCollaborator> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(collaborator)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getCollaboratorsForZone = async (
  supabase: SupabaseClient,
  memory_zone_id: string
): Promise<MemoryZoneCollaborator[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('memory_zone_id', memory_zone_id);

  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }
  return data || [];
};

export const updateCollaboratorPermission = async (
  supabase: SupabaseClient,
  id: string,
  permission_level: 'view' | 'comment' | 'edit'
): Promise<MemoryZoneCollaborator> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ permission_level })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const removeCollaborator = async (supabase: SupabaseClient, id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const getCollaborator = async (supabase: SupabaseClient, memory_zone_id: string, user_id: string): Promise<MemoryZoneCollaborator | null> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('memory_zone_id', memory_zone_id)
        .eq('user_id', user_id)
        .single();
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching collaborator', error);
        throw error;
    }
    return data;
} 