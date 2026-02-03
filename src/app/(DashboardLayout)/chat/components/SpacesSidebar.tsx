"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  TextField,
  IconButton,
  Badge,
  Avatar,
  Button,
  Collapse,
  Divider,
  InputAdornment,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TagIcon from "@mui/icons-material/Tag";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { Space, SpaceType } from "@/redux/features/spacesSlice";
import { useAppselector } from "@/redux/store";
import createAxiosInstance from "@/app/axiosInstance";
import CreateSpaceDialog from "./CreateSpaceDialog";
import CreateDMDialog from "./CreateDMDialog";

interface SpacesSidebarProps {
  spaces: Space[];
  activeSpaceId: string | null;
  onSpaceSelect: (spaceId: string) => void;
  onSpaceCreated?: () => void;
}

interface SpaceWithMembers extends Space {
  otherMember?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  memberCount?: number;
  lastMessage?: {
    content: string;
    created_at: string;
  };
}

export default function SpacesSidebar({
  spaces,
  activeSpaceId,
  onSpaceSelect,
  onSpaceCreated,
}: SpacesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [friendsExpanded, setFriendsExpanded] = useState(true);
  const [spacesExpanded, setSpacesExpanded] = useState(true);
  const [openCreateSpace, setOpenCreateSpace] = useState(false);
  const [openCreateDM, setOpenCreateDM] = useState(false);
  const currentUser = useAppselector((state) => state.user.user);
  const unreadCounts = useAppselector((state) => state.spaces.unreadCounts);
  const axiosInstance = createAxiosInstance();

  // Debug: Log unread counts
  useEffect(() => {
    console.log("Unread counts updated:", unreadCounts);
    spaces.forEach((space) => {
      const count = unreadCounts[space.id] || 0;
      if (count > 0) {
        console.log(
          `Space ${space.id} (${space.name || "DM"}) has ${count} unread messages`,
        );
      }
    });
  }, [unreadCounts, spaces]);

  // Separate DMs and Spaces
  const dms = spaces.filter((s) => s.type === SpaceType.DM);
  const groupSpaces = spaces.filter((s) => s.type !== SpaceType.DM);

  // Filter based on search
  const filteredDMs = dms.filter((space) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      space.name?.toLowerCase().includes(searchLower) ||
      space.otherMember?.first_name?.toLowerCase().includes(searchLower) ||
      space.otherMember?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredSpaces = groupSpaces.filter((space) =>
    space.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getSpaceDisplayName = (space: Space): string => {
    if (space.type === SpaceType.DM) {
      if ((space as any).otherMember) {
        const other = (space as any).otherMember;
        const name =
          `${other.first_name || ""} ${other.last_name || ""}`.trim();
        if (name) return name;
      }
      if (space.name && space.name.trim() && space.name !== "Unnamed Space") {
        return space.name;
      }
      return "Loading...";
    }
    return space.name || "Unnamed Space";
  };

  const getSpaceAvatar = (space: Space): string => {
    if (space.type === SpaceType.DM && space.otherMember?.profile_image) {
      return space.otherMember.profile_image;
    }
    if (space.type === SpaceType.DM && space.otherMember) {
      return `${space.otherMember.first_name?.[0] || ""}${space.otherMember.last_name?.[0] || ""}`;
    }
    return space.name?.[0] || "?";
  };

  const getSpaceIcon = (type: SpaceType) => {
    switch (type) {
      case SpaceType.DM:
        return null;
      case SpaceType.GROUP:
        return <GroupsIcon sx={{ fontSize: 18 }} />;
      case SpaceType.PROJECT:
        return <WorkspacesIcon sx={{ fontSize: 18 }} />;
      case SpaceType.TENANT_WIDE:
        return <TagIcon sx={{ fontSize: 18 }} />;
      default:
        return <TagIcon sx={{ fontSize: 18 }} />;
    }
  };

  const formatLastMessageTime = (date: string) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Generate consistent colors for avatars
  const getAvatarColor = (name: string) => {
    const colors = [
      "#5682a3",
      "#e17076",
      "#7bc862",
      "#faa05a",
      "#6ec9cb",
      "#ee7aae",
      "#a695e7",
      "#65aadd",
      "#ee7aae",
      "#ffc764",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      {/* Search Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e8e8e8" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#999", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              bgcolor: "#f4f4f4",
              "& fieldset": {
                border: "none",
              },
              "&:hover fieldset": {
                border: "none",
              },
              "&.Mui-focused fieldset": {
                border: "1px solid #1a73e8",
              },
            },
            "& .MuiInputBase-input": {
              py: 1,
              fontSize: "0.875rem",
            },
          }}
        />
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {/* Friends Section */}
        <Box>
          <ListItemButton
            onClick={() => setFriendsExpanded(!friendsExpanded)}
            sx={{
              py: 1.5,
              px: 2,
              "&:hover": { bgcolor: "#f8f9fa" },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                flex: 1,
                fontWeight: 600,
                color: "#8e8e8e",
                letterSpacing: "0.5px",
                fontSize: "0.7rem",
              }}
            >
              FRIENDS
            </Typography>
            {friendsExpanded ? (
              <ExpandLessIcon sx={{ color: "#8e8e8e", fontSize: 20 }} />
            ) : (
              <ExpandMoreIcon sx={{ color: "#8e8e8e", fontSize: 20 }} />
            )}
          </ListItemButton>
          <Collapse in={friendsExpanded}>
            <List sx={{ py: 0 }}>
              {filteredDMs.length === 0 ? (
                <ListItem sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No conversations yet
                  </Typography>
                </ListItem>
              ) : (
                filteredDMs.map((space) => {
                  const displayName = getSpaceDisplayName(space);
                  const unreadCount = unreadCounts[space.id] || 0;
                  const hasUnread = unreadCount > 0;
                  const isSelected = activeSpaceId === space.id;

                  // Debug logging for badge rendering
                  if (unreadCount > 0) {
                    console.log(
                      `[SpacesSidebar] Rendering badge for ${displayName}: ${unreadCount} unread`,
                    );
                  }

                  return (
                    <ListItem key={space.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => onSpaceSelect(space.id)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&.Mui-selected": {
                            bgcolor: "#e7f3ff",
                            borderLeft: "3px solid #1a73e8",
                            "&:hover": { bgcolor: "#e7f3ff" },
                          },
                          "&:hover": {
                            bgcolor: "#f5f5f5",
                          },
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "top",
                            horizontal: "right",
                          }}
                          badgeContent={unreadCount}
                          invisible={!hasUnread}
                          sx={{
                            "& .MuiBadge-badge": {
                              bgcolor: "#25D366",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              minWidth: 20,
                              height: 20,
                              borderRadius: "10px",
                              border: "2px solid #fff",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            },
                          }}
                        >
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            variant="dot"
                            sx={{
                              "& .MuiBadge-badge": {
                                bgcolor: "#25D366",
                                border: "2px solid #fff",
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                              },
                            }}
                            invisible={!isSelected}
                          >
                            <Avatar
                              src={space.otherMember?.profile_image || ""}
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: getAvatarColor(displayName),
                                fontSize: "1rem",
                                fontWeight: 500,
                              }}
                            >
                              {getSpaceAvatar(space)}
                            </Avatar>
                          </Badge>
                        </Badge>
                        <Box sx={{ flex: 1, minWidth: 0, ml: 1.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: hasUnread ? 600 : 500,
                                color: "#333",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "0.9rem",
                              }}
                            >
                              {displayName}
                            </Typography>
                            {space.lastMessage && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: hasUnread ? "#1a73e8" : "#8e8e8e",
                                  fontWeight: hasUnread ? 600 : 400,
                                  fontSize: "0.75rem",
                                  ml: 1,
                                  flexShrink: 0,
                                }}
                              >
                                {formatLastMessageTime(
                                  space.lastMessage.created_at,
                                )}
                              </Typography>
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: hasUnread ? "#333" : "#8e8e8e",
                                fontWeight: hasUnread ? 500 : 400,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "block",
                                flex: 1,
                                fontSize: "0.8rem",
                              }}
                            >
                              {space.lastMessage?.content ||
                                "Start a conversation"}
                            </Typography>
                            {/* Unread badge is now on the avatar */}
                          </Box>
                          {/* Tags */}
                          {space.tags && space.tags.length > 0 && (
                            <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                              {space.tags.map((tag: string, idx: number) => (
                                <Chip
                                  key={idx}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    bgcolor:
                                      tag === "High Priority"
                                        ? "#ff5722"
                                        : "#e0e0e0",
                                    color:
                                      tag === "High Priority" ? "#fff" : "#666",
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  );
                })
              )}
            </List>
          </Collapse>
        </Box>

        {/* Add Friends Button */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Button
            fullWidth
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenCreateDM(true)}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              color: "#666",
              fontWeight: 500,
              py: 1,
              borderRadius: "8px",
              "&:hover": {
                bgcolor: "#f5f5f5",
              },
            }}
          >
            Add Friends
          </Button>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Spaces Section (formerly Channels) */}
        <Box>
          <ListItemButton
            onClick={() => setSpacesExpanded(!spacesExpanded)}
            sx={{
              py: 1.5,
              px: 2,
              "&:hover": { bgcolor: "#f8f9fa" },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                flex: 1,
                fontWeight: 600,
                color: "#8e8e8e",
                letterSpacing: "0.5px",
                fontSize: "0.7rem",
              }}
            >
              SPACES
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCreateSpace(true);
              }}
              sx={{
                p: 0.5,
                mr: 0.5,
                "&:hover": { bgcolor: "#e8e8e8" },
              }}
            >
              <AddIcon sx={{ fontSize: 18, color: "#8e8e8e" }} />
            </IconButton>
            {spacesExpanded ? (
              <ExpandLessIcon sx={{ color: "#8e8e8e", fontSize: 20 }} />
            ) : (
              <ExpandMoreIcon sx={{ color: "#8e8e8e", fontSize: 20 }} />
            )}
          </ListItemButton>
          <Collapse in={spacesExpanded}>
            <List sx={{ py: 0 }}>
              {filteredSpaces.length === 0 ? (
                <ListItem sx={{ px: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No spaces yet
                  </Typography>
                </ListItem>
              ) : (
                filteredSpaces.map((space) => {
                  const displayName = getSpaceDisplayName(space);
                  const unreadCount = unreadCounts[space.id] || 0;
                  const hasUnread = unreadCount > 0;
                  const isSelected = activeSpaceId === space.id;
                  const spaceIcon = getSpaceIcon(space.type);

                  // Debug logging for badge rendering
                  if (unreadCount > 0) {
                    console.log(
                      `[SpacesSidebar] Rendering badge for space ${displayName}: ${unreadCount} unread`,
                    );
                  }

                  // Space icon: chat bubble for group spaces (matches chat section screenshot)
                  const spaceAvatarBg = getAvatarColor(displayName);

                  return (
                    <ListItem key={space.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => onSpaceSelect(space.id)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&.Mui-selected": {
                            bgcolor: "#e7f3ff",
                            borderLeft: "3px solid #1a73e8",
                            "&:hover": { bgcolor: "#e7f3ff" },
                          },
                          "&:hover": {
                            bgcolor: "#f5f5f5",
                          },
                        }}
                      >
                        <Badge
                          overlap="circular"
                          anchorOrigin={{
                            vertical: "top",
                            horizontal: "right",
                          }}
                          badgeContent={unreadCount}
                          invisible={!hasUnread}
                          sx={{
                            "& .MuiBadge-badge": {
                              bgcolor: "#25D366",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              minWidth: 18,
                              height: 18,
                              borderRadius: "9px",
                              border: "2px solid #fff",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: spaceAvatarBg,
                              fontSize: "1.25rem",
                            }}
                          >
                            <ChatBubbleOutlineIcon sx={{ fontSize: 20, color: "#fff" }} />
                          </Avatar>
                        </Badge>
                        <Box sx={{ flex: 1, minWidth: 0, ml: 1.5 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: hasUnread ? 600 : 500,
                                color: "#333",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: "0.9rem",
                              }}
                            >
                              {displayName}
                            </Typography>
                            {/* Remove duplicate unread badge since it's now on avatar */}
                            {false && hasUnread && (
                              <Box
                                sx={{
                                  bgcolor: "#1a73e8",
                                  color: "white",
                                  borderRadius: "10px",
                                  px: 0.8,
                                  py: 0.2,
                                  minWidth: 20,
                                  textAlign: "center",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  ml: 1,
                                }}
                              >
                                {unreadCounts[space.id]}
                              </Box>
                            )}
                          </Box>
                          {space.memberCount !== undefined && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#8e8e8e",
                                fontSize: "0.8rem",
                              }}
                            >
                              {space.memberCount} members
                            </Typography>
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  );
                })
              )}
            </List>
          </Collapse>
        </Box>
      </Box>

      {/* Dialogs */}
      <CreateSpaceDialog
        open={openCreateSpace}
        onClose={() => setOpenCreateSpace(false)}
        onCreated={() => {
          setOpenCreateSpace(false);
          onSpaceCreated?.();
        }}
      />
      <CreateDMDialog
        open={openCreateDM}
        onClose={() => setOpenCreateDM(false)}
        onCreated={() => {
          setOpenCreateDM(false);
          onSpaceCreated?.();
        }}
      />
    </Box>
  );
}
