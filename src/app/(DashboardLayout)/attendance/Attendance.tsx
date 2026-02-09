"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Drawer,
  Paper,
  Stack,
  keyframes,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  AccessTime,
  PlayArrow,
  Stop,
  Pause,
  PlayCircleOutline,
  CalendarToday,
  People,
  Refresh,
  LocationOn,
  ChevronLeft,
  ChevronRight,
  Settings,
  EventBusy,
  Add,
  ArrowDownward,
  ArrowUpward,
  Restaurant,
  Coffee,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  getDay,
} from "date-fns";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import toast from "react-hot-toast";

interface AttendanceRecord {
  id: string;
  clock_in_time: string;
  clock_out_time?: string;
  break_start_time?: string;
  break_end_time?: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  status: "CLOCKED_IN" | "CLOCKED_OUT" | "BREAK" | "LUNCH";
  notes?: string;
  location?: string;
  total_hours?: number;
  attendance_date: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_image?: string;
  };
}

interface CurrentStatus {
  status: string;
  attendance?: AttendanceRecord;
}

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LeaveDay {
  id: string;
  leave_date: string;
  reason?: string;
  leave_type: string;
  is_active: boolean;
}

const Attendance = () => {
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | null>(
    null,
  );
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
  const [dayAttendance, setDayAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<
    "clockIn" | "clockOut" | "break" | "lunch" | "endBreak" | "endLunch"
  >("clockIn");
  const [activeTab, setActiveTab] = useState(1); // Calendar View by default
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [leaveDays, setLeaveDays] = useState<LeaveDay[]>([]);
  const [selectedDayView, setSelectedDayView] = useState<Date>(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newLeaveDate, setNewLeaveDate] = useState<Date | null>(null);
  const [newLeaveReason, setNewLeaveReason] = useState("");
  const [newLeaveType, setNewLeaveType] = useState("HOLIDAY");
  const [lunchSettings, setLunchSettings] = useState<{
    defaultStartTime: string;
    defaultDurationMinutes: number;
    autoStart: boolean;
    autoEnd: boolean;
  } | null>(null);
  const [weekendSettings, setWeekendSettings] = useState<{
    saturdayIsOffDay: boolean;
    sundayIsOffDay: boolean;
  } | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<{
    clockInLocation: string | null;
    clockOutLocation: string | null;
    hasMultipleLocations: boolean;
  } | null>(null);

  const axiosInstance = createAxiosInstance();
  const user = useAppselector((state) => state.auth.value);
  const userInfo = useAppselector((state) => state.user.user);

  useEffect(() => {
    checkAdminRole();
    fetchCurrentStatus();
    fetchMonthlyAttendance();
    fetchLeaveDays();
    fetchLunchSettings();
    fetchWeekendSettings();
    // Initial fetch for today's attendance (selectedDayView is initialized to today)
    fetchDayAttendance(selectedDayView);

    // Set up periodic status refresh (every 30 seconds) to catch midnight reset
    const statusInterval = setInterval(() => {
      fetchCurrentStatus();
    }, 30000);

    // Set up auto-lunch processing (every 30 seconds)
    const autoLunchInterval = setInterval(async () => {
      try {
        await axiosInstance.post("/attendance/auto-lunch/process");
        // Refresh status after processing
        fetchCurrentStatus();
      } catch (error) {
        // Silently fail - auto-lunch is optional
      }
    }, 30000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(autoLunchInterval);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 1) {
      fetchLeaveDays();
    }
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    fetchMonthlyAttendance();
    fetchLeaveDays();
  }, [selectedMonth]);

  useEffect(() => {
    fetchDayAttendance(selectedDayView);
  }, [selectedDayView.getTime()]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchTeamAttendance();
    }
  }, [activeTab, selectedDate]);

  useEffect(() => {
    if (!isAdmin && activeTab === 2) {
      setActiveTab(1);
    }
  }, [isAdmin, activeTab]);

  const fetchCurrentStatus = async () => {
    try {
      // Process auto-lunch first (silently, don't show errors)
      try {
        await axiosInstance.post("/attendance/auto-lunch/process");
      } catch (error) {
        // Silently fail - auto-lunch is optional
      }

      // Don't set loading for status check to avoid UI flicker
      const response = await axiosInstance.get("/attendance/status");
      console.log("Current status response:", response.data);
      if (response.data && response.data.data) {
        setCurrentStatus(response.data.data);
        console.log("Status updated to:", response.data.data);
      } else {
        console.warn("Unexpected status response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching current status:", error);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const response = await axiosInstance.get(
        `/attendance/monthly-attendance?year=${year}&month=${month}`,
      );
      setMonthlyRecords(response.data.data);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
    }
  };

  const checkAdminRole = () => {
    const userRole = userInfo?.role?.name;
    setIsAdmin(userRole === "Administrator");
  };

  const fetchTeamAttendance = async () => {
    try {
      const response = await axiosInstance.get(
        `/attendance/team-attendance?date=${format(selectedDate, "yyyy-MM-dd")}`,
      );
      setTeamAttendance(response.data.data);
    } catch (error) {
      console.error("Error fetching team attendance:", error);
    }
  };

  const fetchDayAttendance = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await axiosInstance.get(
        `/attendance/day-attendance?date=${dateStr}`,
      );
      if (response.data && response.data.data) {
        setDayAttendance(
          Array.isArray(response.data.data) ? response.data.data : [],
        );
      } else {
        setDayAttendance([]);
      }
    } catch (error: any) {
      console.error("Error fetching day attendance:", error);
      setDayAttendance([]);
    }
  };

  const fetchLeaveDays = async () => {
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const response = await axiosInstance.get(
        `/attendance/leave-days?year=${year}&month=${month}`,
      );
      setLeaveDays(response.data.data || []);
    } catch (error) {
      console.error("Error fetching leave days:", error);
      setLeaveDays([]);
    }
  };

  const fetchLunchSettings = async () => {
    if (!isAdmin) return;
    try {
      const response = await axiosInstance.get("/attendance/lunch-settings");
      const settings = response.data.data || {
        defaultStartTime: "12:00",
        defaultDurationMinutes: 60,
        autoStart: false,
        autoEnd: false,
      };
      setLunchSettings(settings);
    } catch (error) {
      console.error("Error fetching lunch settings:", error);
      // Set defaults if fetch fails
      setLunchSettings({
        defaultStartTime: "12:00",
        defaultDurationMinutes: 60,
        autoStart: false,
        autoEnd: false,
      });
    }
  };

  const fetchWeekendSettings = async () => {
    if (!isAdmin) return;
    try {
      const response = await axiosInstance.get("/attendance/weekend-settings");
      const settings = response.data.data || {
        saturdayIsOffDay: true,
        sundayIsOffDay: true,
      };
      setWeekendSettings(settings);
    } catch (error) {
      console.error("Error fetching weekend settings:", error);
      // Set defaults if fetch fails
      setWeekendSettings({
        saturdayIsOffDay: true,
        sundayIsOffDay: true,
      });
    }
  };

  const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  };

  const getLocationString = async (): Promise<string | undefined> => {
    try {
      setLocationLoading(true);
      const coords = await getCurrentLocation();
      const locationString = `${coords.latitude},${coords.longitude}`;
      return locationString;
    } catch (error: any) {
      console.warn("Location access denied or unavailable:", error);
      // Return undefined if location is denied - backend will handle null
      return undefined;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleClockAction = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      let data: any = {};

      // Only get location for clock-in and clock-out
      let locationString: string | undefined = undefined;
      if (dialogType === "clockIn" || dialogType === "clockOut") {
        locationString = await getLocationString();
        if (locationString) {
          data.location = locationString;
        }
      }

      switch (dialogType) {
        case "clockIn":
          endpoint = "/attendance/clock-in";
          break;
        case "clockOut":
          endpoint = "/attendance/clock-out";
          break;
        case "break":
          endpoint = "/attendance/start-break";
          data = { type: "BREAK" };
          break;
        case "lunch":
          endpoint = "/attendance/start-break";
          data = { type: "LUNCH" };
          break;
        case "endBreak":
          endpoint = "/attendance/end-break";
          data = { type: "BREAK" };
          break;
        case "endLunch":
          endpoint = "/attendance/end-break";
          data = { type: "LUNCH" };
          break;
      }

      const response = await axiosInstance.post(endpoint, data);
      console.log("Clock action response:", response.data);
      toast.success("Action completed successfully");
      setDialogOpen(false);

      // Refresh status immediately, then again after a short delay to ensure consistency
      await fetchCurrentStatus();
      await fetchMonthlyAttendance();
      await fetchDayAttendance(selectedDayView);

      // Refresh again after a short delay to handle any backend processing time
      setTimeout(async () => {
        await fetchCurrentStatus();
        await fetchMonthlyAttendance();
        await fetchDayAttendance(selectedDayView);
      }, 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error performing action");
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  const openDialog = (type: typeof dialogType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CLOCKED_IN":
        return "success";
      case "CLOCKED_OUT":
        return "default";
      case "BREAK":
        return "warning";
      case "LUNCH":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CLOCKED_IN":
        return <PlayArrow />;
      case "CLOCKED_OUT":
        return <Stop />;
      case "BREAK":
        return <Pause />;
      case "LUNCH":
        return <Pause />;
      default:
        return <AccessTime />;
    }
  };

  const getActionButton = () => {
    if (!currentStatus) return null;

    switch (currentStatus.status) {
      case "NOT_CLOCKED_IN":
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
            onClick={() => openDialog("clockIn")}
            size="large"
            fullWidth
          >
            Clock In
          </Button>
        );
      case "CLOCKED_IN":
        return (
          <Stack spacing={1} width="100%">
            <Button
              variant="contained"
              color="warning"
              startIcon={<Pause />}
              onClick={() => openDialog("break")}
              fullWidth
            >
              Start Break
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<Pause />}
              onClick={() => openDialog("lunch")}
              fullWidth
            >
              Start Lunch
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={() => openDialog("clockOut")}
              fullWidth
            >
              Clock Out
            </Button>
          </Stack>
        );
      case "BREAK":
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayCircleOutline />}
            onClick={() => openDialog("endBreak")}
            fullWidth
          >
            End Break
          </Button>
        );
      case "LUNCH":
        return (
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayCircleOutline />}
            onClick={() => openDialog("endLunch")}
            fullWidth
          >
            End Lunch
          </Button>
        );
      default:
        return null;
    }
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getAttendanceForDate = (date: Date) => {
    const recordsForDay = monthlyRecords.filter((record) =>
      isSameDay(parseISO(record.attendance_date), date),
    );

    if (recordsForDay.length === 0) {
      return undefined;
    }

    return recordsForDay.reduce((latest, current) => {
      if (!latest) return current;

      const latestTime = latest.clock_in_time
        ? parseISO(latest.clock_in_time).getTime()
        : 0;
      const currentTime = current.clock_in_time
        ? parseISO(current.clock_in_time).getTime()
        : 0;

      return currentTime > latestTime ? current : latest;
    }, recordsForDay[0]);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const pulse = keyframes`
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  `;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: sidebarOpen ? "calc(100% - 320px)" : "100%",
          transition: "width 0.3s",
        }}
      >
        {/* Header with Title and Quick Actions */}
        <Box
          sx={{
            display: "flex",
            // justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            width: "100%",
            gap: 4,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            justifyContent="space-between"
            width="100%"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h4" fontWeight="bold">
                Attendance Management
              </Typography>
            </Box>

            {/* Quick Action Buttons in Header */}
            <Box display="flex" gap={1} flexWrap="wrap">
              {/* Clock In - Show if not clocked in OR if clocked out (allow multiple sessions) */}
              {(currentStatus?.status === "NOT_CLOCKED_IN" ||
                currentStatus?.status === "CLOCKED_OUT") && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "var(--primary-color-1)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "var(--primary-color-1-hover)",
                    },
                  }}
                  startIcon={<PlayArrow />}
                  onClick={() => openDialog("clockIn")}
                  size="medium"
                >
                  Clock In
                </Button>
              )}

              {/* Clock Out - Show if clocked in, on break, or on lunch */}
              {(currentStatus?.status === "CLOCKED_IN" ||
                currentStatus?.status === "BREAK" ||
                currentStatus?.status === "LUNCH") && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "var(--primary-color-2)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#e07b00",
                    },
                  }}
                  startIcon={<Stop />}
                  onClick={() => openDialog("clockOut")}
                  size="medium"
                >
                  Clock Out
                </Button>
              )}

              {/* Start Break - Only show if clocked in */}
              {currentStatus?.status === "CLOCKED_IN" && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#f59e0b",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#d97706",
                    },
                  }}
                  startIcon={<Pause />}
                  onClick={() => openDialog("break")}
                  size="medium"
                >
                  Start Break
                </Button>
              )}

              {/* Start Lunch - Only show if clocked in */}
              {currentStatus?.status === "CLOCKED_IN" && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#2563eb",
                    },
                  }}
                  startIcon={<Pause />}
                  onClick={() => openDialog("lunch")}
                  size="medium"
                >
                  Start Lunch
                </Button>
              )}

              {/* End Break - Only show if on break */}
              {currentStatus?.status === "BREAK" && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#00c292",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#00a67e",
                    },
                  }}
                  startIcon={<PlayCircleOutline />}
                  onClick={() => openDialog("endBreak")}
                  size="medium"
                >
                  End Break
                </Button>
              )}

              {/* End Lunch - Only show if on lunch */}
              {currentStatus?.status === "LUNCH" && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#00c292",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#00a67e",
                    },
                  }}
                  startIcon={<PlayCircleOutline />}
                  onClick={() => openDialog("endLunch")}
                  size="medium"
                >
                  End Lunch
                </Button>
              )}

              {/* Admin Settings Button */}
              {/* {isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => setSettingsOpen(true)}
                  size="medium"
                >
                  Settings
                </Button>
              )} */}
            </Box>
          </Box>
          <Box display="flex" alignItems="center">
            {!sidebarOpen && (
              <IconButton onClick={() => setSidebarOpen(true)} size="small">
                <ChevronLeft />
              </IconButton>
            )}
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            mb: 3,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              minHeight: 48,
              px: 3,
              color: "rgba(0, 0, 0, 0.6)",
              transition: "all 0.3s ease",
              "&:hover": {
                color: "var(--primary-color-1)",
                backgroundColor: "rgba(7, 152, 189, 0.04)",
                borderRadius: "8px 8px 0 0",
              },
            },
            "& .Mui-selected": {
              color: "var(--primary-color-1) !important",
              fontWeight: 700,
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--primary-color-1)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Team Status" />
          <Tab label="Calendar View" />
          {isAdmin && <Tab label="Settings" />}
        </Tabs>

        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  Team Status - {format(selectedDate, "MMM dd, yyyy")}
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Select Date"
                      value={selectedDate}
                      onChange={(newValue) => {
                        if (newValue) {
                          setSelectedDate(newValue);
                        }
                      }}
                    />
                  </LocalizationProvider>
                  <IconButton onClick={fetchTeamAttendance}>
                    <Refresh />
                  </IconButton>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {teamAttendance.length === 0 ? (
                  <Box
                    sx={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      py: 4,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No team members found for this date
                    </Typography>
                  </Box>
                ) : (
                  teamAttendance.map((record) => {
                    // Handle placeholder records that don't have clock_in_time
                    const isIn =
                      record.status === "CLOCKED_IN" &&
                      record.clock_in_time !== null;
                    const isPlaceholder = record.id?.startsWith("placeholder-");
                    return (
                      <Card
                        key={record.id || `user-${record.user?.id}`}
                        sx={{
                          p: 2,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1.5,
                          border: `2px solid ${isIn ? "#4caf50" : "#9e9e9e"}`,
                          borderRadius: 2,
                          bgcolor: isIn ? "success.light" : "grey.50",
                          opacity: isPlaceholder ? 0.8 : 1,
                        }}
                      >
                        <Avatar
                          src={
                            record.user?.profile_image ||
                            "/images/profile/defaultprofile.jpg"
                          }
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: isIn ? "success.main" : "grey.400",
                          }}
                        >
                          {record.user?.first_name?.[0] || ""}
                          {record.user?.last_name?.[0] || ""}
                        </Avatar>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          textAlign="center"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {record.user?.first_name || ""}{" "}
                          {record.user?.last_name || ""}
                        </Typography>
                        <Chip
                          icon={
                            isPlaceholder ? (
                              <Stop />
                            ) : (
                              getStatusIcon(record.status)
                            )
                          }
                          label={isIn ? "IN" : "OUT"}
                          color={isIn ? "success" : "default"}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            minWidth: 60,
                            height: 28,
                          }}
                        />
                      </Card>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Box sx={{ maxWidth: "1400px", mx: "auto" }}>
            {/* Calendar Header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={4}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton
                  onClick={handlePrevMonth}
                  sx={{
                    color: "text.primary",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  {format(selectedMonth, "MMMM yyyy")}
                </Typography>
                <IconButton
                  onClick={handleNextMonth}
                  sx={{
                    color: "text.primary",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
              <IconButton
                onClick={fetchMonthlyAttendance}
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Refresh />
              </IconButton>
            </Box>

            {/* Calendar Container */}
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Week Day Headers */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                {weekDays.map((day) => (
                  <Box
                    key={day}
                    sx={{
                      px: 1,
                      py: 1.5,
                      textAlign: "left",
                      borderRight: "1px solid",
                      borderColor: "divider",
                      "&:last-child": {
                        borderRight: "none",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontSize="0.875rem"
                      color="text.primary"
                    >
                      {day.toUpperCase()}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Calendar Days Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                }}
              >
                {getCalendarDays().map((day) => {
                  const attendance = getAttendanceForDate(day);
                  const isCurrentMonth = isSameMonth(day, selectedMonth);
                  const isCurrentDay = isToday(day);
                  const dayOfWeek = getDay(day); // 0 = Sunday, 6 = Saturday

                  // Check if this day is configured as an off day based on weekend settings
                  const isSaturday = dayOfWeek === 6;
                  const isSunday = dayOfWeek === 0;
                  const isSaturdayOffDay =
                    weekendSettings?.saturdayIsOffDay ?? true;
                  const isSundayOffDay =
                    weekendSettings?.sundayIsOffDay ?? true;
                  const isOffDay =
                    (isSaturday && isSaturdayOffDay) ||
                    (isSunday && isSundayOffDay);

                  const isLeaveDay = leaveDays.some((leave) =>
                    isSameDay(parseISO(leave.leave_date), day),
                  );
                  const leaveDay = leaveDays.find((leave) =>
                    isSameDay(parseISO(leave.leave_date), day),
                  );

                  // Get status color for the card bar
                  const getStatusBarColor = (status: string) => {
                    return status === "CLOCKED_IN" ? "#4caf50" : "#9e9e9e";
                  };

                  return (
                    <Box
                      key={day.toISOString()}
                      sx={{
                        aspectRatio: "1",
                        borderRight: "1px solid",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        p: 1,
                        bgcolor: !isCurrentMonth
                          ? "grey.50"
                          : isLeaveDay
                            ? "error.light"
                            : isOffDay
                              ? "grey.100"
                              : "background.paper",
                        position: "relative",
                        cursor: isCurrentMonth ? "pointer" : "default",
                        display: "flex",
                        flexDirection: "column",
                        opacity: isOffDay && !isLeaveDay ? 0.6 : 1,
                        "&:hover": {
                          bgcolor: isCurrentMonth ? "action.hover" : undefined,
                        },
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => {
                        if (isCurrentMonth) {
                          setSelectedDayView(day);
                          setSelectedDate(day);
                          // Trigger immediate fetch
                          fetchDayAttendance(day);
                        }
                      }}
                    >
                      {/* Date Number - Top Left */}
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={0.5}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: "0.75rem",
                            color: !isCurrentMonth
                              ? "text.disabled"
                              : isCurrentDay
                                ? "primary.main"
                                : isLeaveDay
                                  ? "error.main"
                                  : isOffDay
                                    ? "text.disabled"
                                    : "text.secondary",
                            fontWeight: isCurrentDay
                              ? 700
                              : isOffDay
                                ? 400
                                : 400,
                          }}
                        >
                          {format(day, "d")}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.3}>
                          {/* Break Indicator */}
                          {attendance &&
                            attendance.break_start_time &&
                            isCurrentMonth && (
                              <Coffee
                                sx={{
                                  fontSize: "0.7rem",
                                  color: "#f59e0b",
                                }}
                                titleAccess="Break taken"
                              />
                            )}
                          {/* Lunch Indicator */}
                          {attendance &&
                            attendance.lunch_start_time &&
                            isCurrentMonth && (
                              <Restaurant
                                sx={{
                                  fontSize: "0.7rem",
                                  color: "#3b82f6",
                                }}
                                titleAccess="Lunch taken"
                              />
                            )}
                          {/* Leave Day Indicator */}
                          {isLeaveDay && (
                            <EventBusy
                              sx={{ fontSize: "0.75rem", color: "error.main" }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Leave Day Indicator */}
                      {isLeaveDay && isCurrentMonth && !attendance && (
                        <Box
                          sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <EventBusy
                            sx={{ color: "error.main", fontSize: "1.2rem" }}
                          />
                          <Typography
                            variant="caption"
                            color="error.main"
                            fontWeight={600}
                            sx={{ fontSize: "0.65rem" }}
                          >
                            {leaveDay?.reason || "Leave"}
                          </Typography>
                        </Box>
                      )}

                      {/* Attendance Card */}
                      {attendance && isCurrentMonth && isCurrentDay && (
                        <Box
                          sx={{
                            flex: 1,
                            bgcolor: "background.paper",
                            borderRadius: 1.5,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          {/* Colored Status Bar */}
                          <Box
                            sx={{
                              height: 3,
                              bgcolor: getStatusBarColor(attendance.status),
                            }}
                          />

                          {/* Card Content */}
                          <Box
                            sx={{
                              p: 1,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <Box>
                              {(() => {
                                const clockInDate = parseISO(
                                  attendance.clock_in_time,
                                );
                                const clockOutDate = attendance.clock_out_time
                                  ? parseISO(attendance.clock_out_time)
                                  : null;
                                const latestEvent =
                                  attendance.status === "CLOCKED_IN"
                                    ? clockInDate
                                    : clockOutDate || clockInDate;

                                return (
                                  <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color="text.primary"
                                    sx={{
                                      fontSize: "0.688rem",
                                      display: "block",
                                      mb: 0.25,
                                    }}
                                  >
                                    {format(latestEvent, "hh:mm a")}
                                  </Typography>
                                );
                              })()}
                            </Box>

                            {/* Status Chip - Only show for current day */}
                            {isCurrentDay && (
                              <Chip
                                icon={
                                  attendance.status === "CLOCKED_IN" ? (
                                    <PlayArrow fontSize="inherit" />
                                  ) : (
                                    <Stop fontSize="inherit" />
                                  )
                                }
                                label={
                                  attendance.status === "CLOCKED_IN"
                                    ? "IN"
                                    : "OUT"
                                }
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.625rem",
                                  fontWeight: 600,
                                  mt: 0.5,
                                  bgcolor:
                                    attendance.status === "CLOCKED_IN"
                                      ? "success.light"
                                      : "grey.200",
                                  color:
                                    attendance.status === "CLOCKED_IN"
                                      ? "success.dark"
                                      : "text.secondary",
                                  "& .MuiChip-icon": {
                                    fontSize: "0.7rem",
                                    color:
                                      attendance.status === "CLOCKED_IN"
                                        ? "success.dark"
                                        : "text.secondary",
                                  },
                                  "& .MuiChip-label": {
                                    px: 0.5,
                                  },
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 2 && isAdmin && (
          <Card>
            <CardContent>
              {/* Admin-only: Off Day Management */}
              {isAdmin && (
                <>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Calendar Settings
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--primary-color-1)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "var(--primary-color-1-hover)",
                        },
                      }}
                      startIcon={<Add />}
                      onClick={() => {
                        setNewLeaveDate(new Date());
                        setNewLeaveReason("");
                        setNewLeaveType("HOLIDAY");
                        setLeaveDialogOpen(true);
                      }}
                    >
                      Add Off Day
                    </Button>
                  </Box>

                  <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>
                      Off Day Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Manage holidays and off days that will be displayed on the
                      calendar.
                    </Typography>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaveDays.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No off days configured
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            leaveDays.map((leave) => (
                              <TableRow key={leave.id}>
                                <TableCell>
                                  {format(
                                    parseISO(leave.leave_date),
                                    "MMM dd, yyyy",
                                  )}
                                </TableCell>
                                <TableCell>{leave.reason || "-"}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={leave.leave_type}
                                    size="small"
                                    color="error"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      leave.is_active ? "Active" : "Inactive"
                                    }
                                    size="small"
                                    color={
                                      leave.is_active ? "success" : "default"
                                    }
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        await axiosInstance.patch(
                                          `/attendance/leave-days/${leave.id}`,
                                          { is_active: !leave.is_active },
                                        );
                                        toast.success("Leave day updated");
                                        fetchLeaveDays();
                                      } catch (error: any) {
                                        toast.error(
                                          error.response?.data?.message ||
                                            "Error updating leave day",
                                        );
                                      }
                                    }}
                                  >
                                    <Refresh />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={async () => {
                                      if (
                                        confirm(
                                          "Are you sure you want to delete this leave day?",
                                        )
                                      ) {
                                        try {
                                          await axiosInstance.delete(
                                            `/attendance/leave-days/${leave.id}`,
                                          );
                                          toast.success("Leave day deleted");
                                          fetchLeaveDays();
                                        } catch (error: any) {
                                          toast.error(
                                            error.response?.data?.message ||
                                              "Error deleting leave day",
                                          );
                                        }
                                      }
                                    }}
                                  >
                                    <Stop />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </>
              )}

              {/* Admin-only: Company-Wide Lunch Settings */}
              {isAdmin && (
                <Box mb={3}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Restaurant
                      sx={{
                        color: "var(--primary-color-1)",
                        fontSize: "1.5rem",
                      }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Company-Wide Lunch Settings
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Configure the generic lunch time that applies to all
                    employees. This is the company-wide lunch schedule.
                  </Typography>

                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      bgcolor: "rgba(7, 152, 189, 0.02)",
                      borderColor: "rgba(7, 152, 189, 0.2)",
                      borderRadius: 2,
                    }}
                  >
                    <Stack spacing={3}>
                      <Alert
                        severity="info"
                        sx={{
                          bgcolor: "rgba(7, 152, 189, 0.08)",
                          border: "1px solid rgba(7, 152, 189, 0.2)",
                          "& .MuiAlert-icon": {
                            color: "var(--primary-color-1)",
                          },
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} mb={0.5}>
                          Company Default Lunch Time
                        </Typography>
                        <Typography variant="caption">
                          This lunch time will be applied to all employees. The
                          system will automatically start and end lunch based on
                          these settings if auto-start/end is enabled.
                        </Typography>
                      </Alert>

                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          mb={1}
                          sx={{ color: "var(--primary-color-1)" }}
                        >
                          Generic Lunch Start Time (All Employees)
                        </Typography>
                        <TextField
                          label="Company Lunch Start Time"
                          type="time"
                          value={lunchSettings?.defaultStartTime || "12:00"}
                          onChange={(e) =>
                            setLunchSettings({
                              defaultStartTime: e.target.value,
                              defaultDurationMinutes:
                                lunchSettings?.defaultDurationMinutes || 60,
                              autoStart: lunchSettings?.autoStart || false,
                              autoEnd: lunchSettings?.autoEnd || false,
                            })
                          }
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          helperText="This time applies to all employees by default"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              "&:hover fieldset": {
                                borderColor: "var(--primary-color-1)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "var(--primary-color-1)",
                              },
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          mb={1}
                          sx={{ color: "var(--primary-color-1)" }}
                        >
                          Generic Lunch Duration (All Employees)
                        </Typography>
                        <TextField
                          label="Company Lunch Duration (minutes)"
                          type="number"
                          value={lunchSettings?.defaultDurationMinutes || 60}
                          onChange={(e) =>
                            setLunchSettings({
                              defaultStartTime:
                                lunchSettings?.defaultStartTime || "12:00",
                              defaultDurationMinutes:
                                parseInt(e.target.value) || 60,
                              autoStart: lunchSettings?.autoStart || false,
                              autoEnd: lunchSettings?.autoEnd || false,
                            })
                          }
                          fullWidth
                          inputProps={{ min: 15, max: 180 }}
                          helperText="Duration in minutes (15-180 minutes)"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              "&:hover fieldset": {
                                borderColor: "var(--primary-color-1)",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "var(--primary-color-1)",
                              },
                            },
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          mb={1.5}
                          sx={{ color: "var(--primary-color-1)" }}
                        >
                          Automation Settings (Applies to All Employees)
                        </Typography>
                        <Stack spacing={1.5}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={lunchSettings?.autoStart || false}
                                onChange={(e) =>
                                  setLunchSettings({
                                    defaultStartTime:
                                      lunchSettings?.defaultStartTime ||
                                      "12:00",
                                    defaultDurationMinutes:
                                      lunchSettings?.defaultDurationMinutes ||
                                      60,
                                    autoStart: e.target.checked,
                                    autoEnd: lunchSettings?.autoEnd || false,
                                  })
                                }
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary-color-1)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    {
                                      backgroundColor: "var(--primary-color-1)",
                                    },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  Auto-start lunch at company default time
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Automatically start lunch for all employees at
                                  the configured time
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={lunchSettings?.autoEnd || false}
                                onChange={(e) =>
                                  setLunchSettings({
                                    defaultStartTime:
                                      lunchSettings?.defaultStartTime ||
                                      "12:00",
                                    defaultDurationMinutes:
                                      lunchSettings?.defaultDurationMinutes ||
                                      60,
                                    autoStart:
                                      lunchSettings?.autoStart || false,
                                    autoEnd: e.target.checked,
                                  })
                                }
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary-color-1)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    {
                                      backgroundColor: "var(--primary-color-1)",
                                    },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  Auto-end lunch after company duration
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Automatically end lunch for all employees
                                  after the configured duration
                                </Typography>
                              </Box>
                            }
                          />
                        </Stack>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={async () => {
                          if (!lunchSettings) {
                            toast.error("Please wait for settings to load");
                            return;
                          }
                          try {
                            await axiosInstance.post(
                              "/attendance/lunch-settings",
                              lunchSettings,
                            );
                            toast.success(
                              "Company-wide lunch settings saved successfully",
                            );
                            fetchLunchSettings();
                          } catch (error: any) {
                            toast.error(
                              error.response?.data?.message ||
                                "Error updating lunch settings",
                            );
                          }
                        }}
                        disabled={!lunchSettings}
                        sx={{
                          backgroundColor: "var(--primary-color-1)",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "var(--primary-color-1-hover)",
                          },
                          "&:disabled": {
                            backgroundColor: "rgba(0, 0, 0, 0.12)",
                            color: "rgba(0, 0, 0, 0.26)",
                          },
                          textTransform: "none",
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                        }}
                      >
                        Save Company-Wide Lunch Settings
                      </Button>
                    </Stack>
                  </Card>
                </Box>
              )}

              {/* Admin-only: Weekend Settings */}
              {isAdmin && (
                <Box mb={3}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarToday
                      sx={{
                        color: "var(--primary-color-1)",
                        fontSize: "1.5rem",
                      }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Weekend Configuration
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Configure whether weekends (Saturday and Sunday) are
                    considered off days for attendance and leave calculations.
                  </Typography>

                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      bgcolor: "rgba(7, 152, 189, 0.02)",
                      borderColor: "rgba(7, 152, 189, 0.2)",
                      borderRadius: 2,
                    }}
                  >
                    <Stack spacing={3}>
                      <Alert
                        severity="info"
                        sx={{
                          bgcolor: "rgba(7, 152, 189, 0.08)",
                          border: "1px solid rgba(7, 152, 189, 0.2)",
                          "& .MuiAlert-icon": {
                            color: "var(--primary-color-1)",
                          },
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} mb={0.5}>
                          Weekend Off Days Configuration
                        </Typography>
                        <Typography variant="caption">
                          When enabled, weekends will be excluded from leave day
                          calculations and marked as non-working days in the
                          calendar. This affects how leave days are calculated
                          for all employees.
                        </Typography>
                      </Alert>

                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          mb={1.5}
                          sx={{ color: "var(--primary-color-1)" }}
                        >
                          Weekend Off Days (Applies to All Employees)
                        </Typography>
                        <Stack spacing={1.5}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={
                                  weekendSettings?.saturdayIsOffDay ?? true
                                }
                                onChange={(e) =>
                                  setWeekendSettings({
                                    saturdayIsOffDay: e.target.checked,
                                    sundayIsOffDay:
                                      weekendSettings?.sundayIsOffDay ?? true,
                                  })
                                }
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary-color-1)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    {
                                      backgroundColor: "var(--primary-color-1)",
                                    },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  Saturday is an off day
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {weekendSettings?.saturdayIsOffDay
                                    ? "Saturday will be excluded from leave calculations"
                                    : "Saturday will be counted as a working day"}
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={
                                  weekendSettings?.sundayIsOffDay ?? true
                                }
                                onChange={(e) =>
                                  setWeekendSettings({
                                    saturdayIsOffDay:
                                      weekendSettings?.saturdayIsOffDay ?? true,
                                    sundayIsOffDay: e.target.checked,
                                  })
                                }
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: "var(--primary-color-1)",
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    {
                                      backgroundColor: "var(--primary-color-1)",
                                    },
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  Sunday is an off day
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {weekendSettings?.sundayIsOffDay
                                    ? "Sunday will be excluded from leave calculations"
                                    : "Sunday will be counted as a working day"}
                                </Typography>
                              </Box>
                            }
                          />
                        </Stack>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={async () => {
                          if (!weekendSettings) {
                            toast.error("Please wait for settings to load");
                            return;
                          }
                          try {
                            await axiosInstance.post(
                              "/attendance/weekend-settings",
                              weekendSettings,
                            );
                            toast.success(
                              "Weekend settings saved successfully",
                            );
                            await fetchWeekendSettings();
                            // Refresh calendar to reflect changes
                            if (activeTab === 1) {
                              fetchLeaveDays();
                            }
                          } catch (error: any) {
                            toast.error(
                              error.response?.data?.message ||
                                "Error updating weekend settings",
                            );
                          }
                        }}
                        disabled={!weekendSettings}
                        sx={{
                          backgroundColor: "var(--primary-color-1)",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "var(--primary-color-1-hover)",
                          },
                          "&:disabled": {
                            backgroundColor: "rgba(0, 0, 0, 0.12)",
                            color: "rgba(0, 0, 0, 0.26)",
                          },
                          textTransform: "none",
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                        }}
                      >
                        Save Weekend Settings
                      </Button>
                    </Stack>
                  </Card>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Location Dialog */}
        <Dialog
          open={locationDialogOpen}
          onClose={() => setLocationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn sx={{ color: "var(--primary-color-1)" }} />
              <Typography variant="h6">Tracked Location</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedLocation && selectedLocations && (
              <Box sx={{ mt: 2 }}>
                {selectedLocations.hasMultipleLocations ? (
                  <>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Tracked locations from clock in and clock out:
                    </Typography>
                    <Stack spacing={1.5} mb={2}>
                      {selectedLocations.clockInLocation && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: "rgba(52, 211, 153, 0.08)",
                            border: "1px solid rgba(52, 211, 153, 0.2)",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            mb={0.5}
                          >
                            Clock In Location:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              color: "#10b981",
                              fontWeight: 600,
                            }}
                          >
                            {selectedLocations.clockInLocation}
                          </Typography>
                        </Box>
                      )}
                      {selectedLocations.clockOutLocation && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: "rgba(248, 113, 113, 0.08)",
                            border: "1px solid rgba(248, 113, 113, 0.2)",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            mb={0.5}
                          >
                            Clock Out Location:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              color: "#ef4444",
                              fontWeight: 600,
                            }}
                          >
                            {selectedLocations.clockOutLocation}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                    <Box
                      sx={{
                        width: "100%",
                        height: "400px",
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/dir/${selectedLocations.clockInLocation}/${selectedLocations.clockOutLocation}/@${selectedLocations.clockInLocation},13z/data=!4m2!4m1!3e0?output=embed`}
                      />
                    </Box>
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<LocationOn />}
                        onClick={() => {
                          const googleMapsUrl = `https://www.google.com/maps/dir/${selectedLocations.clockInLocation}/${selectedLocations.clockOutLocation}`;
                          window.open(googleMapsUrl, "_blank");
                        }}
                        sx={{
                          borderColor: "var(--primary-color-1)",
                          color: "var(--primary-color-1)",
                          "&:hover": {
                            borderColor: "var(--primary-color-2)",
                            backgroundColor: "rgba(7, 152, 189, 0.08)",
                          },
                          textTransform: "none",
                        }}
                      >
                        View Route in Google Maps
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Tracked location from clock in/out:
                    </Typography>
                    {selectedLocation.includes(",") ? (
                      <>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: "rgba(7, 152, 189, 0.04)",
                            border: "1px solid rgba(7, 152, 189, 0.1)",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              color: "var(--primary-color-1)",
                              fontWeight: 600,
                            }}
                          >
                            {selectedLocation}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: "100%",
                            height: "400px",
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid rgba(0, 0, 0, 0.12)",
                          }}
                        >
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps?q=${selectedLocation}&output=embed&z=15&layer=c`}
                          />
                        </Box>
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<LocationOn />}
                            onClick={() => {
                              const [lat, lng] = selectedLocation.split(",");
                              const googleMapsUrl = `https://www.google.com/maps/@${lat},${lng},15z?layer=c`;
                              window.open(googleMapsUrl, "_blank");
                            }}
                            sx={{
                              borderColor: "var(--primary-color-1)",
                              color: "var(--primary-color-1)",
                              "&:hover": {
                                borderColor: "var(--primary-color-2)",
                                backgroundColor: "rgba(7, 152, 189, 0.08)",
                              },
                              textTransform: "none",
                            }}
                          >
                            Street View
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<LocationOn />}
                            onClick={() => {
                              const [lat, lng] = selectedLocation.split(",");
                              const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                              window.open(googleMapsUrl, "_blank");
                            }}
                            sx={{
                              borderColor: "var(--primary-color-1)",
                              color: "var(--primary-color-1)",
                              "&:hover": {
                                borderColor: "var(--primary-color-2)",
                                backgroundColor: "rgba(7, 152, 189, 0.08)",
                              },
                              textTransform: "none",
                            }}
                          >
                            Open in Google Maps
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: "rgba(7, 152, 189, 0.04)",
                          border: "1px solid rgba(7, 152, 189, 0.1)",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                            color: "var(--primary-color-1)",
                            fontWeight: 600,
                          }}
                        >
                          {selectedLocation}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setLocationDialogOpen(false)}
              sx={{
                color: "var(--primary-color-1)",
                textTransform: "none",
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leave Day Dialog */}
        <Dialog
          open={leaveDialogOpen}
          onClose={() => setLeaveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Off Day</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Leave Date"
                  value={newLeaveDate}
                  onChange={(newValue) => setNewLeaveDate(newValue)}
                  sx={{ width: "100%", mb: 2 }}
                />
              </LocalizationProvider>
              <TextField
                label="Reason (Optional)"
                value={newLeaveReason}
                onChange={(e) => setNewLeaveReason(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                placeholder="e.g., New Year Holiday"
              />
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={newLeaveType}
                  label="Leave Type"
                  onChange={(e) => setNewLeaveType(e.target.value)}
                >
                  <MenuItem value="HOLIDAY">Holiday</MenuItem>
                  <MenuItem value="COMPANY_HOLIDAY">Company Holiday</MenuItem>
                  <MenuItem value="PUBLIC_HOLIDAY">Public Holiday</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!newLeaveDate) {
                  toast.error("Please select a date");
                  return;
                }
                try {
                  await axiosInstance.post("/attendance/leave-days", {
                    leave_date: format(newLeaveDate, "yyyy-MM-dd"),
                    reason: newLeaveReason || undefined,
                    leave_type: newLeaveType,
                  });
                  toast.success("Leave day added successfully");
                  setLeaveDialogOpen(false);
                  fetchLeaveDays();
                } catch (error: any) {
                  toast.error(
                    error.response?.data?.message || "Error adding leave day",
                  );
                }
              }}
              variant="contained"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogType === "clockIn" && "Clock In"}
            {dialogType === "clockOut" && "Clock Out"}
            {dialogType === "break" && "Start Break"}
            {dialogType === "lunch" && "Start Lunch"}
            {dialogType === "endBreak" && "End Break"}
            {dialogType === "endLunch" && "End Lunch"}
          </DialogTitle>
          <DialogContent>
            {(dialogType === "clockIn" || dialogType === "clockOut") && (
              <Box sx={{ mt: 2 }}>
                {locationLoading ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Getting your location...
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info" icon={<LocationOn />}>
                    Your location will be automatically captured. You can
                    proceed to confirm.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleClockAction}
              variant="contained"
              disabled={loading || locationLoading}
            >
              {loading || locationLoading ? (
                <CircularProgress size={20} />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      <Drawer
        variant="persistent"
        anchor="right"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? 320 : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 320,
            boxSizing: "border-box",
            position: "relative",
            height: "100%",
          },
        }}
      >
        <Paper
          sx={{
            p: 3,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6" fontWeight="bold">
              {isSameDay(selectedDayView, new Date())
                ? "Today's Attendance"
                : format(selectedDayView, "EEEE, MMM dd")}
            </Typography>
            <Box display="flex" gap={1}>
              <IconButton
                size="small"
                onClick={() => {
                  const today = new Date();
                  setSelectedDayView(today);
                  fetchDayAttendance(today);
                }}
                sx={{ color: "text.secondary" }}
                title="Show Today"
              >
                <Refresh />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setSidebarOpen(false)}
                sx={{ mr: -1 }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>

          {/* Current Status Summary */}
          {currentStatus && (
            <Card
              sx={{
                mb: 2,
                bgcolor:
                  currentStatus.status === "CLOCKED_IN"
                    ? "success.light"
                    : currentStatus.status === "BREAK"
                      ? "warning.light"
                      : currentStatus.status === "LUNCH"
                        ? "info.light"
                        : "grey.200",
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Chip
                    icon={getStatusIcon(currentStatus.status)}
                    label={currentStatus.status.replace("_", " ")}
                    color={getStatusColor(currentStatus.status) as any}
                    size="small"
                  />
                </Box>
                {currentStatus.attendance && (
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Clock In:{" "}
                      {format(
                        parseISO(currentStatus.attendance.clock_in_time),
                        "hh:mm a",
                      )}
                      {currentStatus.attendance.clock_out_time &&
                        ` - Clock Out: ${format(
                          parseISO(currentStatus.attendance.clock_out_time),
                          "hh:mm a",
                        )}`}
                    </Typography>
                    {currentStatus.attendance.break_start_time && (
                      <Typography variant="caption" color="text.secondary">
                        Break:{" "}
                        {format(
                          parseISO(currentStatus.attendance.break_start_time),
                          "hh:mm a",
                        )}
                        {currentStatus.attendance.break_end_time
                          ? ` - ${format(
                              parseISO(currentStatus.attendance.break_end_time),
                              "hh:mm a",
                            )}`
                          : " (In Progress)"}
                      </Typography>
                    )}
                    {currentStatus.attendance.lunch_start_time && (
                      <Typography variant="caption" color="text.secondary">
                        Lunch:{" "}
                        {format(
                          parseISO(currentStatus.attendance.lunch_start_time),
                          "hh:mm a",
                        )}
                        {currentStatus.attendance.lunch_end_time
                          ? ` - ${format(
                              parseISO(currentStatus.attendance.lunch_end_time),
                              "hh:mm a",
                            )}`
                          : " (In Progress)"}
                      </Typography>
                    )}
                    {currentStatus.attendance.total_hours != null &&
                      currentStatus.attendance.clock_out_time && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Total Hours:{" "}
                          {Number(currentStatus.attendance.total_hours).toFixed(
                            2,
                          )}
                          h
                        </Typography>
                      )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {/* All Clock Events for the Day */}
          <Box mb={2}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              sx={{ mb: 1 }}
            >
              Clock Events
            </Typography>
            {dayAttendance.length > 0 ? (
              <Box
                sx={{
                  maxHeight: 320,
                  overflow: "auto",
                  pr: 0.5,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {(() => {
                  let previousDateLabel = "";
                  return dayAttendance.map((record, index) => {
                    const clockInDate = parseISO(record.clock_in_time);
                    const clockOutDate = record.clock_out_time
                      ? parseISO(record.clock_out_time)
                      : null;
                    const sessionHoursRaw =
                      record.total_hours !== undefined &&
                      record.total_hours !== null
                        ? Number(record.total_hours)
                        : clockOutDate
                          ? Math.max(
                              (clockOutDate.getTime() - clockInDate.getTime()) /
                                (1000 * 60 * 60),
                              0,
                            )
                          : null;
                    const sessionHours =
                      typeof sessionHoursRaw === "number" &&
                      !Number.isNaN(sessionHoursRaw)
                        ? sessionHoursRaw
                        : null;
                    const dateLabel = format(clockInDate, "EEE, MMM dd");
                    const isNewDate = dateLabel !== previousDateLabel;
                    const isFirstDate = previousDateLabel === "";
                    if (isNewDate) {
                      previousDateLabel = dateLabel;
                    }

                    // Get locations for this date from all records
                    const getLocationsForDate = (dateLabel: string) => {
                      const recordsForDate = dayAttendance.filter((r) => {
                        const rDate = format(
                          parseISO(r.clock_in_time),
                          "EEE, MMM dd",
                        );
                        return rDate === dateLabel;
                      });

                      let clockInLocation: string | null = null;
                      let clockOutLocation: string | null = null;
                      let clockInTime: Date | null = null;
                      let clockOutTime: Date | null = null;

                      recordsForDate.forEach((r) => {
                        if (r.location) {
                          const clockIn = parseISO(r.clock_in_time);
                          const clockOut = r.clock_out_time
                            ? parseISO(r.clock_out_time)
                            : null;

                          // Get clock in location (first one or most recent)
                          if (
                            !clockInLocation ||
                            (clockInTime && clockIn > clockInTime)
                          ) {
                            clockInLocation = r.location;
                            clockInTime = clockIn;
                          }

                          // Get clock out location (most recent)
                          if (clockOut) {
                            if (
                              !clockOutLocation ||
                              (clockOutTime && clockOut > clockOutTime)
                            ) {
                              clockOutLocation = r.location;
                              clockOutTime = clockOut;
                            }
                          }
                        }
                      });

                      return {
                        clockInLocation,
                        clockOutLocation,
                        hasMultipleLocations:
                          clockInLocation &&
                          clockOutLocation &&
                          clockInLocation !== clockOutLocation,
                      };
                    };

                    return (
                      <Box key={record.id}>
                        {isNewDate && (
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mt: isFirstDate ? 0 : 1 }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: "text.primary",
                              }}
                            >
                              {dateLabel}
                            </Typography>
                            {(() => {
                              const locations = getLocationsForDate(dateLabel);
                              const hasLocation =
                                locations.clockInLocation ||
                                locations.clockOutLocation;
                              return hasLocation ? (
                                <Tooltip title="View tracked location">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedLocations(locations);
                                      setSelectedLocation(
                                        locations.clockOutLocation ||
                                          locations.clockInLocation,
                                      );
                                      setLocationDialogOpen(true);
                                    }}
                                    sx={{
                                      p: 0.5,
                                      color: "var(--primary-color-1)",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(7, 152, 189, 0.08)",
                                      },
                                    }}
                                  >
                                    <LocationOn fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : null;
                            })()}
                          </Box>
                        )}

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            mt: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ArrowDownward
                              fontSize="small"
                              sx={{ color: "#34d399" }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.75rem" }}
                            ></Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "10px" }}
                            >
                              {format(clockInDate, "hh:mm a")}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ArrowUpward
                              fontSize="small"
                              sx={{
                                color: clockOutDate ? "#f87171" : "#facc15",
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.75rem" }}
                            ></Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: "10px",
                                color: clockOutDate
                                  ? "text.primary"
                                  : "#facc15",
                              }}
                            >
                              {clockOutDate
                                ? format(clockOutDate, "hh:mm a")
                                : "MISSING"}
                            </Typography>
                          </Box>
                        </Box>

                        {/* <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            color: "text.secondary",
                            fontSize: "0.75rem",
                            mt: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <AccessTime
                              fontSize="small"
                              sx={{ color: "#60a5fa" }}
                            />
                            <Typography variant="caption">Hours</Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontSize: "0.85rem" }}
                          >
                            {sessionHours !== null
                              ? `${sessionHours.toFixed(2)}h`
                              : "--"}
                          </Typography>
                        </Box> */}

                        {/* {index !== dayAttendance.length - 1 && (
                          <Divider sx={{ my: 1.25, borderColor: "divider" }} />
                        )} */}
                      </Box>
                    );
                  });
                })()}
              </Box>
            ) : (
              <Typography variant="caption" color="text.disabled">
                No attendance records for this day
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              mt: "auto",
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {format(selectedDayView, "EEEE, MMMM dd, yyyy")}
            </Typography>
            <Typography variant="h6" mt={1}>
              {format(new Date(), "hh:mm:ss a")}
            </Typography>
          </Box>
        </Paper>
      </Drawer>
    </Box>
  );
};

export default Attendance;
