import { SupabaseClient } from '@supabase/supabase-js';
import { LinkedInShare } from '../types/supabase';

const LINKEDIN_SHARES_TABLE = 'linkedin_shares';

/**
 * Creates a new LinkedIn share record in the database.
 * @param supabase - The Supabase client instance.
 * @param shareData - The data for the new share, excluding 'id' and 'shared_at'.
 * @returns The newly created LinkedInShare object.
 */
export const createLinkedInShare = async (
  supabase: SupabaseClient,
  shareData: Omit<LinkedInShare, 'id' | 'shared_at'>
): Promise<LinkedInShare> => {
  const { data, error } = await supabase
    .from(LINKEDIN_SHARES_TABLE)
    .insert([shareData])
    .select()
    .single();

  if (error) {
    console.error('Error creating LinkedIn share:', error.message);
    throw new Error(`Failed to create LinkedIn share: ${error.message}`);
  }
  return data;
};

/**
 * Fetches all LinkedIn shares for a specific user.
 * @param supabase - The Supabase client instance.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of LinkedInShare objects.
 */
export const getLinkedInSharesByUserId = async (
  supabase: SupabaseClient,
  userId: string
): Promise<LinkedInShare[]> => {
  const { data, error } = await supabase
    .from(LINKEDIN_SHARES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('shared_at', { ascending: false });

  if (error) {
    console.error('Error fetching LinkedIn shares:', error.message);
    throw new Error(`Failed to fetch LinkedIn shares: ${error.message}`);
  }
  return data || [];
};

/**
 * Fetches a single LinkedIn share by its ID.
 * @param supabase - The Supabase client instance.
 * @param id - The UUID of the LinkedIn share record.
 * @returns A promise that resolves to a LinkedInShare object.
 */
export const getLinkedInShareById = async (
  supabase: SupabaseClient,
  id: string
): Promise<LinkedInShare> => {
  const { data, error } = await supabase
    .from(LINKEDIN_SHARES_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching LinkedIn share with id ${id}:`, error.message);
    throw new Error(`Failed to fetch LinkedIn share: ${error.message}`);
  }
  return data;
};

/**
 * Deletes a LinkedIn share record by its ID.
 * @param supabase - The Supabase client instance.
 * @param id - The UUID of the share record to delete.
 */
export const deleteLinkedInShare = async (
  supabase: SupabaseClient,
  id: string
): Promise<void> => {
  const { error } = await supabase
    .from(LINKEDIN_SHARES_TABLE)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting LinkedIn share with id ${id}:`, error.message);
    throw new Error(`Failed to delete LinkedIn share: ${error.message}`);
  }
};

/**
 * Fetches all LinkedIn shares for a specific user and journal entry.
 * @param supabase - The Supabase client instance.
 * @param userId - The ID of the user.
 * @param journalEntryId - The ID of the journal entry.
 * @returns A promise that resolves to an array of LinkedInShare objects.
 */
export const getLinkedInSharesByUserAndEntry = async (
  supabase: SupabaseClient,
  userId: string,
  journalEntryId: string
): Promise<LinkedInShare[]> => {
  const { data, error } = await supabase
    .from(LINKEDIN_SHARES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('journal_entry_id', journalEntryId)
    .order('shared_at', { ascending: false });

  if (error) {
    console.error('Error fetching LinkedIn shares by user and entry:', error.message);
    throw new Error(`Failed to fetch shares: ${error.message}`);
  }
  return data || [];
}; 