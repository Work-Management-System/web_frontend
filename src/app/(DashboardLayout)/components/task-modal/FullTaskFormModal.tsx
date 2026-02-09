"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  IconButton,
  Autocomplete,
  FormControl,
  Paper,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
} from "@mui/material";
import {
  Cancel,
  Person,
  Folder,
  Info,
  Warning,
  CheckCircle,
  AccessTime,
  Add as AddIcon,
  Compress,
} from "@mui/icons-material";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import toast from "react-hot-toast";
import RequiredLabel from "../../layout/shared/logo/RequiredLabel";
import { EditorContainer } from "../kanban-card/TaskDetailsModal";
import Tiptap from "../kanban-card/Tiptap";

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const taskSchema = Yup.object({
  title: Yup.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .required("Title is required"),
  priority: Yup.string()
    .oneOf(["p1", "p2", "p3", "p4"], "Invalid priority")
    .required("Priority is required"),
  project_id: Yup.string()
    .test("is-uuid", "Project ID must be a valid UUID", isUUID)
    .required("Project is required"),
  current_user_id: Yup.string().test(
    "is-uuid",
    "User ID must be a valid UUID",
    (value) => (value ? isUUID(value) : true),
  ),
  deadline_days: Yup.number()
    .min(0, "Days cannot be negative")
    .typeError("Days must be a number"),
  deadline_hours: Yup.number()
    .min(0, "Hours cannot be negative")
    .typeError("Hours must be a number"),
  deadline_total_minutes: Yup.number(),
});

export interface TaskToEdit {
  id: string;
  title: string;
  ticket_no?: string;
  status?: string;
  priority: string;
  description?: string;
  project_id: string;
  current_user?: { id: string; first_name: string; last_name: string };
  deadline_minutes?: string;
  deadline_days?: string;
  deadline_hours?: string;
  deadline_total_minutes?: string;
  subtasks?: string[];
}

export interface ProjectOption {
  id: string;
  title: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  description?: string;
  current_phase?: string;
  dead_line?: string | null;
}

export interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
}

export interface CreatedOrUpdatedTask {
  id: string;
  title: string;
  ticket_no?: string;
  status?: string;
  priority: string;
  current_user?: { id: string; first_name: string; last_name: string };
  project_id: string;
  description?: string;
  deadline_minutes?: string;
  subtasks?: string[];
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Unassigned Task</DialogTitle>
    <DialogContent>
      <DialogContentText>
        You haven't assigned this task to any user. Do you want to continue
        without assigning a user?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button
        onClick={onClose}
        variant="outlined"
        sx={{
          color: "var(--primary-color-2)",
          borderColor: "var(--primary-color-2)",
        }}
      >
        No
      </Button>
      <Button
        onClick={() => {
          onConfirm();
          onClose();
        }}
        variant="contained"
        sx={{
          backgroundColor: "var(--primary-color-1)",
          color: "#ffffff",
          "&:hover": { backgroundColor: "var(--primary-color-1-hover)" },
        }}
      >
        Yes
      </Button>
    </DialogActions>
  </Dialog>
);

function generateTicketNumber(existingTickets: string[]): string {
  let ticketNumber: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 1000;
  while (!isUnique && attempts < maxAttempts) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    ticketNumber = `TCKT-${randomNum.toString().padStart(5, "0")}`;
    isUnique = !existingTickets.includes(ticketNumber);
    attempts++;
  }
  if (!isUnique) {
    throw new Error(
      "Unable to generate a unique ticket number after maximum attempts",
    );
  }
  return ticketNumber!;
}

export interface FullTaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (task: CreatedOrUpdatedTask) => void;
  taskToEdit?: TaskToEdit | null;
  showCompressButton?: boolean;
  onCompress?: () => void;
  existingTicketNumbers?: string[];
  /** When true, render form content only (no Modal wrapper) for use inside a morphing panel */
  renderInline?: boolean;
}

