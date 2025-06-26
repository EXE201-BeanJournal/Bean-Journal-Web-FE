import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getMemoryZoneById } from '@/services/memoryZoneService';
import { MemoryZone } from '@/types/supabase';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BlockNoteEditor, PartialBlock, filterSuggestionItems } from '@blocknote/core';
import { useCreateBlockNote, FormattingToolbarController, FormattingToolbar, BlockTypeSelect, BasicTextStyleButton, TextAlignButton, ColorStyleButton, NestBlockButton, UnnestBlockButton, CreateLinkButton, SuggestionMenuController, getDefaultReactSlashMenuItems, FileCaptionButton, FileReplaceButton } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getPublicUrl, uploadFile } from '@/services/storageService';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MemoryZoneSettings } from '@/components/journal/MemoryZoneSettings';
import * as Y from "yjs";
import YPartyKitProvider from "y-partykit/provider";
import { addAttachment, getAttachmentByFilePath, deleteAttachment } from '@/services/memoryZoneMediaAttachmentService';
import { getCollaborator } from '@/services/memoryZoneCollaboratorService';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const userColors = [
    "#ff6b6b", "#f06595", "#cc5de8", "#845ef7", "#5c7cfa",
    "#339af0", "#22b8cf", "#20c997", "#51cf66", "#94d82d",
    "#fcc419", "#ff922b", "#ff6b6b"
];

const getRandomColor = () => userColors[Math.floor(Math.random() * userColors.length)];

export const Route = createFileRoute('/journal/memory-zone/$zoneId')({
  component: MemoryZoneDetailPage,
});

