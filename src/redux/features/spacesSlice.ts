import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import createAxiosInstance from '@/app/axiosInstance';

export enum SpaceType {
  DM = 'DM',
  GROUP = 'GROUP',
  PROJECT = 'PROJECT',
  TENANT_WIDE = 'TENANT_WIDE',
}

export interface Space {
  id: string;
  tenant_id: string;
  type: SpaceType;
  name?: string;
  description?: string;
  is_archived: boolean;
  metadata?: Record<string, any>;
  created_by_id: string;
  current_seq?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  tenant_id: string;
  space_id: string;
  sender_id: string;
  parent_message_id?: string;
  content: string;
  content_type: string;
  metadata?: {
    mentions?: string[];
    link_previews?: Array<{
      url: string;
      title?: string;
      description?: string;
      image?: string;
    }>;
  };
  is_deleted: boolean;
  edited_at?: string;
  seq?: number;
  client_message_id?: string;
  created_at: string;
  updated_at: string;
  // Local-only fields for read receipts
  delivered?: boolean; // Message has been persisted and broadcasted
  read?: boolean; // Message has been marked as read by the other participant (DM)
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
  };
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    user?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    file_name: string;
    content_type: string;
    size_bytes: number;
    storage_key: string;
  }>;
}

interface SpacesState {
  spaces: Space[];
  activeSpaceId: string | null;
  messagesBySpaceId: Record<string, { messages: Message[]; hasMore: boolean }>;
  threadsByParentId: Record<string, { messages: Message[]; hasMore: boolean }>;
  unreadCounts: Record<string, number>;
  optimisticMessages: Record<string, Message>;
  loading: boolean;
  error: string | null;
}

const initialState: SpacesState = {
  spaces: [],
  activeSpaceId: null,
  messagesBySpaceId: {},
  threadsByParentId: {},
  unreadCounts: {},
  optimisticMessages: {},
  loading: false,
  error: null,
};

