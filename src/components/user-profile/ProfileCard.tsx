import type { Profile } from "@/types/supabase";

interface ProfileCardProps {
  finalAvatarSrc: string;
  userNameToDisplay: string;
  profileData: Profile | null;
}

const ProfileCard = ({
  finalAvatarSrc,
  userNameToDisplay,
  profileData,
}: ProfileCardProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Profile</h3>
      <div className="relative overflow-hidden bg-white/30 dark:bg-slate-800/40 backdrop-blur-md rounded-lg shadow-lg">
        <img
          src={finalAvatarSrc}
          alt={userNameToDisplay}
          className="w-full h-40 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
          <span className="font-semibold text-base text-white block truncate">
            {userNameToDisplay}
          </span>
          <p className="text-xs text-gray-200 block truncate">
            {profileData?.email || "No bio available."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 