'use client';
import createAxiosInstance from '@/app/axiosInstance';
import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  InputLabel,
  Chip,
  Input,
  Tooltip,
  Autocomplete,
  Popover,
} from '@mui/material';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Toaster, toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';
import { uploadFile } from '@/utils/UploadFile';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Edit, Email, Phone, AssignmentTurnedIn, Delete, Visibility as VisibilityIcon, Close as CloseIcon, OpenInNew as OpenInNewIcon, PersonAddAlt as PersonAddAltIcon } from '@mui/icons-material';
import { exportUsersToDocx } from '@/utils/exports/ExportDocx';
import { exportUsersToExcel } from '@/utils/exports/ExportExcel';
import { CustomPagination } from '@/app/(AuthLayout)/components/Pagination/CustomPagination';
import ExportFileDropdown from '@/utils/exports/ExportFilesDropDown';
import Cookies from 'js-cookie';
import { useAppselector } from "@/redux/store";
import confirmAndDelete from '@/utils/delete-confirm';
import Loader from '@/app/loading';
import SearchIcon from '@mui/icons-material/Search';
import RequiredLabel from '../layout/shared/logo/RequiredLabel';
import { Department } from '../settings/DepartmentSettings';
import { Designation } from '../settings/DesignationSettings';

type Role = {
  id: string;
  name: string;
  priority: number;
};