function MemoryZoneDetailPage() {
  const { zoneId } = Route.useParams();
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  const [zone, setZone] = useState<MemoryZone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRestored = useRef(false);
  const [isEditable, setIsEditable] = useState(false);

  // TODO: Implement proper permission check based on collaborators
  // This will require fetching collaborator roles for the current zone
  // and checking if the current user has 'editor' privileges.
  
  const BUCKET_NAME = 'memory-zones';

  const doc = useMemo(() => new Y.Doc(), []);
  
  const provider = useMemo(() => {
    if (!zoneId) return null;
    // For production, replace with your Y-Sweet connection URL.
    return new YPartyKitProvider(
      "blocknote-dev.yousefed.partykit.dev",
      zoneId,
      doc
    );
  }, [zoneId, doc]);


  const handleUpload = useCallback(async (file: File): Promise<string> => {
    if (!supabase || !userId || !zone || !zone.id) {
      toast.error("Cannot upload file: user or zone information is missing.");
      throw new Error("User or zone not available");
    }

    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = `${zone.id}/${userId}/${fileName}`;

    try {
        const uploadedFilePath = await uploadFile(supabase, BUCKET_NAME, filePath, file);
        if (!uploadedFilePath) {
            throw new Error("File upload failed: path not returned.");
        }
        const publicUrl = getPublicUrl(supabase, BUCKET_NAME, uploadedFilePath);
        
        if (file.type.startsWith('image/')) {
            await addAttachment(supabase, {
                memory_zone_id: zone.id,
                uploader_id: userId,
                file_path: uploadedFilePath,
                file_name_original: file.name,
                file_type: file.type,
                public_url: publicUrl,
            });
        }
        
        return publicUrl;
    } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : "An unknown error occurred during file upload.";
        toast.error("File upload failed", { description: message });
        throw uploadError;
    }
  }, [supabase, userId, zone, BUCKET_NAME]);

  const editor: BlockNoteEditor | null = useCreateBlockNote({
    collaboration: {
      provider: provider!,
      fragment: doc.getXmlFragment("document-store"),
      user: {
        name: user?.fullName || "Anonymous",
        color: getRandomColor(),
      },
    },
    uploadFile: handleUpload,
  }, [handleUpload, provider, doc, user]);

  const previousBlocks = useRef<PartialBlock[]>([]);

  useEffect(() => {
      if (!editor) return;

      const handleContentChange = async () => {
          const currentBlocks = editor.document;
          
          if (previousBlocks.current.length > currentBlocks.length) {
              const removedBlocks = previousBlocks.current.filter(prevBlock => 
                  !currentBlocks.some(currBlock => currBlock.id === prevBlock.id)
              );

              for (const block of removedBlocks) {
                  if (block.type === 'image' && block.props?.url) {
                      const imageUrl = block.props.url;
                      
                      // Assuming the URL format is https://<project-ref>.supabase.co/storage/v1/object/public/memory-zones/<zone-id>/<user-id>/<file-name>
                      const pathParts = imageUrl.split('/');
                      const filePath = pathParts.slice(pathParts.indexOf('memory-zones') + 1).join('/');

                      if (!supabase) continue;

                      // The user has a Supabase function to handle storage deletion.
                      // We only need to delete the database record.
                      const attachment = await getAttachmentByFilePath(supabase, filePath);
                      if (attachment && attachment.id) {
                          const deletedFromDb = await deleteAttachment(supabase, attachment.id);
                          if (deletedFromDb) {
                            toast.success("Image deleted successfully.");
                          }
                      } else {
                          toast.warning("Could not find attachment in database to delete.");
                      }
                  }
              }
          }

          previousBlocks.current = [...currentBlocks];
      };

      const unsubscribe = (editor.onEditorContentChange as (callback: (editor: BlockNoteEditor) => void) => () => void)(handleContentChange);

      return () => {
          if (unsubscribe && typeof unsubscribe === 'function') {
              unsubscribe();
          }
      };
  }, [editor, supabase]);

  useEffect(() => {
    if (!editor || !zone?.content || !provider || contentRestored.current) {
        return;
    }

    const onSync = (synced: boolean) => {
        if (synced && !contentRestored.current) {
            const yDocFragment = doc.getXmlFragment('document-store');
            if (yDocFragment.length === 0) {
                try {
                    console.log("Restoring content from database...");
                    const blocks: PartialBlock[] = JSON.parse(zone.content as string);
                    editor.replaceBlocks(editor.document, blocks);
                } catch (e) {
                    console.error("Failed to parse and load initial content:", e);
                    const content: PartialBlock[] = [{ type: "paragraph", content: zone.content as string }];
                    editor.replaceBlocks(editor.document, content);
                }
            } else {
                 console.log("Content already exists in collaboration document.");
            }
            contentRestored.current = true;
        }
    };

    provider.on('sync', onSync);
    provider.connect();

    return () => {
        provider.off('sync', onSync);
        provider.disconnect();
    };
  }, [zone, editor, provider, doc]);


  const fetchZoneData = useCallback(async () => {
    if (!supabase || !isLoaded || !userId) return;

    setIsLoading(true);
    setError(null);
    try {
      const zoneData = await getMemoryZoneById(supabase, zoneId!);

      if (!zoneData) {
        setError('Memory zone not found or you do not have access.');
        setIsEditable(false);
      } else {
        setZone(zoneData);
        if (zoneData.owner_id === userId) {
            setIsEditable(true);
        } else {
            const collaborator = await getCollaborator(supabase, zoneId!, userId);
            if (collaborator && collaborator.permission_level === 'edit') {
                setIsEditable(true);
            } else {
                setIsEditable(false);
            }
        }
      }
    } catch (e) {
      console.error("Error fetching zone data:", e);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      setIsEditable(false);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, supabase, userId, isLoaded]);

  useEffect(() => {
    if (!supabase || !isLoaded) return;
    
    if (!userId) {
        setError("You must be logged in to view this page.");
        setIsLoading(false);
        return;
    }

    fetchZoneData();
  }, [zoneId, supabase, userId, isLoaded, fetchZoneData]);

  useEffect(() => {
    if (!supabase || !zoneId || !userId) return;

    const handlePermissionsChange = (payload: RealtimePostgresChangesPayload<{ user_id: string }>) => {
      let record: Partial<{ user_id: string }>;

      switch (payload.eventType) {
        case 'INSERT':
        case 'UPDATE':
          record = payload.new;
          break;
        case 'DELETE':
          record = payload.old;
          break;
        default:
          return;
      }

      if (record && record.user_id && record.user_id === userId) {
        toast.info("Your permissions for this memory zone have changed. Updating view.");
        fetchZoneData();
      }
    };

    const channel = supabase
      .channel(`collaborator-permissions-listener:${zoneId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memory_zone_collaborators',
          filter: `memory_zone_id=eq.${zoneId}`,
        },
        handlePermissionsChange
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error:', err);
          toast.error("Could not sync permissions in real-time.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, zoneId, userId, fetchZoneData]);
  
  if (isLoading || !isLoaded) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-12" />
        </header>
        <div className="prose dark:prose-invert max-w-none">
            <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !zone) {
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-red-500">{error || 'Memory Zone not found.'}</p>
            <Button asChild variant="outline" className="mt-4">
                <Link to="/journal/memory-zone">Go back to your zones</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex-grow">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-4">
                <Link to="/journal/memory-zone">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Zones
                </Link>
            </Button>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{zone.title}</h1>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-4">
                {zone.created_at && <span>Created: {new Date(zone.created_at).toLocaleString()}</span>}
                {zone.updated_at && <span className="text-xs text-green-500 dark:text-green-400">Last updated: {new Date(zone.updated_at).toLocaleString()}</span>}
            </div>
        </div>
        <div className="flex items-center gap-4">
            <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{zone.title} Settings</SheetTitle>
                    <SheetDescription>
                      Manage members, title, and other settings for this memory zone.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <MemoryZoneSettings zone={zone} onUpdate={fetchZoneData} />
                  </div>
                </SheetContent>
            </Sheet>
        </div>
      </header>
      
      <div className="bg-background rounded-lg shadow-sm border -mx-2">
        {editor ?
          <BlockNoteView 
            editor={editor} 
            editable={isEditable}
            theme={"light"} 
            className="min-h-[500px]" 
            formattingToolbar={false}
          >
            <FormattingToolbarController
              formattingToolbar={() => (
                <FormattingToolbar>
                  <BlockTypeSelect key={"blockTypeSelect"} />

                  <FileCaptionButton key={"fileCaptionButton"} />
                  <FileReplaceButton key={"replaceFileButton"} />

                  <BasicTextStyleButton
                    basicTextStyle={"bold"}
                    key={"boldStyleButton"}
                  />
                  <BasicTextStyleButton
                    basicTextStyle={"italic"}
                    key={"italicStyleButton"}
                  />
                  <BasicTextStyleButton
                    basicTextStyle={"underline"}
                    key={"underlineStyleButton"}
                  />
                  <BasicTextStyleButton
                    basicTextStyle={"strike"}
                    key={"strikeStyleButton"}
                  />
                  <BasicTextStyleButton
                    key={"codeStyleButton"}
                    basicTextStyle={"code"}
                  />

                  <TextAlignButton
                    textAlignment={"left"}
                    key={"textAlignLeftButton"}
                  />
                  <TextAlignButton
                    textAlignment={"center"}
                    key={"textAlignCenterButton"}
                  />
                  <TextAlignButton
                    textAlignment={"right"}
                    key={"textAlignRightButton"}
                  />

                  <ColorStyleButton key={"colorStyleButton"} />

                  <NestBlockButton key={"nestBlockButton"} />
                  <UnnestBlockButton key={"unnestBlockButton"} />

                  <CreateLinkButton key={"createLinkButton"} />
                </FormattingToolbar>
              )}
            />
             <SuggestionMenuController
              triggerCharacter={"/"}
              getItems={async (query: string) =>
                filterSuggestionItems(
                  getDefaultReactSlashMenuItems(editor),
                  query
                )
              }
            />
          </BlockNoteView>
          : <div>Loading Editor...</div>
        }
      </div>
    </div>
  );
} 