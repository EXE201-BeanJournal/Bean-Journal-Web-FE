import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/types/supabase";
import {
  Edit3,
  ImageIcon,
  PlusCircle,
  SquareUserRound,
} from "lucide-react";

interface ProfileHeaderProps {
  coverPhotoUrl: string | null;
  averageColor: string;
  finalAvatarSrc: string;
  userNameToDisplay: string;
  profileData: Profile | null;
  activeTab: "overview" | "photos";
  setActiveTab: React.Dispatch<React.SetStateAction<"overview" | "photos">>;
}

const ProfileHeader = ({
  coverPhotoUrl,
  averageColor,
  finalAvatarSrc,
  userNameToDisplay,
  profileData,
  activeTab,
  setActiveTab,
}: ProfileHeaderProps) => {
  return (
    <div>
      <div
        className={`relative h-48 md:h-64 ${
          !coverPhotoUrl ? "" : "bg-cover bg-center"
        }`}
        style={
          coverPhotoUrl
            ? { backgroundImage: `url(${coverPhotoUrl})` }
            : { backgroundColor: averageColor }
        }
      >
        <Button
          variant="outline"
          size="sm"
          className="absolute top-4 right-4 bg-white/80 hover:bg-white text-xs dark:bg-gray-800/80 dark:hover:bg-gray-700"
        >
          <ImageIcon size={14} className="mr-1.5" />
          Edit Cover
        </Button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="pb-6 -mt-16 md:-mt-20 relative">
          <div className="flex flex-col items-center md:flex-row md:items-end md:space-x-5">
            <div className="relative">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white dark:border-gray-800">
                <AvatarImage src={finalAvatarSrc} alt={userNameToDisplay} />
                <AvatarFallback>{userNameToDisplay.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-700 absolute -bottom-2 -right-2"
              >
                <ImageIcon size={14} />
              </Button>
            </div>

            <div className="mt-3 md:mt-0 text-center md:text-left flex-grow">
              <h1 className="text-2xl md:text-3xl font-bold">
                {userNameToDisplay}
              </h1>
              {profileData?.current_journal_streak &&
                profileData.current_journal_streak > 0 && (
                  <p className="text-sm text-pink-500 font-semibold mt-1">
                    {profileData.current_journal_streak} day streak!
                  </p>
                )}
            </div>

            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button
                variant="outline"
                className="text-xs bg-[#b1dc98] dark:text-gray-300 dark:border-gray-600"
                onClick={() =>
                  setActiveTab((prev) =>
                    prev === "photos" ? "overview" : "photos"
                  )
                }
              >
                {activeTab === "photos" ? (
                  <div className="flex items-center">
                    <ImageIcon size={14} className="mr-1.5" />
                    Overview
                  </div>
                ) : (
                  <div className="flex items-center">
                    <SquareUserRound size={14} className="mr-1.5" />
                    Photo Gallery
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                className="text-xs bg-[#b1dc98] dark:text-gray-300 dark:border-gray-600"
              >
                <PlusCircle size={14} className="mr-1.5" /> New Page
              </Button>
              <Button className="text-xs bg-[#b1dc98] text-[#2F2569] hover:bg-[#a1cb88]">
                <Edit3 size={14} className="mr-1.5" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 