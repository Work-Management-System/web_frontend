// "use client";

// import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
// import { AddPhotoAlternate, FormatBold, FormatItalic, FormatUnderlined, LinkOff, LinkOutlined } from "@mui/icons-material";
// import Color from "@tiptap/extension-color";
// import Dropcursor from "@tiptap/extension-dropcursor";
// import Heading from "@tiptap/extension-heading";
// import Link from "@tiptap/extension-link";
// import Placeholder from "@tiptap/extension-placeholder";
// import { TextStyle } from "@tiptap/extension-text-style";
// import Underline from "@tiptap/extension-underline";
// import CodeBlock from "@tiptap/extension-code-block";
// import Image from "@tiptap/extension-image";
// import TaskList from "@tiptap/extension-task-list";
// import TaskItem from "@tiptap/extension-task-item";
// import Highlight from "@tiptap/extension-highlight";
// import Blockquote from "@tiptap/extension-blockquote";
// import { EditorState } from "@tiptap/pm/state";
// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";

// interface TiptapProps {
//   initialContent?: string;
//   onSave?: (content: string) => void;
// }

// const Tiptap = forwardRef((props: TiptapProps, ref) => {
//   const { initialContent = "<p>Click to add description...</p>", onSave } = props;
//   const [theme, setTheme] = useState("light");
//   const [showColorPicker, setShowColorPicker] = useState<"text" | "highlight" | null>(null);
//   const [selectedColor, setSelectedColor] = useState<string | null>(null);
// const textColorPickerRef = useRef<HTMLDivElement>(null);
// const highlightColorPickerRef = useRef<HTMLDivElement>(null);

//   // Vast array of colors for the palette
//   const colorPalette = [
//     "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF69B4", "#00FFFF", "#FF4500", "#2E8B57",
//     "#8A2BE2", "#FFA500", "#6A5ACD", "#20B2AA", "#FF6347", "#ADFF2F", "#BA55D3", "#CD5C5C",
//     "#9ACD32", "#FF1493", "#00CED1", "#FFD700", "#DA70D6", "#40E0D0", "#FF8C00", "#98FB98",
//     "#C71585", "#7B68EE", "#F0E68C", "#ADD8E6", "#DDA0DD", "#90EE90", "#FF7F50", "#B0C4DE",
//   ];

//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       TextStyle,
//       Underline,
//       Dropcursor,
//       Placeholder.configure({
//         placeholder: "Click to add description...",
//         emptyEditorClass: "before:content-[attr(data-placeholder)] before:float-left before:text-[#adb5bd] before:h-0 before:pointer-events-none",
//       }),
//       Color.configure({ types: [TextStyle.name] }),
//       Heading.configure({ levels: [1, 2, 3] }),
//       Link.configure({
//         openOnClick: false,
//         autolink: true,
//         defaultProtocol: "https",
//       }),
//       CodeBlock,
//       Image,
//       TaskList,
//       TaskItem.configure({
//         nested: true,
//       }),
//       Highlight.configure({ multicolor: true }),
//       Blockquote,
//     ],
//     content: initialContent,
//     onUpdate: ({ editor }) => {
//       onSave?.(editor.getHTML());
//     },
//     immediatelyRender: false,
//   });

//   const setLink = useCallback(() => {
//     const { selection } = editor?.state as EditorState;
//     if (selection.empty) {
//       alert("Select where you want to add the link.");
//       return;
//     }
//     const text = editor?.state.doc.textBetween(selection.from, selection.to).trim();
//     if (!text) {
//       alert("Link must be added to text.");
//       return;
//     }
//     const previousUrl = editor?.getAttributes("link").href;
//     const url = window.prompt("Enter your link.", previousUrl);
//     if (url === null || url === "") {
//       return;
//     }
//     editor?.chain().focus().setLink({ href: url }).run();
//   }, [editor]);

//   const addImage = useCallback(() => {
//     const url = window.prompt("Enter image URL");
//     if (url) {
//       editor?.chain().focus().setImage({ src: url }).run();
//     }
//   }, [editor]);

//   const applyColor = useCallback(() => {
//     if (!editor || !selectedColor) return;
//     if (showColorPicker === "text") {
//       editor.chain().focus().setColor(selectedColor).run(); // Apply to selected text
//     } else if (showColorPicker === "highlight") {
//       editor.chain().focus().toggleHighlight({ color: selectedColor }).run();
//     }
//     setShowColorPicker(null);
//     setSelectedColor(null);
//   }, [editor, selectedColor, showColorPicker]);