export const fetchSpaces = createAsyncThunk(
  'spaces/fetchSpaces',
  async (types?: string[]) => {
    try {
      const axiosInstance = createAxiosInstance();
      const typesParam = types ? `?types=${types.join(',')}` : '';
      const response = await axiosInstance.get(`/chat/spaces${typesParam}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch spaces');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'spaces/fetchMessages',
  async ({ spaceId, before, limit = 50 }: { spaceId: string; before?: string; limit?: number }) => {
    try {
      const axiosInstance = createAxiosInstance();
      const params = new URLSearchParams();
      if (before) params.append('before', before);
      params.append('limit', limit.toString());
      const response = await axiosInstance.get(
        `/chat/spaces/${spaceId}/messages?${params.toString()}`
      );
      
      // Ensure response has the correct structure
      const data = response.data?.data || response.data;
      return {
        spaceId,
        messages: data?.messages || [],
        hasMore: data?.hasMore || false,
        before, // Include before parameter to determine if it's pagination
      };
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const fetchThreadMessages = createAsyncThunk(
  'spaces/fetchThreadMessages',
  async ({ parentMessageId, before, limit = 50 }: { parentMessageId: string; before?: string; limit?: number }) => {
    try {
      const axiosInstance = createAxiosInstance();
      const params = new URLSearchParams();
      if (before) params.append('before', before);
      params.append('limit', limit.toString());
      const response = await axiosInstance.get(
        `/chat/messages/${parentMessageId}/thread?${params.toString()}`
      );
      return {
        parentMessageId,
        ...response.data.data,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch thread messages');
    }
  }
);

export const fetchUnreadCounts = createAsyncThunk(
  'spaces/fetchUnreadCounts',
  async () => {
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get('/chat/unread-counts');
      const counts = response.data.data;
      console.log('[Frontend] Fetched unread counts from backend:', counts);
      return counts;
    } catch (error: any) {
      console.error('Failed to fetch unread counts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch unread counts');
    }
  }
);

const spacesSlice = createSlice({
  name: 'spaces',
  initialState,
  reducers: {
    setActiveSpace: (state, action: PayloadAction<string | null>) => {
      state.activeSpaceId = action.payload;
    },
    addOptimisticMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      // Local status: sending
      message.delivered = false;
      message.read = false;
      state.optimisticMessages[message.client_message_id || message.id] = message;
      
      // Add to messages list
      if (!state.messagesBySpaceId[message.space_id]) {
        state.messagesBySpaceId[message.space_id] = { messages: [], hasMore: false };
      }
      state.messagesBySpaceId[message.space_id].messages.push(message);
    },
    replaceOptimisticMessage: (state, action: PayloadAction<{ clientMessageId: string; message: Message }>) => {
      const { clientMessageId, message } = action.payload;
      delete state.optimisticMessages[clientMessageId];
      
      // Mark as delivered (server has persisted and broadcasted it)
      message.delivered = true;
      
      // Ensure space exists
      if (!state.messagesBySpaceId[message.space_id]) {
        state.messagesBySpaceId[message.space_id] = { messages: [], hasMore: false };
      }
      
      // Replace in messages list
      const index = state.messagesBySpaceId[message.space_id].messages.findIndex(
        (m) => m.client_message_id === clientMessageId || m.id === clientMessageId || m.id === message.id
      );
      if (index !== -1) {
        // Replace existing message, preserving local read status if any
        const existing = state.messagesBySpaceId[message.space_id].messages[index];
        message.read = existing.read || message.read;
        state.messagesBySpaceId[message.space_id].messages[index] = message;
      } else {
        // If not found, add it (shouldn't happen but safety check)
        const exists = state.messagesBySpaceId[message.space_id].messages.some(
          (m) => m.id === message.id
        );
        if (!exists) {
          state.messagesBySpaceId[message.space_id].messages.push(message);
        }
      }
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (!state.messagesBySpaceId[message.space_id]) {
        state.messagesBySpaceId[message.space_id] = { messages: [], hasMore: false };
      }
      
      // Ensure delivered status is set if message has seq (it's been persisted)
      if (message.seq !== null && message.seq !== undefined && message.delivered === undefined) {
        message.delivered = true;
      }
      
      // Check if message already exists
      const exists = state.messagesBySpaceId[message.space_id].messages.some(
        (m) => m.id === message.id
      );
      
      if (!exists) {
        state.messagesBySpaceId[message.space_id].messages.push(message);
        // Sort messages by created_at to maintain chronological order
        state.messagesBySpaceId[message.space_id].messages.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          if (dateA !== dateB) return dateA - dateB;
          // If same timestamp, sort by id
          return a.id.localeCompare(b.id);
        });
      } else {
        // Update existing message to preserve read status but update other fields
        const index = state.messagesBySpaceId[message.space_id].messages.findIndex(
          (m) => m.id === message.id
        );
        if (index !== -1) {
          const existing = state.messagesBySpaceId[message.space_id].messages[index];
          // Preserve read status if it was already set
          message.read = existing.read || message.read;
          message.delivered = existing.delivered || message.delivered;
          state.messagesBySpaceId[message.space_id].messages[index] = message;
        }
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (state.messagesBySpaceId[message.space_id]) {
        const index = state.messagesBySpaceId[message.space_id].messages.findIndex(
          (m) => m.id === message.id
        );
        if (index !== -1) {
          state.messagesBySpaceId[message.space_id].messages[index] = message;
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<{ spaceId: string; messageId: string }>) => {
      const { spaceId, messageId } = action.payload;
      if (state.messagesBySpaceId[spaceId]) {
        state.messagesBySpaceId[spaceId].messages = state.messagesBySpaceId[spaceId].messages.filter(
          (m) => m.id !== messageId && m.client_message_id !== messageId
        );
      }
      // Also remove from optimistic messages
      delete state.optimisticMessages[messageId];
    },
    addReaction: (state, action: PayloadAction<{ spaceId: string; messageId: string; reaction: any }>) => {
      const { spaceId, messageId, reaction } = action.payload;
      if (state.messagesBySpaceId[spaceId]) {
        const message = state.messagesBySpaceId[spaceId].messages.find((m) => m.id === messageId);
        if (message) {
          if (!message.reactions) {
            message.reactions = [];
          }
          const exists = message.reactions.some(
            (r) => r.user_id === reaction.user_id && r.emoji === reaction.emoji
          );
          if (!exists) {
            message.reactions.push(reaction);
          }
        }
      }
    },
    removeReaction: (state, action: PayloadAction<{ spaceId: string; messageId: string; userId: string; emoji: string }>) => {
      const { spaceId, messageId, userId, emoji } = action.payload;
      if (state.messagesBySpaceId[spaceId]) {
        const message = state.messagesBySpaceId[spaceId].messages.find((m) => m.id === messageId);
        if (message && message.reactions) {
          message.reactions = message.reactions.filter(
            (r) => !(r.user_id === userId && r.emoji === emoji)
          );
        }
      }
    },
    updateUnreadCount: (state, action: PayloadAction<{ spaceId: string; count: number }>) => {
      const { spaceId, count } = action.payload;
      state.unreadCounts[spaceId] = count;
    },
    incrementUnreadCount: (state, action: PayloadAction<{ spaceId: string }>) => {
      const { spaceId } = action.payload;
      const current = state.unreadCounts[spaceId] || 0;
      state.unreadCounts[spaceId] = current + 1;
      console.log(`[Redux] Incremented unread count for space ${spaceId}: ${current} -> ${current + 1}`);
    },
    resetUnreadCount: (state, action: PayloadAction<{ spaceId: string }>) => {
      const { spaceId } = action.payload;
      state.unreadCounts[spaceId] = 0;
    },
    markMessagesRead: (
      state,
      action: PayloadAction<{
        spaceId: string;
        lastReadSeq?: number;
        readerUserId: string;
        currentUserId: string;
      }>,
    ) => {
      const { spaceId, lastReadSeq, readerUserId, currentUserId } = action.payload;
      const spaceMessages = state.messagesBySpaceId[spaceId];
      if (!spaceMessages) return;

      // Only update read status for messages sent by the current user
      // when another participant (readerUserId) has read them.
      if (readerUserId === currentUserId) {
        return;
      }

      spaceMessages.messages.forEach((m) => {
        if (m.sender_id === currentUserId) {
          if (lastReadSeq !== undefined && m.seq !== undefined) {
            if (m.seq <= lastReadSeq) {
              m.read = true;
            }
          } else {
            // If no seq provided, assume all messages are read
            m.read = true;
          }
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpaces.fulfilled, (state, action: PayloadAction<Space[]>) => {
        state.loading = false;
        state.spaces = action.payload;
      })
      .addCase(fetchSpaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch spaces';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { spaceId, messages, hasMore, before } = action.payload;
        if (!state.messagesBySpaceId[spaceId]) {
          state.messagesBySpaceId[spaceId] = { messages: [], hasMore: false };
        }
        
        // Ensure all fetched messages have proper delivered/read status from backend
        const messagesWithStatus = messages.map((msg: Message) => {
          // If backend didn't set delivered but message has seq, it's delivered
          if (msg.seq !== null && msg.seq !== undefined && msg.delivered === undefined) {
            msg.delivered = true;
          }
          return msg;
        });
        
        const existingMessages = state.messagesBySpaceId[spaceId].messages;
        
        // If 'before' parameter was provided, we're loading older messages (pagination)
        // Otherwise, this is a fresh load - replace all messages
        if (!before) {
          // Fresh load - replace all messages to ensure persistence
          state.messagesBySpaceId[spaceId].messages = messagesWithStatus;
        } else {
          // Pagination - merge with existing, avoiding duplicates
          const existingIds = new Set(existingMessages.map((m) => m.id));
          const newMessages = messagesWithStatus.filter((m: Message) => !existingIds.has(m.id));
          
          if (newMessages.length > 0) {
            // Check if we're loading older or newer messages
            const oldestExisting = existingMessages.length > 0 
              ? new Date(existingMessages[0].created_at).getTime() 
              : Infinity;
            const newestNew = new Date(newMessages[newMessages.length - 1].created_at).getTime();
            
            if (newestNew < oldestExisting) {
              // Loading older messages - prepend
              state.messagesBySpaceId[spaceId].messages = [
                ...newMessages,
                ...existingMessages,
              ];
            } else {
              // Loading newer messages - append
              state.messagesBySpaceId[spaceId].messages = [
                ...existingMessages,
                ...newMessages,
              ];
            }
          }
        }
        
        // Always sort messages after merging to ensure correct order
        if (state.messagesBySpaceId[spaceId].messages.length > 0) {
          state.messagesBySpaceId[spaceId].messages.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.id.localeCompare(b.id);
          });
        }
        
        state.messagesBySpaceId[spaceId].hasMore = hasMore;
      })
      .addCase(fetchThreadMessages.fulfilled, (state, action) => {
        const { parentMessageId, messages, hasMore } = action.payload;
        if (!state.threadsByParentId[parentMessageId]) {
          state.threadsByParentId[parentMessageId] = { messages: [], hasMore: false };
        }
        const existingIds = new Set(state.threadsByParentId[parentMessageId].messages.map((m) => m.id));
        const newMessages = messages.filter((m: Message) => !existingIds.has(m.id));
        state.threadsByParentId[parentMessageId].messages = [
          ...state.threadsByParentId[parentMessageId].messages,
          ...newMessages,
        ];
        state.threadsByParentId[parentMessageId].hasMore = hasMore;
      })
      .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
        // Replace all unread counts with fetched data
        console.log('[Redux] Setting unread counts:', action.payload);
        state.unreadCounts = action.payload;
        console.log('[Redux] Unread counts after setting:', state.unreadCounts);
      });
  },
});

export const {
  setActiveSpace,
  addOptimisticMessage,
  replaceOptimisticMessage,
  addMessage,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  updateUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
  markMessagesRead,
} = spacesSlice.actions;

export default spacesSlice.reducer;
