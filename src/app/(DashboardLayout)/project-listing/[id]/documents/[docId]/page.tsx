"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  AvatarGroup,
  Tooltip,
  Chip,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControl,
  Select,
  InputLabel,
  Popover,
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import HistoryIcon from "@mui/icons-material/History";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CommentIcon from "@mui/icons-material/Comment";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import SecurityIcon from "@mui/icons-material/Security";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import createAxiosInstance from "@/app/axiosInstance";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
import {
  useDocumentCollaboration,
  CollaboratorPresence,
} from "@/hooks/useDocumentCollaboration";
import {
  getDocument,
  updateDocument,
  deleteDocument,
  lockDocument,
  createVersion,
  ProjectDocument,
  PermissionLevel,
} from "@/services/documentService";
import { useAppselector } from "@/redux/store";
import { EditorSettings } from "./DocumentEditor";

// Dynamically import Tiptap to avoid SSR issues
const DocumentEditor = dynamic(() => import("./DocumentEditor"), {
  ssr: false,
  loading: () => <CircularProgress />,
});

const VersionHistoryPanel = dynamic(() => import("./VersionHistoryPanel"), {
  ssr: false,
});

const PermissionsModal = dynamic(() => import("./PermissionsModal"), {
  ssr: false,
});

// Status indicator component
const StatusIndicator: React.FC<{
  status: "viewing" | "editing" | "commenting";
}> = ({ status }) => {
  const statusConfig = {
    viewing: {
      color: "#10B981",
      icon: <VisibilityIcon sx={{ fontSize: 12 }} />,
    },
    editing: { color: "#F59E0B", icon: <EditIcon sx={{ fontSize: 12 }} /> },
    commenting: {
      color: "#6366F1",
      icon: <CommentIcon sx={{ fontSize: 12 }} />,
    },
  };

  const config = statusConfig[status];

  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: config.color,
        position: "absolute",
        bottom: 0,
        right: 0,
        border: "2px solid white",
      }}
    />
  );
};

