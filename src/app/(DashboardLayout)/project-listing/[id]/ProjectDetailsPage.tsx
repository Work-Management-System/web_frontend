"use client";
import React, { useEffect, useState, memo, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Avatar,
  TextField,
  Tooltip,
  Skeleton,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  styled,
  Autocomplete,
  Modal,
  CircularProgress,
  Stack,
} from "@mui/material";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import GroupIcon from "@mui/icons-material/Group";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ArticleIcon from "@mui/icons-material/Article";
import LockIcon from "@mui/icons-material/Lock";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import createAxiosInstance from "@/app/axiosInstance";
import { toast, Toaster } from "react-hot-toast";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import { BsTriangleFill } from "react-icons/bs";
import { CustomPagination } from "@/app/(AuthLayout)/components/Pagination/CustomPagination";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RequiredLabel from "../../layout/shared/logo/RequiredLabel";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  HistoryItem,
  TaskProvider,
  useTaskContext,
} from "@/contextapi/TaskContext";
import dynamic from "next/dynamic";
import { formatDistanceToNow } from "date-fns";
import {
  getProjectDocuments,
  createDocument,
  deleteDocument as deleteDocumentAPI,
  ProjectDocument,
} from "@/services/documentService";
import CreateDocumentModal from "./documents/CreateDocumentModal";

interface Project {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
  current_phase: string;
  client_details: { name: string; email: string; contact: string }[];
  project_timeline: { time: string; title: string }[];
  deadLine: string;
}

export interface TeamMember {
  id: string;
  status: string;
  time_spent: number;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    designation: string;
    department: string;
    profile_image: string;
  };
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

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

const theme = createTheme({
  palette: {
    primary: { main: "#1E3A8A" },
    secondary: { main: "#10B981" },
    background: { default: "#F7F8FA" },
    text: { primary: "#1F2937", secondary: "#6B7280" },
  },
  typography: {
    fontFamily: "'Manrope', sans-serif",
    h5: { fontWeight: 800, fontSize: "1.75rem" },
    h6: { fontWeight: 700, fontSize: "1.25rem" },
    body1: { fontWeight: 400, fontSize: "0.95rem" },
    body2: { fontWeight: 400, fontSize: "0.85rem" },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          backdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.4s, box-shadow 0.4s",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          tableLayout: "auto",
          width: "100%",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "12px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
        head: {
          fontWeight: 700,
          color: "#1F2937",
          background: "rgba(247, 248, 250, 0.9)",
          padding: "12px",
          width: "20%",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          padding: "0 16px",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.9)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          padding: "8px 16px",
          transition: "all 0.3s",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        },
      },
    },
  },
});

const getTeamStatusChipStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "WORKING":
      return {
        background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
        color: "#1E40AF",
      };
    case "NOT_WORKING":
      return {
        background: "linear-gradient(135deg, #FEE2E2, #FECACA)",
        color: "#B91C1C",
      };
    case "MAINTAINING":
      return {
        background: "linear-gradient(135deg, #F3E8FF, #EDE9FE)",
        color: "#6B21A8",
      };
    case "SUPERVISE":
      return {
        background: "linear-gradient(135deg, #DCFCE7, #BBF7D0)",
        color: "#15803D",
      };
    case "ON_HOLD":
      return {
        background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        color: "#B45309",
      };
    default:
      return {
        background: "linear-gradient(135deg, #E5E7EB, #D1D5DB)",
        color: "#374151",
      };
  }
};

const getDesignationChipStyle = (designation: string | null | undefined) => {
  if (!designation) {
    return {
      background: "linear-gradient(135deg, #E5E7EB, #D1D5DB)",
      color: "#374151",
    };
  }
  switch (designation.toLowerCase()) {
    case "software engineer":
      return {
        background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
        color: "#1E40AF",
      };
    case "project manager":
      return {
        background: "linear-gradient(135deg, #F3E8FF, #EDE9FE)",
        color: "#6B21A8",
      };
    case "designer":
      return {
        background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        color: "#B45309",
      };
    default:
      return {
        background: "linear-gradient(135deg, #E5E7EB, #D1D5DB)",
        color: "#374151",
      };
  }
};

const getEmailChipStyle = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase();
  switch (domain) {
    case "yopmail.com":
      return {
        background: "linear-gradient(135deg, #FFEDD5, #FED7AA)",
        color: "#C2410C",
      };
    case "privi.com":
      return {
        background: "linear-gradient(135deg, #CCFBF1, #99F6E4)",
        color: "#0F766E",
      };
    default:
      const hash = email
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colors = [
        {
          background: "linear-gradient(135deg, #FBCFE8, #F9A8D4)",
          color: "#BE185D",
        },
        {
          background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
          color: "#047857",
        },
        {
          background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
          color: "#7C3AED",
        },
        {
          background: "linear-gradient(135deg, #FEE2E2, #FECACA)",
          color: "#B91C1C",
        },
      ];
      return colors[hash % colors?.length];
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const splitDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.toLocaleString("en-US", { month: "short" }),
    day: date.getDate(),
  };
};

function formatMinutesToHours(minutes: any) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

const formatStatusForDisplay = (status: string) => {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Styled components for the Tasks Box
const TasksContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  padding: theme.spacing(2),
  // background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 240, 0.9))",
  background: "rgba(255, 255, 255, 0.95)",
  borderRadius: "24px",
  backdropFilter: "blur(10px)",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1, 1),
  background:
    "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-1))",
  color: "white",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
}));

const TaskCard = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  margin: theme.spacing(1, 0),
  background: "rgba(255, 255, 255, 0.9)",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
  },
  [theme.breakpoints.up("md")]: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

const StatusBadge = styled(Chip)(({ theme, status }: any) => ({
  background:
    status === "completed" || status === "testable"
      ? "linear-gradient(135deg, #10B981, #34D399)"
      : status === "in_progress"
      ? "linear-gradient(135deg, #3B82F6, #60A5FA)"
      : "linear-gradient(135deg, #F59E0B, #FBBF24)",
  color: "white",
  fontWeight: 600,
  fontSize: "0.75rem",
  height: "24px",
  borderRadius: "12px",
  "& .MuiChip-label": {
    padding: "0 10px",
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.9)",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    "&.Mui-focused": {
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.9rem",
    color: theme.palette.text.secondary,
  },
}));

