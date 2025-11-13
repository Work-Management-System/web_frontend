"use client";
import React, { use, useEffect, useState } from "react";
import createAxiosInstance from "@/app/axiosInstance";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import { usePathname, useRouter } from "next/navigation";
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
  priority: number
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
  const [coverImage, setCoverImage] = useState<string>(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
  );
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const pathName = usePathname();
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
        error.response?.data?.message || "Failed to update password. Please try again.";
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
      if (!res.data.status) throw new Error('Failed to fetch users');
      return res.data.data;
    };

    const fetchEditUserDetails= async (userId: string) => {
      const res=users?.find((edituser) => edituser.id === userId);
      setEditUser(res);
    }
  
    const fetchRoles = async () => {
      try {
        const response = await axiosInstance.get('/role-management/get-all');
        if (response.status === 200) {
          setRoles(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };
  
    useEffect(() => {
      if(currentUserRole !== "SuperAdmin"){
      fetchUsers()
        .then(setUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
      fetchRoles();
      }
    }, []);

    useEffect(() => {
      fetchUser().then(setUser).catch(console.error);
      if (userId) {
        fetchEditUserDetails(userId)
          .catch(console.error);
      }
    }, [users]);
  
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
      const res = await axiosInstance.get(`/project-management/user-projects/${userId}`, {
        signal: controller.signal,
      });
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
        console.log("currentUserRole",currentUserRole)
        setUser(userData);
        const isSuperAdmin =currentUserRole === "SuperAdmin"
        if (!isSuperAdmin) {
          const projectsData = await fetchUserProjects();
          setProjects(Array.isArray(projectsData) ? projectsData : []);
          setFilteredProjects(Array.isArray(projectsData) ? projectsData : [])
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
          profile_image: "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250",
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
        project?.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  };
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
    return (
      <Loader/>);
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600">
        Error: {error}. Please try again or contact support.
      </div>
    );
  }

  const defaultProfilePicture = "https://www.gravatar.com/avatar/2c7d99fe281ecd3bcd65ab915bac6dd5?s=250";

  // SuperAdmin UI
  const isSuperAdmin =
    user?.role === "SuperAdmin" ||
    user?.role_id === "db3cae96-a430-4d23-9ced-af0fd0718970"; // Adjust role_id if needed
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <div className="container mx-auto p-6">
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
                  alt={`${user?.first_name} ${user?.last_name}`}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
                />
              </div>
            </div>

            <div className="mt-20">
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <div className="mb-6 border-b border-gray-200 pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.first_name || "N/A"} {user?.last_name || "N/A"}
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-2">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-blue-600 mr-2"
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
                        <h3 className="text-lg font-semibold text-gray-700">
                          Personal Information
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2 pl-7 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Gender
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.gender || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Date of Birth
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.dob || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Blood Group
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.blood_group || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Emergency Contact
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.emergency_contact || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-blue-600 mr-2"
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
                        <h3 className="text-lg font-semibold text-gray-700">
                          Contact Information
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-2 pl-7 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Email
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.email || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Phone
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.phone || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-700 font-bold text-left">
                          Address
                        </span>
                        <p className="text-gray-800 text-left">
                          {user?.address || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-SuperAdmin UI
  return (
    <>
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto p-6">
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
                alt={`${user?.first_name} ${user?.last_name}`}
                className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
              />
            </div>
          </div>

          <div className="mt-20">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
              {currentUserRole !== 'SuperAdmin' &&
              <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.first_name || "N/A"} {user?.last_name || "N/A"}
                </h1>
                <div >
                      <Button
                        sx={{
                          backgroundColor: 'var(--primary-color-1)',
                          color: 'white',
                          marginRight: '15px',
                          fontWeight: '500',
                          '&:hover': {
                            backgroundColor: 'var(--primary-color-2)',
                          },
                        }}
                        onClick={handleOpen}
                      >
                        Change Password
                      </Button>
                <Button
                   sx={{
                      backgroundColor: 'var(--primary-color-1)',
                      color: 'white',
                      marginRight: '15px',                  
                      fontWeight: '500',
                      '&:hover': {
                        backgroundColor: 'var(--primary-color-2)',
                      },
                    }}                  
                    onClick={() =>  handleEditClick(editUser)}
                >
                  Edit
                </Button>
                <Button
                   sx={{
                      backgroundColor: 'var(--primary-color-2)',
                      color: 'white',
                      fontWeight: '500',
                      '&:hover': {
                        backgroundColor: 'var(--primary-color-1)',
                      },
                    }}                 
                     onClick={() => router.push(`/tasks?userId=${userId}`)}
                >
                  View Tasks
                </Button>
                </div>
              </div>
}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="mb-2">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2"
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
                      <p className="text-gray-800 text-left">{user?.department || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Designation</span>
                      <p className="text-gray-800 text-left">{user?.designation || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Employee Code</span>
                      <p className="text-gray-800 text-left">{user?.employeeCode || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Joining Date</span>
                      <p className="text-gray-800 text-left">{user?.joiningDate || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Reporting Manager</span>
                      <p className="text-gray-800 text-left">{user?.reporting_manager || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2">
                    <div className="flex items-center">
                         <svg
                          className="w-5 h-5 text-blue-600 mr-2"
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
                      <p className="text-gray-800 text-left">{user?.gender || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Date of Birth</span>
                      <p className="text-gray-800 text-left">{user?.dob || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Blood Group</span>
                      <p className="text-gray-800 text-left">{user?.blood_group || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Emergency Contact</span>
                      <p className="text-gray-800 text-left">{user?.emergency_contact || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2"
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
                      <p className="text-gray-800 text-left">{user?.email || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Phone</span>
                      <p className="text-gray-800 text-left">{user?.phone || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-700 font-bold text-left">Address</span>
                      <p className="text-gray-800 text-left">{user?.address || "N/A"}</p>
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

        <div>
<div className="flex justify-between">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Projects</h2>
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
          {filteredProjects?.length > 0 ? (
            <>
              {/* <div className="flex space-x-4 mb-6 overflow-x-auto"> */}
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
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
        selectedProject === index
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
              <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{filteredProjects[selectedProject]?.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filteredProjects[selectedProject].status === "ACTIVE"
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

                <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Team Members</h4>
                  <div className="space-y-3 max-h-[20rem] overflow-y-scroll">
                {filteredProjects[selectedProject].teams
                      ?.filter((team) => team?.user && team.user?.first_name)
                      .map((team, idx) => (
                    <div
                      key={idx}
                      className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium mr-3">
                        {team?.user?.first_name.charAt(0)}
                        {team?.user?.last_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">
                          {team?.user?.first_name} {team?.user?.last_name}
                        </p>
                        <p className="text-gray-600 text-sm">{team?.user?.designation}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team?.status === "WORKING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {team?.status}
                      </span>
                    </div>
                  ))}
                </div>

                {filteredProjects[selectedProject].taskReports?.length > 0 && (
                  <>
                    <h4 className="text-lg font-semibold text-gray-700 mt-6 mb-3">Task Reports</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {filteredProjects[selectedProject].taskReports.map((report, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-800 font-medium">{report?.task_name || "Untitled Task"}</p>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                report?.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : report?.status === "in_progress"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {report?.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{report?.description}</p>
                          {report.remarks && (
                            <p className="text-gray-500 text-sm mt-1">
                              <span className="font-medium">Remarks:</span> {report?.remarks}
                            </p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-gray-600 text-sm">
                            <p>
                              <span className="font-medium">Start:</span>{" "}
                              {new Date(report?.start_time).toLocaleString()}
                            </p>
                            <p>
                              <span className="font-medium">End:</span>{" "}
                              {new Date(report?.end_time).toLocaleString()}
                            </p>
                            <p>
                              <span className="font-medium">ETA:</span>{" "}
                              {new Date(report?.eta).toLocaleString()}
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
    </div>
    {editUser && (
            <EditUserDialog
              open={openDialog}
              onClose={handleCloseDialog}
              user={editUser}
              roles={roles}
              onUpdate={() => fetchUsers().then(setUsers).catch(console.error)}
              profileEditMode={true}
              currentUserPriority={ user?.role?.priority} 
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