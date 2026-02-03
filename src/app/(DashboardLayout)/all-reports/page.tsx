"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Stack,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Drawer,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Collapse,
  Tabs,
  Tab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from "@mui/icons-material/Person";
import FolderIcon from "@mui/icons-material/Folder";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// ============ INTERFACES ============
interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface TaskReport {
  task_name: string;
  project: {
    id: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    current_phase?: string;
    client_details?: { name: string; email: string; contact: string }[];
  };
  time_taken: number | string;
  status: string;
  description?: string;
}

interface WorkLog {
  created_at: string;
  taskReports: TaskReport[];
  user?: User;
}

interface TimeTakenPeriod {
  start_time?: string;
  end_time?: string;
  time_taken?: number | string;
}

interface HistoryItem {
  from_status: string | null;
  to_status: string;
  moved_at: string;
  moved_by?: string;
}

interface Ticket {
  id: string;
  title?: string;
  description?: string;
  created_at: string;
  priority: string;
  status?: string;
  project: { title: string };
  current_user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  timeTakenPeriods?: TimeTakenPeriod[];
  time_taken?: number | string;
  total_time?: number | string;
  time_spent?: number | string;
  history?: HistoryItem[];
}

interface ProjectSummary {
  name: string;
  totalWorked: number;
  p1Tickets: number;
  p2Tickets: number;
  p3Tickets: number;
  totalTickets: number;
}

interface UserSummary {
  id: string;
  name: string;
  totalWorked: number;
  p1Tickets: number;
  p2Tickets: number;
  p3Tickets: number;
  totalTickets: number;
}

interface TaskItem {
  task_name: string;
  project: TaskReport["project"];
  time_taken: number;
  status: string;
  description?: string;
  created_at: string;
  user: User;
  priority?: string;
}

// Nested table interfaces
interface UserProjectBreakdown {
  projectName: string;
  timeWorked: number;
  totalTickets: number;
  p1Tickets: number;
  p2Tickets: number;
  p3Tickets: number;
}

interface ProjectTaskBreakdown {
  taskName: string;
  assignee: string;
  ticketType: string;
  status: string;
  timeWorked: number;
}

// ============ STYLED COMPONENTS ============
const FilterBar = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 10,
  backgroundColor: "#fff",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderBottom: "1px solid #eee",
}));

const StatCard = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  backgroundColor: "#fff",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledTableCell = styled(TableCell)(() => ({
  backgroundColor: "var(--primary-color-1, #0798bd)",
  color: "#fff",
  fontWeight: 600,
  fontSize: "0.875rem",
  padding: "12px 16px",
  border: "none",
}));

const DataTableCell = styled(TableCell)(() => ({
  padding: "12px 16px",
  fontSize: "0.875rem",
  color: "#333",
  border: "none",
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 600,
  padding: "8px 24px",
  borderRadius: "6px !important",
  border: "none !important",
  color: "#666",
  "&.Mui-selected": {
    backgroundColor: "var(--primary-color-1, #0798bd)",
    color: "#fff",
    "&:hover": {
      backgroundColor: "var(--primary-color-1, #0798bd)",
    },
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(2),
  borderBottom: "1px solid #eee",
}));

const TimelineItem = styled(ListItem)(({ theme }) => ({
  position: "relative",
  paddingLeft: theme.spacing(4),
  "&::before": {
    content: '""',
    position: "absolute",
    left: "12px",
    top: 0,
    bottom: 0,
    width: "2px",
    backgroundColor: "#e0e0e0",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    left: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color-1, #0798bd)",
  },
}));

// Nested table styled components
const NestedTableContainer = styled(Box)(() => ({
  backgroundColor: "#f8f9fa",
  paddingLeft: "48px",
  paddingRight: "16px",
  paddingTop: "8px",
  paddingBottom: "16px",
}));

const NestedTableCell = styled(TableCell)(() => ({
  backgroundColor: "var(--primary-color-2, #FF8700)",
  color: "#fff",
  fontWeight: 600,
  fontSize: "0.8rem",
  padding: "8px 12px",
  border: "none",
}));

const NestedDataCell = styled(TableCell)(() => ({
  padding: "8px 12px",
  fontSize: "0.8rem",
  color: "#444",
  border: "none",
}));

const ExpandIconCell = styled(TableCell)(() => ({
  width: "40px",
  padding: "8px",
  border: "none",
}));

// Scrollable nested table body wrapper - max 6 rows visible (approx 36px per row = 216px)
const NestedTableBodyWrapper = styled(Box)(() => ({
  maxHeight: "216px",
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0,0,0,0.2) transparent",
  "&::-webkit-scrollbar": {
    width: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0,0,0,0.2)",
    borderRadius: "2px",
  },
}));

// Sticky nested table header cell
const StickyNestedTableCell = styled(TableCell)(() => ({
  backgroundColor: "var(--primary-color-2, #FF8700)",
  color: "#fff",
  fontWeight: 600,
  fontSize: "0.8rem",
  padding: "8px 12px",
  border: "none",
  position: "sticky",
  top: 0,
  zIndex: 1,
}));

// ============ HELPER FUNCTIONS ============
// Safely parse time value (handles string or number)
const parseTime = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  const parsed = typeof value === "string" ? parseInt(value, 10) : value;
  return isNaN(parsed) ? 0 : parsed;
};

const formatTime = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

const formatStatus = (status: string): string => {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Only in_progress status counts towards worked time
const WORKED_STATUSES = ["in_progress"];

// Calculate total time from ticket's history (only from in_progress, testable, completed statuses)
const calculateTimeFromHistory = (
  history: HistoryItem[] | undefined,
): number => {
  if (!history || history.length === 0) return 0;

  let totalMs = 0;
  let lastTime: Date | null = null;
  let lastStatus: string | null = null;

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime(),
  );

  sortedHistory.forEach((entry, index) => {
    const currentTime = new Date(entry.moved_at);
    const currentStatus = entry.to_status;

    // Only count time if the PREVIOUS status was a "worked" status
    if (lastStatus && lastTime && WORKED_STATUSES.includes(lastStatus)) {
      const durationMs = currentTime.getTime() - lastTime.getTime();
      totalMs += durationMs;
    }

    lastTime = currentTime;
    lastStatus = currentStatus;

    // If this is the last entry and current status is a "worked" status (not completed), add time until now
    if (
      index === sortedHistory.length - 1 &&
      WORKED_STATUSES.includes(currentStatus) &&
      currentStatus !== "completed"
    ) {
      const now = new Date();
      const durationMs = now.getTime() - currentTime.getTime();
      totalMs += durationMs;
    }
  });

  // Convert milliseconds to minutes
  return Math.floor(totalMs / 60000);
};