const TeamMemberRow = memo(
  ({
    member,
    index,
    onNameClick,
  }: {
    member: TeamMember;
    index: number;
    onNameClick: (member: TeamMember) => void;
  }) => (
    <TableRow
      sx={{
        "&:last-child td": { borderBottom: "none" },
        "&:hover": { transform: "scale(1.01)" },
        transition: "background-color 0.3s, transform 0.2s",
        display: { xs: "flex", md: "table-row" },
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "center" },
        borderBottom: { xs: "1px solid rgba(0, 0, 0, 0.05)", md: "none" },
        p: { xs: 2, md: 0 },
        gap: { xs: 1, md: 0 },
      }}
    >
      <TableCell
        sx={{
          display: { xs: "flex", md: "table-cell" },
          alignItems: "center",
          p: { xs: 1, md: "12px" },
          width: { md: "10%" },
        }}
      >
        <Avatar
          src={member.user.profile_image}
          sx={{
            width: 36,
            height: 36,
            bgcolor: member.user.profile_image
              ? "transparent"
              : "linear-gradient(135deg, #1E3A8A, #3B82F6)",
            transition: "transform 0.3s",
            "&:hover": { transform: "scale(1.15)" },
            objectFit: "cover",
            border: "2px solid rgba(255, 255, 255, 1)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            mr: { xs: 2, md: 0 },
          }}
          imgProps={{ loading: "lazy" }}
        >
          {!member.user.profile_image && `${member.user.first_name.charAt(0)}`}
        </Avatar>
        <Typography
          variant="body2"
          sx={{ display: { xs: "inline", md: "none" }, fontWeight: 600 }}
        >
          Icon
        </Typography>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "25%" } }}>
        <Typography
          variant="body2"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "pointer",
            color: "primary.main",
            "&:hover": { textDecoration: "underline" },
            font: "menu",
          }}
          onClick={() => onNameClick(member)}
        >
          {`${member.user.first_name} ${member.user.last_name}`}
        </Typography>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "25%" } }}>
        <Tooltip title={member.user.email}>
          <Box
            sx={{
              ...getEmailChipStyle(member.user.email),
              borderRadius: "12px",
              px: 1.5,
              py: 0.5,
              display: "inline-flex",
              alignItems: "center",
              fontSize: "0.75rem",
              fontWeight: 500,
              textOverflow: "ellipsis",
              whiteSpace: { xs: "nowrap", md: "normal" },
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <MailOutlineIcon
              sx={{
                fontSize: 16,
                mr: 0.75,
                color: getEmailChipStyle(member.user.email).color,
                opacity: 1,
              }}
            />
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                font: "menu",
              }}
            >
              {member.user.email}
            </Typography>
          </Box>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "20%" } }}>
        <Box
          sx={{
            ...getDesignationChipStyle(member.user.designation),
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            display: "inline-flex",
            alignItems: "center",
            fontSize: "0.75rem",
            fontWeight: 500,
            textOverflow: "ellipsis",
            whiteSpace: { xs: "nowrap", md: "normal" },
            transition: "transform 0.3s, box-shadow 0.3s",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: getDesignationChipStyle(member.user.designation)
                .color,
              marginRight: "6px",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", font: "menu" }}
          >
            {member.user.designation || "—"}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "20%" } }}>
        <Box
          sx={{
            ...getTeamStatusChipStyle(member.status),
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            display: "inline-flex",
            alignItems: "center",
            fontSize: "0.75rem",
            fontWeight: 500,
            textOverflow: "ellipsis",
            whiteSpace: { xs: "nowrap", md: "normal" },
            transition: "transform 0.3s, box-shadow 0.3s",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: getTeamStatusChipStyle(member.status).color,
              marginRight: "6px",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", font: "menu" }}
          >
            {formatStatusForDisplay(member.status)}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "25%" } }}>
        <Box
          sx={{
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            display: "inline-flex",
            alignItems: "center",
            fontSize: "0.75rem",
            fontWeight: 500,
            textOverflow: "ellipsis",
            whiteSpace: { xs: "nowrap", md: "normal" },
            transition: "transform 0.3s, box-shadow 0.3s",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {formatMinutesToHours(member.time_spent)}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  )
);

const ClientRow = memo(
  ({
    client,
    index,
    onEdit,
  }: {
    client: { name: string; email: string; contact: string };
    index: number;
    onEdit: (
      client: { name: string; email: string; contact: string },
      index: number
    ) => void;
  }) => (
    <TableRow
      sx={{
        "&:last-child td": { borderBottom: "none" },
        "&:hover": { transform: "scale(1.01)" },
        transition: "background-color 0.3s, transform 0.2s",
        display: { xs: "flex", md: "table-row" },
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "center" },
        borderBottom: { xs: "1px solid rgba(0, 0, 0, 0.05)", md: "none" },
        p: { xs: 2, md: 0 },
        gap: { xs: 1, md: 0 },
      }}
    >
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "30%" } }}>
        <Typography
          variant="body2"
          sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {client.name}
        </Typography>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "30%" } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MailOutlineIcon
            sx={{ fontSize: 16, color: "text.secondary", opacity: 1 }}
          />
          <Typography
            variant="body2"
            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {client.email}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "30%" } }}>
        <Typography
          variant="body2"
          sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {client.contact}
        </Typography>
      </TableCell>
      <TableCell sx={{ p: { xs: 1, md: "12px" }, width: { md: "10%" } }}>
        <IconButton
          sx={{
            "&:hover": { bgcolor: "var(--primary-color-1)", color: "white" },
            transition: "all 0.3s",
          }}
          onClick={() => onEdit(client, index)}
        >
          <EditIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  )
);

const ProjectTimelineItem = memo(
  ({
    timeline,
    index,
    onEdit,
    isFirst,
    isLast,
  }: {
    timeline: { time: string; title: string };
    index: number;
    onEdit: (timeline: { time: string; title: string }, index: number) => void;
    isFirst: boolean;
    isLast: boolean;
  }) => (
    <TimelineItem
      sx={{
        marginTop: "5px",
        marginBottom: "24px",
      }}
    >
      <TimelineOppositeContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          color: "text.secondary",
          position: "relative",
          paddingRight: "8px",
          paddingLeft: "0px",
        }}
      >
        <TimelineDot
          sx={{
            position: "absolute",
            right: "15px",
            top: "-15px",
            width: 80,
            height: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: "50%",
            zIndex: 1,
            bgcolor: "var(--primary-color-1)",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.9rem",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "4px",
            }}
          >
            {splitDate(timeline.time).year}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              {splitDate(timeline.time).month}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              {splitDate(timeline.time).day}
            </Typography>
          </Box>
        </TimelineDot>
        <BsTriangleFill
          className="rotate-90 absolute right-0.5 #10B981 z-0 "
          style={{ color: "var(--primary-color-1)" }}
        />
      </TimelineOppositeContent>
      <TimelineSeparator>
        {!isFirst && (
          <TimelineConnector
            sx={{
              bgcolor: "primary.main",
              width: "2px",
            }}
          />
        )}
        <TimelineDot
          sx={{
            bgcolor: "var(--primary-color-1)",
            width: 16,
            height: 16,
            margin: "0",
            border: "2px solid rgba(255, 255, 255, 0.9)",
          }}
        />
        {!isLast && (
          <TimelineConnector
            sx={{
              bgcolor: "primary.main",
              width: "2px",
            }}
          />
        )}
      </TimelineSeparator>
      <TimelineContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3,
          bgcolor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <Box>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, color: "var(--primary-color-1)" }}
          >
            {timeline.title}
          </Typography>
        </Box>
        <IconButton
          sx={{
            "&:hover": { bgcolor: "var(--primary-color-1)", color: "white" },
            transition: "all 0.3s",
          }}
          onClick={() => onEdit(timeline, index)}
        >
          <EditIcon />
        </IconButton>
      </TimelineContent>
    </TimelineItem>
  )
);
// const TicketSection = ({ title, tickets }) => (
// <motion.div
//   initial={{ opacity: 0, y: 30 }}
//   animate={{ opacity: 1, y: 0 }}
//   transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
// >

