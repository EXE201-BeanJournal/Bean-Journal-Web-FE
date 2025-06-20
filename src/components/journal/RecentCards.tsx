import React from "react";
import { Tag } from "../../types/supabase"; // Import Tag interface
import type { SupabaseClient } from "@supabase/supabase-js"; // Added
import { getPublicUrl } from "@/services/storageService"; // Added
import { Icon } from "lucide-react"; // Added
import { type LucideIconName, lucideIconNodes } from "@/utils/lucideIconNames"; // Added lucideIconNodes and type
import Carousel from "../Carousel/Carousel";
import { Clock } from "lucide-react";

interface RecentCardsProps {
  tags: Tag[]; // Changed prop name and type
  onAddNewTag: () => void; // Callback for when the add new tag card is clicked
  onEditTag: (tag: Tag) => void; // Callback for editing a tag
  onDeleteTag: (tagId: string) => void; // Callback for deleting a tag
  supabase: SupabaseClient; // Added
}

const RecentCards: React.FC<RecentCardsProps> = ({
  tags,
  onAddNewTag,
  onEditTag,
  onDeleteTag,
  supabase,
}) => {
  const CARD_WIDTH = 240; // Figma card width
  const CARD_HEIGHT = 220; // Adjusted for new design

  return (
    <>
      <div className="mb-8 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Clock size={22} />
            Recently visited
          </h2>
          <button
            onClick={onAddNewTag}
            className="flex items-center gap-2 rounded-full bg-purple-500/10 dark:bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-300 transition-all hover:bg-purple-500/20 dark:hover:bg-purple-400/20 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:rotate-90"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Tag
          </button>
        </div>
        <div className="p-4">
          <Carousel
            carouselWidth="100%"
            itemWidth={CARD_WIDTH}
            loop={false}
          >
            {/* Render existing tags */}
            {tags.map((tag) => {
              let imageUrl: string | null = null;
              if (tag.image_url_cached) {
                imageUrl = tag.image_url_cached;
              } else if (tag.image_path) {
                imageUrl = getPublicUrl(supabase, "tag-images", tag.image_path);
              }

              const formattedDate = tag.created_at
                ? new Date(tag.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date Placeholder";

              return (
                <div
                  key={tag.id || tag.name}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden relative group transition-all duration-300 flex-shrink-0 flex flex-col border border-gray-200 dark:border-gray-700"
                  style={{
                    width: `${CARD_WIDTH}px`,
                    height: `${CARD_HEIGHT}px`,
                  }}
                >
                  {/* Image Container */}
                  <div className="relative h-2/4">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={tag.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-green-100 dark:bg-green-900/30"></div>
                    )}
                    {/* Icon */}
                    <div className="absolute -bottom-3 left-3 bg-white/50 dark:bg-black/30 backdrop-blur-md p-1.5 rounded-full shadow-lg">
                      {tag.icon_name &&
                      lucideIconNodes[tag.icon_name as LucideIconName] ? (
                        <Icon
                          iconNode={
                            lucideIconNodes[tag.icon_name as LucideIconName]
                          }
                          size={20}
                          className="text-gray-800 dark:text-gray-100"
                        />
                      ) : tag.icon_emoji ? (
                        <span className="text-xl">{tag.icon_emoji}</span>
                      ) : (
                        <div className="w-5 h-5"></div>
                      )}
                    </div>
                  </div>

                  {/* Action Icons: Edit and Delete */}
                  <div className="absolute top-3 right-3 z-20 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTag(tag);
                      }}
                      className="p-1.5 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 rounded-full text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shadow-lg"
                      title="Edit Tag"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTag(tag.id!);
                      }}
                      className="p-1.5 bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 rounded-full text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors shadow-lg"
                      title="Delete Tag"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 pt-6 flex flex-col">
                    <h3
                      className="font-bold text-lg text-gray-800 dark:text-white w-full truncate"
                      title={tag.name}
                    >
                      {tag.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formattedDate}
                    </p>
                  </div>
                </div>
              );
            })}
          </Carousel>
        </div>
      </div>
    </>
  );
};

export default RecentCards;
