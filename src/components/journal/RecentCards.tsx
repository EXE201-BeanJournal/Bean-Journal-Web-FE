import React, { useRef, useState, useEffect, useCallback } from "react";
import { Tag } from "../../types/supabase"; // Import Tag interface
import type { SupabaseClient } from "@supabase/supabase-js"; // Added
import { getPublicUrl } from "@/services/storageService"; // Added
import { Icon } from "lucide-react"; // Added
import { type LucideIconName, lucideIconNodes } from "@/utils/lucideIconNames"; // Added lucideIconNodes and type

interface RecentCardsProps {
  tags: Tag[]; // Changed prop name and type
  onAddNewTag: () => void; // Callback for when the add new tag card is clicked
  onEditTag: (tag: Tag) => void; // Callback for editing a tag
  onDeleteTag: (tagId: string) => void; // Callback for deleting a tag
  supabase: SupabaseClient; // Added
}

// Helper to generate a simple gradient based on the hex color
const getGradientStyle = (colorHex?: string) => {
  if (!colorHex) {
    return { background: "linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)" }; // Default gray gradient
  }
  // Attempt to create a slightly lighter and a slightly darker shade for the gradient
  // This is a very basic approach and might not work well for all colors.
  // For more robust color manipulation, a library like `tinycolor2` would be better.
  try {
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);

    const lighten = (val: number, amount: number) =>
      Math.min(255, Math.max(0, val + amount));

    const r1 = lighten(r, 40);
    const g1 = lighten(g, 40);
    const b1 = lighten(b, 40);

    const r2 = lighten(r, -10);
    const g2 = lighten(g, -10);
    const b2 = lighten(b, -10);

    const colorStart = `#${r1.toString(16).padStart(2, "0")}${g1.toString(16).padStart(2, "0")}${b1.toString(16).padStart(2, "0")}`;
    const colorEnd = `#${r2.toString(16).padStart(2, "0")}${g2.toString(16).padStart(2, "0")}${b2.toString(16).padStart(2, "0")}`;

    return {
      background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
    };
  } catch (e) {
    // Fallback if color parsing fails
    return {
      background: `linear-gradient(135deg, ${colorHex} 0%, ${colorHex} 100%)`,
    }; // Solid color as gradient
  }
};

