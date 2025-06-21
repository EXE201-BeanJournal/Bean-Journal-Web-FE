import { SupabaseClient } from '@supabase/supabase-js';
import { Profile, CollaboratorProfile } from '../types/supabase';
import { toast } from 'sonner';

// --- Profile Functions ---

const TABLE_NAME = 'profiles';

export const getProfileByEmail = async (supabase: SupabaseClient, email: string): Promise<CollaboratorProfile | null> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, email, username')
        .eq('email', email)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        console.error('Error fetching profile by email:', error);
        throw error;
    }

    return data;
};

export const getProfilesByIds = async (supabase: SupabaseClient, userIds: string[]): Promise<CollaboratorProfile[]> => {
    if (!userIds || userIds.length === 0) {
        return [];
    }
    
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, email, username')
        .in('id', userIds);

    if (error) {
        console.error('Error fetching profiles by ids:', error);
        throw error;
    }
    return data || [];
}

export const getProfileById = async (supabase: SupabaseClient, userId: string): Promise<CollaboratorProfile | null> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, email, username')
        .eq('id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile by id:', error);
        throw error;
    }

    return data;
}

export const getProfileByUserId = async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .throwOnError();
    return data as Profile | null;
  } catch (error) {
    toast.error('Failed to fetch profile.');
    throw error;
  }
};

export const createProfile = async (supabase: SupabaseClient, profileData: Partial<Profile>) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
      .throwOnError();
    toast.success('Profile created successfully.');
    return data as Profile | null;
  } catch (error) {
    toast.error('Failed to create profile.');
    throw error;
  }
};

export const updateProfile = async (supabase: SupabaseClient, userId: string, updates: Partial<Profile>) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
      .throwOnError();
    toast.success('Profile updated successfully.');
    return data as Profile | null;
  } catch (error) {
    toast.error('Failed to update profile.');
    throw error;
  }
}; 