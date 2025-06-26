import { useState, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { getProfileByUserId, updateProfile } from "@/services/profileService";
import { getJournalEntriesByUserId } from "@/services/journalEntryService";
import { getTagsForEntry } from "@/services/tagService";
import type { Profile, JournalEntry, Tag } from "@/types/supabase";
import { useSupabase } from "@/contexts/SupabaseContext";
import PhotoGallery from "@/components/PhotoGallery";
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileCard from "@/components/user-profile/ProfileCard";
import StreakCard from "@/components/user-profile/StreakCard";
import MoodChart from "@/components/user-profile/MoodChart";
import LatestDiaryCard from "@/components/user-profile/LatestDiaryCard";
import ActivityCard from "@/components/user-profile/ActivityCard";
import AISummaryCard from "@/components/user-profile/AISummaryCard";
import { UserProfilePageSkeleton } from "@/components/skeletons/UserProfilePageSkeleton";

const defaultCoverBg = "rgba(209, 213, 219, 0.5)";

// Helper function to parse BlockNote JSON content
// This function will now return an object: { textContent: string, imageUrl: string | null }
const parseBlockNoteJsonContent = (
  jsonContent: string | undefined | null
): { textContent: string; imageUrl: string | null } => {
  if (!jsonContent) return { textContent: "", imageUrl: null };
  try {
    const blocks = JSON.parse(jsonContent);
    let readableContent = "";
    let firstImageUrl: string | null = null;

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        if (block.type === "paragraph" && Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.type === "text" && typeof item.text === "string") {
              readableContent += item.text + " ";
            }
          }
          readableContent += "\n";
        } else if (
          block.type === "image" &&
          block.props &&
          typeof block.props.url === "string"
        ) {
          if (!firstImageUrl) {
            // Capture only the first image
            firstImageUrl = block.props.url;
          }
        }
        // Add more conditions here to handle other block types (headings, lists, etc.)
      }
    }
    return { textContent: readableContent.trim(), imageUrl: firstImageUrl };
  } catch (error) {
    console.error("Error parsing BlockNote JSON content:", error);
    return {
      textContent: typeof jsonContent === "string" ? jsonContent : "",
      imageUrl: null,
    };
  }
};

// Helper function to sort journal entries by entry_timestamp robustly
// Sorts in descending order (newest first)
// Null or invalid timestamps are sorted towards the end
const sortJournalEntriesByTimestamp = (a: JournalEntry, b: JournalEntry) => {
  const tsA = a.entry_timestamp;
  const tsB = b.entry_timestamp;

  // Handle cases where timestamps might be null or undefined
  if (
    (tsA === null || tsA === undefined) &&
    (tsB === null || tsB === undefined)
  )
    return 0;
  if (tsA === null || tsA === undefined) return 1; // null/undefined timestamps sort after valid ones
  if (tsB === null || tsB === undefined) return -1; // null/undefined timestamps sort after valid ones

  const dateA = new Date(tsA).getTime();
  const dateB = new Date(tsB).getTime();

  // Handle NaN (invalid date string after conversion)
  const aIsNaN = isNaN(dateA);
  const bIsNaN = isNaN(dateB);

  if (aIsNaN && bIsNaN) return 0;
  // Sort NaNs after valid dates
  if (aIsNaN) return 1;
  if (bIsNaN) return -1;

  return dateB - dateA; // Descending order (newest first)
};

