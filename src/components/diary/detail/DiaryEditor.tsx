import React from "react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  FormattingToolbarController,
  FormattingToolbar,
  blockTypeSelectItems,
  BlockTypeSelectItem,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  DefaultReactSuggestionItem,
  CreateLinkButton,
  UnnestBlockButton,
  NestBlockButton,
  TextAlignButton,
  ColorStyleButton,
  FileCaptionButton,
  FileReplaceButton,
  BasicTextStyleButton,
  BlockTypeSelect,
  GridSuggestionMenuController,
} from "@blocknote/react";
import {
  getAISlashMenuItems,
  AIMenuController,
  AIToolbarButton,
} from "@blocknote/xl-ai";
import { RiAlertFill } from "react-icons/ri";
import { filterSuggestionItems, BlockNoteEditor } from "@blocknote/core";

interface DiaryEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: BlockNoteEditor<any>;
  setCurrentEditorContentString: (content: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertAlert: (editor: BlockNoteEditor<any>) => DefaultReactSuggestionItem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertTodo: (editor: BlockNoteEditor<any>) => DefaultReactSuggestionItem;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({
  editor,
  setCurrentEditorContentString,
  insertAlert,
  insertTodo,
}) => {
  const handleContentChange = React.useCallback(() => {
    if (editor) {
      setCurrentEditorContentString(JSON.stringify(editor.document));
    }
  }, [editor, setCurrentEditorContentString]);

  if (!editor) {
    return (
      <div className="flex-grow p-4 md:p-6 flex flex-col">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 md:p-6 flex flex-col">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={handleContentChange}
        formattingToolbar={false}
        emojiPicker={false}
        slashMenu={false} // Disable default slash menu to prevent duplicates
      >
        {/* Emoji picker with grid layout */}
        <GridSuggestionMenuController
          triggerCharacter=":"
          columns={5}
          minQueryLength={2}
        />

        {/* AI Menu Controller */}
        <AIMenuController />

        {/* Custom Formatting Toolbar */}
        <FormattingToolbarController
          formattingToolbar={(props) => (
            <FormattingToolbar
              {...props}
              blockTypeSelectItems={[
                ...blockTypeSelectItems(editor.dictionary),
                {
                  name: "Alert",
                  type: "alert",
                  icon: RiAlertFill,
                  isSelected: (block) => block.type === "alert",
                } satisfies BlockTypeSelectItem,
              ]}
            >
              <BlockTypeSelect key="blockTypeSelect" />

              <FileCaptionButton key="fileCaptionButton" />
              <FileReplaceButton key="replaceFileButton" />

              <BasicTextStyleButton
                basicTextStyle="bold"
                key="boldStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="italic"
                key="italicStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="underline"
                key="underlineStyleButton"
              />
              <BasicTextStyleButton
                basicTextStyle="strike"
                key="strikeStyleButton"
              />
              <BasicTextStyleButton
                key="codeStyleButton"
                basicTextStyle="code"
              />

              <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
              <TextAlignButton
                textAlignment="center"
                key="textAlignCenterButton"
              />
              <TextAlignButton
                textAlignment="right"
                key="textAlignRightButton"
              />

              <ColorStyleButton key="colorStyleButton" />

              <NestBlockButton key="nestBlockButton" />
              <UnnestBlockButton key="unnestBlockButton" />

              <CreateLinkButton key="createLinkButton" />
              <AIToolbarButton key="aiToolbarButton" />
            </FormattingToolbar>
          )}
        />

        {/* Custom Slash Menu - This is your ONLY slash menu */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => {
            try {
              // Get default items
              const defaultItems = getDefaultReactSlashMenuItems(editor);
              const aiItems = getAISlashMenuItems(editor);

              // Find last basic block index
              let lastBasicBlockIndex = -1;
              for (let i = defaultItems.length - 1; i >= 0; i--) {
                const item = defaultItems[i];
                if (item.group === "Basic blocks") {
                  lastBasicBlockIndex = i;
                  break;
                }
              }

              // Create a copy of default items to avoid mutation
              const customItems = [...defaultItems];

              // Insert custom items
              if (lastBasicBlockIndex !== -1) {
                customItems.splice(
                  lastBasicBlockIndex + 1,
                  0,
                  insertAlert(editor)
                );
                customItems.splice(
                  lastBasicBlockIndex + 2,
                  0,
                  insertTodo(editor)
                );
              } else {
                // If no basic blocks found, add at the end
                customItems.push(insertAlert(editor));
                customItems.push(insertTodo(editor));
              }

              // Combine and filter items
              const allItems = [...customItems, ...aiItems];
              return filterSuggestionItems(allItems, query);
            } catch (error) {
              console.error("Error getting slash menu items:", error);
              return [];
            }
          }}
        />
      </BlockNoteView>
    </div>
  );
};

export default DiaryEditor;
