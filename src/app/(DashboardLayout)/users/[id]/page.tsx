"use client";
import React, { useEffect, useState } from "react";
import createAxiosInstance from "@/app/axiosInstance";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAppselector } from "@/redux/store";
import { Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { exportUserDoc, generateUserDocx } from "@/utils/exports/ExportDocx";
import Loader from "@/app/loading";
import { GridSearchIcon } from "@mui/x-data-grid";
import toast from "react-hot-toast";
import AddIcon from "@mui/icons-material/Add";
import { Description as DescriptionIcon, Download as DownloadIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Close as CloseIcon } from "@mui/icons-material";


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
    const [coverImage, setCoverImage] = useState<string>("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80");
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
        const res = await axiosInstance.get(`/project-management/user-projects/${userId}`);
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

            await axiosInstance.post(`/project-management/assign-user-to-projects`, payload);
            toast.success("User assigned to selected projects successfully");
            const projects=await fetchUserProjects();
            setFilteredProjects(Array.isArray(projects) ? projects : [])

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
                const allProjectsRes = await axiosInstance.get("/project-management/list");
                if (allProjectsRes.data.status !== "success") throw new Error("Failed to fetch projects");
                const allProjects: Project[] = allProjectsRes.data.data;

                // Fetch projects assigned to the user
                const userProjectsRes = await axiosInstance.get(`/project-management/user-projects/${userId}`);
                const userProjects: Project[] = userProjectsRes.data;

                // Set available projects (projects user is NOT assigned to)
                const userProjectIds = new Set(userProjects.map((project) => project.id));
                const available = allProjects.filter((project) => !userProjectIds.has(project.id));

                setAvailableProjects(available);
                // Store user's current projects separately
                setProjects(userProjects); // This should already be set elsewhere
                setSelectedProjects(userProjects.map(proj => proj.id));
            } catch (error) {
                console.error("Failed to fetch available projects:", error);
            }
        };
        if (userId) {
            fetchProjects();
        }
    }, [userId,openDialog]);

    const handleImageUpload = (event:
        

 React.ChangeEvent<HTMLInputElement>) => {
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
        return (
            <Loader />
        );
    }

    const defaultProfilePicture = "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250";

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
            <div className="container mx-auto p-6">
                {/* User Profile Section (Notion Style) */}
                <div className="mb-12">
                    <div className="relative group">
                        <img
                            src={coverImage}
                            alt="Cover"
                            className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <label
                            htmlFor="cover-upload"
                            className="absolute top-2 right-2 backdrop-blur-md p-2 cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-full"
                        >
                            <div className="w-24 h-8 flex items-center justify-center text-gray-600 text-sm font-medium rounded-md hover:opacity-100">
                                Change Cover
                            </div>
                            <input
                                id="cover-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>
                        <div className="absolute left-6 -bottom-16">
                            <img
                                src={user?.profile_image || defaultProfilePicture}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
                            />
                        </div>
                    </div>

                    {/* User Info Card */}
                    <div className="mt-20">
                        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                            {/* Header Section */}
                            <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h1>
                                <Box sx={{ display: "flex", gap: 2 }}>
                              <Button
                                onClick={() =>
                                  generateUserDocx(user, projects, ["Frontend", "JavaScript", "Security", "Design"], taskReports)
                                }
                              >
                                Export Docx
                              </Button>

                                <Button
                                    onClick={() => router.push(`/tasks?userId=${userId}`)}
                                    sx={{cursor: "pointer",backgroundColor: "var(--primary-color-1)", color: "#fff", "&:hover": { backgroundColor: "var(--primary-color-2)" } }
                                    }   
                                >
                                    View Tasks
                                </Button>
                                </Box>

                            </div>

                            {/* Single Row Layout for Info Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Professional Details */}
                                <div>
                                    <div className="mb-2">
                                        <div className="flex items-center">
                                            <svg
                                                className="w-5 h-5 primary-color-1 mr-2"
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
                                            <h3 className="text-lg font-semibold text-gray-700">Professional Details</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-7 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Department</span>
                                            <p className="text-gray-800 text-left">{user?.department}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Designation</span>
                                            <p className="text-gray-800 text-left">{user?.designation}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Employee Code</span>
                                            <p className="text-gray-800 text-left">{user?.employeeCode}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Joining Date</span>
                                            <p className="text-gray-800 text-left">{user?.joiningDate}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Reporting Manager</span>
                                            <p className="text-gray-800 text-left">{user?.reporting_manager || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Information */}
                                <div>
                                    <div className="mb-2">
                                        <div className="flex items-center">
                                            <svg
                                                className="w-5 h-5 primary-color-1 mr-2"
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
                                            <h3 className="text-lg font-semibold text-gray-700">Personal Information</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-7 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Gender</span>
                                            <p className="text-gray-800 text-left">{user?.gender}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Date of Birth (DOB)</span>
                                            <p className="text-gray-800 text-left">{user?.dob}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Blood Group</span>
                                            <p className="text-gray-800 text-left">{user?.blood_group}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Emergency Contact</span>
                                            <p className="text-gray-800 text-left">{user?.emergency_contact}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <div className="mb-2">
                                        <div className="flex items-center">
                                            <svg
                                                className="w-5 h-5 primary-color-1 mr-2"
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
                                            <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-7 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Email</span>
                                            <p className="text-gray-800 text-left">{user?.email}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Phone</span>
                                            <p className="text-gray-800 text-left">{user?.phone}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-gray-700 font-bold text-left">Address</span>
                                            <p className="text-gray-800 text-left">{user?.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mt-10 text-gray-600">Tech Stack</h3>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {["Frontend", "JavaScript", "Security", "Design"].map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:shadow-sm transition-all duration-300"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Projects Section with Navbar */}
                <div>
                    <div className="flex justify-between">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                            <IconButton
                                sx={{
                                    marginLeft:'15px',
                                    "&:hover": { backgroundColor: "var(--primary-color-1)", color: "white" },
                                    transition: "all 0.3s",
                                }}
                                onClick={handleOpenDialog}
                                aria-label="Add Project"
                            >
                                <AddIcon />
                            </IconButton>
                        </div>

                     <TextField
                                                size="small"
                                                // label="Search Projects"
                                                variant="outlined"
                                                fullWidth
                                                placeholder="Search by project title..."
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                InputProps={{
                                                  startAdornment: (
                                                    <GridSearchIcon sx={{ color: "var(--primary-color-1)", mr: 1 }} />
                                                  ),
                                                }}
                                                sx={{
                                                  width: "350px",
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
                                                  backgroundColor: "#FFF", // Ensure visibility
                                                  borderRadius: "4px",
                                                }}
                                              />
                    </div>
                    {filteredProjects.length > 0 ? (
                        <>
                            {/* Navbar for Projects */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    overflowX: 'auto',
                                    py: 2,
                                }}
                            >
                                {filteredProjects.map((project, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedProject(index)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${selectedProject === index
                                                ? 'text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        style={
                                            selectedProject === index
                                                ? { backgroundColor: 'var(--primary-color-1)' }
                                                : {}
                                        }
                                    >
                                        {project?.title}
                                    </button>
                                ))}
                            </Box>

                            {/* Display the Selected Project Card */}
                            <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900">{filteredProjects[selectedProject]?.title}</h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${filteredProjects[selectedProject].status === "ACTIVE"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {filteredProjects[selectedProject].status}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">{filteredProjects[selectedProject].description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="font-semibold text-gray-700 w-32 shrink-0">Start Date:</span>
                                        <span className="text-gray-900">
                                            {new Date(filteredProjects[selectedProject].start_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="font-semibold text-gray-700 w-32 shrink-0">End Date:</span>
                                        <span className="text-gray-900">
                                            {new Date(filteredProjects[selectedProject].end_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="font-semibold text-gray-700 w-32 shrink-0">Current Phase:</span>
                                        <span className="text-gray-900">{filteredProjects[selectedProject].current_phase}</span>
                                    </div>
                                </div>

                                {/* Team Members */}
                                <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Team Members</h4>
                                <div className="space-y-3 max-h-[20rem] overflow-y-scroll">
                                    {filteredProjects[selectedProject]?.teams
                                    ?.filter((team) => team?.user && team.user?.first_name)
                                    .map((team, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover+:bg-gray-100 transition duration-200"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium mr-3">
                                                {team.user?.first_name.charAt(0)}
                                                {team.user?.last_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-800 font-medium">
                                                    {team?.user?.first_name} {team?.user?.last_name}
                                                </p>
                                                <p className="text-gray-600 text-sm">{team?.user?.designation}</p>
                                            </div>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${team?.status === "WORKING"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-purple-100 text-purple-700"
                                                    }`}
                                            >
                                                {team?.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Task Reports */}
                                {taskReports.filter(report => report?.project?.id === filteredProjects[selectedProject].id).length > 0 && (
                                    <>
                                        <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Task Reports</h4>
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {taskReports
                                                .filter(report => report.project.id === filteredProjects[selectedProject].id)
                                                .map((report, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-200"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-gray-800 font-medium">{report.task_name || "Untitled Task"}</p>
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === "completed"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : report.status === "in_progress"
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : "bg-red-100 text-red-700"
                                                                    }`}
                                                            >
                                                                {report.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm">{report.description}</p>
                                                        {report.remarks && (
                                                            <p className="text-gray-500 text-sm mt-1">
                                                                <span className="font-medium">Remarks:</span> {report.remarks}
                                                            </p>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-gray-600 text-sm">
                                                            <p>
                                                                <span className="font-medium">Start:</span>{" "}
                                                                {new Date(report.start_time).toLocaleString()}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">End:</span>{" "}
                                                                {new Date(report.end_time).toLocaleString()}
                                                            </p>
                                                            <p>
                                                                <span className="font-medium">ETA:</span>{" "}
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
                        <p className="text-gray-600">No projects available.</p>
                    )}
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
                        background: "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
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
                            value={
                                [...availableProjects, ...projects].filter((p) =>
                                    selectedProjects.includes(p.id)
                                )
                            }
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
                                <TextField {...params} label="Projects" placeholder="Select Projects" />
                            )}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            disableCloseOnSelect={true}
                            sx={{ minWidth: "100%", maxWidth: "100%" }}
                        />
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={isSubmitting} sx={{ color: "var(--primary-color-1)" }}>
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

            {/* Document Sections */}
            {(authData?.role?.priority <= 2 || authData?.user?.id === userId) && (
                <div className="mt-8 space-y-6">
                    {/* Employee Documents Section */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Employee Documents</h2>
                            {authData?.role?.priority <= 2 && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.pdf,.doc,.docx';
                                        input.onchange = async (e: any) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('document_type', 'OTHER');
                                            try {
                                                await axiosInstance.post(
                                                    `/organization/employee-documents/${userId}`,
                                                    formData,
                                                    { headers: { 'Content-Type': 'multipart/form-data' } }
                                                );
                                                toast.success('Document uploaded successfully');
                                            } catch (error: any) {
                                                toast.error(error?.response?.data?.message || 'Upload failed');
                                            }
                                        };
                                        input.click();
                                    }}
                                    sx={{ bgcolor: "var(--primary-color-1)", "&:hover": { bgcolor: "var(--primary-color-2)" } }}
                                >
                                    Upload Document
                                </Button>
                            )}
                        </div>
                        <EmployeeDocumentsList userId={userId || ""} />
                    </div>

                    {/* Payroll Documents Section */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Payroll Documents</h2>
                            {authData?.role?.priority <= 2 && (
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.pdf,.doc,.docx';
                                        input.onchange = async (e: any) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('document_type', 'PAYSLIP');
                                            formData.append('document_date', new Date().toISOString().split('T')[0]);
                                            try {
                                                await axiosInstance.post(
                                                    `/organization/payroll-documents/${userId}`,
                                                    formData,
                                                    { headers: { 'Content-Type': 'multipart/form-data' } }
                                                );
                                                toast.success('Document uploaded successfully');
                                            } catch (error: any) {
                                                toast.error(error?.response?.data?.message || 'Upload failed');
                                            }
                                        };
                                        input.click();
                                    }}
                                    sx={{ bgcolor: "var(--primary-color-1)", "&:hover": { bgcolor: "var(--primary-color-2)" } }}
                                >
                                    Upload Document
                                </Button>
                            )}
                        </div>
                        <PayrollDocumentsList userId={userId || ""} />
                    </div>
                </div>
            )}

        </div>
    );
}

// Employee Documents List Component
function EmployeeDocumentsList({ userId }: { userId: string }) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
    const axiosInstance = createAxiosInstance();
    const authData = useAppselector((state) => state.auth.value);

    useEffect(() => {
        fetchDocuments();
    }, [userId]);

    const fetchDocuments = async () => {
        try {
            const response = await axiosInstance.get(`/organization/employee-documents?user_id=${userId}`);
            setDocuments(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const isImageFile = (doc: any) => {
        return (
            doc.file_type?.startsWith("image/") ||
            [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].some((ext) =>
                doc.file_name?.toLowerCase().endsWith(ext)
            )
        );
    };

    const isPdfFile = (doc: any) => {
        return (
            doc.file_type === "application/pdf" ||
            doc.file_name?.toLowerCase().endsWith(".pdf")
        );
    };

    const handleView = (doc: any) => {
        setSelectedDocument(doc);
        setViewDialogOpen(true);
    };

    const handleDownload = (doc: any) => {
        window.open(doc.file_url, '_blank');
    };

    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (documents.length === 0) return <div className="text-gray-500 text-center py-4">No documents found</div>;

    return (
        <>
            <div className="space-y-2">
                {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <DescriptionIcon />
                            <div>
                                <p className="font-medium">{doc.file_name}</p>
                                <p className="text-sm text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <IconButton size="small" onClick={() => handleView(doc)} title="View Document">
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDownload(doc)} title="Download Document">
                                <DownloadIcon />
                            </IconButton>
                            {(authData?.role?.priority <= 2 || doc.uploaded_by?.id === authData?.user?.id) && (
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={async () => {
                                        if (!confirm('Delete this document?')) return;
                                        try {
                                            await axiosInstance.delete(`/organization/employee-documents/${doc.id}`);
                                            toast.success('Document deleted');
                                            fetchDocuments();
                                        } catch (error: any) {
                                            toast.error(error?.response?.data?.message || 'Delete failed');
                                        }
                                    }}
                                    title="Delete Document"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* View Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        height: "90vh",
                        maxHeight: "90vh",
                    },
                }}
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {selectedDocument?.file_name || "Document Viewer"}
                        </Typography>
                        <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent
                    sx={{
                        p: 0,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    {selectedDocument && (
                        <Box
                            sx={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                bgcolor: "grey.100",
                                overflow: "auto",
                                p: 2,
                            }}
                        >
                            {isPdfFile(selectedDocument) ? (
                                <iframe
                                    src={`${selectedDocument.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        minHeight: "600px",
                                        border: "none",
                                    }}
                                    title={selectedDocument.file_name}
                                />
                            ) : isImageFile(selectedDocument) ? (
                                <img
                                    src={selectedDocument.file_url}
                                    alt={selectedDocument.file_name}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <Box textAlign="center" p={4}>
                                    <DescriptionIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Preview not available
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        This file type cannot be previewed in the browser
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleDownload(selectedDocument)}
                                    >
                                        Download to View
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedDocument && (
                        <Button
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownload(selectedDocument)}
                        >
                            Download
                        </Button>
                    )}
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// Payroll Documents List Component
function PayrollDocumentsList({ userId }: { userId: string }) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
    const axiosInstance = createAxiosInstance();
    const authData = useAppselector((state) => state.auth.value);

    useEffect(() => {
        fetchDocuments();
    }, [userId]);

    const fetchDocuments = async () => {
        try {
            const response = await axiosInstance.get(`/organization/payroll-documents?user_id=${userId}`);
            setDocuments(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const isImageFile = (doc: any) => {
        return (
            doc.file_type?.startsWith("image/") ||
            [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"].some((ext) =>
                doc.file_name?.toLowerCase().endsWith(ext)
            )
        );
    };

    const isPdfFile = (doc: any) => {
        return (
            doc.file_type === "application/pdf" ||
            doc.file_name?.toLowerCase().endsWith(".pdf")
        );
    };

    const handleView = (doc: any) => {
        setSelectedDocument(doc);
        setViewDialogOpen(true);
    };

    const handleDownload = (doc: any) => {
        window.open(doc.file_url, '_blank');
    };

    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (documents.length === 0) return <div className="text-gray-500 text-center py-4">No documents found</div>;

    return (
        <>
            <div className="space-y-2">
                {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <DescriptionIcon />
                            <div>
                                <p className="font-medium">{doc.file_name}</p>
                                <p className="text-sm text-gray-500">
                                    {doc.document_date ? new Date(doc.document_date).toLocaleDateString() : new Date(doc.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <IconButton size="small" onClick={() => handleView(doc)} title="View Document">
                                <VisibilityIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDownload(doc)} title="Download Document">
                                <DownloadIcon />
                            </IconButton>
                            {(authData?.role?.priority <= 2 || doc.uploaded_by?.id === authData?.user?.id) && (
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={async () => {
                                        if (!confirm('Delete this document?')) return;
                                        try {
                                            await axiosInstance.delete(`/organization/payroll-documents/${doc.id}`);
                                            toast.success('Document deleted');
                                            fetchDocuments();
                                        } catch (error: any) {
                                            toast.error(error?.response?.data?.message || 'Delete failed');
                                        }
                                    }}
                                    title="Delete Document"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* View Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        height: "90vh",
                        maxHeight: "90vh",
                    },
                }}
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {selectedDocument?.file_name || "Document Viewer"}
                        </Typography>
                        <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent
                    sx={{
                        p: 0,
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    {selectedDocument && (
                        <Box
                            sx={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                bgcolor: "grey.100",
                                overflow: "auto",
                                p: 2,
                            }}
                        >
                            {isPdfFile(selectedDocument) ? (
                                <iframe
                                    src={`${selectedDocument.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        minHeight: "600px",
                                        border: "none",
                                    }}
                                    title={selectedDocument.file_name}
                                />
                            ) : isImageFile(selectedDocument) ? (
                                <img
                                    src={selectedDocument.file_url}
                                    alt={selectedDocument.file_name}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <Box textAlign="center" p={4}>
                                    <DescriptionIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Preview not available
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                        This file type cannot be previewed in the browser
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleDownload(selectedDocument)}
                                    >
                                        Download to View
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedDocument && (
                        <Button
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownload(selectedDocument)}
                        >
                            Download
                        </Button>
                    )}
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}