// Updated TicketSection component
const TicketSection = ({ title, tickets, open, onToggle, noOFTickets }) => (
  <Box sx={{ mb: 2 }}>
    <SectionHeader onClick={onToggle}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid",
            borderColor: "grey.300",
            color: "primary.main",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
          aria-label={`${noOFTickets ?? 0} tickets`}
        >
          {noOFTickets ?? 0}
        </Box>
        <ExpandMoreIcon
          sx={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </Box>
    </SectionHeader>
    <Collapse in={open}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {tickets.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <HourglassEmptyIcon
              sx={{ fontSize: 60, color: "text.secondary", opacity: 0.7 }}
            />
            <Typography
              color="text.secondary"
              mt={2}
              sx={{ fontSize: "0.9rem" }}
            >
              No tickets found.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {tickets.map((ticket) => (
              <TaskCard key={ticket.id}>
                <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 15%" } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      fontSize: "0.9rem",
                    }}
                  >
                    {ticket.ticket_no}
                  </Typography>
                </Box>
                <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 35%" } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                      fontSize: "0.9rem",
                    }}
                  >
                    {ticket.title}
                  </Typography>
                </Box>
                <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 20%" } }}>
                  <StatusBadge label={formatStatusForDisplay(ticket.status)} />
                </Box>
                <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 30%" } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 400,
                      color: "text.secondary",
                      fontSize: "0.85rem",
                    }}
                  >
                    {ticket.current_user
                      ? `${ticket.current_user.first_name} ${ticket.current_user.last_name}`
                      : "Unassigned"}
                  </Typography>
                </Box>
              </TaskCard>
            ))}
          </Box>
        )}
      </Box>
    </Collapse>
  </Box>
);
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
}

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
    (value) => (value ? isUUID(value) : true)
  ),
  deadline_hours: Yup.number()
    .min(0, "Hours cannot be negative")
    .typeError("Hours must be a number"),
  deadline_minutes: Yup.number()
    .min(0, "Minutes cannot be negative")
    .typeError("Minutes must be a number"),
  deadline_total_minutes: Yup.number(),
});

