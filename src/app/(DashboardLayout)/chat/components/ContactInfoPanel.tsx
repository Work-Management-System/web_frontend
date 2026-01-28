'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Switch,
  Button,
  Divider,
  Checkbox,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import { Space, SpaceType } from '@/redux/features/spacesSlice';
import { useAppselector } from '@/redux/store';

interface ContactInfoPanelProps {
  spaceId: string;
  space?: Space;
  onClose: () => void;
}

export default function ContactInfoPanel({ spaceId, space, onClose }: ContactInfoPanelProps) {
  const currentUser = useAppselector((state) => state.user.user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Survey users', completed: true },
    { id: 2, text: 'Design feedback', completed: false },
  ]);

  // Get display info based on space type
  const getDisplayInfo = () => {
    if (!space) {
      return {
        name: 'Loading...',
        subtitle: '',
        avatar: '',
        avatarBg: '#5682a3',
      };
    }

    if (space.type === SpaceType.DM && space.otherMember) {
      return {
        name: `${space.otherMember.first_name || ''} ${space.otherMember.last_name || ''}`.trim() || 'Unknown User',
        subtitle: '1 member',
        avatar: space.otherMember.profile_image || '',
        avatarBg: '#5682a3',
        initials: `${space.otherMember.first_name?.[0] || ''}${space.otherMember.last_name?.[0] || ''}`,
      };
    }

    return {
      name: space.name || 'Unnamed Space',
      subtitle: `${space.memberCount || 0} members`,
      avatar: '',
      avatarBg: '#5682a3',
      initials: space.name?.[0]?.toUpperCase() || '?',
    };
  };

  const displayInfo = getDisplayInfo();

  // Mock files for demonstration
  const files = [
    { id: 1, thumbnail: '/images/users/1.jpg', type: 'image' },
    { id: 2, thumbnail: '/images/users/2.jpg', type: 'image' },
    { id: 3, thumbnail: '/images/users/3.jpg', type: 'image' },
    { id: 4, thumbnail: '/images/users/4.jpg', type: 'image' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e8e8e8',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
          Contact Information
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Profile Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            src={displayInfo.avatar}
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: displayInfo.avatarBg,
              fontSize: '1.5rem',
              fontWeight: 600,
            }}
          >
            {!displayInfo.avatar && displayInfo.initials}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
            {displayInfo.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {displayInfo.subtitle}
          </Typography>

          {/* Call/Video Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Tooltip title="Voice Call">
              <IconButton
                sx={{
                  bgcolor: '#f0f2f5',
                  '&:hover': { bgcolor: '#e4e6e9' },
                  width: 48,
                  height: 48,
                }}
              >
                <PhoneIcon sx={{ color: '#1a73e8' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Video Call">
              <IconButton
                sx={{
                  bgcolor: '#f0f2f5',
                  '&:hover': { bgcolor: '#e4e6e9' },
                  width: 48,
                  height: 48,
                }}
              >
                <VideocamIcon sx={{ color: '#1a73e8' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Details Section */}
        <Box sx={{ mb: 3 }}>
          {space?.type === SpaceType.DM && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Username
                </Typography>
                <Typography variant="body2" sx={{ color: '#333', mt: 0.5 }}>
                  @{space.otherMember?.first_name?.toLowerCase() || 'user'}_chat
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Mobile
                </Typography>
                <Typography variant="body2" sx={{ color: '#1a73e8', mt: 0.5 }}>
                  (575) 213-5962
                </Typography>
              </Box>
            </>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ color: '#333', mt: 0.5 }}>
              {space?.description || 'Join us if u wanna work together 🤝'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Files Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
              Files
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#1a73e8', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              See all
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {files.map((file) => (
              <Box
                key={file.id}
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  bgcolor: '#f0f2f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <Box
                  component="img"
                  src={file.thumbnail}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span style="color: #999; font-size: 24px;">📷</span>';
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Settings Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <NotificationsIcon sx={{ color: '#666', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Notifications
              </Typography>
            </Box>
            <Switch
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#1a73e8',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#1a73e8',
                },
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StarIcon sx={{ color: '#666', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#333' }}>
                Starred
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: isStarred ? '#ff8700' : '#e0e0e0',
                color: '#fff',
                borderRadius: '12px',
                px: 1,
                py: 0.25,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => setIsStarred(!isStarred)}
            >
              {isStarred ? '14' : '0'}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tasks Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
              Tasks
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#1a73e8', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              Add new +
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tasks.map((task) => (
              <Box
                key={task.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: '#f8f9fa',
                  '&:hover': { bgcolor: '#f0f2f5' },
                }}
              >
                <Checkbox
                  checked={task.completed}
                  size="small"
                  sx={{
                    p: 0,
                    color: '#1a73e8',
                    '&.Mui-checked': {
                      color: '#1a73e8',
                    },
                  }}
                  onChange={() => {
                    setTasks(tasks.map(t =>
                      t.id === task.id ? { ...t, completed: !t.completed } : t
                    ));
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: task.completed ? '#999' : '#333',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
