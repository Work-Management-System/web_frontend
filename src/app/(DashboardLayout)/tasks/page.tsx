"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  IconButton,
  InputAdornment,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Stack,
  Paper,
  Chip,
  Tooltip,
} from "@mui/material";
import KanbanColumn from "../components/kanban-column/KanbanColumn";
import UserTaskModal from "../components/kanban-card/UserTaskModal";
import createAxiosInstance from "@/app/axiosInstance";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppselector } from "@/redux/store";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import {
  Search,
  Add as AddIcon,
  Cancel,
  Person,
  Folder,
  Info,
  Warning,
  CheckCircle,
  AccessTime,
  AddCircleOutline,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import { Roles } from "@/app/constatnts";
import RequiredLabel from "../layout/shared/logo/RequiredLabel";
import {
  HistoryItem,
  TaskProvider,
  useTaskContext,
} from "@/contextapi/TaskContext";
import { set } from "lodash";
import Loader from "@/app/loading";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import KanbanBoardSkeleton from "@/app/KanbanBoardSkeleton";
import { EditorContainer } from "../components/kanban-card/TaskDetailsModal";
import Tiptap from "../components/kanban-card/Tiptap";
import SegmentIcon from "@mui/icons-material/Segment";
import { usePageTour } from "@/hooks/usePageTour";

// Type Definitions
interface Report {
  id: string;
  title: string;
  ticket_no: string;
  status: string;
  priority: string;
  current_user: {
    id: string;
    first_name: string;
    last_name: string;
    department?: string;
  };
  project_id: string;
  description: string;
  deadline_minutes: string;
  history?: HistoryItem[];
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  profile_image: string;
}

interface Project {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
  current_phase: string;
  dead_line: string | null;
}

const columns = [
  { id: "pending", title: "TO DO" },
  { id: "in_progress", title: "IN PROGRESS" },
  { id: "on_hold", title: "ON HOLD" },
  { id: "testable", title: "TESTABLE" },
  { id: "completed", title: "Completed" },
  { id: "debugging", title: "REOPENED" },
];

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
const ConfirmDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogTitle>Unassigned Task</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You haven’t assigned this task to any user. Do you want to continue
          without assigning a user?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => onClose()}
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
};

