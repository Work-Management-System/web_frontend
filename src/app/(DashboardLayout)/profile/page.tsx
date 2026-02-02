"use client";
import React, { useEffect, useState } from "react";
import createAxiosInstance from "@/app/axiosInstance";
import { useRouter } from "next/navigation";
import { useAppselector } from "@/redux/store";
import { Box, Button, TextField } from "@mui/material";
import { EditUserDialog } from "../users/page";
import toast from "react-hot-toast";
import Loader from "@/app/loading";
import { GridSearchIcon } from "@mui/x-data-grid";
import SetPasswordDialog from "../components/ReSetPasswordDialog";

type User = {
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_delete: boolean;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  designation?: string;
  department?: string;
  joiningDate?: string;
  employeeCode?: string;
  role?: any;
  role_id?: string;
  tenant_id?: string;
  profile_image: string;
  emergency_contact: string;
  blood_group: string;
  gender: string;
  dob: string;
  reporting_manager?: string;
};

type Project = {
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_delete: boolean;
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
  current_phase: string;
  client_details: { name: string; email: string; contact: string }[];
  project_timeline: { time: string; title: string }[];
  teams: {
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
    id: string;
    status: string;
    time_spent: number;
    user: {
      first_name: string;
      last_name: string;
      email: string;
      designation: string;
    };
  }[];
  taskReports: {
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
    id: string;
    start_time: string;
    end_time: string;
    eta: string;
    task_name: string;
    description: string;
    remarks: string | null;
    status: string;
    visible_to: string[];
  }[];
};
type Role = {
  id: string;
  name: string;
  priority: number;
};
export type EditUser = {
  id: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  designation?: string | null;
  department?: string | null;
  joiningDate?: string | null;
  employeeCode?: string | null;
  role?: Role | null;
  profile_image?: string | null;
  emergency_contact?: string | null;
  blood_group?: string | null;
  gender?: string | null;
  dob?: string | null;
  reporting_manager?: string | null;
};
export type SetPassword = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axiosInstance = createAxiosInstance();
  const router = useRouter();
  const [editUser, setEditUser] = useState<EditUser | null>(null);
  const [users, setUsers] = useState<EditUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const authData = useAppselector((state) => state.auth.value);
  const userId = authData?.user?.id;
  const currentUserRole = useAppselector((state) => state.role.value.name);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number>(0);

  const handleOpen = () => setPassDialogOpen(true);
  const handleClose = () => setPassDialogOpen(false);
  const handleSubmit = async (passwordDetails: SetPassword) => {
    try {
      const payload = { ...passwordDetails, email: user?.email || "" };
      const res = await axiosInstance.post("/auth/reset-password", payload);
      if (res.data.status) {
        toast.success(res.data.message || "Password updated successfully");
        setPassDialogOpen(false);
      } else {
        toast.error(res.data.message || "Failed to update password");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update password. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating password:", error);
    }
  };

  const fetchUser = async () => {
    if (!userId) throw new Error("User ID not found");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await axiosInstance.get(`/user/find-one/${userId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.data.status) throw new Error("Failed to fetch user");
      return res.data.data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const fetchUsers = async () => {
    const res = await axiosInstance.get(`/user/list`);
    if (!res.data.status) throw new Error("Failed to fetch users");
    return res.data.data;
  };

  const fetchEditUserDetails = async (userId: string) => {
    // First try to find from users array, otherwise create from user state
    const res = users?.find((edituser) => edituser.id === userId);
    if (res) {
      setEditUser(res);
    } else if (user) {
      // Create editUser from user state if not found in users array
      const editUserData: EditUser = {
        id: user.id,
        is_active: user.is_active,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || null,
        address: user.address || null,
        designation: user.designation || null,
        department: user.department || null,
        joiningDate: user.joiningDate || null,
        employeeCode: user.employeeCode || null,
        role: user.role || null,
        profile_image: user.profile_image || null,
        emergency_contact: user.emergency_contact || null,
        blood_group: user.blood_group || null,
        gender: user.gender || null,
        dob: user.dob || null,
        reporting_manager: user.reporting_manager || null,
      };
      setEditUser(editUserData);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/role-management/get-all");
      if (response.status === 200) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    if (currentUserRole !== "SuperAdmin") {
      fetchUsers()
        .then(setUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
      fetchRoles();
    }
  }, [currentUserRole]);

  useEffect(() => {
    fetchUser().then(setUser).catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (userId && (user || users.length > 0)) {
      fetchEditUserDetails(userId).catch(console.error);
    }
  }, [users, user]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    // setEditUser(null);
  };
  const handleEditClick = (user: EditUser) => {
    setOpenDialog(true);
  };

  const fetchUserProjects = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    try {
      const res = await axiosInstance.get(
        `/project-management/user-projects/${userId}`,
        {
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);
      return res.data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // toast.error(null);
      try {
        const userData = await fetchUser();
        console.log("currentUserRole", currentUserRole);
        setUser(userData);
        const isSuperAdmin = currentUserRole === "SuperAdmin";
        if (!isSuperAdmin) {
          const projectsData = await fetchUserProjects();
          const list = Array.isArray(projectsData) ? projectsData : [];
          setProjects(list);
          setFilteredProjects(list);
        }
      } catch (error: any) {
        console.error("Fetch error:", error);
        setError(error.message || "Failed to load user data");
        const fallbackUser: User = {
          created_at: "",
          updated_at: "",
          is_active: true,
          is_delete: false,
          id: "fallback-id",
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          password: "",
          phone: "9876543210",
          address: "123, Elm Street, NY",
          designation: "Software Engineer",
          department: "Engineering",
          joiningDate: "2022-05-01",
          employeeCode: "EMP12345",
          role: "User",
          profile_image: "/images/profile/defaultprofile.jpg",
          emergency_contact: "911123456789",
          blood_group: "O+",
          gender: "Male",
          dob: "1990-01-01",
        };
        setUser(fallbackUser);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) =>
        project?.title.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredProjects(filtered);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Error: {error}. Please try again or contact support.
      </div>
    );
  }

  const defaultProfilePicture = "/images/profile/defaultprofile.jpg";

  const isSuperAdmin =
    currentUserRole === "SuperAdmin" ||
    user?.role === "SuperAdmin" ||
    user?.role_id === "db3cae96-a430-4d23-9ced-af0fd0718970";

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-color)] px-4 py-6 lg:px-8 font-sans">
        <div className="">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* Left sidebar */}
            <div className="flex flex-col rounded-3xl border border-gray-200/60 bg-[var(--card-bg-color)] p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={user?.profile_image || defaultProfilePicture}
                  alt={`${user?.first_name} ${user?.last_name}`}
                  className="h-16 w-16 rounded-2xl border border-gray-200/70 object-cover shadow-md"
                />
                <div className="flex flex-col gap-1">
                  <h1 className="text-lg font-semibold text-[var(--text-color)]">
                    {user?.first_name || "N/A"} {user?.last_name || ""}
                  </h1>
                  {user?.employeeCode && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {user.employeeCode}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-6 text-sm text-[var(--text-color)]">
                {/* Professional Details */}
                <div className="border-t border-gray-200/70 pt-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      style={{ color: "var(--primary-color-1)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Professional Details
                  </h2>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Department</span>
                      <span className="text-right font-medium">
                        {user?.department || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Designation</span>
                      <span className="text-right font-medium">
                        {user?.designation || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Employee Code</span>
                      <span className="text-right font-medium">
                        {user?.employeeCode || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Joining Date</span>
                      <span className="text-right font-medium">
                        {user?.joiningDate || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Reporting Manager</span>
                      <span className="text-right font-medium">
                        {user?.reporting_manager || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="border-t border-gray-200/70 pt-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      style={{ color: "var(--primary-color-1)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                    Personal Information
                  </h2>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Gender</span>
                      <span className="text-right font-medium">
                        {user?.gender || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Date of Birth</span>
                      <span className="text-right font-medium">
                        {user?.dob || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Blood Group</span>
                      <span className="text-right font-medium">
                        {user?.blood_group || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Emergency Contact</span>
                      <span className="text-right font-medium">
                        {user?.emergency_contact || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-200/70 pt-4">
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      style={{ color: "var(--primary-color-1)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Contact Information
                  </h2>
                  <div className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Email</span>
                      <span className="text-right font-medium break-all">
                        {user?.email || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-right font-medium">
                        {user?.phone || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Address</span>
                      <span className="text-right font-medium">
                        {user?.address || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {
                <div className="mt-6 grid grid-cols-1 gap-3">
                  <Button
                    sx={{
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                      fontWeight: 500,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-2)",
                      },
                    }}
                    onClick={handleOpen}
                  >
                    Change password
                  </Button>
                  <Button
                    sx={{
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                      fontWeight: 500,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-2)",
                      },
                    }}
                    onClick={() => editUser && handleEditClick(editUser)}
                    disabled={!editUser}
                  >
                    Edit profile
                  </Button>
                  <Button
                    sx={{
                      backgroundColor: "var(--primary-color-2)",
                      color: "white",
                      fontWeight: 500,
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-1)",
                      },
                    }}
                    onClick={() => router.push(`/tasks?userId=${userId}`)}
                  >
                    View tasks
                  </Button>
                </div>
              }
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Projects section - cohesive card design */}
              <div className="rounded-3xl border border-gray-200/60 bg-[var(--card-bg-color)] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Projects
                  </h2>
                  <TextField
                    size="small"
                    variant="outlined"
                    fullWidth
                    placeholder="Search by project title..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <GridSearchIcon
                          sx={{ color: "var(--primary-color-1)", mr: 1 }}
                        />
                      ),
                    }}
                    sx={{
                      width: "260px",
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
                      backgroundColor: "var(--card-bg-color)",
                      borderRadius: "999px",
                    }}
                  />
                </div>

                {filteredProjects?.length > 0 ? (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        overflowX: "auto",
                        py: 1,
                      }}
                    >
                      {filteredProjects.map((project, index) => (
                        <button
                          key={project.id || index}
                          onClick={() => setSelectedProject(index)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            selectedProject === index
                              ? "text-white shadow-sm"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          style={
                            selectedProject === index
                              ? { backgroundColor: "var(--primary-color-1)" }
                              : { backgroundColor: "transparent" }
                          }
                        >
                          {project?.title}
                        </button>
                      ))}
                    </Box>

                    <div className="mt-4 rounded-2xl border border-gray-200/70 bg-white/70 p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--text-color)]">
                            {filteredProjects[selectedProject]?.title}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {filteredProjects[selectedProject].description}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            filteredProjects[selectedProject].status ===
                            "ACTIVE"
                              ? "bg-green-50 text-green-700 border border-green-100"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {filteredProjects[selectedProject].status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs text-gray-600">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-500">
                            Start date
                          </span>
                          <span className="text-[var(--text-color)]">
                            {new Date(
                              filteredProjects[selectedProject].start_date,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-500">
                            End date
                          </span>
                          <span className="text-[var(--text-color)]">
                            {new Date(
                              filteredProjects[selectedProject].end_date,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-500">
                            Current phase
                          </span>
                          <span className="text-[var(--text-color)]">
                            {filteredProjects[selectedProject].current_phase}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        Team members
                      </h4>
                      <div className="space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                        {filteredProjects[selectedProject].teams
                          ?.filter(
                            (team) => team?.user && team.user?.first_name,
                          )
                          .map((team, idx) => (
                            <div
                              key={idx}
                              className="flex items-center rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2"
                            >
                              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-color-1)]/10 text-xs font-semibold text-[var(--primary-color-1)]">
                                {team?.user?.first_name.charAt(0)}
                                {team?.user?.last_name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-[var(--text-color)]">
                                  {team?.user?.first_name}{" "}
                                  {team?.user?.last_name}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  {team?.user?.designation}
                                </p>
                              </div>
                              <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  team?.status === "WORKING"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-purple-50 text-purple-700"
                                }`}
                              >
                                {team?.status}
                              </span>
                            </div>
                          ))}
                      </div>

                      {filteredProjects[selectedProject].taskReports?.length >
                        0 && (
                        <>
                          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                            Task reports
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {filteredProjects[selectedProject].taskReports.map(
                              (report, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-3"
                                >
                                  <div className="mb-1 flex items-center justify-between">
                                    <p className="text-xs font-medium text-[var(--text-color)]">
                                      {report?.task_name || "Untitled Task"}
                                    </p>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        report?.status === "completed"
                                          ? "bg-green-50 text-green-700"
                                          : report?.status === "in_progress"
                                            ? "bg-yellow-50 text-yellow-700"
                                            : "bg-red-50 text-red-700"
                                      }`}
                                    >
                                      {report?.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-600">
                                    {report?.description}
                                  </p>
                                  {report.remarks && (
                                    <p className="mt-1 text-[11px] text-gray-500">
                                      <span className="font-semibold">
                                        Remarks:
                                      </span>{" "}
                                      {report?.remarks}
                                    </p>
                                  )}
                                  <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-gray-600 md:grid-cols-3">
                                    <p>
                                      <span className="font-semibold">
                                        Start:
                                      </span>{" "}
                                      {new Date(
                                        report?.start_time,
                                      ).toLocaleString()}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        End:
                                      </span>{" "}
                                      {new Date(
                                        report?.end_time,
                                      ).toLocaleString()}
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        ETA:
                                      </span>{" "}
                                      {new Date(report?.eta).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    No projects available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editUser && (
        <EditUserDialog
          open={openDialog}
          onClose={handleCloseDialog}
          user={editUser}
          roles={roles}
          onUpdate={() => fetchUsers().then(setUsers).catch(console.error)}
          profileEditMode={true}
          currentUserPriority={user?.role?.priority}
        />
      )}
      <SetPasswordDialog
        open={passDialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </>
  );
}
