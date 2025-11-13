"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import toast from "react-hot-toast";

enum EmployeeDocumentType {
  JOINING_LETTER = "JOINING_LETTER",
  APPRECIATION_LETTER = "APPRECIATION_LETTER",
  WARNING_LETTER = "WARNING_LETTER",
  TERMINATION_LETTER = "TERMINATION_LETTER",
  CONTRACT = "CONTRACT",
  NDA = "NDA",
  OTHER = "OTHER",
}

interface EmployeeDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  document_type: EmployeeDocumentType;
  description?: string;
  uploaded_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  uploaded_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const documentTypeLabels: Record<EmployeeDocumentType, string> = {
  JOINING_LETTER: "Joining Letter",
  APPRECIATION_LETTER: "Appreciation Letter",
  WARNING_LETTER: "Warning Letter",
  TERMINATION_LETTER: "Termination Letter",
  CONTRACT: "Contract",
  NDA: "NDA",
  OTHER: "Other",
};

export default function EmployeeDocuments() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [documentType, setDocumentType] = useState<EmployeeDocumentType>(
    EmployeeDocumentType.OTHER
  );
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);

  const axiosInstance = createAxiosInstance();
  const userInfo = useAppselector((state) => state.user.user);
  const role = useAppselector((state) => state.role.value);
  const isAdmin = role?.priority !== undefined && role.priority <= 2;

  useEffect(() => {
    fetchDocuments();
    if (isAdmin) {
      fetchUsers();
    }
  }, [filterUserId, isAdmin]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterUserId) {
        params.user_id = filterUserId;
      }
      const response = await axiosInstance.get("/organization/employee-documents", {
        params,
      });
      setDocuments(response.data?.data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/user/list");
      const list: UserOption[] = (response.data?.data || []).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }));
      setUsers(list);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedUser || !file) {
      toast.error("Please select an employee and a file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      if (description) {
        formData.append("description", description);
      }

      await axiosInstance.post(
        `/organization/employee-documents/${selectedUser.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      setFile(null);
      setSelectedUser(null);
      setDescription("");
      setDocumentType(EmployeeDocumentType.OTHER);
      fetchDocuments();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/organization/employee-documents/${documentId}`);
      toast.success("Document deleted successfully");
      fetchDocuments();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete document"
      );
    }
  };

  const handleDownload = (document: EmployeeDocument) => {
    window.open(document.file_url, "_blank");
  };

  const handleView = (document: EmployeeDocument) => {
    setSelectedDocument(document);
    setViewDialogOpen(true);
  };

  const isImageFile = (doc: EmployeeDocument) => {
    return (
      doc.file_type?.startsWith("image/") ||
      [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].some((ext) =>
        doc.file_name?.toLowerCase().endsWith(ext)
      )
    );
  };

  const isPdfFile = (doc: EmployeeDocument) => {
    return (
      doc.file_type === "application/pdf" ||
      doc.file_name?.toLowerCase().endsWith(".pdf")
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredDocuments = useMemo(() => {
    if (!filterUserId) return documents;
    return documents.filter((doc) => doc.user.id === filterUserId);
  }, [documents, filterUserId]);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={600}>
          Employee Documents
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        )}
      </Box>

      {isAdmin && (
        <Box mb={3}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) =>
              `${option.first_name} ${option.last_name} (${option.email})`
            }
            value={users.find((u) => u.id === filterUserId) || null}
            onChange={(_, value) => setFilterUserId(value?.id || null)}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Employee" />
            )}
            sx={{ maxWidth: 400 }}
          />
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Document Type</TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Uploaded At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No documents found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    {doc.user.first_name} {doc.user.last_name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={documentTypeLabels[doc.document_type]}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon fontSize="small" />
                      {doc.file_name}
                    </Box>
                  </TableCell>
                  <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  <TableCell>{doc.description || "-"}</TableCell>
                  <TableCell>
                    {doc.uploaded_by
                      ? `${doc.uploaded_by.first_name} ${doc.uploaded_by.last_name}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleView(doc)}
                      color="primary"
                      title="View Document"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(doc)}
                      color="primary"
                      title="Download Document"
                    >
                      <DownloadIcon />
                    </IconButton>
                    {(isAdmin ||
                      doc.uploaded_by?.id === userInfo?.id) && (
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(doc.id)}
                        color="error"
                        title="Delete Document"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Employee Document</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Autocomplete
              options={users}
              getOptionLabel={(option) =>
                `${option.first_name} ${option.last_name} (${option.email})`
              }
              value={selectedUser}
              onChange={(_, value) => setSelectedUser(value)}
              renderInput={(params) => (
                <TextField {...params} label="Employee" required />
              )}
            />
            <TextField
              select
              label="Document Type"
              value={documentType}
              onChange={(e) =>
                setDocumentType(e.target.value as EmployeeDocumentType)
              }
              fullWidth
              required
            >
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {file ? file.name : "Select File"}
              <input
                type="file"
                hidden
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedUser || !file}
          >
            {uploading ? <CircularProgress size={20} /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedDocument?.file_name || "Document Viewer"}
            </Typography>
            <IconButton onClick={() => setViewDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {selectedDocument && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "grey.100",
                overflow: "auto",
                p: 2,
              }}
            >
              {isPdfFile(selectedDocument) ? (
                <iframe
                  src={`${selectedDocument.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "600px",
                    border: "none",
                  }}
                  title={selectedDocument.file_name}
                />
              ) : isImageFile(selectedDocument) ? (
                <img
                  src={selectedDocument.file_url}
                  alt={selectedDocument.file_name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <Box textAlign="center" p={4}>
                  <DescriptionIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Preview not available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    This file type cannot be previewed in the browser
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(selectedDocument)}
                  >
                    Download to View
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedDocument && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(selectedDocument)}
            >
              Download
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

