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
    null
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

  const axiosInstance = createAxiosInstance();
  const user = useAppselector((state) => state.auth.value);
  const userInfo = useAppselector((state) => state.user.user);

  useEffect(() => {
    checkAdminRole();
    fetchCurrentStatus();
    fetchMonthlyAttendance();
    fetchLeaveDays();
    // Initial fetch for today's attendance (selectedDayView is initialized to today)
    fetchDayAttendance(selectedDayView);

    // Set up periodic status refresh (every 30 seconds) to catch midnight reset
    const statusInterval = setInterval(() => {
      fetchCurrentStatus();
    }, 30000);

    return () => clearInterval(statusInterval);
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

  const fetchCurrentStatus = async () => {
    try {
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
        `/attendance/monthly-attendance?year=${year}&month=${month}`
      );
      setMonthlyRecords(response.data.data);
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
    }
  };

  const checkAdminRole = () => {
    const userRole = userInfo?.role?.name;
    setIsAdmin(userRole === "Administrator" || userRole === "SuperAdmin");
  };

  const fetchTeamAttendance = async () => {
    try {
      const response = await axiosInstance.get(
        `/attendance/team-attendance?date=${format(selectedDate, "yyyy-MM-dd")}`
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
        `/attendance/day-attendance?date=${dateStr}`
      );
      if (response.data && response.data.data) {
        setDayAttendance(
          Array.isArray(response.data.data) ? response.data.data : []
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
        `/attendance/leave-days?year=${year}&month=${month}`
      );
      setLeaveDays(response.data.data || []);
    } catch (error) {
      console.error("Error fetching leave days:", error);
      setLeaveDays([]);
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
          timeout: 10000,
          maximumAge: 0,
        }
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
      isSameDay(parseISO(record.attendance_date), date)
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
          <Box display="flex" alignItems="center" gap={2} justifyContent="space-between" width="100%"> 
            <Box display="flex" alignItems="center" gap={2} >
              <Typography variant="h4" fontWeight="bold">
                Attendance Management
              </Typography>
            </Box>

            {/* Quick Action Buttons in Header */}
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={() => openDialog("clockIn")}
                size="medium"
                disabled={currentStatus?.status === "CLOCKED_IN"}
              >
                Clock In
              </Button>

              {/* Show Clock Out if there's an active clock-in */}
              {currentStatus?.status === "CLOCKED_IN" && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={() => openDialog("clockOut")}
                  size="medium"
                >
                  Clock Out
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
          sx={{ mb: 3 }}
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
                          src={record.user?.profile_image}
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
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isLeaveDay = leaveDays.some((leave) =>
                    isSameDay(parseISO(leave.leave_date), day)
                  );
                  const leaveDay = leaveDays.find((leave) =>
                    isSameDay(parseISO(leave.leave_date), day)
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
                          : isWeekend
                          ? "grey.100"
                          : "background.paper",
                        position: "relative",
                        cursor: isCurrentMonth ? "pointer" : "default",
                        display: "flex",
                        flexDirection: "column",
                        opacity: isWeekend && !isLeaveDay ? 0.6 : 1,
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
                              : "text.secondary",
                            fontWeight: isCurrentDay ? 700 : 400,
                          }}
                        >
                          {format(day, "d")}
                        </Typography>
                        {isLeaveDay && (
                          <EventBusy
                            sx={{ fontSize: "0.75rem", color: "error.main" }}
                          />
                        )}
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
                                  attendance.clock_in_time
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
                  startIcon={<Add />}
                  onClick={() => {
                    setNewLeaveDate(new Date());
                    setNewLeaveReason("");
                    setNewLeaveType("HOLIDAY");
                    setLeaveDialogOpen(true);
                  }}
                >
                  Add Leave Day
                </Button>
              </Box>

              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Leave Days Management
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Manage holidays and leave days that will be displayed on the
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
                            <Typography variant="body2" color="text.secondary">
                              No leave days configured
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaveDays.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell>
                              {format(
                                parseISO(leave.leave_date),
                                "MMM dd, yyyy"
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
                                label={leave.is_active ? "Active" : "Inactive"}
                                size="small"
                                color={leave.is_active ? "success" : "default"}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  try {
                                    await axiosInstance.patch(
                                      `/attendance/leave-days/${leave.id}`,
                                      { is_active: !leave.is_active }
                                    );
                                    toast.success("Leave day updated");
                                    fetchLeaveDays();
                                  } catch (error: any) {
                                    toast.error(
                                      error.response?.data?.message ||
                                        "Error updating leave day"
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
                                      "Are you sure you want to delete this leave day?"
                                    )
                                  ) {
                                    try {
                                      await axiosInstance.delete(
                                        `/attendance/leave-days/${leave.id}`
                                      );
                                      toast.success("Leave day deleted");
                                      fetchLeaveDays();
                                    } catch (error: any) {
                                      toast.error(
                                        error.response?.data?.message ||
                                          "Error deleting leave day"
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
            </CardContent>
          </Card>
        )}

        {/* Leave Day Dialog */}
        <Dialog
          open={leaveDialogOpen}
          onClose={() => setLeaveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Leave Day</DialogTitle>
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
                    error.response?.data?.message || "Error adding leave day"
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
                  <Typography variant="caption" color="text.secondary">
                    Last:{" "}
                    {format(
                      parseISO(currentStatus.attendance.clock_in_time),
                      "hh:mm a"
                    )}
                    {currentStatus.attendance.clock_out_time &&
                      ` - ${format(
                        parseISO(currentStatus.attendance.clock_out_time),
                        "hh:mm a"
                      )}`}
                  </Typography>
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
                            0
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

                    return (
                      <Box key={record.id}>
                        {isNewDate && (
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: "text.primary",
                              mt: isFirstDate ? 0 : 1,
                            }}
                          >
                            {dateLabel}
                          </Typography>
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
