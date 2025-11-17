"use client";
import React, { useEffect, useState } from 'react';
import {
  Box, AppBar, Toolbar, styled, Stack, IconButton, Menu, MenuItem, Typography,
  Grid, Badge, FormControl, Select, InputLabel,
  Button,
  Popover,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import PropTypes from 'prop-types';
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import CampaignIcon from '@mui/icons-material/Campaign';
import { getMessaging, onMessage } from "firebase/messaging";
import app from "@/utils/firebase";

dayjs.extend(relativeTime);

import Profile from './Profile';
import { IconMenu2 } from '@tabler/icons-react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import createAxiosInstance from '@/app/axiosInstance';
import { useRouter } from 'next/navigation';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTenantRouter from '@/app/(AuthLayout)/components/useTenantRouter';
import { useAppselector } from '@/redux/store';
import Cookies from "js-cookie";
import { AuthState, setAuthDetails } from '@/redux/features/authSlice';
import { setRoleDetails } from "@/redux/features/roleSlice";
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OnlineToggle from './OnlineToggle';
import { ArrowLeft } from '@mui/icons-material';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GroupIcon from '@mui/icons-material/Group';
import InfoIcon from '@mui/icons-material/Info';
import ListIcon from '@mui/icons-material/ListAlt';
import { ArrowDropDownIcon } from '@mui/x-date-pickers/icons';


const bgHeader = "var(--card-bg-color)";
const orangeText = "var(--primary-color-2)";
const blueText = "var(--primary-color-1)";

const getBgColor = (segment: string, isRead: boolean) => {
  const colors: Record<string, string> = {
    tasks: isRead ? "rgba(0, 128, 128, 0.05)" : "rgba(0, 128, 128, 0.15)",       // teal
    projects: isRead ? "rgba(255, 140, 0, 0.05)" : "rgba(255, 140, 0, 0.15)",   // orange
    users: isRead ? "rgba(30, 144, 255, 0.05)" : "rgba(30, 144, 255, 0.15)",    // blue
    notify: isRead ? "rgba(255, 20, 147, 0.05)" : "rgba(255, 20, 147, 0.15)",   // pink
    default: isRead ? "rgba(128, 128, 128, 0.05)" : "rgba(128, 128, 128, 0.1)", // gray
  };
  return colors[segment] || colors.default;
};

type DecodedToken = {
  user: {
    id: number;
    email: string;
    phone: string;
  };
  tenant: {
    id: string;
    tenant_name: string;
    schema_name: string;
    subdomain: string;
    background_image: string;
    address: string;
    welcome_note: string;
    login_process: string;
  };
  role: any;
  timestamp: string;
  iat: number;
  exp: number;
};

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  background: bgHeader,
  justifyContent: 'center',
  borderRadius: '0',
  [theme.breakpoints.up('lg')]: {
    minHeight: '70px',
  },
}));

const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  left: 0,
  zIndex: theme.zIndex.appBar,
  width: '100%',
  padding: theme.spacing(1.5, 3),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(2),
}));


interface Notification {
  id: number;
  message: string;
  time: string;
}