const KanbanBoard: React.FC = () => {
  usePageTour(); // Trigger tour on first visit
  const {
    reports,
    projects,
    fetchTasks,
    handleTaskDrop,
    handleDeleteTask,
    taskId,
    setTaskId,
    viewProjectTasks,
    setViewProjectTasks,
    tasksLoading,
    viewDepartmentTasks,
    setViewDepartmentTasks,
    setViewTeamTasks,
    setTasksLoading,
  } = useTaskContext();
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [columnTasks, setColumnTasks] = useState<{
    [key: string]: Report[];
  }>({});
  const [openModal, setOpenModal] = useState(false);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [viewOption, setViewOption] = useState<
    "my" | "all" | "department" | "team"
  >("my");
  const axiosInstance = createAxiosInstance();
  const searchParams = useSearchParams();
  // Extract value immediately to avoid enumeration warning
  const userId = useMemo(
    () => searchParams?.get("userId") || null,
    [searchParams],
  );
  const authData = useAppselector((state) => state.auth.value);
  const currentUserRole = useAppselector((state) => state.role.value);
  const taskEditMode = taskId ? true : false;
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);

  const generateTicketNumber = (existingTickets: string[]): string => {
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

    return ticketNumber;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/user/list");
        setAllUsers(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setAllUsers([]);
      }
    };

    fetchUsers();
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.ticket_no.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedUser) {
      filtered = filtered.filter(
        (report) => report.current_user.id === selectedUser,
      );
    }

    if (selectedPriority) {
      filtered = filtered.filter(
        (report) => report.priority === selectedPriority,
      );
    }

    if (selectedProject && selectedProject !== "") {
      filtered = filtered.filter(
        (report) => report.project_id === selectedProject,
      );
    }

    // Department filter
    if (selectedDepartment && selectedDepartment !== "") {
      filtered = filtered.filter(
        (report) => report.current_user.department === selectedDepartment,
      );
    }

    setFilteredReports(filtered);
    updateColumnTasks(filtered);
  }, [
    selectedUser,
    selectedPriority,
    selectedProject,
    selectedDepartment,
    searchTerm,
    reports,
  ]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/department/get-all-active");
      console.log("Fetch departments response:", res.data);
      if (res.data.status !== "success")
        throw new Error("Failed to fetch Departments");
      setDepartmentOptions(res.data.data || []);
      // toast.success(res.data.message || "Departments fetched successfully");
    } catch (error) {
      console.error(
        "Error fetching departments:",
        error.response?.data,
        error.message,
      );
      toast.error(
        error?.response?.data?.message || "Failed to fetch departments",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateColumnTasks = (updatedReports: Report[]) => {
    const tasksByColumn = columns.reduce(
      (acc, column) => {
        acc[column.id] = updatedReports.filter(
          (report) => report.status === column.id,
        );
        return acc;
      },
      {} as { [key: string]: Report[] },
    );
    setColumnTasks(tasksByColumn);
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setTaskId(null);
    setOpenModal(false);
    setError(null);
    setDescription("");
    setPendingAttachments([]);
  };
  const handleAddTask = async (values, helpers) => {
    if (!values.current_user_id) {
      setPendingValues({ values, helpers });
      setShowConfirm(true);
      return;
    }
    await actuallyAddTask(values, helpers);
  };

  const actuallyAddTask = async (values, { resetForm }) => {
    setIsSubmitting(true);
    try {
      let ticket_no;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 3;
      const existingTicketNumbers = reports.map((report) => report.ticket_no);

      while (!isUnique && attempts < maxAttempts) {
        ticket_no = generateTicketNumber(existingTicketNumbers);
        const { status, deadline_days, deadline_hours, ...payload } = values;
        payload.status = "pending";
        payload.ticket_no = ticket_no;
        payload.deadline_minutes = values.deadline_total_minutes;
        payload.subtasks = values.subtasks; // Include subtasks array in payload
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
          toast.success("Task created successfully!");
          resetForm();
          await fetchTasks();

          const selectedUser = modalUsers.find(
            (user) => user?.id === values?.current_user_id,
          );
          const createdTask = {
            id: taskId,
            title: values?.title,
            ticket_no: ticket_no,
            status: "pending",
            priority: values?.priority,
            current_user: {
              id: selectedUser?.id || "",
              first_name: selectedUser?.first_name || "",
              last_name: selectedUser?.last_name || "",
            },
            project_id: values?.project_id,
            description: values?.description,
            deadline_minutes: values?.deadline_total_minutes,
            subtasks: values.subtasks, // Include subtasks in createdTask
          };
          const updatedReports = [...reports, createdTask];
          setFilteredReports(updatedReports);
          updateColumnTasks(updatedReports);
          handleCloseModal();
          await fetchTasks();
          toast.success("Task Added Successfully");
          resetForm();
        } catch (error) {
          if (
            error.response?.data?.message?.includes(
              "Ticket number already exists",
            )
          ) {
            attempts++;
            continue;
          }
          throw error;
        }
      }

      if (!isUnique) {
        throw new Error(
          "Unable to create task: Could not generate a unique ticket number",
        );
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      if (error.response) {
        toast.error(
          `Failed to create task: ${
            error.response.data.message || "Unknown error"
          } `,
        );
      } else {
        toast.error(
          `Failed to create task: ${error.message || "Network error"} `,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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
        (user) => user.id === values.current_user_id,
      );

      const updatedTask: Report = {
        ...taskToEdit,
        title: values.title,
        priority: values.priority,
        description: values.description,
        current_user: selectedUser || taskToEdit.current_user,
        project_id: values.project_id,
        deadline_minutes: values.deadline_total_minutes,
      };

      const updatedReports = reports.map((r) =>
        r.id === taskToEdit.id ? updatedTask : r,
      );
      setFilteredReports(updatedReports);
      updateColumnTasks(updatedReports);
      handleCloseModal();
      setTaskId(null);
      toast.success("Task updated successfully");
      await fetchTasks();
      resetForm();
    } catch (error) {
      console.error("Failed to update task:", error);
      if (error.response) {
        toast.error(
          `Failed to update task: ${
            error.response.data.message || "Unknown error"
          }`,
        );
      } else {
        toast.error(
          `Failed to update task: ${error.message || "Network error"}`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (taskId && reports.length > 0) {
      const task = reports.find((report) => report.id === taskId);
      if (task) {
        const totalMinutes = parseInt(task.deadline_minutes || "0", 10);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);

        setTaskToEdit({
          ...task,
          deadline_days: days.toString(),
          deadline_hours: hours.toString(),
          deadline_total_minutes: totalMinutes.toString(),
        });
        setOpenModal(true);
      } else {
        console.error("Task not found for editing:", taskId);
        toast.error("Task not found for editing");
      }
    } else {
      setTaskToEdit(null);
      setOpenModal(false);
    }
  }, [taskId]);

  const handleViewToggle = (value: "all" | "my" | "department" | "team") => {
    if (value === "all") {
      setViewProjectTasks(true);
      setTasksLoading(true);
      setViewDepartmentTasks(false);
      // setSelectedProject("");
      setSelectedDepartment("");
      setViewTeamTasks(false);
    } else if (value === "department") {
      setTasksLoading(true);
      setViewProjectTasks(false);
      setViewDepartmentTasks(true);
      setViewTeamTasks(false);
    } else if (value === "team") {
      setTasksLoading(true);
      setViewProjectTasks(false);
      setViewDepartmentTasks(false);
      setViewTeamTasks(true);
    } else {
      setTasksLoading(true);
      setViewProjectTasks(false);
      setViewDepartmentTasks(false);
      setViewTeamTasks(false);
      setSelectedDepartment("");
    }
  };

  const handleClearFilters = () => {
    setSelectedUser(null);
    setSelectedPriority("");
    setSelectedProject("");
    setSearchTerm("");
    setFilteredReports(reports);
    updateColumnTasks(reports);
  };

  const usersWithTasks = React.useMemo(() => {
    return allUsers
      .filter((user) =>
        reports.some((report) => report.current_user.id === user.id),
      )
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name || ""}`
          .trim()
          .toLowerCase();
        const nameB = `${b.first_name} ${b.last_name || ""}`
          .trim()
          .toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [allUsers, reports]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  // if (tasksLoading || loading) {
  //   return (
  //     <Loader />);  }

  if (error && !openModal) {
    return <Box sx={{ color: "#f44336", p: 3 }}>Error: {error}</Box>;
  }

  return (
    <>
      <Box
        sx={{
          width: {
            xs: "100vw",
            sm: "98vw",
            md: 800,
            lg: 1190,
            xl: 1400,
          },
          mx: "auto",
          p: 0,
          minHeight: "100vh",
        }}
        data-tour="kanban-board"
      >
        <Box sx={{ p: 2 }} data-tour="task-filters">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.5 }}>
                    <Search sx={{ color: "#5e6c84", fontSize: 18 }} />{" "}
                    {/* Reduced icon size */}
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 180, // Reduced width
                height: 36, // Reduced height
                "& .MuiInputBase-root": {
                  height: 36,
                  backgroundColor: "#ffffff",
                  color: "#172b4d",
                  borderRadius: "8px",
                  fontSize: "0.8rem", // Smaller font size
                },
                "& .MuiInputBase-input": {
                  padding: "6px 6px 6px 4px", // Adjusted padding for smaller size
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#dfe1e6",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#b3bac5",
                },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#007bff",
                },
              }}
            />
            <Autocomplete
              size="small"
              options={usersWithTasks}
              getOptionLabel={(option) =>
                option.id
                  ? `${option.first_name} ${option.last_name}`
                  : "All Users"
              }
              value={
                selectedUser
                  ? usersWithTasks.find((user) => user.id === selectedUser) ||
                    null
                  : null
              }
              onChange={(_, newValue) => {
                setSelectedUser(newValue ? newValue.id : null);
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="No users with tasks"
              renderInput={(params) => (
                <TextField
                  {...params}
                  sx={{
                    minWidth: 200, // Reduced minWidth
                    backgroundColor: "#ffffff",
                    color: "#172b4d",
                    "& .MuiInputBase-root": {
                      borderRadius: "8px",
                      fontSize: "0.8rem", // Smaller font size
                    },
                    "& .MuiInputLabel-root": {
                      color: "#5e6c84",
                      fontSize: "0.8rem", // Smaller label font size
                    },
                    "& .MuiSvgIcon-root": { color: "#5e6c84" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#dfe1e6",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#b3bac5",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#007bff",
                    },
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...optionProps } = props; // remove key
                return (
                  <li key={key} {...optionProps} style={{ fontSize: "0.8rem" }}>
                    {option.id
                      ? `${option.first_name} ${option.last_name}`
                      : "All Users"}
                  </li>
                );
              }}
            />
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel sx={{ color: "#5e6c84", fontSize: "0.8rem" }}>
                Priority
              </InputLabel>
              <Select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                label="Priority"
                name="priority"
                sx={{
                  backgroundColor: "#ffffff",
                  color: "#172b4d",
                  borderRadius: "8px",
                  fontSize: "0.8rem", // Smaller font size
                  "& .MuiSvgIcon-root": { color: "#5e6c84" },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#dfe1e6",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#b3bac5",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#007bff",
                  },
                }}
              >
                <MenuItem value="" sx={{ fontSize: "0.8rem" }}>
                  All
                </MenuItem>
                <MenuItem value="p1" sx={{ fontSize: "0.8rem" }}>
                  P1
                </MenuItem>
                <MenuItem value="p2" sx={{ fontSize: "0.8rem" }}>
                  P2
                </MenuItem>
                <MenuItem value="p3" sx={{ fontSize: "0.8rem" }}>
                  P3
                </MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              options={projects}
              getOptionLabel={(option) => option.title}
              value={
                projects.find((project) => project.id === selectedProject) ||
                null
              }
              onChange={(event, newValue) => {
                setSelectedProject(newValue ? newValue.id : "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project"
                  size="small"
                  sx={{
                    minWidth: 130, // Reduced minWidth
                    "& .MuiInputLabel-root": {
                      color: "#5e6c84",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: "0.8rem", // Smaller label font size
                    },
                    "& .MuiInputBase-root": {
                      backgroundColor: "#ffffff",
                      color: "#172b4d",
                      whiteSpace: "nowrap",
                      borderRadius: "8px",
                      fontSize: "0.8rem", // Smaller font size
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#5e6c84",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#dfe1e6",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#b3bac5",
                    },
                    "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#007bff",
                    },
                    "& .MuiAutocomplete-input": {
                      overflow: "visible",
                      textOverflow: "clip",
                    },
                  }}
                />
              )}
              renderOption={(props, option, { index }) => {
                const { key, ...otherProps } = props;
                return (
                  <li
                    key={key}
                    {...otherProps}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "visible",
                      textOverflow: "clip",
                      fontSize: "0.8rem", // Smaller font size for options
                    }}
                  >
                    {option.title}
                  </li>
                );
              }}
              sx={{
                minWidth: 180, // Reduced minWidth
                "& .MuiAutocomplete-popper": {
                  minWidth: "fit-content",
                },
              }}
            />
            {currentUserRole.priority == 2 && (
              <FormControl sx={{ minWidth: 130 }} size="small">
                <InputLabel sx={{ color: "#5e6c84", fontSize: "0.8rem" }}>
                  Select Dept.
                </InputLabel>
                <Select
                  labelId="department-select-label"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  label="Select Dept."
                  sx={{
                    backgroundColor: "#ffffff",
                    color: "#172b4d",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    "& .MuiSvgIcon-root": { color: "#5e6c84" },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#dfe1e6",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#b3bac5",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#007bff",
                    },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: "0.8rem" }}>
                    All Departments
                  </MenuItem>
                  {departmentOptions.map((dept) => (
                    <MenuItem
                      key={dept.id}
                      value={dept.name}
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {currentUserRole.priority >= 3 ? (
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select
                  value={viewOption}
                  onChange={(e) => {
                    handleViewToggle(e.target.value);
                    setViewOption(e.target.value);
                  }}
                  sx={{
                    fontSize: "0.8rem",
                    color: "var(--primary-color-1)",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--primary-color-1)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--primary-color-1)",
                    },
                    "& .MuiSelect-icon": { color: "var(--primary-color-1)" },
                  }}
                >
                  <MenuItem value="my" sx={{ fontSize: "0.8rem" }}>
                    My Tasks
                  </MenuItem>
                  <MenuItem value="team" sx={{ fontSize: "0.8rem" }}>
                    My Team
                  </MenuItem>
                  <MenuItem value="all" sx={{ fontSize: "0.8rem" }}>
                    My Projects View
                  </MenuItem>
                  {currentUserRole.priority > 2 && (
                    <MenuItem value="department" sx={{ fontSize: "0.8rem" }}>
                      My Dept. View
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            ) : null}
            <Button
              onClick={handleClearFilters}
              sx={{
                color: "var(--primary-color-1)",
                textTransform: "none",
                fontWeight: "bold",
                fontSize: "0.8rem", // Smaller font size
                "&:hover": { backgroundColor: "#e6f0fa" },
              }}
              data-tour="clear-task-filters"
            >
              Clear filters
            </Button>
            {currentUserRole.priority < 3 ? (
              <Button
                onClick={() => setOpenUserModal(true)}
                sx={{
                  color: "var(--primary-color-1)",
                  textTransform: "none",
                  fontWeight: "bold",
                  fontSize: "0.8rem", // Smaller font size
                  "&:hover": { backgroundColor: "#e6f0fa" },
                }}
              >
                View Tasks
              </Button>
            ) : null}
            <Button
              variant="contained"
              onClick={handleOpenModal}
              sx={{
                color: "#ffffff",
                fontWeight: "bold",
                borderRadius: "8px",
                fontSize: "0.8rem", // Smaller font size
                backgroundColor: "var(--primary-color-1)",
                "&:hover": {
                  backgroundColor: "var(--primary-color-1-hover)",
                },
              }}
              data-tour="add-task-button"
            >
              Add Task
            </Button>
          </Box>
        </Box>
        {loading || tasksLoading ? (
          <KanbanBoardSkeleton />
        ) : (
          <Box
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 1,
              pb: 2,
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#888",
                borderRadius: 4,
              },
              height: "calc(100vh - 120px)",
              justifyContent: "left",
              px: 2,
            }}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={columnTasks[column.id]}
                totalTaskCount={filteredReports.length}
              />
            ))}
          </Box>
        )}
      </Box>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="task-modal-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(5px)",
        }}
      >
        <Box
          sx={{
            width: "95vw",
            maxWidth: "1400px",
            bgcolor: "#FFFFFF",
            borderRadius: 3,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            p: 2,
            position: "relative",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            height: "80vh",
            overflow: "hidden",
          }}
        >
          {/* Header */}
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
            initialValues={{
              title: taskToEdit?.title || "",
              priority: taskToEdit?.priority || "p3",
              description: taskToEdit?.description || description,
              project_id: taskToEdit?.project_id || "",
              current_user_id: taskToEdit?.current_user?.id || "",
              deadline_days: taskToEdit?.deadline_days || "0",
              deadline_hours: taskToEdit?.deadline_hours || "0",
              deadline_total_minutes: taskToEdit?.deadline_total_minutes || "0",
              subtasks: taskToEdit?.subtasks || [],
            }}
            validationSchema={taskSchema}
            onSubmit={taskEditMode ? handleUpdateTask : handleAddTask}
          >
            {({
              values,
              setFieldValue,
              errors,
              touched,
              dirty,
              isSubmitting,
            }) => (
              <Form
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flex: 1,
                  gap: "16px",
                  overflow: "hidden",
                }}
              >
                {/* Left Panel - 58% */}
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
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                  }}
                >
                  {/* Task Title */}
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

                  {/* Description */}
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
                  {/* Subtasks Section */}
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
                          {/* Scrollable subtask list */}
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
                            {[...values.subtasks]
                              .reverse()
                              .map((subtask, index) => {
                                const originalIndex =
                                  values.subtasks.length - 1 - index; // Calculate original index
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
                                      placeholder={`Subtask ${
                                        originalIndex + 1
                                      }...`}
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

                          {/* Add button always visible */}
                          <Box sx={{ pt: 1, borderTop: "1px solid #e2e8f0" }}>
                            <Button
                              startIcon={
                                <AddIcon sx={{ fontSize: "0.9rem" }} />
                              }
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
                {/* Right Panel - 40% - Details */}
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
                  {/* Project Selection Card (unchanged) */}
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
                        <Typography
                          sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                        >
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
                                const mappedUsers = teamMembers.map(
                                  (member) => ({
                                    id: member.user.id,
                                    first_name: member.user.first_name,
                                    last_name: member.user.last_name,
                                    profile_image: member.user.profile_image,
                                  }),
                                );
                                setModalUsers(mappedUsers);
                              } catch (error) {
                                console.error(
                                  "Failed to fetch project team members:",
                                  error,
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

                  {/* Assignment Card (unchanged) */}
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

                  {/* Priority Card (unchanged) */}
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
                        <Typography
                          sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                        >
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

                  {/* Time Estimation Card (unchanged) */}
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
                        <Typography
                          sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                        >
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
                        h{" "}
                        {parseFloat(values.deadline_total_minutes || "0") % 60}m
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      // mt: 'auto',
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
                        disabled={isSubmitting || !dirty}
                        size="small"
                        startIcon={
                          isSubmitting ? (
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
                        {isSubmitting
                          ? "Processing..."
                          : taskEditMode
                            ? "Update Task"
                            : "Create Task"}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
      <UserTaskModal
        open={openUserModal}
        onClose={() => setOpenUserModal(false)}
        users={allUsers}
        reports={filteredReports}
        columns={columns}
      />
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          if (pendingValues) {
            actuallyAddTask(pendingValues.values, pendingValues.helpers);
          }
        }}
      />
    </>
  );
};

const DynamicKanbanBoard = dynamic(() => Promise.resolve(KanbanBoard), {
  ssr: false,
});

const Page: React.FC = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TaskProvider>
        <DynamicKanbanBoard />
      </TaskProvider>
    </DndProvider>
  );
};

export default Page;
