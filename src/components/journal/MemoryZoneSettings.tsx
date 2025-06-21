import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@clerk/clerk-react';
import { MemoryZone, MemoryZoneCollaborator, CollaboratorProfile } from '@/types/supabase';
import { getCollaboratorsForZone, addCollaborator, removeCollaborator, updateCollaboratorPermission } from '@/services/memoryZoneCollaboratorService';
import { getProfileByEmail, getProfilesByIds, getProfileById } from '@/services/profileService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { X, UserPlus, Crown, Loader2 } from 'lucide-react';

interface MemoryZoneSettingsProps {
  zone: MemoryZone;
}

type CollaboratorWithProfile = MemoryZoneCollaborator & { profile: CollaboratorProfile | null };

export function MemoryZoneSettings({ zone }: MemoryZoneSettingsProps) {
  const supabase = useSupabase();
  const { userId } = useAuth();

  const [collaborators, setCollaborators] = useState<CollaboratorWithProfile[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<CollaboratorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');

  const isOwner = userId === zone.owner_id;

  const fetchCollaborators = useCallback(async () => {
    if (!supabase || !zone.id) return;
    setIsLoading(true);
    try {
      const [collaboratorData, ownerData] = await Promise.all([
        getCollaboratorsForZone(supabase, zone.id),
        getProfileById(supabase, zone.owner_id)
      ]);
      
      setOwnerProfile(ownerData);

      if (collaboratorData.length > 0) {
        const userIds = collaboratorData.map(c => c.user_id);
        const profiles = await getProfilesByIds(supabase, userIds);
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        const combinedData = collaboratorData.map(c => ({
          ...c,
          profile: profileMap.get(c.user_id) || null
        }));
        setCollaborators(combinedData);
      } else {
        setCollaborators([]);
      }

    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast.error('Failed to load collaborator details.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, zone.id, zone.owner_id]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !userId || !newCollaboratorEmail.trim() || !isOwner) return;

    setIsSubmitting(true);
    try {
      const profile = await getProfileByEmail(supabase, newCollaboratorEmail.trim());
      if (!profile) {
        toast.error('User not found. Please check the email address.');
        return;
      }

      if (profile.id === zone.owner_id) {
        toast.error('You cannot add the owner as a collaborator.');
        return;
      }

      if (collaborators.some(c => c.user_id === profile.id)) {
        toast.error('This user is already a collaborator.');
        return;
      }
      
      await addCollaborator(supabase, {
        memory_zone_id: zone.id!,
        user_id: profile.id,
        permission_level: 'view',
        invited_by: userId
      });
      
      toast.success(`${profile.email} has been added as a collaborator.`);
      setNewCollaboratorEmail('');
      await fetchCollaborators();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      if (error.message.includes('duplicate key value violates unique constraint')) {
        toast.error('This user is already a collaborator.');
      } else {
        toast.error('Failed to add collaborator.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!supabase) return;
    try {
      await removeCollaborator(supabase, collaboratorId);
      toast.success('Collaborator removed.');
      await fetchCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Failed to remove collaborator.');
    }
  };

  const handleLeaveZone = async () => {
      const myCollabRecord = collaborators.find(c => c.user_id === userId);
      if (myCollabRecord && myCollabRecord.id) {
          await handleRemoveCollaborator(myCollabRecord.id);
          toast.success("You have left the memory zone.");
      }
  };

  const handleUpdatePermission = async (collaboratorId: string, permission: 'view' | 'comment' | 'edit') => {
    if (!supabase || !isOwner) return;
    try {
      await updateCollaboratorPermission(supabase, collaboratorId, permission);
      toast.success('Permissions updated.');
      await fetchCollaborators();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permissions.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Members</h3>
        <p className="text-sm text-muted-foreground">Manage who has access to this memory zone.</p>
      </div>
      
      {isOwner && (
        <form onSubmit={handleAddCollaborator} className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="new-collaborator@email.com"
            value={newCollaboratorEmail}
            onChange={(e) => setNewCollaboratorEmail(e.target.value)}
            disabled={isSubmitting}
            className="flex-grow"
          />
          <Button type="submit" disabled={isSubmitting || !newCollaboratorEmail.trim()}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Add
          </Button>
        </form>
      )}

      <div className="space-y-4">
        <h4 className="text-md font-medium">Current Members</h4>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <ul className="space-y-2">
            {ownerProfile && (
                 <li className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="font-semibold">{ownerProfile?.username || ownerProfile?.email} {isOwner ? '(You)' : ''}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span>Owner</span>
                    </div>
                </li>
            )}
            
            {collaborators.map(c => (
              <li key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <span className="font-medium">{c.profile?.username || c.profile?.email || 'Unknown User'} {c.user_id === userId ? '(You)' : ''}</span>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <Select
                      value={c.permission_level}
                      onValueChange={(p: 'view' | 'comment' | 'edit') => handleUpdatePermission(c.id!, p)}
                      disabled={c.user_id === userId}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Permission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="comment">Comment</SelectItem>
                        <SelectItem value="edit">Edit</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground capitalize bg-secondary px-2 py-1 rounded-md">{c.permission_level}</span>
                  )}
                  {(isOwner && c.user_id !== userId) && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCollaborator(c.id!)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {!isLoading && collaborators.length === 0 && ownerProfile && (
          <p className="text-sm text-muted-foreground text-center py-4">You are the only member. Invite someone to collaborate!</p>
        )}
      </div>
      
      {!isOwner && collaborators.some(c => c.user_id === userId) && (
        <div className="pt-4 border-t">
          <Button variant="destructive" onClick={handleLeaveZone} className="w-full">
            Leave Memory Zone
          </Button>
        </div>
      )}
    </div>
  );
} 