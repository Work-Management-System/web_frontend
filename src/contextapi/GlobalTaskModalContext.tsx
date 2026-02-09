"use client";

import React, {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const TaskDrawerLazy = lazy(
  () => import("@/app/(DashboardLayout)/components/task-modal/TaskDrawer"),
);

export interface OpenTaskModalPrefill {
  title?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  description?: string;
  assigneeId?: string;
  etaMinutes?: string;
  subtasks?: string[];
}

interface GlobalTaskModalContextValue {
  isOpen: boolean;
  prefill: OpenTaskModalPrefill | null;
  openTaskModal: (data?: OpenTaskModalPrefill) => void;
  closeTaskModal: () => void;
}

const GlobalTaskModalContext =
  createContext<GlobalTaskModalContextValue | null>(null);

const KEYBOARD_SHORTCUT = "k";
const MOD_KEY =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    ? "metaKey"
    : "ctrlKey";

export function GlobalTaskModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<OpenTaskModalPrefill | null>(null);

  const openTaskModal = useCallback((data?: OpenTaskModalPrefill) => {
    setPrefill(data ?? null);
    setIsOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setIsOpen(false);
    setPrefill(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== KEYBOARD_SHORTCUT || !e[MOD_KEY]) return;
      e.preventDefault();
      openTaskModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openTaskModal]);

  const value = useMemo(
    () => ({ isOpen, prefill, openTaskModal, closeTaskModal }),
    [isOpen, prefill, openTaskModal, closeTaskModal],
  );

  return (
    <GlobalTaskModalContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <TaskDrawerLazy />
      </Suspense>
    </GlobalTaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const ctx = useContext(GlobalTaskModalContext);
  if (!ctx) {
    throw new Error("useTaskModal must be used within GlobalTaskModalProvider");
  }
  return ctx;
}

export function useTaskModalOptional() {
  return useContext(GlobalTaskModalContext);
}