interface ItemType {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
  rerenderSidebar: () => void;
}
const renderIcon = (segment: string) => {
  switch (segment) {
    case "tasks":
      return <AssignmentTurnedInIcon sx={{ color: blueText, fontSize: '20px' }} />;
    case "projects":
      return <FolderIcon sx={{ color: blueText, fontSize: '20px' }} />;
    case "my-reports":
      return <ListIcon sx={{ color: blueText, fontSize: '20px' }} />;
    case "users":
      return <GroupIcon sx={{ color: blueText, fontSize: '20px' }} />;
    case "notify":
      return <NotificationsActiveIcon sx={{ color: blueText, fontSize: '20px' }} />;
    default:
      return <InfoIcon sx={{ color: blueText, fontSize: '20px' }} />;
  }
};
const Header = ({ toggleMobileSidebar, rerenderSidebar }: ItemType) => {
  const userRole = useAppselector(state => state.role.value)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorE, setAnchorE] = useState(null);
  const [notifications, setNotifications] = useState<any>();
  const [total, setTotal] = useState<number>(0);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>(userRole.id);
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();
  const axiosInstance = createAxiosInstance();
  let dateNow = dayjs();
  const authData = useAppselector(state => state.auth.value);
  const dispatch = useDispatch();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setSelectedNotification(null);
    setAnchorEl(null);
  };

  const messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    fetchNotifications()
  });

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(`notification`, {
        params: {
          userId: authData?.user?.id,
          page: 1,
          limit: 20,
          sort: 'createdAt:desc'
        }
      });
    const responseData = response?.data?.data;
    if (responseData) {
      const notifications = responseData.notifications || [];

      //  Filter out Reminder notifications
      const filteredUnreadCount = notifications.filter(
        n => n.isRead === false && !n.title?.toLowerCase().includes('reminder')
      ).length;

      setNotifications(notifications);
      setTotal(responseData.total);
      setTotalUnread(filteredUnreadCount); // 👈 override unread count here
    }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await axiosInstance.get(`/role-management/get-roles/${authData?.user?.id}`);
      const rolesData = response?.data?.data;
      if (rolesData) {
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleSwitchRole = (roleSelect) => {
    router.push('/')
    if (!selectedRole) return;
    setIsSwitching(true);
    setTimeout(async () => {
      try {
        const payload = { roleId: roleSelect };
        const response = await axiosInstance.post(`/auth/switch-role/${authData?.user?.id}`, payload);
        const token = response.data.result;
        Cookies.set("access_token", token);
        const decoded = jwtDecode<DecodedToken>(token);
        const role = await fetchRole(decoded?.role?.id);
        let authDataUpdated = {
          user: {
            id: decoded.user.id,
            email: decoded.user.email,
            phone: decoded.user.phone,
          },
          tenant: {
            id: decoded?.tenant?.id || null,
            tenant_name: decoded?.tenant?.tenant_name || null,
            schema_name: decoded?.tenant?.schema_name || null,
            subdomain: decoded.tenant?.subdomain || null,
            background_image: decoded?.tenant?.background_image || null,
            address: decoded?.tenant?.address || null,
            welcome_note: decoded?.tenant?.welcome_note || null,
            login_process: decoded?.tenant?.login_process || null,
          },
          role: {
            id: decoded?.role?.id,
          },
          token,
          iat: decoded.iat,
          exp: decoded.exp,
        };
        dispatch(setAuthDetails(authDataUpdated));
        rerenderSidebar();
      } catch (error) {
        console.error('Failed to switch role:', error);
      } finally {
        setIsSwitching(false);
      }
    }, 500);
  };

  const fetchRole = async (id: string) => {
    const res = await axiosInstance.get(`/role-management/get-one/${id}`);
    if (!res.data.status) throw new Error("Failed to fetch users");
    const data: any = await res.data;
    dispatch(setRoleDetails(data?.data));
    return data.data;
  };

  function getFirstPathSegment(url?: string): string {
    if (!url) return "default"; // fallback
    const cleanedUrl = url.startsWith("/") ? url.slice(1) : url;
    const parts = cleanedUrl.split("/");
    return parts[0] || "default";
  }

  useEffect(() => {
    fetchNotifications();
    fetchUserRoles();
  }, []);

  const handleOnClick = async (item: any) => {
    setSelectedNotification(item);
    if (!item?.is_read) {
      await axiosInstance.patch(`/notification/mark-as-read/${item?.id}`)
        .then((result) => {
          if (result?.data?.data) {
            fetchNotifications();
          } else {
            console.log('Failed to update');
          }
        });
    }
  };

  const handleMarkAll = async () => {
    await axiosInstance.patch(`notification/mark-all-as-read`, { userId: authData?.user?.id })
      .then((result) => {
        if (result?.data?.data) {
          fetchNotifications();
        } else {
          console.log('Failed to update');
        }
      });
  };

  const handleClick = (event) => {
    setAnchorE(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorE(null);
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    handleSwitchRole(roleId);
    handleClose();
  };

  const open = Boolean(anchorE);
  const selectedRoleName = roles.find((role) => role?.role?.id === selectedRole)?.role?.name || 'Select Role';

  const Mobile = useMediaQuery('(max-width: 767px)');
  const desktop = useMediaQuery('(min-width: 768px) and (max-width: 1199px)');
  const smallMobile = useMediaQuery('(min-width: 320px) and (max-width: 365px)');


  return (
    <>
      <div>
        <ToolbarStyled>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileSidebar}
            sx={{
              display: {
                lg: 'none',
                xs: 'inline-flex',
              },
            }}
          >
            <IconMenu2 width="20" height="20" />
          </IconButton>

          <Box flexGrow={1} />

          <Stack spacing={1} direction="row" alignItems="center">
            {userRole?.priority !== 1 && <OnlineToggle />}
            {roles.length > 1 && (
              <Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleClick}
                  disabled={isSwitching}
                  sx={{
                    borderRadius: '16px',
                    textTransform: 'none',
                    backgroundColor: 'var(--primary-color-2)',
                    fontWeight:'20x',
                    color: 'white',
                    padding: '4px 12px',
                    '&:hover': { backgroundColor: 'var(--primary-color-1)' },
                  }}
                  endIcon={<ArrowDropDownIcon />}
                >
                  {selectedRoleName}
                </Button>
                <Popover
                  open={open}
                  anchorEl={anchorE}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ minWidth: 120 }}>
                    {roles
                      .filter((role) => role?.role?.name !== selectedRoleName) // 🚀 remove selected
                      .map((role) => (
                        <MenuItem
                          key={role?.role?.id}
                          onClick={() => handleRoleSelect(role?.role?.id)}
                          sx={{
                            padding: '8px 16px',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                          }}
                        >
                          <Typography variant="body2">{role?.role?.name}</Typography>
                        </MenuItem>
                      ))}
                  </Box>
                </Popover>
              </Box>
            )}
            <Box sx={{ position: 'relative' }}>
              <IconButton
                aria-controls="notification-menu"
                aria-haspopup="true"
                onClick={handleMenuClick}
                sx={{
                  ml: 2,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Badge
                  badgeContent={totalUnread}
                  sx={{
                    '& .MuiBadge-badge': {
                      color: 'white',
                      backgroundColor: orangeText,
                      fontSize: '0.75rem',
                      height: '18px',
                      minWidth: '18px',
                      borderRadius: '50%',
                    },
                  }}
                >
                  <NotificationsActiveIcon sx={{ color: blueText, fontSize: '28px' }} />
                </Badge>
              </IconButton>
              <Menu
                id="notification-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                PaperProps={{
                  sx: {
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    minWidth: '380px',
                    maxWidth: '400px',
                    overflow: 'hidden',
                    border: '1px solid #e0e0e0',
                  },
                }}
              >
                {/* Header for list view */}
                {!selectedNotification && (
                  <Box sx={{
                    background: 'linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)',
                    padding: '16px',
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    <Typography variant="h6" sx={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>
                      Notifications
                    </Typography>
                    <Typography sx={{ color: '#f0f0f0', fontSize: '0.85rem', mt: 0.5 }}>
                      {totalUnread === 1
                        ? `You have ${totalUnread} unread notification`
                        : totalUnread > 1
                          ? `You have ${totalUnread} unread notifications`
                          : 'All caught up!'}
                    </Typography>
                  </Box>
                )}

                {/* List view */}
                {!selectedNotification && (
                  <Box sx={{
                    maxHeight: '320px',
                    overflowY: 'auto',
                    padding: '8px',
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#d1d1d1',
                      borderRadius: '8px',
                    },
                  }}>
                    {notifications?.length > 0 ? (
                      notifications?.filter(item => !item.title?.toLowerCase().includes('reminder'))//exclues all reminder notifications
                        .map((item) => (
                        <MenuItem
                          key={item?.id}
                          onClick={() => handleOnClick(item)}
                          sx={{
                            padding: "12px 16px",
                            borderRadius: "12px",
                            margin: "4px 8px",
                            backgroundColor: getBgColor(getFirstPathSegment(item?.url), item?.is_read),
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.05)", // soft hover
                              transform: "translateY(-2px)",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            },
                            ...smallMobile && { maxWidth: "320px" },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px' }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: item?.is_read ? '#f5f5f5' : '#e6f0ff',
                                overflow: 'hidden', // ensures image stays inside the circle
                              }}
                            >
                              {item?.img ? (
                                <Box
                                  component="img"
                                  src={item.img}
                                  alt="profile"
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                renderIcon(getFirstPathSegment(item?.url || ""))
                              )}
                            </Box>

                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.95rem',
                                  fontWeight: item?.is_read ? 400 : 500,
                                  color: '#333',
                                  lineHeight: 1.4,
                                }}
                              >
                                {item?.title}
                              </Typography>
                              <Typography sx={{ color: '#888', fontSize: '0.8rem', mt: 0.5 }}>
                                {dateNow?.from(item?.created_at, true)} ago
                              </Typography>
                            </Box>
                            <ChevronRightIcon sx={{ color: '#888', fontSize: '18px' }} />
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <Box sx={{ padding: '16px', textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                          No notifications yet. You're all clear!
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Detail view */}
                {selectedNotification && (
                  <Box sx={{
                    width: '360px',
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <IconButton
                        onClick={() => setSelectedNotification(null)}
                        sx={{
                          color: blueText,
                          '&:hover': { backgroundColor: '#f0f4ff' },
                        }}
                      >
                        <ArrowLeft sx={{ fontSize: '24px' }} />
                      </IconButton>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: blueText, ml: 1 }}>
                        {selectedNotification?.title || 'Notification'}
                      </Typography>
                    </Box>
                    <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mb: 2 }}>
                      <Typography sx={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.6 }}>
                        {selectedNotification?.body || 'No content available.'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: '#888', textAlign: 'right' }}>
                      {selectedNotification?.created_at
                        ? new Date(selectedNotification.created_at).toLocaleString()
                        : 'No date available'}
                    </Typography>
                  </Box>
                )}

                {/* Footer for list view */}
                {!selectedNotification && (
                  <Box sx={{
                    padding: '8px 16px',
                    background: '#f8f9fa',
                    borderTop: '1px solid #e0e0e0',
                    textAlign: 'center',
                  }}>
                    <IconButton
                      aria-controls="notification-menu"
                      aria-haspopup="true"
                      sx={{
                        fontSize: '0.85rem',
                        color: blueText,
                        borderRadius: '12px',
                        padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#e6f0ff',
                        },
                      }}
                      onClick={handleMarkAll}
                      disabled={totalUnread === 0}
                    >
                      Mark all as read
                    </IconButton>
                  </Box>
                )}
              </Menu>
            </Box>
            <Profile />
          </Stack>
        </ToolbarStyled>
      </div>
    </>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
  rerenderSidebar: PropTypes.func.isRequired,
};

export default Header;

function dispatch(arg0: { payload: AuthState; type: "auth/setAuthDetails"; }) {
  throw new Error('Function not implemented.');
}