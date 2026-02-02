"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Chip,
  Autocomplete,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  getDocumentPermissions,
  setUserPermission,
  removeUserPermission,
  lockDocument,
  DocumentPermission,
  ProjectDocument,
  PermissionLevel,
} from "@/services/documentService";
import createAxiosInstance from "@/app/axiosInstance";
import toast from "react-hot-toast";

interface PermissionsModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  documentId: string;
  document: ProjectDocument;
  onLockChange: (isLocked: boolean) => void;
}

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image?: string;
}

const permissionLabels: Record<PermissionLevel, string> = {
  view: "View Only",
  comment: "Can Comment",
  edit: "Can Edit",
};

const permissionColors: Record<PermissionLevel, string> = {
  view: "#6B7280",
  comment: "#6366F1",
  edit: "#10B981",
};

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  open,
  onClose,
  projectId,
  documentId,
  document,
  onLockChange,
}) => {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(document.is_locked);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionLevel>("edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const axiosInstance = createAxiosInstance();

      // Fetch permissions
      const perms = await getDocumentPermissions(projectId, documentId);
      setPermissions(perms);

      // Fetch team members
      const teamRes = await axiosInstance.get(
        `/project-management/project-team/${projectId}`,
      );
      const members = (teamRes.data?.data || []).map((t: any) => t.user);
      setTeamMembers(members);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleLockToggle = async () => {
    try {
      const newLockState = !isLocked;
      await lockDocument(projectId, documentId, newLockState);
      setIsLocked(newLockState);
      onLockChange(newLockState);
      toast.success(newLockState ? "Document locked" : "Document unlocked");
    } catch (error) {
      toast.error("Failed to update lock status");
    }
  };

  const handleAddPermission = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const perm = await setUserPermission(
        projectId,
        documentId,
        selectedUser.id,
        selectedPermission,
      );
      setPermissions((prev) => {
        const existing = prev.findIndex((p) => p.user.id === selectedUser.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = perm;
          return updated;
        }
        return [...prev, perm];
      });
      setSelectedUser(null);
      toast.success("Permission added");
    } catch (error) {
      toast.error("Failed to add permission");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePermission = async (
    userId: string,
    permission: PermissionLevel,
  ) => {
    try {
      await setUserPermission(projectId, documentId, userId, permission);
      setPermissions((prev) =>
        prev.map((p) => (p.user.id === userId ? { ...p, permission } : p)),
      );
      toast.success("Permission updated");
    } catch (error) {
      toast.error("Failed to update permission");
    }
  };

  const handleRemovePermission = async (userId: string) => {
    try {
      await removeUserPermission(projectId, documentId, userId);
      setPermissions((prev) => prev.filter((p) => p.user.id !== userId));
      toast.success("Permission removed");
    } catch (error) {
      toast.error("Failed to remove permission");
    }
  };

  // Filter out users who already have permissions
  const availableUsers = teamMembers.filter(
    (m) => !permissions.some((p) => p.user.id === m.id),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          fontWeight: 700,
          color: "var(--primary-color-1)",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <LockIcon />
        Document Permissions
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Lock Toggle */}
            <Box
              sx={{
                p: 2,
                bgcolor: "grey.50",
                borderRadius: 2,
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={isLocked}
                    onChange={handleLockToggle}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Lock Document
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isLocked
                        ? "Only users with specific permissions can edit"
                        : "All team members can view, comment, and edit"}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {isLocked && (
              <>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  User Permissions
                </Typography>

                {/* Add new permission */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                    alignItems: "flex-start",
                  }}
                >
                  <Autocomplete
                    size="small"
                    options={availableUsers}
                    getOptionLabel={(option) =>
                      `${option.first_name} ${option.last_name}`
                    }
                    value={selectedUser}
                    onChange={(_, value) => setSelectedUser(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add team member"
                        placeholder="Search..."
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Avatar
                          src={
                            option.profile_image ||
                            "/images/profile/defaultprofile.jpg"
                          }
                          sx={{ width: 28, height: 28, mr: 1 }}
                        >
                          {option.first_name.charAt(0)}
                        </Avatar>
                        {option.first_name} {option.last_name}
                      </li>
                    )}
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={selectedPermission}
                      onChange={(e) =>
                        setSelectedPermission(e.target.value as PermissionLevel)
                      }
                    >
                      <MenuItem value="view">View</MenuItem>
                      <MenuItem value="comment">Comment</MenuItem>
                      <MenuItem value="edit">Edit</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleAddPermission}
                    disabled={!selectedUser || saving}
                    sx={{
                      bgcolor: "var(--primary-color-1)",
                      "&:hover": { bgcolor: "var(--primary-color-2)" },
                    }}
                  >
                    Add
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Permission list */}
                {permissions.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No specific permissions set. All team members have view
                      access by default when the document is locked.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {permissions.map((perm) => (
                      <ListItem
                        key={perm.id}
                        sx={{
                          px: 0,
                          "&:hover": { bgcolor: "grey.50" },
                          borderRadius: 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={
                              perm.user.profile_image ||
                              "/images/profile/defaultprofile.jpg"
                            }
                          >
                            {perm.user.first_name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${perm.user.first_name} ${perm.user.last_name}`}
                          secondary={
                            <Chip
                              label={permissionLabels[perm.permission]}
                              size="small"
                              sx={{
                                mt: 0.5,
                                bgcolor: `${permissionColors[perm.permission]}20`,
                                color: permissionColors[perm.permission],
                                fontWeight: 500,
                              }}
                            />
                          }
                        />
                        <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
                          <Select
                            value={perm.permission}
                            onChange={(e) =>
                              handleUpdatePermission(
                                perm.user.id,
                                e.target.value as PermissionLevel,
                              )
                            }
                          >
                            <MenuItem value="view">View</MenuItem>
                            <MenuItem value="comment">Comment</MenuItem>
                            <MenuItem value="edit">Edit</MenuItem>
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={() => handleRemovePermission(perm.user.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsModal;
