'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  List,
  ListItem,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Link,
  Button,
  Badge,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Popover,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import TagIcon from '@mui/icons-material/Tag';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import { useAppselector } from '@/redux/store';
import { useDispatch } from 'react-redux';
import {
  fetchMessages,
  addOptimisticMessage,
  replaceOptimisticMessage,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  addMessage,
  resetUnreadCount,
} from '@/redux/features/spacesSlice';
import { Message, SpaceType } from '@/redux/features/spacesSlice';
import getChatSocket from '@/utils/ChatSocketConnection';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import createAxiosInstance from '@/app/axiosInstance';

dayjs.extend(relativeTime);

interface ChatPanelProps {
  spaceId: string;
  onBackClick?: () => void;
  onToggleInfo?: () => void;
  showInfoPanel?: boolean;
}

export default function ChatPanel({ spaceId, onBackClick, onToggleInfo, showInfoPanel }: ChatPanelProps) {
  const dispatch = useDispatch();
  const { messagesBySpaceId, spaces } = useAppselector((state) => state.spaces);
  const currentUser = useAppselector((state) => state.user.user);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{
    element: HTMLElement;
    message: Message;
  } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<{
    element: HTMLElement;
    message: Message;
  } | null>(null);
  const [composerEmojiAnchor, setComposerEmojiAnchor] = useState<HTMLElement | null>(null);
  const messages = messagesBySpaceId[spaceId]?.messages || [];
  const axiosInstance = createAxiosInstance();

  // Get current space info
  const currentSpace = spaces.find(s => s.id === spaceId);
  const isDM = currentSpace?.type === SpaceType.DM;

  // Get display name for header
  const getHeaderTitle = () => {
    if (!currentSpace) return 'Chat';
    if (isDM && currentSpace.otherMember) {
      return `${currentSpace.otherMember.first_name || ''} ${currentSpace.otherMember.last_name || ''}`.trim() || 'Chat';
    }
    return currentSpace.name || 'Chat';
  };

  // Get avatar info
  const getHeaderAvatar = () => {
    if (!currentSpace) return { src: '', initials: '?' };
    if (isDM && currentSpace.otherMember) {
      return {
        src: currentSpace.otherMember.profile_image || '',
        initials: `${currentSpace.otherMember.first_name?.[0] || ''}${currentSpace.otherMember.last_name?.[0] || ''}`,
      };
    }
    return {
      src: '',
      initials: currentSpace.name?.[0] || '?',
    };
  };

  const headerAvatar = getHeaderAvatar();

  // Generate consistent colors for avatars
  const getAvatarColor = (name: string) => {
    const colors = [
      '#5682a3', '#e17076', '#7bc862', '#faa05a', '#6ec9cb',
      '#ee7aae', '#a695e7', '#65aadd', '#ee7aae', '#ffc764',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (spaceId) {
      // Don't reset unread count here - it will be reset when read status is updated
      // The backend will update last_read_seq, and the next fetchUnreadCounts will reflect 0
      
      dispatch(fetchMessages({ spaceId, limit: 50 })).then((result) => {
        console.log('Fetched messages:', result);
      }).catch((error) => {
        console.error('Failed to fetch messages:', error);
      });
      
      try {
        const socket = getChatSocket();
        const joinSpace = () => {
          socket.emit('join-space', { spaceId });
          console.log(`Joined space room: ${spaceId}`);
        };
        
        if (socket && socket.connected) {
          joinSpace();
        } else {
          socket.once('connect', () => {
            joinSpace();
          });
        }
      } catch (error) {
        console.error('Failed to join space:', error);
      }
    }
  }, [spaceId, dispatch]);

  useEffect(() => {
    if (spaceId && messages.length > 0 && currentUser?.id) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender_id !== currentUser.id && lastMessage.seq) {
        try {
          const axiosInstance = createAxiosInstance();
          axiosInstance.post(`/chat/spaces/${spaceId}/read`, {
            last_read_message_id: lastMessage.id,
            last_read_seq: lastMessage.seq,
          }).then(() => {
            // After successfully updating read status, reset unread count
            console.log(`Read status updated for space ${spaceId}, resetting unread count`);
            dispatch(resetUnreadCount({ spaceId }));
          }).catch(err => console.error('Failed to update read status:', err));
        } catch (error) {
          console.error('Error updating read status:', error);
        }
      }
    }
  }, [spaceId, messages, currentUser?.id, dispatch]);

  useEffect(() => {
    if (!spaceId || !currentUser?.id || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.sender_id === currentUser.id) return;

    const timeoutId = setTimeout(() => {
      try {
        const socket = getChatSocket();
        socket.emit('space.read', {
          spaceId,
          last_read_message_id: lastMessage.id,
          last_read_seq: lastMessage.seq,
        });
      } catch (error) {
        console.error('Failed to emit space.read event:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [spaceId, messages.length > 0 ? messages[messages.length - 1]?.id : null, currentUser?.id]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop } = container;
    if (scrollTop < 200) {
      const currentMessages = messagesBySpaceId[spaceId]?.messages || [];
      const hasMore = messagesBySpaceId[spaceId]?.hasMore;
      
      if (hasMore && currentMessages.length > 0) {
        const oldestMessage = currentMessages[0];
        dispatch(fetchMessages({ spaceId, before: oldestMessage.id, limit: 50 }));
      }
    }
  }, [spaceId, messagesBySpaceId, dispatch]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    let socket;
    try {
      socket = getChatSocket();

      const handleTypingStart = (data: { user_id: string; space_id: string }) => {
        if (data.space_id === spaceId && data.user_id !== currentUser?.id) {
          setTypingUsers((prev) => new Set(prev).add(data.user_id));
        }
      };

      const handleTypingStop = (data: { user_id: string; space_id: string }) => {
        if (data.space_id === spaceId) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.user_id);
            return next;
          });
        }
      };

      socket.on('typing.started', handleTypingStart);
      socket.on('typing.stopped', handleTypingStop);

      return () => {
        socket.off('typing.started', handleTypingStart);
        socket.off('typing.stopped', handleTypingStop);
      };
    } catch (error) {
      console.error('Socket error:', error);
    }
  }, [spaceId, currentUser?.id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const clientMessageId = `temp-${Date.now()}`;
    const messageContent = message.trim();
    
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(messageContent)) !== null) {
      mentions.push(match[1]);
    }

    const optimisticMessage: Message = {
      id: clientMessageId,
      tenant_id: '',
      space_id: spaceId,
      sender_id: currentUser?.id || '',
      content: messageContent,
      content_type: 'TEXT',
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_message_id: clientMessageId,
      parent_message_id: replyingTo?.id,
      metadata: mentions.length > 0 ? { mentions } : undefined,
      sender: {
        id: currentUser?.id || '',
        first_name: currentUser?.first_name || '',
        last_name: currentUser?.last_name || '',
        profile_image: currentUser?.profile_image,
      },
    };

    dispatch(addOptimisticMessage(optimisticMessage));
    const replyToId = replyingTo?.id;
    setMessage('');
    setReplyingTo(null);

    try {
      const socket = getChatSocket();
      if (!socket || !socket.connected) {
        console.error('Socket not connected, cannot send message');
        dispatch(deleteMessage({ spaceId, messageId: clientMessageId }));
        alert('Connection lost. Please refresh the page.');
        return;
      }
      
      const messagePayload = {
        space_id: spaceId,
        content: messageContent,
        client_message_id: clientMessageId,
        parent_message_id: replyToId || undefined,
        metadata: mentions.length > 0 ? { mentions } : undefined,
      };
      
      console.log('Sending message with payload:', messagePayload);
      socket.emit('message.send', messagePayload);
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(deleteMessage({ spaceId, messageId: clientMessageId }));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTyping = useCallback(() => {
    try {
      const socket = getChatSocket();
      socket.emit('typing.start', { spaceId });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [spaceId]);

  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, message: Message) => {
    setMessageMenuAnchor({ element: event.currentTarget, message });
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    // Don't auto-add @mention - user can type it if they want
    setTimeout(() => {
      const input = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }, 100);
    handleMessageMenuClose();
  };

  const handleMention = () => {
    setMessage(message + '@');
    setTimeout(() => {
      const input = document.querySelector('textarea[placeholder="Type a message..."]') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }, 100);
  };

  const handleEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    handleMessageMenuClose();
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      const socket = getChatSocket();
      socket.emit('message.edit', {
        messageId: editingMessageId,
        content: editContent.trim(),
      });
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDelete = async (message: Message) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      handleMessageMenuClose();
      return;
    }

    try {
      const socket = getChatSocket();
      socket.emit('message.delete', { messageId: message.id });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
    handleMessageMenuClose();
  };

  const handleAddReaction = async (msg: Message, emoji: string) => {
    try {
      const socket = getChatSocket();
      socket.emit('reaction.add', {
        message_id: msg.id,
        emoji,
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
    setEmojiPickerAnchor(null);
    handleMessageMenuClose();
  };

  const handleOpenEmojiPicker = (event: React.MouseEvent<HTMLElement>, msg: Message) => {
    setEmojiPickerAnchor({ element: event.currentTarget, message: msg });
    handleMessageMenuClose();
  };

  const handleCloseEmojiPicker = () => {
    setEmojiPickerAnchor(null);
  };

  const handleOpenComposerEmoji = (event: React.MouseEvent<HTMLElement>) => {
    setComposerEmojiAnchor(event.currentTarget);
  };

  const handleCloseComposerEmoji = () => {
    setComposerEmojiAnchor(null);
  };

  const handleInsertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    handleCloseComposerEmoji();
  };

  // Common emojis for reactions and composer
  const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '💯'];
  const COMPOSER_EMOJIS = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲',
    '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
    '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🖐️',
    '✋', '👏', '🙌', '👐', '🤲', '🙏', '💪', '❤️', '🧡', '💛',
    '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞',
    '💓', '💗', '💖', '💘', '💝', '🔥', '⭐', '🌟', '✨', '💯',
  ];

  const formatTime = (date: string) => {
    return dayjs(date).format('h:mm A');
  };

  const formatDateSeparator = (date: string) => {
    const messageDate = dayjs(date);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    if (messageDate.isSame(today, 'day')) {
      return 'TODAY';
    } else if (messageDate.isSame(yesterday, 'day')) {
      return 'YESTERDAY';
    } else {
      return messageDate.format('MMMM D, YYYY').toUpperCase();
    }
  };

  const renderMessageContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(
        <Typography
          component="span"
          key={match.index}
          sx={{
            color: '#1a73e8',
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          @{match[1]}
        </Typography>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  // Group messages by sender and time
  const groupedMessages: Array<{ messages: Message[]; sender: any; date: string }> = [];
  let currentGroup: { messages: Message[]; sender: any; date: string } | null = null;

  messages.forEach((msg) => {
    const msgDate = dayjs(msg.created_at).format('YYYY-MM-DD');
    const timeDiff = currentGroup
      ? dayjs(msg.created_at).diff(dayjs(currentGroup.messages[0].created_at), 'minute')
      : Infinity;

    if (
      !currentGroup ||
      msg.sender_id !== currentGroup.sender?.id ||
      timeDiff > 5 ||
      msgDate !== currentGroup.date
    ) {
      currentGroup = {
        messages: [msg],
        sender: msg.sender,
        date: msgDate,
      };
      groupedMessages.push(currentGroup);
    } else {
      currentGroup.messages.push(msg);
    }
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e8e8e8',
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 72,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {onBackClick && (
            <IconButton onClick={onBackClick} sx={{ mr: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#44b700',
                border: '2px solid #fff',
              },
            }}
          >
            <Avatar
              src={headerAvatar.src}
              sx={{
                width: 44,
                height: 44,
                bgcolor: getAvatarColor(getHeaderTitle()),
                fontSize: '1rem',
              }}
            >
              {headerAvatar.initials}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', lineHeight: 1.2 }}>
              {getHeaderTitle()}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8e8e8e' }}>
              {isDM ? 'last seen 34 minutes ago' : `${currentSpace?.memberCount || 0} members`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Search">
            <IconButton sx={{ color: '#666' }}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Call">
            <IconButton sx={{ color: '#666' }}>
              <PhoneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={showInfoPanel ? 'Hide info' : 'Show info'}>
            <IconButton onClick={onToggleInfo} sx={{ color: showInfoPanel ? '#1a73e8' : '#666' }}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 2,
          py: 2,
          bgcolor: '#f8f9fa',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {groupedMessages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: '#e8f0fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: 32 }}>💬</Typography>
            </Box>
            <Typography variant="h6" color="text.secondary">
              No messages yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start the conversation by sending a message
            </Typography>
          </Box>
        ) : (
          groupedMessages.map((group, groupIndex) => {
            const isOwnMessage = group.sender?.id === currentUser?.id;
            const showDateSeparator =
              groupIndex === 0 ||
              dayjs(group.date).format('YYYY-MM-DD') !==
                dayjs(groupedMessages[groupIndex - 1].date).format('YYYY-MM-DD');

            return (
              <React.Fragment key={groupIndex}>
                {showDateSeparator && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      my: 3,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        px: 2,
                        py: 0.5,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        borderRadius: '12px',
                        color: '#8e8e8e',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {formatDateSeparator(group.date)}
                    </Typography>
                  </Box>
                )}

                {group.messages.map((msg, msgIndex) => {
                  const showAvatar = msgIndex === 0;
                  const showName = !isOwnMessage && msgIndex === 0;

                  return (
                    <Box
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        mb: 0.5,
                        px: 1,
                        '&:hover .message-actions': {
                          opacity: 1,
                        },
                        scrollMarginTop: '100px',
                      }}
                    >
                      {!isOwnMessage && (
                        <Avatar
                          src={group.sender?.profile_image}
                          sx={{
                            width: 36,
                            height: 36,
                            mr: 1.5,
                            visibility: showAvatar ? 'visible' : 'hidden',
                            bgcolor: getAvatarColor(`${group.sender?.first_name || ''} ${group.sender?.last_name || ''}`),
                            fontSize: '0.875rem',
                          }}
                        >
                          {group.sender?.first_name?.[0]}
                          {group.sender?.last_name?.[0]}
                        </Avatar>
                      )}

                      <Box
                        sx={{
                          maxWidth: '70%',
                          position: 'relative',
                        }}
                      >
                        {showName && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600, color: getAvatarColor(`${group.sender?.first_name || ''} ${group.sender?.last_name || ''}`) }}
                            >
                              {group.sender?.first_name} {group.sender?.last_name}
                            </Typography>
                            {/* Optional tag badges */}
                            {msg.metadata?.tags && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {msg.metadata.tags.map((tag: string, idx: number) => (
                                  <Chip
                                    key={idx}
                                    label={tag}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      bgcolor: tag === 'Important' ? '#e53935' : '#1a73e8',
                                      color: '#fff',
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                        )}

                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: isOwnMessage ? '#e7f3ff' : '#fff',
                            borderRadius: isOwnMessage 
                              ? '16px 16px 4px 16px' 
                              : '16px 16px 16px 4px',
                            position: 'relative',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          {/* Reply Preview - WhatsApp/Telegram style */}
                          {msg.parent_message_id && (() => {
                            const parentMsg = messages.find(m => m.id === msg.parent_message_id);
                            const isReplyToSelf = parentMsg?.sender_id === currentUser?.id;
                            const replyToName = isReplyToSelf 
                              ? 'You' 
                              : `${parentMsg?.sender?.first_name || ''} ${parentMsg?.sender?.last_name || ''}`.trim() || 'Unknown';
                            
                            return (
                              <Box
                                sx={{
                                  mb: 1,
                                  p: 1,
                                  bgcolor: isOwnMessage ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.03)',
                                  borderRadius: '8px',
                                  borderLeft: '3px solid #25D366',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  // Scroll to parent message
                                  const element = document.getElementById(`msg-${msg.parent_message_id}`);
                                  element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#25D366',
                                    display: 'block',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {replyToName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#666',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '200px',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {parentMsg?.content || 'Message not found'}
                                </Typography>
                              </Box>
                            );
                          })()}
                          
                          <Typography
                            variant="body2"
                            sx={{
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap',
                              color: '#333',
                              lineHeight: 1.5,
                            }}
                          >
                            {renderMessageContent(msg.content)}
                          </Typography>

                          {msg.edited_at && (
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', mt: 0.5, opacity: 0.6, fontStyle: 'italic' }}
                            >
                              (edited)
                            </Typography>
                          )}

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                              {Object.entries(
                                msg.reactions.reduce((acc: any, r: any) => {
                                  if (!acc[r.emoji]) {
                                    acc[r.emoji] = [];
                                  }
                                  acc[r.emoji].push(r);
                                  return acc;
                                }, {})
                              ).map(([emoji, reactions]: [string, any]) => (
                                <Chip
                                  key={emoji}
                                  label={`${emoji} ${reactions.length}`}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    bgcolor: isOwnMessage ? '#c5dcf7' : '#f0f2f5',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                  }}
                                  onClick={() => {
                                    const hasReacted = reactions.some(
                                      (r: any) => r.user_id === currentUser?.id
                                    );
                                    if (hasReacted) {
                                      const socket = getChatSocket();
                                      socket.emit('reaction.remove', {
                                        message_id: msg.id,
                                        emoji,
                                      });
                                    } else {
                                      handleAddReaction(msg, emoji);
                                    }
                                  }}
                                />
                              ))}
                            </Box>
                          )}

                          {/* Message actions (hover) */}
                          <Box
                            className="message-actions"
                            sx={{
                              position: 'absolute',
                              right: isOwnMessage ? 'auto' : -36,
                              left: isOwnMessage ? -36 : 'auto',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              display: 'flex',
                              gap: 0.5,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => handleMessageMenuOpen(e, msg)}
                              sx={{ 
                                bgcolor: '#fff', 
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: '#f5f5f5' },
                              }}
                            >
                              <MoreVertIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                              gap: 0.5,
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#8e8e8e',
                                fontSize: '0.7rem',
                              }}
                            >
                              {formatTime(msg.created_at)}
                            </Typography>
                            {isOwnMessage && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {msg.read ? (
                                  <DoneAllIcon
                                    sx={{
                                      fontSize: 14,
                                      color: '#1a73e8',
                                    }}
                                  />
                                ) : msg.delivered ? (
                                  <DoneAllIcon
                                    sx={{
                                      fontSize: 14,
                                      color: '#8e8e8e',
                                    }}
                                  />
                                ) : (
                                  <CheckIcon
                                    sx={{
                                      fontSize: 14,
                                      color: '#8e8e8e',
                                    }}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    </Box>
                  );
                })}
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 1 }}>
            <Box
              sx={{
                display: 'flex',
                gap: '4px',
                bgcolor: '#fff',
                px: 2,
                py: 1,
                borderRadius: '16px',
              }}
            >
              <Box sx={{ width: 6, height: 6, bgcolor: '#666', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0s' }} />
              <Box sx={{ width: 6, height: 6, bgcolor: '#666', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }} />
              <Box sx={{ width: 6, height: 6, bgcolor: '#666', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }} />
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Composer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e8e8e8',
          bgcolor: '#fff',
          flexShrink: 0,
        }}
      >
        {/* Reply preview */}
        {replyingTo && !editingMessageId && (
          <Box
            sx={{
              mb: 1.5,
              p: 1.5,
              bgcolor: '#f8f9fa',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '3px solid #1a73e8',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a73e8' }}>
                Replying to {replyingTo.sender?.first_name} {replyingTo.sender?.last_name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#666', mt: 0.5 }}>
                {replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setReplyingTo(null)}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}
        
        {editingMessageId ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit message..."
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                },
              }}
            />
            <Button onClick={handleSaveEdit} variant="contained" size="small" sx={{ borderRadius: '20px' }}>
              Save
            </Button>
            <Button
              onClick={() => {
                setEditingMessageId(null);
                setEditContent('');
              }}
              size="small"
              sx={{ borderRadius: '20px' }}
            >
              Cancel
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSendMessage}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <Tooltip title="Attach file">
                <IconButton size="small" sx={{ color: '#666' }}>
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    bgcolor: '#f4f4f4',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: '1px solid #1a73e8',
                    },
                  },
                }}
              />
              <Tooltip title="Emoji">
                <IconButton 
                  size="small" 
                  sx={{ color: composerEmojiAnchor ? '#1a73e8' : '#666' }}
                  onClick={handleOpenComposerEmoji}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
              </Tooltip>
              {message.trim() ? (
                <Tooltip title="Send">
                  <IconButton
                    type="submit"
                    sx={{
                      bgcolor: '#1a73e8',
                      color: '#fff',
                      '&:hover': { bgcolor: '#1557b0' },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Voice message">
                  <IconButton sx={{ color: '#666' }}>
                    <MicIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </form>
        )}
      </Box>

      {/* Message Menu */}
      <Menu
        anchorEl={messageMenuAnchor?.element}
        open={!!messageMenuAnchor}
        onClose={handleMessageMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          },
        }}
      >
        <MenuItem onClick={() => handleReply(messageMenuAnchor!.message)} sx={{ fontSize: '0.875rem' }}>
          <ReplyIcon sx={{ mr: 1.5, fontSize: 18 }} /> Reply
        </MenuItem>
        {messageMenuAnchor?.message.sender_id === currentUser?.id && (
          <MenuItem onClick={() => handleEdit(messageMenuAnchor!.message)} sx={{ fontSize: '0.875rem' }}>
            <EditIcon sx={{ mr: 1.5, fontSize: 18 }} /> Edit
          </MenuItem>
        )}
        <MenuItem 
          onClick={(e) => handleOpenEmojiPicker(e, messageMenuAnchor!.message)} 
          sx={{ fontSize: '0.875rem' }}
        >
          <AddReactionIcon sx={{ mr: 1.5, fontSize: 18 }} /> React
        </MenuItem>
        {messageMenuAnchor?.message.sender_id === currentUser?.id && (
          <MenuItem 
            onClick={() => handleDelete(messageMenuAnchor!.message)} 
            sx={{ fontSize: '0.875rem', color: '#e53935' }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} /> Delete
          </MenuItem>
        )}
      </Menu>

      {/* Emoji Picker for Reactions */}
      <Popover
        open={!!emojiPickerAnchor}
        anchorEl={emojiPickerAnchor?.element}
        onClose={handleCloseEmojiPicker}
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
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            p: 1.5,
          },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 1, display: 'block' }}>
          Choose a reaction
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 280 }}>
          {REACTION_EMOJIS.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => emojiPickerAnchor && handleAddReaction(emojiPickerAnchor.message, emoji)}
              sx={{
                fontSize: '1.5rem',
                width: 44,
                height: 44,
                '&:hover': {
                  bgcolor: '#f0f2f5',
                  transform: 'scale(1.2)',
                },
                transition: 'transform 0.15s ease',
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>

      {/* Emoji Picker for Composer */}
      <Popover
        open={!!composerEmojiAnchor}
        anchorEl={composerEmojiAnchor}
        onClose={handleCloseComposerEmoji}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            p: 2,
            maxHeight: 300,
            overflow: 'auto',
          },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', mb: 1.5, display: 'block' }}>
          Emojis
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap', maxWidth: 320 }}>
          {COMPOSER_EMOJIS.map((emoji, index) => (
            <IconButton
              key={index}
              onClick={() => handleInsertEmoji(emoji)}
              sx={{
                fontSize: '1.25rem',
                width: 36,
                height: 36,
                '&:hover': {
                  bgcolor: '#f0f2f5',
                  transform: 'scale(1.15)',
                },
                transition: 'transform 0.1s ease',
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>

      {/* Add keyframe animation for typing indicator */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </Box>
  );
}
