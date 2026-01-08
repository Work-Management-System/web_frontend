"use client";

import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DescriptionIcon from "@mui/icons-material/Description";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import createAxiosInstance from "@/app/axiosInstance";
import toast from "react-hot-toast";

interface ProjectAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
  uploaded_by?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(Number(bytes)) || Number(bytes) <= 0) {
    return "--";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = Number(bytes);
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const precision = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

const isImageFile = (file: ProjectAttachment) =>
  !!file.file_type?.startsWith("image/") ||
  [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].some((ext) =>
    file.file_name?.toLowerCase().endsWith(ext)
  );

const isPdfFile = (file: ProjectAttachment) =>
  file.file_type === "application/pdf" ||
  file.file_name?.toLowerCase().endsWith(".pdf");

const ProjectFilesPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Extract values immediately to avoid enumeration warnings
  const projectId = useMemo(() => (params?.id as string) || undefined, [params]);
  const initialFileId = useMemo(() => searchParams?.get("file") || undefined, [searchParams]);

  const axiosInstance = useMemo(() => createAxiosInstance(), []);

  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttachment, setSelectedAttachment] =
    useState<ProjectAttachment | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchAttachments = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/project-management/${projectId}/attachments`
        );
        const attachmentData: ProjectAttachment[] = (res.data?.data || []).map(
          (item: ProjectAttachment) => ({
            ...item,
            file_size: item.file_size ? Number(item.file_size) : undefined,
          })
        );
        setAttachments(attachmentData);

        if (attachmentData.length > 0) {
          const initial =
            attachmentData.find((file) => file.id === initialFileId) ||
            attachmentData[0];
          setSelectedAttachment(initial);
        } else {
          setSelectedAttachment(null);
        }
      } catch (error) {
        console.error("Failed to fetch project attachments:", error);
        toast.error("Failed to load project files");
        setAttachments([]);
        setSelectedAttachment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [projectId, initialFileId, axiosInstance]);

  const handleNavigateBack = () => {
    if (projectId) {
      router.push(`/project-listing/${projectId}`);
    } else {
      router.back();
    }
  };

  return (
    <Box sx={{ py: 3, px: { xs: 1, md: 2 } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        spacing={2}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={handleNavigateBack}
            sx={{
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Project Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and preview all shared documents for this project.
            </Typography>
          </Box>
        </Stack>
        {selectedAttachment && (
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            component="a"
            href={selectedAttachment.file_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download File
          </Button>
        )}
      </Stack>

      {loading ? (
        <Box
          sx={{
            height: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : attachments.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: "1px dashed",
            borderColor: "divider",
            bgcolor: "background.paper",
            textAlign: "center",
          }}
        >
          <CardContent sx={{ py: 8 }}>
            <DescriptionIcon
              sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              No files available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload project documents from the project details page to view
              them here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="stretch"
        >
          <Card
            sx={{
              width: { xs: "100%", md: 320 },
              flexShrink: 0,
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ px: 3, py: 2 }}
              >
                Files
              </Typography>
              <Divider />
              <List disablePadding>
                {attachments.map((file) => {
                  const uploadedAt = file.uploaded_at
                    ? new Date(file.uploaded_at)
                    : null;
                  const relativeTime =
                    uploadedAt && !Number.isNaN(uploadedAt.getTime())
                      ? formatDistanceToNow(uploadedAt, { addSuffix: true })
                      : "";
                  const uploaderName = file.uploaded_by
                    ? `${file.uploaded_by.first_name || ""} ${
                        file.uploaded_by.last_name || ""
                      }`.trim()
                    : "";

                  const selected = selectedAttachment?.id === file.id;

                  return (
                    <ListItem key={file.id} disablePadding>
                      <ListItemButton
                        selected={selected}
                        onClick={() => setSelectedAttachment(file)}
                        sx={{
                          alignItems: "flex-start",
                          py: 2,
                          px: 3,
                          "&.Mui-selected": {
                            bgcolor: "rgba(59, 130, 246, 0.08)",
                          },
                        }}
                      >
                        <DescriptionIcon
                          sx={{ mt: 0.5, mr: 2, color: "text.secondary" }}
                        />
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {file.file_name}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="span"
                            >
                              {formatFileSize(file.file_size)}
                              {relativeTime && ` • ${relativeTime}`}
                              {uploaderName && ` • ${uploaderName}`}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>

          <Card
            sx={{
              flexGrow: 1,
              borderRadius: 3,
              minHeight: 420,
              position: "relative",
            }}
          >
            <CardContent
              sx={{
                height: "100%",
                p: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selectedAttachment ? (
                <>
                  <Box sx={{ px: 3, py: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedAttachment.file_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(selectedAttachment.file_size)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box
                    sx={{
                      flexGrow: 1,
                      minHeight: { xs: 340, md: 520 },
                      bgcolor: "background.default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                    }}
                  >
                    {isImageFile(selectedAttachment) ? (
                      <Box
                        component="img"
                        src={selectedAttachment.file_url}
                        alt={selectedAttachment.file_name}
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          borderRadius: 2,
                          objectFit: "contain",
                          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                        }}
                      />
                    ) : isPdfFile(selectedAttachment) ? (
                      <Box
                        component="iframe"
                        src={selectedAttachment.file_url}
                        title={selectedAttachment.file_name}
                        sx={{
                          border: "none",
                          width: "100%",
                          height: "100%",
                          borderRadius: 2,
                        }}
                      />
                    ) : (
                      <Stack
                        spacing={2}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ textAlign: "center" }}
                      >
                        <DescriptionIcon sx={{ fontSize: 56 }} />
                        <Typography variant="body2" color="text.secondary">
                          Preview not available for this file type.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<CloudDownloadIcon />}
                          component="a"
                          href={selectedAttachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download to view
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body2">
                    Select a file from the list to preview it here.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};

export default ProjectFilesPage;
