'use client';
import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, IconButton, Avatar, Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Logout, Settings } from '@mui/icons-material';
import createAxiosInstance from '@/app/axiosInstance';
import { useAppselector } from "@/redux/store";

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector(state => state.auth.value);
  const userId = authData?.user?.id;
  const userInfo = useAppselector(state => state.user.user);
  const userRole = useAppselector(state => state.role.value);
  const userName = userInfo?.first_name || 'User';
  const isAdministrator = userRole?.priority === 1;
  
  const [profile_image, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get(`/user/find-one/${userId}`);
        setProfileImageUrl(response?.data?.data?.profile_image);
        console.log('User data profile image:', response?.data?.data?.profile_image);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    handleMenuClose();
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    handleMenuClose();
  };

  const handleLogoutClick = () => {
    router.push('/logout');
    handleMenuClose();
  };

  return (
    <div>
      <Box
        onClick={handleMenuClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          ml: 2,
        }}
      >
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', mr: 1 }}>
          <Typography
            sx={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--text-color)',
              lineHeight: 1.2,
            }}
          >
            {userInfo?.first_name} {userInfo?.last_name || ''}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(0,0,0,0.5)',
              lineHeight: 1.2,
            }}
          >
            View profile
          </Typography>
        </Box>
        <Avatar
          src={profile_image || '/images/profile/defaultprofile.jpg'}
          alt="Profile"
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2px solid var(--primary-color-1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        />
      </Box>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem sx={{ display: "flex", gap: 1 }} onClick={handleProfileClick}><Avatar src={profile_image || '/images/profile/defaultprofile.jpg'} sx={{ width: 19, height: 19 }} /> {userName || 'Profile'}</MenuItem>
        {isAdministrator && (
          <MenuItem sx={{ display: 'flex', gap: 1 }} onClick={handleSettingsClick}><Settings sx={{ width: 19, height: 19, color:'var(--primary-color-1)' }} /> Settings</MenuItem>
        )}
        <MenuItem sx={{ display: 'flex', gap: 1 }} onClick={handleLogoutClick}><Logout sx={{ width: 19, height: 19,color:'var(--primary-color-1)' }} /> Logout</MenuItem>
      </Menu>
    </div>
  );
};

export default Profile;