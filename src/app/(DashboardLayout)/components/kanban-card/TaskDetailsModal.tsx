import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Avatar,
  IconButton,
  Fade,
  LinearProgress,
  Button,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogActions,
  DialogTitle,
  InputLabel,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  BoxProps,
  DialogContent,
  Checkbox,
  TableBody,
  TableRow,
  TableCell,
  Table,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Close as CloseIcon,
  Receipt,
  Folder,
  HourglassEmpty,
  Sync,
  BugReport,
  Refresh,
  Done,
  AccessTime,
  Flag,
  Error as ExclamationIcon,
  CheckCircle,
  PersonAdd as ReassignIcon,
  History as HistoryIcon,
  EditOff,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import toast from "react-hot-toast";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/navigation";
import { AssignmentHistory, HistoryItem, SubTaskType, TicketStatus, useTaskContext } from "@/contextapi/TaskContext";
import SendIcon from "@mui/icons-material/Send";
import AttachmentIcon from "@mui/icons-material/Attachment";
import theme from "@/utils/theme";
import Tiptap from "./Tiptap";
import PersonIcon from '@mui/icons-material/Person';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AddIcon from '@mui/icons-material/Add';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { Open_Sans } from "next/font/google";
import { on } from "events";
import { uploadFile } from "@/utils/UploadFile";
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import AttachFileIcon from '@mui/icons-material/AttachFile';

// Define interfaces
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
  };
  project_id: string;
  description: string;
  deadline_minutes: string;
  history?: HistoryItem[];
  assignment_history?: AssignmentHistory[];
  subTasks?: SubTaskType[];
  totalSubTasks?: number;
  completedSubTasks?: number;
  pendingSubTasks?: number;
  inprogressSubTasks?: number;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface TaskCorrespondence {
  id: string;
  message: string;
  attachment:string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  status: string;
}

interface MessageBubbleProps extends BoxProps {
  isCurrentUser?: boolean;
}

// Styled components
const ModalContainer = styled(Box)(({ theme }) => ({
  width: "95vw",
  maxWidth: "1400px",
  background: "#FFFFFF",
  borderRadius: 12,
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  padding: theme.spacing(2),
  position: "relative",
  outline: "none",
  display: "flex",
  flexDirection: "row",
  height: "80vh",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
    width: "98vw",
    flexDirection: "column",
    height: "auto",
  },
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  width: "65%",
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
  "&::-webkit-scrollbar": {
    width: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#D1D5DB",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  scrollbarWidth: "thin",
  scrollbarColor: "#D1D5DB transparent",
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 0,
  background: "#FFFFFF",
  zIndex: 1,
  padding: theme.spacing(1, 2, 0.5, 0),
  // borderBottom: "1px solid #E8ECEF",
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  paddingRight: theme.spacing(1),
  "&::-webkit-scrollbar": {
    width: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#D1D5DB",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  scrollbarWidth: "thin",
  scrollbarColor: "#D1D5DB transparent",
}));

const RightPanel = styled(Box)(({ theme }) => ({
  width: "35%",
  display: "flex",
  flexDirection: "column",
  // border: "1px solid #E8ECEF",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    marginTop: theme.spacing(2),
    borderLeft: "none",
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: "#1E2E3E",
  padding: theme.spacing(1, 2),
  fontSize: "1.25rem",
  letterSpacing: "-0.3px",
  [theme.breakpoints.down("sm")]: {
    fontSize: "1.1rem",
  },
  // borderBottom: "1px solid #E8ECEF",
  position: "sticky",
  top: 0,
  background: "#FFFFFF",
  zIndex: 1,
}));

const DetailSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
}));

const DetailRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(0.5),
  },
}));

const Label = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: "#6B7280",
  width: 100,
  fontSize: "0.9rem",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  [theme.breakpoints.down("sm")]: {
    width: "auto",
    fontSize: "0.85rem",
  },
}));

const Value = styled(Typography)<{ component?: "div" | "span" }>(({ theme }) => ({
  flex: 1,
  color: "#1E2E3E",
  fontSize: "0.9rem",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const TimeSpentTable = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(1),
  background: "#FFFFFF",
  borderRadius: 6,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
}));

const TimeSpentHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0.5, 0),
  borderBottom: "1px solid #E8ECEF",
  marginBottom: theme.spacing(0.5),
}));

const TimeSpentHeaderCell = styled(Typography)(({ theme }) => ({
  flex: 1,
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#1E2E3E",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  justifyContent: "center",
}));

const TimeSpentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(0.5, 0),
}));

const TimeSpentCell = styled(Typography)(({ theme }) => ({
  flex: 1,
  fontSize: "0.85rem",
  color: "#1E2E3E",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(0.5),
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isCurrentUser",
})<MessageBubbleProps>(({ theme, isCurrentUser }) => ({
  borderRadius: 6,
  padding: theme.spacing(1),
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  mb: theme.spacing(0.5),
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0.5),
  background: "#FFFFFF",
  border: "1px solid #E8ECEF",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  "&:hover": {
    borderColor: "#D1D5DB",
  },
  height: 36,
}));

export const EditorContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: 6,
  background: "#FFFFFF",
  border: "1px solid #E8ECEF",
  width: "100%",
  "& .ProseMirror": {
    minHeight: "80px",
    maxHeight: "250px",
    overflowY: "auto",
    padding: theme.spacing(0.5),
    "&:focus": {
      borderColor: "#3B82F6",
      outline: "none",
    },
    "& p.is-empty::before": {
      content: '"Add description..."',
      color: "#9CA3AF",
      float: "left",
      pointerEvents: "none",
      fontStyle: "italic",
    },
    "&::-webkit-scrollbar": {
      width: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#D1D5DB",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    scrollbarWidth: "thin",
    scrollbarColor: "#D1D5DB transparent",
  },
}));

const getPriorityDetails = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "p1":
      return { label: "P1 - Critical", color: "#DC2626" };
    case "p2":
      return { label: "P2 - High", color: "#EA580C" };
    case "p3":
      return { label: "P3 - Medium", color: "#16A34A" };
    default:
      return { label: priority, color: "#6B7280" };
  }
};

const PriorityChip = styled(Chip)(({ theme }) => ({
  borderRadius: 4,
  fontWeight: 600,
  fontSize: "0.85rem",
  height: 28,
  color: "#FFFFFF",
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  "& .MuiSelect-icon": {
    right: 0,
    borderLeft: "1px solid rgba(255, 255, 255, 0.3)",
    paddingLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
    color: "#FFFFFF",
  },
}));

const GlassBox = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  padding: theme.spacing(0.5),
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.1)',
  },
}));

const LabelBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2dd4bf 30%, #26a69a 90%)',
  color: '#ffffff',
  padding: theme.spacing(1, 2),
  borderRadius: '8px 0 0 8px',
  fontSize: '0.9rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  height: '50px',
  border: 'none',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '0 8px 8px 0',
    background: 'rgba(255, 255, 255, 0.05)',
    height: '48px',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&:hover fieldset': {
      borderColor: '#b3bac5',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#2dd4bf',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '0.9rem',
    color: '#1E2E3E',
    padding: theme.spacing(1.5, 2),
  },
  '& .MuiInputLabel-root': {
    color: '#5e6c84',
    fontSize: '0.9rem',
  },
}));

const StyledButton = styled(Button)(({ theme, variant }) => ({
  textTransform: 'none',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 600,
  padding: theme.spacing(1, 2.5),
  transition: 'all 0.2s ease',
  ...(variant === 'contained' && {
    background: 'linear-gradient(45deg, #2dd4bf 30%, #26a69a 90%)',
    color: '#ffffff',
    '&:hover': {
      background: 'linear-gradient(45deg, #26a69a 30%, #2dd4bf 90%)',
      transform: 'translateY(-1px)',
    },
  }),
  ...(variant === 'outlined' && {
    borderColor: '#6B7280',
    color: '#6B7280',
    background: 'rgba(255, 255, 255, 0.05)',
    '&:hover': {
      borderColor: '#2dd4bf',
      color: '#2dd4bf',
      background: 'rgba(255, 255, 255, 0.1)',
      transform: 'translateY(-1px)',
    },
  }),
}));

