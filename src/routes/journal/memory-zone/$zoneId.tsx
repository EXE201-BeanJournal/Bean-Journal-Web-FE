import { createFileRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getMemoryZoneById, updateMemoryZone } from '@/services/memoryZoneService';
import { MemoryZone } from '@/types/supabase';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Block, BlockNoteEditor, PartialBlock, filterSuggestionItems } from '@blocknote/core';
import { useCreateBlockNote, FormattingToolbarController, FormattingToolbar, BlockTypeSelect, BasicTextStyleButton, TextAlignButton, ColorStyleButton, NestBlockButton, UnnestBlockButton, CreateLinkButton, SuggestionMenuController, getDefaultReactSlashMenuItems, FileCaptionButton, FileReplaceButton } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { addAttachment, deleteAttachment, getAttachmentsForZone } from '@/services/memoryZoneMediaAttachmentService';
import { getPublicUrl, uploadFile } from '@/services/storageService';
import debounce from 'lodash/debounce';

// Type guard to check if a block is a file-containing block
function isFileBlock(block: Block): block is Block & { props: { url: string } } {
  return 'url' in block.props && typeof (block.props as { url?: unknown }).url === 'string';
}

function extractImageUrlsFromBN(blocks: Block[]): string[] {
    let urls: string[] = [];
    for (const block of blocks) {
        if (isFileBlock(block) && block.props.url) {
            urls.push(block.props.url);
        }
        if (block.children && Array.isArray(block.children)) {
            urls = urls.concat(extractImageUrlsFromBN(block.children as Block[]));
        }
    }
    return urls;
}

export const Route = createFileRoute('/journal/memory-zone/$zoneId')({
  component: MemoryZoneDetailPage,
});

