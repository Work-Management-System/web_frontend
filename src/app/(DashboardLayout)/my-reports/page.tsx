"use client";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Chip,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Autocomplete,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import dayjs from "dayjs";
import { useEffect, useState, useCallback, memo, useRef } from "react";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import { usePathname } from "next/navigation";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import { exportReportsToExcel } from "@/utils/exports/ExportExcel";
import { exportReportsToDocx } from "@/utils/exports/ExportDocx";
import { CustomPagination } from "@/app/(AuthLayout)/components/Pagination/CustomPagination";
import ExportFileDropdown from "@/utils/exports/ExportFilesDropDown";
import debounce from "lodash/debounce";
import RateReviewIcon from '@mui/icons-material/RateReview';
import toast from "react-hot-toast";
import { Email, Phone } from "@mui/icons-material";
import AvTimerIcon from '@mui/icons-material/AvTimer';
import Loader from "@/app/loading";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns'; 

export interface Report {
  id:string,
  created_at: string;
  officein: string;
  officeout: string;
  leave: boolean;
  user: { first_name: string; last_name: string; id: string ;reporting_manager?:{id?:string}};
  taskReports: {
    project?: { title: string };
    task_name: string;
    description: string;
    status: string;
    eta: string;
    time_taken: string;
    start_time: string;
    end_time: string;
    remarks: string;
  }[];
  hasSubordinates?: boolean;
}
interface User {
  id: string;
  first_name: string;
  last_name: string;
}

interface ReportAccordionProps {
  report: Report;
  reportType: string;
  fetchNestedSubordinateReports: (subordinateId: string) => Promise<void>;
  nestedReports: { [key: string]: Report[] };
  nestedLoading: { [key: string]: boolean };
  nestedExpanded: { [key: string]: boolean };
  toggleNestedReports: (subordinateId: string) => void;
  depth: number;
  refreshReports: () => Promise<void>;
 expandedReportIds: Record<string, boolean>;
setExpandedReportIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}
export interface Project {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
  current_phase: string;
  // client_details: ClientDetails[];
  // project_timeline: ProjectTimeline[];
  is_active: boolean;
  is_delete: boolean;
  created_at: string;
  updated_at: string;
}
const MAX_NESTING_DEPTH = 5;

