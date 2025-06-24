import React from "react";
import { JournalEntry, Tag as SupabaseTag } from "@/types/supabase";

// --- Type definitions for parsing BlockNote content ---
type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
};

type InlineContent = {
  type: "text";
  text: string;
  styles: InlineStyle;
  content?: string | InlineContent[];
};

type Block = {
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "bulletListItem"
    | "numberedListItem"
    | "todo"
    | "alert"
    | "table"
    | "tableRow"
    | "tableCell"
    | "quote";
  props: {
    level?: "1" | "2" | "3";
    url?: string;
    checked?: "true" | "false";
    type?: "warning" | "error" | "info" | "success"; // for alert
  };
  content: InlineContent[] | { type: "tableContent"; rows: Block[] }; // Table content is different
  children: Block[];
};

type GroupedBlock = Block | { type: 'bulletList' | 'numberedList'; items: Block[] };

// Updated async function to extract content and embed the image
// eslint-disable-next-line react-refresh/only-export-components
export const extractFirstImageAndContent = async (content: string): Promise<{ imageUrl: string | null; remainingBlocks: Block[] }> => {
  if (!content) {
    return { imageUrl: null, remainingBlocks: [] };
  }
  try {
    const parsedBlocks: Block[] = JSON.parse(content);
    if (!Array.isArray(parsedBlocks)) {
      return { imageUrl: null, remainingBlocks: [] };
    }

    // Filter out all image blocks
    const remainingBlocks = parsedBlocks.filter(block => block.type !== 'image');

    // No image will be returned
    return { imageUrl: null, remainingBlocks };
  } catch (e) {
    console.error("Failed to parse journal content:", e);
    return { imageUrl: null, remainingBlocks: [] };
  }
};

// --- Helper function to render inline content (bold, italic, etc.) ---
const renderInlineContent = (
  content?: (string | InlineContent)[]
): (string | JSX.Element)[] => {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .map((item, index) => {
      if (typeof item === "string") {
        return item;
      }

      if (item && typeof item === "object" && "text" in item) {
        let element: React.ReactNode = item.text;

        if (item.styles.bold) {
          element = <b>{element}</b>;
        }
        if (item.styles.italic) {
          element = <i>{element}</i>;
        }
        if (item.styles.underline) {
          element = <u>{element}</u>;
        }
        if (item.styles.strikethrough) {
          element = <s>{element}</s>;
        }

        return <span key={index}>{element}</span>;
      }

      return null;
    })
    .filter(Boolean) as (string | JSX.Element)[];
};

