"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Paper,
  List,
  ListItem,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { useAppselector } from "@/redux/store";
import { useDispatch } from "react-redux";
import {
  fetchThreadMessages,
  addOptimisticMessage,
} from "@/redux/features/spacesSlice";
import { Message } from "@/redux/features/spacesSlice";
import getChatSocket from "@/utils/ChatSocketConnection";
import dayjs from "dayjs";

interface ThreadPanelProps {
  parentMessageId: string;
  onClose: () => void;
}

export default function ThreadPanel({
  parentMessageId,
  onClose,
}: ThreadPanelProps) {
  const dispatch = useDispatch();
  const { threadsByParentId } = useAppselector((state) => state.spaces);
  const currentUser = useAppselector((state) => state.user.user);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadMessages = threadsByParentId[parentMessageId]?.messages || [];

  useEffect(() => {
    if (parentMessageId) {
      dispatch(fetchThreadMessages({ parentMessageId }));
    }
  }, [parentMessageId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const clientMessageId = `temp-${Date.now()}`;
    setMessage("");

    try {
      const socket = getChatSocket();
      socket.emit("message.send", {
        parent_message_id: parentMessageId,
        content: message.trim(),
        client_message_id: clientMessageId,
      });
    } catch (error) {
      console.error("Failed to send thread message:", error);
    }
  };

  const formatTime = (date: string) => {
    return dayjs(date).format("h:mm A");
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
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #e8e8e8",
          bgcolor: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 64,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#333" }}>
          Thread
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#666" }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Parent Message Preview */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e8e8e8", bgcolor: "#fafafa" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          In reply to
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mt: 1,
            bgcolor: "#fff",
            borderRadius: "8px",
            borderLeft: "3px solid #1a73e8",
          }}
        >
          <Typography variant="body2" sx={{ color: "#333" }}>
            Parent message preview...
          </Typography>
        </Paper>
      </Box>

      {/* Thread Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          bgcolor: "#f8f9fa",
        }}
      >
        {threadMessages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No replies yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Be the first to reply
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {threadMessages.map((msg) => {
              const isOwnMessage = msg.sender_id === currentUser?.id;
              const senderName =
                `${msg.sender?.first_name || ""} ${msg.sender?.last_name || ""}`.trim();

              return (
                <ListItem
                  key={msg.id}
                  sx={{
                    display: "flex",
                    justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                    mb: 1,
                    px: 0,
                  }}
                >
                  {!isOwnMessage && (
                    <Avatar
                      src={msg.sender?.profile_image || ""}
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1,
                        bgcolor: getAvatarColor(senderName),
                        fontSize: "0.75rem",
                      }}
                    >
                      {msg.sender?.first_name?.[0]}
                      {msg.sender?.last_name?.[0]}
                    </Avatar>
                  )}
                  <Box sx={{ maxWidth: "80%" }}>
                    {!isOwnMessage && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: getAvatarColor(senderName),
                          display: "block",
                          mb: 0.5,
                          ml: 0.5,
                        }}
                      >
                        {senderName}
                      </Typography>
                    )}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        bgcolor: isOwnMessage ? "#e7f3ff" : "#fff",
                        borderRadius: isOwnMessage
                          ? "12px 12px 4px 12px"
                          : "12px 12px 12px 4px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#333", lineHeight: 1.5 }}
                      >
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 0.5,
                          color: "#8e8e8e",
                          fontSize: "0.7rem",
                          textAlign: isOwnMessage ? "right" : "left",
                        }}
                      >
                        {formatTime(msg.created_at)}
                      </Typography>
                    </Paper>
                  </Box>
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Thread Composer */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #e8e8e8",
          bgcolor: "#fff",
        }}
      >
        <form onSubmit={handleSendMessage}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <Tooltip title="Attach">
              <IconButton size="small" sx={{ color: "#666" }}>
                <AttachFileIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Reply in thread..."
              variant="outlined"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  bgcolor: "#f4f4f4",
                  "& fieldset": {
                    border: "none",
                  },
                  "&.Mui-focused fieldset": {
                    border: "1px solid #1a73e8",
                  },
                },
              }}
            />
            <Tooltip title="Emoji">
              <IconButton size="small" sx={{ color: "#666" }}>
                <EmojiEmotionsIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            {message.trim() && (
              <Tooltip title="Send">
                <IconButton
                  type="submit"
                  sx={{
                    bgcolor: "#1a73e8",
                    color: "#fff",
                    "&:hover": { bgcolor: "#1557b0" },
                  }}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </form>
      </Box>
    </Box>
  );
}
