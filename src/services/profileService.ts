import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types/supabase';
import { toast } from 'sonner';

// --- Profile Functions ---

const TABLE_NAME = 'profiles';

export const getProfileByEmail = async (supabase: SupabaseClient, email: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('email', email)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        console.error('Error fetching profile by email:', error);
        throw error;
    }

    return data;
};

export const getProfilesByIds = async (supabase: SupabaseClient, userIds: string[]): Promise<Profile[]> => {
    if (!userIds || userIds.length === 0) {
        return [];
    }
    
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .in('id', userIds);

    if (error) {
        console.error('Error fetching profiles by ids:', error);
        throw error;
    }
    return data || [];
}

export const getProfileById = async (supabase: SupabaseClient, userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile by id:', error);
        throw error;
    }

    return data;
}

export const searchProfiles = async (supabase: SupabaseClient, searchText: string, currentUserId: string, collaboratorIds: string[], limit = 5): Promise<Profile[]> => {
    if (!searchText.trim()) return [];

    let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .or(`email.ilike.%${searchText}%,username.ilike.%${searchText}%`)
        .neq('id', currentUserId) // Exclude current user
        .limit(limit);

    if (collaboratorIds.length > 0) {
        query = query.not('id', 'in', `(${collaboratorIds.join(',')})`);
    }

    const { data, error } = await query;
    
    if (error) {
        console.error('Error searching profiles:', error);
        toast.error('Failed to search for users.');
        return [];
    }

    return data || [];
};

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