// Collaborator avatars - show ALL users including current user with hover tooltips
const CollaboratorAvatars: React.FC<{
  collaborators: CollaboratorPresence[];
  currentUserId: string;
  currentUserName?: string;
  currentUserImage?: string;
}> = ({ collaborators, currentUserId, currentUserName, currentUserImage }) => {
  // Get status label
  const getStatusLabel = (status: "viewing" | "editing" | "commenting") => {
    switch (status) {
      case "editing":
        return "Editing";
      case "commenting":
        return "Commenting";
      default:
        return "Viewing";
    }
  };

  // Create a list of all users including current user if not already in collaborators
  const allUsers = useMemo(() => {
    const existingIds = new Set(collaborators.map((c) => c.id));
    const users = [...collaborators];

    // Add current user if not in list
    if (currentUserId && !existingIds.has(currentUserId)) {
      users.unshift({
        id: currentUserId,
        name: currentUserName || "You",
        color: "#4CAF50", // Green for current user
        status: "editing" as const,
        profileImage: currentUserImage,
      });
    }

    // Sort to put current user first
    return users.sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;
      return 0;
    });
  }, [collaborators, currentUserId, currentUserName, currentUserImage]);

  if (allUsers.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {allUsers.map((collaborator) => {
        const isCurrentUser = collaborator.id === currentUserId;

        return (
          <Tooltip
            key={collaborator.id}
            title={
              <Box sx={{ textAlign: "center", py: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {isCurrentUser
                    ? `${collaborator.name} (You)`
                    : collaborator.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {getStatusLabel(collaborator.status)}
                </Typography>
              </Box>
            }
            arrow
            placement="bottom"
          >
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.1)",
                  zIndex: 10,
                },
              }}
            >
              <Avatar
                src={
                  collaborator.profileImage ||
                  "/images/profile/defaultprofile.jpg"
                }
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 14,
                  border: `2px solid ${collaborator.color}`,
                  bgcolor: collaborator.color,
                  boxShadow: isCurrentUser
                    ? "0 0 0 2px #fff, 0 2px 8px rgba(76, 175, 80, 0.4)"
                    : "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {collaborator.name.charAt(0).toUpperCase()}
              </Avatar>
              <StatusIndicator status={collaborator.status} />
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
};

// Editor Settings Popover
const EditorSettingsPopover: React.FC<{
  anchorEl: HTMLElement | null;
  onClose: () => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
}> = ({ anchorEl, onClose, settings, onSettingsChange }) => {
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: { p: 3, minWidth: 320, borderRadius: 2 },
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Editor Settings
      </Typography>

      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
        <InputLabel>Page Width</InputLabel>
        <Select
          value={settings.pageWidth}
          label="Page Width"
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              pageWidth: e.target.value as EditorSettings["pageWidth"],
            })
          }
        >
          <MenuItem value="full">Full Width</MenuItem>
          <MenuItem value="wide">Wide (1200px)</MenuItem>
          <MenuItem value="medium">Medium (900px)</MenuItem>
          <MenuItem value="narrow">Narrow (680px)</MenuItem>
        </Select>
      </FormControl>

      {/* Show Rulers Toggle */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Show Rulers
        </Typography>
        <Switch
          checked={settings.showRulers}
          onChange={(e) =>
            onSettingsChange({ ...settings, showRulers: e.target.checked })
          }
          size="small"
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: "var(--primary-color-1)",
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              backgroundColor: "var(--primary-color-1)",
            },
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" fontWeight={600} gutterBottom>
        Margins
      </Typography>

      {/* Horizontal Margins */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Left: {settings.marginLeft}px
            </Typography>
            <Slider
              value={settings.marginLeft}
              onChange={(_, value) =>
                onSettingsChange({ ...settings, marginLeft: value as number })
              }
              min={0}
              max={150}
              step={10}
              size="small"
              sx={{ color: "var(--primary-color-1)" }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Right: {settings.marginRight}px
            </Typography>
            <Slider
              value={settings.marginRight}
              onChange={(_, value) =>
                onSettingsChange({ ...settings, marginRight: value as number })
              }
              min={0}
              max={150}
              step={10}
              size="small"
              sx={{ color: "var(--primary-color-1)" }}
            />
          </Box>
        </Box>
      </Box>

      {/* Vertical Margins */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Top: {settings.marginTop}px
            </Typography>
            <Slider
              value={settings.marginTop}
              onChange={(_, value) =>
                onSettingsChange({ ...settings, marginTop: value as number })
              }
              min={0}
              max={150}
              step={10}
              size="small"
              sx={{ color: "var(--primary-color-1)" }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Bottom: {settings.marginBottom}px
            </Typography>
            <Slider
              value={settings.marginBottom}
              onChange={(_, value) =>
                onSettingsChange({ ...settings, marginBottom: value as number })
              }
              min={0}
              max={150}
              step={10}
              size="small"
              sx={{ color: "var(--primary-color-1)" }}
            />
          </Box>
        </Box>
      </Box>

      {/* Quick Presets */}
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          gutterBottom
          display="block"
        >
          Quick Presets
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              onSettingsChange({
                ...settings,
                marginLeft: 0,
                marginRight: 0,
                marginTop: 0,
                marginBottom: 0,
              })
            }
            sx={{
              fontSize: 11,
              textTransform: "none",
              borderColor: "#e0e0e0",
              color: "text.secondary",
              "&:hover": { borderColor: "var(--primary-color-1)" },
            }}
          >
            No Margin
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              onSettingsChange({
                ...settings,
                marginLeft: 40,
                marginRight: 40,
                marginTop: 20,
                marginBottom: 20,
              })
            }
            sx={{
              fontSize: 11,
              textTransform: "none",
              borderColor: "#e0e0e0",
              color: "text.secondary",
              "&:hover": { borderColor: "var(--primary-color-1)" },
            }}
          >
            Normal
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              onSettingsChange({
                ...settings,
                marginLeft: 80,
                marginRight: 80,
                marginTop: 40,
                marginBottom: 40,
              })
            }
            sx={{
              fontSize: 11,
              textTransform: "none",
              borderColor: "#e0e0e0",
              color: "text.secondary",
              "&:hover": { borderColor: "var(--primary-color-1)" },
            }}
          >
            Wide
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

const DocumentEditorPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const documentId = params?.docId as string;

  const authData = useAppselector((state) => state.auth.value);
  const axiosInstance = useMemo(() => createAxiosInstance(), []);

  const [document, setDocument] = useState<ProjectDocument | null>(null);
  const [userPermission, setUserPermission] = useState<PermissionLevel>("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");

  // Editor settings
  const [editorSettings, setEditorSettings] = useState<EditorSettings>({
    pageWidth: "full",
    marginLeft: 40,
    marginRight: 40,
    marginTop: 20,
    marginBottom: 20,
    showRulers: true,
  });
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null,
  );

  // Panels
  const [historyOpen, setHistoryOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  // Menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Editor content ref
  const contentRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const [remoteContent, setRemoteContent] = useState<any>(null);

  // Handle incoming content updates from other users
  const handleRemoteContentUpdate = useCallback(
    (content: any, from: string) => {
      // Avoid applying our own updates
      const currentUserId = authData?.user?.id?.toString();
      if (from !== currentUserId) {
        isRemoteUpdateRef.current = true;
        setRemoteContent(content);
        // Reset flag after a short delay
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }
    },
    [authData?.user?.id],
  );

  // Collaboration hook
  const {
    connected,
    collaborators,
    lastSaved,
    savedBy,
    saveContent,
    sendStatusChange,
    sendSelectionChange,
    broadcastContentUpdate,
  } = useDocumentCollaboration({
    projectId,
    documentId,
    enabled: !!document && userPermission !== "view",
    onContentUpdate: handleRemoteContentUpdate,
  });

  // Handle selection changes from local editor
  const handleSelectionChange = useCallback(
    (selection: { from: number; to: number }) => {
      // Store current cursor position for use in content broadcasts
      cursorPositionRef.current = selection;
      // Also broadcast selection change separately for immediate cursor updates
      sendSelectionChange(selection.from, selection.to);
    },
    [sendSelectionChange],
  );

  // Get cursor data for other collaborators (excluding current user)
  const collaboratorCursors = useMemo(() => {
    const currentUserId = authData?.user?.id?.toString();
    return collaborators
      .filter((c) => c.id !== currentUserId && (c.cursor || c.selection))
      .map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        cursor: c.cursor,
        selection: c.selection,
      }));
  }, [collaborators, authData?.user?.id]);

  // Fetch document
  useEffect(() => {
    const fetchDoc = async () => {
      if (!projectId || !documentId) return;
      setLoading(true);
      try {
        const result = await getDocument(projectId, documentId);
        setDocument(result.document);
        setUserPermission(result.userPermission);
        setTitleValue(result.document.title);
      } catch (error: any) {
        console.error("Failed to fetch document:", error);
        toast.error(error.response?.data?.message || "Failed to load document");
        router.push(`/project-listing/${projectId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [projectId, documentId, router]);

  // Track current cursor position
  const cursorPositionRef = useRef<{ from: number; to: number } | null>(null);

  // Auto-save and real-time broadcast
  const handleContentChange = useCallback(
    (content: any) => {
      contentRef.current = content;

      // Don't broadcast if this is a remote update we're applying
      if (!isRemoteUpdateRef.current && userPermission === "edit") {
        // Broadcast to other users immediately with cursor position
        broadcastContentUpdate(content, cursorPositionRef.current || undefined);
      }

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new auto-save timer (5 seconds debounce)
      autoSaveTimerRef.current = setTimeout(() => {
        if (contentRef.current && userPermission === "edit") {
          saveContent(contentRef.current);
        }
      }, 5000);
    },
    [userPermission, saveContent, broadcastContentUpdate],
  );

  // Manual save
  const handleSave = async () => {
    if (!document || !contentRef.current) return;
    setSaving(true);
    try {
      await updateDocument(projectId, documentId, {
        content: contentRef.current,
      });
      await createVersion(projectId, documentId, "Manual save");
      toast.success("Document saved");
    } catch (error: any) {
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  // Update title
  const handleTitleUpdate = async () => {
    if (!document || !titleValue.trim() || titleValue === document.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const updated = await updateDocument(projectId, documentId, {
        title: titleValue.trim(),
      });
      setDocument(updated);
      toast.success("Title updated");
    } catch (error: any) {
      toast.error("Failed to update title");
      setTitleValue(document.title);
    }
    setEditingTitle(false);
  };

  // Lock/unlock document
  const handleToggleLock = async () => {
    if (!document) return;
    try {
      const updated = await lockDocument(
        projectId,
        documentId,
        !document.is_locked,
      );
      setDocument(updated);
      toast.success(
        updated.is_locked ? "Document locked" : "Document unlocked",
      );
    } catch (error: any) {
      toast.error("Failed to update lock status");
    }
    setMenuAnchor(null);
  };

  // Delete document
  const handleDelete = async () => {
    try {
      await deleteDocument(projectId, documentId);
      toast.success("Document deleted");
      router.push(`/project-listing/${projectId}`);
    } catch (error: any) {
      toast.error("Failed to delete document");
    }
    setDeleteDialogOpen(false);
  };

  // Export document as DOCX (Microsoft Word / Google Docs compatible)
  const handleExportDocx = async () => {
    setMenuAnchor(null);

    try {
      // Get the current content HTML
      const content = contentRef.current || document.content;

      // Create a styled HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${document.title}</title>
          <style>
            body { 
              font-family: 'Calibri', 'Arial', sans-serif; 
              font-size: 11pt; 
              line-height: 1.6; 
              margin: 1in;
            }
            h1 { font-size: 24pt; font-weight: bold; margin-bottom: 12pt; }
            h2 { font-size: 18pt; font-weight: bold; margin-bottom: 10pt; }
            h3 { font-size: 14pt; font-weight: bold; margin-bottom: 8pt; }
            p { margin-bottom: 8pt; }
            ul, ol { margin-left: 20pt; margin-bottom: 8pt; }
            li { margin-bottom: 4pt; }
            blockquote { 
              border-left: 3pt solid #ccc; 
              padding-left: 10pt; 
              margin-left: 0; 
              color: #666; 
            }
            pre { 
              background: #f5f5f5; 
              padding: 10pt; 
              border-radius: 4pt; 
              font-family: 'Consolas', 'Monaco', monospace;
              font-size: 10pt;
            }
            code { 
              background: #f0f0f0; 
              padding: 2pt 4pt; 
              border-radius: 2pt;
              font-family: 'Consolas', 'Monaco', monospace;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-bottom: 12pt;
            }
            td, th { 
              border: 1pt solid #ddd; 
              padding: 8pt; 
              text-align: left; 
            }
            th { background: #f5f5f5; font-weight: bold; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1>${document.title}</h1>
          ${typeof content === "string" ? content : JSON.stringify(content)}
        </body>
        </html>
      `;

      // Convert HTML to Blob with .doc MIME type (Word will open it)
      const blob = new Blob([htmlContent], {
        type: "application/msword",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.title.replace(/[^a-z0-9]/gi, "_")}.doc`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        "Document exported as .doc (compatible with MS Word & Google Docs)",
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    }
  };

  // Export as HTML
  const handleExportHtml = async () => {
    setMenuAnchor(null);

    try {
      const content = contentRef.current || document.content;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${document.title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              line-height: 1.6;
              color: #333;
            }
            h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
            pre { 
              background: #1e1e1e; 
              color: #d4d4d4;
              padding: 16px; 
              border-radius: 8px; 
              overflow-x: auto;
            }
            code { 
              background: #f0f0f0; 
              padding: 2px 6px; 
              border-radius: 4px;
            }
            blockquote { 
              border-left: 4px solid #1976d2; 
              margin-left: 0;
              padding-left: 16px;
              color: #666;
            }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ddd; padding: 12px; }
            th { background: #f5f5f5; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <h1>${document.title}</h1>
          ${typeof content === "string" ? content : JSON.stringify(content)}
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.title.replace(/[^a-z0-9]/gi, "_")}.html`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Document exported as HTML");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    }
  };

  // Export as PDF (print dialog)
  const handleExportPdf = () => {
    setMenuAnchor(null);

    const content = contentRef.current || document.content;
    const htmlContent = typeof content === "string" ? content : "";

    // Open print dialog in new window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${document.title}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              line-height: 1.6;
            }
            h1, h2, h3 { margin-top: 1.5em; }
            pre { background: #f5f5f5; padding: 16px; border-radius: 8px; }
            code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
            blockquote { border-left: 4px solid #1976d2; padding-left: 16px; margin-left: 0; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ddd; padding: 12px; }
          </style>
        </head>
        <body>
          <h1>${document.title}</h1>
          ${htmlContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    toast.success("Print dialog opened - Save as PDF from print options");
  };

  // Navigate back
  const handleBack = () => {
    router.push(`/project-listing/${projectId}`);
  };

  // Check if user can edit
  const canEdit = userPermission === "edit" && !document?.is_locked;
  // Check if user is admin or manager (priority 1 = Super Admin, 2 = Admin, 3 = Manager)
  const isAdminOrManager =
    authData?.role?.priority && authData.role.priority <= 3;

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!document) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Document not found
        </Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Project
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "white",
        overflow: "hidden",
      }}
    >
      {/* Header - Fixed at top */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "white",
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1.5,
          }}
        >
          {/* Left section */}
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={handleBack} size="small">
              <ArrowBackIcon />
            </IconButton>

            {editingTitle ? (
              <TextField
                autoFocus
                size="small"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleUpdate}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleUpdate();
                  if (e.key === "Escape") {
                    setTitleValue(document.title);
                    setEditingTitle(false);
                  }
                }}
                sx={{ minWidth: 250 }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  cursor: canEdit ? "pointer" : "default",
                }}
                onClick={() => canEdit && setEditingTitle(true)}
              >
                <Typography variant="h6" fontWeight={600}>
                  {document.title}
                </Typography>
                {document.is_locked && (
                  <Tooltip title="This document is locked - only users with permissions can edit">
                    <LockIcon sx={{ fontSize: 18, color: "warning.main" }} />
                  </Tooltip>
                )}
              </Box>
            )}

            {/* Connection status */}
            <Chip
              size="small"
              label={connected ? "Online" : "Offline"}
              color={connected ? "success" : "default"}
              variant="outlined"
              sx={{ fontSize: 11 }}
            />
          </Stack>

          {/* Right section */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Collaborators */}
            <CollaboratorAvatars
              collaborators={collaborators}
              currentUserId={authData?.user?.id?.toString() || ""}
              currentUserName={
                authData?.user?.first_name
                  ? `${authData.user.first_name} ${authData.user.last_name || ""}`.trim()
                  : "You"
              }
              currentUserImage={authData?.user?.profile_image}
            />

            {/* Auto-save status */}
            {lastSaved && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mr: 1 }}
              >
                Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
                {savedBy && ` by ${savedBy}`}
              </Typography>
            )}

            <Divider orientation="vertical" flexItem />

            {/* Save button */}
            {canEdit && (
              <Button
                variant="contained"
                size="small"
                startIcon={
                  saving ? <CircularProgress size={14} /> : <SaveIcon />
                }
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: "var(--primary-color-1)",
                  "&:hover": { bgcolor: "var(--primary-color-2)" },
                }}
              >
                Save
              </Button>
            )}

            {/* Version History */}
            <Tooltip title="Version History">
              <IconButton onClick={() => setHistoryOpen(true)}>
                <HistoryIcon />
              </IconButton>
            </Tooltip>

            {/* Lock/Unlock for admins - Direct button */}
            {isAdminOrManager && (
              <Tooltip
                title={document.is_locked ? "Unlock Document" : "Lock Document"}
              >
                <IconButton
                  onClick={handleToggleLock}
                  sx={{
                    color: document.is_locked
                      ? "warning.main"
                      : "text.secondary",
                  }}
                >
                  {document.is_locked ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
              </Tooltip>
            )}

            {/* Permissions for admins */}
            {isAdminOrManager && (
              <Tooltip title="Manage Permissions">
                <IconButton onClick={() => setPermissionsOpen(true)}>
                  <SecurityIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Editor Settings */}
            <Tooltip title="Editor Settings">
              <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
                <TuneIcon />
              </IconButton>
            </Tooltip>

            {/* More options */}
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

      {/* Editor Container - DocumentEditor handles its own scrolling */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          py: 2,
          px: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DocumentEditor
          initialContent={document.content}
          remoteContent={remoteContent}
          collaboratorCursors={collaboratorCursors}
          readOnly={!canEdit}
          onContentChange={handleContentChange}
          onSelectionChange={handleSelectionChange}
          onStatusChange={sendStatusChange}
          settings={editorSettings}
          onSettingsChange={setEditorSettings}
        />
      </Box>

      {/* Editor Settings Popover */}
      <EditorSettingsPopover
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        settings={editorSettings}
        onSettingsChange={setEditorSettings}
      />

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {isAdminOrManager && (
          <MenuItem onClick={handleToggleLock}>
            <ListItemIcon>
              {document.is_locked ? <LockOpenIcon /> : <LockIcon />}
            </ListItemIcon>
            <ListItemText>
              {document.is_locked ? "Unlock Document" : "Lock Document"}
            </ListItemText>
          </MenuItem>
        )}
        {isAdminOrManager && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              setPermissionsOpen(true);
            }}
          >
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText>Manage Permissions</ListItemText>
          </MenuItem>
        )}
        <Divider />

        {/* Export Options */}
        <MenuItem onClick={handleExportDocx}>
          <ListItemIcon>
            <DescriptionIcon sx={{ color: "#2b579a" }} />
          </ListItemIcon>
          <ListItemText
            primary="Export as Word (.doc)"
            secondary="Compatible with MS Word & Google Docs"
          />
        </MenuItem>
        <MenuItem onClick={handleExportHtml}>
          <ListItemIcon>
            <DownloadIcon sx={{ color: "#e44d26" }} />
          </ListItemIcon>
          <ListItemText primary="Export as HTML" secondary="Web format" />
        </MenuItem>
        <MenuItem onClick={handleExportPdf}>
          <ListItemIcon>
            <DownloadIcon sx={{ color: "#ff0000" }} />
          </ListItemIcon>
          <ListItemText primary="Export as PDF" secondary="Print to PDF" />
        </MenuItem>

        <Divider />
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            setDeleteDialogOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
          </ListItemIcon>
          <ListItemText>Delete Document</ListItemText>
        </MenuItem>
      </Menu>

      {/* Version History Panel */}
      {historyOpen && (
        <VersionHistoryPanel
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          projectId={projectId}
          documentId={documentId}
          onRestore={(content) => {
            setDocument((prev) => (prev ? { ...prev, content } : prev));
            setHistoryOpen(false);
          }}
        />
      )}

      {/* Permissions Modal */}
      {permissionsOpen && (
        <PermissionsModal
          open={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
          projectId={projectId}
          documentId={documentId}
          document={document}
          onLockChange={(isLocked) => {
            setDocument((prev) =>
              prev ? { ...prev, is_locked: isLocked } : prev,
            );
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Document?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{document.title}"? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentEditorPage;
