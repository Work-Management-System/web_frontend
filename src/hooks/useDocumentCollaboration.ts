"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppselector } from "@/redux/store";

export interface CollaboratorPresence {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  color: string;
  cursor?: { from: number; to: number }; // Editor cursor position
  selection?: { from: number; to: number }; // Text selection range
  status: "viewing" | "editing" | "commenting";
  joinedAt: Date;
}

interface UseDocumentCollaborationProps {
  projectId: string;
  documentId: string;
  enabled?: boolean;
  onContentUpdate?: (content: any, from: string) => void;
}

interface DocumentState {
  content: any;
  title: string;
  isLocked: boolean;
  lockedBy?: { id: string; name: string };
  userPermission: "view" | "comment" | "edit";
}

export const useDocumentCollaboration = ({
  projectId,
  documentId,
  enabled = true,
  onContentUpdate,
}: UseDocumentCollaborationProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>(
    []
  );
  const [documentState, setDocumentState] = useState<DocumentState | null>(
    null
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedBy, setSavedBy] = useState<string>("");

  const authData = useAppselector((state) => state.auth.value);
  const socketRef = useRef<Socket | null>(null);
  const onContentUpdateRef = useRef(onContentUpdate);
  
  // Keep the callback ref updated
  useEffect(() => {
    onContentUpdateRef.current = onContentUpdate;
  }, [onContentUpdate]);

  const getBackendUrl = () => {
    // Get the backend URL from environment or default
    // Check multiple env vars for compatibility
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') ||
      "http://localhost:9003";
    return `${backendUrl}/documents`;
  };

  // Get user and tenant IDs from auth state
  const userId = authData?.user?.id?.toString();
  // Use subdomain (e.g. "praxis") not schema_name (e.g. "tenant_praxis")
  const tenantId = authData?.tenant?.subdomain || authData?.tenant?.schema_name?.replace('tenant_', '') || authData?.tenant?.id;

  // Initialize socket connection
  useEffect(() => {
    console.log("[DocumentCollaboration] Init check:", { enabled, documentId, projectId, userId, tenantId });
    
    if (!enabled || !documentId || !projectId || !userId || !tenantId) {
      console.log("[DocumentCollaboration] Missing required params, not connecting");
      return;
    }

    const backendUrl = getBackendUrl();
    console.log("[DocumentCollaboration] Connecting to:", backendUrl);

    const socketInstance = io(backendUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("[DocumentCollaboration] Connected! Socket ID:", socketInstance.id);
      setConnected(true);
      // Join the document room
      socketInstance.emit("join-document", {
        documentId,
        projectId,
        tenantId,
        userId,
      });
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[DocumentCollaboration] Disconnected:", reason);
      setConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[DocumentCollaboration] Connection error:", error.message);
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("[DocumentCollaboration] Socket error:", error.message);
    });

    // Handle document state
    socketInstance.on("document-state", (state: DocumentState) => {
      setDocumentState(state);
    });

    // Handle users presence
    socketInstance.on(
      "users-present",
      (data: { users: CollaboratorPresence[] }) => {
        setCollaborators(data.users);
      }
    );

    socketInstance.on(
      "user-joined",
      (data: { user: CollaboratorPresence; allUsers: CollaboratorPresence[] }) => {
        setCollaborators(data.allUsers);
      }
    );

    socketInstance.on(
      "user-left",
      (data: { userId: string; allUsers: CollaboratorPresence[] }) => {
        setCollaborators(data.allUsers);
      }
    );

    socketInstance.on(
      "user-status-update",
      (data: {
        userId: string;
        status: "viewing" | "editing" | "commenting";
        allUsers: CollaboratorPresence[];
      }) => {
        setCollaborators(data.allUsers);
      }
    );

    // Handle cursor updates (editor position, not mouse position)
    socketInstance.on(
      "cursor-update",
      (data: {
        socketId: string;
        userId: string;
        cursor: { from: number; to: number };
        color: string;
        name: string;
      }) => {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.id === data.userId ? { ...c, cursor: data.cursor } : c
          )
        );
      }
    );

    // Handle selection updates
    socketInstance.on(
      "selection-update",
      (data: {
        socketId: string;
        userId: string;
        selection: { from: number; to: number };
        color: string;
        name: string;
      }) => {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.id === data.userId 
              ? { ...c, selection: data.selection, cursor: data.selection } 
              : c
          )
        );
      }
    );

    // Handle content save confirmations
    socketInstance.on(
      "content-saved",
      (data: { savedAt: Date; savedBy: string }) => {
        setLastSaved(new Date(data.savedAt));
        setSavedBy(data.savedBy);
      }
    );

    // Handle lock changes
    socketInstance.on(
      "lock-change",
      (data: { isLocked: boolean; lockedBy?: { id: string; name: string } }) => {
        setDocumentState((prev) =>
          prev ? { ...prev, isLocked: data.isLocked, lockedBy: data.lockedBy } : prev
        );
      }
    );

    // Handle real-time content updates from other users
    socketInstance.on(
      "sync-update",
      (data: { update: any; origin: string; from: string; cursorPosition?: { from: number; to: number } }) => {
        // Update collaborator's cursor position if provided
        if (data.cursorPosition && data.origin) {
          setCollaborators((prev) =>
            prev.map((c) =>
              c.id === data.origin
                ? { ...c, cursor: data.cursorPosition, selection: data.cursorPosition }
                : c
            )
          );
        }
        
        if (onContentUpdateRef.current) {
          onContentUpdateRef.current(data.update, data.from);
        }
      }
    );

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      if (socketInstance.connected) {
        socketInstance.emit("leave-document", {
          documentId,
          tenantId,
        });
      }
      socketInstance.disconnect();
      setSocket(null);
      socketRef.current = null;
    };
  }, [enabled, documentId, projectId, userId, tenantId]);

  // Send cursor position (editor positions, not screen coordinates)
  const sendCursorMove = useCallback(
    (from: number, to: number) => {
      if (socketRef.current?.connected && tenantId) {
        socketRef.current.emit("cursor-move", {
          from,
          to,
          documentId,
          tenantId,
        });
      }
    },
    [documentId, tenantId]
  );

  // Send selection change
  const sendSelectionChange = useCallback(
    (from: number, to: number) => {
      if (socketRef.current?.connected && tenantId) {
        socketRef.current.emit("selection-change", {
          from,
          to,
          documentId,
          tenantId,
        });
      }
    },
    [documentId, tenantId]
  );

  // Send status change
  const sendStatusChange = useCallback(
    (status: "viewing" | "editing" | "commenting") => {
      if (socketRef.current?.connected && tenantId) {
        socketRef.current.emit("status-change", {
          status,
          documentId,
          tenantId,
        });
      }
    },
    [documentId, tenantId]
  );

  // Broadcast content update to other users in real-time
  // Include cursor position so it stays in sync with content
  const broadcastContentUpdate = useCallback(
    (content: any, cursorPosition?: { from: number; to: number }) => {
      if (socketRef.current?.connected && tenantId) {
        socketRef.current.emit("sync-update", {
          documentId,
          projectId,
          tenantId,
          update: content,
          cursorPosition,
          origin: userId,
        });
      }
    },
    [documentId, projectId, tenantId, userId]
  );

  // Save content to database
  const saveContent = useCallback(
    (content: any) => {
      if (socketRef.current?.connected && tenantId) {
        socketRef.current.emit("content-save", {
          documentId,
          projectId,
          tenantId,
          content,
        });
      }
    },
    [documentId, projectId, tenantId]
  );

  return {
    socket,
    connected,
    collaborators,
    documentState,
    lastSaved,
    savedBy,
    sendCursorMove,
    sendSelectionChange,
    sendStatusChange,
    broadcastContentUpdate,
    saveContent,
  };
};