//   const removeHighlight = useCallback(() => {
//     if (editor) {
//       editor.chain().focus().unsetHighlight().run();
//       setShowColorPicker(null); // Close the modal after removing highlight
//     }
//   }, [editor]);

//   // Handle click outside to close color picker
// useEffect(() => {
//   const handleClickOutside = (event: MouseEvent) => {
//     const target = event.target as Node;

//     setTimeout(() => {
//       const clickedText = textColorPickerRef.current?.contains(target);
//       const clickedHighlight = highlightColorPickerRef.current?.contains(target);

//       if (!clickedText && !clickedHighlight) {
//         setShowColorPicker(null);
//         setSelectedColor(null);
//       }
//     }, 0); // Delay to let color button clicks finish
//   };

//   document.addEventListener("mousedown", handleClickOutside);
//   return () => document.removeEventListener("mousedown", handleClickOutside);
// }, []);


//   useImperativeHandle(ref, () => ({
//     getEditor: () => editor,
//   }));

//   useEffect(() => {
//     if (editor && initialContent !== editor.getHTML()) {
//       editor.commands.setContent(initialContent);
//     }
//   }, [editor, initialContent]);

//   if (!editor) {
//     return null;
//   }

//   return (
//     <div style={{ border: "none", padding: 0, background: "transparent" }}>
//       <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
//         {/* Bold, Italic, Underline */}
//         <button
//           onClick={() => editor.chain().focus().toggleBold().run()}
//           disabled={!editor.can().chain().focus().toggleBold().run()}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: editor.isActive("bold") ? (theme === "light" ? "#E2E6EA" : "#555555") : (theme === "light" ? "#FFFFFF" : "#333333"),
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           <FormatBold />
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//           disabled={!editor.can().chain().focus().toggleItalic().run()}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: editor.isActive("italic") ? (theme === "light" ? "#E2E6EA" : "#555555") : (theme === "light" ? "#FFFFFF" : "#333333"),
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           <FormatItalic />
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleUnderline().run()}
//           disabled={!editor.can().chain().focus().toggleUnderline().run()}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: editor.isActive("underline") ? (theme === "light" ? "#E2E6EA" : "#555555") : (theme === "light" ? "#FFFFFF" : "#333333"),
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           <FormatUnderlined />
//         </button>