export type User = {
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

const getStatusChipStyle = (status: boolean) => {
  return status
    ? { backgroundColor: '#E8F5E9', color: '#43A047' }
    : { backgroundColor: '#FFEBEE', color: '#D32F2F' };
};

const getEmailChipStyle = (email: string) => {
  return email
    ? { backgroundColor: '#F3E5F5', color: '#8E24AA' }
    : { backgroundColor: '#E8ECEF', color: '#1A73E8' };
};

const getPhoneChipStyle = (phone: string | null | undefined) => {
  return phone
    ? { backgroundColor: '#E0F2F1', color: '#00695C' }
    : { backgroundColor: '#E8ECEF', color: '#1A73E8' };
};

const getAddressColor = (address: any | undefined) => {
  return address ? '#4A4A4A' : '#B0BEC5';
};

const bgColor = 'var(--bg-color)';
const borderFocus = 'var(--border-focus-color)';
const buttonColor = 'var(--primary-color-2)';

export default function UsersListTable() {
  const pathName = usePathname();
  const currentUser = useAppselector(state => state.role.value);
  const [users, setUsers] = useState<User[]>([]);
  const [filterUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");  
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [detailsAnchorEl, setDetailsAnchorEl] = useState<HTMLElement | null>(null);

  const axiosInstance = createAxiosInstance();
  const tenant = Cookies.get('tenant');

  // Get current user's role priority
  const currentUserPriority = currentUser?.priority || 4; // Default to Employee priority if undefined

  const fetchUsers = async (searchQuery = '') => {
    const res = await axiosInstance.get('/user/list', {
      params: searchQuery ? { name: searchQuery } : {},
    });
    if (!res.data.status) throw new Error('Failed to fetch users');
    return res.data.data;
  };  

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get('/role-management/get-all');
      if (response.status === 200) {
        // Remove duplicates by creating a Map
        const uniqueRoles: Role[] = Array.from(
          new Map((response.data.data as Role[]).map((role: Role) => [role.id, role])).values()
        );
        // Filter roles based on current user's role priority
        const filteredRoles: Role[] = uniqueRoles.filter(
          (role: Role) => role.priority >= (currentUserPriority === 1 ? 2 : currentUserPriority)
        );
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    if (currentUserPriority === 4) {
      toast.error('You do not have permission to access this page.');
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchQuery)
        .then(setUsers)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [currentUser, currentUserPriority,refresh, searchQuery]);

  const handleAssignRoleDialog = (user: User) => {
    setEditUser(user);
    fetchRoles();
    setOpenRoleDialog(true);
  };

  const handleEditClick = (user: User) => {
    setEditUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenRoleDialog(false);
    setOpenBulkDialog(false);
    setEditUser(null);
    setBulkFile(null);
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 12));
    setPage(0);
  };
    const handleDeleteUser=async(userId:string)=>{
    await confirmAndDelete({
    title: 'Delete User?',
    confirmButtonText: 'Yes, delete user!',
    successText: 'User has been deleted.',
    apiEndpoint: `/user/delete/${userId}`,
    text: 'This user will be permanently deleted!',
    onSuccess: async () => {
      setRefresh((prev)=>prev+1)
    },
  });
  }

const handleDownloadSampleExcel = async () => {
  try {
    console.log('Requesting URL:', axiosInstance.defaults.baseURL + '/users/sample-excel');
    const response = await axiosInstance.get('/user/sample-excel', {
      responseType: 'blob', // Expect binary data
      timeout: 10000, // 10-second timeout to avoid hanging
    });
    console.log('Response:', response);
    console.log('Response data type:', response.data instanceof Blob);

    // Check if response is a Blob (file) or JSON (error)
    const contentType = response.headers['content-type'];
    if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk-user-upload-template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Sample Excel downloaded successfully');
    } else {
      // Handle error response (likely JSON)
      const text = await response.data.text(); // Convert Blob to text
      const errorData = JSON.parse(text); // Parse JSON error
      throw new Error(errorData.message || 'Failed to download sample Excel');
    }
  } catch (error) {
    console.error('Failed to download sample Excel:', error.response || error.message);
    toast.error(error.message || 'Failed to download sample Excel');
  }
};

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBulkFile(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!tenant) {
      toast.error('Tenant ID not found');
      return;
    }
    setBulkLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const response = await axiosInstance.post(`/user/bulk-upload/${tenant}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Bulk upload successful: ${response.data.success} users added`);
      fetchUsers().then(setUsers);
      handleCloseDialog();
    } catch (error) {
      const err = error as AxiosError<any>;
      console.error('Bulk upload failed:', err);
      toast.error(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
        <Loader/>
    );
  }

  // If user is Employee, don't render the page
  if (currentUserPriority === 4) {
    return null;
  }

  return (
    <>
      <Card sx={{ boxShadow: '4px 4px 10px 0px rgb(0 0 0 / 12%)', mb: 2 }}>
        <CardContent sx={{ padding: '15px 20px !important' }}>
          <Breadcrumb pageName={pathName} />
        </CardContent>
      </Card>

      <Card
        sx={{
          mt: '25px',
          backgroundColor: '#f8fafc',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
        }}
      >
        <CardContent sx={{ padding: '20px 20px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#0f172a' }}>
              Employees
            </Typography>
            <Toaster position="top-right" reverseOrder={false} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                variant="outlined"
                fullWidth
                placeholder="Search by user name..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: 'var(--primary-color-1)', mr: 1 }} />
                  ),
                }}
                sx={{
                  width: '260px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--primary-color-1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--primary-color-2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary-color-2)',
                    },
                  },
                  backgroundColor: '#ffffff',
                  borderRadius: '999px',
                }}
              />
              <ExportFileDropdown
                data={users}
                exportToExcel={exportUsersToExcel}
                exportToDocx={exportUsersToDocx}
                label="Export Users"
              />
              {currentUserPriority < 3 && (
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'var(--primary-color-1)',
                    color: 'var(--text-color-2)',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderRadius: '999px',
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'var(--primary-color-1-hover)',
                    },
                  }}
                  onClick={() => setOpenBulkDialog(true)}
                >
                  Bulk Upload
                </Button>
              )}
              <Link href="/users/add-new-user" passHref>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: 'var(--primary-color-2)',
                    color: 'var(--text-color-2)',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    borderRadius: '999px',
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'var(--primary-color-1-hover)',
                    },
                  }}
                >
                  Add New User
                </Button>
              </Link>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2.5,
            }}
          >
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => {
                const targetUserPriority = user.role?.priority || 4;
                const canEditOrAssign =
                  currentUserPriority <= 2 ||
                  (currentUserPriority === 3 && targetUserPriority >= 3);

                const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

                return (
                  <Box
                    key={user.id}
                    sx={{
                      position: 'relative',
                      borderRadius: '18px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 18px rgba(15, 23, 42, 0.05)',
                      p: 1.75,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.6,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.10)',
                        borderColor: 'var(--primary-color-1)',
                      },
                    }}
                  >
                    {/* Top row: avatar on left, name + employee code + status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                      <Link href={`/users/${user.id}`}>
                      <Avatar
                        src={user.profile_image || ''}
                        alt={`${user.first_name} ${user.last_name}`}
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: 'var(--primary-color-1)',
                          fontSize: 18,
                          fontWeight: 600,
                          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.18)',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            bgcolor: 'var(--primary-color-2)',
                          },
                        }}
                      >
                        {!user.profile_image && initials}
                      </Avatar>
                      </Link>
                      <Box sx={{ minWidth: 0 }} className="user-name-container">
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: '#0f172a',
                            lineHeight: 1.2,
                            mb: 0.25,
                            wordBreak: 'break-word',
                          }}
                        >
                          <Link
                            href={`/users/${user.id}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                              transition: 'color 0.2s',
                            }}
                            className="user-name-link"
                            onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-color-2)'; }}
                            onMouseOut={e => { e.currentTarget.style.color = 'inherit'; }}
                          >
                            {user.first_name} {user.last_name}
                          </Link>
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {user.employeeCode && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#64748b',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {user.employeeCode}
                            </Typography>
                          )}
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              borderRadius: '999px',
                              fontSize: 10,
                              fontWeight: 600,
                              backgroundColor: user.is_active
                                ? 'rgba(22, 163, 74, 0.08)'
                                : 'rgba(220, 38, 38, 0.08)',
                              color: user.is_active ? '#15803d' : '#b91c1c',
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* Lower content: role, department, contact (non-clickable) */}
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#0ea5e9',
                          fontWeight: 500,
                          mb: 0.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: 13,
                        }}
                      >
                        {user.designation || '—'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#64748b',
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {user.department || 'No department'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.75, gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                          <Email sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'block',
                            }}
                          >
                            {user.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone sx={{ fontSize: 13, color: '#94a3b8' }} />
                          <Typography variant="caption" sx={{ color: '#0f172a' }}>
                            {user.phone || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        // mt: 1.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box />{/* left spacer to keep actions on lower line */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit User">
                          <span>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(user);
                              }}
                              disabled={!canEditOrAssign}
                              sx={{ opacity: canEditOrAssign ? 1 : 0.5 }}
                            >
                              <Edit sx={{ color: '#0f172a', fontSize: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="View Info">
                          <span>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsUser(user);
                                setDetailsAnchorEl(e.currentTarget);
                              }}
                            >
                              <VisibilityIcon sx={{ color: 'var(--primary-color-1)', fontSize: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Assign Role">
                          <span>
                            <IconButton
                              size="small"
                              disabled={!canEditOrAssign}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignRoleDialog(user);
                              }}
                              sx={{
                                opacity: canEditOrAssign ? 1 : 0.5,
                                color: 'var(--primary-color-1)',
                              }}
                            >
                              <PersonAddAltIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
          </Box>

          <Box sx={{ mt: 3 }}>
            <CustomPagination
              page={page + 1}
              rowsPerPage={rowsPerPage}
              totalCount={users.length}
              onPageChange={(_, newPage) => setPage(newPage - 1)}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Contact details popover (anchored to View button) */}
      <Popover
        open={Boolean(detailsUser && detailsAnchorEl)}
        anchorEl={detailsAnchorEl}
        onClose={() => {
          setDetailsUser(null);
          setDetailsAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1.25,
            width: 420,
            maxWidth: '95vw',
          },
        }}
      >
        {detailsUser && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={detailsUser.profile_image || ''}
                  alt={`${detailsUser.first_name} ${detailsUser.last_name}`}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'var(--primary-color-1)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {(!detailsUser.profile_image &&
                    `${detailsUser.first_name?.[0] || ''}${detailsUser.last_name?.[0] || ''}`.toUpperCase()) ||
                    ''}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>
                    {detailsUser.first_name} {detailsUser.last_name}
                  </Typography>
                  {detailsUser.employeeCode && (
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: 11 }}>
                      {detailsUser.employeeCode}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Chip
                  label={detailsUser.is_active ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    borderRadius: '999px',
                    fontSize: 10,
                    fontWeight: 600,
                    backgroundColor: detailsUser.is_active
                      ? 'rgba(22, 163, 74, 0.08)'
                      : 'rgba(220, 38, 38, 0.08)',
                    color: detailsUser.is_active ? '#15803d' : '#b91c1c',
                  }}
                />
                <Tooltip title="Open profile">
                  <IconButton
                    size="small"
                    component={Link}
                    href={`/users/${detailsUser.id}`}
                    sx={{ color: 'var(--primary-color-1)' }}
                  >
                    <OpenInNewIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={() => {
                    setDetailsUser(null);
                    setDetailsAnchorEl(null);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 600, fontSize: 11 }}>
              Contact Details
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Email sx={{ fontSize: 18, color: '#64748b' }} />
              <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                {detailsUser.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Phone sx={{ fontSize: 18, color: '#64748b' }} />
              <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                {detailsUser.phone || '—'}
              </Typography>
            </Box>

            {(() => {
              const managerUser =
                detailsUser.reporting_manager &&
                users.find((u) => u.id === detailsUser.reporting_manager);
              const managerName = managerUser
                ? `${managerUser.first_name} ${managerUser.last_name}${
                    managerUser.employeeCode ? ` (${managerUser.employeeCode})` : ''
                  }`
                : 'Not set';

              return (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                    columnGap: 2,
                    rowGap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      LOCATION
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.address || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      JOB TITLE
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.designation || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      DEPARTMENT
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.department || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      REPORTING MANAGER
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {managerName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      JOINING DATE
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.joiningDate || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      ROLE
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.role?.name || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      BLOOD GROUP
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.blood_group || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      GENDER
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.gender || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      DATE OF BIRTH
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.dob || 'Not set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', letterSpacing: 0.5, fontSize: 9 }}>
                      EMERGENCY CONTACT
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', fontSize: 11 }}>
                      {detailsUser.emergency_contact || 'Not set'}
                    </Typography>
                  </Box>
                </Box>
              );
            })()}
          </Box>
        )}
      </Popover>

      {editUser && (
        <EditUserDialog
          open={openDialog}
          onClose={handleCloseDialog}
          user={editUser}
          roles={roles}
          onUpdate={() => fetchUsers().then(setUsers)}
          profileEditMode={false}
          currentUserPriority={currentUserPriority}
        />
      )}
      {openRoleDialog && (
        <AssignRoleDialog
          open={openRoleDialog}
          onClose={handleCloseDialog}
          user={editUser}
          roles={roles}
          onUpdate={() => fetchUsers().then(setUsers)}
          currentUserPriority={currentUserPriority}
        />
      )}
      <Dialog open={openBulkDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            mb: 2,
            textAlign: 'center',
            background: 'linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))',
          }}
        >
          Bulk Upload Users
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              sx={{
                color: 'var(--primary-color-1)',
                borderColor: 'var(--primary-color-1)',
                '&:hover': {
                  borderColor: 'var(--primary-color-1-hover)',
                  backgroundColor: 'rgba(var(--primary-color-1-rgb), 0.1)',
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
                inputProps={{ accept: '.xlsx, .xls' }}
                onChange={handleBulkFileChange}
                sx={{
                  pt: 2,
                  pb: 1,
                  '& input': {
                    padding: '10px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    borderRadius: '7px',
                  },
                }}
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={bulkLoading} sx={{ color: 'var(--primary-color-1)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: 'var(--primary-color-1)',
              '&:hover': {
                backgroundColor: 'var(--primary-color-1-hover)',
              },
            }}
            onClick={handleBulkUpload}
            disabled={bulkLoading || !bulkFile}
          >
            {bulkLoading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  roles: Role[];
  onUpdate: () => void;
  profileEditMode?: boolean;
  currentUserPriority: number;
}

export function EditUserDialog({ open, onClose, user, roles, onUpdate, profileEditMode, currentUserPriority }: EditUserDialogProps) {
  const tenant = Cookies.get('tenant');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user.profile_image || null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const axiosInstance = createAxiosInstance();
  const [userList, setUserList] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const smallMobile = useMediaQuery('(min-width: 320px) and (max-width: 575px)');
  const biggerMobile = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 991px)');

  const validationSchema = Yup.object({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required(),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().optional(),
    address: Yup.string().optional(),
    designation: Yup.string().optional(),
    department: Yup.string().optional(),
    joiningDate: Yup.string().optional().nullable(),
    employeeCode: Yup.string().optional(),
    role_id: Yup.string().required(),
    tenant_id: Yup.string().optional(),
    profile_image: Yup.string().optional(),
    emergency_contact: Yup.string().optional(),
    blood_group: Yup.string().optional(),
    gender: Yup.string().optional(),
    dob: Yup.string().optional().nullable(),
    reporting_manager: Yup.string().optional(),
  });

  // Helper function to format date to YYYY-MM-DD for HTML date input
  const formatDateForInput = (dateValue: string | Date | null | undefined): string => {
    if (!dateValue) return '';
    
    // If it's a Date object, format it directly
    if (dateValue instanceof Date) {
      const d = dateValue;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // If it's already a string in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's an ISO string with time (e.g., "2000-01-10T00:00:00.000Z"), extract the date part
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      const datePart = dateValue.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    
    // Try parsing with dayjs and format to YYYY-MM-DD
    const parsed = dayjs(dateValue);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
    
    // Try parsing DD/MM/YYYY format (common in some locales)
    if (typeof dateValue === 'string') {
      const ddmmyyyy = dateValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        return `${year}-${month}-${day}`;
      }
      
      // Try parsing MM/DD/YYYY format
      const mmddyyyy = dateValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (mmddyyyy) {
        const [, month, day, year] = mmddyyyy;
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  const formik = useFormik({
    initialValues: {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      designation: user.designation || '',
      department: user.department || '',
      joiningDate: formatDateForInput(user.joiningDate),
      employeeCode: user.employeeCode || '',
      role_id: user.role?.id || '',
      role_name: user.role?.name || '',
      tenant_id: tenant,
      profile_image: user.profile_image || '',
      emergency_contact: user.emergency_contact || '',
      blood_group: user.blood_group || '',
      gender: user.gender || '',
      dob: formatDateForInput(user.dob),
      reporting_manager: user.reporting_manager || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        let uploadedProfileImageUrl = values.profile_image;
        if (profileImageFile) {
          uploadedProfileImageUrl = await uploadFile(profileImageFile);
        }

        const payload: {
          first_name: string;
          last_name: string;
          email: string;
          phone?: string;
          address?: string;
          designation?: string;
          department?: string;
          joiningDate?: string;
          employeeCode?: string;
          role_id?: string;
          tenant_id: string;
          profile_image?: string;
          emergency_contact?: string;
          blood_group?: string;
          gender?: string;
          dob?: string;
          reporting_manager?: string;
        } = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          ...(values.phone && { phone: values.phone.trim() }),
          ...(values.address && { address: values.address }),
          ...(values.designation && { designation: values.designation }),
          ...(values.department && { department: values.department }),
          ...(values.joiningDate && /^\d{4}-\d{2}-\d{2}$/.test(values.joiningDate) && { joiningDate: values.joiningDate }),
          ...(values.employeeCode && { employeeCode: values.employeeCode }),
          ...(values.role_id && { role_id: values.role_id }),
          tenant_id: values.tenant_id,
          ...(uploadedProfileImageUrl && { profile_image: uploadedProfileImageUrl }),
          ...(values.emergency_contact && { emergency_contact: values.emergency_contact.trim() }),
          ...(values.blood_group && { blood_group: values.blood_group }),
          ...(values.gender && { gender: values.gender }),
          ...(values.dob && /^\d{4}-\d{2}-\d{2}$/.test(values.dob) && { dob: values.dob }),
          ...(values.reporting_manager && { reporting_manager: values.reporting_manager }),
        };

        const response = await axiosInstance.patch(`/user/update/${user.id}`, payload);
        toast.success(response?.data?.message || 'User updated successfully');
        onUpdate();
        onClose();
      } catch (err) {
        const error = err as AxiosError<any>;
        console.error('Error updating user:', error);
        toast.error(error?.response?.data?.message || 'Failed to update user');
      } finally {
        setLoading(false);
      }
    },
  });
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/department/get-all-active");
      console.log("Fetch departments response:", res.data);
      if (res.data.status !== "success") throw new Error("Failed to fetch Departments");
      setDepartments(res.data.data || []);
      // toast.success(res.data.message || "Departments fetched successfully");
    } catch (error) {
      console.error("Error fetching departments:", error.response?.data, error.message);
      toast.error(error?.response?.data?.message || "Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
          try {
              setLoading(true);
              const res = await axiosInstance.get("/designation/get-all-active" );
              console.log("Fetch Designation response:", res.data);
              if (res.data.status !== "success") throw new Error("Failed to fetch Designations");
              setDesignations(res.data.data || []);
          } catch (error) {
              console.error("Error fetching designations:", error.response?.data, error.message);
              toast.error(error?.response?.data?.message || "Failed to fetch designations");
          } finally {
              setLoading(false);
          }
      };
  
  const handlePhoneChange = (value2: string, country: any) => {
    const dialCode = country?.dialCode || '91';
    const formatted = `+${dialCode} ${value2.slice(dialCode.length)}`;
    formik.setFieldValue('phone', formatted);
  };

  const handleemergency_contact = (value2: string, country: any) => {
    const dialCode = country?.dialCode || '91';
    const formatted = `+${dialCode} ${value2.slice(dialCode.length)}`;
    formik.setFieldValue('emergency_contact', formatted);
  };

  const handleProfileFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setProfileImage(URL.createObjectURL(selectedFile));
      setProfileImageFile(selectedFile);
      formik.setFieldValue('profile_image', selectedFile.name);
    }
  };

  const Bloodgroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female','Others'];

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get('/user/list');
        setUserList(response.data.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
    fetchDepartments();
    fetchDesignations();
  }, []);

  const targetUserPriority = user.role?.priority || 4;
  const canEditRole = currentUserPriority <= 2 || (currentUserPriority === 3 && targetUserPriority >= 3);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Box sx={{}}>
          <form onSubmit={formik.handleSubmit}>
            <Box sx={{ height: '190px' }}>
              <Box
                className="cover-box"
                sx={{
                  width: '100%',
                  height: '100px',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  mx: 'auto',
                  position: 'relative',
                  borderRadius: '12px',
                  backgroundColor: '#ddd',
                }}
              ></Box>
              <Box
                sx={{
                  width: '160px',
                  height: '160px',
                  background: '#ddd',
                  mx: 'auto',
                  borderRadius: '50%',
                  position: 'relative',
                  top: '-100px',
                  zIndex: 1,
                  border: '5px solid white',
                }}
                mt={4}
              >
                <label htmlFor="profile-image-input">
                  <input
                    id="profile-image-input"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleProfileFileInputChange}
                    ref={profileInputRef}
                  />
                  <Avatar
                    className="editProfile"
                    src={profileImage || ''}
                    sx={{
                      mx: 'auto',
                      width: '100%',
                      height: '100%',
                      border: '5px solid #f1f1f1',
                      boxShadow: '0px 0px 5px -2px',
                      alignItems: 'center',
                      '&:hover': {
                        filter: 'brightness(50%)',
                      },
                    }}
                  />
                </label>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'left',
                marginTop: 'px',
                gap: '6px 27px',
                paddingTop: '25px',
              }}
            >
              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}><RequiredLabel label="First Name" /></label>
                <TextField
                  type="text"
                  placeholder="Enter Your First Name"
                  name="first_name"
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  sx={{
                    width: '100%',
                    marginBottom: '0px',
                    backgroundColor: bgColor,
                    '& input': {
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      borderRadius: '7px',
                      height: 'auto',
                    },
                    '& input .Mui-focused': { border: borderFocus },
                    '& label': { fontSize: '14px', top: '-5px' },
                    '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                    '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                    '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: borderFocus,
                      borderRadius: '7px',
                    },
                  }}
                />
                {formik.touched.first_name && formik.errors.first_name && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.first_name}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}><RequiredLabel label="Last Name" /></label>
                <TextField
                  type="text"
                  placeholder="Enter Your Last Name"
                  name="last_name"
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  sx={{
                    width: '100%',
                    marginBottom: '0px',
                    backgroundColor: bgColor,
                    '& input': {
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      borderRadius: '7px',
                      height: 'auto',
                    },
                    '& input .Mui-focused': { border: borderFocus },
                    '& label': { fontSize: '14px', top: '-5px' },
                    '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                    '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                    '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: borderFocus,
                      borderRadius: '7px',
                    },
                  }}
                />
                {formik.touched.last_name && formik.errors.last_name && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.last_name}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}>Phone Number</label>
                <PhoneInput
                  country={'in'}
                  value={formik.values.phone}
                  onChange={(value2, country) => handlePhoneChange(value2, country)}
                  inputStyle={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '7px',
                    border: '1px solid #ddd',
                    paddingLeft: '48px',
                    fontSize: '14px',
                  }}
                  dropdownStyle={{ borderRadius: '7px' }}
                />
                {formik.touched.phone && formik.errors.phone && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.phone}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}><RequiredLabel label="Email" /></label>
                <TextField
                  type="email"
                  placeholder="Enter Your Email Address"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  disabled={profileEditMode}
                  sx={{
                    width: '100%',
                    marginBottom: '0px',
                    backgroundColor: bgColor,
                    '& input': {
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      borderRadius: '7px',
                      height: 'auto',
                    },
                    '& input .Mui-focused': { border: borderFocus },
                    '& label': { fontSize: '14px', top: '-5px' },
                    '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                    '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                    '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: borderFocus,
                      borderRadius: '7px',
                    },
                  }}
                />
                {formik.touched.email && formik.errors.email && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.email}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}>Address</label>
                <TextField
                  type="text"
                  placeholder="Enter Your Address"
                  name="address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  sx={{
                    width: '100%',
                    marginBottom: '0px',
                    backgroundColor: bgColor,
                    '& input': {
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      borderRadius: '7px',
                      height: 'auto',
                    },
                    '& input .Mui-focused': { border: borderFocus },
                    '& label': { fontSize: '14px', top: '-5px' },
                    '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                    '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                    '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: borderFocus,
                      borderRadius: '7px',
                    },
                  }}
                />
                {formik.touched.address && formik.errors.address && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.address}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                  position: 'relative',
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }} htmlFor="dob">
                  Date Of Birth
                </label>
                <TextField
                  type="date"
                  id="dob"
                  name="dob"
                  value={formik.values.dob || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  fullWidth
                  sx={{
                    width: '100%',
                    backgroundColor: bgColor,
                    '& input': {
                      padding: '10px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      borderRadius: '7px',
                      height: 'auto',
                    },
                    '& fieldset': {
                      border: '1px solid #ddd',
                      borderRadius: '7px',
                    },
                  }}
                />
                {formik.touched.dob && formik.errors.dob && (
                  <Typography variant="body2" color="error" sx={{ mt: '4px' }}>
                    {formik.errors.dob}
                  </Typography>
                )}
              </Box>

                  {/* <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label style={{ marginBottom: '7px', fontSize: '14px' }} htmlFor="role">
                      <RequiredLabel label="Role" />
                    </label>
                    <FormControl fullWidth>
                      <Select
                        id="role-select"
                        name="role_id"
                        value={formik.values.role_id || ''}
                        onChange={formik.handleChange}
                        MenuProps={MenuProps}
                        displayEmpty
                        disabled={!canEditRole}
                        sx={{
                          width: '100%',
                          marginBottom: '0px',
                          backgroundColor: bgColor,
                          height: '44px',
                          '& select': {
                            padding: '10px',
                            border: '1px solid #ddd',
                            fontSize: '14px',
                            borderRadius: '7px',
                            height: 'auto',
                          },
                          '& select .Mui-focused': { border: borderFocus },
                          '& label': { fontSize: '14px', top: '-5px' },
                          '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                          '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                          '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: borderFocus,
                            borderRadius: '7px',
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select a role
                        </MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {formik.touched.role_id && formik.errors.role_id && (
                      <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                        {formik.errors.role_id}
                      </Typography>
                    )}
                    {!canEditRole && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        You do not have permission to edit the role of an Administrator.
                      </Typography>
                    )}
                  </Box> */}
              {!profileEditMode && (
                <>
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px' }}
                      htmlFor="reporting_manager"
                    >
                      Reporting Manager
                    </label>
                    <FormControl fullWidth>
                      <Autocomplete
                        id="reporting_manager"
                        options={userList}
                        getOptionLabel={(option) =>
                          `${option.first_name} ${option.last_name}${option.employeeCode ? ` (${option.employeeCode})` : ''}`
                        }
                        loading={loading}
                        value={
                          userList.find((user) => user.id === formik.values.reporting_manager) || null
                        }
                        onChange={(_, selectedOption) => {
                          formik.setFieldValue('reporting_manager', selectedOption?.id || '');
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="reporting_manager"
                            placeholder="Select Reporting Manager"
                            variant="outlined"
                            error={
                              formik.touched.reporting_manager &&
                              Boolean(formik.errors.reporting_manager)
                            }
                            helperText={
                              formik.touched.reporting_manager && formik.errors.reporting_manager
                            }
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                backgroundColor: bgColor,
                                height: '44px',
                                fontSize: '14px',
                                borderRadius: '7px',
                              },
                              endAdornment: (
                                <>
                                  {loading ? <CircularProgress size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </FormControl>
                  </Box>
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px', display: 'block' }}
                      htmlFor="designation"
                    >
                      <RequiredLabel label="Designation" />
                    </label>
                    <Autocomplete
                      id="designation"
                      options={designations}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.name === value.name}
                      value={
                        designations.find((desig) => desig.name === formik.values.designation) || null
                      }
                      onChange={(_, value) =>
                        formik.setFieldValue('designation', value ? value.name : '')
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Designation"
                          fullWidth
                          sx={{
                            backgroundColor: bgColor,
                            fontSize: '13px',
                            '& .MuiOutlinedInput-root': {
                              height: '41px',
                              borderRadius: '7px',
                              fontSize: '13px',
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: borderFocus,
                            },
                            '& input': {
                              padding: '10px',
                            },
                          }}
                          error={formik.touched.designation && Boolean(formik.errors.designation)}
                          helperText={formik.touched.designation && formik.errors.designation}
                          onBlur={formik.handleBlur}
                        />
                      )}
                    />
                  </Box>
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label
                      style={{ marginBottom: '7px', fontSize: '14px', display: 'block' }}
                      htmlFor="department"
                    >
                      Department
                    </label>
                    <Autocomplete
                      id="department"
                      options={departments}
                      getOptionLabel={(option) => option.name}
                      isOptionEqualToValue={(option, value) => option.name === value.name}
                      value={
                        departments.find((dept) => dept.name === formik.values.department) || null
                      }
                      onChange={(_, value) =>
                        formik.setFieldValue('department', value ? value.name : '')
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Department"
                          fullWidth
                          sx={{
                            backgroundColor: bgColor,
                            fontSize: '13px',
                            '& .MuiOutlinedInput-root': {
                              height: '41px',
                              borderRadius: '7px',
                              fontSize: '13px',
                            },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: borderFocus,
                            },
                            '& input': {
                              padding: '10px',
                            },
                          }}
                          error={formik.touched.department && Boolean(formik.errors.department)}
                          helperText={formik.touched.department && formik.errors.department}
                          onBlur={formik.handleBlur}
                        />
                      )}
                    />
                  </Box>
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Joining Date</label>
                    <TextField
                      type="date"
                      name="joiningDate"
                      value={formik.values.joiningDate}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': {
                          padding: '10px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          borderRadius: '7px',
                          height: 'auto',
                        },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.joiningDate && formik.errors.joiningDate && (
                      <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                        {formik.errors.joiningDate}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      textAlign: 'left',
                      width: '31%',
                      ...(smallMobile && { width: '100%' }),
                      ...(biggerMobile && { width: '47%' }),
                      ...(tablet && { width: '30%' }),
                    }}
                  >
                    <label style={{ marginBottom: '7px', fontSize: '14px' }}>Employee Code</label>
                    <TextField
                      type="text"
                      placeholder="Enter Employee Code"
                      name="employeeCode"
                      value={formik.values.employeeCode}
                      onChange={formik.handleChange}
                      sx={{
                        width: '100%',
                        marginBottom: '0px',
                        backgroundColor: bgColor,
                        '& input': {
                          padding: '10px',
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          borderRadius: '7px',
                          height: 'auto',
                        },
                        '& input .Mui-focused': { border: borderFocus },
                        '& label': { fontSize: '14px', top: '-5px' },
                        '& label.Mui-focused': { fontSize: '16px', top: '0px', color: buttonColor },
                        '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                        '& .css-mun56l-MuiInputBase-root-MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: borderFocus,
                          borderRadius: '7px',
                        },
                      }}
                    />
                    {formik.touched.employeeCode && formik.errors.employeeCode && (
                      <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                        {formik.errors.employeeCode}
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}>Emergency Contact</label>
                <PhoneInput
                  country={'in'}
                  value={formik.values.emergency_contact}
                  onChange={(value2, country) => handleemergency_contact(value2, country)}
                  inputStyle={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '7px',
                    border: '1px solid #ddd',
                    paddingLeft: '48px',
                    fontSize: '14px',
                  }}
                  dropdownStyle={{ borderRadius: '7px' }}
                />
                {formik.touched.emergency_contact && formik.errors.emergency_contact && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.emergency_contact}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}>Blood Group</label>
                <FormControl fullWidth>
                  <Select
                    name="blood_group"
                    value={formik.values.blood_group || ''}
                    onChange={formik.handleChange}
                    displayEmpty
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      height: '44px',
                      '& .MuiSelect-select': {
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '7px',
                      },
                      '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                      '&.Mui-focused fieldset': { border: borderFocus },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select Your Blood Group
                    </MenuItem>
                    {Bloodgroups.map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formik.touched.blood_group && formik.errors.blood_group && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.blood_group}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  width: '31%',
                  ...(smallMobile && { width: '100%' }),
                  ...(biggerMobile && { width: '47%' }),
                  ...(tablet && { width: '30%' }),
                }}
              >
                <label style={{ marginBottom: '7px', fontSize: '14px' }}>Gender</label>
                <FormControl fullWidth>
                  <Select
                    name="gender"
                    value={formik.values.gender || ''}
                    onChange={formik.handleChange}
                    displayEmpty
                    sx={{
                      width: '100%',
                      marginBottom: '0px',
                      backgroundColor: bgColor,
                      height: '44px',
                      '& .MuiSelect-select': {
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '7px',
                      },
                      '& fieldset': { border: '1px solid #ddd', borderRadius: '7px' },
                      '&.Mui-focused fieldset': { border: borderFocus },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select Gender
                    </MenuItem>
                    {genders.map((gender) => (
                      <MenuItem key={gender} value={gender}>
                        {gender}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formik.touched.gender && formik.errors.gender && (
                  <Typography variant="body2" color="error" sx={{ mb: '0px' }}>
                    {formik.errors.gender}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ width: '100%', textAlign: 'center', marginTop: '30px' }}>
              <Button
                onClick={onClose}
                variant="contained"
                sx={{
                  backgroundColor: '#ddd',
                  color: '#000',
                  borderRadius: '35px',
                  padding: '10px 50px',
                  marginRight: '10px',
                  '&:hover': { backgroundColor: '#ccc' },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !formik.dirty}
                sx={{
                  backgroundColor: 'var(--primary-color-1)',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'var(--primary-color-1-hover)',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'var(--primary-color-1)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                  borderRadius: '35px',
                  padding: '10px 50px',
                  margin: '0 auto',
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Update'}
              </Button>
            </Box>
          </form>
          <Toaster position="top-right" toastOptions={{ className: 'react-hot-toast' }} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

interface AssignRoleDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  roles: Role[];
  onUpdate: () => void;
  currentUserPriority: number;
}

const AssignRoleDialog = ({ open, onClose, user, roles, onUpdate, currentUserPriority }: AssignRoleDialogProps) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const axiosInstance = createAxiosInstance();

  useEffect(() => {
    if (open && user?.id) {
      const fetchAssignedRoles = async () => {
        try {
          const response = await axiosInstance.get(`/role-management/get-roles/${user.id}`);
          console.log('Assigned roles fetched:', response.data.data); // Debug log
          if (response.data.status === 'success') {
            const assignedRoleIds = Array.from(new Set(response.data.data.map((item: any) => item.role.id))) as string[]; // Ensure unique role IDs
            setAssignedRoles(assignedRoleIds);
            setSelectedRoles(assignedRoleIds);
          }
        } catch (err) {
          console.error('Failed to fetch assigned roles:', err);
          toast.error('Failed to fetch assigned roles');
        }
      };
      fetchAssignedRoles();
    }
  }, [open, user?.id]);

  const handleRoleChange = (event: any) => {
    const value = event.target.value as string[];
    setSelectedRoles(value);
  };

  const handleAssignRoles = async () => {
    if (!user?.id) {
      toast.error('User ID is missing');
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        roleIds: selectedRoles,
      };
      await axiosInstance.patch(`/user/assign-roles/${user.id}`, payload);
      toast.success('Roles assigned successfully');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to assign roles:', err);
      toast.error(err.response?.data?.message || 'Failed to assign roles');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setSelectedRoles([]);
      setAssignedRoles([]);
      onClose();
    }
  };

  // Ensure unique roles in availableRoles
  const availableRoles = Array.from(
    new Map(
      roles
        .filter((role) => !selectedRoles.includes(role.id))
        .map((role) => [role.id, role])
    ).values()
  );

  const targetUserPriority = user?.role?.priority || 4;
  const canAssignRoles = currentUserPriority <= 2 || (currentUserPriority === 3 && targetUserPriority >= 3);

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
      BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          mb: 2,
          textAlign: 'center',
          background: 'linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))',
        }}
      >
        Assign Roles
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Roles</InputLabel>
          <Select
            multiple
            value={selectedRoles}
            onChange={handleRoleChange}
            label="Roles"
            disabled={!canAssignRoles}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const role = roles.find((r) => r.id === value);
                  return role ? (
                    <Chip
                      key={value}
                      label={role.name}
                      sx={{ borderRadius: '8px' }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        setSelectedRoles((prev) => prev.filter((id) => id !== value));
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ) : null;
                })}
              </Box>
            )}
          >
            {availableRoles.length > 0 ? (
              availableRoles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No additional roles available</MenuItem>
            )}
          </Select>
          {!canAssignRoles && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              You do not have permission to assign roles to an Administrator.
            </Typography>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} disabled={isSubmitting} sx={{ color: 'var(--primary-color-1)' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{ bgcolor: 'var(--primary-color-1)' }}
          onClick={handleAssignRoles}
          disabled={isSubmitting || !canAssignRoles}
        >
          {isSubmitting ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};