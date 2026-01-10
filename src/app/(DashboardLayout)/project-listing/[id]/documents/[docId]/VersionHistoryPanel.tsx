"use client";

import React, { useEffect, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RestoreIcon from "@mui/icons-material/Restore";
import HistoryIcon from "@mui/icons-material/History";
import { formatDistanceToNow, format } from "date-fns";
import {
  getVersionHistory,
  restoreVersion,
  DocumentVersion,
} from "@/services/documentService";
import toast from "react-hot-toast";

interface VersionHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  documentId: string;
  onRestore: (content: any) => void;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  open,
  onClose,
  projectId,
  documentId,
  onRestore,
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, projectId, documentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const data = await getVersionHistory(projectId, documentId);
      setVersions(data);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId);
    try {
      const document = await restoreVersion(projectId, documentId, versionId);
      toast.success("Version restored successfully");
      onRestore(document.content);
    } catch (error) {
      console.error("Failed to restore version:", error);
      toast.error("Failed to restore version");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryIcon sx={{ color: "var(--primary-color-1)" }} />
          <Typography variant="h6" fontWeight={600}>
            Version History
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, px: 3 }}>
            <HistoryIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No version history yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Versions are created when you manually save the document
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {versions.map((version, index) => (
              <React.Fragment key={version.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 2,
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          index === 0
                            ? "var(--primary-color-1)"
                            : "grey.400",
                        width: 40,
                        height: 40,
                      }}
                    >
                      {version.created_by?.first_name?.charAt(0) || "V"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          Version {version.version_number}
                        </Typography>
                        {index === 0 && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                        >
                          {version.created_by
                            ? `${version.created_by.first_name} ${version.created_by.last_name}`
                            : "Unknown"}
                        </Typography>
                        <br />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                        >
                          {format(
                            new Date(version.version_created_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                          {" • "}
                          {formatDistanceToNow(new Date(version.version_created_at), {
                            addSuffix: true,
                          })}
                        </Typography>
                        {version.change_summary && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, fontStyle: "italic" }}
                          >
                            "{version.change_summary}"
                          </Typography>
                        )}
                      </>
                    }
                  />
                  {index !== 0 && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        restoring === version.id ? (
                          <CircularProgress size={14} />
                        ) : (
                          <RestoreIcon />
                        )
                      }
                      onClick={() => handleRestore(version.id)}
                      disabled={restoring !== null}
                      sx={{
                        ml: 1,
                        borderColor: "var(--primary-color-1)",
                        color: "var(--primary-color-1)",
                        "&:hover": {
                          borderColor: "var(--primary-color-2)",
                          bgcolor: "rgba(30, 58, 138, 0.05)",
                        },
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </ListItem>
                {index < versions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default VersionHistoryPanel;

