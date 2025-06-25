import { useMemo } from "react";

export interface ParsedContent {
  textContent: string;
  imageUrl: string | null;
}

interface BlockNoteContentItem {
  type: string;
  text?: string;
}

interface BlockNoteBlock {
  type: string;
  content?: BlockNoteContentItem[];
  props?: {
    url?: string;
  };
}

export const parseBlockNoteJsonContent = (
  content: string | null | undefined
): ParsedContent => {
  if (!content) return { textContent: "", imageUrl: null };

  try {
    const blocks: BlockNoteBlock[] = JSON.parse(content);
    let textContent = "";
    let imageUrl = null;

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        if (block.type === "paragraph" && block.content) {
          textContent +=
            block.content
              .filter((item: BlockNoteContentItem) => item.type === "text")
              .map((item: BlockNoteContentItem) => item.text)
              .join(" ") + " ";
        } else if (block.type === "image" && !imageUrl && block.props?.url) {
          imageUrl = block.props.url;
        }

        if (textContent.length > 200 && imageUrl) break;
      }
    }

    return {
      textContent: textContent.trim().slice(0, 200),
      imageUrl,
    };
  } catch {
    return {
      textContent: typeof content === "string" ? content.slice(0, 200) : "",
      imageUrl: null,
    };
  }
};

export const useParseBlockNoteContent = (
  content: string | null | undefined
): ParsedContent => {
  return useMemo(() => parseBlockNoteJsonContent(content), [content]);
};
