import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Tag } from "@/types/supabase";
import { getTagsByUserId, createTag, updateTag, deleteTag } from "@/services/tagService";
import RecentCards from "./RecentCards";
import TagCreateModal from "./TagCreateModal";
import TagEditModal from "./TagEditModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { toast } from "sonner";

interface TagSectionProps {
  supabase: SupabaseClient;
  currentUserId: string | null | undefined;
}

const TagSection: React.FC<TagSectionProps> = ({ supabase, currentUserId }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isTagCreateModalOpen, setIsTagCreateModalOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isTagEditModalOpen, setIsTagEditModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      if (!currentUserId) return;
      setLoadingTags(true);
      try {
        const fetchedTags = await getTagsByUserId(supabase, currentUserId);
        setTags(fetchedTags || []);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        toast.error("Failed to load tags.");
      }
      setLoadingTags(false);
    };
    fetchTags();
  }, [currentUserId, supabase]);

  const handleAddNewTag = () => {
    setIsTagCreateModalOpen(true);
  };

  const handleTagSubmit = async (tagData: { name: string; color_hex: string }) => {
    if (!currentUserId) {
      toast.error("User not identified. Cannot create tag.");
      return;
    }

    const isDuplicate = tags.some(
      (tag) => tag.name.toLowerCase() === tagData.name.toLowerCase()
    );

    if (isDuplicate) {
      toast.error(`A tag with the name "${tagData.name}" already exists.`);
      return;
    }

    setLoadingTags(true);
    try {
      const newTag = await createTag(supabase, {
        ...tagData,
        user_id: currentUserId,
      });
      if (newTag) {
        setTags((prevTags) => [...prevTags, newTag]);
        toast.success("Tag created successfully.");
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      toast.error("Failed to create tag.");
    }
    setIsTagCreateModalOpen(false);
    setLoadingTags(false);
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setIsTagEditModalOpen(true);
  };

  const handleDeleteTag = (tagId: string) => {
    const ttd = tags.find((t) => t.id === tagId);
    if (ttd) {
      setTagToDelete(ttd);
      setIsConfirmDeleteModalOpen(true);
    }
  };

  const handleTagUpdate = async (tagData: Partial<Tag>) => {
    if (!editingTag || !editingTag.id) {
      toast.error("Tag to update not identified.");
      return;
    }

    if (tagData.name) {
      const isDuplicate = tags.some(
        (tag) =>
          tag.name.toLowerCase() === tagData.name?.toLowerCase() &&
          tag.id !== editingTag.id
      );

      if (isDuplicate) {
        toast.error(`A tag with the name "${tagData.name}" already exists.`);
        return;
      }
    }

    setLoadingTags(true);
    try {
      const updated = await updateTag(supabase, editingTag.id, tagData);
      if (updated) {
        setTags((prevTags) => prevTags.map((t) => (t.id === updated.id ? updated : t)));
        toast.success("Tag updated successfully.");
      }
    } catch (error) {
      console.error("Failed to update tag:", error);
      toast.error("Failed to update tag.");
    }
    setIsTagEditModalOpen(false);
    setEditingTag(null);
    setLoadingTags(false);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete || !tagToDelete.id) {
      toast.error("Tag to delete not identified.");
      return;
    }
    setLoadingTags(true);
    try {
      await deleteTag(supabase, tagToDelete.id);
      setTags((prevTags) => prevTags.filter((t) => t.id !== tagToDelete.id));
      toast.success("Tag deleted successfully.");
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Failed to delete tag.");
    }
    setIsConfirmDeleteModalOpen(false);
    setTagToDelete(null);
    setLoadingTags(false);
  };

  return (
    <div className="overflow-x-hidden min-w-0">
      {loadingTags && (
        <p className="text-center text-gray-500 py-4">Loading tags...</p>
      )}
      {!loadingTags && (
        <RecentCards
          tags={tags}
          onAddNewTag={handleAddNewTag}
          onEditTag={handleEditTag}
          onDeleteTag={handleDeleteTag}
          supabase={supabase}
        />
      )}
      <TagCreateModal
        isOpen={isTagCreateModalOpen}
        onClose={() => setIsTagCreateModalOpen(false)}
        onSubmit={handleTagSubmit}
        currentUserId={currentUserId!}
        supabase={supabase}
      />
      <TagEditModal
        isOpen={isTagEditModalOpen}
        onClose={() => {
          setIsTagEditModalOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleTagUpdate}
        initialData={editingTag}
        currentUserId={currentUserId!}
        supabase={supabase}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => {
          setIsConfirmDeleteModalOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={tagToDelete?.name}
      />
    </div>
  );
};

export default TagSection; 