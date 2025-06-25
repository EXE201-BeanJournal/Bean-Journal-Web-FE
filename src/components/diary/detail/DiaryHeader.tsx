import React from "react";
import { format } from "date-fns";

interface DiaryHeaderProps {
  editableTitle: string;
  setEditableTitle: (title: string) => void;
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
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
      <div className="flex-shrink-0">
        <SaveStatus
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSaved={lastSaved}
        />
      </div>
    </header>
  );
};

export default DiaryHeader; 