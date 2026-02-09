"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import createAxiosInstance from "@/app/axiosInstance";
import { useAppselector } from "@/redux/store";
import { useTaskModal } from "@/contextapi/GlobalTaskModalContext";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "testable", label: "Testable" },
  { value: "debugging", label: "Debugging" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
] as const;

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

export default function GlobalAddTaskModal() {
  const { isOpen, prefill, closeTaskModal } = useTaskModal();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("pending");
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const axiosInstance = useMemo(() => createAxiosInstance(), []);
  const authData = useAppselector((state) => state.auth.value);
  const rolePriority = useAppselector(
    (state) => state.role.value?.priority ?? 3,
  );
  const userId = authData?.user?.id ?? "";
  const prevOpenRef = useRef(false);

  // Reset form and fetch options only when modal opens (run once per open)
  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }
    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;

    if (justOpened) {
      setTitle(prefill?.title ?? "");
      setProjectId(prefill?.projectId ?? "");
      setStatus(prefill?.status ?? "pending");
      setPriority(prefill?.priority ?? "p3");
      setDescription(prefill?.description ?? "");
      setSubtasks(prefill?.subtasks ? [...prefill.subtasks] : []);
      setAssigneeId(prefill?.assigneeId ?? "");
      setEtaMinutes(prefill?.etaMinutes ?? "");
      setDescriptionExpanded(!!prefill?.description);
      setMoreExpanded(
        !!(
          prefill?.assigneeId ||
          prefill?.etaMinutes ||
          (prefill?.subtasks?.length ?? 0) > 0
        ),
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
      const t = setTimeout(() => titleInputRef.current?.focus(), 50);
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
          status,
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
        setTitle("");
        setProjectId("");
        setStatus("pending");
        setPriority("p3");
        setDescription("");
        setSubtasks([]);
        setAssigneeId("");
        setEtaMinutes("");
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
      status,
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
      return;
    }
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSubmit(false);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(true);
    }
  };

  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const root = contentRef.current;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement)?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement)?.focus();
        }
      }
    };
    root.addEventListener("keydown", handleTab);
    return () => root.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const modal = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-add-task-title"
      className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeTaskModal}
        aria-hidden="true"
      />
      <div
        ref={contentRef}
        className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200/80 dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
          <h2
            id="global-add-task-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Add task
          </h2>
          <button
            type="button"
            onClick={closeTaskModal}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color-1)]"
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

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label
              htmlFor="task-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="task-project"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Project <span className="text-red-500">*</span>
            </label>
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={projectsLoading}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setDescriptionExpanded((x) => !x)}
              className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              Description
              <span className="text-gray-400">
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
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 resize-none"
                />
              </div>
            )}
          </div>

          <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreExpanded((x) => !x)}
              className="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              Subtasks, assignee, ETA
              <span className="text-gray-400">{moreExpanded ? "−" : "+"}</span>
            </button>
            {moreExpanded && (
              <div className="px-3 pb-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Subtasks
                    </span>
                    <button
                      type="button"
                      onClick={addSubtask}
                      disabled={subtasks.length >= 20}
                      className="text-xs text-[var(--primary-color-1)] hover:underline disabled:opacity-50"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {subtasks.map((val, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => updateSubtask(i, e.target.value)}
                          placeholder={`Subtask ${i + 1}`}
                          className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtask(i)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
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
                      <p className="text-xs text-gray-500">
                        No subtasks yet. Click &quot;+ Add&quot; to add one.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="task-assignee"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Assignee
                  </label>
                  <select
                    id="task-assignee"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                    htmlFor="task-eta"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    ETA (minutes)
                  </label>
                  <input
                    id="task-eta"
                    type="text"
                    value={etaMinutes}
                    onChange={(e) => setEtaMinutes(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-[var(--primary-color-1)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color-1)] dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
          <button
            type="button"
            onClick={closeTaskModal}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary-color-1)] hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color-1)] focus:ring-offset-1"
          >
            {submitLoading ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color-1)]"
          >
            Create & close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}
