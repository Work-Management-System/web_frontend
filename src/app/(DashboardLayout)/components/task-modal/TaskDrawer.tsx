"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import { useTaskModal } from "@/contextapi/GlobalTaskModalContext";
import toast from "react-hot-toast";
import FullTaskFormModal from "./FullTaskFormModal";

const PRIORITY_OPTIONS = [
  { value: "p1", label: "P1 – High" },
  { value: "p2", label: "P2 – Medium" },
  { value: "p3", label: "P3 – Low" },
] as const;

interface ProjectOption {
  id: string;
  title: string;
}

interface UserOption {
  id: string;
  first_name: string;
  last_name: string;
}

const DRAWER_WIDTH = 400;
const FAB_SIZE = 48;

export default function TaskDrawer() {
  const pathname = usePathname();
  const { isOpen, prefill, openTaskModal, closeTaskModal } = useTaskModal();
  const [isPopupView, setIsPopupView] = useState(false);
  const isOnTasksPage = pathname === "/tasks";
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("p3");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const axiosInstance = useMemo(() => createAxiosInstance(), []);
  const authData = useAppselector((state) => state.auth.value);
  const rolePriority = useAppselector(
    (state) => state.role.value?.priority ?? 3,
  );
  const userId = authData?.user?.id ?? "";
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }
    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;
    if (justOpened) {
      setIsPopupView(false);
      setTitle(prefill?.title ?? "");
      setProjectId(prefill?.projectId ?? "");
      setPriority(prefill?.priority ?? "p3");
      setDescription(prefill?.description ?? "");
      setSubtasks(prefill?.subtasks ? [...prefill.subtasks] : []);
      setAssigneeId(prefill?.assigneeId ?? "");
      setEtaMinutes(prefill?.etaMinutes ?? "");
      setDescriptionExpanded(!!prefill?.description);
      setMoreExpanded(
        !!(prefill?.etaMinutes || (prefill?.subtasks?.length ?? 0) > 0),
      );
    }
    let cancelled = false;
    setProjectsLoading(true);
    (async () => {
      try {
        const projectRes =
          rolePriority < 3
            ? await axiosInstance.get("/project-management/list")
            : await axiosInstance.get(
                `/project-management/user-projects/${userId}`,
              );
        if (cancelled) return;
        const projectData =
          rolePriority < 3 ? projectRes?.data?.data : projectRes?.data;
        const list = Array.isArray(projectData) ? projectData : [];
        setProjects(
          list.map((p: { id: string; title: string }) => ({
            id: p.id,
            title: p.title,
          })),
        );
        const userRes = await axiosInstance.get("/user/list");
        if (cancelled) return;
        const userData = userRes?.data?.data ?? [];
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (e) {
        if (!cancelled) console.error("Failed to load options", e);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, rolePriority, axiosInstance]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => titleInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const addSubtask = () => {
    if (subtasks.length >= 20) return;
    setSubtasks((prev) => [...prev, ""]);
  };
  const updateSubtask = (index: number, value: string) => {
    setSubtasks((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(
    async (andClose: boolean) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error("Title is required");
        titleInputRef.current?.focus();
        return;
      }
      if (!projectId) {
        toast.error("Please select a project");
        return;
      }
      setSubmitLoading(true);
      try {
        const payload: Record<string, unknown> = {
          title: trimmedTitle,
          project_id: projectId,
          status: "pending",
          priority,
          description: description.trim() || undefined,
          current_user_id: assigneeId || undefined,
          created_by: authData?.user?.id,
          deadline_minutes: etaMinutes.trim() || undefined,
          subtasks: subtasks.filter((s) => s.trim()).length
            ? subtasks.filter((s) => s.trim())
            : undefined,
        };
        await axiosInstance.post("/task-maangement", payload);
        toast.success("Task created");
        if (andClose) closeTaskModal();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "Failed to create task";
        toast.error(msg ?? "Failed to create task");
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      title,
      projectId,
      priority,
      description,
      assigneeId,
      etaMinutes,
      subtasks,
      authData?.user?.id,
      closeTaskModal,
      axiosInstance,
    ],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeTaskModal();
    }
  };

  return (
    <>
      {/* Floating action button - hidden on tasks page */}
      {!isOnTasksPage && (
        <button
          type="button"
          onClick={() => openTaskModal()}
          className="fixed z-[1200] flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color-1)]"
          style={{
            right: 24,
            bottom: 24,
            width: FAB_SIZE,
            height: FAB_SIZE,
            background: "var(--primary-color-1)",
            color: "var(--text-color-2)",
            boxShadow: "0 4px 14px rgba(7, 152, 189, 0.4)",
          }}
          title="Add task (Ctrl+K)"
          aria-label="Add task"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[1290] bg-black/30 transition-opacity"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={closeTaskModal}
          aria-hidden
        />
      )}

      {/* Morphing panel: anchored on the right. Drawer grows left into centered popup; popup shrinks back to drawer. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
        onKeyDown={onKeyDown}
        className="fixed z-[1300] flex flex-col overflow-hidden"
        style={{
          // Popup: exactly centered (right = 50% - halfWidth). Drawer: right edge at 0.
          right: isPopupView ? "calc(50% - min(47.5vw, 700px))" : 0,
          top: isPopupView ? "10vh" : 0,
          width: isPopupView
            ? "min(95vw, 1400px)"
            : Math.min(
                DRAWER_WIDTH,
                typeof window !== "undefined"
                  ? window.innerWidth * 0.92
                  : DRAWER_WIDTH,
              ),
          height: isPopupView ? "80vh" : "100%",
          borderRadius: isPopupView ? 12 : 0,
          boxShadow: isPopupView
            ? "0 25px 50px -12px rgba(0,0,0,0.25)"
            : "-4px 0 24px rgba(0,0,0,0.12)",
          borderLeft: isPopupView ? "none" : "1px solid rgba(0,0,0,0.06)",
          backgroundColor: isPopupView ? "#FFFFFF" : "var(--card-bg-color)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          // Smoother, slightly longer transition with gentle easing
          transition:
            "width 0.55s cubic-bezier(0.32, 0.72, 0, 1), height 0.55s cubic-bezier(0.32, 0.72, 0, 1), top 0.55s cubic-bezier(0.32, 0.72, 0, 1), right 0.55s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.55s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.55s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.4s ease, transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Popup view: full task form (morphs into this) */}
        {isPopupView && (
          <div className="flex-1 flex flex-col min-h-0 w-full h-full">
            <FullTaskFormModal
              open={true}
              onClose={() => {
                closeTaskModal();
                setIsPopupView(false);
              }}
              onSuccess={() => {
                closeTaskModal();
                setIsPopupView(false);
              }}
              showCompressButton
              onCompress={() => setIsPopupView(false)}
              renderInline
            />
          </div>
        )}

        {/* Drawer view: header + quick form + footer */}
        {!isPopupView && (
          <>
            {/* Header: expand (open popup), title, close */}
            <div
              className="flex items-center gap-2 shrink-0 px-4 py-4 border-b"
              style={{
                borderColor: "var(--primary-bg-colors)",
                color: "var(--primary-bg-text)",
              }}
            >
              <button
                type="button"
                onClick={() => setIsPopupView(true)}
                className="p-2 rounded-lg transition-colors hover:opacity-80 focus:outline-none focus:ring-2"
                style={{
                  color: "var(--primary-color-1)",
                  backgroundColor: "transparent",
                }}
                title="Expand to full popup"
                aria-label="Expand to popup"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </button>
              <h2
                id="task-drawer-title"
                className="text-lg font-semibold flex-1"
                style={{ color: "var(--primary-bg-text)" }}
              >
                Add task
              </h2>
              <button
                type="button"
                onClick={closeTaskModal}
                className="p-2 rounded-lg transition-colors hover:opacity-80 focus:outline-none focus:ring-2"
                style={{
                  color: "var(--secondary-color)",
                  backgroundColor: "transparent",
                }}
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content - only when not in popup view */}
            {!isPopupView && (
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto px-4 pb-6"
              >
                <div className="pt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="drawer-task-title"
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--primary-bg-text)" }}
                    >
                      Title{" "}
                      <span style={{ color: "var(--primary-color-2)" }}>*</span>
                    </label>
                    <input
                      ref={titleInputRef}
                      id="drawer-task-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Task title"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--primary-bg-colors)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="drawer-task-project"
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--primary-bg-text)" }}
                    >
                      Project{" "}
                      <span style={{ color: "var(--primary-color-2)" }}>*</span>
                    </label>
                    <select
                      id="drawer-task-project"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      disabled={projectsLoading}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--primary-bg-colors)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--primary-bg-text)" }}
                    >
                      Assignee
                    </label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--primary-bg-colors)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "var(--primary-bg-text)" }}
                    >
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "var(--primary-bg-colors)",
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      {PRIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: "var(--primary-bg-colors)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded((x) => !x)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium"
                      style={{ color: "var(--text-color)" }}
                    >
                      Description
                      <span style={{ color: "var(--primary-color-1)" }}>
                        {descriptionExpanded ? "−" : "+"}
                      </span>
                    </button>
                    {descriptionExpanded && (
                      <div className="px-3 pb-3">
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add description..."
                          rows={3}
                          className="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                          style={{
                            borderColor: "var(--primary-bg-colors)",
                            backgroundColor: "var(--bg-color)",
                            color: "var(--text-color)",
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: "var(--primary-bg-colors)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setMoreExpanded((x) => !x)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium"
                      style={{ color: "var(--text-color)" }}
                    >
                      Subtasks & ETA
                      <span style={{ color: "var(--primary-color-1)" }}>
                        {moreExpanded ? "−" : "+"}
                      </span>
                    </button>
                    {moreExpanded && (
                      <div className="px-3 pb-3 space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--text-color)" }}
                            >
                              Subtasks
                            </span>
                            <button
                              type="button"
                              onClick={addSubtask}
                              disabled={subtasks.length >= 20}
                              className="text-xs hover:underline disabled:opacity-50"
                              style={{ color: "var(--primary-color-1)" }}
                            >
                              + Add
                            </button>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {subtasks.map((val, i) => (
                              <div key={i} className="flex gap-2">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) =>
                                    updateSubtask(i, e.target.value)
                                  }
                                  placeholder={`Subtask ${i + 1}`}
                                  className="flex-1 rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2"
                                  style={{
                                    borderColor: "var(--primary-bg-colors)",
                                    backgroundColor: "var(--bg-color)",
                                    color: "var(--text-color)",
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSubtask(i)}
                                  className="p-1.5 rounded opacity-70 hover:opacity-100"
                                  style={{ color: "var(--text-color)" }}
                                  aria-label="Remove subtask"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {subtasks.length === 0 && (
                              <p
                                className="text-xs"
                                style={{ color: "var(--secondary-color)" }}
                              >
                                No subtasks yet. Click &quot;+ Add&quot; to add
                                one.
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium mb-1"
                            style={{ color: "var(--primary-bg-text)" }}
                          >
                            ETA (minutes)
                          </label>
                          <input
                            type="text"
                            value={etaMinutes}
                            onChange={(e) => setEtaMinutes(e.target.value)}
                            placeholder="e.g. 120"
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                            style={{
                              borderColor: "var(--primary-bg-colors)",
                              backgroundColor: "var(--bg-color)",
                              color: "var(--text-color)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isPopupView && (
              <div
                className="shrink-0 flex items-center justify-end gap-2 px-4 py-4 border-t"
                style={{ borderColor: "var(--primary-bg-colors)" }}
              >
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2"
                  style={{
                    color: "var(--text-color)",
                    backgroundColor: "var(--primary-bg-colors)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={submitLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50"
                  style={{ backgroundColor: "var(--primary-color-1)" }}
                >
                  {submitLoading ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={submitLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium border focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    borderColor: "var(--primary-color-1)",
                    color: "var(--primary-color-1)",
                    backgroundColor: "transparent",
                  }}
                >
                  Create & close
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