const UserProfilePage = () => {
  const { user } = useClerk();
  const { has, isLoaded } = useAuth();
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(true);
  const [averageColor, setAverageColor] = useState<string>(defaultCoverBg);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [latestDiary, setLatestDiary] = useState<JournalEntry | null>(null);
  const [userJournalEntries, setUserJournalEntries] = useState<JournalEntry[]>(
    []
  );
  const [readableDiaryContent, setReadableDiaryContent] = useState<string>("");
  const [latestDiaryImageUrl, setLatestDiaryImageUrl] = useState<string | null>(
    null
  );
  const [latestDiaryTags, setLatestDiaryTags] = useState<Tag[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "photos">("overview");
  const [streakedDays, setStreakedDays] = useState<string[]>([]);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  const hasAiTools = isLoaded && has ? has({ feature: 'ai_tools' }) : false;

  useEffect(() => {
    // This effect will run when profileData is loaded or updated.
    if (isLoaded && !hasAiTools && profileData?.ai_insights_generated_at) {
        const lastGenerated = new Date(profileData.ai_insights_generated_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (lastGenerated > sevenDaysAgo) {
            const errorMessage = "You can generate a new insight once per week on the free plan. Upgrade for more.";
            setRateLimitMessage(errorMessage);
        } else {
            setRateLimitMessage(null);
        }
    } else {
        // If user has AI tools or no previous generation date, there is no error.
        setRateLimitMessage(null);
    }
  }, [profileData, hasAiTools, isLoaded]);

  const handleInsightGenerated = async (insight: string) => {
    if (profileData && supabase && user) {
      try {
        const updatedProfile = await updateProfile(supabase, user.id, {
          ai_insights: { summary: insight },
          ai_insights_generated_at: new Date().toISOString(),
        });
        if (updatedProfile) {
          setProfileData(updatedProfile);
        }
      } catch (error) {
        console.error("Failed to save AI insight", error);
        // Let AISummaryCard handle its own API errors.
      }
    }
  };

  useEffect(() => {
    if (user?.id && supabase) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const profilePromise = getProfileByUserId(supabase, user.id);
          const entriesPromise = getJournalEntriesByUserId(supabase, user.id);

          const [profileResult, entriesResult] = await Promise.all([
            profilePromise,
            entriesPromise,
          ]);

          setProfileData(profileResult);

          if (entriesResult && entriesResult.length > 0) {
            setUserJournalEntries(entriesResult);
            const sortedEntries = [...entriesResult].sort(
              sortJournalEntriesByTimestamp
            );
            const diaryEntry = sortedEntries[0];
            setLatestDiary(diaryEntry);

            const parsedContent = parseBlockNoteJsonContent(diaryEntry.content);
            setReadableDiaryContent(parsedContent.textContent);
            setLatestDiaryImageUrl(parsedContent.imageUrl);

            if (diaryEntry.id) {
              const tags = await getTagsForEntry(supabase, diaryEntry.id);
              setLatestDiaryTags(tags);
            }

            // Calculate streaked days
            const today = new Date();
            const dayAbbreviations = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];
            const recentStreakedDays = new Set<string>();

            for (let i = 0; i < 7; i++) {
              const dateToCheck = new Date();
              dateToCheck.setDate(today.getDate() - i);
              const dateString = dateToCheck.toISOString().split("T")[0];

              const hasEntry = entriesResult.some((entry) =>
                entry.entry_timestamp?.startsWith(dateString)
              );
              if (hasEntry) {
                recentStreakedDays.add(dayAbbreviations[dateToCheck.getDay()]);
              }
            }
            setStreakedDays(Array.from(recentStreakedDays));
          } else {
            setUserJournalEntries([]);
            setLatestDiary(null);
            setReadableDiaryContent("");
            setLatestDiaryImageUrl(null);
            setLatestDiaryTags([]);
          }
        } catch (error) {
          console.error("Error fetching user profile data:", error);
          setProfileData(null);
          setUserJournalEntries([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else if (!user) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  useEffect(() => {
    let objectUrl: string | null = null;
    const calculateAverageColor = async () => {
      const currentAvatarSrc = user?.imageUrl;
      if (currentAvatarSrc && currentAvatarSrc !== "/avatars/shadcn.jpg") {
        try {
          const response = await fetch(currentAvatarSrc);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch image: ${response.status} ${response.statusText}`
            );
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);

          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = objectUrl;

          img.onload = () => {
            if (!img.width || !img.height) {
              setAverageColor(defaultCoverBg);
              if (objectUrl) URL.revokeObjectURL(objectUrl);
              return;
            }
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              setAverageColor(defaultCoverBg);
              if (objectUrl) URL.revokeObjectURL(objectUrl);
              return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let r = 0,
              g = 0,
              b = 0;
            let pixelCount = 0;
            try {
              const sampleX = Math.floor(canvas.width / 4);
              const sampleY = Math.floor(canvas.height / 4);
              const sampleWidth = Math.floor(canvas.width / 2);
              const sampleHeight = Math.floor(canvas.height / 2);
              const imageData = ctx.getImageData(
                sampleX,
                sampleY,
                sampleWidth,
                sampleHeight
              );
              const data = imageData.data;
              const blockSize = 10;
              const lightnessThreshold = 100;
              for (let i = 0; i < data.length; i += 4 * blockSize) {
                const currentR = data[i];
                const currentG = data[i + 1];
                const currentB = data[i + 2];
                const luminance =
                  0.2126 * currentR + 0.7152 * currentG + 0.0722 * currentB;
                if (luminance > lightnessThreshold) {
                  r += currentR;
                  g += currentG;
                  b += currentB;
                  pixelCount++;
                }
              }
              if (pixelCount > 0) {
                r = Math.floor(r / pixelCount);
                g = Math.floor(g / pixelCount);
                b = Math.floor(b / pixelCount);
                setAverageColor(`rgb(${r},${g},${b})`);
              } else {
                setAverageColor(defaultCoverBg);
              }
            } catch (error) {
              setAverageColor(defaultCoverBg);
            }
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          };
          img.onerror = () => {
            setAverageColor(defaultCoverBg);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          };
        } catch (error) {
          setAverageColor(defaultCoverBg);
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }
      } else {
        setAverageColor(defaultCoverBg);
      }
    };
    calculateAverageColor();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [user?.imageUrl]);

  if (isLoading) {
    return <UserProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in to view your profile.
      </div>
    );
  }

  if (!supabase && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black">
        Initializing Supabase or Supabase configuration error...
      </div>
    );
  }

  if (!profileData && user && supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-black">
        Loading profile...
      </div>
    );
  }

  const userNameToDisplay = user.username || profileData?.username || "User";
  let finalAvatarSrc = user.imageUrl || "/avatars/shadcn.jpg";
  if (
    finalAvatarSrc &&
    finalAvatarSrc !== "/avatars/shadcn.jpg" &&
    !finalAvatarSrc.includes("?")
  ) {
    const params = new URLSearchParams();
    params.set("height", "400");
    params.set("width", "400");
    params.set("quality", "90");
    params.set("fit", "crop");
    finalAvatarSrc = `${finalAvatarSrc}?${params.toString()}`;
  }
  const coverPhotoUrl = null;
  const currentStreak = profileData?.current_journal_streak || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E4EFE7] to-white dark:from-gray-800 dark:via-gray-900 dark:to-black text-[#2F2569] dark:text-gray-200">
      <div className="overflow-hidden">
        <ProfileHeader
          coverPhotoUrl={coverPhotoUrl}
          averageColor={averageColor}
          finalAvatarSrc={finalAvatarSrc}
          userNameToDisplay={userNameToDisplay}
          profileData={profileData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <div className="py-4 md:py-8 px-4 sm:px-6 lg:px-8">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProfileCard
                    finalAvatarSrc={finalAvatarSrc}
                    userNameToDisplay={userNameToDisplay}
                    profileData={profileData}
                  />
                  <StreakCard
                    currentStreak={currentStreak}
                    streakedDays={streakedDays}
                  />
                </div>

                <MoodChart userJournalEntries={userJournalEntries} />
              </div>

              <div className="lg:col-span-1 space-y-6">
                <ActivityCard userJournalEntries={userJournalEntries} />
                <LatestDiaryCard
                  latestDiary={latestDiary}
                  latestDiaryImageUrl={latestDiaryImageUrl}
                  readableDiaryContent={readableDiaryContent}
                  latestDiaryTags={latestDiaryTags}
                />
              </div>

              <div className="lg:col-span-3 space-y-6">
                <AISummaryCard
                  initialSummary={profileData?.ai_insights?.summary as string | undefined}
                  onInsightGenerated={handleInsightGenerated}
                  rateLimitMessage={rateLimitMessage}
                />
              </div>
            </div>
          )}
          {activeTab === "photos" && supabase && user?.id && (
            <PhotoGallery supabase={supabase} userId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
