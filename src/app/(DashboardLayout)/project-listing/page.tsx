"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Avatar,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Input,
  IconButton,
  TextField,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import { exportProjectsToDocx } from "@/utils/exports/ExportDocx";
import { exportProjectsToExcel } from "@/utils/exports/ExportExcel";
import { CustomPagination } from "@/app/(AuthLayout)/components/Pagination/CustomPagination";
import ExportFileDropdown from "@/utils/exports/ExportFilesDropDown";
import Cookies from "js-cookie";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import Swal from "sweetalert2";
import confirmAndDelete from "@/utils/delete-confirm";
import Loader from "@/app/loading";

interface ClientDetails {
  name: string;
  email: string;
  contact: string;
}

interface ProjectTimeline {
  time: string;
  title: string;
}

export interface Project {
  id: string;
  project_code?: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
  current_phase: string;
  client_details: ClientDetails[];
  project_timeline: ProjectTimeline[];
  is_active: boolean;
  is_delete: boolean;
  created_at: string;
  updated_at: string;
}

const getStatusChipStyle = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return { backgroundColor: "#E8F5E9", color: "#43A047" };
    case "maintenance":
      return { backgroundColor: "#E3F2FD", color: "#1E88E5" };
    case "on_hold":
      return { backgroundColor: "#FFF8E1", color: "#FBC02D" };
    case "closed":
      return { backgroundColor: "#ECEFF1", color: "#546E7A" };
    case "completed":
      return { backgroundColor: "#F3E5F5", color: "#8E24AA" };
    default:
      return { backgroundColor: "#E8ECEF", color: "#1A73E8" };
  }
};

function DescriptionCell({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!description) return <>—</>;

  const isLong = description.length > 80;
  const displayText = expanded || !isLong ? description : description.slice(0, 80) + "...";

  return (
    <div>
      {displayText}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            color: "#0ea5e9",
            border: "none",
            background: "none",
            cursor: "pointer",
            marginLeft: 4,
          }}
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const ProjectTable: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const pathname = usePathname();
  const axiosInstance = createAxiosInstance();
  const user = useAppselector((state) => state.user.user);
  const role = useAppselector((state) => state.role.value);
  const currentUserPriority = role?.priority || 4;
  const isEmployee = role.name === "Employee";
  const tenantId = Cookies.get("tenant");
  const router = useRouter();

  const fetchProjects = async () => {
    const params = isEmployee ? { user_id: user.id } : {};
    const res = await axiosInstance.get("/project-management/list", { params });
    if (res.data.status !== "success") throw new Error("Failed to fetch projects");
    return res.data.data;
  };

  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data);
        setFilteredProjects(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshFlag]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setPage(0);

    if (query.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) =>
        project.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenBulkDialog = () => {
    setOpenBulkDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenBulkDialog(false);
    setBulkFile(null);
    setBulkLoading(false);
  };