function MemoryZoneDetailPage() {
  const { zoneId } = Route.useParams();
  const supabase = useSupabase();
  const { userId, isLoaded } = useAuth();

  const [zone, setZone] = useState<MemoryZone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentContentString, setCurrentContentString] = useState<string | undefined>(undefined);
  const [initialContentString, setInitialContentString] = useState<string | undefined>(undefined);
  
  const BUCKET_NAME = 'memory-zones';

  const handleUpload = useCallback(async (file: File): Promise<string> => {
    if (!supabase || !userId || !zone || !zone.id) {
      toast.error("Cannot upload file: user or zone information is missing.");
      throw new Error("User or zone not available");
    }

    const fileName = `${uuidv4()}-${file.name}`;
    const filePath = `${userId}/${zone.id}/${fileName}`;

    try {
        const uploadedFilePath = await uploadFile(supabase, BUCKET_NAME, filePath, file);
        if (!uploadedFilePath) {
            throw new Error("File upload failed: path not returned.");
        }
        return getPublicUrl(supabase, BUCKET_NAME, uploadedFilePath);
    } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : "An unknown error occurred during file upload.";
        toast.error("File upload failed", { description: message });
        throw uploadError;
    }
  }, [supabase, userId, zone, BUCKET_NAME]);

  const editor: BlockNoteEditor | null = useCreateBlockNote({
    uploadFile: handleUpload,
  }, [handleUpload]);

  useEffect(() => {
    if (!editor || !zone) {
      return;
    }

    if (zone.content && typeof zone.content === 'string') {
        try {
            const blocks: PartialBlock[] = JSON.parse(zone.content);
            editor.replaceBlocks(editor.document, blocks);
            setInitialContentString(zone.content);
            setCurrentContentString(zone.content);
        } catch (e) {
            console.error("Failed to parse content, treating as plain text:", e);
            const content: PartialBlock[] = [{type: "paragraph", content: zone.content}];
            const contentString = JSON.stringify(content);
            editor.replaceBlocks(editor.document, content);
            setInitialContentString(contentString);
            setCurrentContentString(contentString);
        }
    } else if (zone.content) {
        const contentString = JSON.stringify(zone.content);
        // @ts-expect-error-next-line
        editor.replaceBlocks(editor.document, zone.content);
        setInitialContentString(contentString);
        setCurrentContentString(contentString);
    } else {
        const defaultContent: PartialBlock[] = [{ type: "paragraph", content: "" }];
        const defaultContentString = JSON.stringify(defaultContent);
        editor.replaceBlocks(editor.document, defaultContent);
        setInitialContentString(defaultContentString);
        setCurrentContentString(defaultContentString);
    }
    setLastSaved(zone.updated_at ? new Date(zone.updated_at) : null);
  }, [zone, editor]);


  useEffect(() => {
    if (!supabase || !isLoaded) return;
    
    if (!userId) {
        setError("You must be logged in to view this page.");
        setIsLoading(false);
        return;
    }

    const fetchZoneData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const zoneData = await getMemoryZoneById(supabase, zoneId!);

        if (!zoneData) {
          setError('Memory zone not found or you do not have access.');
        } else {
          setZone(zoneData);
        }
      } catch (e) {
        console.error("Error fetching zone data:", e);
        setError(e instanceof Error ? e.message : 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchZoneData();
  }, [zoneId, supabase, userId, isLoaded]);
  
  const handleSaveContent = useCallback(async () => {
      if (!supabase || !userId || !zone || !editor || !zone.id) return;
      
      const currentZoneId = zone.id;

      setIsSaving(true);
      setHasUnsavedChanges(false);

      try {
          const contentToSave = JSON.stringify(editor.document);
          const contentBlocks = JSON.parse(contentToSave);

          // --- Media Sync Logic ---
          const currentEditorImageUrls = extractImageUrlsFromBN(contentBlocks);
          const existingAttachments = await getAttachmentsForZone(supabase, currentZoneId);
          const existingAttachmentUrls = existingAttachments.map(att =>
              att.file_path ? getPublicUrl(supabase, BUCKET_NAME, att.file_path) : ''
          ).filter(Boolean);

          // 1. Identify and delete attachments that are no longer in the content
          const attachmentsToDelete = existingAttachments.filter(attachment => {
              if (!attachment.file_path) return false;
              const attachmentUrl = getPublicUrl(supabase, BUCKET_NAME, attachment.file_path);
              return !currentEditorImageUrls.includes(attachmentUrl);
          });

          if (attachmentsToDelete.length > 0) {
              const attachmentIdsToDelete = attachmentsToDelete
                  .map(att => att.id)
                  .filter((id): id is string => !!id);

              try {
                  // Rely on DB trigger to delete from storage to avoid recursion
                  for (const id of attachmentIdsToDelete) {
                      await deleteAttachment(supabase, id);
                  }
                  toast.success(`${attachmentsToDelete.length} unused attachment(s) deleted.`);
              } catch (deleteError) {
                  console.error(`Error during attachment deletion:`, deleteError);
                  const message = deleteError instanceof Error ? deleteError.message : "An unknown error occurred.";
                  toast.error("Failed to delete one or more attachments.", { description: message });
              }
          }

          // 2. Add new attachments that are not yet in the database
          const newImageUrls = currentEditorImageUrls.filter(
            (url) => !existingAttachmentUrls.includes(url)
          );
      
          if (newImageUrls.length > 0) {
            const rawBucketBasePublicUrl = getPublicUrl(supabase, BUCKET_NAME, "");
            const bucketBasePublicUrl = rawBucketBasePublicUrl
                ? rawBucketBasePublicUrl.replace(/\/$/, "")
                : "";

            if (bucketBasePublicUrl) {
                for (const imageUrl of newImageUrls) {
                  if (imageUrl.startsWith(bucketBasePublicUrl + "/")) {
                    try {
                      const filePath = decodeURIComponent(imageUrl.substring(bucketBasePublicUrl.length + 1));
                      const fileNameOriginal = filePath.substring(filePath.lastIndexOf("/") + 1);
                      await addAttachment(supabase, {
                        memory_zone_id: currentZoneId,
                        uploader_id: userId,
                        file_path: filePath,
                        file_name_original: fileNameOriginal,
                        file_type: "image",
                        file_size_bytes: -1, 
                      });
                      console.log(`Added new attachment: ${fileNameOriginal}`);
                    } catch (error) {
                      console.error("Failed to add attachment for URL:", imageUrl, error);
                      toast.error("Failed to save an attachment.", {
                        description: `Could not process the uploaded file.`,
                      });
                    }
                  }
                }
            } else {
                console.error("Could not determine bucket base public URL. Skipping new attachment creation.");
            }
          }

          // --- End Media Sync Logic ---

          const success = await updateMemoryZone(supabase, currentZoneId, {
              content: contentToSave,
              last_content_editor_id: userId,
              updated_at: new Date().toISOString(),
          });
          
          if(success) {
            toast.success("Content saved successfully!");
            setLastSaved(new Date());
            setInitialContentString(contentToSave);
          }
      } catch (err) {
          console.error("Error saving content:", err);
          const message = err instanceof Error ? err.message : "An unknown error occurred.";
          toast.error("Failed to save content", {
            description: message,
          });
          setHasUnsavedChanges(true);
      } finally {
          setIsSaving(false);
      }
  }, [supabase, userId, zone, editor, BUCKET_NAME]);

  const debouncedSave = useMemo(
    () => debounce(() => handleSaveContent(), 2000),
    [handleSaveContent]
  );

  useEffect(() => {
    if (currentContentString === undefined || initialContentString === undefined) {
      return;
    }
    const contentChanged = currentContentString !== initialContentString;
    
    if (contentChanged) {
      setHasUnsavedChanges(true);
      debouncedSave();
    } else {
      setHasUnsavedChanges(false);
      debouncedSave.cancel();
    }
    
    return () => {
      debouncedSave.cancel();
    };
  }, [currentContentString, initialContentString, debouncedSave]);


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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-4">
                <Link to="/journal/memory-zone">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Zones
                </Link>
            </Button>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{zone.title}</h1>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-4">
                {zone.created_at && <span>Created: {new Date(zone.created_at).toLocaleString()}</span>}
                {lastSaved && <span className="text-xs text-green-500 dark:text-green-400">Last updated: {lastSaved.toLocaleString()}</span>}
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {isSaving ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                </>
            ) : hasUnsavedChanges ? (
                <span>Unsaved changes</span>
            ) : (
                <span>All changes saved</span>
            )}
        </div>
      </header>
      
      <div className="bg-background rounded-lg shadow-sm border -mx-2">
        {editor ?
          <BlockNoteView 
            editor={editor} 
            theme={"light"} 
            className="min-h-[500px]" 
            formattingToolbar={false}
            onChange={() => {
                if (editor) {
                    setCurrentContentString(JSON.stringify(editor.document));
                }
            }}
          >
            <FormattingToolbarController
              formattingToolbar={(props) => (
                <FormattingToolbar
                  {...props}
                >
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
              getItems={async (query) =>
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