const SubtaskTable = styled(Table)(({ theme }) => ({
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #E8ECEF',
    padding: theme.spacing(1),
    fontSize: '0.85rem',
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
}));

// Status Styles
const statusColors = {
  pending: '#6B7280',
  in_progress: '#E4D00A',
  completed: '#6ec475',
  debugging: '#EF4444',
};

const getStatusDetails = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "Pending", color: "#f44336", icon: <HourglassEmpty sx={{ fontSize: 18 }} /> };
    case "in_progress":
      return { label: "In Progress", color: "#ff9800", icon: <Sync sx={{ fontSize: 18 }} /> };
    case "testable":
      return { label: "Testable", color: "#007bff", icon: <BugReport sx={{ fontSize: 18 }} /> };
    case "debugging":
      return { label: "Reopened", color: "#358f75", icon: <Refresh sx={{ fontSize: 18 }} /> };
    case "completed":
      return { label: "Completed", color: "#4caf50", icon: <Done sx={{ fontSize: 18 }} /> };
    case "on_hold":
      return { label: "On Hold", color: "#7f7f7f", icon: <PauseCircleOutlineIcon sx={{ fontSize: 18 }} /> };
    default:
      return { label: status, color: "#a3a3a3", icon: <HourglassEmpty sx={{ fontSize: 18 }} /> };
  }
};

const getTaskCountColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#f44336";
    case "in_progress":
      return "#ff9800";
    case "on_hold":
      return "#7f7f7f";
    case "testable":
      return "#007bff";
    case "debugging":
      return "#358f75";
    case "completed":
      return "#4caf50";
    default:
      return "#dfe1e6";
  }
};

const statusIcon = {
  pending: <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />,
  in_progress: <HourglassEmpty sx={{ fontSize: 18 }} />,
  on_hold: <PauseCircleOutlineIcon sx={{ fontSize: 18 }} />,
  testable: <BugReport sx={{ fontSize: 18 }} />,
  completed: <TaskAltIcon sx={{ fontSize: 18 }} />,
  // blocked: '#EF4444',
};
interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}
type ActivityItem =
  | { type: "message"; at: Date; data: TaskCorrespondence }
  | { type: "history"; at: Date; data: HistoryItem; source: "task" | "subtask"; subtaskTitle?: string }
| { type: "assignment"; at: Date; data: AssignmentHistory };

