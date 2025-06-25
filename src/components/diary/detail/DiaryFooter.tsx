import { Project, Tag } from "@/types/supabase";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/combobox";
import { FaFacebookF, FaLinkedinIn, FaTrash } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import MoodSelector from "./MoodSelector";

interface DiaryFooterProps {
    selectedTagIds: string[];
    setSelectedTagIds: (ids: string[]) => void;
    availableTags: Tag[];
    isLoadingTags: boolean;
    selectedProjectId: string | null | undefined;
    setSelectedProjectId: (id: string | null) => void;
    availableProjects: Project[];
    isLoadingProjects: boolean;
    currentSelectedMood: string | null | undefined;
    setCurrentSelectedMood: (mood: string | null) => void;
    showDeleteConfirm: () => void;
    onShareToFacebook: () => void;
    onShareToLinkedIn: () => void;
    isSharing: boolean;
  }

  const DiaryFooter = ({
    selectedTagIds,
    setSelectedTagIds,
    availableTags,
    isLoadingTags,
    selectedProjectId,
    setSelectedProjectId,
    availableProjects,
    isLoadingProjects,
    currentSelectedMood,
    setCurrentSelectedMood,
    showDeleteConfirm,
    onShareToFacebook,
    onShareToLinkedIn,
    isSharing,
  }: DiaryFooterProps) => {
    
    const tagOptions = availableTags.map((tag) => ({
        value: tag.id!,
        label: tag.name,
        color: tag.color_hex || undefined,
    }));

    const projectOptions = availableProjects.map((project) => ({
        value: project.id!,
        label: project.name,
        color: project.color_hex || undefined,
    }));

    return (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 sm:px-6 shadow-t-lg sticky bottom-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Mood Selector */}
            <div className="flex items-center justify-center md:justify-start">
              <MoodSelector
                selectedMood={currentSelectedMood}
                onSelectMood={setCurrentSelectedMood}
              />
            </div>
    
            {/* Tags and Project */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-full sm:w-auto">
                <Combobox
                    options={tagOptions}
                    value={selectedTagIds}
                    onChange={(val) => setSelectedTagIds(val as string[])}
                    multiple
                    placeholder="Select tags..."
                    isLoading={isLoadingTags}
                    className="w-full"
                />
              </div>
              <div className="w-full sm:w-auto">
                <Combobox
                    options={projectOptions}
                    value={selectedProjectId || ""}
                    onChange={(val) => setSelectedProjectId(val as string | null)}
                    placeholder="Select a project..."
                    isLoading={isLoadingProjects}
                    className="w-full"
                />
              </div>
            </div>
    
            {/* Action Icons */}
            <div className="flex items-center justify-center md:justify-end space-x-2">
                {isSharing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <>
                        <Button variant="outline" size="icon" onClick={onShareToFacebook} aria-label="Share to Facebook">
                            <FaFacebookF className="h-4 w-4 text-[#1877F2]" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={onShareToLinkedIn} aria-label="Share to LinkedIn">
                            <FaLinkedinIn className="h-4 w-4 text-[#0A66C2]" />
                        </Button>
                    </>
                )}
                <Button variant="destructive" size="icon" onClick={showDeleteConfirm} aria-label="Delete diary">
                    <FaTrash className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      );
}

export default DiaryFooter; 