const ProjectDetailsPage = () => {
  const { reports, projects, handleDeleteTask, taskId, setTaskId } =
    useTaskContext();
  const params = useParams();
  // Extract value immediately to avoid enumeration warning
  const id = useMemo(() => (params?.id as string) || undefined, [params]);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openTimelineDialog, setOpenTimelineDialog] = useState(false);
  const [modalUsers, setModalUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [clientDetails, setClientDetails] = useState<{
    name: string;
    email: string;
    contact: string;
  }>({
    name: "",
    email: "",
    contact: "",
  });
  const [timelineDetails, setTimelineDetails] = useState<{
    time: string;
    title: string;
  }>({
    time: new Date().toISOString().split("T")[0],
    title: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [clientDialogMode, setClientDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [timelineDialogMode, setTimelineDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [selectedClientIndex, setSelectedClientIndex] = useState<number | null>(
    null
  );
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState<
    number | null
  >(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState({
    p1: false, // Changed to false
    p2: false, // Changed to false
    p3: false, // Changed to false
    unassigned: false, // Changed to false
    completed: false, // Changed to false
  });
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Document states
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);

  const axiosInstance = useMemo(() => createAxiosInstance(), []);

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

  const fetchAttachments = async () => {
    if (!id) {
      setAttachments([]);
      setAttachmentsLoading(false);
      return;
    }
    setAttachmentsLoading(true);
    try {
      const res = await axiosInstance.get(
        `/project-management/${id}/attachments`
      );
      const attachmentData: ProjectAttachment[] = (res.data?.data || []).map(
        (item: ProjectAttachment) => ({
          ...item,
          file_size: item.file_size ? Number(item.file_size) : undefined,
        })
      );
      setAttachments(attachmentData);
    } catch (error) {
      console.error("Failed to fetch project attachments:", error);
      toast.error("Failed to load project files");
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleAttachmentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !id) {
      return;
    }
    setUploadingAttachment(true);
    try {
      const uploads = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        await axiosInstance.post(
          `/project-management/${id}/attachments`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      });
      await Promise.all(uploads);
      toast.success(
        files.length > 1
          ? "Files uploaded successfully"
          : "File uploaded successfully"
      );
      await fetchAttachments();
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploadingAttachment(false);
      event.target.value = "";
    }
  };

  // Document functions
  const fetchDocuments = async () => {
    if (!id) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }
    setDocumentsLoading(true);
    try {
      const docs = await getProjectDocuments(id);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch project documents:", error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleCreateDocument = async (title: string, templateType: string) => {
    if (!id) return;
    const doc = await createDocument(id, title, templateType);
    toast.success("Document created");
    router.push(`/project-listing/${id}/documents/${doc.id}`);
  };

  const handleDeleteDocument = async (documentId: string) => {
    const confirmDelete = window.confirm(
      "Delete this document? This cannot be undone."
    );
    if (!confirmDelete) return;
    try {
      await deleteDocumentAPI(id as string, documentId);
      toast.success("Document deleted");
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const confirmDelete = window.confirm("Remove this file from the project?");
    if (!confirmDelete) {
      return;
    }
    try {
      await axiosInstance.delete(
        `/project-management/attachments/${attachmentId}`
      );
      toast.success("Attachment removed");
      setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleToggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get(`/task-maangement/by-project/${id}`);
      const tasksData = res?.data?.tickets;
      setTasks(tasksData);
      console.log("Tasks fetched successfully:", tasksData);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setTeamLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await axiosInstance.get(
          `/project-management/find-one/${id}`
        );
        const projectData = res.data.data;
        setProject(projectData);
        setClientDetails(
          projectData?.client_details?.length > 0
            ? projectData?.client_details[0]
            : { name: "", email: "", contact: "" }
        );
        setTimelineDetails(
          projectData?.project_timeline?.length > 0
            ? projectData?.project_timeline[0]
            : {
                time: new Date().toISOString().split("T")[0],
                title: "",
              }
        );
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        toast.error("Failed to fetch project details");
        setLoading(false);
      }
    };
    const fetchTeam = async () => {
      try {
        const res = await axiosInstance.get(
          `/project-management/project-team/${id}`
        );
        const teamData = res.data.data;
        teamData.forEach((member: TeamMember, index: number) => {
          if (!member.user.designation) {
            console.warn(
              `Team member at index ${index} has no designation:`,
              member
            );
          }
        });
        setTeamMembers(teamData);
        setTeamLoading(false);
      } catch (err) {
        console.error("Failed to fetch team members:", err);
        toast.error("Failed to fetch team members");
        setTeamLoading(false);
      }
    };
    fetchTasks();
    fetchProject();
    fetchTeam();
    fetchAttachments();
    fetchDocuments();
  }, [id]);

  useEffect(() => {
    if (openDialog) {
      const fetchUsers = async () => {
        try {
          const res = await axiosInstance.get(`/user/list`);
          const allUsers = res.data.data || [];
          const unassignedUsers = allUsers.filter(
            (user: User) =>
              !teamMembers.some((member) => member.user.id === user.id)
          );
          setAvailableUsers(unassignedUsers);
        } catch (err) {
          console.error("Failed to fetch users:", err);
          toast.error("Failed to fetch available users");
        }
      };
      fetchUsers();
    }
  }, [openDialog, teamMembers]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setSelectedUsers([]);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUsers([]);
  };

  const handleAssignTeam = async () => {
    if (selectedUsers?.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        projectId: id,
        user: selectedUsers.map((userId) => ({
          id: userId,
          status: "WORKING",
        })),
      };
      await axiosInstance.post(`/project-management/assign-team`, payload);
      toast.success("Team members assigned successfully");
      const res = await axiosInstance.get(
        `/project-management/project-team/${id}`
      );
      setTeamMembers(res.data.data);
      handleCloseDialog();
    } catch (err) {
      console.error("Failed to assign team members:", err);
      toast.error("Failed to assign team members");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedMember(null);
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!selectedMember) return;
    setIsSubmitting(true);
    try {
      const payload = { userId: selectedMember.user.id, status: newStatus };
      await axiosInstance.patch(
        `/project-management/team-user/status/${id}`,
        payload
      );
      toast.success("Team member status updated successfully");
      setTeamMembers((prev) =>
        prev.map((member) =>
          member.user.id === selectedMember.user.id
            ? { ...member, status: newStatus }
            : member
        )
      );
      handleCloseStatusDialog();
    } catch (err) {
      console.error("Failed to update team member status:", err);
      toast.error("Failed to update team member status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenClientDialog = (
    mode: "add" | "edit",
    client?: { name: string; email: string; contact: string },
    index?: number
  ) => {
    setClientDialogMode(mode);
    setClientDetails(client || { name: "", email: "", contact: "" });
    setSelectedClientIndex(index !== undefined ? index : null);
    setOpenClientDialog(true);
  };

  const handleCloseClientDialog = () => {
    setOpenClientDialog(false);
    setClientDetails({ name: "", email: "", contact: "" });
    setClientDialogMode("add");
    setSelectedClientIndex(null);
  };

  const handleClientChange = (
    field: "name" | "email" | "contact",
    value: string
  ) => {
    setClientDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClientDetails = async () => {
    if (!clientDetails.name || !clientDetails.email || !clientDetails.contact) {
      toast.error("Please fill in all client details");
      return;
    }
    setIsSubmitting(true);
    try {
      let updatedClientDetails = [...(project?.client_details || [])];
      if (clientDialogMode === "edit" && selectedClientIndex !== null) {
        updatedClientDetails[selectedClientIndex] = clientDetails;
      } else {
        updatedClientDetails.push(clientDetails);
      }
      const payload = { projectId: id, client_details: updatedClientDetails };
      await axiosInstance.patch(`/project-management/update/${id}`, payload);
      toast.success(
        `Client details ${
          clientDialogMode === "edit" ? "updated" : "added"
        } successfully`
      );
      setProject((prev) =>
        prev ? { ...prev, client_details: updatedClientDetails } : null
      );
      handleCloseClientDialog();
    } catch (err) {
      console.error(
        `Failed to ${
          clientDialogMode === "edit" ? "update" : "add"
        } client details:`,
        err
      );
      toast.error(
        `Failed to ${
          clientDialogMode === "edit" ? "update" : "add"
        } client details`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTimelineDialog = (
    mode: "add" | "edit",
    timeline?: { time: string; title: string },
    index?: number
  ) => {
    setTimelineDialogMode(mode);
    setTimelineDetails(
      timeline || { time: new Date().toISOString().split("T")[0], title: "" }
    );
    setSelectedTimelineIndex(index !== undefined ? index : null);
    setOpenTimelineDialog(true);
  };

  const handleCloseTimelineDialog = () => {
    setOpenTimelineDialog(false);
    setTimelineDetails({
      time: new Date().toISOString().split("T")[0],
      title: "",
    });
    setTimelineDialogMode("add");
    setSelectedTimelineIndex(null);
  };

  const handleTimelineChange = (field: "title" | "time", value: string) => {
    setTimelineDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveTimelineDetails = async () => {
    if (!timelineDetails.title || !timelineDetails.time) {
      toast.error("Please fill in all timeline details");
      return;
    }
    setIsSubmitting(true);
    try {
      let updatedTimeline = [...(project?.project_timeline || [])];
      if (timelineDialogMode === "edit" && selectedTimelineIndex !== null) {
        updatedTimeline[selectedTimelineIndex] = timelineDetails;
      } else {
        updatedTimeline.push(timelineDetails);
      }
      const payload = { projectId: id, project_timeline: updatedTimeline };
      await axiosInstance.patch(`/project-management/update/${id}`, payload);
      toast.success(
        `Project timeline ${
          timelineDialogMode === "edit" ? "updated" : "added"
        } successfully`
      );
      setProject((prev) =>
        prev ? { ...prev, project_timeline: updatedTimeline } : null
      );
      handleCloseTimelineDialog();
    } catch (err) {
      console.error(
        `Failed to ${
          timelineDialogMode === "edit" ? "update" : "add"
        } project timeline:`,
        err
      );
      toast.error(
        `Failed to ${
          timelineDialogMode === "edit" ? "update" : "add"
        } project timeline`
      );
    } finally {
      setIsSubmitting(false);
    }
  };
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
        "Unable to generate a unique ticket number after maximum attempts"
      );
    }

    return ticketNumber;
  };

  const handleAddTask = async (values: any, { resetForm }: any) => {
    setIsSubmitting(true);
    try {
      let ticket_no: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 3;
      const existingTicketNumbers = reports.map((report) => report.ticket_no);

      while (!isUnique && attempts < maxAttempts) {
        ticket_no = generateTicketNumber(existingTicketNumbers);
        const { status, deadline_hours, deadline_minutes, ...payload } = values;
        payload.status = "pending";
        payload.ticket_no = ticket_no;
        payload.deadline_minutes = values.deadline_total_minutes;

        try {
          const response = await axiosInstance.post(
            "/task-maangement",
            payload
          );
          isUnique = true;

          const taskId = response.data.ticket?.id;
          if (!taskId || !isUUID(taskId)) {
            throw new Error("Task ID must be a valid UUID");
          }

          const selectedUser = modalUsers.find(
            (user) => user?.id === values?.current_user_id
          );
          const createdTask: Report = {
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
          };
          const updatedReports = [...reports, createdTask];
          handleCloseModal();
          fetchTasks();
          toast.success("Task Added Successfully");
          resetForm();
        } catch (error) {
          if (
            error.response?.data?.message?.includes(
              "Ticket number already exists"
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
          "Unable to create task: Could not generate a unique ticket number"
        );
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      if (error.response) {
        toast.error(
          `Failed to create task: ${
            error.response.data.message || "Unknown error"
          }`
        );
      } else {
        toast.error(
          `Failed to create task: ${error.message || "Network error"}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => {
    setOpenModal(false);
    setError(null);
  };
  useEffect(() => {
    const fetchProjectTeam = async () => {
      if (project?.id) {
        try {
          const response = await axiosInstance.get(
            `/project-management/project-team/${project?.id}`
          );
          const teamMembers = response.data.data || [];
          const mappedUsers: User[] = teamMembers.map((member: any) => ({
            id: member.user.id,
            first_name: member.user.first_name,
            last_name: member.user.last_name,
          }));
          setModalUsers(mappedUsers);
        } catch (error) {
          console.error("Failed to fetch project team members:", error);
          setModalUsers([]);
        }
      }
    };

    fetchProjectTeam();
  }, [project?.id]);

  // const filteredTasks = tasks.filter(task =>
  // task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // const priority1Tasks = filteredTasks.filter(task => task.priority === 'p1' && !(task.status === 'testable' || task.status === 'completed'));
  // const priority2Tasks = filteredTasks.filter(task => task.priority === 'p2' && !(task.status === 'testable' || task.status === 'completed'));
  // const priority3Tasks = filteredTasks.filter(task => task.priority === 'p3' && !(task.status === 'testable' || task.status === 'completed'));
  // const unassignedTasks = filteredTasks.filter(task => !task.current_user);
  // const completedTasks = filteredTasks.filter(task => task.status === 'testable' || task.status === 'completed');

  // const priority1Tasks = tasks.filter(task => task.priority === 'p1');
  // const priority2Tasks = tasks.filter(task => task.priority === 'p2');
  // const priority3Tasks = tasks.filter(task => task.priority === 'p3');
  // const unassignedTasks = tasks.filter(task => !task.current_user);

  const filteredTasks = tasks.filter((task) =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const priority1Tasks = filteredTasks.filter(
    (task) =>
      task.priority === "p1" &&
      !(task.status === "testable" || task.status === "completed")
  );
  const priority2Tasks = filteredTasks.filter(
    (task) =>
      task.priority === "p2" &&
      !(task.status === "testable" || task.status === "completed")
  );
  const priority3Tasks = filteredTasks.filter(
    (task) =>
      task.priority === "p3" &&
      !(task.status === "testable" || task.status === "completed")
  );
  const unassignedTasks = filteredTasks.filter((task) => !task.current_user);
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "testable" || task.status === "completed"
  );

  const filteredMembers = teamMembers.filter((member) =>
    `${member.user.first_name} ${member.user.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const statusOptions = [
    "WORKING",
    "NOT_WORKING",
    "MAINTAINING",
    "SUPERVISE",
    "ON_HOLD",
  ];

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Skeleton
          variant="rectangular"
          height={250}
          sx={{ borderRadius: "20px", mb: 4 }}
        />
        <Skeleton
          variant="rectangular"
          height={350}
          sx={{ borderRadius: "20px", mb: 4 }}
        />
        <Skeleton
          variant="rectangular"
          height={250}
          sx={{ borderRadius: "20px" }}
        />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Project not found
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#fff",
            color: "#1F2937",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
          success: {
            style: { border: "1px solid #10B981" },
          },
          error: {
            style: { border: "1px solid #B91C1C" },
          },
        }}
      />
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          minHeight: "100vh",
          // bgcolor: theme.palette.background.default,
          overflowX: "hidden",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card
            sx={{
              mb: 6,
              position: "relative",
              overflow: "hidden",
              "&:before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "4px",
                background:
                  "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
              },
            }}
            onClick={() => setExpanded(!expanded)}
          >
            <CardContent sx={{ p: { xs: 4, md: 6 }, position: "relative" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    flex: "1 1 auto",
                    backgroundColor: "var(--primary-color-1)",
                    color: "var(--text-color)",
                  }}
                >
                  {project.title}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-2)",
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/tasks?projectId=${id}`);
                    }}
                  >
                    Sprints
                  </Button>
                  <IconButton
                    sx={{
                      "&:hover": {
                        bgcolor: "var(--primary-color-1)",
                        color: "white",
                      },
                      transition: "all 0.3s",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(!expanded);
                    }}
                  >
                    <InfoIcon />
                  </IconButton>
                </Box>
              </Box>
              <motion.div
                initial={{ height: expanded ? "auto" : 0 }}
                animate={{ height: expanded ? "auto" : 0 }}
                transition={{ duration: 0.4 }}
                style={{ overflow: "hidden" }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                    p: 2,
                    borderRadius: "12px",
                  }}
                >
                  <Typography variant="body1">
                    <strong>Status:</strong> {project?.status}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Client:</strong>{" "}
                    {project?.client_details?.length > 0
                      ? project?.client_details[0]?.name
                      : "—"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Current Phase:</strong>{" "}
                    {project.current_phase || "—"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Start Date:</strong>{" "}
                    {formatDate(project?.start_date)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>End Date:</strong> {formatDate(project?.end_date)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Deadline:</strong> {formatDate(project?.deadLine)}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ gridColumn: { xs: "1", sm: "1 / 3" } }}
                  >
                    <strong>Description:</strong> {project?.description || "—"}
                  </Typography>
                </Box>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <Card sx={{ mb: 6 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ color: "var(--primary-color-1)" }}
                  >
                    Project Files & Documents
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload files or create collaborative documents for your
                    team.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
                    onChange={handleAttachmentUpload}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    sx={{
                      borderColor: "var(--primary-color-1)",
                      color: "var(--primary-color-1)",
                      "&:hover": {
                        borderColor: "var(--primary-color-2)",
                        bgcolor: "rgba(30, 58, 138, 0.05)",
                      },
                    }}
                  >
                    {uploadingAttachment ? "Uploading..." : "Upload File"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<NoteAddIcon />}
                    onClick={() => setCreateDocModalOpen(true)}
                    sx={{
                      bgcolor: "var(--primary-color-1)",
                      "&:hover": { bgcolor: "var(--primary-color-2)" },
                    }}
                  >
                    Create Document
                  </Button>
                </Stack>
              </Box>

              {/* Documents Section */}
              {documentsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                documents.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}
                    >
                      📝 Documents ({documents.length})
                    </Typography>
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      {documents.map((doc) => {
                        const updatedAt = doc.updated_at
                          ? new Date(doc.updated_at)
                          : null;
                        const relativeTime =
                          updatedAt && !Number.isNaN(updatedAt.getTime())
                            ? formatDistanceToNow(updatedAt, {
                                addSuffix: true,
                              })
                            : "";
                        const creatorName = doc.created_by
                          ? `${doc.created_by.first_name || ""} ${
                              doc.created_by.last_name || ""
                            }`.trim()
                          : "";

                        return (
                          <Stack
                            key={doc.id}
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            alignItems={{ xs: "flex-start", md: "center" }}
                            sx={{
                              p: 2.5,
                              borderRadius: "16px",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                              bgcolor: "rgba(16, 185, 129, 0.03)",
                              boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "rgba(16, 185, 129, 0.4)",
                                bgcolor: "rgba(16, 185, 129, 0.06)",
                              },
                            }}
                            onClick={() =>
                              router.push(
                                `/project-listing/${id}/documents/${doc.id}`
                              )
                            }
                          >
                            <Box
                              sx={{
                                width: 52,
                                height: 52,
                                borderRadius: "14px",
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                color: "#10B981",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              <ArticleIcon />
                              {doc.is_locked && (
                                <LockIcon
                                  sx={{
                                    position: "absolute",
                                    bottom: -4,
                                    right: -4,
                                    fontSize: 16,
                                    color: "warning.main",
                                    bgcolor: "white",
                                    borderRadius: "50%",
                                    p: 0.25,
                                  }}
                                />
                              )}
                            </Box>
                            <Box sx={{ flexGrow: 1, width: "100%" }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                {doc.title}
                                {doc.is_locked && (
                                  <Chip
                                    label="Locked"
                                    size="small"
                                    color="warning"
                                    sx={{ height: 20, fontSize: 10 }}
                                  />
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Document • Updated {relativeTime}
                                {creatorName && ` • Created by ${creatorName}`}
                              </Typography>
                            </Box>
                            <Stack
                              direction="row"
                              spacing={1}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon fontSize="small" />}
                                onClick={() =>
                                  router.push(
                                    `/project-listing/${id}/documents/${doc.id}`
                                  )
                                }
                                sx={{
                                  borderColor: "#10B981",
                                  color: "#10B981",
                                  "&:hover": {
                                    borderColor: "#059669",
                                    bgcolor: "rgba(16, 185, 129, 0.05)",
                                  },
                                }}
                              >
                                Open
                              </Button>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteDocument(doc.id)}
                                sx={{
                                  bgcolor: "rgba(254, 226, 226, 0.6)",
                                  "&:hover": {
                                    bgcolor: "rgba(248, 113, 113, 0.2)",
                                  },
                                }}
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </>
                )
              )}

              {/* Uploaded Files Section */}
              {attachmentsLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 6,
                  }}
                >
                  <CircularProgress size={28} />
                </Box>
              ) : attachments.length === 0 && documents.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    borderRadius: "16px",
                    border: "1px dashed rgba(148, 163, 184, 0.4)",
                    bgcolor: "rgba(248, 250, 252, 0.6)",
                  }}
                >
                  <DescriptionIcon
                    sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
                  />
                  <Typography variant="subtitle1" color="text.secondary">
                    No files or documents yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload files or create collaborative documents for your
                    team.
                  </Typography>
                </Box>
              ) : attachments.length === 0 ? null : (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}
                  >
                    📎 Uploaded Files ({attachments.length})
                  </Typography>
                  <Stack spacing={2}>
                    {attachments.map((file) => {
                      const uploadedAt = file.uploaded_at
                        ? new Date(file.uploaded_at)
                        : null;
                      const hasValidDate =
                        uploadedAt && !Number.isNaN(uploadedAt.getTime());
                      const relativeTime = hasValidDate
                        ? formatDistanceToNow(uploadedAt!, { addSuffix: true })
                        : "";
                      const extension = file.file_name?.includes(".")
                        ? file.file_name.split(".").pop()?.toUpperCase()
                        : undefined;
                      const uploaderName = file.uploaded_by
                        ? `${file.uploaded_by.first_name || ""} ${
                            file.uploaded_by.last_name || ""
                          }`.trim()
                        : "";

                      return (
                        <Stack
                          key={file.id}
                          direction={{ xs: "column", md: "row" }}
                          spacing={2}
                          alignItems={{ xs: "flex-start", md: "center" }}
                          sx={{
                            p: 2.5,
                            borderRadius: "16px",
                            border: "1px solid rgba(148, 163, 184, 0.18)",
                            bgcolor: "rgba(249, 250, 251, 0.8)",
                            boxShadow: "0 6px 14px rgba(15, 23, 42, 0.05)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: "14px",
                              bgcolor: "rgba(30, 58, 138, 0.12)",
                              color: "var(--primary-color-1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <DescriptionIcon />
                          </Box>
                          <Box sx={{ flexGrow: 1, width: "100%" }}>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {file.file_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {extension ? `${extension} • ` : ""}
                              {formatFileSize(file.file_size)}{" "}
                              {relativeTime && `• Uploaded ${relativeTime}`}
                              {uploaderName && ` by ${uploaderName}`}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon fontSize="small" />}
                              onClick={() =>
                                id &&
                                router.push(
                                  `/project-listing/${id}/files?file=${file.id}`
                                )
                              }
                            >
                              View
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              component="a"
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<DownloadIcon fontSize="small" />}
                            >
                              Download
                            </Button>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteAttachment(file.id)}
                              sx={{
                                bgcolor: "rgba(254, 226, 226, 0.6)",
                                "&:hover": {
                                  bgcolor: "rgba(248, 113, 113, 0.2)",
                                },
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Stack>
                        </Stack>
                      );
                    })}
                  </Stack>
                </>
              )}

              {/* Create Document Modal */}
              <CreateDocumentModal
                open={createDocModalOpen}
                onClose={() => setCreateDocModalOpen(false)}
                onSubmit={handleCreateDocument}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Members Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <Card sx={{ mb: 6 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "var(--primary-color-1)" }}
                >
                  Team Members
                </Typography>
                <IconButton
                  sx={{
                    backgroundColor: "#DCDCDC",
                    "&:hover": {
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                    },
                    transition: "all 0.3s",
                  }}
                  onClick={handleOpenDialog}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <TextField
                label="Search Team Members"
                variant="outlined"
                fullWidth
                sx={{ mb: 3 }}
                onChange={(e) => setSearch(e.target.value)}
              />
              {teamLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>
              ) : filteredMembers?.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <GroupIcon
                    sx={{ fontSize: 80, color: "text.secondary", opacity: 0.7 }}
                  />
                  <Typography variant="h6" color="text.secondary" mt={2}>
                    No team members found.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Try adjusting your search or add a new team member.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", overflowX: "hidden" }}>
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: "none",
                      borderRadius: "16px",
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    <Table>
                      <TableHead sx={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <TableRow>
                          <TableCell>Icon</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Designation</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Time Spent</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredMembers
                          .slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                          )
                          .map((member, index) => (
                            <TeamMemberRow
                              key={member.id}
                              member={member}
                              index={index}
                              onNameClick={handleOpenStatusDialog}
                            />
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <CustomPagination
                    page={page + 1}
                    rowsPerPage={rowsPerPage}
                    totalCount={filteredMembers?.length}
                    onPageChange={(_, newPage) => setPage(newPage - 1)}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Assign Team Members Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: "primary.main",
              color: "white",
              mb: 2,
              textAlign: "center",
              background:
                "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
            }}
          >
            Assign Team Members
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Users</InputLabel>
              <Select
                multiple
                value={selectedUsers}
                onChange={(e) => setSelectedUsers(e.target.value as string[])}
                label="Users"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const user = availableUsers.find((u) => u.id === value);
                      return user ? (
                        <Chip
                          key={value}
                          label={`${user.first_name} ${user.last_name}`}
                          sx={{ borderRadius: "8px" }}
                          onDelete={(e) => {
                            e.stopPropagation();
                            setSelectedUsers((prev) =>
                              prev.filter((id) => id !== value)
                            );
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {availableUsers
                  .filter((u) => !selectedUsers.includes(u.id))
                  ?.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {`${u.first_name} ${u.last_name} (${u.email})`}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              disabled={isSubmitting}
              sx={{ color: "var(--primary-color-1)" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: "var(--primary-color-1)" }}
              onClick={handleAssignTeam}
              disabled={isSubmitting || selectedUsers.length === 0}
            >
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog
          open={openStatusDialog}
          onClose={handleCloseStatusDialog}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: "primary.main",
              color: "white",
              mb: 2,
              textAlign: "center",
              background:
                "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
            }}
          >
            Change Status for {selectedMember?.user.first_name}{" "}
            {selectedMember?.user.last_name}
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedMember?.status || ""}
                label="Status"
                onChange={(e) => handleChangeStatus(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {formatStatusForDisplay(status)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStatusDialog} disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Client Details Dialog */}
        <Dialog
          open={openClientDialog}
          onClose={handleCloseClientDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: "primary.main",
              color: "white",
              mb: 2,
              textAlign: "center",
              background:
                "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
            }}
          >
            {clientDialogMode === "edit"
              ? "Edit Client Details"
              : "Add Client Details"}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={(e) => e.preventDefault()}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <TextField
                  label="Name"
                  value={clientDetails.name}
                  onChange={(e) => handleClientChange("name", e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Email"
                  value={clientDetails.email}
                  onChange={(e) => handleClientChange("email", e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Contact"
                  value={clientDetails.contact}
                  onChange={(e) =>
                    handleClientChange("contact", e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                />
              </Box>
            </form>
          </DialogContent>
          <DialogActions>
            <Button
              sx={{ color: "var(--primary-color-1)" }}
              onClick={handleCloseClientDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ bgcolor: "var(--primary-color-1)" }}
              onClick={handleSaveClientDetails}
              disabled={
                isSubmitting ||
                (!clientDetails.name.trim() &&
                  !clientDetails.email.trim() &&
                  !clientDetails.contact.trim())
              }
            >
              {isSubmitting
                ? "Saving..."
                : clientDialogMode === "edit"
                ? "Save"
                : "Add"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Project Timeline Dialog */}
        <Dialog
          open={openTimelineDialog}
          onClose={handleCloseTimelineDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              bgcolor: "primary.main",
              color: "white",
              mb: 2,
              textAlign: "center",
              background:
                "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
            }}
          >
            {timelineDialogMode === "edit"
              ? "Edit Project Timeline"
              : "Add Project Timeline"}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={(e) => e.preventDefault()}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <TextField
                  label="Title"
                  value={timelineDetails.title}
                  onChange={(e) =>
                    handleTimelineChange("title", e.target.value)
                  }
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Date"
                  type="date"
                  value={timelineDetails?.time?.split("T")[0]}
                  onChange={(e) => handleTimelineChange("time", e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </form>
          </DialogContent>
          <DialogActions>
            <Button
              sx={{ color: "var(--primary-color-1)" }}
              onClick={handleCloseTimelineDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ bgcolor: "var(--primary-color-1)" }}
              onClick={handleSaveTimelineDetails}
              disabled={isSubmitting || !timelineDetails.title.trim()}
            >
              {isSubmitting
                ? "Saving..."
                : timelineDialogMode === "edit"
                ? "Save"
                : "Add"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Client Details */}
        <Box sx={{ mb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <Card sx={{ mb: 6 }}>
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: "var(--primary-color-1)" }}
                  >
                    Client Details
                  </Typography>
                  <IconButton
                    sx={{
                      backgroundColor: "#DCDCDC",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-1)",
                        color: "white",
                      },
                      transition: "all 0.3s",
                    }}
                    onClick={() => handleOpenClientDialog("add")}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
                {project.client_details?.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <GroupIcon
                      sx={{
                        fontSize: 80,
                        color: "text.secondary",
                        opacity: 0.7,
                      }}
                    />
                    <Typography variant="h6" color="text.secondary" mt={2}>
                      No client details found.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: "100%", overflowX: "hidden" }}>
                    <TableContainer
                      component={Paper}
                      sx={{
                        boxShadow: "none",
                        borderRadius: "16px",
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        overflowY: "hidden",
                      }}
                    >
                      <Table>
                        <TableHead
                          sx={{ position: "sticky", top: 0, zIndex: 1 }}
                        >
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {project?.client_details?.map((client, index) => (
                            <ClientRow
                              key={client.email}
                              client={client}
                              index={index}
                              onEdit={(client, index) =>
                                handleOpenClientDialog("edit", client, index)
                              }
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Project Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 4,
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: "var(--primary-color-1)" }}
                >
                  Project Timeline
                </Typography>
                <IconButton
                  sx={{
                    backgroundColor: "#DCDCDC",
                    "&:hover": {
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                    },
                    transition: "all 0.3s",
                  }}
                  onClick={() => handleOpenTimelineDialog("add")}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              {project.project_timeline?.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <GroupIcon
                    sx={{ fontSize: 80, color: "text.secondary", opacity: 0.7 }}
                  />
                  <Typography variant="h6" color="text.secondary" mt={2}>
                    No timeline entries found.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ width: "100%", overflowX: "hidden" }}>
                  <Timeline
                    sx={{
                      [`& .${timelineOppositeContentClasses.root}`]: {
                        flex: 0.15,
                        padding: 0,
                      },
                      padding: 0,
                    }}
                  >
                    {project?.project_timeline
                      ?.sort(
                        (a, b) =>
                          new Date(a.time).getTime() -
                          new Date(b.time).getTime()
                      )
                      ?.map((timeline, index) => (
                        <ProjectTimelineItem
                          key={timeline.title}
                          timeline={timeline}
                          index={index}
                          onEdit={(timeline, index) =>
                            handleOpenTimelineDialog("edit", timeline, index)
                          }
                          isFirst={index === 0}
                          isLast={
                            index === project.project_timeline?.length - 1
                          }
                        />
                      ))}
                  </Timeline>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
        >
          <TasksContainer>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                px: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: "var(--primary-color-1)" }}
              >
                Tasks
              </Typography>
              <Box>
                <SearchField
                  label="Search by title"
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ width: { xs: "100%", sm: 300 } }}
                />
                <IconButton
                  sx={{
                    backgroundColor: "#DCDCDC",
                    marginLeft: "10px",
                    "&:hover": {
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                    },
                    transition: "all 0.3s",
                  }}
                  onClick={handleOpenModal}
                >
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ px: 3 }}>
              {(searchTerm === "" || priority1Tasks.length > 0) && (
                <TicketSection
                  title="Priority 1 Tickets"
                  tickets={priority1Tasks}
                  open={openSections.p1}
                  onToggle={() => handleToggleSection("p1")}
                  noOFTickets={priority1Tasks.length}
                />
              )}
              {(searchTerm === "" || priority2Tasks.length > 0) && (
                <TicketSection
                  title="Priority 2 Tickets"
                  tickets={priority2Tasks}
                  open={openSections.p2}
                  onToggle={() => handleToggleSection("p2")}
                  noOFTickets={priority2Tasks.length}
                />
              )}
              {(searchTerm === "" || priority3Tasks.length > 0) && (
                <TicketSection
                  title="Priority 3 Tickets"
                  tickets={priority3Tasks}
                  open={openSections.p3}
                  onToggle={() => handleToggleSection("p3")}
                  noOFTickets={priority3Tasks.length}
                />
              )}
              {(searchTerm === "" || unassignedTasks.length > 0) && (
                <TicketSection
                  title="Unassigned Tickets"
                  tickets={unassignedTasks}
                  open={openSections.unassigned}
                  onToggle={() => handleToggleSection("unassigned")}
                  noOFTickets={unassignedTasks.length}
                />
              )}
              {(searchTerm === "" || completedTasks.length > 0) && (
                <TicketSection
                  title="Completed Tickets"
                  tickets={completedTasks}
                  open={openSections.completed}
                  onToggle={() => handleToggleSection("completed")}
                  noOFTickets={completedTasks.length}
                />
              )}
              {searchTerm && filteredTasks.length === 0 && (
                <Box sx={{ textAlign: "center", py: 4, px: 3 }}>
                  <GroupIcon
                    sx={{ fontSize: 60, color: "text.secondary", opacity: 0.7 }}
                  />
                  <Typography
                    color="text.secondary"
                    mt={2}
                    sx={{ fontSize: "0.9rem" }}
                  >
                    No tickets found matching '{searchTerm}'
                  </Typography>
                </Box>
              )}
            </Box>
          </TasksContainer>
        </motion.div>
      </Box>
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800,
            bgcolor: "#ffffff",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            component="h2"
            sx={{ mb: 2, fontWeight: "bold", color: "#172b4d" }}
          >
            {"Add New Task"}
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 2, color: "#f44336" }}>
              {error}
            </Typography>
          )}
          <Formik
            enableReinitialize
            initialValues={{
              title: "",
              priority: "p3",
              description: "",
              project_id: project?.id,
              current_user_id: "",
              deadline_hours: "0",
              deadline_minutes: "0",
              deadline_total_minutes: "0",
            }}
            validationSchema={taskSchema}
            onSubmit={handleAddTask}
          >
            {({ values, setFieldValue, errors, touched, dirty }) => (
              <Form>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Field
                      as={TextField}
                      name="title"
                      label="Title"
                      fullWidth
                      margin="none"
                      sx={{
                        "& .MuiOutlinedInput-root": {
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
                      error={touched.title && !!errors.title}
                      helperText={touched.title && errors.title}
                    />
                    <FormControl
                      fullWidth
                      error={touched.priority && !!errors.priority}
                    >
                      <InputLabel>Priority</InputLabel>

                      <Field
                        as={Select}
                        name="priority"
                        label="Priority"
                        sx={{
                          borderRadius: "10px", // or '0.5rem'
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--primary-color-1)",
                          },
                          "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--primary-color-2)",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "var(--primary-color-2)",
                          },
                        }}
                      >
                        <MenuItem value="p1">P1</MenuItem>
                        <MenuItem value="p2">P2</MenuItem>
                        <MenuItem value="p3">P3</MenuItem>
                      </Field>

                      <ErrorMessage name="priority">
                        {(msg) => (
                          <div style={{ color: "red", fontSize: "0.75rem" }}>
                            {msg}
                          </div>
                        )}
                      </ErrorMessage>
                    </FormControl>

                    <FormControl
                      fullWidth
                      error={touched.project_id && !!errors.project_id}
                    >
                      <TextField
                        label={<RequiredLabel label="Project" />}
                        variant="outlined"
                        fullWidth
                        value={project?.title || ""}
                        disabled
                        error={touched.project_id && !!errors.project_id}
                        helperText={
                          touched.project_id &&
                          typeof errors.project_id === "string"
                            ? errors.project_id
                            : ""
                        }
                      />
                    </FormControl>
                    <FormControl
                      fullWidth
                      error={Boolean(
                        touched.current_user_id && errors?.current_user_id
                      )}
                    >
                      <Autocomplete
                        options={modalUsers}
                        getOptionLabel={(option) =>
                          `${option.first_name} ${option.last_name}`
                        }
                        value={
                          modalUsers.find(
                            (u) => u.id === values.current_user_id
                          ) || null
                        }
                        onChange={(_, selectedUser) => {
                          setFieldValue(
                            "current_user_id",
                            selectedUser?.id || ""
                          );
                        }}
                        disabled={!values.project_id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="User"
                            name="current_user_id"
                            sx={{
                              "& .MuiOutlinedInput-root": {
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
                            error={Boolean(
                              touched.current_user_id && errors?.current_user_id
                            )}
                            helperText={
                              touched.current_user_id &&
                              typeof errors?.current_user_id === "string"
                                ? errors.current_user_id
                                : ""
                            }
                          />
                        )}
                        noOptionsText={
                          values.project_id
                            ? "No users found"
                            : "Select a project first"
                        }
                      />
                    </FormControl>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <Field
                      as={TextField}
                      name="description"
                      label="Description"
                      fullWidth
                      multiline
                      rows={7}
                      sx={{
                        "& .MuiOutlinedInput-root": {
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography> ETA</Typography>
                      <Field
                        as={TextField}
                        name="deadline_hours"
                        label="Hours"
                        type="number"
                        sx={{
                          flex: 1,
                          "& .MuiOutlinedInput-root": {
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
                        margin="none"
                        error={
                          touched.deadline_hours && !!errors.deadline_hours
                        }
                        helperText={
                          touched.deadline_hours && errors.deadline_hours
                        }
                        onChange={(e: any) => {
                          const hours = e.target.value;
                          setFieldValue("deadline_hours", hours);
                          const totalMinutes =
                            (parseFloat(hours) || 0) * 60 +
                            (parseFloat(values.deadline_minutes) || 0);
                          setFieldValue(
                            "deadline_total_minutes",
                            Math.round(totalMinutes).toString()
                          );
                        }}
                      />
                      <Field
                        as={TextField}
                        name="deadline_minutes"
                        label="Minutes"
                        type="number"
                        sx={{
                          flex: 1,
                          "& .MuiOutlinedInput-root": {
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
                        margin="none"
                        error={
                          touched.deadline_minutes && !!errors.deadline_minutes
                        }
                        helperText={
                          touched.deadline_minutes && errors.deadline_minutes
                        }
                        onChange={(e: any) => {
                          const minutes = e.target.value;
                          setFieldValue("deadline_minutes", minutes);
                          const totalMinutes =
                            (parseFloat(values.deadline_hours) || 0) * 60 +
                            (parseFloat(minutes) || 0);
                          setFieldValue(
                            "deadline_total_minutes",
                            Math.round(totalMinutes).toString()
                          );
                        }}
                      />
                    </Box>
                    <ErrorMessage name="deadline_total_minutes">
                      {(msg) => (
                        <div style={{ color: "red", fontSize: "0.75rem" }}>
                          {msg}
                        </div>
                      )}
                    </ErrorMessage>
                  </Box>
                </Box>
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleCloseModal}
                    sx={{
                      borderColor: "var(--primary-color-1)",
                      color: "var(--primary-color-1)",
                      "&:hover": {
                        borderColor: "var(--primary-color-2)",
                        backgroundColor: "rgba(0, 0, 0, 0.02)", // optional subtle hover effect
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || !dirty}
                    sx={{
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-1-hover)",
                      },
                    }}
                  >
                    {"Add Task"}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </ThemeProvider>
  );
};

export default ProjectDetailsPage;
