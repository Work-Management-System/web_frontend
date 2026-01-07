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
  IconButton,
  Collapse,
  Chip,
  Card,
  CardContent,
  Button,
  Popover,
  MenuItem,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Height,
} from "@mui/icons-material";
import createAxiosInstance from "@/app/axiosInstance";
import Breadcrumb from "../components/Breadcrumbs/Breadcrumb";
import { usePathname } from "next/navigation";
import AddRoleForm from "./AddRoleForm";
import TablePagination from '@mui/material/TablePagination';
import { exportRolesToExcel } from "@/utils/exports/ExportExcel";
import { exportRolesToDocx } from "@/utils/exports/ExportDocx";
import { CustomPagination } from "@/app/(AuthLayout)/components/Pagination/CustomPagination";
import Loader from "@/app/loading";
import { useAppselector } from "@/redux/store";

type Permission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

type Module = {
  key: string;
  name: string;
  permissions: Permission;
};

export type Role = {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  is_active: boolean;
  is_protected: boolean;
  is_visible: boolean;
  modules: Module[];
};

export default function RoleList() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [mode, setMode] = useState<'edit' | 'add'>("add");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const userPriyority = useAppselector((state) => state.role.value?.priority ?? 0);
  

  const pathName = usePathname();
  const axiosInstance = createAxiosInstance();
  const openpop = Boolean(anchorEl);

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, role: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const handleEdit = (role: any) => {
    handleClosePopover();
    setMode("edit");
    setOpen(true);
    setSelectedRole(role);
  };

  const handleDelete = () => {
    handleClosePopover();
  };
  const handleClose = () => {
    fetchRoles()
      .then(setRoles)
      .catch(console.error)
      .finally(() => setLoading(false));
    setOpen(false);
    setSelectedRole(null);
  }

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const fetchRoles = async () => {
    const res = await axiosInstance.get("/role-management/get-all");
    if (!res.data.status) throw new Error("Failed to fetch roles");
    return res.data.data;
  };
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
        <Loader />
    );
  }

  return (
    <>
      {userPriyority ==1 &&
      <Card sx={{ boxShadow: "4px 4px 10px 0px rgb(0 0 0 / 12%)", mb: 3 }}>
        <CardContent sx={{ padding: "16px 24px !important" }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>
}

      <Card sx={{ boxShadow: '4px 4px 10px 0px rgb(0 0 0 / 12%)' }}>
        <CardContent sx={{ padding: '20px' }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Typography variant="h5" sx={{ color: '#172b4d', fontWeight: 600 }}>
                            Role List
                        </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* <Button
                 variant="contained"
                 onClick={() =>exportRolesToDocx(roles)}
                 sx={{ ml: 2, backgroundColor: "var(--primary-color-1)", color: "white", "&:hover": { backgroundColor: "var(--primary-color-2)" } }}
               >
                 Export Roles DOCX
               </Button>
                <Button
                 variant="contained"
                 onClick={() => exportRolesToExcel(roles)}
                 sx={{ ml: 2, backgroundColor: "var(--primary-color-1)", color: "white", "&:hover": { backgroundColor: "var(--primary-color-2)" } }}
               >
                 Export Roles Excel
               </Button> */}
              <Button type="submit" variant="contained" onClick={() => setOpen(true)} sx={{
                backgroundColor: "var(--primary-color-1)" /* #0798bd */,
                color: "white" /* #ffffff */,
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "var(--primary-color-1-hover)" /* #0799bdc8 */,
                },
              }}>        Add New Role
              </Button>
            </Box>

          </Box>

          {/* Add Role Modal */}
          <AddRoleForm open={open} handleClose={handleClose} mode={mode} roleData={selectedRole} />

          {/* Role List Section */}
          <Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'var(--primary-color-1)', height: 50 }}>
                    {[
                      "Permissions", "Role Name", "Description", "Tag",
                      "Status", "Protected", "Visible", "Actions"
                    ].map((header) => (
                      <TableCell
                        key={header}
                        sx={{ color: 'white', fontWeight: 'bold' }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {roles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => (
                    <React.Fragment key={role.id}>
                      {/* Main Row */}
                      <TableRow hover>
                        <TableCell>
                          <IconButton onClick={() => toggleRow(role.id)} size="small">
                            {expandedRow === role.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description || "—"}</TableCell>
                        <TableCell>{role.tag || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={role.is_active ? "Active" : "Inactive"}
                            color={role.is_active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.is_protected ? "Yes" : "No"}
                            color={role.is_protected ? "warning" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={role.is_visible ? "Yes" : "No"}
                            color={role.is_visible ? "primary" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEdit(role)}>
                            <EditIcon sx={{ color: "green" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Permissions */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse in={expandedRow === role.id} timeout="auto" unmountOnExit>
                            <Box margin={2}>
                              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                                Module Permissions
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Module Name</TableCell>
                                    <TableCell align="center">Read</TableCell>
                                    <TableCell align="center">Create</TableCell>
                                    <TableCell align="center">Update</TableCell>
                                    <TableCell align="center">Delete</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {role.modules.map((mod) => (
                                    <TableRow key={mod.key}>
                                      <TableCell>{mod.name}</TableCell>
                                      <TableCell align="center">
                                        {mod.permissions.read ? "✅" : "❌"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {mod.permissions.create ? "✅" : "❌"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {mod.permissions.update ? "✅" : "❌"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {mod.permissions.delete ? "✅" : "❌"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {/* <TablePagination
        component="div"
        count={roles.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      /> */}
            <CustomPagination
              page={page + 1} // convert 0-based page to 1-based
              rowsPerPage={rowsPerPage}
              totalCount={roles.length}
              onPageChange={(_, newPage) => setPage(newPage - 1)} // convert 1-based to 0-based
            />

          </Box>
        </CardContent>
      </Card>
    </>

  );
}
