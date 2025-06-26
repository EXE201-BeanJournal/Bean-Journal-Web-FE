import { useState } from "react";
import { Spotify } from "react-spotify-embed";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";

const SpotifyPlayer = () => {
  const [playlistUrl, setPlaylistUrl] = useState(
    "https://open.spotify.com/album/6zpKJ0jCROglQiV9ir7pcr?uid=c014f45ae414ccc87535&uri=spotify%3Atrack%3A3yLzD4HMsn8umpbck5ex44"
  );
  const [inputUrl, setInputUrl] = useState(playlistUrl);

  const handleUrlChange = () => {
    // A simple validation to ensure it's a spotify link
    if (inputUrl.includes("open.spotify.com")) {
      setPlaylistUrl(inputUrl);
    } else {
      // Maybe show an error to the user
      alert("Please enter a valid Spotify URL.");
    }
  };

  return (
    <div className="mt-6 relative w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Spotify className="w-full" wide link={playlistUrl} />
            </div>
          </TooltipTrigger>
          <TooltipContent className="spotify-tooltip-theme bg-sidebar-accent-foreground shadow-2xl">
            <div className="grid min-w-fit items-center gap-1.5 p-2">
              <Label htmlFor="playlist-url">
                Spotify Playlist Link
              </Label>
              <Input
                id="playlist-url"
                type="url"
                placeholder="Paste your link here"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <Button
                onClick={handleUrlChange}
                size="sm"
                className="mt-2"
              >
                Update Playlist
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SpotifyPlayer;
