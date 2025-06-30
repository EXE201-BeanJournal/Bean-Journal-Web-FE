import React from "react";
import { format } from "date-fns";
import { Smile, Music } from "lucide-react";
import LoadingAnimation from "../../user-profile/LoadingAnimation";

interface DiaryHeaderProps {
  editableTitle: string;
  setEditableTitle: (title: string) => void;
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onAnalyzeMood: () => void;
  isAnalyzingMood: boolean;
  moodAnalysisResult: string | null;
  moodAnalysisError: string | null;
  onToggleMusicPlayer: () => void;
}

const SaveStatus: React.FC<{
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}> = ({ lastSaved, isSaving, hasUnsavedChanges }) => {
  if (isSaving) {
    return (
      <div className="flex items-center text-sm text-slate-500">
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Saving...
      </div>
    );
  }
  if (hasUnsavedChanges) {
    return <div className="text-sm text-orange-500">Unsaved changes</div>;
  }
  if (lastSaved) {
    return (
      <div className="text-sm text-slate-500">
        Last saved: {format(lastSaved, "p")}
      </div>
    );
  }
  return <div className="text-sm text-slate-500">Saved</div>;
};

const DiaryHeader: React.FC<DiaryHeaderProps> = ({
  editableTitle,
  setEditableTitle,
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  onAnalyzeMood,
  isAnalyzingMood,
  moodAnalysisError,
  onToggleMusicPlayer,
}) => {
  return (
    <header className="p-4 md:p-6 flex justify-between items-center border-b border-slate-200 bg-white sticky top-0 z-10">
      <div className="flex-grow mr-4">
        <input
          type="text"
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value)}
          placeholder="Untitled Diary"
          className="text-2xl md:text-3xl font-semibold text-gray-800 w-full border-0 focus:ring-0 p-0 bg-transparent focus:outline-none"
        />
      </div>
      <div className="flex-shrink-0 flex items-center space-x-4">
        <SaveStatus
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSaved={lastSaved}
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMusicPlayer}
            className="flex items-center justify-center p-2 border border-transparent rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            aria-label="Toggle music player"
          >
            <Music className="h-5 w-5" />
          </button>
          <button
            onClick={onAnalyzeMood}
            disabled={isAnalyzingMood}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzingMood ? (
              <div className="flex items-center justify-center w-full">
                <div className="w-20 h-5">
                  <LoadingAnimation />
                </div>
              </div>
            ) : (
              <>
                <Smile className="h-5 w-5 mr-2" />
                Analyze Mood
              </>
            )}
          </button>
          {moodAnalysisError && (
            <div className="text-sm text-red-500">{moodAnalysisError}</div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DiaryHeader; 