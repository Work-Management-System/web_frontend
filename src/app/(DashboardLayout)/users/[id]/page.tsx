"use client";
import React, { useEffect, useState } from "react";
import createAxiosInstance from "@/app/axiosInstance";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppselector } from "@/redux/store";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  TextField,
} from "@mui/material";
import { generateUserDocx } from "@/utils/exports/ExportDocx";
import Loader from "@/app/loading";
import { GridSearchIcon } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import AddIcon from "@mui/icons-material/Add";

export type User = {
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
  designation: string;
  department: string;
  joiningDate: string;
  employeeCode: string;
  role: string | null;
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
};

export type TaskReport = {
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_delete: boolean;
  id: string;
  start_time: string;
  end_time: string;
  eta: number;
  time_taken: number;
  task_name: string;
  description: string;
  remarks: string | null;
  status: string;
  project: {
    id: string;
    title: string;
  };
};

export default function UserProfilePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskReports, setTaskReports] = useState<TaskReport[]>([]);
  const [coverImage, setCoverImage] = useState<string>(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
  );
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const pathName = usePathname();
  const axiosInstance = createAxiosInstance();
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authData = useAppselector((state) => state.auth.value);
  const userId = id;

  const fetchUser = async () => {
    if (!userId) throw new Error("User ID not found");
    const res = await axiosInstance.get(`/user/find-one/${userId}`);
    if (!res.data.status) throw new Error("Failed to fetch user");
    return res.data.data;
  };

  const fetchUserProjects = async () => {
    const res = await axiosInstance.get(
      `/project-management/user-projects/${userId}`
    );
    return res.data;
  };

  const fetchUserTaskReports = async () => {
    const res = await axiosInstance.get(`/work-logs/user-report/${userId}`);
    return res.data.data[0]?.taskReports || [];
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) =>
        project?.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  };
  const handleOpenDialog = () => {
    setOpenDialog(true);
    setSelectedProjects([]);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProjects([]);
  };

  const handleAssignUserToProjects = async () => {
    if (!userId || selectedProjects.length === 0) {
      toast.error("Please select one user and at least one project");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        userId,
        projectIds: selectedProjects,
        status: "WORKING", // can make dynamic later
      };

      await axiosInstance.post(
        `/project-management/assign-user-to-projects`,
        payload
      );
      toast.success("User assigned to selected projects successfully");
      const projects = await fetchUserProjects();
      setFilteredProjects(Array.isArray(projects) ? projects : []);

      const updatedProjects = await fetchUserProjects();
      setProjects(updatedProjects);
      handleCloseDialog();
    } catch (err) {
      console.error("Failed to assign user to projects:", err);
      toast.error("Failed to assign user to projects");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    Promise.all([fetchUser(), fetchUserProjects(), fetchUserTaskReports()])
      .then(([userData, projectsData, taskReportsData]) => {
        setUser(userData);
        setProjects(projectsData);
        setTaskReports(taskReportsData);
        setFilteredProjects(Array.isArray(projectsData) ? projectsData : []);
      })
      .catch((error) => {
        console.error(error);
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
          role: null,
          role_id: "296f4102-ba92-48af-9d7b-efeeb029b81d",
          tenant_id: "296f4102-ba92-48af-9d7b-efeeb029b81d",
          profile_image: "",
          emergency_contact: "911123456789",
          blood_group: "O+",
          gender: "Male",
          dob: "1990-01-01",
          reporting_manager: "",
        };
        setUser(fallbackUser);
        setProjects([]);
        setTaskReports([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch all projects
        const allProjectsRes = await axiosInstance.get(
          "/project-management/list"
        );
        if (allProjectsRes.data.status !== "success")
          throw new Error("Failed to fetch projects");
        const allProjects: Project[] = allProjectsRes.data.data;

        // Fetch projects assigned to the user
        const userProjectsRes = await axiosInstance.get(
          `/project-management/user-projects/${userId}`
        );
        const userProjects: Project[] = userProjectsRes.data;

        // Set available projects (projects user is NOT assigned to)
        const userProjectIds = new Set(
          userProjects.map((project) => project.id)
        );
        const available = allProjects.filter(
          (project) => !userProjectIds.has(project.id)
        );

        setAvailableProjects(available);
        // Store user's current projects separately
        setProjects(userProjects); // This should already be set elsewhere
        setSelectedProjects(userProjects.map((proj) => proj.id));
      } catch (error) {
        console.error("Failed to fetch available projects:", error);
      }
    };
    if (userId) {
      fetchProjects();
    }
  }, [userId, openDialog]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const defaultProfilePicture =
    "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250";

  return (
    <>
      <div className="min-h-screen bg-[var(--bg-color)] px-4 py-6 lg:px-8 font-sans">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Left sidebar - same look as profile page */}
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

            {/* Actions for this user */}
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
                onClick={() =>
                  generateUserDocx(
                    user,
                    projects,
                    ["Frontend", "JavaScript", "Security", "Design"],
                    taskReports
                  )
                }
              >
                Export Docx
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
          </div>

          {/* Right column - projects section in same style as profile page */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200/60 bg-[var(--card-bg-color)] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Projects
                  </h2>
                  <IconButton
                    sx={{
                      marginLeft: "8px",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-1)",
                        color: "white",
                      },
                      transition: "all 0.3s",
                    }}
                    onClick={handleOpenDialog}
                    aria-label="Add Project"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </div>

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

              {filteredProjects.length > 0 ? (
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
                          filteredProjects[selectedProject].status === "ACTIVE"
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
                            filteredProjects[selectedProject].start_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-500">
                          End date
                        </span>
                        <span className="text-[var(--text-color)]">
                          {new Date(
                            filteredProjects[selectedProject].end_date
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
                        ?.filter((team) => team?.user && team.user?.first_name)
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
                                {team?.user?.first_name} {team?.user?.last_name}
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

                    {taskReports.filter(
                      (report) =>
                        report?.project?.id ===
                        filteredProjects[selectedProject].id
                    ).length > 0 && (
                      <>
                        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                          Task reports
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {taskReports
                            .filter(
                              (report) =>
                                report.project.id ===
                                filteredProjects[selectedProject].id
                            )
                            .map((report, idx) => (
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
                                      report?.start_time
                                    ).toLocaleString()}
                                  </p>
                                  <p>
                                    <span className="font-semibold">End:</span>{" "}
                                    {new Date(
                                      report?.end_time
                                    ).toLocaleString()}
                                  </p>
                                  <p>
                                    <span className="font-semibold">ETA:</span>{" "}
                                    {report.eta} minutes
                                  </p>
                                </div>
                              </div>
                            ))}
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
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
          Assign Projects
        </DialogTitle>

        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              id="assign-projects-autocomplete"
              options={[...availableProjects, ...projects].filter(
                (p) => !selectedProjects.includes(p.id)
              )}
              getOptionLabel={(option) => option.title}
              value={[...availableProjects, ...projects].filter((p) =>
                selectedProjects.includes(p.id)
              )}
              onChange={(event, newValue) => {
                setSelectedProjects(newValue.map((proj) => proj.id));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.title}
                    {...getTagProps({ index })}
                    key={option.id}
                    sx={{ borderRadius: "8px" }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Projects"
                  placeholder="Select Projects"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              disableCloseOnSelect={true}
              sx={{ minWidth: "100%", maxWidth: "100%" }}
            />
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
            onClick={handleAssignUserToProjects}
            disabled={isSubmitting || selectedProjects.length === 0}
          >
            {isSubmitting ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
