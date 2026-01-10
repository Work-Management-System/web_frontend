"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  AddPhotoAlternate,
  Attachment,
  FormatListBulleted,
  FormatListNumbered,
  Code,
  FormatQuote,
  Title,
  HorizontalRule,
  Link as LinkIcon,
  LinkOff,
  TableChart,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  CheckBox,
  StrikethroughS,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Close,
  OpenInNew,
  CloudUpload,
  FormatColorText,
  FormatColorFill,
  ContentCopy,
  Check,
  Delete,
  Undo,
  Redo,
  TextFields,
  FontDownload,
  ArrowDropDown,
  Notes,
  ShortText,
  Subject,
} from "@mui/icons-material";
import Color from "@tiptap/extension-color";
import Dropcursor from "@tiptap/extension-dropcursor";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Blockquote from "@tiptap/extension-blockquote";
import Image from "@tiptap/extension-image";
import HorizontalRuleExtension from "@tiptap/extension-horizontal-rule";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Strike from "@tiptap/extension-strike";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  EditorContent,
  useEditor,
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { uploadFile } from "@/utils/UploadFile";
import toast from "react-hot-toast";
import { common, createLowlight } from "lowlight";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Language options for code blocks
const CODE_LANGUAGES = [
  { value: "", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash/Shell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "HTML/XML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "markdown", label: "Markdown" },
];

// Font Size Options
const FONT_SIZES = [
  { value: "10px", label: "10" },
  { value: "11px", label: "11" },
  { value: "12px", label: "12" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
  { value: "24px", label: "24" },
  { value: "28px", label: "28" },
  { value: "32px", label: "32" },
  { value: "36px", label: "36" },
  { value: "48px", label: "48" },
  { value: "64px", label: "64" },
  { value: "72px", label: "72" },
];

// Font Family Options
const FONT_FAMILIES = [
  { value: "", label: "Default" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "Trebuchet MS, sans-serif", label: "Trebuchet MS" },
  { value: "Palatino Linotype, serif", label: "Palatino" },
  { value: "Lucida Console, monospace", label: "Lucida Console" },
  { value: "Comic Sans MS, cursive", label: "Comic Sans" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "Garamond, serif", label: "Garamond" },
  { value: "Tahoma, sans-serif", label: "Tahoma" },
  { value: "Century Gothic, sans-serif", label: "Century Gothic" },
];

// List Style Options for Bullet Lists
const BULLET_LIST_STYLES = [
  { value: "disc", label: "● Disc", icon: "●" },
  { value: "circle", label: "○ Circle", icon: "○" },
  { value: "square", label: "■ Square", icon: "■" },
  { value: "disclosure-closed", label: "▶ Arrow", icon: "▶" },
  { value: "disclosure-open", label: "▼ Arrow Down", icon: "▼" },
];

// List Style Options for Ordered Lists
const ORDERED_LIST_STYLES = [
  { value: "decimal", label: "1. 2. 3.", desc: "Numbers" },
  {
    value: "decimal-leading-zero",
    label: "01. 02. 03.",
    desc: "Padded Numbers",
  },
  { value: "lower-alpha", label: "a. b. c.", desc: "Lowercase Letters" },
  { value: "upper-alpha", label: "A. B. C.", desc: "Uppercase Letters" },
  { value: "lower-roman", label: "i. ii. iii.", desc: "Lowercase Roman" },
  { value: "upper-roman", label: "I. II. III.", desc: "Uppercase Roman" },
];

// Custom TextStyle extension with FontSize and FontFamily support
const CustomTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || null,
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: ${attributes.fontFamily}`,
          };
        },
      },
    };
  },
});

// Helper functions for font operations (used directly in toolbar)
const setFontSize = (editor: any, size: string) => {
  editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
};

const unsetFontSize = (editor: any) => {
  editor.chain().focus().setMark("textStyle", { fontSize: null }).run();
};

const setFontFamily = (editor: any, family: string) => {
  editor.chain().focus().setMark("textStyle", { fontFamily: family }).run();
};

const unsetFontFamily = (editor: any) => {
  editor.chain().focus().setMark("textStyle", { fontFamily: null }).run();
};

// Custom BulletList with listStyleType attribute
const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: "disc",
        parseHTML: (element) => element.style.listStyleType || "disc",
        renderHTML: (attributes) => {
          return {
            style: `list-style-type: ${attributes.listStyleType || "disc"}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setBulletListStyle:
        (style: string) =>
        ({ commands, editor }: any) => {
          // First ensure we're in a bullet list
          if (!editor.isActive("bulletList")) {
            commands.toggleBulletList();
          }
          // Update the list style
          return commands.updateAttributes("bulletList", { listStyleType: style });
        },
    };
  },
});

