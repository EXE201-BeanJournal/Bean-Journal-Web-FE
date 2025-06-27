import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@clerk/clerk-react';
import { MemoryZone, MemoryZoneCollaborator, Profile } from '@/types/supabase';
import { getCollaboratorsForZone, addCollaborator, removeCollaborator, updateCollaboratorPermission } from '@/services/memoryZoneCollaboratorService';
import { getProfilesByIds, getProfileById, searchProfiles } from '@/services/profileService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { X, UserPlus, Crown, Loader2, ChevronsUpDown } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { updateMemoryZone, deleteMemoryZone } from '@/services/memoryZoneService';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';

interface MemoryZoneSettingsProps {
  zone: MemoryZone;
  onUpdate?: () => void;
}

type CollaboratorWithProfile = MemoryZoneCollaborator & { profile: Profile | null };

export function MemoryZoneSettings({ zone, onUpdate }: MemoryZoneSettingsProps) {
  const supabase = useSupabase();
  const { userId } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();

  const [collaborators, setCollaborators] = useState<CollaboratorWithProfile[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [zoneTitle, setZoneTitle] = useState(zone.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // For collaborator search combobox
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);


  const isOwner = userId === zone.owner_id;

  const collaboratorUserIds = useMemo(() => collaborators.map(c => c.user_id), [collaborators]);

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

  useEffect(() => {
    const search = async () => {
        if (!supabase || !userId || !debouncedSearchQuery) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const results = await searchProfiles(supabase, debouncedSearchQuery, userId, [zone.owner_id, ...collaboratorUserIds]);
        setSearchResults(results);
        setIsSearching(false);
    }
    search();
  }, [debouncedSearchQuery, supabase, userId, zone.owner_id, collaboratorUserIds]);


  const handleTitleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isOwner || !zoneTitle.trim() || zoneTitle.trim() === zone.title) return;

    setIsSavingTitle(true);
    const success = await updateMemoryZone(supabase, zone.id!, { title: zoneTitle.trim() });
    if (success) {
        toast.success("Title updated successfully");
        if(onUpdate) {
            onUpdate();
        }
        await router.invalidate();
    } else {
        toast.error("Failed to update title.");
    }
    setIsSavingTitle(false);
  }

  const handleDeleteZone = async () => {
    if (!supabase || !isOwner) return;

    setIsDeleting(true);
    const success = await deleteMemoryZone(supabase, zone.id!);
    if (success) {
        toast.success("Memory zone deleted successfully");
        // Close the sheet/dialog by navigating away or having parent close it.
        navigate({ to: '/journal/memory-zone' });
    } else {
        toast.error("Failed to delete memory zone.");
    }
    setIsDeleting(false);
  }

  const handleAddCollaborator = async () => {
    if (!supabase || !userId || !selectedUser || !isOwner) return;

    setIsSubmitting(true);
    try {
      await addCollaborator(supabase, {
        memory_zone_id: zone.id!,
        user_id: selectedUser.id,
        permission_level: 'view',
        invited_by: userId
      });
      
      toast.success(`${selectedUser.email} has been added as a collaborator.`);
      setSelectedUser(null);
      setSearchQuery("");
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
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
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
      setCollaborators(prev => 
        prev.map(c => 
          c.id === collaboratorId ? { ...c, permission_level: permission } : c
        )
      );
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permissions.');
    }
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>Manage who has access to this memory zone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isOwner && (
                    <div className="flex items-center gap-2">
                        <Popover open={isSearchPopoverOpen} onOpenChange={setIsSearchPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isSearchPopoverOpen}
                                    className="w-full justify-between flex-grow"
                                    disabled={isSubmitting}
                                >
                                    {selectedUser
                                        ? selectedUser.username || selectedUser.email
                                        : "Search by email or username..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList>
                                        {isSearching && <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div>}
                                        <CommandEmpty>{!isSearching && debouncedSearchQuery && "No user found."}</CommandEmpty>
                                        <CommandGroup>
                                            {searchResults.map((user) => (
                                                <CommandItem
                                                    key={user.id}
                                                    value={user.email!}
                                                    onSelect={() => {
                                                        setSelectedUser(user);
                                                        setSearchQuery('');
                                                        setIsSearchPopoverOpen(false);
                                                    }}
                                                >
                                                    <div>
                                                        <p className="font-medium">{user.username || 'No username'}</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button onClick={handleAddCollaborator} disabled={isSubmitting || !selectedUser}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                            Add
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Current Members</h4>
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
            </CardContent>
        </Card>

      {isOwner && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Update your memory zone's details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTitleChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="zone-title">Title</Label>
                                <Input
                                    id="zone-title"
                                    value={zoneTitle}
                                    onChange={(e) => setZoneTitle(e.target.value)}
                                    disabled={!isOwner || isSavingTitle}
                                />
                            </div>
                            <Button type="submit" disabled={isSavingTitle || !zoneTitle.trim() || zoneTitle.trim() === zone.title}>
                                {isSavingTitle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            These actions are irreversible. Please be certain.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    Delete Memory Zone
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete this memory zone
                                        and all of its content, including all associated media.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogTrigger asChild><Button variant="outline" disabled={isDeleting}>Cancel</Button></DialogTrigger>
                                    <Button onClick={handleDeleteZone} disabled={isDeleting} variant="destructive">
                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Yes, delete it
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
} 