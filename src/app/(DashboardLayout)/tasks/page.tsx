"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Box,
  Typography,
  Button,
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
import FullTaskFormModal from "../components/task-modal/FullTaskFormModal";
import createAxiosInstance from "@/app/axiosInstance";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppselector } from "@/redux/store";
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
import {
  HistoryItem,
  TaskProvider,
  useTaskContext,
} from "@/contextapi/TaskContext";
import { set } from "lodash";
import Loader from "@/app/loading";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import KanbanBoardSkeleton from "@/app/KanbanBoardSkeleton";
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
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
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
      <FullTaskFormModal
        open={openModal}
        onClose={handleCloseModal}
        onSuccess={() => fetchTasks()}
        taskToEdit={taskEditMode ? taskToEdit : null}
        existingTicketNumbers={reports.map((r) => r.ticket_no)}
      />

      <UserTaskModal
        open={openUserModal}
        onClose={() => setOpenUserModal(false)}
        users={allUsers}
        reports={filteredReports}
        columns={columns}
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