// Custom OrderedList with listStyleType attribute
const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: "decimal",
        parseHTML: (element) => element.style.listStyleType || "decimal",
        renderHTML: (attributes) => {
          return {
            style: `list-style-type: ${attributes.listStyleType || "decimal"}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setOrderedListStyle:
        (style: string) =>
        ({ commands, editor }: any) => {
          // First ensure we're in an ordered list
          if (!editor.isActive("orderedList")) {
            commands.toggleOrderedList();
          }
          // Update the list style
          return commands.updateAttributes("orderedList", { listStyleType: style });
        },
    };
  },
});

// Helper functions for list style operations
const setBulletListStyle = (editor: any, style: string) => {
  if (!editor.isActive("bulletList")) {
    editor.chain().focus().toggleBulletList().run();
  }
  editor.chain().focus().updateAttributes("bulletList", { listStyleType: style }).run();
};

const setOrderedListStyle = (editor: any, style: string) => {
  if (!editor.isActive("orderedList")) {
    editor.chain().focus().toggleOrderedList().run();
  }
  editor.chain().focus().updateAttributes("orderedList", { listStyleType: style }).run();
};

// Custom Code Block Component with header
const CodeBlockComponent = ({ node, updateAttributes }: any) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || "";

  const copyToClipboard = () => {
    const code = node.textContent;
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <NodeViewWrapper
      style={{
        position: "relative",
        margin: "12px 0",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#1e1e1e",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#2d2d2d",
          borderBottom: "1px solid #3d3d3d",
        }}
        contentEditable={false}
      >
        <select
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          style={{
            background: "#3d3d3d",
            color: "#d4d4d4",
            border: "1px solid #4d4d4d",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {CODE_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={copyToClipboard}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            background: copied ? "#4caf50" : "transparent",
            border: `1px solid ${copied ? "#4caf50" : "#4d4d4d"}`,
            borderRadius: "4px",
            color: copied ? "#fff" : "#9e9e9e",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {copied ? (
            <>
              <Check style={{ fontSize: 14 }} />
              Copied!
            </>
          ) : (
            <>
              <ContentCopy style={{ fontSize: 14 }} />
              Copy
            </>
          )}
        </button>
      </div>
      {/* Code Content */}
      <pre
        style={{
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: "16px",
          margin: 0,
          overflow: "auto",
          fontFamily:
            "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
          fontSize: "14px",
          lineHeight: "1.6",
          tabSize: 4,
        }}
      >
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

// Extended CodeBlockLowlight with custom view
const CustomCodeBlockLowlight = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
});

export interface EditorSettings {
  pageWidth: "full" | "wide" | "medium" | "narrow";
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  showRulers: boolean;
}

// Ruler component
const HorizontalRuler: React.FC<{
  width: number;
  marginLeft: number;
  marginRight: number;
  onMarginChange?: (side: "left" | "right", value: number) => void;
}> = ({ width, marginLeft, marginRight, onMarginChange }) => {
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<"left" | "right" | null>(null);

  const handleMouseDown = (side: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(side);
  };

  React.useEffect(() => {
    if (!dragging || !onMarginChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const rulerWidth = rect.width;
      
      if (dragging === "left") {
        // Left margin: distance from left edge
        const newMargin = Math.max(0, Math.min(150, Math.round(x / 10) * 10));
        onMarginChange("left", newMargin);
      } else {
        // Right margin: distance from right edge (use actual ruler width)
        const distanceFromRight = rulerWidth - x;
        const newMargin = Math.max(0, Math.min(150, Math.round(distanceFromRight / 10) * 10));
        onMarginChange("right", newMargin);
      }
    };

    const handleMouseUp = () => setDragging(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onMarginChange]);

  // Generate tick marks - extend to at least 2000px or actual width
  const ticks = [];
  const maxWidth = Math.max(width, 2000);
  for (let i = 0; i <= maxWidth; i += 50) {
    const isMajor = i % 100 === 0;
    ticks.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: i,
          top: isMajor ? 12 : 16,
          width: 1,
          height: isMajor ? 8 : 4,
          background: "#9e9e9e",
        }}
      />,
      isMajor && (
        <span
          key={`label-${i}`}
          style={{
            position: "absolute",
            left: i - 8,
            top: 2,
            fontSize: 9,
            color: "#757575",
            fontFamily: "monospace",
          }}
        >
          {i / 100}
        </span>
      )
    );
  }

  return (
    <div
      ref={rulerRef}
      style={{
        position: "relative",
        height: 24,
        background: "#f5f5f5",
        borderBottom: "1px solid #e0e0e0",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Margin indicators */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: marginLeft,
          height: "100%",
          background: "#e3e3e3",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: marginRight,
          height: "100%",
          background: "#e3e3e3",
        }}
      />

      {/* Tick marks */}
      {ticks}

      {/* Draggable margin handles */}
      {onMarginChange && (
        <>
          <div
            onMouseDown={handleMouseDown("left")}
            style={{
              position: "absolute",
              left: marginLeft - 4,
              top: 4,
              width: 8,
              height: 16,
              background: dragging === "left" ? "#1976d2" : "#757575",
              borderRadius: 2,
              cursor: "ew-resize",
              zIndex: 10,
            }}
          />
          <div
            onMouseDown={handleMouseDown("right")}
            style={{
              position: "absolute",
              right: marginRight - 4,
              top: 4,
              width: 8,
              height: 16,
              background: dragging === "right" ? "#1976d2" : "#757575",
              borderRadius: 2,
              cursor: "ew-resize",
              zIndex: 10,
            }}
          />
        </>
      )}
    </div>
  );
};

const VerticalRuler: React.FC<{
  height: number;
  marginTop: number;
  marginBottom: number;
  onMarginChange?: (side: "top" | "bottom", value: number) => void;
}> = ({ height, marginTop, marginBottom, onMarginChange }) => {
  const rulerRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState<"top" | "bottom" | null>(null);

  const handleMouseDown = (side: "top" | "bottom") => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(side);
  };

  React.useEffect(() => {
    if (!dragging || !onMarginChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const rulerHeight = rect.height;
      
      if (dragging === "top") {
        // Top margin: distance from top edge
        const newMargin = Math.max(0, Math.min(150, Math.round(y / 10) * 10));
        onMarginChange("top", newMargin);
      } else {
        // Bottom margin: distance from bottom edge (use actual ruler height)
        const distanceFromBottom = rulerHeight - y;
        const newMargin = Math.max(0, Math.min(150, Math.round(distanceFromBottom / 10) * 10));
        onMarginChange("bottom", newMargin);
      }
    };

    const handleMouseUp = () => setDragging(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onMarginChange]);

  // Generate tick marks - extend to at least 3000px or actual height
  const ticks = [];
  const maxHeight = Math.max(height, 3000);
  for (let i = 0; i <= maxHeight; i += 50) {
    const isMajor = i % 100 === 0;
    ticks.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: i,
          right: isMajor ? 12 : 16,
          width: isMajor ? 8 : 4,
          height: 1,
          background: "#9e9e9e",
        }}
      />,
      isMajor && (
        <span
          key={`label-${i}`}
          style={{
            position: "absolute",
            top: i - 5,
            right: 2,
            fontSize: 9,
            color: "#757575",
            fontFamily: "monospace",
            writingMode: "vertical-lr",
            transform: "rotate(180deg)",
          }}
        >
          {i / 100}
        </span>
      )
    );
  }

  return (
    <div
      ref={rulerRef}
      style={{
        position: "relative",
        width: 24,
        height: height,
        background: "#f5f5f5",
        borderRight: "1px solid #e0e0e0",
        overflow: "hidden",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Margin indicators */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: marginTop,
          background: "#e3e3e3",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: marginBottom,
          background: "#e3e3e3",
        }}
      />

      {/* Tick marks */}
      {ticks}

      {/* Draggable margin handles */}
      {onMarginChange && (
        <>
          <div
            onMouseDown={handleMouseDown("top")}
            style={{
              position: "absolute",
              top: marginTop - 4,
              left: 4,
              width: 16,
              height: 8,
              background: dragging === "top" ? "#1976d2" : "#757575",
              borderRadius: 2,
              cursor: "ns-resize",
              zIndex: 10,
            }}
          />
          <div
            onMouseDown={handleMouseDown("bottom")}
            style={{
              position: "absolute",
              bottom: marginBottom - 4,
              left: 4,
              width: 16,
              height: 8,
              background: dragging === "bottom" ? "#1976d2" : "#757575",
              borderRadius: 2,
              cursor: "ns-resize",
              zIndex: 10,
            }}
          />
        </>
      )}
    </div>
  );
};

const widthMap = {
  full: "100%",
  wide: "1200px",
  medium: "900px",
  narrow: "680px",
};

interface SlashCommand {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: any) => void;
  keywords: string[];
}

export interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  cursor?: { from: number; to: number };
  selection?: { from: number; to: number };
}

interface DocumentEditorProps {
  initialContent?: any;
  remoteContent?: any; // Content updates from other users
  collaboratorCursors?: CollaboratorCursor[]; // Other users' cursors
  readOnly?: boolean;
  onContentChange?: (content: any) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  onStatusChange?: (status: "viewing" | "editing" | "commenting") => void;
  settings?: EditorSettings;
  onSettingsChange?: (settings: EditorSettings) => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialContent,
  remoteContent,
  collaboratorCursors = [],
  readOnly = false,
  onContentChange,
  onSelectionChange,
  onStatusChange,
  settings = { 
    pageWidth: "full", 
    marginLeft: 40, 
    marginRight: 40, 
    marginTop: 20, 
    marginBottom: 20,
    showRulers: true,
  },
  onSettingsChange,
}) => {
  const isApplyingRemoteRef = useRef(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState("");

  // Modal states
  const [showStylesMenu, setShowStylesMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showFontFamilyMenu, setShowFontFamilyMenu] = useState(false);
  const [showBulletStyleMenu, setShowBulletStyleMenu] = useState(false);
  const [showOrderedStyleMenu, setShowOrderedStyleMenu] = useState(false);
  const [currentBulletStyle, setCurrentBulletStyle] = useState("disc");
  const [currentOrderedStyle, setCurrentOrderedStyle] = useState("decimal");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkModalTab, setLinkModalTab] = useState(0);
  const [imageModalTab, setImageModalTab] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  // Color options - expanded palette
  const textColors = [
    // Grayscale
    { color: "#000000", label: "Black" },
    { color: "#333333", label: "Dark Gray" },
    { color: "#666666", label: "Gray" },
    { color: "#999999", label: "Light Gray" },
    { color: "#cccccc", label: "Lighter Gray" },
    // Reds
    { color: "#b71c1c", label: "Dark Red" },
    { color: "#e53935", label: "Red" },
    { color: "#ef5350", label: "Light Red" },
    { color: "#ff8a80", label: "Pale Red" },
    { color: "#ffcdd2", label: "Pink Red" },
    // Pinks
    { color: "#880e4f", label: "Dark Pink" },
    { color: "#d81b60", label: "Pink" },
    { color: "#ec407a", label: "Light Pink" },
    { color: "#ff80ab", label: "Hot Pink" },
    { color: "#f8bbd9", label: "Pale Pink" },
    // Purples
    { color: "#4a148c", label: "Dark Purple" },
    { color: "#8e24aa", label: "Purple" },
    { color: "#ab47bc", label: "Light Purple" },
    { color: "#ce93d8", label: "Lavender" },
    { color: "#e1bee7", label: "Pale Purple" },
    // Blues
    { color: "#0d47a1", label: "Dark Blue" },
    { color: "#1e88e5", label: "Blue" },
    { color: "#42a5f5", label: "Light Blue" },
    { color: "#64b5f6", label: "Sky Blue" },
    { color: "#bbdefb", label: "Pale Blue" },
    // Cyans
    { color: "#006064", label: "Dark Cyan" },
    { color: "#00acc1", label: "Cyan" },
    { color: "#26c6da", label: "Light Cyan" },
    { color: "#4dd0e1", label: "Aqua" },
    { color: "#b2ebf2", label: "Pale Cyan" },
    // Greens
    { color: "#1b5e20", label: "Dark Green" },
    { color: "#43a047", label: "Green" },
    { color: "#66bb6a", label: "Light Green" },
    { color: "#81c784", label: "Mint" },
    { color: "#c8e6c9", label: "Pale Green" },
    // Yellows & Oranges
    { color: "#f57f17", label: "Dark Yellow" },
    { color: "#fdd835", label: "Yellow" },
    { color: "#ffee58", label: "Light Yellow" },
    { color: "#fb8c00", label: "Orange" },
    { color: "#ff9800", label: "Light Orange" },
    // Browns
    { color: "#3e2723", label: "Dark Brown" },
    { color: "#5d4037", label: "Brown" },
    { color: "#795548", label: "Light Brown" },
    { color: "#a1887f", label: "Tan" },
    { color: "#d7ccc8", label: "Beige" },
  ];

  const highlightColors = [
    // Yellows
    { color: "#ffff00", label: "Yellow" },
    { color: "#ffeb3b", label: "Light Yellow" },
    { color: "#fff59d", label: "Pale Yellow" },
    { color: "#fffde7", label: "Cream" },
    // Greens
    { color: "#00ff00", label: "Lime" },
    { color: "#76ff03", label: "Light Lime" },
    { color: "#b2ff59", label: "Pale Lime" },
    { color: "#ccff90", label: "Mint Green" },
    { color: "#69f0ae", label: "Aqua Green" },
    { color: "#a5d6a7", label: "Pale Green" },
    // Blues & Cyans
    { color: "#00ffff", label: "Cyan" },
    { color: "#84ffff", label: "Light Cyan" },
    { color: "#b2ebf2", label: "Pale Cyan" },
    { color: "#80d8ff", label: "Sky Blue" },
    { color: "#82b1ff", label: "Light Blue" },
    { color: "#b3e5fc", label: "Pale Blue" },
    // Pinks & Magentas
    { color: "#ff00ff", label: "Magenta" },
    { color: "#ff80ab", label: "Hot Pink" },
    { color: "#f48fb1", label: "Pink" },
    { color: "#f8bbd9", label: "Light Pink" },
    { color: "#fce4ec", label: "Pale Pink" },
    // Purples
    { color: "#e040fb", label: "Bright Purple" },
    { color: "#ea80fc", label: "Light Purple" },
    { color: "#ce93d8", label: "Lavender" },
    { color: "#e1bee7", label: "Pale Purple" },
    // Oranges & Reds
    { color: "#ff6e40", label: "Coral" },
    { color: "#ffab91", label: "Light Coral" },
    { color: "#ffa726", label: "Orange" },
    { color: "#ffcc80", label: "Light Orange" },
    { color: "#ff8a80", label: "Salmon" },
    { color: "#ffcdd2", label: "Pale Red" },
  ];

  const slashMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const textColorMenuRef = useRef<HTMLDivElement>(null);
  const highlightMenuRef = useRef<HTMLDivElement>(null);
  const stylesMenuRef = useRef<HTMLDivElement>(null);
  const fontSizeMenuRef = useRef<HTMLDivElement>(null);
  const fontFamilyMenuRef = useRef<HTMLDivElement>(null);
  const bulletStyleMenuRef = useRef<HTMLDivElement>(null);
  const orderedStyleMenuRef = useRef<HTMLDivElement>(null);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Content area dimensions for rulers
  const [contentWidth, setContentWidth] = useState(800);
  const [contentHeight, setContentHeight] = useState(600);

  // State for rendered cursor positions
  const [renderedCursors, setRenderedCursors] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
      top: number;
      left: number;
      height: number;
      selectionRects?: Array<{
        top: number;
        left: number;
        width: number;
        height: number;
      }>;
    }>
  >([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        heading: false,
      }),
      CustomTextStyle,
      Underline,
      Dropcursor,
      Strike,
      Placeholder.configure({
        placeholder: "Type '/' for commands, or start typing...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:float-left before:text-[#adb5bd] before:h-0 before:pointer-events-none",
      }),
      Color.configure({ types: ["textStyle"] }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: "tiptap-heading",
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
          title: "Ctrl+Click to open link",
        },
      }),
      CustomCodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "tiptap-task-list",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "tiptap-task-item",
        },
      }),
      Highlight.configure({ multicolor: true }),
      Blockquote.configure({
        HTMLAttributes: {
          class: "border-l-4 border-gray-300 pl-4 italic my-2",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "max-w-full rounded",
        },
      }),
      HorizontalRuleExtension,
      CustomBulletList.configure({
        HTMLAttributes: {
          class: "pl-6 my-2",
        },
      }),
      CustomOrderedList.configure({
        HTMLAttributes: {
          class: "pl-6 my-2",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-gray-300 my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 px-4 py-2 bg-gray-100 font-bold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 px-4 py-2",
        },
      }),
    ],
    content: initialContent || "<p></p>",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Skip if we're applying a remote update
      if (isApplyingRemoteRef.current) return;

      const json = editor.getJSON();
      onContentChange?.(json);

      // Handle slash command detection
      const { selection } = editor.state;
      const { $from } = selection;
      const currentLine = editor.state.doc.textBetween(
        Math.max(0, $from.pos - 50),
        $from.pos,
        ""
      );
      const lastSlashIndex = currentLine.lastIndexOf("/");

      if (lastSlashIndex !== -1) {
        const textAfterSlash = currentLine.slice(lastSlashIndex + 1);
        if (!textAfterSlash.includes(" ") && !textAfterSlash.includes("\n")) {
          const query = textAfterSlash.toLowerCase();
          setSlashQuery(query);

          const coords = editor.view.coordsAtPos($from.pos);
          const containerRect =
            editorContainerRef.current?.getBoundingClientRect();

          if (containerRect) {
            setSlashMenuPosition({
              top: coords.top - containerRect.top + 24,
              left: coords.left - containerRect.left,
            });
          } else {
            setSlashMenuPosition({
              top: coords.top + 20,
              left: coords.left,
            });
          }
          setShowSlashMenu(true);
          setSelectedSlashIndex(0);
          return;
        }
      }
      setShowSlashMenu(false);
    },
    onFocus: () => {
      onStatusChange?.("editing");
    },
    onBlur: () => {
      onStatusChange?.("viewing");
    },
    onSelectionUpdate: ({ editor }) => {
      if (isApplyingRemoteRef.current) return;
      const { from, to } = editor.state.selection;
      onSelectionChange?.({ from, to });
    },
  });

  const slashCommands: SlashCommand[] = [
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: <Title />,
      keywords: ["h1", "heading", "title", "large"],
      command: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: <Title />,
      keywords: ["h2", "heading", "subtitle", "medium"],
      command: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: <Title />,
      keywords: ["h3", "heading", "small"],
      command: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Bullet List",
      description: "Create a bulleted list",
      icon: <FormatListBulleted />,
      keywords: ["bullet", "list", "ul", "unordered"],
      command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Create a numbered list",
      icon: <FormatListNumbered />,
      keywords: ["numbered", "ordered", "ol", "list", "number"],
      command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Task List",
      description: "Create a task list with checkboxes",
      icon: <CheckBox />,
      keywords: ["task", "todo", "checkbox", "checklist"],
      command: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Code Block",
      description: "Display code with syntax highlighting",
      icon: <Code />,
      keywords: ["code", "snippet", "programming"],
      command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Quote",
      description: "Create a blockquote",
      icon: <FormatQuote />,
      keywords: ["quote", "blockquote", "citation"],
      command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Divider",
      description: "Insert a horizontal divider",
      icon: <HorizontalRule />,
      keywords: ["divider", "hr", "horizontal", "line", "rule"],
      command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: "Table",
      description: "Insert a table",
      icon: <TableChart />,
      keywords: ["table", "grid", "spreadsheet"],
      command: (editor) => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      title: "Image",
      description: "Upload or insert an image",
      icon: <AddPhotoAlternate />,
      keywords: ["image", "picture", "photo", "img"],
      command: () => {
        setImageUrl("");
        setImagePreview("");
        setImageModalTab(0);
        setShowImageModal(true);
      },
    },
    {
      title: "Link",
      description: "Insert a link",
      icon: <LinkIcon />,
      keywords: ["link", "url", "hyperlink"],
      command: () => {
        setLinkUrl("");
        setLinkText("");
        setLinkModalTab(0);
        setShowLinkModal(true);
      },
    },
    {
      title: "Highlight",
      description: "Highlight selected text",
      icon: <FormatColorFill />,
      keywords: ["highlight", "mark", "background"],
      command: (editor) =>
        editor.chain().focus().toggleHighlight({ color: "#ffff00" }).run(),
    },
    {
      title: "Text Color",
      description: "Change text color",
      icon: <FormatColorText />,
      keywords: ["color", "text", "font"],
      command: () => {
        setShowTextColorMenu(true);
      },
    },
    {
      title: "Font Size - Small",
      description: "Set font size to 12px",
      icon: <TextFields />,
      keywords: ["font", "size", "small", "text"],
      command: (editor) => setFontSize(editor, "12px"),
    },
    {
      title: "Font Size - Normal",
      description: "Set font size to 16px",
      icon: <TextFields />,
      keywords: ["font", "size", "normal", "default", "text"],
      command: (editor) => setFontSize(editor, "16px"),
    },
    {
      title: "Font Size - Large",
      description: "Set font size to 24px",
      icon: <TextFields />,
      keywords: ["font", "size", "large", "big", "text"],
      command: (editor) => setFontSize(editor, "24px"),
    },
    {
      title: "Font Size - Huge",
      description: "Set font size to 36px",
      icon: <TextFields />,
      keywords: ["font", "size", "huge", "extra", "text"],
      command: (editor) => setFontSize(editor, "36px"),
    },
    {
      title: "Font - Arial",
      description: "Change font to Arial",
      icon: <FontDownload />,
      keywords: ["font", "family", "arial", "sans"],
      command: (editor) => setFontFamily(editor, "Arial, sans-serif"),
    },
    {
      title: "Font - Times New Roman",
      description: "Change font to Times New Roman",
      icon: <FontDownload />,
      keywords: ["font", "family", "times", "serif"],
      command: (editor) => setFontFamily(editor, "Times New Roman, serif"),
    },
    {
      title: "Font - Georgia",
      description: "Change font to Georgia",
      icon: <FontDownload />,
      keywords: ["font", "family", "georgia", "serif"],
      command: (editor) => setFontFamily(editor, "Georgia, serif"),
    },
    {
      title: "Font - Courier New",
      description: "Change font to Courier New (monospace)",
      icon: <FontDownload />,
      keywords: ["font", "family", "courier", "mono", "code"],
      command: (editor) => setFontFamily(editor, "Courier New, monospace"),
    },
    {
      title: "List - Circle Bullets",
      description: "Create bullet list with circle markers",
      icon: <FormatListBulleted />,
      keywords: ["list", "bullet", "circle", "hollow"],
      command: (editor) => setBulletListStyle(editor, "circle"),
    },
    {
      title: "List - Square Bullets",
      description: "Create bullet list with square markers",
      icon: <FormatListBulleted />,
      keywords: ["list", "bullet", "square"],
      command: (editor) => setBulletListStyle(editor, "square"),
    },
    {
      title: "List - Alphabetic",
      description: "Create ordered list with letters (a, b, c)",
      icon: <FormatListNumbered />,
      keywords: ["list", "ordered", "alpha", "letter", "abc"],
      command: (editor) => setOrderedListStyle(editor, "lower-alpha"),
    },
    {
      title: "List - Roman Numerals",
      description: "Create ordered list with roman numerals (I, II, III)",
      icon: <FormatListNumbered />,
      keywords: ["list", "ordered", "roman", "numeral"],
      command: (editor) => setOrderedListStyle(editor, "upper-roman"),
    },
    {
      title: "List - Uppercase Letters",
      description: "Create ordered list with uppercase letters (A, B, C)",
      icon: <FormatListNumbered />,
      keywords: ["list", "ordered", "upper", "alpha", "letter", "ABC"],
      command: (editor) => setOrderedListStyle(editor, "upper-alpha"),
    },
    {
      title: "List - Padded Numbers",
      description: "Create ordered list with padded numbers (01, 02, 03)",
      icon: <FormatListNumbered />,
      keywords: ["list", "ordered", "padded", "zero", "01"],
      command: (editor) => setOrderedListStyle(editor, "decimal-leading-zero"),
    },
  ];

  const filteredCommands = slashCommands.filter(
    (cmd) =>
      cmd.keywords.some((kw) => kw.includes(slashQuery)) ||
      cmd.title.toLowerCase().includes(slashQuery)
  );

  const handleSlashCommand = useCallback(
    (command: SlashCommand) => {
      if (!editor) return;

      const { selection } = editor.state;
      const { $from } = selection;
      const currentLine = editor.state.doc.textBetween(
        Math.max(0, $from.pos - 50),
        $from.pos,
        ""
      );
      const lastSlashIndex = currentLine.lastIndexOf("/");

      if (lastSlashIndex !== -1) {
        const textAfterSlash = currentLine.slice(lastSlashIndex);
        const deleteLength = textAfterSlash.length;

        editor
          .chain()
          .focus()
          .deleteRange({ from: $from.pos - deleteLength, to: $from.pos })
          .run();
      }

      command.command(editor);
      setShowSlashMenu(false);
      setSlashQuery("");
    },
    [editor]
  );

  // Calculate content area dimensions for rulers
  useEffect(() => {
    const updateDimensions = () => {
      if (contentAreaRef.current) {
        setContentWidth(contentAreaRef.current.offsetWidth);
        setContentHeight(Math.max(600, contentAreaRef.current.offsetHeight));
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Handle slash menu keyboard navigation
  // Use capture phase to intercept events before Tiptap processes them
  useEffect(() => {
    if (!showSlashMenu || filteredCommands.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedSlashIndex((prev) => {
          const next = prev < filteredCommands.length - 1 ? prev + 1 : 0;
          // Scroll the item into view
          setTimeout(() => {
            const item = slashMenuRef.current?.querySelector(
              `[data-index="${next}"]`
            );
            item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }, 0);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedSlashIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredCommands.length - 1;
          // Scroll the item into view
          setTimeout(() => {
            const item = slashMenuRef.current?.querySelector(
              `[data-index="${next}"]`
            );
            item?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }, 0);
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const selectedCommand = filteredCommands[selectedSlashIndex];
        if (selectedCommand) {
          handleSlashCommand(selectedCommand);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setShowSlashMenu(false);
      }
    };

    // Use capture phase to intercept before Tiptap handles the event
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [showSlashMenu, filteredCommands, selectedSlashIndex, handleSlashCommand]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (tableMenuRef.current && !tableMenuRef.current.contains(target)) {
        setShowTableMenu(false);
      }
      if (
        textColorMenuRef.current &&
        !textColorMenuRef.current.contains(target)
      ) {
        setShowTextColorMenu(false);
      }
      if (
        highlightMenuRef.current &&
        !highlightMenuRef.current.contains(target)
      ) {
        setShowHighlightMenu(false);
      }
      if (
        stylesMenuRef.current &&
        !stylesMenuRef.current.contains(target)
      ) {
        setShowStylesMenu(false);
      }
      if (
        fontSizeMenuRef.current &&
        !fontSizeMenuRef.current.contains(target)
      ) {
        setShowFontSizeMenu(false);
      }
      if (
        fontFamilyMenuRef.current &&
        !fontFamilyMenuRef.current.contains(target)
      ) {
        setShowFontFamilyMenu(false);
      }
      if (
        bulletStyleMenuRef.current &&
        !bulletStyleMenuRef.current.contains(target)
      ) {
        setShowBulletStyleMenu(false);
      }
      if (
        orderedStyleMenuRef.current &&
        !orderedStyleMenuRef.current.contains(target)
      ) {
        setShowOrderedStyleMenu(false);
      }
    };

    if (
      showTableMenu ||
      showTextColorMenu ||
      showHighlightMenu ||
      showStylesMenu ||
      showFontSizeMenu ||
      showFontFamilyMenu ||
      showBulletStyleMenu ||
      showOrderedStyleMenu
    ) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    showTableMenu,
    showTextColorMenu,
    showHighlightMenu,
    showStylesMenu,
    showFontSizeMenu,
    showFontFamilyMenu,
    showBulletStyleMenu,
    showOrderedStyleMenu,
  ]);

  // Track if cursor is in table for re-rendering
  const [cursorInTable, setCursorInTable] = useState(false);

  // Helper to check if cursor is in a table
  const checkIfInTable = useCallback(() => {
    if (!editor) return false;

    const { selection } = editor.state;
    const { $from } = selection;

    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (
        node.type.name === "table" ||
        node.type.name === "tableRow" ||
        node.type.name === "tableCell" ||
        node.type.name === "tableHeader"
      ) {
        return true;
      }
    }
    return false;
  }, [editor]);

  // Update cursor position tracking
  useEffect(() => {
    if (!editor) return;

    const updateCursorState = () => {
      const inTable = checkIfInTable();
      setCursorInTable(inTable);
    };

    updateCursorState();

    editor.on("selectionUpdate", updateCursorState);
    editor.on("update", updateCursorState);
    editor.on("focus", updateCursorState);

    return () => {
      editor.off("selectionUpdate", updateCursorState);
      editor.off("update", updateCursorState);
      editor.off("focus", updateCursorState);
    };
  }, [editor, checkIfInTable]);

  // Handle Tab key for code block indentation
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" && editor.isActive("codeBlock")) {
        event.preventDefault();

        if (event.shiftKey) {
          const { $from } = editor.state.selection;
          const textBefore = editor.state.doc.textBetween(
            Math.max(0, $from.pos - 4),
            $from.pos
          );

          const spacesToRemove = textBefore.match(/^\s{1,4}/)?.[0]?.length || 0;
          if (spacesToRemove > 0) {
            editor
              .chain()
              .focus()
              .command(({ tr }) => {
                tr.delete($from.pos - spacesToRemove, $from.pos);
                return true;
              })
              .run();
          }
        } else {
          editor.chain().focus().insertContent("    ").run();
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener("keydown", handleKeyDown);

    return () => {
      editorElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor]);

  // Handle Ctrl+Click on links to open them
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const target = event.target as HTMLElement;
        const link = target.closest("a");

        if (link && link.href) {
          event.preventDefault();
          window.open(link.href, "_blank", "noopener,noreferrer");
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener("click", handleClick);

    return () => {
      editorElement.removeEventListener("click", handleClick);
    };
  }, [editor]);

  // Update content when initialContent changes
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(initialContent);
      if (currentContent !== newContent) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent]);

  // Apply remote content updates from other collaborators
  useEffect(() => {
    if (editor && remoteContent && !editor.isDestroyed) {
      isApplyingRemoteRef.current = true;

      // Save cursor position before update
      const { from, to } = editor.state.selection;

      // Apply the remote content
      editor.commands.setContent(remoteContent, false);

      // Try to restore cursor position
      try {
        const docLength = editor.state.doc.content.size;
        const newFrom = Math.min(from, docLength - 1);
        const newTo = Math.min(to, docLength - 1);
        editor.commands.setTextSelection({ from: newFrom, to: newTo });
      } catch (e) {
        // If cursor restore fails, just move to end
        editor.commands.focus("end");
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 50);
    }
  }, [editor, remoteContent]);

  // Update editable state
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // Calculate screen positions for collaborator cursors
  useEffect(() => {
    if (
      !editor ||
      !editorContainerRef.current ||
      collaboratorCursors.length === 0
    ) {
      setRenderedCursors([]);
      return;
    }

    const calculateCursorPositions = () => {
      // Get the ProseMirror editor DOM element
      const editorDom = editor.view.dom;
      const editorRect = editorDom.getBoundingClientRect();

      // Get the container that holds the editor (for relative positioning)
      const editorWrapper = editorDom.closest(".ProseMirror")?.parentElement;
      const wrapperRect = editorWrapper?.getBoundingClientRect();

      if (!wrapperRect) return;

      const newCursors = collaboratorCursors
        .map((collab) => {
          try {
            // Get the cursor position - prefer selection.from, then cursor.from
            const pos = collab.selection?.from ?? collab.cursor?.from ?? 1;
            const docSize = editor.state.doc.content.size;

            console.log(
              `[Cursor] ${collab.name}: pos=${pos}, docSize=${docSize}, selection=`,
              collab.selection
            );

            // Clamp position to valid range (1 to docSize-1)
            const safePos = Math.min(
              Math.max(1, pos),
              Math.max(1, docSize - 1)
            );

            // Get screen coordinates for this position
            const coords = editor.view.coordsAtPos(safePos);

            // Calculate position relative to the editor wrapper
            const relativeTop = coords.top - wrapperRect.top;
            const relativeLeft = coords.left - wrapperRect.left;

            // Calculate selection rectangles if there's a selection range
            let selectionRects: Array<{
              top: number;
              left: number;
              width: number;
              height: number;
            }> = [];

            if (
              collab.selection &&
              collab.selection.from !== collab.selection.to
            ) {
              const selFrom = Math.min(
                Math.max(
                  1,
                  Math.min(collab.selection.from, collab.selection.to)
                ),
                docSize - 1
              );
              const selTo = Math.min(
                Math.max(
                  1,
                  Math.max(collab.selection.from, collab.selection.to)
                ),
                docSize - 1
              );

              try {
                // Use ProseMirror's textBetween to walk through the selection
                // and get coordinates at regular intervals
                const startCoords = editor.view.coordsAtPos(selFrom);
                const endCoords = editor.view.coordsAtPos(selTo);
                const lineHeight = Math.max(
                  20,
                  startCoords.bottom - startCoords.top
                );
                const editorPadding = 24;
                const editorContentWidth =
                  wrapperRect.width - editorPadding * 2;

                // Single line selection
                if (
                  Math.abs(startCoords.top - endCoords.top) <
                  lineHeight / 2
                ) {
                  selectionRects = [
                    {
                      top: startCoords.top - wrapperRect.top,
                      left: startCoords.left - wrapperRect.left,
                      width: Math.max(4, endCoords.left - startCoords.left),
                      height: lineHeight,
                    },
                  ];
                } else {
                  // Multi-line selection - sample positions to build accurate rectangles
                  const step = Math.max(1, Math.floor((selTo - selFrom) / 50)); // Sample up to 50 points
                  let currentLineTop = -1;
                  let currentLineLeft = wrapperRect.width;
                  let currentLineRight = 0;

                  for (let p = selFrom; p <= selTo; p += step) {
                    try {
                      const safeP = Math.min(p, docSize - 1);
                      const pCoords = editor.view.coordsAtPos(safeP);
                      const pTop = Math.round(pCoords.top - wrapperRect.top);

                      // Check if we're on a new line
                      if (currentLineTop === -1) {
                        currentLineTop = pTop;
                        currentLineLeft = pCoords.left - wrapperRect.left;
                        currentLineRight = pCoords.left - wrapperRect.left;
                      } else if (
                        Math.abs(pTop - currentLineTop) >
                        lineHeight / 2
                      ) {
                        // New line - save the previous line's rect
                        selectionRects.push({
                          top: currentLineTop,
                          left: currentLineLeft,
                          width: Math.max(
                            4,
                            currentLineRight - currentLineLeft + 10
                          ),
                          height: lineHeight,
                        });
                        // Start new line
                        currentLineTop = pTop;
                        currentLineLeft = editorPadding;
                        currentLineRight = pCoords.left - wrapperRect.left;
                      } else {
                        // Same line - extend the right boundary
                        currentLineRight = Math.max(
                          currentLineRight,
                          pCoords.left - wrapperRect.left
                        );
                      }
                    } catch (e) {
                      // Skip invalid positions
                    }
                  }

                  // Add the last line
                  if (currentLineTop !== -1) {
                    // For the last line, use the end position
                    selectionRects.push({
                      top: currentLineTop,
                      left: currentLineLeft,
                      width: Math.max(
                        4,
                        endCoords.left - wrapperRect.left - currentLineLeft + 5
                      ),
                      height: lineHeight,
                    });
                  }

                  // If sampling didn't work well, fall back to a simple full-height rect
                  if (selectionRects.length === 0) {
                    const totalHeight = endCoords.bottom - startCoords.top;
                    selectionRects = [
                      {
                        top: startCoords.top - wrapperRect.top,
                        left: editorPadding,
                        width: editorContentWidth,
                        height: totalHeight,
                      },
                    ];
                  }
                }
              } catch (e) {
                console.error("Error calculating selection rects:", e);
              }
            }

            return {
              id: collab.id,
              name: collab.name,
              color: collab.color,
              top: relativeTop,
              left: relativeLeft,
              height: Math.max(16, coords.bottom - coords.top),
              selectionRects,
            };
          } catch (e) {
            console.error("Error calculating cursor position:", e);
            return null;
          }
        })
        .filter(Boolean) as typeof renderedCursors;

      setRenderedCursors(newCursors);
    };

    // Calculate initially and on editor updates
    calculateCursorPositions();

    const handleUpdate = () => {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(calculateCursorPositions);
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    // Also recalculate on scroll/resize
    const scrollHandler = () => requestAnimationFrame(calculateCursorPositions);
    window.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", scrollHandler);

    // Recalculate periodically to handle any drift
    const intervalId = setInterval(calculateCursorPositions, 500);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
      window.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", scrollHandler);
      clearInterval(intervalId);
    };
  }, [editor, collaboratorCursors]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setImageUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        setShowImageModal(false);
        setImageUrl("");
        setImagePreview("");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // Handle link insertion
  const handleInsertLink = () => {
    if (!editor || !linkUrl) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (selectedText) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      const text = linkText || linkUrl;
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}">${text}</a>`)
        .run();
    }

    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Handle image URL insertion
  const handleInsertImageUrl = () => {
    if (!editor || !imageUrl) return;

    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageModal(false);
    setImageUrl("");
    setImagePreview("");
  };

  // Preview image from URL
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      setImagePreview(url);
    } else {
      setImagePreview("");
    }
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    icon,
    tooltip,
    disabled,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ReactNode;
    tooltip: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      style={{
        padding: "6px 8px",
        border: "1px solid #e2e6ea",
        borderRadius: "4px",
        background: isActive ? "#e3f2fd" : "#fff",
        color: isActive ? "#1976d2" : disabled ? "#bdbdbd" : "#424242",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive && !disabled) {
          e.currentTarget.style.background = "#f5f5f5";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !disabled) {
          e.currentTarget.style.background = "#fff";
        }
      }}
    >
      {icon}
    </button>
  );

  // Get current font size from selection (handles multiple sizes by returning max)
  const getCurrentFontSize = (): number => {
    if (!editor) return 16;
    
    const { from, to } = editor.state.selection;
    let maxSize = 0;
    let hasSize = false;
    
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText && node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type.name === "textStyle" && mark.attrs.fontSize) {
            const size = parseInt(mark.attrs.fontSize.replace("px", ""));
            if (size > maxSize) {
              maxSize = size;
              hasSize = true;
            }
          }
        });
      }
    });
    
    if (!hasSize) {
      // Check if we're in a heading
      if (editor.isActive("heading", { level: 1 })) return 32;
      if (editor.isActive("heading", { level: 2 })) return 24;
      if (editor.isActive("heading", { level: 3 })) return 20;
      if (editor.isActive("heading", { level: 4 })) return 16;
      
      // Get from current attributes
      const fontSize = editor.getAttributes("textStyle").fontSize;
      return fontSize ? parseInt(fontSize.replace("px", "")) : 16;
    }
    
    return maxSize;
  };

  // Handle margin changes from rulers
  const handleHorizontalMarginChange = (side: "left" | "right", value: number) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        [side === "left" ? "marginLeft" : "marginRight"]: value,
      });
    }
  };

  const handleVerticalMarginChange = (side: "top" | "bottom", value: number) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...settings,
        [side === "top" ? "marginTop" : "marginBottom"]: value,
      });
    }
  };

  return (
    <div
      ref={editorContainerRef}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: widthMap[settings.pageWidth],
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        /* Code Block with Header */
        .code-block-wrapper {
          position: relative;
          margin: 12px 0;
          border-radius: 8px;
          overflow: hidden;
          background: #1e1e1e;
        }
        .code-block-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #2d2d2d;
          border-bottom: 1px solid #3d3d3d;
        }
        .code-block-language {
          color: #9e9e9e;
          font-size: 12px;
          font-family: system-ui, -apple-system, sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .code-block-copy {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: transparent;
          border: 1px solid #4d4d4d;
          border-radius: 4px;
          color: #9e9e9e;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .code-block-copy:hover {
          background: #3d3d3d;
          color: #fff;
        }
        .code-block-copy.copied {
          background: #4caf50;
          border-color: #4caf50;
          color: #fff;
        }
        .code-block {
          background: #1e1e1e !important;
          color: #d4d4d4 !important;
          padding: 16px !important;
          margin: 0 !important;
          border-radius: 0 0 8px 8px !important;
          overflow-x: auto;
          font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          tab-size: 4 !important;
          -moz-tab-size: 4 !important;
          white-space: pre !important;
        }
        .code-block code {
          background: transparent !important;
          padding: 0 !important;
          font-family: inherit !important;
          font-size: inherit !important;
          color: inherit !important;
          white-space: pre !important;
          display: block;
        }
        /* Lowlight/Highlight.js Syntax Colors */
        .hljs-comment,
        .hljs-quote { color: #6a9955 !important; font-style: italic; }
        .hljs-keyword,
        .hljs-selector-tag,
        .hljs-type { color: #569cd6 !important; }
        .hljs-string,
        .hljs-attr,
        .hljs-symbol,
        .hljs-bullet,
        .hljs-addition { color: #ce9178 !important; }
        .hljs-number,
        .hljs-literal { color: #b5cea8 !important; }
        .hljs-title,
        .hljs-section,
        .hljs-name { color: #dcdcaa !important; }
        .hljs-function { color: #dcdcaa !important; }
        .hljs-variable,
        .hljs-template-variable { color: #9cdcfe !important; }
        .hljs-class .hljs-title { color: #4ec9b0 !important; }
        .hljs-attribute { color: #9cdcfe !important; }
        .hljs-regexp,
        .hljs-link { color: #d16969 !important; }
        .hljs-meta { color: #c586c0 !important; }
        .hljs-tag { color: #808080 !important; }
        .hljs-tag .hljs-name { color: #569cd6 !important; }
        .hljs-tag .hljs-attr { color: #9cdcfe !important; }
        .hljs-built_in { color: #4ec9b0 !important; }
        .hljs-deletion { color: #f44747 !important; background: rgba(244, 71, 71, 0.1); }
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
        
        /* ProseMirror styles */
        .ProseMirror pre {
          margin: 0;
          padding: 0;
        }
        .ProseMirror code {
          background: #f4f4f4;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre code {
          background: transparent;
          padding: 0;
          border-radius: 0;
        }
        
        /* Table styles */
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          position: relative;
          min-width: 80px;
        }
        .ProseMirror th {
          background: #f3f4f6;
          font-weight: 600;
        }
        .ProseMirror .selectedCell {
          background: #e3f2fd;
        }
        
        /* Link styles */
        .ProseMirror a {
          color: #1976d2;
          text-decoration: underline;
          cursor: pointer;
        }
        
        /* Heading styles */
        .ProseMirror h1,
        .ProseMirror h1.tiptap-heading {
          font-size: 2em !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          margin: 0.67em 0 !important;
          color: #1a1a1a !important;
          display: block !important;
        }
        .ProseMirror h2,
        .ProseMirror h2.tiptap-heading {
          font-size: 1.5em !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          margin: 0.83em 0 !important;
          color: #2a2a2a !important;
          display: block !important;
        }
        .ProseMirror h3,
        .ProseMirror h3.tiptap-heading {
          font-size: 1.25em !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          margin: 0.67em 0 !important;
          color: #3a3a3a !important;
          display: block !important;
        }
        
        /* Task List styles - Fixed horizontal layout */
        .ProseMirror ul[data-type="taskList"],
        ul[data-type="taskList"],
        .tiptap-task-list {
          list-style: none !important;
          padding: 0 !important;
          padding-left: 0 !important;
          margin: 8px 0 !important;
        }
        .ProseMirror ul[data-type="taskList"] > li,
        ul[data-type="taskList"] > li,
        .tiptap-task-list > li,
        li[data-type="taskItem"],
        .tiptap-task-item {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: flex-start !important;
          gap: 10px !important;
          margin: 6px 0 !important;
          padding: 0 !important;
        }
        .ProseMirror ul[data-type="taskList"] > li > label,
        ul[data-type="taskList"] > li > label,
        li[data-type="taskItem"] > label,
        .tiptap-task-item > label {
          display: flex !important;
          flex-shrink: 0 !important;
          margin: 0 !important;
          padding-top: 3px !important;
          user-select: none !important;
        }
        .ProseMirror ul[data-type="taskList"] > li > label input[type="checkbox"],
        ul[data-type="taskList"] > li > label input[type="checkbox"],
        li[data-type="taskItem"] > label input[type="checkbox"],
        .tiptap-task-item > label input[type="checkbox"] {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          cursor: pointer !important;
          accent-color: #1976d2 !important;
          margin: 0 !important;
        }
        .ProseMirror ul[data-type="taskList"] > li > div,
        ul[data-type="taskList"] > li > div,
        li[data-type="taskItem"] > div,
        .tiptap-task-item > div {
          flex: 1 !important;
          min-width: 0 !important;
        }
        .ProseMirror ul[data-type="taskList"] > li > div p,
        ul[data-type="taskList"] > li > div p,
        li[data-type="taskItem"] > div p,
        .tiptap-task-item > div p {
          margin: 0 !important;
          display: inline !important;
        }
        li[data-type="taskItem"][data-checked="true"] > div,
        li[data-checked="true"] > div {
          text-decoration: line-through !important;
          color: #9e9e9e !important;
        }
        li[data-type="taskItem"][data-checked="true"] > div p,
        li[data-checked="true"] > div p {
          text-decoration: line-through !important;
          color: #9e9e9e !important;
        }
        
        /* Paragraph styles */
        .ProseMirror p {
          margin: 0.5em 0;
          line-height: 1.6;
        }
        
        /* Blockquote styles */
        .ProseMirror blockquote {
          border-left: 4px solid #1976d2;
          padding-left: 16px;
          margin: 16px 0;
          color: #666;
          font-style: italic;
        }

        /* Image styles */
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }

        /* Horizontal rule */
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
        }

        /* List styles */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        /* Bullet list style variations */
        .ProseMirror ul.list-disc { list-style-type: disc; }
        .ProseMirror ul.list-circle { list-style-type: circle; }
        .ProseMirror ul.list-square { list-style-type: square; }
        
        /* Ordered list style variations */
        .ProseMirror ol.list-decimal { list-style-type: decimal; }
        .ProseMirror ol.list-decimal-leading-zero { list-style-type: decimal-leading-zero; }
        .ProseMirror ol.list-lower-alpha { list-style-type: lower-alpha; }
        .ProseMirror ol.list-upper-alpha { list-style-type: upper-alpha; }
        .ProseMirror ol.list-lower-roman { list-style-type: lower-roman; }
        .ProseMirror ol.list-upper-roman { list-style-type: upper-roman; }
        
        /* Nested list styles for variety */
        .ProseMirror ul ul { list-style-type: circle; }
        .ProseMirror ul ul ul { list-style-type: square; }
        .ProseMirror ol ol { list-style-type: lower-alpha; }
        .ProseMirror ol ol ol { list-style-type: lower-roman; }

        /* Focus outline */
        .ProseMirror:focus {
          outline: none;
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* Collaboration Cursor Styles */
        .collaboration-cursor {
          position: relative;
          border-left: 2px solid;
          margin-left: -1px;
          margin-right: -1px;
          pointer-events: none;
          word-break: normal;
        }

        .collaboration-cursor-label {
          position: absolute;
          top: -1.4em;
          left: -1px;
          font-size: 11px;
          font-weight: 600;
          font-style: normal;
          line-height: normal;
          padding: 2px 6px;
          border-radius: 4px 4px 4px 0;
          white-space: nowrap;
          color: white;
          user-select: none;
          pointer-events: none;
          z-index: 10;
          animation: cursorFadeIn 0.2s ease-out;
        }

        @keyframes cursorFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .collaboration-selection {
          background-color: var(--selection-color, rgba(255, 200, 0, 0.3));
        }

        /* Cursor blinking animation */
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .collaboration-cursor::after {
          content: '';
          position: absolute;
          top: 0;
          left: -1px;
          width: 2px;
          height: 100%;
          background: inherit;
          animation: cursorBlink 1s infinite;
        }
      `}</style>

      {/* Toolbar - Always visible, sticky at top of scroll area */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: "16px",
          padding: "12px",
          background: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e2e6ea",
          position: "sticky",
          top: 0,
          zIndex: 99,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          opacity: readOnly ? 0.6 : 1,
          pointerEvents: readOnly ? "none" : "auto",
        }}
      >
          {/* Undo/Redo */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginRight: "8px",
              paddingRight: "8px",
              borderRight: "1px solid #e2e6ea",
            }}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              icon={<Undo fontSize="small" />}
              tooltip="Undo"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              icon={<Redo fontSize="small" />}
              tooltip="Redo"
            />
          </div>

          {/* Font Size Control - Google Docs Style */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              marginRight: "4px",
              border: "1px solid #e2e6ea",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            {/* Decrease button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const currentSize = getCurrentFontSize();
                const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 96];
                const currentIndex = sizes.findIndex(s => s >= currentSize);
                const newIndex = Math.max(0, currentIndex - 1);
                setFontSize(editor, `${sizes[newIndex]}px`);
              }}
              style={{
                width: 28,
                height: 28,
                border: "none",
                borderRight: "1px solid #e2e6ea",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#424242",
              }}
              title="Decrease font size"
            >
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>−</span>
            </button>
            
            {/* Font size value with dropdown */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowFontSizeMenu(!showFontSizeMenu);
                  setShowFontFamilyMenu(false);
                  setShowBulletStyleMenu(false);
                  setShowOrderedStyleMenu(false);
                }}
                style={{
                  width: 44,
                  height: 28,
                  border: "none",
                  background: showFontSizeMenu ? "#e3f2fd" : "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#424242",
                  textAlign: "center",
                }}
                title="Font Size"
              >
                {getCurrentFontSize()}
              </button>
              {showFontSizeMenu && (
                <div
                  ref={fontSizeMenuRef}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1400,
                    padding: "4px 0",
                    minWidth: "70px",
                    maxHeight: "280px",
                    overflowY: "auto",
                  }}
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 96].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFontSize(editor, `${size}px`);
                        setShowFontSizeMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 16px",
                        border: "none",
                        background:
                          editor.getAttributes("textStyle").fontSize === `${size}px`
                            ? "#e3f2fd"
                            : "transparent",
                        cursor: "pointer",
                        textAlign: "center",
                        fontSize: "13px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          editor.getAttributes("textStyle").fontSize === `${size}px`
                            ? "#e3f2fd"
                            : "transparent")
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Increase button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const currentSize = getCurrentFontSize();
                const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72, 96];
                const currentIndex = sizes.findIndex(s => s >= currentSize);
                const newIndex = Math.min(sizes.length - 1, currentIndex + 1);
                setFontSize(editor, `${sizes[newIndex]}px`);
              }}
              style={{
                width: 28,
                height: 28,
                border: "none",
                borderLeft: "1px solid #e2e6ea",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#424242",
              }}
              title="Increase font size"
            >
              <span style={{ fontSize: "16px", fontWeight: "bold" }}>+</span>
            </button>
          </div>

          {/* Font Family Dropdown */}
          <div
            style={{
              position: "relative",
              marginRight: "8px",
              paddingRight: "8px",
              borderRight: "1px solid #e2e6ea",
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowFontFamilyMenu(!showFontFamilyMenu);
                setShowFontSizeMenu(false);
                setShowBulletStyleMenu(false);
                setShowOrderedStyleMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 8px",
                border: "1px solid #e2e6ea",
                borderRadius: "4px",
                background: showFontFamilyMenu ? "#e3f2fd" : "#fff",
                color: "#424242",
                cursor: "pointer",
                fontSize: "13px",
                minWidth: "120px",
              }}
              title="Font Family"
            >
              <FontDownload fontSize="small" />
              <span
                style={{
                  fontSize: "12px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "80px",
                }}
              >
                {FONT_FAMILIES.find(
                  (f) =>
                    f.value === editor.getAttributes("textStyle").fontFamily
                )?.label || "Default"}
              </span>
              <ArrowDropDown fontSize="small" style={{ marginLeft: "auto" }} />
            </button>
            {showFontFamilyMenu && (
              <div
                ref={fontFamilyMenuRef}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  background: "#fff",
                  border: "1px solid #e2e6ea",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 1400,
                  padding: "8px 0",
                  minWidth: "180px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value || "default"}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (font.value) {
                        setFontFamily(editor, font.value);
                      } else {
                        unsetFontFamily(editor);
                      }
                      setShowFontFamilyMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      border: "none",
                      background:
                        editor.getAttributes("textStyle").fontFamily ===
                        font.value
                          ? "#e3f2fd"
                          : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: font.value || "inherit",
                      fontSize: "14px",
                      display: "block",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        editor.getAttributes("textStyle").fontFamily ===
                        font.value
                          ? "#e3f2fd"
                          : "transparent")
                    }
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Formatting */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginRight: "8px",
              paddingRight: "8px",
              borderRight: "1px solid #e2e6ea",
            }}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              icon={<FormatBold fontSize="small" />}
              tooltip="Bold (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              icon={<FormatItalic fontSize="small" />}
              tooltip="Italic (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              icon={<FormatUnderlined fontSize="small" />}
              tooltip="Underline (Ctrl+U)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              icon={<StrikethroughS fontSize="small" />}
              tooltip="Strikethrough"
            />

            {/* Text Color */}
            <div style={{ position: "relative" }}>
              <ToolbarButton
                onClick={() => {
                  setShowTextColorMenu(!showTextColorMenu);
                  setShowHighlightMenu(false);
                }}
                isActive={showTextColorMenu}
                icon={<FormatColorText fontSize="small" />}
                tooltip="Text Color"
              />
              {showTextColorMenu && (
                <div
                  ref={textColorMenuRef}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1400,
                    padding: "12px",
                    width: "280px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: "8px",
                      fontWeight: 500,
                    }}
                  >
                    Text Color
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: "3px",
                    }}
                  >
                    {textColors.map((item) => (
                      <button
                        key={item.color}
                        type="button"
                        title={item.label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          editor.chain().focus().setColor(item.color).run();
                          setShowTextColorMenu(false);
                        }}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "3px",
                          border: "1px solid rgba(0,0,0,0.1)",
                          background: item.color,
                          cursor: "pointer",
                          transition: "transform 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowTextColorMenu(false);
                    }}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "6px",
                      border: "1px solid #e2e6ea",
                      borderRadius: "4px",
                      background: "#f5f5f5",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Remove Color
                  </button>
                </div>
              )}
            </div>

            {/* Highlight Color */}
            <div style={{ position: "relative" }}>
              <ToolbarButton
                onClick={() => {
                  setShowHighlightMenu(!showHighlightMenu);
                  setShowTextColorMenu(false);
                }}
                isActive={editor.isActive("highlight") || showHighlightMenu}
                icon={<FormatColorFill fontSize="small" />}
                tooltip="Highlight"
              />
              {showHighlightMenu && (
                <div
                  ref={highlightMenuRef}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1400,
                    padding: "12px",
                    width: "280px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: "8px",
                      fontWeight: 500,
                    }}
                  >
                    Highlight Color
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: "3px",
                    }}
                  >
                    {highlightColors.map((item) => (
                      <button
                        key={item.color}
                        type="button"
                        title={item.label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          editor
                            .chain()
                            .focus()
                            .toggleHighlight({ color: item.color })
                            .run();
                          setShowHighlightMenu(false);
                        }}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "3px",
                          border: "1px solid rgba(0,0,0,0.1)",
                          background: item.color,
                          transition: "transform 0.1s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.1)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1)")
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run();
                      setShowHighlightMenu(false);
                    }}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "6px",
                      border: "1px solid #e2e6ea",
                      borderRadius: "4px",
                      background: "#f5f5f5",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    Remove Highlight
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Styles Dropdown - Google Docs Style */}
          <div
            style={{
              position: "relative",
              marginRight: "8px",
              paddingRight: "8px",
              borderRight: "1px solid #e2e6ea",
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowStylesMenu(!showStylesMenu);
                setShowFontSizeMenu(false);
                setShowFontFamilyMenu(false);
                setShowBulletStyleMenu(false);
                setShowOrderedStyleMenu(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 10px",
                border: "1px solid #e2e6ea",
                borderRadius: "4px",
                background: showStylesMenu ? "#e3f2fd" : "#fff",
                color: "#424242",
                cursor: "pointer",
                fontSize: "13px",
                minWidth: "140px",
                justifyContent: "space-between",
              }}
              title="Text Styles"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {editor.isActive("heading", { level: 1 }) ? (
                  <><Title fontSize="small" style={{ color: "#1976d2" }} /> Title</>
                ) : editor.isActive("heading", { level: 2 }) ? (
                  <><Subject fontSize="small" style={{ color: "#0d47a1" }} /> Heading 1</>
                ) : editor.isActive("heading", { level: 3 }) ? (
                  <><Notes fontSize="small" style={{ color: "#1565c0" }} /> Heading 2</>
                ) : editor.isActive("heading", { level: 4 }) ? (
                  <><ShortText fontSize="small" style={{ color: "#1976d2" }} /> Heading 3</>
                ) : (
                  <><TextFields fontSize="small" style={{ color: "#616161" }} /> Normal text</>
                )}
              </span>
              <ArrowDropDown fontSize="small" />
            </button>
            {showStylesMenu && (
              <div
                ref={stylesMenuRef}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "4px",
                  background: "#fff",
                  border: "1px solid #e2e6ea",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 1400,
                  padding: "8px 0",
                  minWidth: "200px",
                }}
              >
                {/* Normal text */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().setParagraph().run();
                    setShowStylesMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: editor.isActive("paragraph") && !editor.isActive("heading")
                      ? "#e3f2fd"
                      : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      editor.isActive("paragraph") && !editor.isActive("heading")
                        ? "#e3f2fd"
                        : "transparent")
                  }
                >
                  <TextFields fontSize="small" style={{ color: "#616161" }} />
                  <span>Normal text</span>
                </button>
                
                <div style={{ borderTop: "1px solid #e2e6ea", margin: "4px 0" }} />
                
                {/* Title */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    setShowStylesMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: editor.isActive("heading", { level: 1 })
                      ? "#e3f2fd"
                      : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      editor.isActive("heading", { level: 1 })
                        ? "#e3f2fd"
                        : "transparent")
                  }
                >
                  <Title style={{ fontSize: "28px", color: "#1976d2" }} />
                  <span style={{ fontSize: "24px", fontWeight: 400 }}>Title</span>
                </button>
                
                {/* Heading 1 */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    setShowStylesMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: editor.isActive("heading", { level: 2 })
                      ? "#e3f2fd"
                      : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      editor.isActive("heading", { level: 2 })
                        ? "#e3f2fd"
                        : "transparent")
                  }
                >
                  <Subject style={{ fontSize: "24px", color: "#0d47a1" }} />
                  <span style={{ fontSize: "18px", fontWeight: 700 }}>Heading 1</span>
                </button>
                
                {/* Heading 2 */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    setShowStylesMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: editor.isActive("heading", { level: 3 })
                      ? "#e3f2fd"
                      : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      editor.isActive("heading", { level: 3 })
                        ? "#e3f2fd"
                        : "transparent")
                  }
                >
                  <Notes style={{ fontSize: "22px", color: "#1565c0" }} />
                  <span style={{ fontSize: "16px", fontWeight: 700 }}>Heading 2</span>
                </button>
                
                {/* Heading 3 */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 4 }).run();
                    setShowStylesMenu(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: editor.isActive("heading", { level: 4 })
                      ? "#e3f2fd"
                      : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      editor.isActive("heading", { level: 4 })
                        ? "#e3f2fd"
                        : "transparent")
                  }
                >
                  <ShortText style={{ fontSize: "20px", color: "#1976d2" }} />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#666" }}>Heading 3</span>
                </button>
              </div>
            )}
          </div>

          {/* Lists */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginRight: "8px",
              paddingRight: "8px",
              borderRight: "1px solid #e2e6ea",
            }}
          >
            {/* Bullet List with Style Dropdown */}
            <div style={{ position: "relative", display: "flex" }}>
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().toggleBulletList().run();
                }}
                isActive={editor.isActive("bulletList")}
                icon={<FormatListBulleted fontSize="small" />}
                tooltip="Bullet List"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowBulletStyleMenu(!showBulletStyleMenu);
                  setShowOrderedStyleMenu(false);
                  setShowFontSizeMenu(false);
                  setShowFontFamilyMenu(false);
                }}
                style={{
                  padding: "2px",
                  border: "1px solid #e2e6ea",
                  borderLeft: "none",
                  borderRadius: "0 4px 4px 0",
                  background: showBulletStyleMenu ? "#e3f2fd" : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Bullet Style"
              >
                <ArrowDropDown fontSize="small" style={{ fontSize: "16px" }} />
              </button>
              {showBulletStyleMenu && (
                <div
                  ref={bulletStyleMenuRef}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1400,
                    padding: "8px 0",
                    minWidth: "160px",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "#9e9e9e",
                      fontWeight: 600,
                    }}
                  >
                    Bullet Style
                  </div>
                  {BULLET_LIST_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCurrentBulletStyle(style.value);
                        setBulletListStyle(editor, style.value);
                        setShowBulletStyleMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        border: "none",
                        background:
                          currentBulletStyle === style.value
                            ? "#e3f2fd"
                            : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          currentBulletStyle === style.value
                            ? "#e3f2fd"
                            : "transparent")
                      }
                    >
                      <span style={{ fontSize: "18px", width: "24px" }}>
                        {style.icon}
                      </span>
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ordered List with Style Dropdown */}
            <div style={{ position: "relative", display: "flex" }}>
              <ToolbarButton
                onClick={() => {
                  editor.chain().focus().toggleOrderedList().run();
                }}
                isActive={editor.isActive("orderedList")}
                icon={<FormatListNumbered fontSize="small" />}
                tooltip="Numbered List"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowOrderedStyleMenu(!showOrderedStyleMenu);
                  setShowBulletStyleMenu(false);
                  setShowFontSizeMenu(false);
                  setShowFontFamilyMenu(false);
                }}
                style={{
                  padding: "2px",
                  border: "1px solid #e2e6ea",
                  borderLeft: "none",
                  borderRadius: "0 4px 4px 0",
                  background: showOrderedStyleMenu ? "#e3f2fd" : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="List Style"
              >
                <ArrowDropDown fontSize="small" style={{ fontSize: "16px" }} />
              </button>
              {showOrderedStyleMenu && (
                <div
                  ref={orderedStyleMenuRef}
                  onMouseDown={(e) => e.preventDefault()}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1400,
                    padding: "8px 0",
                    minWidth: "180px",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "#9e9e9e",
                      fontWeight: 600,
                    }}
                  >
                    Numbering Style
                  </div>
                  {ORDERED_LIST_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCurrentOrderedStyle(style.value);
                        setOrderedListStyle(editor, style.value);
                        setShowOrderedStyleMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        border: "none",
                        background:
                          currentOrderedStyle === style.value
                            ? "#e3f2fd"
                            : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          currentOrderedStyle === style.value
                            ? "#e3f2fd"
                            : "transparent")
                      }
                    >
                      <span style={{ fontWeight: 500 }}>{style.label}</span>
                      <span style={{ fontSize: "11px", color: "#757575" }}>
                        {style.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive("taskList")}
              icon={<CheckBox fontSize="small" />}
              tooltip="Task List"
            />
          </div>

          {/* Alignment */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginRight: "8px",
              paddingRight: "8px",
              borderRight: "1px solid #e2e6ea",
            }}
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              icon={<FormatAlignLeft fontSize="small" />}
              tooltip="Align Left"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              icon={<FormatAlignCenter fontSize="small" />}
              tooltip="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              icon={<FormatAlignRight fontSize="small" />}
              tooltip="Align Right"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              isActive={editor.isActive({ textAlign: "justify" })}
              icon={<FormatAlignJustify fontSize="small" />}
              tooltip="Justify"
            />
          </div>

          {/* Other */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive("codeBlock")}
              icon={<Code fontSize="small" />}
              tooltip="Code Block"
            />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive("blockquote")}
              icon={<FormatQuote fontSize="small" />}
              tooltip="Quote"
            />

            {/* Link Button */}
            <ToolbarButton
              onClick={() => {
                const { from, to } = editor.state.selection;
                const selectedText = editor.state.doc.textBetween(from, to);
                setLinkText(selectedText || "");
                setLinkUrl(editor.getAttributes("link").href || "");
                setLinkModalTab(0);
                setShowLinkModal(true);
              }}
              isActive={editor.isActive("link")}
              icon={<LinkIcon fontSize="small" />}
              tooltip="Insert Link"
            />
            {editor.isActive("link") && (
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetLink().run()}
                icon={<LinkOff fontSize="small" />}
                tooltip="Remove Link"
              />
            )}

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              icon={<HorizontalRule fontSize="small" />}
              tooltip="Horizontal Rule"
            />

            {/* Table Button */}
            <div style={{ position: "relative" }}>
              <ToolbarButton
                onClick={() => {
                  if (showTableMenu) {
                    setShowTableMenu(false);
                    return;
                  }
                  if (cursorInTable) {
                    setShowTableMenu(true);
                  } else {
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run();
                  }
                }}
                isActive={cursorInTable || showTableMenu}
                icon={<TableChart fontSize="small" />}
                tooltip={cursorInTable ? "Table Options" : "Insert Table"}
              />
              {showTableMenu && (
                <div
                  ref={tableMenuRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "4px",
                    background: "#fff",
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1400,
                    minWidth: "200px",
                    padding: "4px 0",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "#9e9e9e",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Add
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().addRowBefore().run();
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#424242",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ArrowUpward fontSize="small" />
                    Row Before
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().addRowAfter().run();
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#424242",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ArrowDownward fontSize="small" />
                    Row After
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().addColumnBefore().run();
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#424242",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ArrowBack fontSize="small" />
                    Column Before
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().addColumnAfter().run();
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#424242",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <ArrowForward fontSize="small" />
                    Column After
                  </button>

                  <div
                    style={{ borderTop: "1px solid #e2e6ea", margin: "4px 0" }}
                  />

                  <div
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.75rem",
                      color: "#9e9e9e",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Remove
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().deleteRow().run();
                      setTimeout(() => {
                        if (!editor.can().addRowAfter())
                          setShowTableMenu(false);
                      }, 50);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#d32f2f",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fee2e2")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Delete fontSize="small" />
                    Delete Row
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().deleteColumn().run();
                      setTimeout(() => {
                        if (!editor.can().addRowAfter())
                          setShowTableMenu(false);
                      }, 50);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#d32f2f",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fee2e2")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Delete fontSize="small" />
                    Delete Column
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      editor.chain().focus().deleteTable().run();
                      setShowTableMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#d32f2f",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fee2e2")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Delete fontSize="small" />
                    Delete Table
                  </button>

                  <div
                    style={{ borderTop: "1px solid #e2e6ea", margin: "4px 0" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowTableMenu(false)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      color: "#757575",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Close fontSize="small" />
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Image Button */}
            <ToolbarButton
              onClick={() => {
                setImageUrl("");
                setImagePreview("");
                setImageModalTab(0);
                setShowImageModal(true);
              }}
              icon={<AddPhotoAlternate fontSize="small" />}
              tooltip="Insert Image"
            />

            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              icon={<Attachment fontSize="small" />}
              tooltip="Attach File"
            />
          </div>
        </div>

      {/* Slash Command Menu */}
      {showSlashMenu && filteredCommands.length > 0 && (
        <div
          ref={slashMenuRef}
          style={{
            position: "absolute",
            top: `${slashMenuPosition.top}px`,
            left: `${slashMenuPosition.left}px`,
            background: "#fff",
            border: "1px solid #e2e6ea",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1400,
            minWidth: "280px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {filteredCommands.map((cmd, index) => (
            <div
              key={index}
              data-index={index}
              onClick={() => handleSlashCommand(cmd)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background:
                  index === selectedSlashIndex ? "#e3f2fd" : "transparent",
                borderBottom:
                  index < filteredCommands.length - 1
                    ? "1px solid #f0f0f0"
                    : "none",
              }}
              onMouseEnter={() => setSelectedSlashIndex(index)}
            >
              <div
                style={{
                  color: "#1976d2",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {cmd.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: "#424242",
                  }}
                >
                  {cmd.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#757575",
                    marginTop: "2px",
                  }}
                >
                  {cmd.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Area with Rulers - Internal Scroll Container */}
      <div
        style={{
          border: "1px solid #e2e6ea",
          borderRadius: "8px",
          background: "#fff",
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Horizontal Ruler - Fixed at top */}
        {settings.showRulers && (
          <div 
            style={{ 
              marginLeft: 24,
              flexShrink: 0,
              background: "#fff",
              zIndex: 50,
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <HorizontalRuler
              width={contentWidth}
              marginLeft={settings.marginLeft}
              marginRight={settings.marginRight}
              onMarginChange={!readOnly ? handleHorizontalMarginChange : undefined}
            />
          </div>
        )}

        {/* Main content area with vertical ruler */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Vertical Ruler - Fixed on left */}
          {settings.showRulers && (
            <div
              style={{
                flexShrink: 0,
                background: "#fff",
                zIndex: 49,
                borderRight: "1px solid #e0e0e0",
              }}
            >
              <div style={{ height: "100%", overflow: "hidden" }}>
                <VerticalRuler
                  height={contentHeight}
                  marginTop={settings.marginTop}
                  marginBottom={settings.marginBottom}
                  onMarginChange={!readOnly ? handleVerticalMarginChange : undefined}
                />
              </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div
            ref={contentAreaRef}
            style={{
              flex: 1,
              position: "relative",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <EditorContent
              editor={editor}
              style={{
                paddingTop: settings.marginTop,
                paddingBottom: settings.marginBottom,
                paddingLeft: settings.marginLeft,
                paddingRight: settings.marginRight,
                minHeight: "100%",
                outline: "none",
              }}
            />

        {/* Collaborator Cursors */}
        {renderedCursors.map((cursor) => (
          <React.Fragment key={cursor.id}>
            {/* Selection highlight */}
            {cursor.selectionRects?.map((rect, idx) => (
              <div
                key={`${cursor.id}-sel-${idx}`}
                style={{
                  position: "absolute",
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  backgroundColor: `${cursor.color}40`, // 25% opacity
                  pointerEvents: "none",
                  zIndex: 5,
                  borderRadius: 2,
                }}
              />
            ))}

            {/* Cursor line */}
            <div
              style={{
                position: "absolute",
                top: cursor.top,
                left: cursor.left,
                width: 2,
                height: cursor.height || 20,
                backgroundColor: cursor.color,
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              {/* User name label */}
              <div
                style={{
                  position: "absolute",
                  top: -18,
                  left: -1,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px 4px 4px 0",
                  whiteSpace: "nowrap",
                  color: "white",
                  backgroundColor: cursor.color,
                  userSelect: "none",
                  pointerEvents: "none",
                  zIndex: 11,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                {cursor.name}
              </div>
            </div>
          </React.Fragment>
        ))}
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      <input
        type="file"
        ref={imageInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* Link Modal */}
      <Dialog
        open={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle
          sx={{
            pb: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Tabs
            value={linkModalTab}
            onChange={(_, newValue) => setLinkModalTab(newValue)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
            }}
          >
            <Tab label="Link" />
            <Tab label="File" />
          </Tabs>
          <IconButton onClick={() => setShowLinkModal(false)} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {linkModalTab === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Paste or search for link"
                placeholder="https://example.com"
                fullWidth
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
                variant="outlined"
                size="small"
              />
              <TextField
                label="Link text (optional)"
                placeholder="Enter display text"
                fullWidth
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                variant="outlined"
                size="small"
                helperText="Leave empty to use selected text or URL"
              />
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                sx={{ py: 3, borderStyle: "dashed" }}
                startIcon={<CloudUpload />}
              >
                Upload File
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowLinkModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleInsertLink}
            variant="contained"
            disabled={linkModalTab === 0 && !linkUrl}
            disableElevation
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Modal */}
      <Dialog
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle
          sx={{
            pb: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Tabs
            value={imageModalTab}
            onChange={(_, newValue) => setImageModalTab(newValue)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
            }}
          >
            <Tab label="Link" />
            <Tab label="File" />
          </Tabs>
          <IconButton onClick={() => setShowImageModal(false)} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {imageModalTab === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Paste link to upload"
                placeholder="https://example.com/image.jpg"
                fullWidth
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                autoFocus
                variant="outlined"
                size="small"
              />
              {imagePreview && (
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    border: "1px solid #e2e6ea",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "4px",
                    }}
                    onError={() => setImagePreview("")}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    <OpenInNew
                      fontSize="small"
                      sx={{ verticalAlign: "middle", mr: 0.5 }}
                    />
                    Load preview
                  </Typography>
                </Box>
              )}
              {!imagePreview && imageUrl && (
                <Box
                  sx={{
                    p: 4,
                    border: "1px dashed #e2e6ea",
                    borderRadius: "8px",
                    textAlign: "center",
                    color: "#9e9e9e",
                  }}
                >
                  <OpenInNew sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2">Load preview</Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ py: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => imageInputRef.current?.click()}
                sx={{ py: 3, borderStyle: "dashed" }}
                startIcon={
                  imageUploading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <CloudUpload />
                  )
                }
                disabled={imageUploading}
              >
                {imageUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowImageModal(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleInsertImageUrl}
            variant="contained"
            disabled={imageModalTab === 0 && !imageUrl}
            disableElevation
          >
            Insert
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DocumentEditor;