// Calculate total time from ticket's timeTakenPeriods, history, or alternative fields
const getTicketTotalTime = (ticket: Ticket): number => {
  // Check for history first (status transition tracking)
  if (ticket.history && ticket.history.length > 0) {
    return calculateTimeFromHistory(ticket.history);
  }
  // Check for timeTakenPeriods (array of time entries)
  if (ticket.timeTakenPeriods && ticket.timeTakenPeriods.length > 0) {
    return ticket.timeTakenPeriods.reduce(
      (total, period) => total + parseTime(period.time_taken),
      0,
    );
  }
  // Check alternative field names
  const timeTaken = parseTime(ticket.time_taken);
  if (timeTaken > 0) return timeTaken;
  const totalTime = parseTime(ticket.total_time);
  if (totalTime > 0) return totalTime;
  const timeSpent = parseTime(ticket.time_spent);
  if (timeSpent > 0) return timeSpent;
  return 0;
};

// ============ SUB-COMPONENTS ============

// Overview Stats Component
interface OverviewStatsProps {
  loading: boolean;
  totalWorked: number;
  totalTickets: number;
  p1Tickets: number;
}

const OverviewStats: React.FC<OverviewStatsProps> = ({
  loading,
  totalWorked,
  totalTickets,
  p1Tickets,
}) => (
  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
    <StatCard>
      <AccessTimeIcon sx={{ fontSize: 32, color: "var(--primary-color-1)" }} />
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#333" }}>
          {loading ? <Skeleton width={80} /> : formatTime(totalWorked)}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Total Worked Time
        </Typography>
      </Box>
    </StatCard>
    <StatCard>
      <ConfirmationNumberIcon
        sx={{ fontSize: 32, color: "var(--primary-color-2)" }}
      />
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#333" }}>
          {loading ? <Skeleton width={40} /> : totalTickets}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          Total Tickets
        </Typography>
      </Box>
    </StatCard>
    <StatCard>
      <WarningAmberIcon sx={{ fontSize: 32, color: "#d70000" }} />
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#333" }}>
          {loading ? <Skeleton width={40} /> : p1Tickets}
        </Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>
          P1 Tickets
        </Typography>
      </Box>
    </StatCard>
  </Stack>
);

// Nested Table for User View (Projects breakdown per user)
interface UserNestedTableProps {
  userId: string;
  filteredWorkData: WorkLog[];
  filteredTickets: Ticket[];
}

