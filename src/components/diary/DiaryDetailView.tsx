import { useState, useEffect, useCallback, forwardRef, useRef } from "react";
import { JournalEntry, Tag, Project, MediaAttachment } from "@/types/supabase";
import type { TodoItem as TodoItemType } from "@/types/supabase";
import {
  getTagsByUserId,
  getTagsForEntry,
  updateEntryTags,
} from "@/services/tagService";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  getMediaAttachmentsByEntryId,
  createMediaAttachments,
  deleteMediaAttachments,
} from "@/services/mediaAttachmentService";
import { getPublicUrl } from "@/services/storageService";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { codeBlock } from "@blocknote/code-block";
import {
  PartialBlock,
  Block,
  BlockNoteSchema,
  defaultBlockSpecs,
  insertOrUpdateBlock,
} from "@blocknote/core";
import { v4 as uuidv4 } from "uuid";
import { Alert } from "../editor/alert/alert";
import { RiAlertFill } from "react-icons/ri";
import { TodoItem } from "../editor/todo/todoItem";
import {
  createTodoItem,
  updateTodoItem,
  getTodoItemsByEntryId,
  deleteTodoItem,
} from "@/services/todoItemService";
import { BsCheck2Square } from "react-icons/bs";
import { getProjectsByUserId } from "@/services/projectService";
import { en } from "@blocknote/core/locales";
import { createGroq } from "@ai-sdk/groq";
import { createAIExtension, createBlockNoteAIClient } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import DiaryHeader from "./detail/DiaryHeader";
import DiaryEditor from "./detail/DiaryEditor";
import DiaryModals from "./detail/DiaryModals";
import DiaryFooter from "./detail/DiaryFooter";
import { generateJournalImage } from "@/services/imageGenerationService";
import { createFacebookShare } from "@/services/facebookShareService";
import { createLinkedInShare } from "@/services/linkedInShareService";
import { useDebouncedCallback } from "use-debounce";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import MoodSelector from "./detail/MoodSelector";

interface DiaryDetailViewProps {
  diary: JournalEntry;
  onUpdateDiary: (updatedEntry: Partial<JournalEntry>) => Promise<void>;
  onDeleteDiary: (diaryIdToDelete: string) => Promise<void>;
  userId: string;
  supabase: SupabaseClient;
  hasUnlimitedAccess: boolean;
}

const defaultInitialBlocks: PartialBlock[] = [
  { type: "paragraph", content: "" },
];
const defaultInitialContentString = JSON.stringify(defaultInitialBlocks);