const getMimeTypeFromUrl = (url: string): string => {
  const extension = url.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
    case "jfif": // Add support for jfif
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    case "doc":
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "application/octet-stream"; // Fallback for unknown types
  }
};
const TaskDetailsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  report: Report;
  onUpdate: () => void;
}> = ({ open, onClose, report, onUpdate }) => {
  const { projects, handleDeleteTask, fetchTasks, taskId, setTaskId, allUsers } = useTaskContext();
  const axiosInstance = createAxiosInstance();
  const [miniModalOpen, setMiniModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(report.current_user.id || "");
  const authData = useAppselector((state) => state.auth.value);
  const statusInfo = {
    label: report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' '),
    color: statusColors[report.status as keyof typeof statusColors] || '#6B7280',
    icon: statusIcon[report.status as keyof typeof statusIcon] || <Flag sx={{ fontSize: 18, color: '#6B7280' }} />,
  };
  const priorityInfo = {
    label: report.priority.charAt(0).toUpperCase() + report.priority.slice(1),
    color: report.priority === "high" ? "#DC2626" : report.priority === "medium" ? "#EA580C" : "#16A34A",
  };
  const project = projects.find((p) => p.id === report.project_id);
  const projectName = project ? project.title : "Unknown Project";
  const userPriority = useAppselector((state) => state.role.value.priority);
  const router = useRouter();
    const [messages, setMessages] = useState<TaskCorrespondence[]>([]);
  const [loading, setLoading] = useState(false);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const [timeSpent, setTimeSpent] = useState<{ status: string; durationMs: number; duration: string }[]>([]);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState(report.title);
  const [description, setDescription] = useState(report.description || "");
  const [priority, setPriority] = useState(report.priority);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [deadlineDays, setDeadlineDays] = useState("");
  const [deadlineHours, setDeadlineHours] = useState("");
  const [deadlineTotalMinutes, setDeadlineTotalMinutes] = useState(report.deadline_minutes || "0");
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditingAssignedTime, setIsEditingAssignedTime] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskEditMode, setSubtaskEditMode] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [originalSubtaskInput, setOriginalSubtaskInput] = useState('');
  const [subtaskToEditId, setSubtaskToEditId] = useState('');
  const totalMinutes = parseInt(report.deadline_minutes || "0", 10);
  const initialDays = Math.floor(totalMinutes / (24 * 60));
  const initialHours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const [etaDays, setEtaDays] = useState<number>(initialDays);
  const [etaHours, setEtaHours] = useState<number>(initialHours);
  const history = report.history;
  const assignment = report.assignment_history;
  const allSubtasksHistory = report.subTasks?.flatMap(subtask => subtask.history) || [];
  const [activityFilter, setActivityFilter] = useState<"all" | "messages" | "tasks" | "subtasks" | "assignment" | "attachments">("all");  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const statusInfos = getStatusDetails(report.status);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string }>({ url: "", name: "" });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string }>({ url: "", name: "", type: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachmentFile(file);
  };


  const activities = useMemo(() => {
    const merged: ActivityItem[] = [
      ...(messages ?? []).map(m => ({ type: "message" as const, at: new Date(m.created_at), data: m })),
      ...(history ?? []).map(h => ({ type: "history" as const, at: new Date(h.moved_at), data: h, source: "task" as const })),
      ...(report.subTasks?.flatMap(subtask =>
        subtask.history.map(h => ({
          type: "history" as const,
          at: new Date(h.moved_at),
          data: h,
          source: "subtask" as const,
          subtaskTitle: subtask.title,
        }))
      ) ?? []),
      ...(assignment ?? []).map(a => ({
        type: "assignment" as const,
        at: new Date(a.updated_at),
        data: a,
      })),
    ];
    merged.sort((a, b) => b.at.getTime() - a.at.getTime());
    return merged;
  }, [messages, history, report.subTasks]);

  const getUserFullName = (userId: string | null) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : "System";
  };

  const filteredActivities = useMemo(() => {
    if (activityFilter === "all") return activities;
    if (activityFilter === "messages") return activities.filter(a => a.type === "message");
    if (activityFilter === "tasks") return activities.filter(a => a.type === "history" && a.source !== "subtask");
    if (activityFilter === "assignment") return activities.filter(a => a.type === "assignment");
    if (activityFilter === "subtasks") return activities.filter(a => a.type === "history" && a.source === "subtask");
    return activities;
  }, [activities, activityFilter]);

  useEffect(() => {
    const totalMinutes = parseInt(report.deadline_minutes || "0", 10);
    const time = {
      days: Math.floor(totalMinutes / 1440).toString(), 
      hours: Math.floor((totalMinutes % 1440) / 60).toString(),
    };
    setDeadlineDays(time.days);
    setDeadlineHours(time.hours);
    setDeadlineTotalMinutes(report.deadline_minutes || "0");
    setDescription(report.description || "");
    setTitle(report.title);
    setPriority(report.priority);
  }, [report]);

  useEffect(() => {
    if (!report?.history) {
      setTimeSpent([]);
      return;
    }
    const interval = setInterval(() => {
      const updatedTimeSpent = calculateTimeSpentPerStatus(report.history);
      setTimeSpent(updatedTimeSpent);
    }, 1000);
    return () => clearInterval(interval);
  }, [report?.history]);

  const fetchModalUsers = async () => {
    if (project.id) {
      try {
        const response = await axiosInstance.get(`/project-management/project-team/${project.id}`);
        const teamMembers = response.data.data || [];
        const mappedUsers: User[] = teamMembers.map((member: any) => ({
          id: member.user.id,
          first_name: member.user.first_name,
          last_name: member.user.last_name,
        }));
        setUsers(mappedUsers);
      } catch (error) {
        console.error("Failed to fetch project team members:", error);
        setUsers([]);
      }
    } else {
      setUsers([]);
    }
  };

  useEffect(() => {
    if (miniModalOpen) {
      fetchModalUsers();
    }
  }, [miniModalOpen]);

  useEffect(() => {
    if (open && report?.id) {
      fetchMessages();
    }
  }, [open, report?.id]);

  useEffect(() => {
    const changesDetected =
      title !== report.title ||
      description !== (report.description || "") ||
      priority !== report.priority ||
      deadlineTotalMinutes !== (report.deadline_minutes || "0");
    setHasChanges(changesDetected);
  }, [title, description, priority, deadlineTotalMinutes, report]);

  useEffect(() => {
    const days = parseInt(deadlineDays) || 0;
    const hours = parseInt(deadlineHours) || 0;

    const totalMinutes = days * 24 * 60 + hours * 60;

    if (totalMinutes >= 0) {
      setDeadlineTotalMinutes(totalMinutes.toString());
    }
  }, [deadlineDays, deadlineHours]);

  const handleReassign = async () => {
    const deadlineMinutes = etaDays * 24 * 60 + etaHours * 60;
    if (!selectedUser) return;
    const payload = {
      ticket_id: report?.id,            
      new_user_id: selectedUser,        
      updated_by: authData?.user.id,     
      deadline_minutes: deadlineMinutes.toString(),
    };
    setLoading(true);
    try {
      await axiosInstance.patch("/task-maangement/reassign", payload);
      setMiniModalOpen(false);
      toast.success("Ticket successfully reassigned.");
      await fetchTasks();
    } catch (err: any) {
      console.error("Error reassigning ticket:", err);
      toast.error(err?.response?.data?.message || "Failed to reassign ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = () => {
    if (report.id) {
      setTaskId(report.id);
      onClose();
    }
  };

  const fetchMessages = async () => {
    debugger;
    if (!report?.id) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/task-maangement/correspondence/${report.id}`);
      setMessages(response.data.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error(err?.response?.data?.message || "Failed to load correspondence.");
    } finally {
      setLoading(false);
    }
  };
  const sendMessage = async () => {
    if (!report?.id || !authData?.user?.id) {
      toast.error("Missing required data for sending message.");
      return;
    }
    if (!message.trim() && !attachmentFile) {
      toast.error("Message or attachment required.");
      return;
    }

    setLoading(true);
    try {
      let fileUrl: string | null = null;
      if (attachmentFile) {
        try {
          fileUrl = await uploadFile(attachmentFile);
          console.log("File uploaded successfully, URL:", fileUrl);
        } catch (uploadError: any) {
          console.error("File upload error:", uploadError.response?.data || uploadError.message);
          toast.error("Failed to upload attachment.");
          throw uploadError;
        }

        const attachmentPayload = {
          url: fileUrl,
          name: attachmentFile.name,
          type: attachmentFile.type,
          size: attachmentFile.size,
          uploaded_by: authData.user.id,
          uploaded_at: new Date().toISOString(),
        };

        try {
          const response = await axiosInstance.patch(
            `/task-maangement/add-attachment/${report.id}`,
            attachmentPayload
          );
          console.log("Attachment added successfully:", response.data);
        } catch (attachmentError: any) {
          console.error(
            "Attachment creation error:",
            attachmentError.response?.data || attachmentError.message
          );
          toast.error(
            attachmentError?.response?.data?.message || "Failed to add attachment."
          );
          throw attachmentError;
        }
      }

      const correspondencePayload = {
        task_ticket_id: report.id,
        sender_id: authData.user.id,
        message: message.trim() || "",
        attachment: fileUrl || undefined,
      };

      try {
        const response = await axiosInstance.post(
          "/task-maangement/correspondence",
          correspondencePayload
        );
        console.log("Correspondence posted successfully:", response.data);
      } catch (correspondenceError: any) {
        console.error(
          "Correspondence error:",
          correspondenceError.response?.data || correspondenceError.message
        );
        toast.error(
          correspondenceError?.response?.data?.message || "Failed to send message."
        );
        throw correspondenceError;
      }

      // Step 4: Reset state and refresh data
      setMessage("");
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
      toast.success("Message sent successfully!");
      await fetchMessages();
      const updatedAttachments = await fetchAttachments(report.id);
      setAttachments(updatedAttachments);
    } catch (err) {
      console.error("Error in sendMessage:", err);
      toast.error("An error occurred while sending the message.");
    } finally {
      setLoading(false);
    }
  };


  const updateMessageStatus = async (correspondenceId: string, status: "completed" | "pending") => {
    setLoading(true);
    try {
      await axiosInstance.patch(`/task-maangement/correspondence/${correspondenceId}`, { status });
      await fetchMessages();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update message status");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (title.trim()) {
        setIsEditingTitle(false);
      } else {
        toast.error("Title cannot be empty.");
      }
    }
  };

  const handleTitleBlur = () => {
    if (title.trim()) {
      setIsEditingTitle(false);
    } else {
      toast.error("Title cannot be empty.");
      setTitle(report.title);
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionClick = () => {
    setIsEditingDescription(true);
  };

  const handleCancelSubtask = () => {
    setSubtaskInput('');
    setIsAddingSubtask(false);
  };

  const handleAssignedTimeSave = () => {
    const days = parseInt(deadlineDays) || 0;
    const hours = parseInt(deadlineHours) || 0;

    if (days < 0 || hours < 0) {
      toast.error("Time values cannot be negative.");
      return;
    }

    const totalMinutes = days * 24 * 60 + hours * 60; // ✅ days + hours → minutes
    setDeadlineTotalMinutes(totalMinutes.toString());
    setIsEditingAssignedTime(false);
    setHasChanges(true);
  };

  const handleAssignedTimeCancel = () => {
    const totalMinutes = parseInt(report.deadline_minutes || "0");
    const time = {
      days: Math.floor(totalMinutes / 1440).toString(), // ✅ minutes → days
      hours: Math.floor((totalMinutes % 1440) / 60).toString(), // ✅ remainder → hours
    };

    setDeadlineDays(time.days);
    setDeadlineHours(time.hours);
    setDeadlineTotalMinutes(report.deadline_minutes || "0");
    setIsEditingAssignedTime(false);
  };

  const handleCancelChanges = () => {
    const totalMinutes = parseInt(report.deadline_minutes || "0");
    const time = {
      days: Math.floor(totalMinutes / 1440).toString(),
      hours: Math.floor((totalMinutes % 1440) / 60).toString(),
    };

    setDeadlineDays(time.days);
    setDeadlineHours(time.hours);
    setDeadlineTotalMinutes(report.deadline_minutes || "0");
    setDescription(report.description || "");
    setTitle(report.title);
    setPriority(report.priority);
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    setIsEditingAssignedTime(false);
    setIsEditingPriority(false);
  };


  const handleApplyChanges = async () => {
    debugger;
    if (!report?.id || !authData?.user?.id) {
      toast.error("Missing required data for update.");
      return;
    }
    if (!title.trim()) {
      toast.error("Title cannot be empty.");
      return;
    }
    if (description === "<p></p>" || description === "<p>Add description...</p>") {
      toast.error("Description cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { updated_by: authData.user.id };
      if (title !== report.title) payload.title = title;
      if (description !== (report.description || "")) payload.description = description;
      if (priority !== report.priority) payload.priority = priority.toLowerCase();
      const hours = parseInt(deadlineHours) || 0;
      const days = parseInt(deadlineDays) || 0;
      const newTotalMinutes =days*24 * 60 + hours*60;
      if (newTotalMinutes.toString() !== (report.deadline_minutes || "0")) {
        payload.deadline_minutes = newTotalMinutes.toString();
      }
      if (Object.keys(payload).length > 1) {
        await axiosInstance.patch(`/task-maangement/${report.id}`, payload);
        toast.success("Changes applied successfully.");
        await fetchTasks();
        onUpdate();
        setIsEditingTitle(false);
        setIsEditingDescription(false);
        setIsEditingAssignedTime(false);
        setIsEditingPriority(false);
      } else {
        toast.success("No changes to apply.");
      }
    } catch (err) {
      console.error("Error applying changes:", err);
      toast.error(err?.response?.data?.message || "Failed to apply changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = () => {
    if (description === "<p></p>" || description === "<p>Add description...</p>") {
      toast.error("Description cannot be empty.");
      return;
    }
    setIsEditingDescription(false);
  };

  const handleClose = () => {
    handleCancelChanges();
    onClose();
  };

  const stripHtml = (html: string): string => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const handleCreateSubtask = async () => {
    setHasChanges(false);
    try {
      if (!subtaskEditMode) {
        const payload = {
          title: `${report.ticket_no}/${report.totalSubTasks + 1}`,
          description: subtaskInput,
          taskTicketId: report.id,
          created_by: authData.user.id,
        };
        const response = await axiosInstance.post("/task-maangement/create-subtask", payload);
        toast.success("Subtask created successfully:", response.data);
      } else {
        const payload = {
          description: subtaskInput,
        };
        const response = await axiosInstance.put(`/task-maangement/edit-subtask/${subtaskToEditId}`, payload);
        toast.success("Subtask Updated successfully:", response.data);
      }
      setSubtaskToEditId(null);
      setSubtaskEditMode(false);
      setSubtaskInput('');
      setIsAddingSubtask(false);
      setHasChanges(true);
      fetchTasks();
    } catch (error: any) {
      toast.error("Error creating subtask:", error.response?.data || error.message);
    }
  };

  const handleSubtaskStatus = async (id: string, newStatus: TicketStatus) => {
    if (!report?.id) return;
    setLoading(true);
    try {
      const payload = {
        status: newStatus,
        moved_by: authData.user.id,
      };
      await axiosInstance.put(`/task-maangement/update-subtask-status/${id}`, payload);
      fetchTasks();
    } catch (err: any) {
      console.error("Error updating subtask status:", err);
      toast.error(err?.response?.data?.message || "Failed to update subtask status.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubtaskEditClick = (id: string, description: string) => {
    setOriginalSubtaskInput(description);
    setSubtaskEditMode(true);
    setSubtaskInput(description);
    setSubtaskToEditId(id);
  };

  const calculateTimeSpentPerStatus = (history: HistoryItem[] | undefined) => {
    if (!history || history.length === 0) return [];
    const timeSpent: { [key: string]: number } = {};
    let lastTime: Date | null = null;
    let lastStatus: string | null = null;
    const sortedHistory = [...history].sort((a, b) => new Date(a.moved_at).getTime() - new Date(b.moved_at).getTime());
    sortedHistory.forEach((entry, index) => {
      const currentTime = new Date(entry.moved_at);
      const currentStatus = entry.to_status;
      if (lastStatus && lastTime) {
        const durationMs = currentTime.getTime() - lastTime.getTime();
        timeSpent[lastStatus] = (timeSpent[lastStatus] || 0) + durationMs;
      }
      lastTime = currentTime;
      lastStatus = currentStatus;
      if (index === sortedHistory.length - 1 && currentStatus !== "completed") {
        const endTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const durationMs = new Date(endTime).getTime() - currentTime.getTime();
        timeSpent[currentStatus] = (timeSpent[currentStatus] || 0) + durationMs;
      }
    });
    return Object.entries(timeSpent).map(([status, durationMs]) => ({
      status,
      durationMs,
      duration: formatDuration(durationMs),
    }));
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? `${hours}h` : "",
      minutes > 0 ? `${minutes}m` : "",
      seconds > 0 ? `${seconds}s` : "",
    ].filter(Boolean).join(" ") || "0s";
  };
const convertminutestohoursordays = (totalMinutes: number) => { 
  if(totalMinutes < 60) {
    return `${totalMinutes} mins`;
  } else if(totalMinutes >= 60 && totalMinutes < 1440) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hrs ${minutes} mins`;
  } else {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    return `${days} days ${hours} hrs`;
  }
}
  const fetchAttachments = async (ticketId: string) => {
    try {
      const response = await axiosInstance.get(`/task-maangement/get-attachments/${ticketId}`);
      return response.data.attachments || [];
    } catch (err) {
      console.error(" Failed to fetch attachments:", err);
      return [];
    }
  };
  useEffect(() => {
   if (open && report?.id) {
    const loadAttachments = async () => {
      try {
        const data = await fetchAttachments(report?.id);
        setAttachments(data); // sets array in state
      } catch (err) {
        setAttachments([]); 
      }
    };

    loadAttachments();
  }
  }, [report?.id,open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !report.id || !authData?.user?.id) return;

    setUploadLoading(true);
    try {
      const url = await uploadFile(selectedFile);
      const payload = {
        url: url,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        uploaded_by: authData.user.id,
        uploaded_at: new Date().toISOString(),
      };
      await axiosInstance.patch(`/task-maangement/add-attachment/${report.id}`, payload);
      toast.success("File uploaded successfully!");
      const updatedAttachments = await fetchAttachments(report.id);
      setAttachments(updatedAttachments);
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed!");
    } finally {
      setUploadLoading(false);
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Utility function to check if attachment is an image
  const isImageType = (type: string) => {
    return type.startsWith("image/") && ["image/png", "image/jpeg", "image/gif"].includes(type);
  };

  const handleFileClick = (url: string, name: string, type: string) => {
    if (isImageType(type) || isPdfType(type) || isDocOrExcelType(type)) {
      setPreviewFile({ url, name, type });
      setPreviewOpen(true);
    } else {
      window.open(url, "_blank");
    }
  };


  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile({ url: "", name: "", type: "" });
  };
  // Utility function to check if attachment is a PDF
  const isPdfType = (type: string) => {
    return type === "application/pdf";
  };

  // Utility function to check if attachment is a DOC/DOCX or XLS/XLSX
  const isDocOrExcelType = (type: string) => {
    return [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ].includes(type);
  };
  // Utility function to trigger file download
  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility function to get Google Docs Viewer URL
  const getGoogleDocsViewerUrl = (url: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };
  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
        }}
      >
        <Fade in={open}>
          <ModalContainer>
            <LeftPanel>
              <TitleContainer>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  {isEditingTitle ? (
                    <Box display="flex" alignItems="center" width="100%">
                      <TextField
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onBlur={handleTitleBlur}
                        variant="standard"
                        fullWidth
                        autoFocus
                        sx={{
                          '& .MuiInputBase-input': {
                            fontSize: '1.25rem',
                            fontWeight: 500,
                            color: '#1E2E3E',
                            padding: '4px 0',
                          },
                        }}
                      />
                      <Button
                        onClick={() => {
                          setTitle(report.title);
                          setIsEditingTitle(false);
                        }}
                        variant="outlined"
                        sx={{
                          ml: 1,
                          borderColor: '#6B7280',
                          color: '#6B7280',
                          borderRadius: 6,
                          fontSize: '0.8rem',
                          padding: '3px 6px',
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography
                        variant="h1"
                        fontWeight={500}
                        color="#1E2E3E"
                        sx={{ cursor: 'pointer', fontSize: '1.25rem' }}
                        onClick={() => setIsEditingTitle(true)}
                      >{title}
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" gap={0.5}>
                    {userPriority !== 4 && (
                      <Tooltip title="Delete Task">
                        <IconButton
                          onClick={() => handleDeleteTask(report.id)}
                          sx={{
                            color: '#EF4444',
                            backgroundColor: '#FEE2E2',
                            '&:hover': { backgroundColor: '#FCA5A5' },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Close">
                      <IconButton
                        onClick={handleClose}
                        sx={{
                          color: '#6B7280',
                          background: '#F9FAFB',
                          '&:hover': { background: '#E2E6EA' },
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </TitleContainer>
              <ContentContainer>
                {loading && (
                  <LinearProgress sx={{ color: '#3B82F6', height: 3, borderRadius: 4, mb: 1 }} />
                )}
                <DetailSection>
                  <Box display="flex" alignItems="flex-start" width="100%" flexDirection="column" marginTop="10px">
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" mt={1} mb={1}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E2E3E' }}>
                        Description
                      </Typography>

                      <Box display="flex" gap={0.5}>
                        {!isEditingDescription ? (
                          <Tooltip title="Edit Description" arrow>
                            <IconButton
                              onClick={() => setIsEditingDescription(true)}
                              sx={{
                                color: "var(--primary-color-1)",
                                border: "1px solid var(--primary-color-1)",
                                "&:hover": { backgroundColor: "var(--primary-color-2)" },
                                p: 0.25,
                                borderRadius: 1,
                                width: 24,
                                height: 24,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Cancel Editing" arrow>
                            <IconButton
                              onClick={() => setIsEditingDescription(false)}
                              sx={{
                                color: "var(--primary-color-1)",
                                border: "1px solid var(--primary-color-1)",
                                "&:hover": { backgroundColor: "var(--primary-color-2)" },
                                p: 0.25,
                                borderRadius: 1,
                                width: 24,
                                height: 24,
                              }}
                            >
                              <EditOff fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Value component="span" sx={{ width: '100%' }}>
                      {isEditingDescription ? (
                        <Box display="flex" flexDirection="column" gap={1}>
                          <EditorContainer sx={{ width: '790px', display: 'flex', flexDirection: 'column' }}>
                            <Tiptap
                              initialContent={description}
                              onSave={setDescription}
                              ticketId={report?.id}
                            />
                          </EditorContainer>
                        </Box>
                      ) : (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            width="100%"
                            sx={{
                              padding: "15px 33px",
                              borderRadius: 1,
                              backgroundColor: "#F9FAFB",
                              "&:hover": { backgroundColor: "#E5E7EB" },
                              cursor: "pointer",
                              mb: 1,
                            }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement;
                              const link = target.closest("a");
                              if (link) {
                                e.preventDefault();
                                const url = link.getAttribute("href") || "";
                                const name = link.innerText || "File";
                                const type = getMimeTypeFromUrl(url); 
                                handleFileClick(url, name, type);
                                return;
                              }
                              handleDescriptionClick();
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "1rem",
                                color: "#374151",
                                flex: 1,
                              }}
                              dangerouslySetInnerHTML={{
                                __html: description || "No description provided",
                              }}
                            />
                          </Box>
                      )}
                    </Value>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E2E3E' }}>
                        {report?.totalSubTasks > 0 ? 'Subtasks' : 'Add Subtasks'}
                      </Typography>
                      <Tooltip title="Add SubTasks">
                        <IconButton
                          onClick={() => {setIsAddingSubtask(true);setSubtaskEditMode(false);setSubtaskInput('')}}
                          sx={{
                            color: '#6B7280',
                            padding: 0.1,
                            border: '1px solid #9CA3AF',
                            borderRadius: '4px',
                            ml: 1
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    {report?.totalSubTasks > 0 &&
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 1, mb: 2 }}>
                          <Box sx={{ display: 'flex', flex: 1, height: 8, borderRadius: 5, overflow: 'hidden', mr: 1 }}>
                            {report.completedSubTasks! > 0 && (
                              <Tooltip title={`${report.completedSubTasks} completed out of ${report.totalSubTasks}`}>
                                <Box
                                  sx={{
                                    width: `${(report.completedSubTasks! / report.totalSubTasks!) * 100}%`,
                                    backgroundColor: '#6ec475',
                                  }}
                                />
                              </Tooltip>
                            )}
                            {report.inprogressSubTasks! > 0 && (
                              <Tooltip title={`${report.inprogressSubTasks} in progress out of ${report.totalSubTasks}`}>
                                <Box
                                  sx={{
                                    width: `${(report.inprogressSubTasks! / report.totalSubTasks!) * 100}%`,
                                    backgroundColor: '#E4D00A',
                                  }}
                                />
                              </Tooltip>
                            )}
                            {report.pendingSubTasks! > 0 && (
                              <Tooltip title={`${report.pendingSubTasks} pending out of ${report.totalSubTasks}`}>
                                <Box
                                  sx={{
                                    width: `${(report.pendingSubTasks! / report.totalSubTasks!) * 100}%`,
                                    backgroundColor: '#6B7280',
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                            {`${Math.round((report.completedSubTasks! / report.totalSubTasks!) * 100)}% Done`}
                          </Typography>
                        </Box>
                        <GlassBox>
                          <SubtaskTable>
                            <TableBody>
                              {report.subTasks?.map((subtask) => (
                                <TableRow key={subtask?.id}>
                                  <TableCell sx={{ width: '15%', color: '#1E2E3E' }}>
                                    <Typography sx={{ fontWeight: 500, color: '#1E2E3E', mb: 1, fontSize: '12px' }}>
                                      {subtask?.title}
                                    </Typography>
                                  </TableCell>
                                  <TableCell sx={{ width: '80%', color: '#374151', cursor: 'pointer' }} onClick={() => { handleSubtaskEditClick(subtask?.id, subtask?.description) }}>
                                    {subtaskToEditId === subtask?.id ?(
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={subtaskInput}
                                        autoFocus
                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                        onBlur={() => {
                                          if (subtaskInput !== originalSubtaskInput) {
                                            handleCreateSubtask(); 
                                          }
                                          setSubtaskToEditId(null);
                                        }}                                        
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            if (subtaskInput !== originalSubtaskInput) {
                                              handleCreateSubtask();
                                            }
                                            setSubtaskToEditId(null);
                                          }
                                          if (e.key === "Escape") {
                                            setSubtaskToEditId(null);
                                            setSubtaskInput(null); 
                                          }
                                        }}
                                      />
                                    ) : (
                                      subtask?.description || "—"
                                    )}                                 
                                     </TableCell>
                                  <TableCell sx={{ width: '5%' }}>
                                    <FormControl fullWidth>
                                      <Select
                                        value={subtask?.status}
                                        onChange={(e) => handleSubtaskStatus(subtask.id, e.target.value as TicketStatus)}
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            borderRadius: 5,
                                            '& fieldset': { borderColor: statusColors[subtask?.status] },
                                            '&:hover fieldset': { borderColor: statusColors[subtask?.status] },
                                            '&.Mui-focused fieldset': { borderColor: statusColors[subtask?.status] },
                                          },
                                          '& .MuiSelect-select': {
                                            padding: '1px 6px',
                                            backgroundColor: statusColors[subtask?.status],
                                            color: '#FFFFFF',
                                            fontWeight: 600,
                                            fontSize: '12px',
                                          },
                                          '& .MuiSelect-icon': {
                                            color: '#FFFFFF',
                                          },
                                        }}
                                        renderValue={(selected) => (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span>
                                              {selected.charAt(0).toUpperCase() + selected.slice(1).replace('_', ' ')}
                                            </span>
                                          </Box>
                                        )}
                                      >
                                        {['pending', 'in_progress', 'completed']
                                          .filter((status) => status !== subtask?.status)
                                          .map((status) => (
                                            <MenuItem
                                              key={status}
                                              value={status}
                                              sx={{
                                                color: statusColors[status],
                                                fontWeight: 600,
                                                fontSize: '12px',
                                                '&:hover': {
                                                  backgroundColor: statusColors[status],
                                                  color: 'white',
                                                },
                                              }}
                                            >
                                              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                            </MenuItem>
                                          ))}
                                      </Select>
                                    </FormControl>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </SubtaskTable>
                        </GlassBox>
                      </>}
                  </Box>
                  {isAddingSubtask && (
                    <GlassBox display="flex" flexDirection="column" gap={1.5} sx={{ mt: 2 }}>
                      <Box display="flex" alignItems="center">
                        <LabelBox>
                          Subtask
                        </LabelBox>
                        <StyledTextField
                          value={subtaskInput}
                          onChange={(e) => setSubtaskInput(e.target.value)}
                          placeholder="Enter subtask description..."
                          variant="outlined"
                          fullWidth
                          autoFocus
                        />
                      </Box>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <StyledButton
                          onClick={handleCreateSubtask}
                          variant="contained"
                        >
                          {subtaskEditMode ? "Update" : "Create"}
                        </StyledButton>
                        <StyledButton
                          onClick={handleCancelSubtask}
                          variant="outlined"
                        >
                          Cancel
                        </StyledButton>
                      </Box>
                    </GlassBox>
                  )}
                  <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", marginTop: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E2E3E', mb: 1 }}> Activities </Typography>
                    <Box sx={{ borderBottom: "1px solid #E5E7EB", mb: 2 }}>
                      <Tabs
                        value={activityFilter}
                        onChange={(e, newValue) => setActivityFilter(newValue)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                          minHeight: "36px",
                          "& .MuiTab-root": {
                            textTransform: "none",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "#6B7280",
                            minHeight: "36px",
                            px: 2,
                          },
                          "& .Mui-selected": {
                            color: "#111827 !important",
                            fontWeight: 700,
                          },
                          "& .MuiTabs-indicator": {
                            backgroundColor: "#3B82F6",
                            height: 3,
                            borderRadius: "3px 3px 0 0",
                          },
                        }}
                      >
                        <Tab label="All" value="all" />
                        <Tab label="Comments" value="messages" />
                        <Tab label="Ticket History" value="tasks" />
                        <Tab label="Subtask History" value="subtasks" />
                        <Tab label="Assignment History" value="assignment" />
                        <Tab label="Attachments" value="attachments" />
                      </Tabs>
                    </Box>
                    {activityFilter === "messages" && (
                      <Box
                        sx={{
                          mb: 2,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 2,
                          border: "1px solid #E5E7EB",
                          p: 0.5,
                          display: "flex",
                          alignItems: "center",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          flexDirection: "column",
                        }}
                      >
                        {/* Input Row */}
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                          <TextField
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="Add a comment..."
                            variant="outlined"
                            fullWidth
                            disabled={loading}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                paddingRight: 0,
                                "& fieldset": { border: "none" },
                              },
                              "& .MuiInputBase-input": {
                                padding: "10px 0 10px 14px",
                                fontSize: "0.85rem",
                              },
                            }}
                          />

                          {/* Attachment Icon */}
                          <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{ ml: 1 }}
                            disabled={loading}
                          >
                            <AttachFileIcon sx={{ fontSize: 20, color: "#374151" }} />
                          </IconButton>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileSelect}
                          />

                          {/* Send Icon */}
                          <Tooltip
                            title={
                              !message.trim() && !attachmentFile
                                ? "! Message or attachment required"
                                : ""
                            }
                            placement="top"
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: "#fff3cd",
                                  color: "#856404",
                                  fontSize: "0.75rem",
                                  border: "1px solid #ffeeba",
                                },
                              },
                            }}
                          >
                            <span>
                              <Button
                                onClick={sendMessage}
                                disabled={loading || (!message.trim() && !attachmentFile)}
                                sx={{
                                  minWidth: 36,
                                  height: 36,
                                  padding: 0,
                                  borderRadius: "50%",
                                  backgroundColor: "#3B82F6",
                                  "&:hover": { backgroundColor: "#2563EB" },
                                  "&:disabled": {
                                    backgroundColor: "#E5E7EB",
                                    cursor: "not-allowed",
                                  },
                                  ml: 1,
                                }}
                              >
                                <SendIcon sx={{ fontSize: 18, color: "#FFFFFF" }} />
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>

                        {/* File Preview */}
                        {attachmentFile && (
                          <Box
                            sx={{
                              mt: 1,
                              p: 1,
                              border: "1px solid #E5E7EB",
                              borderRadius: 1,
                              background: "#F9FAFB",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              width: "100%",
                            }}
                          >
                            {/* Preview Image if image */}
                            {attachmentFile.type.startsWith("image/") && (
                              <img
                                src={URL.createObjectURL(attachmentFile)}
                                alt="preview"
                                style={{
                                  maxWidth: 60,
                                  maxHeight: 40,
                                  borderRadius: 4,
                                  objectFit: "cover",
                                }}
                              />
                            )}

                            {/* File Name */}
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {attachmentFile.name}
                            </Typography>

                            {/* Remove Button */}
                            <IconButton onClick={() => setAttachmentFile(null)} size="small">
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    )}
                    {activityFilter === "attachments" && (
                      <Box
                        sx={{
                          mb: 2,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 2,
                          border: "1px solid #E5E7EB",
                          p: 0.5,
                          display: "flex",
                          alignItems: "center",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      >
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
                          onChange={handleFileChange}
                          style={{
                            flex: 1,
                            fontSize: "0.85rem",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #E5E7EB",
                            backgroundColor: "#F9FAFB",
                            cursor: "pointer",
                          }}
                        />

                        <Tooltip
                          title={!selectedFile ? "! No file selected" : ""}
                          placement="top"
                          arrow
                          slotProps={{
                            tooltip: {
                              sx: {
                                bgcolor: "#fff3cd",
                                color: "#856404",
                                fontSize: "0.75rem",
                                border: "1px solid #ffeeba",
                              },
                            },
                          }}
                        >
                          <span>
                            <Button
                              onClick={handleUpload}
                              disabled={uploadLoading || !selectedFile}
                              sx={{
                                minWidth: 36,
                                height: 36,
                                padding: 0,
                                borderRadius: "50%",
                                backgroundColor: "#3B82F6",
                                "&:hover": { backgroundColor: "#2563EB" },
                                "&:disabled": {
                                  backgroundColor: "#E5E7EB",
                                  cursor: "not-allowed",
                                },
                                ml: 1,
                              }}
                            >
                              <UploadIcon sx={{ fontSize: 18, color: "#FFFFFF" }} />
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    )}

                    <Box
                      ref={messageAreaRef}
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        padding: 2,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: 2,
                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {loading || uploadLoading ? (
                        <LinearProgress sx={{ color: "#3B82F6", height: 4, borderRadius: 4, mb: 2 }} />
                      ) : activityFilter === "attachments" ? (
                        <Box>
                          {attachments.length === 0 ? (
                            <Typography
                              variant="body2"
                              sx={{ textAlign: "center", mt: 2, fontSize: "0.85rem", color: "#6B7280" }}
                            >
                              No Attachments
                            </Typography>
                          ) : (
                            <Box>
                              {attachments.map((attachment, index) => (
                                <GlassBox
                                  key={`attachment-${index}`}
                                  sx={{
                                    mb: 1.5,
                                    p: 1.5,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 1.5,
                                  }}
                                >
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                    <AttachmentIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
                                    <Box flex={1}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography
                                          variant="body2"
                                          fontWeight={600}
                                          color="#111827"
                                          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                          onClick={() => handleFileClick(attachment.url, attachment.name, attachment.type)}
                                        >
                                          {attachment.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {new Date(attachment.uploaded_at).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" color="#374151" sx={{ mt: 0.4 }}>
                                        Uploaded by: {getUserFullName(attachment.uploaded_by)}
                                      </Typography>
                                      <Typography variant="caption" color="#6B7280">
                                        Size: {formatFileSize(attachment.size)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  {isImageType(attachment.type) && (
                                    <Box sx={{ mt: 1 }}>
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name}
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "200px",
                                          objectFit: "contain",
                                          borderRadius: "4px",
                                          cursor: "pointer",
                                        }}
                                        onClick={() => handleFileClick(attachment.url, attachment.name, attachment.type)}
                                        loading="lazy"
                                      />
                                    </Box>
                                  )}
                                </GlassBox>
                              ))}
                            </Box>
                          )}
                        </Box>
                      ) : filteredActivities.length === 0 ? (
                        <Typography
                          variant="body2"
                          sx={{ textAlign: "center", mt: 2, fontSize: "0.85rem", color: "#6B7280" }}
                        >
                          No Activity
                        </Typography>
                      ) : (
                        [...filteredActivities]
                          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                          .map((item, index) => {
                            if (item.type === "message") {
                              const attachmentType = item.data.attachment ? getMimeTypeFromUrl(item.data.attachment) : null;
                              const attachmentName = item.data.attachment ? item.data.attachment.split("/").pop() || `Attachment-${item.data.id}` : null;
                              return (
                                <Box
                                  key={`msg-${item.data.id}`}
                                  sx={{
                                    mb: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: "#F9FAFB",
                                    border: "1px solid #E5E7EB",
                                    "&:hover": { backgroundColor: "#F3F4F6" },
                                  }}
                                >
                                  <Box display="flex" alignItems="flex-start" gap={1.5}>
                                    <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: "#3B82F6", mt: 0.3 }} />
                                    <Box flex={1}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight={600} color="#111827">
                                          {item.data.sender_name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {item.at.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </Typography>
                                      </Box>
                                      {/* Message Content */}
                                      {item.data.message && (
                                        <Typography variant="body2" color="#374151" sx={{ mt: 0.4 }}>
                                          {item.data.message}
                                        </Typography>
                                      )}
                                      {/* Attachment Display */}
                                      {item.data.attachment && (
                                        <Box
                                          sx={{
                                            mt: item.data.message ? 1 : 0.4,
                                            p: 1,
                                            border: "1px solid #E5E7EB",
                                            borderRadius: 1,
                                            background: "#FFFFFF",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1,
                                          }}
                                        >
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <AttachmentIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
                                            <Box flex={1}>
                                              <Typography
                                                variant="body2"
                                                fontWeight={600}
                                                color="#111827"
                                                sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                                onClick={() => handleFileClick(item.data.attachment, attachmentName, attachmentType)}
                                              >
                                                {attachmentName}
                                              </Typography>
                                              <Typography variant="caption" color="#6B7280" sx={{ mt: 0.2 }}>
                                                Uploaded by: {item.data.sender_name} at {item.at.toLocaleDateString("en-GB", {
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </Typography>
                                            </Box>
                                            <Tooltip title="Download Attachment">
                                              <IconButton
                                                onClick={() => triggerDownload(item.data.attachment, attachmentName)}
                                                size="small"
                                              >
                                                <DownloadIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                          {/* Small Image Preview for Image Attachments */}
                                          {attachmentType && isImageType(attachmentType) && (
                                            <Box sx={{ mt: 1 }}>
                                              <img
                                                src={item.data.attachment}
                                                alt={attachmentName}
                                                style={{
                                                  maxWidth: "100%",
                                                  maxHeight: "100px",
                                                  objectFit: "contain",
                                                  borderRadius: "4px",
                                                  cursor: "pointer",
                                                }}
                                                onClick={() => handleFileClick(item.data.attachment, attachmentName, attachmentType)}
                                                loading="lazy"
                                              />
                                            </Box>
                                          )}
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            } else if (item.type === "assignment") {
                              return (
                                <Box
                                  key={`assign-${item.data.from_user_id || "none"}-${item.data.to_user_id || "none"}-${item.data.updated_at}-${index}`}
                                  sx={{
                                    mb: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: "#F9FAFB",
                                    border: "1px solid #E5E7EB",
                                    "&:hover": { backgroundColor: "#F3F4F6" },
                                  }}
                                >
                                  <Box display="flex" alignItems="flex-start" gap={1.5}>
                                    <AssignmentIndIcon sx={{ fontSize: 18, color: "#8B5CF6", mt: 0.3 }} />
                                    <Box flex={1}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight={600} color="#111827">
                                          {getUserFullName(item.data.updated_by) ?? "System"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {item.at.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" color="#374151" sx={{ mt: 0.4 }}>
                                        {item.data.from_user_id !== item.data.to_user_id
                                          ? `Reassigned from ${getUserFullName(item.data.from_user_id)} to ${getUserFullName(item.data.to_user_id)}`
                                          : <>Reassigned ETA <strong>{convertminutestohoursordays(parseInt(item.data.deadline_minutes, 10))}</strong> to {getUserFullName(item.data.to_user_id)}</>}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            } else {
                              const isSubtask = item.source === "subtask";
                              const icon = isSubtask ? (
                                <AccountTreeIcon
                                  sx={{
                                    fontSize: 16,
                                    color: "#6366F1",
                                    transform: "rotate(90deg) scaleY(-1)",
                                  }}
                                />
                              ) : item.data.from_status ? (
                                <HistoryIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
                              ) : (
                                <AddCircleOutlineIcon sx={{ fontSize: 18, color: "#10B981" }} />
                              );
                              return (
                                <Box
                                  key={`hist-${index}`}
                                  sx={{
                                    mb: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: "#F9FAFB",
                                    border: "1px solid #E5E7EB",
                                  }}
                                >
                                  <Box display="flex" alignItems="flex-start" gap={1.5}>
                                    {icon}
                                    <Box flex={1}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight={600} color="#111827" sx={{ mb: 0.2 }}>
                                          {`${getUserFullName(item.data.moved_by) ?? "System"}`}
                                          {isSubtask ? ` - Subtask: ${item.subtaskTitle}` : ""}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {item.at.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" color="#374151" sx={{ mb: 0.4 }}>
                                        {item.data.from_status
                                          ? `Updated from ${item.data.from_status ?? "N/A"} → ${item.data.to_status}`
                                          : isSubtask
                                            ? "Subtask created."
                                            : "Created ticket."}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              );
                            }
                          })
                      )}
                    </Box>
                    <Dialog
                      open={previewOpen}
                      onClose={handleClosePreview}
                      maxWidth="md"
                      sx={{
                        "& .MuiDialog-paper": {
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          backdropFilter: "blur(10px)",
                          borderRadius: 2,
                          minWidth: { xs: "90%", sm: "500px" },
                          minHeight: { xs: "50%", sm: "400px" },
                        },
                      }}
                    >
                      <DialogContent sx={{ padding: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        {isImageType(previewFile.type) && (
                          <img
                            src={previewFile.url}
                            alt={previewFile.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "80vh",
                              objectFit: "contain",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                        {(isPdfType(previewFile.type) || isDocOrExcelType(previewFile.type)) && (
                          <iframe
                            src={isPdfType(previewFile.type) ? previewFile.url : getGoogleDocsViewerUrl(previewFile.url)}
                            title={previewFile.name}
                            style={{
                              width: "100%",
                              height: "80vh",
                              border: "none",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                        {(isPdfType(previewFile.type) || isDocOrExcelType(previewFile.type)) && (
                          <Box sx={{ p: 2, textAlign: "center" }}>
                            <Typography variant="body2" sx={{ color: "#374151", mb: 2 }}>
                              {isDocOrExcelType(previewFile.type) && "Note: This preview is provided by Google Docs Viewer. Some formatting may differ."}
                              {isPdfType(previewFile.type) && "Viewing PDF in browser."}
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={() => triggerDownload(previewFile.url, previewFile.name)}
                              sx={{
                                textTransform: "none",
                                backgroundColor: "#3B82F6",
                                "&:hover": { backgroundColor: "#2563EB" },
                              }}
                            >
                              Download {previewFile.name}
                            </Button>
                          </Box>
                        )}
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleClosePreview} sx={{ textTransform: "none" }}>
                          Close
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </Box>
                </DetailSection>
                {hasChanges && (
                  <Box sx={{ position: 'sticky', bottom: 0, background: '#FFFFFF', padding: theme.spacing(1), borderTop: '1px solid #E8ECEF' }}>
                    <Button
                      onClick={handleApplyChanges}
                      variant="contained"
                      disabled={loading || !hasChanges}
                      sx={{
                        bgcolor: '#2dd4bf',
                        '&:hover': { bgcolor: '#26a69a' },
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        mr: 0.5,
                        padding: '4px 8px',
                      }}
                    >
                      Apply Changes
                    </Button>
                    <Button
                      onClick={handleCancelChanges}
                      variant="outlined"
                      disabled={loading}
                      sx={{
                        borderColor: '#6B7280',
                        color: '#6B7280',
                        borderRadius: 6,
                        fontSize: '0.8rem',
                        padding: '4px 8px',
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </ContentContainer>
            </LeftPanel>
            <RightPanel>
              <ContentContainer>
                <SectionTitle>Details</SectionTitle>
                <DetailSection>
                  <DetailRow>
                    <Label>Ticket No:</Label>
                    <Value>{report.ticket_no}</Value>
                  </DetailRow>
                  <DetailRow>
                    <Label>Project:</Label>
                    <Value>{projectName}</Value>
                  </DetailRow>
                  <DetailRow>
                    <Label>Status:</Label>
                    <Value>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </Value>
                  </DetailRow>
                  <DetailRow>
                  <Box display="flex" width="100%" flexDirection={"column"} gap={2}>
                    {/* Priority */}
                    <Box flex={0.33} display="flex" alignItems="center" gap={1}>
                      <Label>Priority:</Label>
                      <Value component="span">
                        <FormControl sx={{ minWidth: 50 }}>
                          <Select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value.toLowerCase())}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { border: 'none' } },
                              '& .MuiSelect-select': {
                                padding: '2.5px 6px',
                                backgroundColor: getPriorityDetails(priority).color,
                                color: '#fff',
                                fontWeight: 600,
                              },
                              '& .MuiSelect-icon': { color: '#fff' },
                            }}
                            renderValue={(selected) => (
                              <Chip
                                sx={{
                                  backgroundColor: getPriorityDetails(selected).color,
                                  color: '#fff',
                                  fontWeight: 600,
                                }}
                                label={getPriorityDetails(selected).label}
                              />
                            )}
                          >
                            <MenuItem value="p1">P1 - Critical</MenuItem>
                            <MenuItem value="p2">P2 - High</MenuItem>
                            <MenuItem value="p3">P3 - Medium</MenuItem>
                          </Select>
                        </FormControl>
                      </Value>
                    </Box>
                  </Box>
                  </DetailRow>
                  <DetailRow>
                    <Box flex={0.33} display="flex" alignItems="center" gap={1}>
                      <Label>ETA:</Label>
                      <Value component="span" sx={{ flex: 1 }}>
                        {isEditingAssignedTime ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              value={deadlineDays}
                              onChange={(e) => setDeadlineDays(e.target.value)}
                              label="Days"
                              type="number"
                              sx={{ width: 70 }}
                            />
                            <TextField
                              value={deadlineHours}
                              onChange={(e) => setDeadlineHours(e.target.value)}
                              label="Hours"
                              type="number"
                              sx={{ width: 70 }}
                            />
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              onClick={() => userPriority !== 4 && setIsEditingAssignedTime(true)}
                              sx={{
                                backgroundColor: '#F1F5F9',
                                px: 1,
                                py: 0.5,
                                borderRadius: 2,
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                cursor: userPriority !== 4 ? 'pointer' : 'default',
                              }}
                              minWidth={100}
                              textAlign={"center"}
                            >
                              {`${deadlineDays || 0}d ${deadlineHours || 0}h`}
                            </Box>
                            {userPriority !== 4 && (
                              <Tooltip title="Edit Assigned Time">
                                <IconButton size="small" onClick={() => setIsEditingAssignedTime(true)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        )}
                      </Value>
                    </Box>
                  </DetailRow>
                  <DetailRow>
                    <Label>Assigned User:</Label>
                    <Value component="div"> {/* Explicitly set to div */}
                      <Avatar
                        sx={{
                          bgcolor: stringToColor(`${report.current_user.first_name} ${report.current_user.last_name}`),
                          height: 30,
                          width: 30,
                          fontSize: 15,
                          mr: 1,
                        }}
                      >
                        {getInitials(`${report.current_user.first_name} ${report.current_user.last_name}`)}
                      </Avatar>
                      {`${report.current_user.first_name} ${report.current_user.last_name}`}
                      <Tooltip title="Reassign">
                        <IconButton
                          onClick={() => setMiniModalOpen(true)}
                          sx={{
                            color: '#6B7280',
                            background: '#F9FAFB',
                            '&:hover': { background: '#E2E6EA' },
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            ml: 1,
                          }}
                        >
                          <ReassignIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Value>
                  </DetailRow>
                  {/* <DetailRow>
                    <Label>Time Spent:</Label>
                    <Value>
                      <AccessTime sx={{ color: "#6B7280" }} />
                      {timeSpent.map(t => `${t.status}: ${t.duration}`).join(", ") || "0s"}
                    </Value>
                  </DetailRow> */}
                  <DetailRow>
                  <Box display="flex" flexDirection="column" width="100%" gap={2}>
                    <Label>
                      Time Spent
                    </Label>
                    <Box
                      display="grid"
                      gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))"
                      gap={2}
                    >
                      {['pending', 'in_progress', 'on_hold', 'testable', 'completed'].map((status) => {
                        const timeEntry = timeSpent.find((entry) => entry.status === status);
                        const isCompleted = status === 'completed' && report.status === 'completed';
                        const details = getStatusDetails(status);
                        return (
                          <Box
                            key={status}
                            sx={{
                              borderRadius: 3,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                              backgroundColor: '#fff',
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' },
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              {details.icon}
                              <Typography fontSize="0.9rem" fontWeight={600} color={getTaskCountColor(status)}>
                                {details.label}
                              </Typography>
                            </Box>
                            {isCompleted ? (
                              <CheckCircle sx={{ fontSize: 20, color: 'green' }} />
                            ) : (
                              <Typography fontSize="0.85rem" fontWeight={500} color="text.secondary">
                                {timeEntry ? timeEntry.duration : '--'}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </DetailRow>
                </DetailSection>
              </ContentContainer>
            </RightPanel>
          </ModalContainer>
        </Fade>
      </Modal>
      <Dialog
        open={miniModalOpen}
        onClose={() => setMiniModalOpen(false)}
        maxWidth="xs"
        fullWidth
        BackdropProps={{ style: { backgroundColor: "rgba(0, 0, 0, 0.5)" } }}
        PaperProps={{
          sx: {
            borderRadius: "17px", 
          },
        }}      >
        <DialogTitle
          sx={{
            bgcolor: "var(--primary-color-2)",
            color: "#ffffff",
            textAlign: "center",
            fontSize: "1.1rem",
          }}
        >
          Reassign Ticket
        </DialogTitle>
        <DialogContent>
          {/* User Selection */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel sx={{ color: "#6B7280" }}>Select User</InputLabel>
            <Select
              label="Select User"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value as string)}
              sx={{
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#E8ECEF" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D1D5DB" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2dd4bf" },
                borderRadius: 8,
                fontSize: "0.9rem",
              }}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id} sx={{ fontSize: "0.9rem" }}>
                  {user.first_name} {user.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* ETA Input Fields */}
          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <TextField
              label="ETA Days"
              type="number"
              value={etaDays}
              onChange={(e) => setEtaDays(Number(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
              sx={{ borderRadius: 2 }}
            />
            <TextField
              label="ETA Hours"
              type="number"
              value={etaHours}
              onChange={(e) => setEtaHours(Number(e.target.value))}
              fullWidth
              InputProps={{ inputProps: { min: 0, max: 23 } }}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMiniModalOpen(false)}
            sx={{ color: "#6B7280", fontSize: "0.9rem" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#2dd4bf",
              "&:hover": { bgcolor: "#26a69a" },
              fontSize: "0.9rem",
              borderRadius: 6,
            }}
            onClick={handleReassign}
            disabled={
              !selectedUser ||
              selectedUser === report?.current_user?.id ||
              loading
            }
          >
            Reassign
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const getInitials = (name: string) => {
  if (!name) return "";
  const names = name.split(" ").filter((n) => n.trim().length > 0);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0][0]?.toUpperCase() || "";
  return `${names[0][0] ?? ""}${names[names.length - 1][0] ?? ""}`.toUpperCase();
};

const stringToColor = (string: string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
};

export default TaskDetailsModal;