//         {/* Text Color Picker */}
//         <div style={{ position: "relative", display: "inline-block" }} ref={textColorPickerRef}>
//           <button
//             onClick={() => setShowColorPicker(showColorPicker === "text" ? null : "text")}
//             style={{
//               padding: "4px 12px",
//               border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//               borderRadius: "4px",
//               background: theme === "light" ? "#FFFFFF" : "#333333",
//               color: theme === "light" ? "#000000" : "#FFFFFF",
//               cursor: "pointer",
//             }}
//           >
//             Text Color
//           </button>
//           {showColorPicker === "text" && (
//             <div style={{
//               position: "absolute",
//               top: "100%",
//               left: 0,
//               display: "flex",
//               flexWrap: "wrap",
//               gap: "4px",
//               padding: "8px",
//               background: theme === "light" ? "#FFFFFF" : "#333333",
//               border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//               borderRadius: "4px",
//               zIndex: 10,
//               maxWidth: "200px",
//             }}>
//               {colorPalette.map((color) => (
//                 <button
//                   key={color}
//                   onClick={(e) => {
//                     e.stopPropagation(); // Prevent closing modal
//                     setSelectedColor(color); // Update selected color
//                     setTimeout(applyColor, 0); 
//                   }}
//                   style={{
//                     width: "24px",
//                     height: "24px",
//                     background: color,
//                     border: "1px solid #000",
//                     cursor: "pointer",
//                     borderRadius: "4px",
//                   }}
//                 />
//               ))}
//               <input
//                 type="text"
//                 value={selectedColor || ""}
//                 onChange={(e) => setSelectedColor(e.target.value)}
//                 placeholder="Enter hex (e.g., #FF0000)"
//                 style={{
//                   padding: "4px",
//                   border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//                   borderRadius: "4px",
//                   background: theme === "light" ? "#FFFFFF" : "#333333",
//                   color: theme === "light" ? "#000000" : "#FFFFFF",
//                 }}
//               />
//               <button
//                 onClick={applyColor}
//                 style={{
//                   padding: "4px 8px",
//                   border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//                   borderRadius: "4px",
//                   background: theme === "light" ? "#FFFFFF" : "#333333",
//                   color: theme === "light" ? "#000000" : "#FFFFFF",
//                   cursor: "pointer",
//                 }}
//               >
//                 Apply
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Highlight Color Picker */}
//         <div style={{ position: "relative", display: "inline-block" }} ref={highlightColorPickerRef}>
//           <button
//             onClick={() => setShowColorPicker(showColorPicker === "highlight" ? null : "highlight")}
//             style={{
//               padding: "4px 12px",
//               border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//               borderRadius: "4px",
//               background: theme === "light" ? "#FFFFFF" : "#333333",
//               color: theme === "light" ? "#000000" : "#FFFFFF",
//               cursor: "pointer",
//             }}
//           >
//             Highlight
//           </button>
//           {showColorPicker === "highlight" && (
//             <div style={{
//               position: "absolute",
//               top: "100%",
//               left: 0,
//               display: "flex",
//               flexWrap: "wrap",
//               gap: "4px",
//               padding: "8px",
//               background: theme === "light" ? "#FFFFFF" : "#333333",
//               border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//               borderRadius: "4px",
//               zIndex: 10,
//               maxWidth: "200px",
//             }}>
//               {colorPalette.map((color) => (
//                 <button
//                   key={color}
//                   onClick={(e) => {
//                     e.stopPropagation(); // Prevent closing modal
//                     setSelectedColor(color); // Update selected color
//                   }}
//                   style={{
//                     width: "24px",
//                     height: "24px",
//                     background: color,
//                     border: "1px solid #000",
//                     cursor: "pointer",
//                     borderRadius: "4px",
//                   }}
//                 />
//               ))}
//               <input
//                 type="text"
//                 value={selectedColor || ""}
//                 onChange={(e) => setSelectedColor(e.target.value)}
//                 placeholder="Enter hex (e.g., #FFFF00)"
//                 style={{
//                   padding: "4px",
//                   border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//                   borderRadius: "4px",
//                   background: theme === "light" ? "#FFFFFF" : "#333333",
//                   color: theme === "light" ? "#000000" : "#FFFFFF",
//                 }}
//               />
//               <button
//                 onClick={applyColor}
//                 style={{
//                   padding: "4px 8px",
//                   border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//                   borderRadius: "4px",
//                   background: theme === "light" ? "#FFFFFF" : "#333333",
//                   color: theme === "light" ? "#000000" : "#FFFFFF",
//                   cursor: "pointer",
//                 }}
//               >
//                 Apply
//               </button>
//               <button
//                 onClick={removeHighlight}
//                 style={{
//                   padding: "4px 8px",
//                   border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//                   borderRadius: "4px",
//                   background: theme === "light" ? "#FFFFFF" : "#333333",
//                   color: theme === "light" ? "#000000" : "#FFFFFF",
//                   cursor: "pointer",
//                 }}
//               >
//                 Remove
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Image Upload and Link Buttons */}
//         {/* <button
//           onClick={addImage}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: theme === "light" ? "#FFFFFF" : "#333333",
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           <AddPhotoAlternate />
//         </button>
//         <button
//           onClick={setLink}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: editor.isActive("link") ? (theme === "light" ? "#E2E6EA" : "#555555") : (theme === "light" ? "#FFFFFF" : "#333333"),
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           <LinkOutlined />
//         </button>
//         <button
//           onClick={() => editor.chain().focus().unsetLink().run()}
//           disabled={!editor.can().chain().focus().unsetLink().run()}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: editor.isActive("link") ? (theme === "light" ? "#FFFFFF" : "#333333") : (theme === "light" ? "#E2E6EA" : "#555555"),
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           <LinkOff />
//         </button> */}

//         {/* Theme Toggle */}
//         <button
//           onClick={() => setTheme(theme === "light" ? "dark" : "light")}
//           style={{
//             padding: "4px 12px",
//             border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555555"}`,
//             borderRadius: "4px",
//             background: theme === "light" ? "#FFFFFF" : "#333333",
//             color: theme === "light" ? "#000000" : "#FFFFFF",
//             cursor: "pointer",
//           }}
//         >
//           {theme === "light" ? "Dark" : "Light"}
//         </button>
//       </div>

//       <EditorContent
//         editor={editor}
//         style={{
//           border: "none",
//           padding: "8px",
//           background: theme === "light" ? "#FFFFFF" : "#333333",
//           color: theme === "light" ? "#000000" : "#FFFFFF",
//         }}
//       />
//     </div>
//   );
// });

