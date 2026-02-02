"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Autocomplete,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from "@mui/material";
import createAxiosInstance from "@/app/axiosInstance";
import { SpaceType } from "@/redux/features/spacesSlice";
import { useAppselector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { fetchSpaces } from "@/redux/features/spacesSlice";

interface CreateSpaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateSpaceDialog({
  open,
  onClose,
  onCreated,
}: CreateSpaceDialogProps) {
  const [spaceType, setSpaceType] = useState<SpaceType>(SpaceType.GROUP);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const axiosInstance = createAxiosInstance();
  const currentUser = useAppselector((state) => state.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (open && currentUser?.id) {
      fetchUsers();
    }
  }, [open, currentUser?.id]);

  const fetchUsers = async () => {
    if (!currentUser?.id) {
      console.warn("Current user not available");
      return;
    }

    try {
      const response = await axiosInstance.get("/user/list");

      // Check if response has data
      if (response.data?.status && response.data?.data) {
        // Filter out current user
        const users = (response.data.data || []).filter(
          (u: any) => u.id !== currentUser.id,
        );
        setAvailableUsers(users);
      } else if (response.data?.data) {
        // Some APIs return data directly without status
        const users = (
          Array.isArray(response.data.data) ? response.data.data : []
        ).filter((u: any) => u.id !== currentUser.id);
        setAvailableUsers(users);
      } else {
        console.warn("No users found in response:", response.data);
        setAvailableUsers([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      setAvailableUsers([]);
      if (error.response?.data?.message) {
        console.error("Error message:", error.response.data.message);
      }
    }
  };

  const handleCreate = async () => {
    if (!name.trim() && spaceType !== SpaceType.DM) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        type: spaceType,
        name: spaceType !== SpaceType.DM ? name.trim() : undefined,
        description: description.trim() || undefined,
      };

      if (spaceType === SpaceType.DM) {
        // For DM, selectedUsers should have exactly one user
        if (selectedUsers.length !== 1) {
          alert("Please select exactly one user for direct message");
          setLoading(false);
          return;
        }
        payload.memberIds = [selectedUsers[0].id];
      } else {
        payload.memberIds = selectedUsers.map((u) => u.id);
      }

      await axiosInstance.post("/chat/spaces", payload);
      dispatch(fetchSpaces());
      onCreated();
      // Reset form
      setName("");
      setDescription("");
      setSelectedUsers([]);
    } catch (error: any) {
      console.error("Failed to create space:", error);
      alert(error.response?.data?.message || "Failed to create space");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Space</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Space Type"
            select
            SelectProps={{ native: true }}
            value={spaceType}
            onChange={(e) => setSpaceType(e.target.value as SpaceType)}
            fullWidth
          >
            <option value={SpaceType.DM}>Direct Message</option>
            <option value={SpaceType.GROUP}>Group Chat</option>
            <option value={SpaceType.PROJECT}>Project Space</option>
            <option value={SpaceType.TENANT_WIDE}>Tenant-Wide Space</option>
          </TextField>

          {spaceType !== SpaceType.DM && (
            <>
              <TextField
                label="Space Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                placeholder="e.g., Marketing Team"
              />
              <TextField
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </>
          )}

          <Autocomplete
            multiple
            options={availableUsers}
            getOptionLabel={(option) =>
              `${option.first_name} ${option.last_name} (${option.email})`
            }
            value={selectedUsers}
            onChange={(_, newValue) => setSelectedUsers(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  spaceType === SpaceType.DM
                    ? "Select User"
                    : "Add Members (Optional)"
                }
                placeholder="Search users..."
              />
            )}
            renderOption={(props, option) => (
              <ListItem {...props} key={option.id}>
                <ListItemAvatar>
                  <Avatar src={option.profile_image || ""}>
                    {option.first_name?.[0]}
                    {option.last_name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${option.first_name} ${option.last_name}`}
                  secondary={option.email}
                />
              </ListItem>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={`${option.first_name} ${option.last_name}`}
                  avatar={
                    <Avatar src={option.profile_image || ""}>
                      {option.first_name?.[0]}
                    </Avatar>
                  }
                />
              ))
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={
            loading ||
            (!name.trim() && spaceType !== SpaceType.DM) ||
            (spaceType === SpaceType.DM && selectedUsers.length !== 1)
          }
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