// --- Main component to render a single block ---
const renderBlock = (block: GroupedBlock, index: number): React.ReactNode => {
  if (!block) return null;
  const blockAsBlock = block as Block;

  switch (block.type) {
    case "heading": {
      const level = blockAsBlock.props.level || "2";
      const content = renderInlineContent(
        blockAsBlock.content as InlineContent[]
      );

      if (level === "1") {
        return (
          <h1
            key={index}
            style={{ fontSize: "48px", color: "#2c3e50", marginBottom: "16px" }}
          >
            {content}
          </h1>
        );
      }
      if (level === "3") {
        return (
          <h3
            key={index}
            style={{ fontSize: "28px", color: "#34495e", marginBottom: "12px" }}
          >
            {content}
          </h3>
        );
      }
      return (
        <h2
          key={index}
          style={{ fontSize: "30px", color: "#34495e", marginBottom: "14px" }}
        >
          {content}
        </h2>
      );
    }
    case "paragraph":
      return (
        <p
          key={index}
          style={{
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#2c3e50",
            margin: "0 0 16px",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </p>
      );
    case "image":
      return (
        <div
          key={index}
          style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
        >
          <img
            src={blockAsBlock.props.url}
            alt="Journal Image"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
            }}
          />
        </div>
      );
    case "bulletList":
      return (
        <div key={index} style={{ display: 'flex', flexDirection: 'column', margin: '0 0 16px 20px', padding: 0 }}>
            {(block as { items: Block[] }).items.map((item, itemIndex) => renderBlock(item, itemIndex))}
        </div>
      );
    case "numberedList":
        return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', margin: '0 0 16px 20px', padding: 0 }}>
                {(block as { items: Block[] }).items.map((item, itemIndex) => renderBlock(item, itemIndex))}
            </div>
        );
    case "bulletListItem":
      return (
        <div
          key={index}
          style={{
            display: 'flex',
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#34495e",
            marginBottom: "8px",
          }}
        >
          <span style={{ marginRight: '10px' }}>•</span>
          <div>{renderInlineContent(blockAsBlock.content as InlineContent[])}</div>
        </div>
      );
    case "numberedListItem":
      return (
        <div
          key={index}
          style={{
            display: 'flex',
            fontSize: "20px",
            lineHeight: 1.6,
            color: "#34495e",
            marginBottom: "8px",
          }}
        >
          <span style={{ marginRight: '10px' }}>{index + 1}.</span>
          <div>{renderInlineContent(blockAsBlock.content as InlineContent[])}</div>
        </div>
      );
    case "todo":
      return (
        <div
          key={index}
          style={{ display: "flex", alignItems: "center", margin: "8px 0" }}
        >
          <span style={{ fontSize: "24px", marginRight: "12px" }}>
            {blockAsBlock.props.checked === "true" ? "✅" : "🔲"}
          </span>
          <span
            style={{
              fontSize: "22px",
              color: blockAsBlock.props.checked === "true" ? "#7f8c8d" : "#2c3e50",
              textDecoration:
                blockAsBlock.props.checked === "true" ? "line-through" : "none",
            }}
          >
            {renderInlineContent(blockAsBlock.content as InlineContent[])}
          </span>
        </div>
      );
    case "alert": {
      const alertStyles = {
        warning: {
          backgroundColor: "rgba(243, 156, 18, 0.1)",
          borderColor: "#f39c12",
        },
        error: {
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          borderColor: "#e74c3c",
        },
        info: {
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          borderColor: "#3498db",
        },
        success: {
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          borderColor: "#2ecc71",
        },
      };
      const style = alertStyles[blockAsBlock.props.type || "info"];
      return (
        <div
          key={index}
          style={{
            padding: "20px",
            margin: "16px 0",
            borderRadius: "8px",
            borderLeft: `5px solid ${style.borderColor}`,
            backgroundColor: style.backgroundColor,
            color: "#2c3e50",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </div>
      );
    }
    case "table": {
      const tableContent = blockAsBlock.content as {
        type: "tableContent";
        rows: Block[];
      };
      return (
        <div
          key={index}
          style={{
            display: "flex",
            flexDirection: 'column',
            width: "100%",
            borderCollapse: "collapse",
            margin: "16px 0",
            border: "1px solid #bdc3c7",
            borderRadius: '4px'
          }}
        >
          {tableContent.rows.map((row, rowIndex) =>
            renderBlock(row, rowIndex)
          )}
        </div>
      );
    }
    case "tableRow":
      return (
        <div key={index} style={{ display: "flex", flexDirection: "row", borderBottom: '1px solid #bdc3c7' }}>
          {blockAsBlock.children.map((cell, cellIndex) =>
            renderBlock(cell, cellIndex)
          )}
        </div>
      );
    case "tableCell":
      return (
        <div
          key={index}
          style={{
            display: "flex",
            flex: 1,
            borderRight: '1px solid #bdc3c7',
            padding: "12px",
            verticalAlign: "top",
          }}
        >
          <div style={{ display: 'flex' }}>{renderInlineContent(blockAsBlock.content as InlineContent[])}</div>
        </div>
      );
    case "quote":
      return (
        <blockquote
          key={index}
          style={{
            margin: "16px 0",
            padding: "10px 20px",
            borderLeft: "4px solid #3498db",
            backgroundColor: "rgba(52, 152, 219, 0.05)",
            color: "#2c3e50",
            fontStyle: "italic",
          }}
        >
          {renderInlineContent(blockAsBlock.content as InlineContent[])}
        </blockquote>
      );
    default: {
      // Fallback for unknown block types
      const contentText =
        blockAsBlock.content && Array.isArray(blockAsBlock.content)
          ? (blockAsBlock.content as InlineContent[])
              .map((c) => (c as { text?: string }).text || "")
              .join("")
          : "";
      if (contentText.trim()) {
        return (
          <p key={index} style={{ margin: "12px 0", whiteSpace: "pre-wrap" }}>
            {`Unsupported Block: ${contentText}`}
          </p>
        );
      }
      return null;
    }
  }
};

interface JournalPreviewProps {
  entry: JournalEntry;
  tags: SupabaseTag[];
  remainingBlocks: Block[];
}

const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || !hex.startsWith('#') || hex.length !== 7) {
        return `rgba(108, 117, 125, ${alpha})`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const JournalPreview: React.FC<JournalPreviewProps> = ({ entry, tags, remainingBlocks }) => {
  const title = entry.title || "Untitled Journal";
  
  const renderContent = (content: Block[]) => {
    const CONTENT_LIMIT = 3;
    const truncatedContent = content.slice(0, CONTENT_LIMIT);
    const wasTruncated = content.length > CONTENT_LIMIT;
    
    const groupBlocks = (blocks: Block[]): GroupedBlock[] => {
      const grouped: GroupedBlock[] = [];
      let currentList: { type: 'bulletList' | 'numberedList'; items: Block[] } | null = null;
    
      for (const block of blocks) {
        if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
          const listType = block.type === 'bulletListItem' ? 'bulletList' : 'numberedList';
          if (currentList && currentList.type === listType) {
            currentList.items.push(block);
          } else {
            if (currentList) {
              grouped.push(currentList);
            }
            currentList = { type: listType, items: [block] };
          }
        } else {
          if (currentList) {
            grouped.push(currentList);
            currentList = null;
          }
          grouped.push(block);
        }
      }
    
      if (currentList) {
        grouped.push(currentList);
      }
    
      return grouped;
    };

    const groupedContent = groupBlocks(truncatedContent);

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {groupedContent.map((block, index) => renderBlock(block, index))}
        {wasTruncated && (
            <p style={{
                fontSize: "20px",
                color: "#adb5bd",
                marginTop: '16px'
            }}>...</p>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: 'column',
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
        padding: '40px',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
        <h1 style={{ fontSize: "42px", fontWeight: 700, color: "#212529", margin: "0 0 16px", lineHeight: 1.2 }}>
          {title}
        </h1>
        <div style={{ fontSize: "22px", color: "#495057", marginBottom: "24px" }}>
          {new Date(entry.entry_timestamp || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {renderContent(remainingBlocks)}
        </div>
        
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
            {tags.map((tag) => (
              <span
                key={tag.id}
                style={{
                  backgroundColor: hexToRgba(tag.color_hex || "#6c757d", 0.15),
                  color: tag.color_hex || "#495057",
                  padding: "6px 14px",
                  borderRadius: "16px",
                  fontSize: "18px",
                  fontWeight: 500,
                  border: `1px solid ${hexToRgba(tag.color_hex || "#6c757d", 0.3)}`,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', flexGrow: 1 }}>
        <p
          style={{
            marginTop: "20px",
            fontSize: "18px",
            color: "#adb5bd",
          }}
        >
          Powered by Bean Journal
        </p>
      </div>
    </div>
  );
};

export default JournalPreview; 