// Tiptap.displayName = "Tiptap";
// export default Tiptap;

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
} from "@mui/icons-material";
import Color from "@tiptap/extension-color";
import Dropcursor from "@tiptap/extension-dropcursor";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import CodeBlock from "@tiptap/extension-code-block";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import Blockquote from "@tiptap/extension-blockquote";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { uploadFile } from "@/utils/UploadFile";
import toast from "react-hot-toast";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";

interface TiptapProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  ticketId?: string;
  onPendingAttachment?: (fileData: any) => void;
}

const Tiptap = forwardRef((props: TiptapProps, ref) => {
  const { initialContent = "<p>Add description...</p>", onSave, ticketId, onPendingAttachment } = props;
  const [theme, setTheme] = useState("light");
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector((state) => state.auth.value);
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Underline,
      Dropcursor,
      Placeholder.configure({
        placeholder: "Add description...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:float-left before:text-[#adb5bd] before:h-0 before:pointer-events-none",
      }),
      Color.configure({ types: [TextStyle.name] }),
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      CodeBlock,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({ multicolor: true }),
      Blockquote,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onSave?.(editor.getHTML());
    },
    immediatelyRender: false,
  });

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      try {
        const url = await uploadFile(file); // API call
        if (!url) return;

        const fileData = {
          url,
          name: file.name,
          type: file.type,
          size: file.size,
          uploaded_by: authData.user.id,
          uploaded_at: new Date().toISOString(),
        };

        // Always set pendingFile to show Save/Cancel
        setPendingFile(fileData);

        if (ticketId) {
          // Edit mode → save to backend immediately
          try {
            await axiosInstance.patch(`/task-maangement/add-attachment/${ticketId}`, fileData);
          } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Upload failed!");
          }
        } else {
          // Create mode → return file info via callback
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


  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }));

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(initialContent);
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div style={{ width: "100%", minWidth: "400px", margin: "0 auto" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{
            padding: "4px 12px",
            border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555"}`,
            borderRadius: "4px",
            background: editor.isActive("bold")
              ? theme === "light"
                ? "#E2E6EA"
                : "#555"
              : "#fff",
            color: "#000",
            cursor: "pointer",
          }}
        >
          <FormatBold />
        </button>
        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{
            padding: "4px 12px",
            border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555"}`,
            borderRadius: "4px",
            background: editor.isActive("italic")
              ? theme === "light"
                ? "#E2E6EA"
                : "#555"
              : "#fff",
            color: "#000",
            cursor: "pointer",
          }}
        >
          <FormatItalic />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          style={{
            padding: "4px 12px",
            border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555"}`,
            borderRadius: "4px",
            background: editor.isActive("underline")
              ? theme === "light"
                ? "#E2E6EA"
                : "#555"
              : "#fff",
            color: "#000",
            cursor: "pointer",
          }}
        >
          <FormatUnderlined />
        </button>

        {/* File Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "4px 12px",
            border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555"}`,
            borderRadius: "4px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <AddPhotoAlternate />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "4px 12px",
            border: `1px solid ${theme === "light" ? "#E2E6EA" : "#555"}`,
            borderRadius: "4px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <Attachment />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>

      {/* Editor Area */}
      <EditorContent
        editor={editor}
        style={{
          border: "1px solid #E2E6EA",
          borderRadius: "6px",
          padding: "12px",
          minHeight: "140px",
          background: theme === "light" ? "#fff" : "#333",
          color: theme === "light" ? "#000" : "#fff",
        }}
      />

      {/* Pending File Preview Inside Editor */}
      {pendingFile && (
        <div
          style={{
            border: "1px solid #E2E6EA",
            borderRadius: "6px",
            marginTop: "12px",
            padding: "10px",
            background: "#fafafa",
          }}
        >
          <p>
            <b>File:</b> {pendingFile.name}
          </p>

          {/* Small image preview */}
          {/\.(jpg|jpeg|png|gif|svg)$/i.test(pendingFile.name) && (
            <img
              src={pendingFile.url}
              alt={pendingFile.name}
              style={{
                maxWidth: "120px",
                maxHeight: "80px",
                objectFit: "cover",
                marginBottom: "8px",
                borderRadius: "4px",
              }}
            />
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus()
                  .insertContent(`&nbsp;<a href="${pendingFile.url}" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline; cursor: pointer;">${pendingFile.name}</a>&nbsp;`)
                  .insertContent('<p></p>') // Insert a new paragraph after link
                  .run();
                setPendingFile(null);
              }}
              style={{
                padding: "6px 12px",
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              style={{
                padding: "6px 12px",
                background: "#ccc",
                border: "none",
                borderRadius: "4px",
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