const handleProjectDelete = async (projectId: string) => {
  await confirmAndDelete({
    apiEndpoint: `/project-management/delete/${projectId}`,
    text: 'This project will be permanently deleted!',
    onSuccess: async () => {
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
    },
  });
};

  const handleDownloadSampleExcel = async () => {
    try {
      const response = await axiosInstance.get("/project-management/sample-excel", {
        responseType: "blob",
        timeout: 10000,
      });

      const contentType = response.headers["content-type"];
      if (contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "bulk-project-upload-template.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Sample Excel downloaded successfully");
      } else {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || "Failed to download sample Excel");
      }
    } catch (error) {
      console.error("Failed to download sample Excel:", error);
      toast.error(error.message || "Failed to download sample Excel");
    }
  };

  const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (
      file &&
      [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ].includes(file.type)
    ) {
      setBulkFile(file);
    } else {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      setBulkFile(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    setBulkLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);

      const response = await axiosInstance.post(`/project-management/bulk-upload/${tenantId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 15000,
      });

      toast.success(`Successfully uploaded ${response.data.length} project(s)`);
      setLoading(true);
      const updatedProjects = await fetchProjects();
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
      setSearchQuery("");
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to upload bulk projects:", error);
      toast.error(error.response?.data?.message || "Failed to upload bulk projects");
    } finally {
      setBulkLoading(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
       <Loader/>
    );
  }

  return (
    <>
      <Card sx={{ boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)", mb: 2 }}>
        <CardContent sx={{ padding: "15px 20px !important" }}>
          <Breadcrumb pageName={pathname} />
        </CardContent>
      </Card>

      <Card sx={{ mt: "25px" }}>
        <CardContent sx={{ padding: "20px 20px !important" }}>
          {!isEmployee && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h4">Project List</Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                      <SearchIcon sx={{ color: "var(--primary-color-1)", mr: 1 }} />
                    ),
                  }}
                  sx={{
                    width: "250px",
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
                <ExportFileDropdown
                  data={filteredProjects}
                  exportToExcel={exportProjectsToExcel}
                  exportToDocx={exportProjectsToDocx}
                  label="Export Projects"
                />
                {currentUserPriority < 4 && (
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-2)",
                      },
                    }}
                    onClick={handleOpenBulkDialog}
                  >
                    Bulk Upload Projects
                  </Button>
                )}
                <Link href="/project-listing/add-new-project" passHref>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "var(--primary-color-1)",
                      color: "white",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "var(--primary-color-2)",
                      },
                    }}
                  >
                    Add New Project
                  </Button>
                </Link>
              </Box>
            </Box>
          )}

          <Dialog open={openBulkDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle
              sx={{
                bgcolor: "primary.main",
                color: "white",
                mb: 2,
                textAlign: "center",
                background: "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
              }}
            >
              Bulk Upload Projects
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  sx={{
                    color: "var(--primary-color-1)",
                    borderColor: "var(--primary-color-1)",
                    "&:hover": {
                      borderColor: "var(--primary-color-2)",
                      backgroundColor: "rgba(var(--primary-color-1-rgb), 0.1)",
                    },
                  }}
                  onClick={handleDownloadSampleExcel}
                >
                  Download Sample Excel
                </Button>
                <FormControl fullWidth>
                  <InputLabel shrink>Upload Excel File</InputLabel>
                  <Input
                    type="file"
                    inputProps={{ accept: ".xlsx, .xls" }}
                    onChange={handleBulkFileChange}
                    sx={{
                      pt: 2,
                      pb: 1,
                      "& input": {
                        padding: "10px",
                        border: "1px solid #ddd",
                        fontSize: "14px",
                        borderRadius: "7px",
                      },
                    }}
                  />
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} disabled={bulkLoading} sx={{ color: "var(--primary-color-1)" }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "var(--primary-color-1)",
                  "&:hover": {
                    backgroundColor: "var(--primary-color-2)",
                  },
                }}
                onClick={handleBulkUpload}
                disabled={bulkLoading || !bulkFile}
              >
                {bulkLoading ? <CircularProgress size={24} /> : "Submit"}
              </Button>
            </DialogActions>
          </Dialog>

          <TableContainer component={Paper} sx={{ boxShadow: "none", border: "none" }}>
            <Table sx={{ borderCollapse: "separate", borderSpacing: "0" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--primary-color-1)" }}>
                  {[
                    // "Icon",
                    "Project Code",
                    "Title",
                    "Status",
                    "Client",
                    "Current Phase",
                    "Start Date",
                    "End Date",
                    "Description",
                    "Edit",
                    "Delete"
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      sx={{
                        fontWeight: "bold",
                        color: "white",
                        borderBottom: "1px solid #E0E0E0",
                        py: 1.2,
                        fontSize: 13,
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredProjects
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((project, index) => (
                    <TableRow
                      key={project.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F7F8FA",
                        "&:hover": { backgroundColor: "#F1F3F4", cursor: "pointer" },
                        transition: "background-color 0.3s",
                      }}
                    >
                      {/* <TableCell>
                        <Link href={`/project-listing/${project.id}`}>
                          <Avatar
                            src={`https://via.placeholder.com/32/000000/FFFFFF?text=${project.title.charAt(0)}`}
                            sx={{ width: 32, height: 32, cursor: "pointer" }}
                          />
                        </Link>
                      </TableCell> */}
                      <TableCell sx={{ color: "#4A4A4A", fontWeight: 600 }}>
                        {project.project_code || "—"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/project-listing/${project.id}`} style={{ textDecoration: "none" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#4A4A4A",
                              "&:hover": { color: "#1976D2" },
                              fontWeight: 800,
                            }}
                          >
                            {project.title}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            ...getStatusChipStyle(project.status),
                            px: 2,
                            py: 0.5,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            fontSize: "12px",
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: getStatusChipStyle(project.status).color,
                              marginRight: "8px",
                            }}
                          />
                          {formatStatus(project.status)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "#4A4A4A" }}>
                        {project?.client_details?.length > 0 ? project?.client_details[0]?.name : "—"}
                      </TableCell>
                      <TableCell sx={{ color: "#4A4A4A" }}>{project.current_phase || "—"}</TableCell>
                      <TableCell sx={{ color: "#4A4A4A" }}>{formatDate(project.start_date)}</TableCell>
                      <TableCell sx={{ color: "#4A4A4A" }}>{formatDate(project.end_date)}</TableCell>
                      <TableCell sx={{ color: "#4A4A4A" }}>
                        <DescriptionCell description={project.description} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Project">
                        <IconButton
                          onClick={() =>
                            router.push(`/project-listing/add-new-project?id=${project.id}`)
                          }
                          size="small"
                          sx={{ color: "#1976D2" }}
                        >
                          <EditIcon sx={{ color: "var(--primary-color-1)" }} fontSize="small" />
                        </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                      <Tooltip title="Delete Project">
                        <IconButton
                          onClick={()=>handleProjectDelete(project.id)}
                          size="small"
                          sx={{ color: "red" }}
                        >
                          <DeleteIcon sx={{ color: "var(--primary-color-2)" }} fontSize="small" />
                        </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <CustomPagination
            page={page + 1}
            rowsPerPage={rowsPerPage}
            totalCount={filteredProjects.length}
            onPageChange={(_, newPage) => setPage(newPage - 1)}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default ProjectTable;