"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
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
  ArrowDropDown,
  Add,
  Delete,
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Close,
  OpenInNew,
  CloudUpload,
  FormatColorText,
  FormatColorFill,
  Palette,
  ContentCopy,
  Check,
} from "@mui/icons-material";
import Color from "@tiptap/extension-color";
import Dropcursor from "@tiptap/extension-dropcursor";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
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
import { EditorContent, useEditor, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { uploadFile } from "@/utils/UploadFile";
import toast from "react-hot-toast";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import { common, createLowlight } from "lowlight";
import { MenuItem, Select, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, IconButton, Typography, CircularProgress } from "@mui/material";

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

// Custom Code Block Component with header - using inline styles for reliability
const CodeBlockComponent = ({ node, updateAttributes }: any) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || "";
  
  const copyToClipboard = () => {
    const code = node.textContent;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for older browsers
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
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
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

interface TiptapProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  ticketId?: string;
  onPendingAttachment?: (fileData: any) => void;
}

interface SlashCommand {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: any) => void;
  keywords: string[];
}

const Tiptap = forwardRef((props: TiptapProps, ref) => {
  const { initialContent = "<p></p>", onSave, ticketId, onPendingAttachment } = props;
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector((state) => state.auth.value);
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState("");
  
  // Modal states
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        heading: false, // Disable default heading, we use our own
      }),
      TextStyle,
      Underline,
      Dropcursor,
      Strike,
      Placeholder.configure({
        placeholder: "Type '/' for commands, or start typing...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:float-left before:text-[#adb5bd] before:h-0 before:pointer-events-none",
      }),
      Color.configure({ types: [TextStyle.name] }),
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
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc pl-6 my-2",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal pl-6 my-2",
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
    content: initialContent,
    onUpdate: ({ editor }) => {
      onSave?.(editor.getHTML());
      
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
          
          // Get coordinates relative to the editor container
          const coords = editor.view.coordsAtPos($from.pos);
          const containerRect = editorContainerRef.current?.getBoundingClientRect();
          
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
    immediatelyRender: false,
  });

  const slashCommands: SlashCommand[] = [
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: <Title />,
      keywords: ["h1", "heading", "title", "large"],
      command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: <Title />,
      keywords: ["h2", "heading", "subtitle", "medium"],
      command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: <Title />,
      keywords: ["h3", "heading", "small"],
      command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
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
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
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
      command: (editor) => editor.chain().focus().toggleHighlight({ color: "#ffff00" }).run(),
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
  ];

  const filteredCommands = slashCommands.filter((cmd) =>
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
        
        editor.chain()
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSlashMenu) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSlashIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSlashIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedSlashIndex]) {
          handleSlashCommand(filteredCommands[selectedSlashIndex]);
        }
      } else if (e.key === "Escape") {
        setShowSlashMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSlashMenu, filteredCommands, selectedSlashIndex, handleSlashCommand]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (tableMenuRef.current && !tableMenuRef.current.contains(target)) {
        setShowTableMenu(false);
      }
      if (textColorMenuRef.current && !textColorMenuRef.current.contains(target)) {
        setShowTextColorMenu(false);
      }
      if (highlightMenuRef.current && !highlightMenuRef.current.contains(target)) {
        setShowHighlightMenu(false);
      }
    };

    if (showTableMenu || showTextColorMenu || showHighlightMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTableMenu, showTextColorMenu, showHighlightMenu]);

  // Track if cursor is in table for re-rendering
  const [cursorInTable, setCursorInTable] = useState(false);

  // Helper to check if cursor is in a table
  const checkIfInTable = useCallback(() => {
    if (!editor) return false;
    
    // Check using node hierarchy
    const { selection } = editor.state;
    const { $from } = selection;
    
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === "table" || 
          node.type.name === "tableRow" || 
          node.type.name === "tableCell" || 
          node.type.name === "tableHeader") {
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

    // Call immediately
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

  // Handle Tab key for code block indentation (Enter is handled natively)
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle Tab in code blocks
      if (event.key === "Tab" && editor.isActive("codeBlock")) {
        event.preventDefault();
        
        if (event.shiftKey) {
          // Shift+Tab: Remove indentation (4 spaces for Python)
          const { $from } = editor.state.selection;
          const textBefore = editor.state.doc.textBetween(
            Math.max(0, $from.pos - 4),
            $from.pos
          );
          
          // Check how many leading spaces to remove
          const spacesToRemove = textBefore.match(/^\s{1,4}/)?.[0]?.length || 0;
          if (spacesToRemove > 0) {
            editor.chain()
              .focus()
              .command(({ tr }) => {
                tr.delete($from.pos - spacesToRemove, $from.pos);
                return true;
              })
              .run();
          }
        } else {
          // Tab: Add indentation (4 spaces for Python-style)
          editor.chain().focus().insertContent("    ").run();
        }
      }
    };

    // Use the editor's DOM element for the event listener
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
      // Check if Ctrl (or Cmd on Mac) is held
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

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      try {
        const url = await uploadFile(file);
        if (!url) return;

        const fileData = {
          url,
          name: file.name,
          type: file.type,
          size: file.size,
          uploaded_by: authData?.user?.id,
          uploaded_at: new Date().toISOString(),
        };

        if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file.name)) {
          editor.chain().focus().setImage({ src: url }).run();
        } else {
          setPendingFile(fileData);
        }

        if (ticketId) {
          try {
            await axiosInstance.patch(`/task-maangement/add-attachment/${ticketId}`, fileData);
          } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Upload failed!");
          }
        } else {
          onPendingAttachment?.(fileData);
        }
      } catch (err) {
        console.error("File upload failed:", err);
        toast.error("Failed to upload file");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor, ticketId, onPendingAttachment, authData, axiosInstance]
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        
        if (ticketId) {
          const fileData = {
            url,
            name: file.name,
            type: file.type,
            size: file.size,
            uploaded_by: authData?.user?.id,
            uploaded_at: new Date().toISOString(),
          };
          await axiosInstance.patch(`/task-maangement/add-attachment/${ticketId}`, fileData);
        }
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }));

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // Handle link insertion
  const handleInsertLink = () => {
    if (!editor || !linkUrl) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (selectedText) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      const text = linkText || linkUrl;
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${text}</a>`).run();
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
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ReactNode;
    tooltip: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      style={{
        padding: "6px 8px",
        border: "1px solid #e2e6ea",
        borderRadius: "4px",
        background: isActive ? "#e3f2fd" : "#fff",
        color: isActive ? "#1976d2" : "#424242",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#f5f5f5";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#fff";
        }
      }}
    >
      {icon}
    </button>
  );

  return (
    <div ref={editorContainerRef} style={{ width: "100%", position: "relative" }}>
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
      `}</style>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          marginBottom: "8px",
          padding: "8px",
          background: "#fafafa",
          borderRadius: "6px",
          border: "1px solid #e2e6ea",
        }}
      >
        {/* Text Formatting */}
        <div style={{ display: "flex", gap: "4px", marginRight: "8px", paddingRight: "8px", borderRight: "1px solid #e2e6ea" }}>
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
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Text Color</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "3px" }}>
                  {textColors.map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      title={item.label}
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
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                  ))}
                </div>
                <button
                  type="button"
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
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "8px", fontWeight: 500 }}>Highlight Color</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "3px" }}>
                  {highlightColors.map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      title={item.label}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color: item.color }).run();
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
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                  ))}
                </div>
                <button
                  type="button"
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

        {/* Headings */}
        <div style={{ display: "flex", gap: "4px", marginRight: "8px", paddingRight: "8px", borderRight: "1px solid #e2e6ea" }}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            icon={<Title fontSize="small" />}
            tooltip="Heading 1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            icon={<span style={{ fontSize: "14px", fontWeight: "bold" }}>H2</span>}
            tooltip="Heading 2"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            icon={<span style={{ fontSize: "12px", fontWeight: "bold" }}>H3</span>}
            tooltip="Heading 3"
          />
        </div>

        {/* Lists */}
        <div style={{ display: "flex", gap: "4px", marginRight: "8px", paddingRight: "8px", borderRight: "1px solid #e2e6ea" }}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            icon={<FormatListBulleted fontSize="small" />}
            tooltip="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            icon={<FormatListNumbered fontSize="small" />}
            tooltip="Numbered List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            icon={<CheckBox fontSize="small" />}
            tooltip="Task List"
          />
        </div>

        {/* Alignment */}
        <div style={{ display: "flex", gap: "4px", marginRight: "8px", paddingRight: "8px", borderRight: "1px solid #e2e6ea" }}>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            icon={<FormatAlignLeft fontSize="small" />}
            tooltip="Align Left"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
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
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            icon={<FormatAlignJustify fontSize="small" />}
            tooltip="Justify"
          />
        </div>

        {/* Other */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {/* Code Block - language selector is now in the code block header */}
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
                // If already showing menu, close it
                if (showTableMenu) {
                  setShowTableMenu(false);
                  return;
                }
                // If cursor was in table (tracked state), show menu
                if (cursorInTable) {
                  setShowTableMenu(true);
                } else {
                  // Insert a new table
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
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
                <div style={{ padding: "6px 12px", fontSize: "0.75rem", color: "#9e9e9e", fontWeight: 600, textTransform: "uppercase" }}>
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <ArrowForward fontSize="small" />
                  Column After
                </button>
                
                <div style={{ borderTop: "1px solid #e2e6ea", margin: "4px 0" }} />
                
                <div style={{ padding: "6px 12px", fontSize: "0.75rem", color: "#9e9e9e", fontWeight: 600, textTransform: "uppercase" }}>
                  Remove
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    editor.chain().focus().deleteRow().run();
                    // Keep menu open if still in table
                    setTimeout(() => {
                      if (!editor.can().addRowAfter()) setShowTableMenu(false);
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                    // Keep menu open if still in table
                    setTimeout(() => {
                      if (!editor.can().addRowAfter()) setShowTableMenu(false);
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Delete fontSize="small" />
                  Delete Table
                </button>
                
                <div style={{ borderTop: "1px solid #e2e6ea", margin: "4px 0" }} />
                
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
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
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
              onClick={() => handleSlashCommand(cmd)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: index === selectedSlashIndex ? "#e3f2fd" : "transparent",
                borderBottom: index < filteredCommands.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
              onMouseEnter={() => setSelectedSlashIndex(index)}
            >
              <div style={{ color: "#1976d2", display: "flex", alignItems: "center" }}>
                {cmd.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#424242" }}>
                  {cmd.title}
                </div>
                <div style={{ fontSize: "12px", color: "#757575", marginTop: "2px" }}>
                  {cmd.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Area */}
      <div
        style={{
          border: "1px solid #e2e6ea",
          borderRadius: "6px",
          background: "#fff",
          minHeight: "200px",
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            padding: "16px",
            minHeight: "200px",
            outline: "none",
          }}
        />
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
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
        <DialogTitle sx={{ pb: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs 
            value={linkModalTab} 
            onChange={(_, newValue) => setLinkModalTab(newValue)}
            sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 500 } }}
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
        <DialogTitle sx={{ pb: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs 
            value={imageModalTab} 
            onChange={(_, newValue) => setImageModalTab(newValue)}
            sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 500 } }}
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
                    style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "4px" }}
                    onError={() => setImagePreview("")}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    <OpenInNew fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
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
                startIcon={imageUploading ? <CircularProgress size={20} /> : <CloudUpload />}
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

      {/* Pending File Preview */}
      {pendingFile && (
        <div
          style={{
            border: "1px solid #e2e6ea",
            borderRadius: "6px",
            marginTop: "12px",
            padding: "12px",
            background: "#fafafa",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Attachment fontSize="small" />
            <span style={{ fontWeight: 600 }}>{pendingFile.name}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus()
                  .insertContent(`<a href="${pendingFile.url}" target="_blank" rel="noopener noreferrer">${pendingFile.name}</a>`)
                  .run();
                setPendingFile(null);
              }}
              style={{
                padding: "6px 12px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Insert Link
            </button>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              style={{
                padding: "6px 12px",
                background: "#e0e0e0",
                color: "#424242",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

Tiptap.displayName = "Tiptap";
export default Tiptap;