export default function FullTaskFormModal({
  open,
  onClose,
  onSuccess,
  taskToEdit = null,
  showCompressButton = false,
  onCompress,
  existingTicketNumbers = [],
  renderInline = false,
}: FullTaskFormModalProps) {
  const authData = useAppselector((state) => state.auth.value);
  const currentUserRole = useAppselector((state) => state.role.value);
  const axiosInstance = useMemo(() => createAxiosInstance(), []);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [modalUsers, setModalUsers] = useState<UserOption[]>([]);
  const [description, setDescription] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<{
    values: any;
    helpers: any;
  } | null>(null);

  const taskEditMode = Boolean(taskToEdit?.id);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDescription(taskToEdit?.description ?? "");
    setPendingAttachments([]);
    let cancelled = false;
    setProjectsLoading(true);
    (async () => {
      try {
        if (currentUserRole?.priority < 3) {
          const res = await axiosInstance.get("/project-management/list");
          const data = res?.data?.data;
          if (!cancelled && Array.isArray(data)) {
            setProjects(
              data.map((p: any) => ({
                id: p.id,
                title: p.title,
                start_date: p.start_date,
                end_date: p.end_date,
                status: p.status,
                description: p.description,
                current_phase: p.current_phase,
                dead_line: p.dead_line,
              })),
            );
          }
        } else {
          const userId = authData?.user?.id;
          if (!userId) {
            if (!cancelled) setProjects([]);
            return;
          }
          const res = await axiosInstance.get(
            `/project-management/user-projects/${userId}`,
          );
          const data = res?.data;
          if (!cancelled && Array.isArray(data)) {
            setProjects(
              data.map((p: any) => ({
                id: p.id,
                title: p.title,
                start_date: p.start_date,
                end_date: p.end_date,
                status: p.status,
                description: p.description,
                current_phase: p.current_phase,
                dead_line: p.dead_line,
              })),
            );
          }
        }
      } catch (e) {
        console.error("Failed to fetch projects:", e);
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    taskToEdit?.description,
    authData?.user?.id,
    currentUserRole?.priority,
    axiosInstance,
  ]);

  const handleCloseModal = () => {
    setError(null);
    setDescription("");
    setPendingAttachments([]);
    setShowConfirm(false);
    setPendingValues(null);
    onClose();
  };

  const actuallyAddTask = async (values: any, { resetForm }: any) => {
    setIsSubmitting(true);
    try {
      let ticket_no: string | undefined;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 3;
      const existingTickets = [...existingTicketNumbers];

      while (!isUnique && attempts < maxAttempts) {
        ticket_no = generateTicketNumber(existingTickets);
        const { status, deadline_days, deadline_hours, ...payload } = values;
        payload.status = "pending";
        payload.ticket_no = ticket_no;
        payload.deadline_minutes = values.deadline_total_minutes;
        payload.subtasks = values.subtasks ?? [];
        payload.created_by = authData?.user?.id;

        try {
          const response = await axiosInstance.post(
            "/task-maangement",
            payload,
          );
          isUnique = true;

          const taskId = response.data.ticket?.id;
          if (!taskId || !isUUID(taskId)) {
            throw new Error("Task ID must be a valid UUID");
          }
          for (const file of pendingAttachments) {
            await axiosInstance.patch(
              `/task-maangement/add-attachment/${taskId}`,
              {
                ...file,
                uploaded_by: authData?.user?.id,
                uploaded_at: new Date().toISOString(),
              },
            );
          }
          setPendingAttachments([]);
          resetForm();

          const selectedUser = modalUsers.find(
            (u) => u?.id === values?.current_user_id,
          );
          const createdTask: CreatedOrUpdatedTask = {
            id: taskId,
            title: values?.title,
            ticket_no: ticket_no!,
            status: "pending",
            priority: values?.priority,
            current_user: {
              id: selectedUser?.id ?? "",
              first_name: selectedUser?.first_name ?? "",
              last_name: selectedUser?.last_name ?? "",
            },
            project_id: values?.project_id,
            description: values?.description,
            deadline_minutes: values?.deadline_total_minutes,
            subtasks: values.subtasks,
          };
          onSuccess?.(createdTask);
          handleCloseModal();
          toast.success("Task created successfully!");
        } catch (err: any) {
          if (
            err?.response?.data?.message?.includes(
              "Ticket number already exists",
            )
          ) {
            attempts++;
            existingTickets.push(ticket_no!);
            continue;
          }
          throw err;
        }
      }

      if (!isUnique) {
        throw new Error(
          "Unable to create task: Could not generate a unique ticket number",
        );
      }
    } catch (err: any) {
      console.error("Failed to create task:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Unknown error";
      toast.error(`Failed to create task: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTask = async (values: any, helpers: any) => {
    if (!values.current_user_id) {
      setPendingValues({ values, helpers });
      setShowConfirm(true);
      return;
    }
    await actuallyAddTask(values, helpers);
  };

  const handleUpdateTask = async (values: any, { resetForm }: any) => {
    if (!taskToEdit?.id) {
      toast.error("No task selected for update");
      return;
    }
    try {
      setIsSubmitting(true);
      const { status, deadline_days, deadline_hours, ...payload } = values;
      payload.deadline_minutes = values.deadline_total_minutes;

      await axiosInstance.patch(`/task-maangement/${taskToEdit.id}`, payload);

      const selectedUser = modalUsers.find(
        (u) => u.id === values.current_user_id,
      );
      const updatedTask: CreatedOrUpdatedTask = {
        id: taskToEdit.id,
        title: values.title,
        ticket_no: taskToEdit.ticket_no,
        status: taskToEdit.status,
        priority: values.priority,
        current_user:
          selectedUser ||
          (taskToEdit.current_user
            ? {
                id: taskToEdit.current_user.id,
                first_name: taskToEdit.current_user.first_name,
                last_name: taskToEdit.current_user.last_name,
              }
            : undefined),
        project_id: values.project_id,
        description: values.description,
        deadline_minutes: values.deadline_total_minutes,
        subtasks: values.subtasks,
      };
      onSuccess?.(updatedTask);
      handleCloseModal();
      resetForm();
      toast.success("Task updated successfully");
    } catch (err: any) {
      console.error("Failed to update task:", err);
      const msg =
        err?.response?.data?.message || err?.message || "Unknown error";
      toast.error(`Failed to update task: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialValues = {
    title: taskToEdit?.title ?? "",
    priority: taskToEdit?.priority ?? "p3",
    description: taskToEdit?.description ?? description,
    project_id: taskToEdit?.project_id ?? "",
    current_user_id: taskToEdit?.current_user?.id ?? "",
    deadline_days: taskToEdit?.deadline_days ?? "0",
    deadline_hours: taskToEdit?.deadline_hours ?? "0",
    deadline_total_minutes: taskToEdit?.deadline_total_minutes ?? "0",
    subtasks: taskToEdit?.subtasks ?? [],
  };

  const formContent = (
    <Box
      sx={{
        ...(renderInline
          ? { width: "100%", height: "100%", minHeight: 0 }
          : {
              width: "95vw",
              maxWidth: "1400px",
              height: "80vh",
            }),
        bgcolor: "#FFFFFF",
        borderRadius: renderInline ? 0 : 3,
        boxShadow: renderInline ? "none" : "0 4px 8px rgba(0, 0, 0, 0.1)",
        p: 2,
        position: "relative",
        outline: "none",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
          mb: 2,
          borderBottom: "1px solid #E8ECEF",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 500,
            color: "#1E2E3E",
            fontSize: "1.25rem",
          }}
        >
          {taskEditMode ? "Edit Task" : "Create New Task"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {showCompressButton && (
            <Tooltip title="Back to quick add">
              <IconButton
                onClick={onCompress}
                sx={{
                  color: "#6B7280",
                  background: "#F9FAFB",
                  "&:hover": { background: "#E2E6EA" },
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                }}
              >
                <Compress sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Close">
            <IconButton
              onClick={handleCloseModal}
              sx={{
                color: "#6B7280",
                background: "#F9FAFB",
                "&:hover": { background: "#E2E6EA" },
                borderRadius: "50%",
                width: 32,
                height: 32,
              }}
            >
              <Cancel sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Box
          sx={{
            mb: 2,
            p: 1,
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <Cancel sx={{ color: "#dc2626", fontSize: "0.9rem" }} />
          <Typography sx={{ color: "#dc2626", fontSize: "0.85rem" }}>
            {error}
          </Typography>
        </Box>
      )}

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={taskSchema}
        onSubmit={taskEditMode ? handleUpdateTask : handleAddTask}
      >
        {({
          values,
          setFieldValue,
          errors,
          touched,
          dirty,
          isSubmitting: formikSubmitting,
        }) => {
          const submitting = isSubmitting || formikSubmitting;
          return (
            <Form
              style={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                gap: "16px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  flex: "0 0 58%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  overflowY: "auto",
                  pr: 2,
                  borderRight: "1px solid #E8ECEF",
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#D1D5DB",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#1E2E3E",
                      mb: 1,
                      fontSize: "0.95rem",
                    }}
                  >
                    <RequiredLabel label="Task Title" />
                  </Typography>
                  <Field
                    as={TextField}
                    name="title"
                    placeholder="e.g., Implement user authentication"
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={touched.title && !!errors.title}
                    helperText={touched.title && errors.title}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E8ECEF",
                        "&:hover": { borderColor: "#D1D5DB" },
                        "&.Mui-focused": { borderColor: "#3B82F6" },
                      },
                      "& .MuiOutlinedInput-input": {
                        fontSize: "0.9rem",
                        color: "#1E2E3E",
                        padding: "10px 12px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#1E2E3E",
                      mb: 1,
                      fontSize: "0.95rem",
                    }}
                  >
                    Description
                  </Typography>
                  <EditorContainer
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Tiptap
                      initialContent={values.description}
                      onSave={(content) =>
                        setFieldValue("description", content)
                      }
                      onPendingAttachment={(fileData) =>
                        setPendingAttachments((prev) => [...prev, fileData])
                      }
                    />
                  </EditorContainer>
                </Box>

                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: "var(--primary-color-1)",
                        }}
                      >
                        Subtasks
                      </Typography>
                      <Chip
                        label={values.subtasks.length}
                        size="small"
                        sx={{
                          backgroundColor: "var(--primary-color-1)",
                          color: "white",
                          fontSize: "0.65rem",
                          height: 16,
                          minWidth: 18,
                        }}
                      />
                    </Box>
                    <Tooltip title="Break down your task">
                      <Info sx={{ fontSize: "0.75rem", color: "#6b7280" }} />
                    </Tooltip>
                  </Box>
                  <FieldArray name="subtasks">
                    {({ remove, push }) => (
                      <Paper
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: 1,
                          border: "1px solid #e2e8f0",
                          p: 1,
                          maxHeight: 150,
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            overflowY: "auto",
                            pr: 0.5,
                            pb: 0.5,
                            "&::-webkit-scrollbar": { width: "6px" },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "#cbd5e1",
                              borderRadius: "3px",
                            },
                            "&::-webkit-scrollbar-track": {
                              backgroundColor: "#f1f5f9",
                            },
                          }}
                        >
                          {[...values.subtasks].reverse().map((_, index) => {
                            const originalIndex =
                              values.subtasks.length - 1 - index;
                            return (
                              <Paper
                                key={originalIndex}
                                sx={{
                                  p: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  borderRadius: 1,
                                  border: "1px solid #e2e8f0",
                                  mb: 0.5,
                                }}
                              >
                                <Field
                                  as={TextField}
                                  name={`subtasks[${originalIndex}]`}
                                  placeholder={`Subtask ${originalIndex + 1}...`}
                                  variant="standard"
                                  size="small"
                                  fullWidth
                                />
                                <Tooltip title="Remove subtask">
                                  <IconButton
                                    onClick={() => remove(originalIndex)}
                                    size="small"
                                    sx={{ color: "#ef4444" }}
                                  >
                                    <Cancel sx={{ fontSize: "0.9rem" }} />
                                  </IconButton>
                                </Tooltip>
                              </Paper>
                            );
                          })}
                        </Box>
                        <Box sx={{ pt: 1, borderTop: "1px solid #e2e8f0" }}>
                          <Button
                            startIcon={<AddIcon sx={{ fontSize: "0.9rem" }} />}
                            onClick={() => push("")}
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: 1,
                              textTransform: "none",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "var(--primary-color-1)",
                              borderColor: "var(--primary-color-1)",
                              "&:hover": {
                                backgroundColor: "var(--primary-color-1)",
                                color: "white",
                              },
                            }}
                          >
                            Add Subtask
                          </Button>
                        </Box>
                      </Paper>
                    )}
                  </FieldArray>
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  overflowY: "auto",
                  pl: 1,
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#D1D5DB",
                    borderRadius: "4px",
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: "#1E2E3E",
                    fontSize: "1.1rem",
                    mb: 1,
                  }}
                >
                  Details
                </Typography>

                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 100,
                      }}
                    >
                      <Folder
                        sx={{
                          color: "var(--primary-color-2)",
                          fontSize: "1.1rem",
                        }}
                      />
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        <RequiredLabel label="Project" />
                      </Typography>
                    </Box>
                    <FormControl
                      fullWidth
                      error={touched.project_id && !!errors.project_id}
                      size="small"
                      sx={{ flex: 1 }}
                    >
                      <Autocomplete
                        options={projects}
                        getOptionLabel={(option) => option.title || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        size="small"
                        loading={projectsLoading}
                        onChange={async (_event, value) => {
                          const projectId = value?.id || "";
                          setFieldValue("project_id", projectId);
                          setFieldValue("current_user_id", "");
                          if (projectId) {
                            try {
                              const response = await axiosInstance.get(
                                `/project-management/project-team/${projectId}`,
                              );
                              const teamMembers = response.data.data || [];
                              setModalUsers(
                                teamMembers.map((member: any) => ({
                                  id: member.user.id,
                                  first_name: member.user.first_name,
                                  last_name: member.user.last_name,
                                  profile_image: member.user.profile_image,
                                })),
                              );
                            } catch (err) {
                              console.error(
                                "Failed to fetch project team members:",
                                err,
                              );
                              setModalUsers([]);
                            }
                          } else {
                            setModalUsers([]);
                          }
                        }}
                        value={
                          projects.find((p) => p.id === values.project_id) ||
                          null
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select project..."
                            size="small"
                            error={touched.project_id && !!errors.project_id}
                            helperText={
                              touched.project_id &&
                              typeof errors.project_id === "string"
                                ? errors.project_id
                                : undefined
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 1,
                                backgroundColor: "#f8fafc",
                                fontSize: "0.8rem",
                                height: 36,
                              },
                              "& .MuiFormHelperText-root": {
                                fontSize: "0.7rem",
                              },
                            }}
                          />
                        )}
                      />
                    </FormControl>
                  </Box>
                </Paper>

                {!taskEditMode && (
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          minWidth: 100,
                        }}
                      >
                        <Person
                          sx={{
                            color: "var(--primary-color-2)",
                            fontSize: "1.1rem",
                          }}
                        />
                        <Typography
                          sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                        >
                          <RequiredLabel label="Assign To" />
                        </Typography>
                      </Box>
                      <FormControl
                        fullWidth
                        error={Boolean(
                          touched.current_user_id && errors?.current_user_id,
                        )}
                        size="small"
                        sx={{ flex: 1 }}
                      >
                        <Autocomplete
                          options={modalUsers}
                          getOptionLabel={(option) =>
                            `${option.first_name} ${option.last_name}`
                          }
                          value={
                            modalUsers.find(
                              (u) => u.id === values.current_user_id,
                            ) || null
                          }
                          onChange={(_, selectedUser) => {
                            setFieldValue(
                              "current_user_id",
                              selectedUser?.id || "",
                            );
                          }}
                          disabled={!values.project_id}
                          size="small"
                          noOptionsText={
                            values.project_id
                              ? "No team members"
                              : "Select project first"
                          }
                          renderInput={(params) => {
                            const selectedUser = modalUsers.find(
                              (u) => u.id === values.current_user_id,
                            );
                            return (
                              <TextField
                                {...params}
                                placeholder="Select team member..."
                                size="small"
                                error={Boolean(
                                  touched.current_user_id &&
                                  errors?.current_user_id,
                                )}
                                helperText={
                                  touched.current_user_id &&
                                  typeof errors?.current_user_id === "string"
                                    ? errors.current_user_id
                                    : undefined
                                }
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: selectedUser ? (
                                    <>
                                      <Avatar
                                        src={
                                          selectedUser.profile_image ||
                                          "/images/profile/defaultprofile.jpg"
                                        }
                                        sx={{
                                          width: 22,
                                          height: 22,
                                          fontSize: "0.7rem",
                                        }}
                                      >
                                        {selectedUser.first_name[0]}
                                        {selectedUser.last_name[0]}
                                      </Avatar>
                                      {params.InputProps.startAdornment}
                                    </>
                                  ) : (
                                    params.InputProps.startAdornment
                                  ),
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 1,
                                    backgroundColor: "#f8fafc",
                                    fontSize: "0.8rem",
                                    height: 36,
                                  },
                                  "& .MuiFormHelperText-root": {
                                    fontSize: "0.7rem",
                                  },
                                }}
                              />
                            );
                          }}
                          renderOption={(props, option) => {
                            const { key, ...rest } = props;
                            return (
                              <li
                                key={key}
                                {...rest}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "4px 10px",
                                }}
                              >
                                <Avatar
                                  src={
                                    option.profile_image ||
                                    "/images/profile/defaultprofile.jpg"
                                  }
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  {option.first_name[0]}
                                  {option.last_name[0]}
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight={500}
                                  fontSize="0.75rem"
                                >
                                  {option.first_name} {option.last_name}
                                </Typography>
                              </li>
                            );
                          }}
                        />
                      </FormControl>
                    </Box>
                  </Paper>
                )}

                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 120,
                      }}
                    >
                      <Warning
                        sx={{
                          color: "var(--primary-color-2)",
                          fontSize: "1.1rem",
                        }}
                      />
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        Priority Level
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.2, flex: 1 }}>
                      {[
                        {
                          value: "p1",
                          label: "Critical",
                          color: "#ef4444",
                        },
                        { value: "p2", label: "High", color: "#f59e0b" },
                        {
                          value: "p3",
                          label: "Normal",
                          color: "#10b981",
                        },
                      ].map((priority) => (
                        <Box
                          key={priority.value}
                          onClick={() =>
                            setFieldValue("priority", priority.value)
                          }
                          sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: 1,
                            border: `1.5px solid ${
                              values.priority === priority.value
                                ? priority.color
                                : "#e2e8f0"
                            }`,
                            backgroundColor:
                              values.priority === priority.value
                                ? `${priority.color}10`
                                : "#f8fafc",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              borderColor: priority.color,
                              backgroundColor: `${priority.color}08`,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              fontWeight={600}
                              fontSize="0.75rem"
                              color={
                                values.priority === priority.value
                                  ? priority.color
                                  : "inherit"
                              }
                            >
                              {priority.label}
                            </Typography>
                            {values.priority === priority.value && (
                              <CheckCircle
                                sx={{
                                  color: priority.color,
                                  fontSize: "0.9rem",
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <ErrorMessage
                    name="priority"
                    render={(msg) => (
                      <Typography
                        color="error"
                        variant="caption"
                        fontSize="0.65rem"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {msg}
                      </Typography>
                    )}
                  />
                </Paper>

                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        minWidth: 120,
                      }}
                    >
                      <AccessTime
                        sx={{
                          color: "var(--primary-color-2)",
                          fontSize: "1.1rem",
                        }}
                      />
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        Time Estimation
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5, flex: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          fontWeight={500}
                          color="text.secondary"
                          fontSize="0.7rem"
                        >
                          Days
                        </Typography>
                        <Field
                          as={TextField}
                          name="deadline_days"
                          type="number"
                          size="small"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                              backgroundColor: "#f8fafc",
                              fontSize: "0.8rem",
                              height: 32,
                            },
                          }}
                          onChange={(e) => {
                            const days = e.target.value;
                            setFieldValue("deadline_days", days);
                            const totalMinutes =
                              (parseFloat(days) || 0) * 1440 +
                              (parseFloat(values.deadline_hours) || 0) * 60;
                            setFieldValue(
                              "deadline_total_minutes",
                              Math.round(totalMinutes).toString(),
                            );
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          fontWeight={500}
                          color="text.secondary"
                          fontSize="0.7rem"
                        >
                          Hours
                        </Typography>
                        <Field
                          as={TextField}
                          name="deadline_hours"
                          type="number"
                          size="small"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1,
                              backgroundColor: "#f8fafc",
                              fontSize: "0.8rem",
                              height: 32,
                            },
                          }}
                          onChange={(e) => {
                            const hours = e.target.value;
                            setFieldValue("deadline_hours", hours);
                            const totalMinutes =
                              (parseFloat(values.deadline_days) || 0) * 1440 +
                              (parseFloat(hours) || 0) * 60;
                            setFieldValue(
                              "deadline_total_minutes",
                              Math.round(totalMinutes).toString(),
                            );
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      mt: 1,
                      p: 0.5,
                      backgroundColor: "#f1f5f9",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      fontSize="0.7rem"
                    >
                      Total Estimated Time:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="var(--primary-color-1)"
                      fontSize="0.75rem"
                    >
                      {Math.floor(
                        parseFloat(values.deadline_total_minutes || "0") / 60,
                      )}
                      h {parseFloat(values.deadline_total_minutes || "0") % 60}m
                    </Typography>
                  </Box>
                </Paper>

                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: "#f8fafc",
                    borderRadius: 1,
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handleCloseModal}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 500,
                        px: 2.5,
                        py: 0.5,
                        fontSize: "0.75rem",
                        borderColor: "#d1d5db",
                        color: "#64748b",
                        "&:hover": {
                          borderColor: "var(--primary-color-2)",
                          color: "var(--primary-color-2)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting || !dirty}
                      size="small"
                      startIcon={
                        submitting ? (
                          <CircularProgress size={12} color="inherit" />
                        ) : null
                      }
                      sx={{
                        borderRadius: 1,
                        px: 2.5,
                        py: 0.5,
                        fontWeight: 500,
                        textTransform: "none",
                        fontSize: "0.75rem",
                        background: `linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)`,
                        color: "white",
                        "&:disabled": {
                          background: `grey`,
                          color: "white",
                        },
                      }}
                    >
                      {submitting
                        ? "Processing..."
                        : taskEditMode
                          ? "Update Task"
                          : "Create Task"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );

  return (
    <>
      {renderInline ? (
        open ? (
          formContent
        ) : null
      ) : (
        <Modal
          open={open}
          onClose={handleCloseModal}
          aria-labelledby="task-modal-title"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(5px)",
          }}
        >
          {formContent}
        </Modal>
      )}

      <ConfirmDialog
        open={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPendingValues(null);
        }}
        onConfirm={() => {
          if (pendingValues) {
            actuallyAddTask(pendingValues.values, pendingValues.helpers);
          }
        }}
      />
    </>
  );
}
