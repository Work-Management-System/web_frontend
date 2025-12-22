'use client'
import { io } from "socket.io-client";

let accessToken;
if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:9003';

if (!process.env.NEXT_PUBLIC_BACKEND_URL && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('NEXT_PUBLIC_BACKEND_URL or NEXT_PUBLIC_API_BASE_URL is not set. Using default localhost URL for socket connection.');
}

const socket = io(`${backendUrl}?token=${accessToken}`);

export default socket;