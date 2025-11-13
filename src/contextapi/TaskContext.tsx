import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppselector } from "@/redux/store";
import createAxiosInstance from "@/app/axiosInstance";
import toast from "react-hot-toast";
import { Roles } from "@/app/constatnts";
import confirmAndDelete from "@/utils/delete-confirm";
import { User } from "@/app/(DashboardLayout)/users/page";
export interface HistoryItem {
  moved_at: Date;
  moved_by: string | null;
  to_status: string;
  from_status: string | null;
}
export interface AssignmentHistory {
  from_user_id?: string;
  to_user_id: string;
  deadline_minutes?: string | null;
  updated_by: string;
  updated_at: Date;
}

export interface Report {
  id: string;
  title: string;
  ticket_no: string;
  status: string;
  priority: string;
  current_user: {
    id: string;
    first_name: string;
    last_name: string;
    department?: string;
  };
  project_id: string;
  description: string;
  deadline_minutes: string;
  history?: HistoryItem[];
  assignment_history?: AssignmentHistory[];
  subTasks?:SubTaskType[];
  totalSubTasks?: number;
  completedSubTasks?:number;
  pendingSubTasks?:number;
  inprogressSubTasks?:number;
}

export interface Project {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
  current_phase: string;
  dead_line: string | null;
}
export type TicketStatus =
  | "pending"
  | "in_progress"
  | "testable"
  | "debugging"
  | "completed"
  | "on_hold";