const UserNestedTable: React.FC<UserNestedTableProps> = ({
  userId,
  filteredWorkData,
  filteredTickets,
}) => {
  const projectBreakdowns = useMemo((): UserProjectBreakdown[] => {
    const breakdowns: Map<string, UserProjectBreakdown> = new Map();

    // Only aggregate from tickets (no work logs in nested table)
    // Show ALL tickets (time worked only counts in_progress via calculateTimeFromHistory)
    filteredTickets.forEach((ticket) => {
      if (ticket.current_user?.id !== userId) return;

      const projectName = ticket.project?.title || "Unknown";
      const priority = ticket.priority?.toLowerCase() || "";
      const ticketTime = getTicketTotalTime(ticket);
      const existing = breakdowns.get(projectName);
      if (existing) {
        existing.totalTickets += 1;
        existing.timeWorked += ticketTime;
        if (priority === "p1") existing.p1Tickets += 1;
        else if (priority === "p2") existing.p2Tickets += 1;
        else if (priority === "p3") existing.p3Tickets += 1;
      } else {
        breakdowns.set(projectName, {
          projectName,
          timeWorked: ticketTime,
          totalTickets: 1,
          p1Tickets: priority === "p1" ? 1 : 0,
          p2Tickets: priority === "p2" ? 1 : 0,
          p3Tickets: priority === "p3" ? 1 : 0,
        });
      }
    });

    return Array.from(breakdowns.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName),
    );
  }, [userId, filteredTickets]);

  if (projectBreakdowns.length === 0) {
    return (
      <NestedTableContainer>
        <Typography variant="body2" sx={{ color: "#666", py: 1 }}>
          No project data available for this user.
        </Typography>
      </NestedTableContainer>
    );
  }

  return (
    <NestedTableContainer>
      <TableContainer component={NestedTableBodyWrapper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <StickyNestedTableCell>Project Name</StickyNestedTableCell>
              <StickyNestedTableCell>Time Worked</StickyNestedTableCell>
              <StickyNestedTableCell>Total Tickets</StickyNestedTableCell>
              <StickyNestedTableCell>P1</StickyNestedTableCell>
              <StickyNestedTableCell>P2</StickyNestedTableCell>
              <StickyNestedTableCell>P3</StickyNestedTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projectBreakdowns.map((project, idx) => (
              <TableRow
                key={project.projectName}
                sx={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#f4f4f4",
                }}
              >
                <NestedDataCell sx={{ fontWeight: 500 }}>
                  {project.projectName}
                </NestedDataCell>
                <NestedDataCell>
                  {formatTime(project.timeWorked)}
                </NestedDataCell>
                <NestedDataCell>{project.totalTickets}</NestedDataCell>
                <NestedDataCell>{project.p1Tickets}</NestedDataCell>
                <NestedDataCell>{project.p2Tickets}</NestedDataCell>
                <NestedDataCell>{project.p3Tickets}</NestedDataCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </NestedTableContainer>
  );
};

// Nested Table for Project View (Tasks breakdown per project)
interface ProjectNestedTableProps {
  projectName: string;
  filteredWorkData: WorkLog[];
  filteredTickets: Ticket[];
}

const ProjectNestedTable: React.FC<ProjectNestedTableProps> = ({
  projectName,
  filteredWorkData,
  filteredTickets,
}) => {
  const taskBreakdowns = useMemo((): ProjectTaskBreakdown[] => {
    const tasks: ProjectTaskBreakdown[] = [];
    const seenTicketIds = new Set<string>();

    // Only get tickets (no work logs in nested table), no duplicates
    // Show ALL tickets (time worked only counts in_progress via calculateTimeFromHistory)
    filteredTickets.forEach((ticket) => {
      if (ticket.project?.title !== projectName) return;
      // Prevent duplicates
      if (seenTicketIds.has(ticket.id)) return;
      seenTicketIds.add(ticket.id);

      const priority = ticket.priority?.toUpperCase() || "-";
      tasks.push({
        taskName: ticket.title || `Ticket #${ticket.id.slice(0, 8)}`,
        assignee:
          `${ticket.current_user?.first_name || "Unknown"} ${ticket.current_user?.last_name || ""}`.trim(),
        ticketType: priority,
        status: formatStatus(ticket.status || ""),
        timeWorked: getTicketTotalTime(ticket),
      });
    });

    return tasks;
  }, [projectName, filteredTickets]);

  if (taskBreakdowns.length === 0) {
    return (
      <NestedTableContainer>
        <Typography variant="body2" sx={{ color: "#666", py: 1 }}>
          No task data available for this project.
        </Typography>
      </NestedTableContainer>
    );
  }

  return (
    <NestedTableContainer>
      <TableContainer component={NestedTableBodyWrapper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <StickyNestedTableCell>Task / Ticket Name</StickyNestedTableCell>
              <StickyNestedTableCell>Assigned To</StickyNestedTableCell>
              <StickyNestedTableCell>Ticket Type</StickyNestedTableCell>
              <StickyNestedTableCell>Status</StickyNestedTableCell>
              <StickyNestedTableCell>Time Worked</StickyNestedTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {taskBreakdowns.map((task, idx) => (
              <TableRow
                key={`${task.taskName}-${idx}`}
                sx={{
                  backgroundColor: idx % 2 === 0 ? "#fff" : "#f4f4f4",
                }}
              >
                <NestedDataCell sx={{ fontWeight: 500 }}>
                  {task.taskName}
                </NestedDataCell>
                <NestedDataCell>{task.assignee}</NestedDataCell>
                <NestedDataCell>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor:
                        task.ticketType === "P1"
                          ? "#ffebee"
                          : task.ticketType === "P2"
                            ? "#fff3e0"
                            : task.ticketType === "P3"
                              ? "#e8f5e9"
                              : "transparent",
                      color:
                        task.ticketType === "P1"
                          ? "#d32f2f"
                          : task.ticketType === "P2"
                            ? "#f57c00"
                            : task.ticketType === "P3"
                              ? "#388e3c"
                              : "#666",
                    }}
                  >
                    {task.ticketType}
                  </Box>
                </NestedDataCell>
                <NestedDataCell>{task.status}</NestedDataCell>
                <NestedDataCell>
                  {task.timeWorked > 0 ? formatTime(task.timeWorked) : "-"}
                </NestedDataCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </NestedTableContainer>
  );
};

// Main Table Component
interface MainTableProps {
  mode: "user" | "project";
  loading: boolean;
  data: UserSummary[] | ProjectSummary[];
  onRowClick: (item: UserSummary | ProjectSummary) => void;
  filteredWorkData: WorkLog[];
  filteredTickets: Ticket[];
}

const MainTable: React.FC<MainTableProps> = ({
  mode,
  loading,
  data,
  onRowClick,
  filteredWorkData,
  filteredTickets,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpand = (e: React.MouseEvent, rowId: string) => {
    e.stopPropagation();
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <StyledTableCell sx={{ width: 40 }} />
            {[...Array(6)].map((_, i) => (
              <StyledTableCell key={i}>
                <Skeleton />
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(5)].map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <DataTableCell />
              {[...Array(6)].map((_, colIndex) => (
                <DataTableCell key={colIndex}>
                  <Skeleton />
                </DataTableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6, color: "#666" }}>
        <Typography variant="body1">
          No {mode === "user" ? "users" : "projects"} found for the selected
          filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <StyledTableCell sx={{ width: 40 }} />
          <StyledTableCell>
            {mode === "user" ? "User" : "Project"}
          </StyledTableCell>
          <StyledTableCell>Total Worked</StyledTableCell>
          <StyledTableCell>P1 Tickets</StyledTableCell>
          <StyledTableCell>P2 Tickets</StyledTableCell>
          <StyledTableCell>P3 Tickets</StyledTableCell>
          <StyledTableCell>Total Tickets</StyledTableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((item, index) => {
          const rowId =
            mode === "user"
              ? (item as UserSummary).id
              : (item as ProjectSummary).name;
          const isExpanded = expandedRows.has(rowId);

          return (
            <React.Fragment key={rowId}>
              <TableRow
                onClick={() => onRowClick(item)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                  "&:hover": { backgroundColor: "#f0f7fa" },
                  transition: "background-color 0.15s ease",
                }}
              >
                <ExpandIconCell
                  onClick={(e) => toggleRowExpand(e, rowId)}
                  sx={{
                    cursor: "pointer",
                    textAlign: "center",
                    "&:hover": {
                      backgroundColor: "rgba(7, 152, 189, 0.08)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary-color-1, #0798bd)",
                    }}
                  >
                    {isExpanded ? (
                      <KeyboardArrowUpIcon fontSize="small" />
                    ) : (
                      <KeyboardArrowRightIcon fontSize="small" />
                    )}
                  </Box>
                </ExpandIconCell>
                <DataTableCell sx={{ fontWeight: 500 }}>
                  {"name" in item ? item.name : ""}
                </DataTableCell>
                <DataTableCell>{formatTime(item.totalWorked)}</DataTableCell>
                <DataTableCell>{item.p1Tickets}</DataTableCell>
                <DataTableCell>{item.p2Tickets}</DataTableCell>
                <DataTableCell>{item.p3Tickets}</DataTableCell>
                <DataTableCell>{item.totalTickets}</DataTableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7} sx={{ p: 0, border: "none" }}>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    {mode === "user" ? (
                      <UserNestedTable
                        userId={(item as UserSummary).id}
                        filteredWorkData={filteredWorkData}
                        filteredTickets={filteredTickets}
                      />
                    ) : (
                      <ProjectNestedTable
                        projectName={(item as ProjectSummary).name}
                        filteredWorkData={filteredWorkData}
                        filteredTickets={filteredTickets}
                      />
                    )}
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};

// Detail Drawer Component
interface TicketItem {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: string;
  status: string;
  created_at: string;
  description?: string;
  timeSpent: number; // Time spent in minutes calculated from history
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: "user" | "project";
  selectedItem: UserSummary | ProjectSummary | null;
  workLogTasks: TaskItem[];
  tickets: TicketItem[];
  onExport: (type: "summary" | "tasks") => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({
  open,
  onClose,
  mode,
  selectedItem,
  workLogTasks,
  tickets,
  onExport,
}) => {
  const [drawerTab, setDrawerTab] = useState<number>(0);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const exportMenuOpen = Boolean(exportAnchorEl);

  const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportSelect = (type: "summary" | "tasks") => {
    onExport(type);
    handleExportClose();
  };

  const hasData =
    selectedItem &&
    (selectedItem.totalWorked > 0 || selectedItem.totalTickets > 0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setDrawerTab(newValue);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 480 },
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
    >
      {/* Fixed Header */}
      <DrawerHeader>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
          {mode === "user" ? "User Details" : "Project Details"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DrawerHeader>

      {selectedItem && (
        <>
          {/* Fixed Summary Section */}
          <Box sx={{ px: 2, pt: 2, pb: 0, flexShrink: 0 }}>
            {/* Context Summary */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 1, color: "#333" }}
              >
                {"name" in selectedItem ? selectedItem.name : ""}
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                useFlexGap
                sx={{ color: "#666" }}
              >
                <Box>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Worked Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatTime(selectedItem.totalWorked)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Total Tickets
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedItem.totalTickets}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    P1
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#d32f2f" }}
                  >
                    {selectedItem.p1Tickets}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    P2
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#f57c00" }}
                  >
                    {selectedItem.p2Tickets}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: "block" }}>
                    P3
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#388e3c" }}
                  >
                    {selectedItem.p3Tickets}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Fixed Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={drawerTab}
                onChange={handleTabChange}
                sx={{
                  minHeight: 36,
                  "& .MuiTab-root": {
                    minHeight: 36,
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  },
                  "& .Mui-selected": {
                    color: "var(--primary-color-1, #0798bd) !important",
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "var(--primary-color-1, #0798bd)",
                  },
                }}
              >
                <Tab label={`Work Logs (${workLogTasks.length})`} />
                <Tab label={`Tickets (${tickets.length})`} />
              </Tabs>
            </Box>
          </Box>

          {/* Scrollable Tab Content */}
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              px: 2,
              py: 2,
            }}
          >
            {/* Work Logs Tab */}
            {drawerTab === 0 && (
              <Box>
                {workLogTasks.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#999" }}>
                    No work logs available
                  </Typography>
                ) : (
                  <List disablePadding>
                    {workLogTasks.slice(0, 20).map((task, index) => (
                      <TimelineItem key={index} disablePadding sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: "#333" }}
                            >
                              {task.task_name}
                            </Typography>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: "#666", display: "block" }}
                              >
                                {mode === "user"
                                  ? task.project?.title
                                  : `${task.user?.first_name || ""} ${task.user?.last_name || ""}`}
                              </Typography>
                              {task.description && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#777",
                                    display: "block",
                                    mt: 0.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {stripHtml(task.description).slice(0, 80)}
                                  {stripHtml(task.description).length > 80
                                    ? "..."
                                    : ""}
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#999",
                                  mt: 0.5,
                                  display: "block",
                                }}
                              >
                                {dayjs(task.created_at).format("MMM D, YYYY")} ·{" "}
                                {parseTime(task.time_taken) > 0
                                  ? formatTime(parseTime(task.time_taken))
                                  : "No time logged"}{" "}
                                · {formatStatus(task.status)}
                              </Typography>
                            </Box>
                          }
                        />
                      </TimelineItem>
                    ))}
                    {workLogTasks.length > 20 && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#999", pl: 4 }}
                      >
                        + {workLogTasks.length - 20} more work logs
                      </Typography>
                    )}
                  </List>
                )}
              </Box>
            )}

            {/* Tickets Tab */}
            {drawerTab === 1 && (
              <Box>
                {tickets.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#999" }}>
                    No tickets available
                  </Typography>
                ) : (
                  <List disablePadding>
                    {tickets.slice(0, 20).map((ticket, index) => (
                      <TimelineItem key={index} disablePadding sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: "#333" }}
                              >
                                {ticket.title}
                              </Typography>
                              {ticket.priority && (
                                <Box
                                  component="span"
                                  sx={{
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: "4px",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    backgroundColor:
                                      ticket.priority === "P1"
                                        ? "#ffebee"
                                        : ticket.priority === "P2"
                                          ? "#fff3e0"
                                          : ticket.priority === "P3"
                                            ? "#e8f5e9"
                                            : "#f5f5f5",
                                    color:
                                      ticket.priority === "P1"
                                        ? "#d32f2f"
                                        : ticket.priority === "P2"
                                          ? "#f57c00"
                                          : ticket.priority === "P3"
                                            ? "#388e3c"
                                            : "#666",
                                  }}
                                >
                                  {ticket.priority}
                                </Box>
                              )}
                            </Box>
                          }
                          secondaryTypographyProps={{ component: "div" }}
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: "#666", display: "block" }}
                              >
                                {mode === "user"
                                  ? ticket.project
                                  : ticket.assignee}
                              </Typography>
                              {ticket.description && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#777",
                                    display: "block",
                                    mt: 0.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {stripHtml(ticket.description).slice(0, 80)}
                                  {stripHtml(ticket.description).length > 80
                                    ? "..."
                                    : ""}
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#999",
                                  mt: 0.5,
                                  display: "block",
                                }}
                              >
                                {dayjs(ticket.created_at).format("MMM D, YYYY")}{" "}
                                ·{" "}
                                {ticket.timeSpent > 0
                                  ? formatTime(ticket.timeSpent)
                                  : "No time logged"}{" "}
                                · {formatStatus(ticket.status)}
                              </Typography>
                            </Box>
                          }
                        />
                      </TimelineItem>
                    ))}
                    {tickets.length > 20 && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#999", pl: 4 }}
                      >
                        + {tickets.length - 20} more tickets
                      </Typography>
                    )}
                  </List>
                )}
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Fixed Export Button */}
      <Box sx={{ p: 2, borderTop: "1px solid #eee", flexShrink: 0 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<FileDownloadIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleExportClick}
          disabled={!hasData}
          sx={{
            backgroundColor: "var(--primary-color-1, #0798bd)",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "var(--primary-color-1-hover, #0799bdc8)",
            },
            "&.Mui-disabled": {
              backgroundColor: "#ccc",
            },
          }}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportAnchorEl}
          open={exportMenuOpen}
          onClose={handleExportClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <MenuItem onClick={() => handleExportSelect("summary")}>
            Export Summary
          </MenuItem>
          <MenuItem onClick={() => handleExportSelect("tasks")}>
            Export Tasks
          </MenuItem>
        </Menu>
      </Box>
    </Drawer>
  );
};

