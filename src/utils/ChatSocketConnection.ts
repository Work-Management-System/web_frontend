'use client';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

let chatSocket: Socket | null = null;

export const getChatSocket = (): Socket => {
  if (chatSocket && chatSocket.connected) {
    return chatSocket;
  }

  const accessToken = Cookies.get('access_token');
  const tenant = Cookies.get('tenant');

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') ||
    'http://localhost:9003';

  if (!accessToken || !tenant) {
    throw new Error('Access token or tenant not found');
  }

  chatSocket = io(`${backendUrl}/chat`, {
    query: {
      token: accessToken,
      tenant: tenant,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return chatSocket;
};

export const disconnectChatSocket = () => {
  if (chatSocket) {
    chatSocket.disconnect();
    chatSocket = null;
  }
};

export default getChatSocket;