export interface SubTaskType {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  history:HistoryItem[];
}
export interface TaskContextType {
  reports: Report[];
  projects: Project[];
  fetchTasks: () => Promise<void>;
  handleTaskDrop: (taskId: string, newStatus: string) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  taskId?: string;
  setTaskId: React.Dispatch<React.SetStateAction<string | undefined>>;
  viewProjectTasks: boolean;
  setViewProjectTasks: React.Dispatch<React.SetStateAction<boolean>>;
  viewDepartmentTasks: boolean;
  setViewDepartmentTasks: React.Dispatch<React.SetStateAction<boolean>>;
  setViewTeamTasks: React.Dispatch<React.SetStateAction<boolean>>;
  tasksLoading: boolean;
  setTasksLoading: React.Dispatch<React.SetStateAction<boolean>>;
  allUsers: User[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const axiosInstance = createAxiosInstance();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");
  const authData = useAppselector((state) => state.auth.value);
  const currentUserRole = useAppselector((state) => state.role.value);
  const user = useAppselector((state) => state.user.user);
  const [taskId, setTaskId] = useState<string>();
  const [viewProjectTasks, setViewProjectTasks] = useState(false);
  const [viewDepartmentTasks, setViewDepartmentTasks] = useState(false);
  const [viewTeamTasks, setViewTeamTasks] = useState(false);
  const [tasksLoading,setTasksLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const isUUID = (str: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const fetchTasks = async () => {
    // setTasksLoading(true);
    try {
      let apiUrl = "";
      if (currentUserRole?.priority > 2 && viewTeamTasks) {
        apiUrl = `/task-maangement/list-reporting-wise/${authData?.user.id}`;
      }
      else if (currentUserRole?.priority > 2 && viewProjectTasks) {
        apiUrl = `/task-maangement/all-project-tickets/${authData?.user.id}`;
      } else if (currentUserRole?.priority > 2 && viewDepartmentTasks) {
        if(!user?.department){
          toast.error("Your user profile does not have a department assigned.");
          setTasksLoading(false);
          return;
        }
        apiUrl = `/task-maangement/department-tickets/${authData?.user.id}`;
      } else if (projectId) {
        apiUrl = `/task-maangement/by-project/${projectId}`;
      } else if (userId) {
        apiUrl = `/task-maangement/by-user/${userId}`;
      } else if ((currentUserRole?.priority && currentUserRole?.priority < 3)) {
        apiUrl = `/task-maangement/list`;
      }
      //  else if (currentUserRole?.priority && currentUserRole?.priority == 3) {
      //   apiUrl = `/task-maangement/list-userwise/${authData?.user.id}`;
      // } 
      else {
        apiUrl = `/task-maangement/by-user/${authData?.user.id}`;
      }
      const response = await axiosInstance.get(apiUrl);
      const tickets = response.data.tickets || [];

      const uniqueTickets = tickets
        .filter((ticket: any) => ticket.id && isUUID(ticket.id))
        .filter(
          (ticket: any, index: number, self: any[]) =>
            self.findIndex((t) => t.id === ticket.id) === index
        );
      const mappedReports: Report[] = uniqueTickets.map((ticket: any) => {
        const subTasks = (ticket.subTasks ?? [])
          .sort(
            (a: any, b: any) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          .map(
            (sub: any): SubTaskType => ({
              id: sub.id,
              title: sub.title,
              description: sub.description,
              status: sub.status,
              created_at: sub.created_at,
              history:sub.history
            })
          );
        return {
          id: ticket.id,
          title: ticket.title,
          ticket_no: ticket.ticket_no,
          status: ticket.status,
          priority: ticket.priority,
          current_user: {
            id: ticket.current_user?.id ?? "",
            first_name: ticket.current_user?.first_name ?? "",
            last_name: ticket.current_user?.last_name ?? "",
            department: ticket.current_user?.department??" ",
          },
          project_id: ticket.project?.id || "",
          description: ticket.description,
          deadline_minutes: ticket.deadline_minutes || "",
          history: (ticket.history || []).map((item: any) => ({
            moved_at: item.moved_at,
            moved_by: item.moved_by,
            to_status: item.to_status,
            from_status: item.from_status,
          })),
          assignment_history: (ticket.assignment_history || []).map((item: any) => ({
            from_user_id: item.from_user_id,
            to_user_id: item.to_user_id,
            deadline_minutes: item.deadline_minutes,
            updated_by: item.updated_by,
            updated_at: item.updated_at,
          })),
          subTasks,
          totalSubTasks: subTasks.length, // Use the length of the mapped subTasks array
          pendingSubTasks: subTasks.filter((s) => s.status === "pending").length,
          inprogressSubTasks: subTasks.filter((s) => s.status === "in_progress").length,
          completedSubTasks: subTasks.filter((s) => s.status === "completed").length,
        };
      });

      setReports(mappedReports);
      setTasksLoading(false);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      if (error.response?.status === 404) {
        toast.error("Tasks could not be loaded. Please check the server.");
      }
      setReports([]);
    }
    setTasksLoading(false);
  };

  const fetchProjects = async () => {
    try {
      let response;
      if (currentUserRole?.priority < 3) {
        response = await axiosInstance.get(`/project-management/list`);
      } else {
        response = await axiosInstance.get(`/project-management/user-projects/${authData?.user?.id}`);
      }
      const userProjects = (currentUserRole?.priority < 3 ? response?.data?.data : response?.data).map(
        (project: any) => ({
          id: project.id,
          title: project.title,
          start_date: project.start_date,
          end_date: project.end_date,
          status: project.status,
          description: project.description,
          current_phase: project.current_phase,
          dead_line: project.dead_line,
        })
      );
      setProjects(userProjects || []);
    } catch (error) {
      console.error("Failed to fetch user projects:", error);
      setProjects([]);
    }
  };
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/user/list');
      setAllUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };
  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [projectId, userId,viewProjectTasks,viewDepartmentTasks,viewTeamTasks]);

  useEffect(()=>{
    fetchUsers()
  },[])

  const handleTaskDrop = async (taskId: string, newStatus: string) => {
    let originalReports: Report[] = [];

    try {
      if (!isUUID(taskId)) {
        throw new Error("Invalid task ID: Must be a UUID");
      }

      let task: Report | undefined;
      setReports((prevReports) => {
        originalReports = [...prevReports];
        task = prevReports.find((report) => report.id === taskId);
        if (task?.status === newStatus) {
          return prevReports;
        }

        const updatedReports = prevReports.map((report) =>
          report.id === taskId ? { ...report, status: newStatus } : report
        );
        return updatedReports;
      });

      const payload = {
        ticket_id: taskId,
        new_status: newStatus,
        updated_by: authData?.user.id,
        current_user_id: task?.current_user.id,
      };

      await axiosInstance.patch("/task-maangement/status", payload);
      fetchTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);
      if (error.response) {
        toast.error(
          `${error.response.data.message || "Bad request (check ticket ID or status)"}`
        );
      }

      setReports(originalReports);
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    if (!isUUID(taskId)) {
      throw new Error("Invalid task ID: Must be a UUID");
    }
    await confirmAndDelete({
      apiEndpoint: `/task-maangement/delete/${taskId}`,
      text: 'This Task will be permanently deleted!',
      onSuccess: async () => {
        setReports((prevReports) => prevReports.filter((report) => report.id !== taskId));
      },
    });
  };

  return (
    <TaskContext.Provider value={{ reports, projects, fetchTasks, handleTaskDrop, handleDeleteTask, taskId, setTaskId, viewProjectTasks, setViewProjectTasks, tasksLoading,setTasksLoading,viewDepartmentTasks, setViewDepartmentTasks,setViewTeamTasks,allUsers }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};