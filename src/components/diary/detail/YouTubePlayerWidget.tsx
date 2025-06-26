import React from "react";
import Draggable from "react-draggable";
import YouTube from "react-youtube";
import { X, GripVertical } from "lucide-react";

interface YouTubePlayerWidgetProps {
  onClose: () => void;
}

const YouTubePlayerWidget: React.FC<YouTubePlayerWidgetProps> = ({
  onClose,
}) => {
  const opts = {
    height: "180",
    width: "320",
    playerVars: {
      autoplay: 1,
      controls: 1,
      loop: 1,
      playlist: "dQw4w9WgXcQ", // Required for single video loop
      modestbranding: 1,
    },
  };

  return (
    <Draggable handle=".handle">
      <div
        className="fixed bottom-16 right-5 z-50 bg-slate-800 text-white rounded-lg shadow-2xl"
        style={{ width: "320px" }}
      >
        <div className="handle cursor-move bg-slate-700 p-2 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center">
            <GripVertical className="h-5 w-5 mr-2 text-slate-400" />
            <span className="font-semibold text-sm">Music Player</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close music player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="w-full h-[180px]">
          <YouTube
            videoId="dQw4w9WgXcQ"
            opts={opts}
            className="w-full h-full"
            iframeClassName="w-full h-full rounded-b-lg"
          />
        </div>
      </div>
    </Draggable>
  );
};

export default YouTubePlayerWidget; 