const DiaryDetailView = forwardRef<HTMLDivElement, DiaryDetailViewProps>(({
  diary,
  onUpdateDiary,
  onDeleteDiary,
  userId,
  supabase,
  hasUnlimitedAccess,
}, ref) => {
  const [editableTitle, setEditableTitle] = useState(diary.title || "");
  const [currentEditorContentString, setCurrentEditorContentString] = useState<
    string | undefined
  >(undefined);
  const [initialDiaryContentString, setInitialDiaryContentString] = useState<
    string | undefined
  >(undefined);
  const [currentSelectedMood, setCurrentSelectedMood] = useState<
    string | undefined | null
  >(diary.manual_mood_label);
  const [initialMoodLabel, setInitialMoodLabel] = useState<
    string | undefined | null
  >(diary.manual_mood_label);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    diary.updated_at ? new Date(diary.updated_at) : null
  );
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isShareConfirmVisible, setIsShareConfirmVisible] = useState(false);
  const [sharePlatform, setSharePlatform] = useState<"facebook" | "linkedin" | null>(null);
  const [sharePreviewImageUri, setSharePreviewImageUri] = useState<
    string | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const [imageCount, setImageCount] = useState(0);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [initialLoadedTagIds, setInitialLoadedTagIds] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | null | undefined
  >(diary.project_id);
  const [initialProjectId, setInitialProjectId] = useState<
    string | null | undefined
  >(diary.project_id);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const BUCKET_NAME = "media-attachments";
  const SHARE_IMAGE_BUCKET_NAME = "shared-previews";

  const dataURItoFile = (dataURI: string, fileName: string): File => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return new File([blob], fileName, { type: mimeString });
  };

  const handleFileUploadCallbackRef = useRef<((file: File) => Promise<string>) | null>(null);

  const client = createBlockNoteAIClient({
    apiKey: "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",
    baseURL: "https://api.groq.com/openai/v1/chat/completions",
  });

  const model = createGroq({
    ...client.getProviderSettings("groq"),
  })("llama-3.3-70b-versatile");

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      alert: Alert,
      todo: TodoItem,
    },
  });

  const insertAlert = (editor: typeof schema.BlockNoteEditor) => ({
    title: "Alert",
    subtext: "Alert for emphasizing text",
    onItemClick: () =>
      insertOrUpdateBlock(editor, {
        type: "alert",
      }),
    aliases: [
      "alert",
      "notification",
      "emphasize",
      "warning",
      "error",
      "info",
      "success",
    ],
    group: "Basic blocks",
    icon: <RiAlertFill />,
  });

  const insertTodo = (editor: typeof schema.BlockNoteEditor) => ({
    title: "Todo",
    subtext: "Track a task with a checkbox.",
    onItemClick: async () => {
      if (!diary || !diary.id || !userId || !supabase) {
        console.error("Cannot create todo: missing diary context.");
        return;
      }
      try {
        const newTodo = await createTodoItem(supabase, {
          user_id: userId,
          entry_id: diary.id,
          task_description: "",
          is_completed: false,
          priority: 0,
        });

        if (newTodo && newTodo.id) {
          insertOrUpdateBlock(editor, {
            type: "todo",
            props: {
              checked: "false",
              todoId: newTodo.id,
              priority: "0",
            },
          });
        } else {
          console.error("Failed to create todo item in database.");
        }
      } catch (error) {
        console.error("Error creating todo item:", error);
      }
    },
    aliases: ["todo", "task", "checklist", "listitem"],
    group: "Basic blocks",
    icon: <BsCheck2Square />,
  });
  
  const editor = useCreateBlockNote({
    schema,
    codeBlock,
    dictionary: {
      ...en,
      ai: aiEn,
    },
    extensions: [
      createAIExtension({
        model: model,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    ],
    uploadFile: (file) => {
      if (handleFileUploadCallbackRef.current) {
        return handleFileUploadCallbackRef.current(file);
      }
      return Promise.reject("File upload handler not ready.");
    },
  });

  const handleFileUploadCallback = useCallback(
    async (file: File): Promise<string> => {
      if (!supabase || !userId || !diary || !diary.id || !editor) {
        console.error(
          "Supabase client, userId, or diaryId not available for file upload."
        );
        throw new Error(
          "Upload context not ready. Ensure the diary entry is loaded."
        );
      }

      const currentContent = editor.document;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageUrls = extractImageUrlsFromBN(currentContent as any);

      if (!hasUnlimitedAccess && imageUrls.length > 3) {
        const errorMessage = "Free users are limited to 3 media attachments per diary. Please upgrade for unlimited attachments.";
        throw new Error(errorMessage);
      }

      const fileExtension = file.name.split(".").pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${userId}/${diary.id}/${uniqueFileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading file to Supabase Storage:", error);
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      if (!data || !data.path) {
        console.error(
          "Upload successful but path is missing in response data."
        );
        throw new Error("Storage upload failed: path missing in response.");
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (!publicUrlData?.publicUrl) {
        console.error("Error getting public URL for uploaded file:", data.path);
        throw new Error(
          "Failed to get public URL. File uploaded but cannot be displayed."
        );
      }
      return publicUrlData.publicUrl;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, userId, diary.id, hasUnlimitedAccess, editor, BUCKET_NAME]
  );
  
  useEffect(() => {
    handleFileUploadCallbackRef.current = handleFileUploadCallback;
  }, [handleFileUploadCallback]);

  useEffect(() => {
    if (editor?.document) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageUrls = extractImageUrlsFromBN(editor.document as any);
      setImageCount(imageUrls.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEditorContentString, editor]);

  useEffect(() => {
    const fetchTagsAndProjects = async () => {
      if (!userId || !supabase || !diary.id) return;

      setIsLoadingTags(true);
      try {
        const userTags = await getTagsByUserId(supabase, userId);
        setAvailableTags(userTags || []);
        const entryTags = await getTagsForEntry(supabase, diary.id);
        const currentEntryTagIds = entryTags.map((tag) => tag.id as string);
        setSelectedTagIds(currentEntryTagIds);
        setInitialLoadedTagIds(currentEntryTagIds);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setIsLoadingTags(false);
      }

      setIsLoadingProjects(true);
      try {
        const projects = await getProjectsByUserId(supabase, userId);
        setAvailableProjects(projects || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setAvailableProjects([]);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchTagsAndProjects();
  }, [userId, supabase, diary.id]);

  useEffect(() => {
    if (!editor || !diary) return;

    let blocksToLoad: PartialBlock[];
    let contentStrToStore: string;

    if (diary.content) {
      try {
        const parsed = JSON.parse(diary.content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          blocksToLoad = parsed;
          contentStrToStore = diary.content;
        } else if (Array.isArray(parsed) && parsed.length === 0) {
          blocksToLoad = defaultInitialBlocks;
          contentStrToStore = defaultInitialContentString;
        } else {
          console.warn(
            "Diary content is not a valid BlockNote array, using default."
          );
          blocksToLoad = defaultInitialBlocks;
          contentStrToStore = defaultInitialContentString;
        }
      } catch (e) {
        console.error("Failed to parse diary content, using default:", e);
        blocksToLoad = defaultInitialBlocks;
        contentStrToStore = defaultInitialContentString;
      }
    } else {
      blocksToLoad = defaultInitialBlocks;
      contentStrToStore = defaultInitialContentString;
    }

    const currentDocString = JSON.stringify(editor.document);
    if (contentStrToStore !== currentDocString) {
      queueMicrotask(() => {
        if (editor.document) {
          editor.replaceBlocks(editor.document, blocksToLoad);
        }
      });
    }

    setInitialDiaryContentString(contentStrToStore);
    setCurrentEditorContentString(contentStrToStore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diary?.id, diary?.content, editor]);

  useEffect(() => {
    setCurrentSelectedMood(diary.manual_mood_label);
    setInitialMoodLabel(diary.manual_mood_label);
    setSelectedProjectId(diary.project_id);
    setInitialProjectId(diary.project_id);
  }, [diary.manual_mood_label, diary.id, diary.project_id]);

  const handleVideoModalCancel = () => {
    setIsVideoModalVisible(false);
    setCurrentVideoUrl(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractImageUrlsFromBN = (blocks: Block[]): string[] => {
    let urls: string[] = [];
    for (const block of blocks) {
      if (block.type === "image" && typeof block.props?.url === "string") {
        urls.push(block.props.url);
      }
      if (block.children && Array.isArray(block.children)) {
        urls = urls.concat(extractImageUrlsFromBN(block.children));
      }
    }
    return urls;
  };

  const handleSave = useCallback(
    async (
      currentTitle: string,
      _currentContentString?: string,
      tagIdsForSave?: string[],
      moodToSave?: string | undefined | null,
      projectToSaveId?: string | null | undefined
    ) => {
      if (!diary.id || !userId || !supabase || !editor) {
        console.error("Cannot save, diary ID, user ID, or editor is missing.");
        return;
      }

      const currentContentForSave = JSON.stringify(editor.document);

      setIsSaving(true);
      setHasUnsavedChanges(false);
      try {
        const tagsToUpdate = tagIdsForSave || selectedTagIds;

        let tagsActuallyChanged = false;
        if (tagsToUpdate.length !== initialLoadedTagIds.length) {
          tagsActuallyChanged = true;
        } else {
          const sortedSelected = [...tagsToUpdate].sort();
          const sortedInitial = [...initialLoadedTagIds].sort();
          tagsActuallyChanged = !sortedSelected.every(
            (val, index) => val === sortedInitial[index]
          );
        }

        if (tagsActuallyChanged) {
          await updateEntryTags(supabase, userId, diary.id, tagsToUpdate);
        }

        if (currentContentForSave && diary.id) {
          const parsedBlocks: Block<typeof schema.blockSchema>[] =
            JSON.parse(currentContentForSave);

          try {
            const editorTodoBlocks = parsedBlocks.filter(
              (block) => block.type === "todo"
            );
            const editorTodoItemIds = editorTodoBlocks
              .map((block) => block.props.todoId)
              .filter((id) => !!id) as string[];

            const existingDbTodoItems = await getTodoItemsByEntryId(
              supabase,
              diary.id
            );
            const existingDbTodoItemIds = existingDbTodoItems.map(
              (item) => item.id as string
            );

            for (const block of editorTodoBlocks) {
              if (block.props.todoId) {
                const blockContentText =
                  block.content && Array.isArray(block.content)
                    ? block.content
                        .map((c) => (c.type === "text" ? c.text : ""))
                        .join("")
                    : "";
                const dbTodo = existingDbTodoItems.find(
                  (item) => item.id === block.props.todoId
                );

                if (dbTodo) {
                  const blockIsCompleted = block.props.checked === "true";
                  const blockPriority = parseInt(
                    block.props.priority || "0",
                    10
                  );

                  const updates: Partial<TodoItemType> = {};
                  let needsUpdate = false;

                  if (dbTodo.task_description !== blockContentText) {
                    updates.task_description = blockContentText;
                    needsUpdate = true;
                  }
                  if (dbTodo.is_completed !== blockIsCompleted) {
                    updates.is_completed = blockIsCompleted;
                    updates.completed_at = blockIsCompleted
                      ? new Date().toISOString()
                      : undefined;
                    needsUpdate = true;
                  }
                  if (dbTodo.priority !== blockPriority) {
                    updates.priority = blockPriority;
                    needsUpdate = true;
                  }

                  if (needsUpdate) {
                    await updateTodoItem(
                      supabase,
                      block.props.todoId as string,
                      updates
                    );
                  }
                } else {
                  console.warn(
                    `Todo block with ID ${block.props.todoId} found in editor but not in DB. Skipping update.`
                  );
                }
              }
            }

            for (const dbTodoId of existingDbTodoItemIds) {
              if (!editorTodoItemIds.includes(dbTodoId)) {
                try {
                  await deleteTodoItem(supabase, dbTodoId);
                } catch (deleteError) {
                  console.error(
                    `Failed to delete todo item ${dbTodoId} from database:`,
                    deleteError
                  );
                }
              }
            }
          } catch (todoSyncError) {
            console.error("Error syncing todo items:", todoSyncError);
          }

          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentEditorImageUrls = extractImageUrlsFromBN(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              parsedBlocks as any
            );
            const existingAttachments = await getMediaAttachmentsByEntryId(
              supabase,
              diary.id
            );
            const existingAttachmentUrls = existingAttachments.map(
              (att) => att.file_url_cached
            );
    
            // Handle Deletions
            const attachmentsToDelete = existingAttachments.filter(
              (att) => !currentEditorImageUrls.includes(att.file_url_cached)
            );
    
            if (attachmentsToDelete.length > 0) {
              const attachmentIdsToDelete = attachmentsToDelete
                .map((att) => att.id)
                .filter((id): id is string => !!id);
    
              // The trigger on media_attachments should handle deleting from storage.
              if (attachmentIdsToDelete.length > 0) {
                await deleteMediaAttachments(supabase, attachmentIdsToDelete);
              }
            }
    
            // Handle Creations
            const newImageUrls = currentEditorImageUrls.filter(
              (url) => !existingAttachmentUrls.includes(url)
            );
    
            if (newImageUrls.length > 0) {
              const rawBucketBasePublicUrl = getPublicUrl(supabase, BUCKET_NAME, "");
              const bucketBasePublicUrl = rawBucketBasePublicUrl
                ? rawBucketBasePublicUrl.replace(/\/$/, "")
                : "";
      
              if (bucketBasePublicUrl) {
                const newAttachmentsData: Partial<MediaAttachment>[] = [];
                for (const imageUrl of newImageUrls) {
                  if (imageUrl.startsWith(bucketBasePublicUrl + "/")) {
                    const relativeFilePath = imageUrl.substring(
                      bucketBasePublicUrl.length + 1
                    );
                    const fileNameOriginal = relativeFilePath.substring(
                      relativeFilePath.lastIndexOf("/") + 1
                    );
                    const extension = fileNameOriginal.split(".").pop()?.toLowerCase() || "";
                    let mimeType = "application/octet-stream";
                    if (["jpg", "jpeg"].includes(extension)) mimeType = "image/jpeg";
                    else if (extension === "png") mimeType = "image/png";
                    else if (extension === "gif") mimeType = "image/gif";
                    else if (extension === "webp") mimeType = "image/webp";
      
                    newAttachmentsData.push({
                      entry_id: diary.id,
                      user_id: userId,
                      file_path: relativeFilePath,
                      file_url_cached: imageUrl,
                      file_name_original: fileNameOriginal,
                      file_type: "image",
                      mime_type: mimeType,
                      file_size_bytes: -1, // Note: Size detection removed for simplicity
                    });
                  }
                }
      
                if (newAttachmentsData.length > 0) {
                  await createMediaAttachments(supabase, newAttachmentsData);
                }
              }
            }
          } catch (error) {
            console.error(
              "Error processing media attachments during save:",
              error
            );
          }
        }

        const coreUpdates: Partial<JournalEntry> = {
          title: currentTitle,
          content: currentContentForSave || defaultInitialContentString,
          is_draft: false,
          updated_at: new Date().toISOString(),
          manual_mood_label: moodToSave === null ? undefined : moodToSave,
          project_id: projectToSaveId == null ? null : projectToSaveId,
        };
        await onUpdateDiary(coreUpdates);

        setLastSaved(new Date());
        setInitialLoadedTagIds([...tagsToUpdate]);
        if (currentContentForSave !== undefined) {
          setInitialDiaryContentString(currentContentForSave);
        }
        setInitialMoodLabel(moodToSave);
        setInitialProjectId(projectToSaveId);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error saving diary:", error);
        setHasUnsavedChanges(true);
      } finally {
        setIsSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      diary.id,
      userId,
      supabase,
      onUpdateDiary,
      initialLoadedTagIds,
      selectedTagIds,
      BUCKET_NAME,
      editor,
    ]
  );

  const debouncedSave = useDebouncedCallback(
        (
          newTitle: string,
          newContentString?: string,
          newTagIds?: string[],
          newMood?: string | undefined | null,
          newProjectId?: string | null | undefined
        ) => {
          handleSave(
            newTitle,
            newContentString,
            newTagIds,
            newMood,
            newProjectId
          );
        },
        2000
      );

  useEffect(() => {
    setEditableTitle(diary.title || "");
  }, [diary.title, diary.id]);

  useEffect(() => {
    if (
      currentEditorContentString === undefined ||
      initialDiaryContentString === undefined
    ) {
      return;
    }

    const titleChanged = editableTitle !== (diary.title || "");
    const contentChanged =
      currentEditorContentString !== initialDiaryContentString;

    const moodChanged = currentSelectedMood !== initialMoodLabel;
    const projectChanged = selectedProjectId !== initialProjectId;

    let tagsHaveChangedVsSavedState = false;
    if (selectedTagIds.length !== initialLoadedTagIds.length) {
      tagsHaveChangedVsSavedState = true;
    } else {
      const sortedSelected = [...selectedTagIds].sort();
      const sortedInitial = [...initialLoadedTagIds].sort();
      tagsHaveChangedVsSavedState = !sortedSelected.every(
        (val, index) => val === sortedInitial[index]
      );
    }

    if (
      titleChanged ||
      contentChanged ||
      tagsHaveChangedVsSavedState ||
      moodChanged ||
      projectChanged
    ) {
      setHasUnsavedChanges(true);
      debouncedSave(
        editableTitle,
        currentEditorContentString,
        selectedTagIds,
        currentSelectedMood,
        selectedProjectId
      );
    } else {
      setHasUnsavedChanges(false);
      debouncedSave.cancel();
    }

    return () => {
      debouncedSave.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editableTitle,
    currentEditorContentString,
    selectedTagIds,
    initialDiaryContentString,
    initialLoadedTagIds,
    diary.title,
    debouncedSave,
    currentSelectedMood,
    initialMoodLabel,
    selectedProjectId,
    initialProjectId,
  ]);

  const showDeleteConfirm = () => {
    setIsDeleteConfirmVisible(true);
  };

  const handleDeleteConfirmOk = async () => {
    if (!diary.id) {
      console.error("Cannot delete, diary ID is missing.");
      setIsDeleteConfirmVisible(false);
      return;
    }
    try {
      await onDeleteDiary(diary.id);
      setIsDeleteConfirmVisible(false);
    } catch (error) {
      console.error("Error deleting diary:", error);
      console.error("Failed to delete diary. Please try again.");
      setIsDeleteConfirmVisible(false);
    }
  };

  const handleDeleteConfirmCancel = () => {
    setIsDeleteConfirmVisible(false);
  };

  const handleShareConfirmCancel = () => {
    setIsShareConfirmVisible(false);
    setSharePreviewImageUri(null);
    setSharePlatform(null);
  };

  const showShareConfirm = async (platform: "facebook" | "linkedin") => {
    setIsSharing(true);
    setShareError(null);
    setSharePlatform(platform);
    try {
      const tagsForImage = availableTags.filter((tag) =>
        selectedTagIds.includes(tag.id!)
      );
      const imageDataUri = await generateJournalImage(diary, tagsForImage);
      setSharePreviewImageUri(imageDataUri);
      setIsShareConfirmVisible(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setShareError(
        message || "An unexpected error occurred while generating the preview."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const canAddAttachments = hasUnlimitedAccess || imageCount < 3;

  const handleShareConfirmOk = async () => {
    if (!diary.id || !userId || !supabase || !sharePreviewImageUri || !sharePlatform) {
      console.error("Cannot generate share, missing context or preview image.");
      setShareError(
        "An unexpected error occurred. Missing context or preview image."
      );
      return;
    }
  
    setIsSharing(true);
    setShareError(null);
    setIsShareConfirmVisible(false);
  
    try {
      const imageFile = dataURItoFile(
        sharePreviewImageUri,
        `share-image-${diary.id}.png`
      );
  
      const uniqueFileName = `${uuidv4()}.png`;
      const filePath = `${userId}/${diary.id}/${uniqueFileName}`;
  
      const { error: uploadError } = await supabase.storage
        .from(SHARE_IMAGE_BUCKET_NAME)
        .upload(filePath, imageFile, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });
  
      if (uploadError) {
        throw new Error(`Failed to upload share image: ${uploadError.message}`);
      }
  
      const imageUrl = getPublicUrl(
        supabase,
        SHARE_IMAGE_BUCKET_NAME,
        filePath
      );
      if (!imageUrl) {
        throw new Error("Failed to get public URL for share image.");
      }
  
      // Now that we have the imageUrl, save the share record
      if (sharePlatform === "facebook") {
        await createFacebookShare(supabase, {
          user_id: userId,
          journal_entry_id: diary.id,
          preview_image_path: filePath,
          preview_image_url_cached: imageUrl,
        });
      } else if (sharePlatform === "linkedin") {
        await createLinkedInShare(supabase, {
          user_id: userId,
          journal_entry_id: diary.id,
          preview_image_path: filePath,
          preview_image_url_cached: imageUrl,
        });
      }
  
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setShareError(message || "An unexpected error occurred during sharing.");
    } finally {
      setIsSharing(false);
      setSharePreviewImageUri(null);
      setSharePlatform(null);
    }
  };

  return (
    <div ref={ref} className="bg-white rounded-xl shadow-lg flex flex-col h-full max-h-screen">
      <DiaryHeader
        editableTitle={editableTitle}
        setEditableTitle={setEditableTitle}
        lastSaved={lastSaved}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="flex-grow overflow-y-auto">
        <div className="mx-4 my-2 flex justify-between items-center">
          {shareError && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
              role="alert"
            >
              <p className="font-bold">Sharing Error</p>
              <p>{shareError}</p>
            </div>
          )}

          {!canAddAttachments && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-yellow-600">
                    <Info className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Attachment limit reached</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Free users can only add up to 3 attachments.</p>
                  <p>Please upgrade for unlimited attachments.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="relative">
          <DiaryEditor
            editor={editor}
            setCurrentEditorContentString={setCurrentEditorContentString}
            insertAlert={insertAlert}
            insertTodo={insertTodo}
          />
          <div className="absolute top-4 right-4 z-10">
            <MoodSelector
              selectedMood={currentSelectedMood}
              onSelectMood={setCurrentSelectedMood}
            />
          </div>
        </div>
      </div>

      <DiaryFooter
        selectedTagIds={selectedTagIds}
        setSelectedTagIds={setSelectedTagIds}
        availableTags={availableTags}
        isLoadingTags={isLoadingTags}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        availableProjects={availableProjects}
        isLoadingProjects={isLoadingProjects}
        showDeleteConfirm={showDeleteConfirm}
        onShareToFacebook={() => showShareConfirm("facebook")}
        onShareToLinkedIn={() => showShareConfirm("linkedin")}
        isSharing={isSharing}
      />

      <DiaryModals
        isDeleteConfirmVisible={isDeleteConfirmVisible}
        handleDeleteConfirmOk={handleDeleteConfirmOk}
        handleDeleteConfirmCancel={handleDeleteConfirmCancel}
        diaryTitle={diary.title || ""}
        isVideoModalVisible={isVideoModalVisible}
        currentVideoUrl={currentVideoUrl}
        handleVideoModalCancel={handleVideoModalCancel}
        isShareConfirmVisible={isShareConfirmVisible}
        handleShareConfirmOk={handleShareConfirmOk}
        handleShareConfirmCancel={handleShareConfirmCancel}
        sharePreviewImageUri={sharePreviewImageUri}
        sharePlatform={sharePlatform}
      />
    </div>
  );
});

DiaryDetailView.displayName = "DiaryDetailView";

export default DiaryDetailView;
