'use client';
import React, { useEffect, useState } from 'react';
import { Menu, MenuItem, IconButton, Avatar } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useRouter } from 'next/navigation';
import { Logout } from '@mui/icons-material';
import createAxiosInstance from '@/app/axiosInstance';
import { useAppselector } from "@/redux/store";
import { setUser } from '@/redux/features/userSlice';
import { useDispatch } from 'react-redux';
import { debug } from 'console';

const Profile = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const axiosInstance = createAxiosInstance();
  const authData = useAppselector(state => state.auth.value);
  const userId = authData?.user?.id;
    const dispatch = useDispatch();
  const userInfo = useAppselector(state => state.user.user);
  const userName = userInfo?.first_name || 'User';
  
  const [profile_image, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get(`/user/find-one/${userId}`);
        setProfileImageUrl(response?.data?.data?.profile_image);
        console.log('User data profile image:', response?.data?.data?.profile_image);
        //  dispatch(setUser(response?.data?.data));
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

  const handleLogoutClick = () => {
    router.push('/logout');
    handleMenuClose();
  };

  return (
    <div>
      <IconButton
        onClick={handleMenuClick}
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        sx={{
          padding: 0,ml: 2, 
        }}
      >
        <Avatar
          src={profile_image || '/images/profile/defaultprofile.jpg'}
          alt="Profile"
          sx={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '2px solid var(--primary-color-1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              transform: 'scale(1.1)',
              borderColor: '#1565c0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        />
      </IconButton>
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
        <MenuItem sx={{ display: 'flex', gap: 1 }} onClick={handleLogoutClick}><Logout sx={{ width: 19, height: 19,color:'var(--primary-color-1)' }} /> Logout</MenuItem>
      </Menu>
    </div>
  );
};

export default Profile;