const RecentCards: React.FC<RecentCardsProps> = ({
  tags,
  onAddNewTag,
  onEditTag,
  onDeleteTag,
  supabase,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true); // Assume can scroll right initially if content overflows

  const CARD_WIDTH = 180; // Figma card width
  const CARD_HEIGHT = 181; // Figma card height
  const GAP_SIZE = 20; // From gap-5 (1.25rem = 20px, assuming 1rem = 16px)

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollLeft = Math.ceil(container.scrollLeft); // Use Math.ceil to handle potential subpixel values
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollWidth - scrollLeft - clientWidth > 1); // Check if there's more than 1px to scroll
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollability(); // Initial check

      container.addEventListener("scroll", checkScrollability, {
        passive: true,
      });
      const resizeObserver = new ResizeObserver(checkScrollability);
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener("scroll", checkScrollability);
        resizeObserver.unobserve(container);
        // resizeObserver.disconnect(); // Alternative cleanup
      };
    }
  }, [tags, checkScrollability]); // Re-check if tags change (affects scrollWidth) or checkScrollability changes

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollDistance = CARD_WIDTH + GAP_SIZE; // Scroll by one item
      const amount = direction === "left" ? -scrollDistance : scrollDistance;
      container.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <>
      <style>
        {`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;  /* IE and Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}
      </style>
      <div className="mb-8 w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#989CB8]">Your Tags</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className="text-gray-400 hover:text-purple-500 transition-colors p-1 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="/images/bean-journey/figma/icon_caret_right.png"
                alt="Scroll Left"
                className="w-6 h-6 transform rotate-180"
              />
            </button>
            <button
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className="text-gray-400 hover:text-purple-500 transition-colors p-1 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src="/images/bean-journey/figma/icon_caret_right.png"
                alt="Scroll Right"
                className="w-6 h-6"
              />
            </button>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="no-scrollbar flex overflow-x-auto pb-4 pt-4 gap-5 scroll-smooth scroll-snap-type-x-mandatory w-full"
        >
          {/* Placeholder card for creating a new tag */}
          <div
            onClick={onAddNewTag}
            className="bg-white dark:bg-slate-800 rounded-[30px] shadow-md flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-solid border-gray-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-400 group transform hover:-translate-y-1 group-hover:bg-purple-50 dark:group-hover:bg-slate-700 scroll-snap-align-start flex-shrink-0"
            style={{
              minWidth: `${CARD_WIDTH}px`,
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-400 group-hover:text-purple-500 mb-2.5 transition-colors duration-200"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <p className="text-[#2f2569] dark:text-slate-200 font-medium text-md group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
              Create Tag
            </p>
          </div>

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
                className="rounded-[30px] shadow-md overflow-hidden relative group transform hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer scroll-snap-align-start flex-shrink-0 flex flex-col bg-white dark:bg-slate-800"
                style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` }}
                onClick={() => onEditTag(tag)}
              >
                {/* Action Icons: Edit and Delete */}
                <div className="absolute top-3 right-3 z-20 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTag(tag);
                    }}
                    className="p-1.5 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 rounded-full text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-500 transition-colors shadow"
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
                    className="p-1.5 bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 rounded-full text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 transition-colors shadow"
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

                {/* Image/Icon Section - approx 60% height */}
                <div
                  className="h-[90px] w-full flex items-center justify-center relative overflow-hidden group-hover:opacity-95 transition-opacity duration-200"
                  style={
                    !imageUrl
                      ? getGradientStyle(tag.color_hex)
                      : { backgroundColor: tag.color_hex || "#e0e0e0" }
                  }
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={tag.name}
                      className="w-full h-full object-cover"
                    />
                  ) : tag.icon_emoji ? (
                    <span className="text-3xl" role="img" aria-label={tag.name}>
                      {tag.icon_emoji}
                    </span>
                  ) : (
                    <span className="text-white text-3xl font-bold opacity-80 group-hover:opacity-100 drop-shadow-sm">
                      {tag.name ? tag.name.charAt(0).toUpperCase() : "#"}
                    </span>
                  )}
                </div>

                {/* Text Content Section - Modified to include icon prominently */}
                <div className="relative pt-2 pb-3 px-4 flex-1 flex flex-col justify-start items-start text-start">
                  {/* Conditionally render Lucide Icon here if tag.icon_name exists */}
                  {tag.icon_name &&
                    typeof tag.icon_name === "string" &&
                    lucideIconNodes[tag.icon_name as LucideIconName] && (
                      // Icon container: positioned to overlap, with background & padding
                      <div
                        className={`absolute -top-3 left-1/4 transform -translate-x-1/2 p-1.5 rounded-full shadow-md ${!tag.color_hex ? 'bg-white dark:bg-slate-700' : ''}`}
                        style={tag.color_hex ? { backgroundColor: tag.color_hex.startsWith('#') ? tag.color_hex : `#${tag.color_hex}` } : {}}
                      >
                        <Icon
                          iconNode={
                            lucideIconNodes[tag.icon_name as LucideIconName]
                          }
                          color="gray"
                          size={20}
                          className={`${tag.color_hex ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}
                        />
                      </div>
                    )}
                  {/* Add top padding to text if icon is present to avoid overlap */}
                  <h3
                    className={`font-readex-pro text-[21px] leading-tight text-[#2F2569] dark:text-slate-100 font-normal w-full truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 ${tag.icon_name ? "pt-5" : "pt-0"}`}
                    title={tag.name}
                    style={{ fontFamily: "'Readex Pro', sans-serif" }} // Ensure Readex Pro is used or a fallback
                  >
                    {tag.name}
                  </h3>
                  <p
                    className="font-readex-pro text-[15px] text-[#CAC9C8] dark:text-slate-400 font-normal mt-1"
                    style={{ fontFamily: "'Readex Pro', sans-serif" }} // Ensure Readex Pro is used or a fallback
                  >
                    {formattedDate}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default RecentCards;
