'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import createAxiosInstance from '@/app/axiosInstance';
import { SpaceType } from '@/redux/features/spacesSlice';
import { useAppselector } from '@/redux/store';
import { useDispatch } from 'react-redux';
import { fetchSpaces, setActiveSpace } from '@/redux/features/spacesSlice';

interface CreateDMDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (spaceId?: string) => void;
}

export default function CreateDMDialog({
  open,
  onClose,
  onCreated,
}: CreateDMDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const axiosInstance = createAxiosInstance();
  const currentUser = useAppselector((state) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (open && currentUser?.id) {
      fetchUsers();
    } else {
      setSearchTerm('');
    }
  }, [open, currentUser?.id]);

  const fetchUsers = async () => {
    if (!currentUser?.id) {
      console.warn('Current user not available');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get('/user/list');
      
      // Check if response has data
      if (response.data?.status && response.data?.data) {
        // Filter out current user
        const allUsers = (response.data.data || []).filter(
          (u: any) => u.id !== currentUser.id
        );
        setUsers(allUsers);
      } else if (response.data?.data) {
        // Some APIs return data directly without status
        const allUsers = (Array.isArray(response.data.data) ? response.data.data : []).filter(
          (u: any) => u.id !== currentUser.id
        );
        setUsers(allUsers);
      } else {
        console.warn('No users found in response:', response.data);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      if (error.response?.data?.message) {
        console.error('Error message:', error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDM = async (userId: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/chat/spaces', {
        type: SpaceType.DM,
        memberIds: [userId],
      });
      
      // Refresh spaces list
      await dispatch(fetchSpaces());
      
      // If space was created, select it
      if (response.data?.data?.id) {
        dispatch(setActiveSpace(response.data.data.id));
      }
      
      onCreated(response.data?.data?.id);
      onClose();
    } catch (error: any) {
      console.error('Failed to create DM:', error);
      // If DM already exists, the backend should return it
      if (error.response?.data?.data?.id) {
        dispatch(setActiveSpace(error.response.data.data.id));
        onCreated(error.response.data.data.id);
        onClose();
      } else {
        alert(error.response?.data?.message || 'Failed to create direct message');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Chat</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search people..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {loading ? (
            <ListItem>
              <ListItemText primary="Loading users..." />
            </ListItem>
          ) : filteredUsers.length === 0 ? (
            <ListItem>
              <ListItemText primary={searchTerm ? "No users found matching your search" : "No users available"} />
            </ListItem>
          ) : (
            filteredUsers.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => handleCreateDM(user.id)}
                disabled={loading}
              >
                <ListItemAvatar>
                  <Avatar src={user.profile_image}>
                    {user.first_name?.[0]}
                    {user.last_name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${user.first_name} ${user.last_name}`}
                  secondary={user.email}
                />
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
