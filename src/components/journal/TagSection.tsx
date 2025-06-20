import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Tag } from "@/types/supabase";
import { getTagsByUserId, createTag, updateTag, deleteTag } from "@/services/tagService";
import RecentCards from "./RecentCards";
import TagCreateModal from "./TagCreateModal";
import TagEditModal from "./TagEditModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface TagSectionProps {
  supabase: SupabaseClient;
  currentUserId: string | null | undefined;
}

const TagSection: React.FC<TagSectionProps> = ({ supabase, currentUserId }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isTagCreateModalOpen, setIsTagCreateModalOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isTagEditModalOpen, setIsTagEditModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      if (!currentUserId) return;
      setLoadingTags(true);
      setTagError(null);
      try {
        const fetchedTags = await getTagsByUserId(supabase, currentUserId);
        setTags(fetchedTags || []);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        setTagError("Failed to load tags.");
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
      setTagError("User not identified. Cannot create tag.");
      return;
    }
    setLoadingTags(true);
    setTagError(null);
    try {
      const newTag = await createTag(supabase, {
        ...tagData,
        user_id: currentUserId,
      });
      if (newTag) {
        setTags((prevTags) => [...prevTags, newTag]);
      }
    } catch (error) {
      console.error("Failed to create tag:", error);
      setTagError("Failed to create tag.");
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
      setTagError("Tag to update not identified.");
      return;
    }
    setLoadingTags(true);
    setTagError(null);
    try {
      const updated = await updateTag(supabase, editingTag.id, tagData);
      if (updated) {
        setTags((prevTags) => prevTags.map((t) => (t.id === updated.id ? updated : t)));
      }
    } catch (error) {
      console.error("Failed to update tag:", error);
      setTagError("Failed to update tag.");
    }
    setIsTagEditModalOpen(false);
    setEditingTag(null);
    setLoadingTags(false);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete || !tagToDelete.id) {
      setTagError("Tag to delete not identified.");
      return;
    }
    setLoadingTags(true);
    setTagError(null);
    try {
      await deleteTag(supabase, tagToDelete.id);
      setTags((prevTags) => prevTags.filter((t) => t.id !== tagToDelete.id));
    } catch (error) {
      console.error("Failed to delete tag:", error);
      setTagError("Failed to delete tag.");
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
      {tagError && (
        <p className="text-center text-red-500 py-4">{tagError}</p>
      )}
      {!loadingTags && !tagError && (
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