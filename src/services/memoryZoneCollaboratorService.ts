import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { MemoryZoneCollaborator } from '../types/supabase';

const TABLE_NAME = 'memory_zone_collaborators';

export const addCollaborator = async (
  supabase: SupabaseClient,
  collaborator: Omit<MemoryZoneCollaborator, 'id' | 'created_at' | 'joined_at'>
): Promise<MemoryZoneCollaborator | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(collaborator)
    .select()
    .single();
  if (error) {
    toast.error("Failed to add collaborator", { description: error.message });
    return null;
  }
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
    toast.error("Failed to fetch collaborators", { description: error.message });
    return [];
  }
  return data || [];
};

export const updateCollaboratorPermission = async (
  supabase: SupabaseClient,
  id: string,
  permission_level: 'view' | 'comment' | 'edit'
): Promise<MemoryZoneCollaborator | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ permission_level })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error("Failed to update permissions", { description: error.message });
    return null;
  }
  return data;
};

export const removeCollaborator = async (supabase: SupabaseClient, id: string): Promise<boolean> => {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
  if (error) {
    toast.error("Failed to remove collaborator", { description: error.message });
    return false;
  }
  return true;
};

export const getCollaborator = async (supabase: SupabaseClient, memory_zone_id: string, user_id: string): Promise<MemoryZoneCollaborator | null> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('memory_zone_id', memory_zone_id)
        .eq('user_id', user_id)
        .single();
    if (error && error.code !== 'PGRST116') {
        toast.error("Failed to fetch collaborator", { description: error.message });
        return null;
    }
    return data;
} 