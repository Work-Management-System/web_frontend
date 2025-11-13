'use client'
import { io } from "socket.io-client";

let accessToken;
if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
}

const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}?token=${accessToken}`);

export default socket;