const ReportAccordion: React.FC<ReportAccordionProps> = memo(
  ({
    report,
    reportType,
    fetchNestedSubordinateReports,
    nestedReports,
    nestedLoading,
    nestedExpanded,
    toggleNestedReports,
    depth,
    refreshReports,
    expandedReportIds,
    setExpandedReportIds
  }) => {
    console.log(`Rendering ReportAccordion for user ${report.user.id}: hasSubordinates = ${report.hasSubordinates}`);
    console.log("Rendered Report",report)
    if (depth >= MAX_NESTING_DEPTH) {
      return (
        <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
          Maximum nesting depth reached.
        </Typography>
      );
    }

    const formatMinutesToHM = (totalMinutes: string | number | null | undefined) => {

      if (!totalMinutes || isNaN(Number(totalMinutes))) return "";
      const minutes = Number(totalMinutes);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (hours === 0) return `${remainingMinutes} mins`;
      return `${hours} hr ${remainingMinutes} mins`;
    };
const [open, setOpen] = useState(false);
const [selectedWorklogId, setSelectedWorklogId] = useState<string | null>(null);
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
const [remarkText, setRemarkText] = useState<string>('');
const axiosInstance = createAxiosInstance();
const userPriority = useAppselector((state) => state.role.value.priority);
const authData = useAppselector((state) => state.auth.value);
const userId = authData?.user?.id;

console.log("Reporting Mangager Id",report?.user?.reporting_manager?.id)
console.log("User Id to check RM",userId)
console.log("Expanded Report Id",expandedReportIds)

const handleSubmitRemark = async () => {
  if (!selectedWorklogId || !selectedTaskId || !remarkText) return;

  const payload = {
    task_id: selectedTaskId,
    remarks: remarkText,
  };

  try {
    await axiosInstance.patch(`work-logs/remarks/${selectedWorklogId}`, payload);
    toast.success('Remark updated!');
    setOpen(false);
    setRemarkText('');

setExpandedReportIds?.((prev) => ({
  ...prev,
  [report.id]: true, // Ensure this one stays open
}));    await refreshReports();      

  } catch (error) {
    toast.error('Failed to update remark');
  }
};
    const totalTimeTaken = report.taskReports?.reduce((acc, task) => {
      const minutes = parseInt(task.time_taken || "0", 10);
      return acc + (isNaN(minutes) ? 0 : minutes);
    }, 0);
    const totalTimeSpentToday = formatMinutesToHM(totalTimeTaken);
    
    const stripHtml = (html: string): string => {
      if (!html) return '';
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    return (
      <>
<Dialog open={open} onClose={() => setOpen(false)} PaperProps={{
    sx: {
      position: 'absolute',
      top: '50%',
      right: '0',
      transform: 'translateY(-50%)',
      width: 300, // Optional: Set a width
      m: 0,
    },
  }}>
  <DialogTitle>Add Remark</DialogTitle>
  <DialogContent>
    <TextField
    size="small" 
      autoFocus
      margin="dense"
      label="Remark"
      fullWidth
      variant="outlined"
      value={remarkText}
      onChange={(e) => setRemarkText(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
    <Button onClick={handleSubmitRemark} disabled={!remarkText.trim()} variant="contained">Submit</Button>
  </DialogActions>
</Dialog>

      <Accordion
       expanded={!!expandedReportIds?.[report.id]} // Check if this ID is marked as expanded
  onChange={() => {
    setExpandedReportIds?.((prev) => ({
      ...prev,
      [report.id]: !prev[report.id], // Toggle the expansion for this report
    }));
  }}
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          "&:before": { display: "none" },
          transition: "all 0.2s ease",
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
          ml: depth * 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: "var(--primary-color-1)" }} />}
          sx={{
            backgroundColor: depth === 0 ? "#f8f9fa" : "#f0f4f8",
            borderRadius: "8px 8px 0 0",
            "&.Mui-expanded": {
              minHeight: 48,
              backgroundColor: "var(--primary-bg-colors)",
            },
            "& .MuiAccordionSummary-content": {
              alignItems: "center",
              my: 1,
            },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#2c3e50",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <EventAvailableIcon
              fontSize="small"
              sx={{ color: "var(--primary-color-1)" }}
            />
            Report Date:
            <Box
              component="span"
              sx={{
                color: "var(--primary-color-1)",
                fontWeight: 700,
                ml: 0.5,
              }}
            >
                {new Date(report.officein).toLocaleDateString('en-GB')}
             </Box>
            <Box
              component="span"
              sx={{
                fontWeight: 700,
                ml: 5,
              }}
            >
              User:
            </Box>
            <Box
              component="span"
              sx={{
                color: "var(--primary-1-text-color)",
                fontWeight: 700,
                ml: 0.5,
              }}
            >
              {report?.user?.first_name} {report?.user?.last_name}
            </Box>
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: "0 0 8px 8px",
            p: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
              p: 2,
              borderRadius: 1,
              borderLeft: "4px solid",
              borderColor: "var(--primary-color-1)",
              alignItems: "center",
              ...(report.hasSubordinates !== true && { pr: 2 }),
            }}
          >
            <Chip
              icon={<AccessTimeIcon />}
              label={`In: ${dayjs(report.officein).format("hh:mm A")}`}
              variant="outlined"
              color="primary"
            />
            <Chip
              icon={<AccessTimeFilledIcon />}
              label={`Out: ${dayjs(report.officeout).format("hh:mm A")}`}
              variant="outlined"
              color="secondary"
            />
            <Chip
                icon={report.leave ? <EventAvailableIcon /> : <EventBusyIcon />}
              label={`Leave: ${report.leave ?report.leave : "No"}`}
              variant="outlined"
              color={report.leave ? "error" : "success"}
            />
            <Chip
                icon={<AvTimerIcon/> }
                label={`Today's Working Hours : ${totalTimeSpentToday}`}
              variant="outlined"
              color="primary"
            />
            {reportType === "subordinate" && report.hasSubordinates === true && (
              <Box
                component="div"
                onClick={() => toggleNestedReports(report.user.id)}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  borderRadius: "50px",
                  border: "1px solid var(--primary-color-1)",
                  color: "var(--primary-color-1)",
                  padding: "4px 12px",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "var(--primary-color-2)",
                    color: "white",
                  },
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "auto",
                }}
                role="button"
                aria-label={`View subordinates for ${report.user.first_name} ${report.user.last_name}`}
              >
                {nestedExpanded[report.user.id] ? "Hide Subordinates" : "View Subordinates"}
              </Box>
            )}
          </Box>
          <Table sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 600,
                    backgroundColor: "#e9f5ff",
                    color: "#2c3e50",
                    py: 1.5,
                  },
                }}
              >
                <TableCell sx={{ width: "12%" }}>Project</TableCell>
                <TableCell sx={{ width: "15%" }}>Task</TableCell>
                <TableCell sx={{ width: "35%" }}>Description</TableCell>
                <TableCell sx={{ width: "12%" }}>Status</TableCell>
                <TableCell sx={{ width: "8%" }}>ETA</TableCell>
                <TableCell sx={{ width: "10%" }}>Time Taken</TableCell>
                <TableCell sx={{ width: "12%" }}>Start Time</TableCell>
                <TableCell sx={{ width: "12%" }}>End Time</TableCell>
                <TableCell sx={{ width: "15%" }}>Remark</TableCell>
                {(report?.user?.reporting_manager?.id==userId || userPriority==2) &&
                <TableCell sx={{ width: "9%" }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
                {report.taskReports?.slice()
                  .sort((a: any, b: any) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()).map((task: any, i: any) => (
                <TableRow
                  key={i}
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: "#f8f9fa",
                    },
                    "&:hover": { backgroundColor: "#e9f5ff" },
                  }}
                >
                  <TableCell sx={{ fontSize: 12, wordWrap: "break-word", whiteSpace: "normal" }}>{task?.project?.title}</TableCell>
                  <TableCell sx={{ fontSize: 12, wordWrap: "break-word", whiteSpace: "normal" }}>{task?.task_name}</TableCell>
                  <TableCell sx={{ fontSize: 12, wordWrap: "break-word", whiteSpace: "pre-line" }}>{stripHtml(task.description)}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (char: string) => char.toUpperCase())}
                      size="small"
                      color={
                        task.status.toLowerCase() === "completed"
                          ? "success"
                          : task.status.toLowerCase() === "in_progress"
                          ? "warning"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{formatMinutesToHM(task.eta)}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{formatMinutesToHM(task.time_taken)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", fontSize: 12 }}>
                    {dayjs(task.start_time).format("hh:mm A")}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", fontSize: 12 }}>
                    {dayjs(task.end_time).format("hh:mm A")}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, wordWrap: "break-word", whiteSpace: "normal" }}>{task.remarks}</TableCell>
                 {(report?.user?.reporting_manager?.id==userId || userPriority == 2) &&
                  <TableCell>{

                    <Tooltip title="Add Remark" arrow>

                     <IconButton
                 onClick={() => {
                   setSelectedWorklogId(report.id);     // from current row
                   setSelectedTaskId(task?.id);   // from current row
                   setOpen(true);
                 }}
                 sx={{
                   color: '#1976d2',
                   backgroundColor: '#e3f2fd',
                   '&:hover': {
                     backgroundColor: '#bbdefb',
                     color: '#0d47a1',
                   },
                   borderRadius: '8px',
                   padding: '6px',
                 }}
               >
                 <RateReviewIcon fontSize="small" />
                 </IconButton>

                     </Tooltip>}
                     </TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reportType === "subordinate" && nestedExpanded[report.user.id] && (
            <Box sx={{ mt: 3, pl: 2 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 600, color: "#2c3e50" }}
              >
                Subordinate Reports for {report.user.first_name} {report.user.last_name}
              </Typography>
              {nestedLoading[report.user.id] ? (
                <Typography sx={{ textAlign: "center", py: 3 }}>
                  Loading subordinate reports...
                </Typography>
              ) : nestedReports[report.user.id]?.length === 0 ? (
                <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
                  No subordinate reports found.
                </Typography>
              ) : (
                nestedReports[report.user.id]?.map((nestedReport: Report, nestedIndex: number) => (
                  <ReportAccordion
                    key={`${nestedReport.user.id}-${nestedIndex}`}
                    report={nestedReport}
                    reportType={reportType}
                    fetchNestedSubordinateReports={fetchNestedSubordinateReports}
                    nestedReports={nestedReports}
                    nestedLoading={nestedLoading}
                    nestedExpanded={nestedExpanded}
                    toggleNestedReports={toggleNestedReports}
                    depth={depth + 1}
                    refreshReports={refreshReports}
                    expandedReportIds={expandedReportIds}              
                    setExpandedReportIds={setExpandedReportIds}   
                  />
                ))
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
      </>
    );
  },
  (prevProps, nextProps) =>
    prevProps.report === nextProps.report &&
    prevProps.reportType === nextProps.reportType &&
    prevProps.nestedReports[nextProps.report.user.id] ===
      nextProps.nestedReports[nextProps.report.user.id] &&
    prevProps.nestedLoading[nextProps.report.user.id] ===
      nextProps.nestedLoading[nextProps.report.user.id] &&
    prevProps.nestedExpanded[nextProps.report.user.id] ===
      nextProps.nestedExpanded[nextProps.report.user.id] &&
    prevProps.depth === nextProps.depth &&
    prevProps.expandedReportIds === nextProps.expandedReportIds
);

const ReportList = () => {
  const axiosInstance = createAxiosInstance();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportType, setReportType] = useState("my");
  const [startDate, setStartDate] = useState<dayjs.Dayjs>(dayjs().subtract(1, "month"));
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs());
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [nestedReports, setNestedReports] = useState<{ [key: string]: Report[] }>({});
  const [nestedLoading, setNestedLoading] = useState<{ [key: string]: boolean }>({});
  const [nestedExpanded, setNestedExpanded] = useState<{ [key: string]: boolean }>({});
  const pathName = usePathname();
  const authData = useAppselector((state) => state.auth.value);
  const userPriority = useAppselector((state) => state.role.value.priority);
  const userId = authData?.user?.id;
  const renderCount = useRef(0);
  const [expandedReportIds, setExpandedReportIds] = useState<Record<string, boolean>>({});
  const [empUserId,setEmpUserId]=useState<string>("")
  const [empUserList, setEmpUserLists] = useState<User[]>([]);
  const reportCache = new Map<string, Report[]>();
  const [projectId, setProjectId] = useState<string>("")
  const [isDialogOpen, setDialogOpen] = useState(false); // Changed from open/setOpen
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0]; // Default to yesterday
  });

  const fetchMissedReports = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = userPriority === 2 ? `work-logs/missed-reports` : `work-logs/missed-reports-for-manager/${userId}`;
      const response = await axiosInstance.get(apiUrl, {
        params: { date }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load missed reports. Please try again.');
      setLoading(false);
    }
  };
