"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Radio,
  CircularProgress,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  Event as EventIcon,
  Code as CodeIcon,
  Assignment as AssignmentIcon,
  Summarize as SummarizeIcon,
  Checklist as ChecklistIcon,
} from "@mui/icons-material";

interface CreateDocumentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, templateType: string) => Promise<void>;
}

interface TemplateOption {
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const TEMPLATES: TemplateOption[] = [
  {
    type: "blank",
    name: "Blank Document",
    description: "Start with a clean slate",
    icon: <DescriptionIcon sx={{ fontSize: 32 }} />,
  },
  {
    type: "meeting_notes",
    name: "Meeting Notes",
    description: "Capture agenda, discussions & action items",
    icon: <EventIcon sx={{ fontSize: 32 }} />,
  },
  {
    type: "sprint_planning",
    name: "Sprint Planning",
    description: "Plan sprint goals, stories & tasks",
    icon: <ChecklistIcon sx={{ fontSize: 32 }} />,
  },
  {
    type: "technical_spec",
    name: "Technical Spec",
    description: "Document architecture & API details",
    icon: <CodeIcon sx={{ fontSize: 32 }} />,
  },
  {
    type: "project_brief",
    name: "Project Brief",
    description: "Overview, objectives & stakeholders",
    icon: <SummarizeIcon sx={{ fontSize: 32 }} />,
  },
  {
    type: "requirements",
    name: "Requirements",
    description: "Functional & non-functional requirements",
    icon: <AssignmentIcon sx={{ fontSize: 32 }} />,
  },
];

const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Document title is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSubmit(title.trim(), selectedTemplate);
      handleClose();
    } catch (err: any) {
      setError(err.message || "Failed to create document");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setSelectedTemplate("blank");
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          fontWeight: 700,
          color: "var(--primary-color-1)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        Create New Document
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <TextField
          autoFocus
          fullWidth
          label="Document Title"
          placeholder="Enter a name for your document..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
          error={!!error}
          helperText={error}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              "& fieldset": {
                borderColor: "var(--primary-color-1)",
              },
              "&:hover fieldset": {
                borderColor: "var(--primary-color-2)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "var(--primary-color-2)",
              },
            },
          }}
        />

        <Typography
          variant="subtitle1"
          sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}
        >
          Choose a Template
        </Typography>

        <Grid container spacing={2}>
          {TEMPLATES.map((template) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.type}>
              <Card
                onClick={() => setSelectedTemplate(template.type)}
                sx={{
                  cursor: "pointer",
                  position: "relative",
                  border: "2px solid",
                  borderColor:
                    selectedTemplate === template.type
                      ? "var(--primary-color-1)"
                      : "transparent",
                  bgcolor:
                    selectedTemplate === template.type
                      ? "rgba(30, 58, 138, 0.05)"
                      : "grey.50",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor:
                      selectedTemplate === template.type
                        ? "var(--primary-color-1)"
                        : "grey.300",
                    boxShadow: 2,
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                    }}
                  >
                    <Radio
                      checked={selectedTemplate === template.type}
                      size="small"
                      sx={{
                        p: 0,
                        color: "var(--primary-color-1)",
                        "&.Mui-checked": {
                          color: "var(--primary-color-1)",
                        },
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            color:
                              selectedTemplate === template.type
                                ? "var(--primary-color-1)"
                                : "text.secondary",
                          }}
                        >
                          {template.icon}
                        </Box>
                      </Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color:
                            selectedTemplate === template.type
                              ? "var(--primary-color-1)"
                              : "text.primary",
                        }}
                      >
                        {template.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", display: "block" }}
                      >
                        {template.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: "text.secondary",
            "&:hover": {
              bgcolor: "grey.100",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            bgcolor: "var(--primary-color-1)",
            "&:hover": {
              bgcolor: "var(--primary-color-2)",
            },
            px: 3,
            borderRadius: 2,
          }}
        >
          {loading ? "Creating..." : "Create Document"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateDocumentModal;