// ============ MAIN COMPONENT ============
const UserReport = () => {
  // State
  const [empUserList, setEmpUserList] = useState<User[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Dayjs | null>(
    dayjs().subtract(1, "month"),
  );
  const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"user" | "project">("user");
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [loadingWorkLogs, setLoadingWorkLogs] = useState<boolean>(true);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
  const [userWorkData, setUserWorkData] = useState<WorkLog[]>([]);
  const [ticketData, setTicketData] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<
    UserSummary | ProjectSummary | null
  >(null);

  const axiosInstance = createAxiosInstance();
  const userPriority = useAppselector(
    (state) => state.role.value?.priority ?? 0,
  );

  // API Calls
  const fetchWorkLogs = useCallback(async () => {
    try {
      setLoadingWorkLogs(true);
      setError(null);
      const params: any = {};
      if (employeeId) params.user_id = employeeId;
      if (fromDate) params.start_date = fromDate.format("YYYY-MM-DD");
      if (toDate) params.end_date = toDate.format("YYYY-MM-DD");

      const response = await axiosInstance.get("/work-logs/all-user-reports", {
        params,
      });
      setUserWorkData(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch work logs:", error);
      setError("Failed to load work logs. Please try again.");
      setUserWorkData([]);
    } finally {
      setLoadingWorkLogs(false);
    }
  }, [employeeId, fromDate, toDate]);

  const fetchTickets = useCallback(async () => {
    if (userPriority === 1) {
      setTicketData([]);
      setLoadingTickets(false);
      return;
    }

    try {
      setLoadingTickets(true);
      setError(null);
      const params: any = {};
      if (employeeId) params.user_id = employeeId;
      if (fromDate) params.start_date = fromDate.format("YYYY-MM-DD");
      if (toDate) params.end_date = toDate.format("YYYY-MM-DD");

      const response = await axiosInstance.get("/task-maangement/list", {
        params,
      });
      setTicketData(response.data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setError("Failed to load tickets. Please try again.");
      setTicketData([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [employeeId, fromDate, toDate, userPriority]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError(null);
        const response = await axiosInstance.get("/user/list");
        setEmpUserList(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError("Failed to load users. Please try again.");
        setEmpUserList([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchWorkLogs();
    fetchTickets();
  }, [fetchWorkLogs, fetchTickets]);

  // Data Processing
  const filteredWorkData = useMemo(() => {
    if (!fromDate || !toDate) return [];
    return userWorkData.filter((work) => {
      const createdDate = dayjs(work.created_at);
      return (
        createdDate.isSameOrAfter(fromDate, "day") &&
        createdDate.isSameOrBefore(toDate, "day")
      );
    });
  }, [userWorkData, fromDate, toDate]);

  const filteredTickets = useMemo(() => {
    if (!fromDate || !toDate) return [];
    return ticketData.filter((ticket) => {
      const createdDate = dayjs(ticket.created_at);
      const inRange =
        createdDate.isSameOrAfter(fromDate, "day") &&
        createdDate.isSameOrBefore(toDate, "day");
      const matchesEmployee =
        employeeId && employeeId !== "All"
          ? ticket.current_user?.id === employeeId
          : true;
      const matchesProject =
        selectedProject === "All"
          ? true
          : ticket.project?.title === selectedProject;
      return inRange && matchesEmployee && matchesProject;
    });
  }, [ticketData, fromDate, toDate, employeeId, selectedProject]);

  const projectSummaries = useMemo(() => {
    const summaries: ProjectSummary[] = [];

    // Only aggregate from tickets (time = in_progress time from history)
    filteredTickets.forEach((ticket) => {
      const projectName = ticket.project?.title || "Unknown";
      const project = summaries.find((p) => p.name === projectName);
      const priority = ticket.priority?.toLowerCase() || "";
      const ticketTime = getTicketTotalTime(ticket);
      if (project) {
        project.totalTickets += 1;
        project.totalWorked += ticketTime;
        if (priority === "p1") project.p1Tickets += 1;
        else if (priority === "p2") project.p2Tickets += 1;
        else if (priority === "p3") project.p3Tickets += 1;
      } else {
        summaries.push({
          name: projectName,
          totalWorked: ticketTime,
          p1Tickets: priority === "p1" ? 1 : 0,
          p2Tickets: priority === "p2" ? 1 : 0,
          p3Tickets: priority === "p3" ? 1 : 0,
          totalTickets: 1,
        });
      }
    });

    return summaries;
  }, [filteredTickets]);

  const userSummaries = useMemo(() => {
    const summaries: UserSummary[] = [];

    // Only aggregate from tickets (time = in_progress time from history)
    filteredTickets.forEach((ticket) => {
      if (!ticket.current_user || !ticket.current_user.id) return;
      if (
        selectedProject === "All" ||
        ticket.project?.title === selectedProject
      ) {
        const userId = ticket.current_user.id;
        const userName = `${ticket.current_user?.first_name || "Unknown"} ${ticket.current_user?.last_name || ""}`;
        const priority = ticket.priority?.toLowerCase() || "";
        const ticketTime = getTicketTotalTime(ticket);
        const existingUser = summaries.find((u) => u?.id === userId);
        if (existingUser) {
          existingUser.totalTickets += 1;
          existingUser.totalWorked += ticketTime;
          if (priority === "p1") existingUser.p1Tickets += 1;
          else if (priority === "p2") existingUser.p2Tickets += 1;
          else if (priority === "p3") existingUser.p3Tickets += 1;
        } else {
          summaries.push({
            id: userId,
            name: userName,
            totalWorked: ticketTime,
            p1Tickets: priority === "p1" ? 1 : 0,
            p2Tickets: priority === "p2" ? 1 : 0,
            p3Tickets: priority === "p3" ? 1 : 0,
            totalTickets: 1,
          });
        }
      }
    });

    return summaries;
  }, [filteredTickets, selectedProject]);

  const filteredProjects = useMemo(() => {
    return selectedProject === "All"
      ? projectSummaries
      : projectSummaries.filter((project) => project.name === selectedProject);
  }, [projectSummaries, selectedProject]);

  const filteredUsers = useMemo(() => {
    return selectedProject === "All"
      ? userSummaries
      : userSummaries.filter((user) =>
          filteredTickets.some(
            (ticket) =>
              ticket.current_user?.id === user.id &&
              ticket.project?.title === selectedProject,
          ),
        );
  }, [userSummaries, selectedProject, filteredTickets]);

  const filteredTasks = useMemo((): TaskItem[] => {
    // Tasks from work logs
    const workLogTasks: TaskItem[] = filteredWorkData
      .flatMap((work) =>
        work.taskReports.map((task) => ({
          ...task,
          time_taken: parseTime(task.time_taken),
          created_at: work.created_at,
          user: work.user || { id: "", first_name: "Unknown", last_name: "" },
        })),
      )
      .filter(
        (task) =>
          selectedProject === "All" || task.project?.title === selectedProject,
      );

    // Convert tickets to TaskItem format - only include tickets that have time data
    // (to avoid duplicating work log entries that already show the same tasks)
    const ticketTasks: TaskItem[] = filteredTickets
      .filter((ticket) => {
        // Only include if project matches
        if (
          selectedProject !== "All" &&
          ticket.project?.title !== selectedProject
        ) {
          return false;
        }
        // Only include tickets that have time data (to avoid duplicates with work logs)
        const ticketTime = getTicketTotalTime(ticket);
        return ticketTime > 0;
      })
      .map((ticket) => ({
        task_name: ticket.title || `Ticket #${ticket.id.slice(0, 8)}`,
        project: {
          id: "",
          title: ticket.project?.title || "Unknown",
        },
        time_taken: getTicketTotalTime(ticket),
        status: ticket.status || "Unknown",
        description: ticket.description || "",
        created_at: ticket.created_at,
        user: {
          id: ticket.current_user?.id || "",
          first_name: ticket.current_user?.first_name || "Unknown",
          last_name: ticket.current_user?.last_name || "",
        },
        priority: ticket.priority?.toUpperCase() || undefined,
      }));

    // Combine and sort by date
    return [...workLogTasks, ...ticketTasks].sort((a, b) =>
      dayjs(b.created_at).diff(dayjs(a.created_at)),
    );
  }, [filteredWorkData, filteredTickets, selectedProject]);

  // Get work log tasks for selected drawer item
  const drawerWorkLogs = useMemo((): TaskItem[] => {
    if (!selectedItem) return [];

    // Get work log tasks only (not ticket-derived tasks)
    const workLogTasks: TaskItem[] = filteredWorkData.flatMap((work) =>
      work.taskReports.map((task) => ({
        ...task,
        time_taken: parseTime(task.time_taken),
        created_at: work.created_at,
        user: work.user || { id: "", first_name: "Unknown", last_name: "" },
      })),
    );

    if (viewMode === "user") {
      const userId = (selectedItem as UserSummary).id;
      return workLogTasks
        .filter((task) => task.user?.id === userId)
        .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)));
    } else {
      const projectName = (selectedItem as ProjectSummary).name;
      return workLogTasks
        .filter((task) => task.project?.title === projectName)
        .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)));
    }
  }, [selectedItem, viewMode, filteredWorkData]);

  // Get tickets for selected drawer item
  const drawerTickets = useMemo((): TicketItem[] => {
    if (!selectedItem) return [];

    const ticketItems: TicketItem[] = filteredTickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title || `Ticket #${ticket.id.slice(0, 8)}`,
      project: ticket.project?.title || "Unknown",
      assignee:
        `${ticket.current_user?.first_name || "Unknown"} ${ticket.current_user?.last_name || ""}`.trim(),
      priority: ticket.priority?.toUpperCase() || "",
      status: ticket.status || "Unknown",
      created_at: ticket.created_at,
      description: ticket.description || "",
      timeSpent: calculateTimeFromHistory(ticket.history),
    }));

    if (viewMode === "user") {
      const userId = (selectedItem as UserSummary).id;
      return ticketItems
        .filter((ticketItem) =>
          filteredTickets.some(
            (t) => t.id === ticketItem.id && t.current_user?.id === userId,
          ),
        )
        .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)));
    } else {
      const projectName = (selectedItem as ProjectSummary).name;
      return ticketItems
        .filter((ticketItem) => ticketItem.project === projectName)
        .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)));
    }
  }, [selectedItem, viewMode, filteredTickets]);

  // Legacy drawerTasks for backward compatibility (used in export)
  const drawerTasks = useMemo((): TaskItem[] => {
    if (!selectedItem) return [];

    if (viewMode === "user") {
      const userId = (selectedItem as UserSummary).id;
      return filteredTasks.filter((task) => task.user?.id === userId);
    } else {
      const projectName = (selectedItem as ProjectSummary).name;
      return filteredTasks.filter(
        (task) => task.project?.title === projectName,
      );
    }
  }, [selectedItem, viewMode, filteredTasks]);

  // Computed totals
  const totalWorkedMinutes = filteredProjects.reduce(
    (sum, project) => sum + project.totalWorked,
    0,
  );
  const totalTickets = filteredProjects.reduce(
    (sum, project) => sum + project.totalTickets,
    0,
  );
  const p1Tickets = filteredProjects.reduce(
    (sum, project) => sum + project.p1Tickets,
    0,
  );

  const projectOptions = useMemo(() => {
    return [
      "All",
      ...[...new Set(projectSummaries.map((project) => project.name))].sort(
        (a, b) => a.localeCompare(b),
      ),
    ];
  }, [projectSummaries]);

  // Event Handlers
  const handleRefresh = () => {
    fetchWorkLogs();
    fetchTickets();
  };

  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: "user" | "project" | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setDrawerOpen(false);
      setSelectedItem(null);
    }
  };

  const handleRowClick = (item: UserSummary | ProjectSummary) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
  };

  // Export all reports (summary table + work log details + ticket details) to Excel
  const handleExportAllToExcel = () => {
    const wb = XLSX.utils.book_new();
    const dateRange = `${fromDate?.format("YYYY-MM-DD") || "N/A"} to ${toDate?.format("YYYY-MM-DD") || "N/A"}`;

    // Sheet 1: Summary (current view - User or Project)
    const summaryData =
      viewMode === "user"
        ? (filteredUsers as UserSummary[]).map((u) => ({
            Name: u.name,
            "Total Worked (min)": u.totalWorked,
            "Total Worked": formatTime(u.totalWorked),
            "Total Tickets": u.totalTickets,
            "P1 Tickets": u.p1Tickets,
            "P2 Tickets": u.p2Tickets,
            "P3 Tickets": u.p3Tickets,
          }))
        : (filteredProjects as ProjectSummary[]).map((p) => ({
            "Project Name": p.name,
            "Total Worked (min)": p.totalWorked,
            "Total Worked": formatTime(p.totalWorked),
            "Total Tickets": p.totalTickets,
            "P1 Tickets": p.p1Tickets,
            "P2 Tickets": p.p2Tickets,
            "P3 Tickets": p.p3Tickets,
          }));

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
      { wch: 28 },
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, viewMode === "user" ? "User Summary" : "Project Summary");

    // Sheet 2: Work log details (all task reports from filtered work logs)
    const workLogRows = filteredWorkData.flatMap((work) =>
      (work.taskReports || []).map((task) => ({
        "Report Date": dayjs(work.created_at).format("YYYY-MM-DD"),
        User: work.user
          ? `${work.user.first_name || ""} ${work.user.last_name || ""}`.trim() || work.user.email || "—"
          : "—",
        Project: task.project?.title || "—",
        "Task Name": task.task_name,
        Description: task.description ? stripHtml(task.description) : "",
        "Time Taken (min)": parseTime(task.time_taken),
        "Time Taken": formatTime(parseTime(task.time_taken)),
        Status: task.status || "—",
      })),
    );
    const wsWorkLog = XLSX.utils.json_to_sheet(workLogRows.length ? workLogRows : [{ "Report Date": "No work log data in selected range." }]);
    wsWorkLog["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 32 }, { wch: 40 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsWorkLog, "Work Log Details");

    // Sheet 3: Ticket details (all filtered tickets)
    const ticketRows = filteredTickets.map((ticket) => ({
      Title: ticket.title || `Ticket #${ticket.id?.slice(0, 8) || "—"}`,
      Project: ticket.project?.title || "—",
      Assignee: ticket.current_user
        ? `${ticket.current_user.first_name || ""} ${ticket.current_user.last_name || ""}`.trim() || ticket.current_user.email || "—"
        : "—",
      Priority: (ticket.priority || "—").toUpperCase(),
      Status: ticket.status || "—",
      "Created Date": dayjs(ticket.created_at).format("YYYY-MM-DD"),
      "Time Spent (min)": getTicketTotalTime(ticket),
      "Time Spent": formatTime(getTicketTotalTime(ticket)),
      Description: ticket.description ? stripHtml(ticket.description) : "",
    }));
    const wsTickets = XLSX.utils.json_to_sheet(ticketRows.length ? ticketRows : [{ Title: "No ticket data in selected range." }]);
    wsTickets["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsTickets, "Ticket Details");

    const filename = `all_reports_${viewMode}_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    const buf = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xff;
    saveAs(new Blob([buf], { type: "application/octet-stream" }), filename);
  };

  // Export Functions (drawer - single user/project)
  const handleExport = (type: "summary" | "tasks") => {
    if (!selectedItem) return;

    const wb = XLSX.utils.book_new();
    const itemName = "name" in selectedItem ? selectedItem.name : "Unknown";
    const safeItemName = itemName.replace(/[^a-zA-Z0-9]/g, "_");

    if (type === "summary") {
      const summaryData = [
        [
          viewMode === "user"
            ? "User Summary Report"
            : "Project Summary Report",
        ],
        ["Name", itemName],
        ["Total Worked Time", formatTime(selectedItem.totalWorked)],
        ["Total Tickets", selectedItem.totalTickets],
        ["P1 Tickets", selectedItem.p1Tickets],
        ["P2 Tickets", selectedItem.p2Tickets],
        ["P3 Tickets", selectedItem.p3Tickets],
        [],
        [
          "Date Range",
          `${fromDate?.format("YYYY-MM-DD") || "N/A"} to ${toDate?.format("YYYY-MM-DD") || "N/A"}`,
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      ws["!cols"] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, "Summary");

      const filename = `${viewMode}_summary_${safeItemName}_${dayjs().format("YYYYMMDD")}.xlsx`;
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++)
        view[i] = wbout.charCodeAt(i) & 0xff;
      const blob = new Blob([buf], { type: "application/octet-stream" });
      saveAs(blob, filename);
    } else {
      const taskRows = drawerTasks.map((task) => ({
        "Task Name": task.task_name,
        [viewMode === "user" ? "Project" : "Assignee"]:
          viewMode === "user"
            ? task.project?.title || "Unknown"
            : `${task.user?.first_name || ""} ${task.user?.last_name || ""}`,
        Date: dayjs(task.created_at).format("YYYY-MM-DD"),
        "Time Taken": formatTime(parseTime(task.time_taken)),
        Status: task.status,
        Description: task.description ? stripHtml(task.description) : "",
      }));

      const ws = XLSX.utils.json_to_sheet(taskRows);
      ws["!cols"] = [
        { wch: 30 },
        { wch: 25 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 40 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Tasks");

      const filename = `${viewMode}_tasks_${safeItemName}_${dayjs().format("YYYYMMDD")}.xlsx`;
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++)
        view[i] = wbout.charCodeAt(i) & 0xff;
      const blob = new Blob([buf], { type: "application/octet-stream" });
      saveAs(blob, filename);
    }
  };

  const loading = loadingWorkLogs || loadingTickets;

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Sticky Filter Bar */}
      <FilterBar>
        <Stack
          direction="row"
          alignItems="center"
          spacing={3}
          flexWrap="wrap"
          useFlexGap
        >
          {/* Mode Switch */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ backgroundColor: "#f0f0f0", borderRadius: "6px", p: 0.5 }}
          >
            <StyledToggleButton value="user">
              <PersonIcon sx={{ mr: 1, fontSize: 18 }} />
              User
            </StyledToggleButton>
            <StyledToggleButton value="project">
              <FolderIcon sx={{ mr: 1, fontSize: 18 }} />
              Project
            </StyledToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {/* Employee Selector */}
          <Box sx={{ minWidth: 220 }}>
            {loadingUsers ? (
              <Skeleton
                variant="rectangular"
                height={56}
                sx={{ borderRadius: "6px" }}
              />
            ) : (
              <Autocomplete
                value={
                  empUserList.find((user) => user?.id === employeeId) || null
                }
                onChange={(_, newValue) =>
                  setEmployeeId(newValue ? newValue.id : null)
                }
                options={empUserList}
                getOptionLabel={(option) =>
                  `${option?.first_name || "Unknown"} ${option?.last_name || ""}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by User"
                    placeholder="All Users"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />
            )}
          </Box>

          {/* Project Selector */}
          <Box sx={{ minWidth: 220 }}>
            {loadingWorkLogs ? (
              <Skeleton
                variant="rectangular"
                height={56}
                sx={{ borderRadius: "6px" }}
              />
            ) : (
              <Autocomplete
                value={selectedProject}
                onChange={(_, newValue) =>
                  setSelectedProject((newValue as string) || "All")
                }
                options={projectOptions}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Project"
                    placeholder="All Projects"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "6px" } }}
              />
            )}
          </Box>

          {/* Date Range */}
          <TextField
            type="date"
            value={fromDate ? fromDate.format("YYYY-MM-DD") : ""}
            onChange={(e) =>
              setFromDate(e.target.value ? dayjs(e.target.value) : null)
            }
            size="small"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 160,
              "& .MuiOutlinedInput-root": { borderRadius: "6px" },
            }}
          />
          <TextField
            type="date"
            value={toDate ? toDate.format("YYYY-MM-DD") : ""}
            onChange={(e) =>
              setToDate(e.target.value ? dayjs(e.target.value) : null)
            }
            size="small"
            label="To Date"
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 160,
              "& .MuiOutlinedInput-root": { borderRadius: "6px" },
            }}
          />

          {/* Refresh Button */}
          <Button
            variant="contained"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            disabled={loading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "var(--primary-color-1, #0798bd)",
              borderRadius: "6px",
              px: 2,
              "&:hover": {
                backgroundColor: "var(--primary-color-1-hover, #0799bdc8)",
              },
            }}
          >
            Refresh
          </Button>

          {/* Export all to Excel */}
          <Button
            variant="outlined"
            onClick={handleExportAllToExcel}
            startIcon={<FileDownloadIcon />}
            disabled={loading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "6px",
              px: 2,
              borderColor: "var(--primary-color-1, #0798bd)",
              color: "var(--primary-color-1, #0798bd)",
              "&:hover": {
                borderColor: "var(--primary-color-1-hover, #0799bdc8)",
                backgroundColor: "rgba(7, 152, 189, 0.08)",
              },
            }}
          >
            Export to Excel
          </Button>
        </Stack>
      </FilterBar>

      {/* Main Content */}
      <Box sx={{ p: 2 }}>
        {/* Error Message */}
        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#fdf3f5",
              borderRadius: "6px",
            }}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* Overview Stats */}
        <OverviewStats
          loading={loading}
          totalWorked={totalWorkedMinutes}
          totalTickets={totalTickets}
          p1Tickets={p1Tickets}
        />

        {/* Main Table */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <MainTable
            mode={viewMode}
            loading={loading}
            data={viewMode === "user" ? filteredUsers : filteredProjects}
            onRowClick={handleRowClick}
            filteredWorkData={filteredWorkData}
            filteredTickets={filteredTickets}
          />
        </Box>
      </Box>

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        mode={viewMode}
        selectedItem={selectedItem}
        workLogTasks={drawerWorkLogs}
        tickets={drawerTickets}
        onExport={handleExport}
      />
    </Box>
  );
};

export default UserReport;
