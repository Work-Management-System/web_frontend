'use client';

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import getChatSocket from '@/utils/ChatSocketConnection';
import {
  addMessage,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  replaceOptimisticMessage,
  incrementUnreadCount,
  resetUnreadCount,
  markMessagesRead,
} from '@/redux/features/spacesSlice';
import { Message } from '@/redux/features/spacesSlice';
import { useAppselector } from '@/redux/store';

export function useSocketEvents() {
  const dispatch = useDispatch();
  const activeSpaceId = useAppselector((state) => state.spaces.activeSpaceId);
  const currentUser = useAppselector((state) => state.user.user);
  
  // Use refs to always have latest values in event handlers
  const activeSpaceIdRef = useRef(activeSpaceId);
  const currentUserRef = useRef(currentUser);
  
  // Keep refs updated
  useEffect(() => {
    activeSpaceIdRef.current = activeSpaceId;
  }, [activeSpaceId]);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    let socket;
    try {
      socket = getChatSocket();
    } catch (error) {
      console.error('Failed to connect to chat socket:', error);
      return;
    }

    // Message events
    socket.on('message.created', (message: Message) => {
      console.log('Received message.created event:', message);
      
      // Get latest values from refs
      const currentActiveSpaceId = activeSpaceIdRef.current;
      const currentUserData = currentUserRef.current;
      
      // Ensure message has required fields
      if (!message.space_id || !message.id) {
        console.warn('Invalid message received:', message);
        return;
      }
      
      // Ensure message has sender information
      if (!message.sender && message.sender_id) {
        console.warn('Message missing sender information:', message);
        // Message will be updated when fetched from server
      }
      
      // If message has client_message_id AND is from current user, replace optimistic message
      // Otherwise, it's a message from another user
      const isFromCurrentUser = currentUserData && message.sender_id === currentUserData.id;
      
      if (message.client_message_id && isFromCurrentUser) {
        // This is our own message being confirmed - replace optimistic version
        console.log('Replacing optimistic message:', message.client_message_id);
        dispatch(
          replaceOptimisticMessage({
            clientMessageId: message.client_message_id,
            message,
          })
        );
      } else {
        // This is a message from another user (or our own message without client_message_id)
        // Ensure delivered status is set if message has seq
        if (message.seq !== null && message.seq !== undefined) {
          message.delivered = true;
        }
        dispatch(addMessage(message));

        // If this is a message from another user in a different space (or no active space), increment unread count
        if (
          currentUserData &&
          message.sender_id !== currentUserData.id &&
          (currentActiveSpaceId === null || message.space_id !== currentActiveSpaceId)
        ) {
          console.log(`🔔 Incrementing unread count for space ${message.space_id}`, {
            activeSpaceId: currentActiveSpaceId,
            senderId: message.sender_id,
            currentUserId: currentUserData.id,
            hasClientMessageId: !!message.client_message_id,
          });
          dispatch(incrementUnreadCount({ spaceId: message.space_id }));
        } else {
          console.log('Not incrementing unread count:', {
            hasCurrentUser: !!currentUserData,
            isFromCurrentUser: isFromCurrentUser,
            isActiveSpace: currentActiveSpaceId === message.space_id,
            senderId: message.sender_id,
            currentUserId: currentUserData?.id,
          });
        }
      }
    });

    socket.on('message.updated', (message: Message) => {
      dispatch(updateMessage(message));
    });

    socket.on('message.deleted', (data: { message_id: string; space_id: string }) => {
      if (data.space_id) {
        dispatch(
          deleteMessage({
            spaceId: data.space_id,
            messageId: data.message_id,
          })
        );
      }
    });

    // Reaction events
    socket.on('reaction.added', (reaction: any) => {
      if (reaction.space_id) {
        dispatch(
          addReaction({
            spaceId: reaction.space_id,
            messageId: reaction.message_id,
            reaction: {
              id: reaction.id,
              message_id: reaction.message_id,
              user_id: reaction.user_id,
              emoji: reaction.emoji,
              user: reaction.user,
            },
          })
        );
      }
    });

    socket.on('reaction.removed', (data: {
      message_id: string;
      user_id: string;
      emoji: string;
      space_id: string;
    }) => {
      if (data.space_id) {
        dispatch(
          removeReaction({
            spaceId: data.space_id,
            messageId: data.message_id,
            userId: data.user_id,
            emoji: data.emoji,
          })
        );
      }
    });

    // Typing events
    socket.on('typing.started', (data: { user_id: string; space_id: string }) => {
      // Handle typing indicator
      console.log('User typing:', data);
    });

    socket.on('typing.stopped', (data: { user_id: string; space_id: string }) => {
      // Handle typing stop
      console.log('User stopped typing:', data);
    });

    // Presence events
    socket.on('presence.updated', (data: {
      user_id: string;
      status: string;
      last_seen_at: string;
    }) => {
      // Handle presence update
      console.log('Presence updated:', data);
    });

    // Read receipts / space read events
    socket.on('space.read', (data: {
      space_id: string;
      user_id: string;
      last_read_message_id?: string;
      last_read_seq?: number;
    }) => {
      console.log('Space read event:', data);

      if (!currentUser) return;

      if (data.user_id === currentUser.id) {
        // This client has marked the space as read - reset unread count
        dispatch(resetUnreadCount({ spaceId: data.space_id }));
      } else {
        // Another participant has read messages in this space - update read flags for our sent messages
        dispatch(
          markMessagesRead({
            spaceId: data.space_id,
            lastReadSeq: data.last_read_seq,
            readerUserId: data.user_id,
            currentUserId: currentUser.id,
          }),
        );
      }
    });

    // Error handling
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });

    socket.on('connect', () => {
      console.log('Connected to chat socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat socket');
    });

    return () => {
      if (socket) {
        socket.off('message.created');
        socket.off('message.updated');
        socket.off('message.deleted');
        socket.off('reaction.added');
        socket.off('reaction.removed');
        socket.off('typing.started');
        socket.off('typing.stopped');
        socket.off('presence.updated');
        socket.off('space.read');
        socket.off('error');
        socket.off('connect');
        socket.off('disconnect');
      }
    };
  }, [dispatch]);
}
