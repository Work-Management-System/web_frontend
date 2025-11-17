"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  styled,
  Button,
  Avatar,
  IconButton,
  Pagination,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "row",
  gap: "16px",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

const SidebarCard = styled(Box)({
  backgroundColor: "var(--card-bg-color)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
});

const CardHeader = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
});

const CardTitle = styled(Typography)({
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--text-color)",
});

const ViewAllButton = styled(Button)({
  textTransform: "none",
  fontSize: "0.75rem",
  color: "var(--primary-color-1)",
  fontWeight: 500,
  padding: "4px 8px",
  minWidth: "auto",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
});

const ItemInfo = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
  gap: "4px",
});

const ItemName = styled(Typography)({
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--text-color)",
  textAlign: "center",
  lineHeight: 1.2,
});

const ItemRole = styled(Typography)({
  fontSize: "0.7rem",
  color: "rgba(0,0,0,0.6)",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
});

const PaginationContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  marginTop: "16px",
});

const UserListContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  maxHeight: "400px",
  overflowY: "auto",
  padding: "4px",
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#d1d1d1",
    borderRadius: "8px",
  },
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const UserListItem = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "16px 12px",
  borderRadius: "12px",
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  transition: "all 0.2s ease",
  cursor: "pointer",
  minHeight: "120px",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderColor: "var(--primary-color-1)",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
});

const LeaveAvatarsContainer = styled(Box)({
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  justifyContent: "flex-start",
});

const LeaveAvatarWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "scale(1.05)",
  },
});

const LeaveAvatarName = styled(Typography)({
  fontSize: "0.7rem",
  color: "var(--text-color)",
  textAlign: "center",
  maxWidth: "60px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image?: string;
}

interface LeaveRequest {
  id: string;
  user: User;
  start_date: string;
  end_date: string;
}

interface DashboardSidebarProps {
  onUserClick?: (id: string) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ onUserClick }) => {
  const router = useRouter();
  const axiosInstance = createAxiosInstance();
  const userPriority = useAppselector((state) => state.role.value.priority);
  const user = useAppselector((state) => state.user.user);

  const [notClockedInUsers, setNotClockedInUsers] = useState<User[]>([]);
  const [onLeaveUsers, setOnLeaveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 6; // 2 rows of 3 cards

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetchNotClockedInUsers();
    fetchOnLeaveUsers();
  }, []);

  const fetchNotClockedInUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/attendance/team-attendance?date=${today}`
      );
      const attendanceData = response.data?.data || [];

      // Filter users who haven't clocked in (status is CLOCKED_OUT or no attendance)
      const notClockedIn = attendanceData.filter(
        (attendance: any) =>
          !attendance.clock_in_time ||
          attendance.status === "CLOCKED_OUT" ||
          attendance.status === "OUT"
      );

      setNotClockedInUsers(
        notClockedIn.map((attendance: any) => ({
          id: attendance.user?.id || attendance.id,
          first_name: attendance.user?.first_name || "",
          last_name: attendance.user?.last_name || "",
          email: attendance.user?.email || "",
          profile_image: attendance.user?.profile_image,
        }))
      );
    } catch (error) {
      console.error("Error fetching not clocked in users:", error);
      setNotClockedInUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnLeaveUsers = async () => {
    try {
      const response = await axiosInstance.get(
        `/leave-management/requests?scope=${
          userPriority === 1 ? "all" : "team"
        }&from=${today}&to=${today}&status=approved`
      );
      const leaveRequests = response.data?.data || [];

      // Filter leave requests that include today
      const todayLeaves = leaveRequests.filter((leave: LeaveRequest) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const todayDate = new Date(today);
        return todayDate >= startDate && todayDate <= endDate;
      });

      setOnLeaveUsers(todayLeaves.map((leave: LeaveRequest) => leave.user));
    } catch (error) {
      console.error("Error fetching on leave users:", error);
      setOnLeaveUsers([]);
    }
  };

  const paginatedNotClockedIn = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return notClockedInUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [notClockedInUsers, page]);

  const totalPages = Math.ceil(notClockedInUsers.length / itemsPerPage);

  return (
    <SidebarContainer>
      {/* Not Clocked In Section - occupies more space */}
      <SidebarCard sx={{ flex: "3 3 65%" }}>
        <CardHeader>
          <CardTitle>Not Clocked In</CardTitle>
          <ViewAllButton onClick={() => router.push("/attendance")}>
            View All
          </ViewAllButton>
        </CardHeader>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <UserListContainer>
              {paginatedNotClockedIn.length > 0 ? (
                paginatedNotClockedIn.map((user) => (
                  <UserListItem
                    key={user.id}
                    onClick={() => onUserClick?.(user.id)}
                  >
                    <Avatar
                      src={user.profile_image}
                      sx={{ width: 48, height: 48, mb: 0.5 }}
                    >
                      {user.first_name?.[0] || ""}
                      {user.last_name?.[0] || ""}
                    </Avatar>
                    <ItemInfo>
                      <ItemName>
                        {user.first_name} {user.last_name}
                      </ItemName>
                      <ItemRole title={user.email}>{user.email}</ItemRole>
                    </ItemInfo>
                  </UserListItem>
                ))
              ) : (
                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: "rgba(0,0,0,0.5)",
                    textAlign: "center",
                    py: 2,
                  }}
                >
                  All employees have clocked in
                </Typography>
              )}
            </UserListContainer>
            {totalPages > 1 && (
              <PaginationContainer>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  size="small"
                  color="primary"
                />
              </PaginationContainer>
            )}
          </>
        )}
      </SidebarCard>

      {/* On Leave Today Section - occupies less space */}
      <SidebarCard sx={{ flex: "2 2 35%" }}>
        <CardHeader>
          <CardTitle>On Leave Today</CardTitle>
        </CardHeader>
        {onLeaveUsers.length > 0 ? (
          <LeaveAvatarsContainer>
            {onLeaveUsers.map((user) => (
              <LeaveAvatarWrapper
                key={user.id}
                onClick={() => onUserClick?.(user.id)}
              >
                <Avatar src={user.profile_image} sx={{ width: 48, height: 48 }}>
                  {user.first_name?.[0] || ""}
                  {user.last_name?.[0] || ""}
                </Avatar>
                <LeaveAvatarName>
                  {user.first_name} {user.last_name}
                </LeaveAvatarName>
              </LeaveAvatarWrapper>
            ))}
          </LeaveAvatarsContainer>
        ) : (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "rgba(0,0,0,0.5)",
              textAlign: "center",
              py: 2,
            }}
          >
            No employees on leave today
          </Typography>
        )}
      </SidebarCard>
    </SidebarContainer>
  );
};

export default DashboardSidebar;
