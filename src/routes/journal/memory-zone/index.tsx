import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Plus, Loader2 } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getAccessibleMemoryZones, createMemoryZone } from '@/services/memoryZoneService';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { MemoryZone } from '@/types/supabase';
import { MemoryZoneSettings } from '@/components/journal/MemoryZoneSettings';

export const Route = createFileRoute('/journal/memory-zone/')({
  component: MemoryZoneListPage,
});

type SlateNode = {
  text?: string;
  children?: SlateNode[];
  [key: string]: unknown;
};

const findFirstTextInJson = (data: SlateNode | SlateNode[]): string | null => {
  if (!data) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findFirstTextInJson(item);
      if (result) return result;
    }
  } else {
    if (typeof data.text === 'string' && data.text.trim()) {
      return data.text.trim();
    }

    if (data.children) {
      return findFirstTextInJson(data.children);
    }
  }

  return null;
};

const getContentPreview = (content: string | null | undefined): string => {
  if (!content || !content.trim() || content.trim() === '""') {
    return 'No content yet.';
  }
  try {
    const parsedContent = JSON.parse(content) as SlateNode | SlateNode[];
    
    const firstText = findFirstTextInJson(parsedContent);
    
    return firstText || 'No text content found.';

  } catch (e) {
    return content.replace(/^"|"$/g, '');
  }
};

function MemoryZoneListPage() {
  const supabase = useSupabase();
  const { userId } = useAuth();
  
  const [memoryZones, setMemoryZones] = useState<MemoryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newZoneTitle, setNewZoneTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMemoryZones = async () => {
    if (!supabase || !userId) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const zones = await getAccessibleMemoryZones(supabase);
      setMemoryZones(zones);
    } catch (e) {
      setError(e as Error);
      setIsError(true);
      console.error("Error fetching memory zones:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryZones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userId]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!supabase || !userId) {
        throw new Error("Supabase client or user ID not available.");
      }
      await createMemoryZone(supabase, { title: newZoneTitle.trim(), owner_id: userId });
      
      setIsDialogOpen(false);
      setNewZoneTitle('');
      await fetchMemoryZones(); // Refetch zones after creation
    } catch (err) {
      console.error("Error creating memory zone:", err);
      // Here you could add a toast notification to inform the user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Memory Zones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">All your collaborative journals in one place.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateZone}>
              <DialogHeader>
                <DialogTitle>Create New Memory Zone</DialogTitle>
                <DialogDescription>
                  Give your new collaborative journal a title. You can invite members later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newZoneTitle}
                    onChange={(e) => setNewZoneTitle(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., European Adventure"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Zone
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                 <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-red-500">
          <p>Error fetching memory zones:</p>
          <pre>{error instanceof Error ? error.message : JSON.stringify(error)}</pre>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {memoryZones.map((zone) => {
            const contentPreview = getContentPreview(zone.content);
            return (
            <Card key={zone.id} className="group flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
              <Link to="/journal/memory-zone/$zoneId" params={{ zoneId: zone.id! }} className="flex flex-col h-full flex-grow">
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-grow">
                    <CardTitle className="text-lg font-bold truncate">{zone.title}</CardTitle>
                    {contentPreview !== 'No content yet.' && contentPreview !== 'No text content found.' ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 h-10">{contentPreview}</p>
                    ) : (
                      <p className='text-sm text-gray-400 dark:text-gray-500 mt-2 italic h-10'>{contentPreview}</p>
                    )}
                  </div>
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mt-2 -mr-2">
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>{zone.title} Settings</SheetTitle>
                        <SheetDescription>
                          Manage members and other settings for this memory zone.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        <MemoryZoneSettings zone={zone} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardHeader>
                <CardContent className="flex-grow pt-0">
                  {/* Future content can go here, e.g. member avatars */}
                  <div className="text-xs text-muted-foreground mt-4">
                    <p>Last updated: {new Date(zone.updated_at!).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
} 