useEffect(()=>{
fetchMissedReports(selectedDate);
},[selectedDate])
  const handleViewClick = () => {
    setDialogOpen(true); // Updated
    fetchMissedReports(selectedDate);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (isDialogOpen) { // Updated
      fetchMissedReports(newDate);
    }
  };

  const handleClose = () => {
    setDialogOpen(false); // Updated
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email'];

    const rows = users.map((user) => [
      `"${user.first_name} ${user.last_name}"`, // Add trailing spaces inside quotes
      user.email,
    ]);

    const csvContent = [
      `# Missed Reports for Date: ${selectedDate}`,
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missed-reports-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`ReportList render count: ${renderCount.current}`);
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleReportTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newReportType: string | null
  ) => {
    if (newReportType !== null) {
      setReportType(newReportType);
      setPage(1);
      setNestedReports({});
      setNestedExpanded({});
      reportCache.clear();
    }
  };

  // Check if a user has subordinates (lightweight API call)
  const checkHasSubordinates = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const params: { start_date?: string; end_date?: string; page: number; limit: number } = {
          page: 1,
          limit: 1, // Minimal fetch to check existence
        };
        if (startDate) params.start_date = startDate.format("YYYY-MM-DD");
        if (endDate) params.end_date = endDate.format("YYYY-MM-DD");

        const res = await axiosInstance.get(`/work-logs/subordinate-report/${userId}`, { params });
        const subordinateReports = Array.isArray(res.data.data) ? res.data.data : [];
        console.log(`Check hasSubordinates for ${userId}:`, { count: subordinateReports.length, total: res.data.meta?.total });
        return subordinateReports.length > 0 || (res.data.meta?.total ?? 0) > 0;
      } catch (error) {
        console.error(`Error checking subordinates for user ${userId}:`, error);
        return false;
      }
    },
    [startDate, endDate]
  );

  const fetchReports = useCallback(async () => {
    if(projectId) return;
    setLoading(true);
    setReports([]);

    try {
      let endpoint = "";
      const params: any = {
        page,
        limit: rowsPerPage,
      };
      if (userPriority ==2) {
        endpoint = "/work-logs/all-user-reports";
        if (empUserId) params.user_id = empUserId;
        if (startDate) params.start_date = startDate.format("YYYY-MM-DD");
        if (endDate) params.end_date = endDate.format("YYYY-MM-DD");
      } else {
        endpoint =
          reportType === "my"
            ? `/work-logs/user-report/${userId}`
            : `/work-logs/subordinate-report/${userId}`;
        if (startDate) params.start_date = startDate.format("YYYY-MM-DD");
        if (endDate) params.end_date = endDate.format("YYYY-MM-DD");
      }

      const res = await axiosInstance.get(endpoint, { params });
      const fetchedReports = Array.isArray(res.data.data) ? res.data.data : [];

      const reportsWithSubordinates = await Promise.all(
        fetchedReports.map(async (report: Report) => {
          const hasSubordinates =
            reportType === "subordinate" ? await checkHasSubordinates(report.user.id) : false;
          return { ...report, hasSubordinates };
        })
      );

      setReports(reportsWithSubordinates);
      setTotalCount(res.data.meta?.total || 0);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }
, [reportType, userId, startDate, endDate, page, rowsPerPage, checkHasSubordinates, empUserId,date]);
  
  const fetchNestedSubordinateReports = useCallback(
    debounce(async (subordinateId: string) => {
      console.log(`Fetching reports for user ${subordinateId}`);
      if (reportCache.has(subordinateId)) {
        const cachedReports = reportCache.get(subordinateId)!;
        console.log(`Using cached reports for ${subordinateId}:`, cachedReports);
        setNestedReports((prev) => ({
          ...prev,
          [subordinateId]: cachedReports.map((r) => ({ ...r, hasSubordinates: undefined })),
        }));
        const hasSubordinates = cachedReports.length > 0;
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.user.id === subordinateId ? { ...report, hasSubordinates } : report
          )
        );
        setNestedReports((prev) => updateNestedReports(prev, subordinateId, hasSubordinates));
        return;
      }

      if (nestedReports[subordinateId] || nestedLoading[subordinateId]) {
        console.log(`Skipping fetch for ${subordinateId}: already fetched or loading`);
        return;
      }
      setNestedLoading((prev) => ({ ...prev, [subordinateId]: true }));
      try {
        const params: { start_date?: string; end_date?: string; page: number; limit: number } = {
          page: 1,
          limit: rowsPerPage,
        };
        if (startDate) params.start_date = startDate.format("YYYY-MM-DD");
        if (endDate) params.end_date = endDate.format("YYYY-MM-DD");

        const res = await axiosInstance.get(`/work-logs/subordinate-report/${subordinateId}`, {
          params,
        });
        const subordinateReports = Array.isArray(res.data.data) ? res.data.data : [];
        console.log(`Fetched reports for ${subordinateId}:`, subordinateReports);
        const hasSubordinates = subordinateReports.length > 0;
        const reportsWithFlag = await Promise.all(
          subordinateReports.map(async (r: Report) => ({
            ...r,
            hasSubordinates: await checkHasSubordinates(r.user.id),
          }))
        );
        reportCache.set(subordinateId, reportsWithFlag);
        setNestedReports((prev) => ({
          ...prev,
          [subordinateId]: reportsWithFlag,
        }));
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.user.id === subordinateId ? { ...report, hasSubordinates } : report
          )
        );
        setNestedReports((prev) => updateNestedReports(prev, subordinateId, hasSubordinates));
      } catch (error) {
        console.error(`Error fetching nested reports for user ${subordinateId}:`, error);
        setNestedReports((prev) => ({ ...prev, [subordinateId]: [] }));
        reportCache.set(subordinateId, []);
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.user.id === subordinateId ? { ...report, hasSubordinates: false } : report
          )
        );
        setNestedReports((prev) => updateNestedReports(prev, subordinateId, false));
      } finally {
        setNestedLoading((prev) => ({ ...prev, [subordinateId]: false }));
      }
    }, 300),
    [startDate, endDate, rowsPerPage, checkHasSubordinates]
  );

  const updateNestedReports = (
    reportsMap: { [key: string]: Report[] },
    targetUserId: string,
    hasSubordinates: boolean
  ): { [key: string]: Report[] } => {
    console.log(`Updating hasSubordinates for user ${targetUserId} to ${hasSubordinates}`);
    const updated = { ...reportsMap };
    Object.keys(updated).forEach((userId) => {
      updated[userId] = updated[userId].map((report) =>
        report.user.id === targetUserId ? { ...report, hasSubordinates } : report
      );
    });
    return updated;
  };
  const toggleNestedReports = useCallback(
    (subordinateId: string) => {
      setNestedExpanded((prev) => ({
        ...prev,
        [subordinateId]: !prev[subordinateId],
      }));
      fetchNestedSubordinateReports(subordinateId);
    },
    [fetchNestedSubordinateReports]
  );
    useEffect(() => {
      if(userPriority==2){
        setReportType("admin")
      }
      const fetchUsers = async () => {
        try {
          const response = await axiosInstance.get("/user/list");
          setEmpUserLists(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch users:", error);
          setEmpUserLists([]);
        }
      };
      fetchUsers();
      setLoading(false);
    }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <Box sx={{ mx: "auto", p: 2 }}>
      <Card sx={{ boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)", mb: 3 }}>
        <CardContent sx={{ padding: "16px 24px !important" }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        {reportType !== "admin" &&
        <ToggleButtonGroup
          value={reportType}
          exclusive
          onChange={handleReportTypeChange}
          sx={{
            flexShrink: 0,
            "& .MuiToggleButtonGroup-grouped": {
              "&:first-of-type": {
                borderTopLeftRadius: "50px",
                borderBottomLeftRadius: "50px",
              },
              "&:last-of-type": {
                borderTopRightRadius: "50px",
                borderBottomRightRadius: "50px",
              },
              border: "1px solid",
              borderRadius: 0,
              borderColor: "var(--primary-color-1)",
            },
          }}
        >
            <ToggleButton
              value="my"
              sx={{
                textTransform: "none",
                fontSize: "0.70rem",
                padding: "6px 16px",
                width: "140px",
                "&.Mui-selected": {
                  backgroundColor: "var(--primary-color-2)",
                  color: "white",
                },
              }}
            >
              My Reports
            </ToggleButton>
          <ToggleButton
            value="subordinate"
            sx={{
              textTransform: "none",
              fontSize: "0.70rem",
              padding: "7px 16px",
              width: "160px",
              "&.Mui-selected": {
                backgroundColor: "var(--primary-color-2)",
                color: "white",
              },
            }}
          >
            Subordinate Reports
          </ToggleButton>
        </ToggleButtonGroup>
}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {reportType === "admin" && <>
              <Autocomplete
                options={empUserList}
                getOptionLabel={(option) => `${option.first_name} ${option.last_name || ""}`}
                value={empUserList.find((u) => u.id === empUserId) || null}
                onChange={(event, newValue) => {
                  setEmpUserId(newValue ? newValue.id : null);
                  setProjectId(null); 
                  setPage(1);
                  reportCache.clear();
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="User"
                    placeholder="Type to search"
                    size="small"
                    sx={{ width: 250 }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              </>
           }
          <TextField
            label="Start Date"
            type="date"
            value={startDate ? startDate.format("YYYY-MM-DD") : ""}
            onChange={(e) => {
              const newValue = e.target.value ? dayjs(e.target.value) : dayjs();
              setStartDate(newValue);
              if (newValue && endDate && endDate.isBefore(newValue)) {
                setEndDate(null);
              }
              setPage(1);
              reportCache.clear();
            }}
            size="small"
            sx={{
              width: 160,
              "& .MuiOutlinedInput-root": {
                borderRadius: "50px",
                fontSize: "0.75rem",
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.75rem",
              },
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate ? endDate.format("YYYY-MM-DD") : ""}
            onChange={(e) => {
              const newValue = e.target.value
                ? dayjs(e.target.value)
                : dayjs().add(1, "month");
              if (newValue && startDate && newValue.isBefore(startDate)) {
                alert("End date cannot be before start date");
                return;
              }
              setEndDate(newValue);
              setPage(1);
              reportCache.clear();
            }}
            size="small"
            sx={{
              width: 160,
              "& .MuiOutlinedInput-root": {
                borderRadius: "50px",
                fontSize: "0.75rem",
              },
              "& .MuiInputLabel-root": {
                fontSize: "0.75rem",
              },
            }}
            InputLabelProps={{ shrink: true }}
          />
          {userPriority ==2   && 
          <Button
            variant="contained"
            size="large" // Smaller button
            startIcon={<VisibilityIcon fontSize="small" />}
            onClick={handleViewClick}
            sx={{ py: 0.5, px: 1, bgcolor: 'var(--primary-color-2)', '&:hover': { bgcolor: 'var(--primary-color-1)' } }}
          >
            Missed Reports
          </Button>
}
        </Box>
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          {/* Title + Date Picker Row */}
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Missed Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(selectedDate), 'MMMM d, yyyy')}
              </Typography>
            </Box>

            {/* Date Picker on Right */}
            <TextField
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ width: 180 }}
            />
          </DialogTitle>

          {/* Content */}
          <DialogContent dividers>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
                <Typography sx={{ ml: 2 }}>Loading missed reports...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : users.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    {new Date().getDay() == 1 ?"Yesterday was Sunday🌞":"🎉 No users missed submitting reports on this date."}
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow
                      key={user.id}
                      sx={{ backgroundColor: index % 2 === 0 ? 'grey.50' : 'white' }}
                    >
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>

          {/* Actions */}
          <DialogActions sx={{ justifyContent: 'flex-end', px: 3, py: 1.5 }}>
            <Button
              onClick={handleExportCSV}
              variant="outlined"
              size="small"
              disabled={users.length === 0 || loading}
            >
              Export as CSV
            </Button>
            <Button onClick={handleClose} variant="contained" size="small">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <ExportFileDropdown
          data={reports}
          exportToExcel={exportReportsToExcel}
          exportToDocx={exportReportsToDocx}
          label="Export Reports"
        />
      </Box>
      {loading ? (
        <Loader/>
      ) : reports.length === 0 && reportType== "admin" && !projectId? (
        <Typography
          sx={{ textAlign: "center", py: 2, color: "text.secondary" }}
        >
          No reports found for the selected date.
        </Typography>
        ) : reports.length === 0 && !projectId ? (
          <Typography
            sx={{ textAlign: "center", py: 2, color: "text.secondary" }}
          >
            No reports found for the selected date range.
          </Typography>
    ):(
        <>
          {reports.map((report: Report, index) => (
            <ReportAccordion
              key={`${report.user.id}-${index}`}
              report={report}
              reportType={reportType}
              fetchNestedSubordinateReports={fetchNestedSubordinateReports}
              nestedReports={nestedReports}
              nestedLoading={nestedLoading}
              nestedExpanded={nestedExpanded}
              toggleNestedReports={toggleNestedReports}
              depth={0}
              refreshReports={fetchReports}
             expandedReportIds={expandedReportIds}
             setExpandedReportIds={setExpandedReportIds}
            />
          ))}
          {!projectId &&
          <CustomPagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handleChangePage}
          />}
        </>
      )}
    </Box>
  );
};

export default ReportList;