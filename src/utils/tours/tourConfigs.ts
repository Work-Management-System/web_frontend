import { Step } from 'react-joyride';

// Dashboard Tour
export const dashboardTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to your Dashboard! This is your central hub where you can see an overview of all your work.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="welcome-banner"]',
    content: 'This is your welcome banner. It shows important announcements and updates.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-tasks"]',
    content: 'Here you can see all your assigned tasks. Tasks are organized by status (Pending, In Progress, Completed, etc.).',
    placement: 'top',
  },
  {
    target: '[data-tour="project-overview"]',
    content: 'This section shows an overview of all your projects. Click on any project to see more details.',
    placement: 'top',
  },
  {
    target: '[data-tour="analytics-charts"]',
    content: 'These charts provide visual insights into your work progress, time tracking, and productivity metrics.',
    placement: 'top',
  },
  {
    target: '[data-tour="sidebar"]',
    content: 'Use the sidebar to navigate between different sections like Tasks, Projects, Reports, and more.',
    placement: 'right',
  },
];

// Tasks Tour
export const tasksTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Tasks section! Here you can manage all your tasks using a Kanban board.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="task-filters"]',
    content: 'Use these filters to view tasks by user, project, priority, or department. You can also search for specific tasks.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="kanban-board"]',
    content: 'This is your Kanban board. Tasks are organized in columns by status. Drag and drop tasks between columns to update their status.',
    placement: 'top',
  },
  {
    target: '[data-tour="add-task-button"]',
    content: 'Click this button to create a new task. You can assign it to team members, set priorities, and add descriptions.',
    placement: 'bottom',
  },
];

// Projects Tour
export const projectsTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Projects! Here you can view and manage all your projects.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="project-list"]',
    content: 'This is your project list. Each project shows its status, timeline, and team members.',
    placement: 'top',
  },
  {
    target: '[data-tour="project-card"]',
    content: 'Click on any project card to view detailed information, tasks, team members, and project timeline.',
    placement: 'top',
  },
  {
    target: '[data-tour="add-project-button"]',
    content: 'Click here to create a new project. You can set project details, assign team members, and define timelines.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="project-filters"]',
    content: 'Use filters to find projects by status, date range, or team members.',
    placement: 'bottom',
  },
];

// Work Reports Tour
export const workReportsTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Work Reports! Here you can log your daily work and track time spent on different tasks.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="add-report-button"]',
    content: 'Click here to add a new work report. You can log your daily activities, time spent, and task progress.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="reports-list"]',
    content: 'This is your reports list. View all your submitted work reports, filter by date, and see your work history.',
    placement: 'top',
  },
  {
    target: '[data-tour="report-card"]',
    content: 'Click on any report to view details, edit, or see the tasks you worked on that day.',
    placement: 'top',
  },
  {
    target: '[data-tour="report-filters"]',
    content: 'Filter reports by date range, user, or project to find specific reports quickly.',
    placement: 'bottom',
  },
];

// Attendance Tour
export const attendanceTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Attendance! Track your clock in/out times and view your attendance history.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="clock-in-button"]',
    content: 'Click here to clock in when you start your workday. The system will record your start time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="clock-out-button"]',
    content: 'Click here to clock out when you finish your workday. The system will calculate your total hours.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="attendance-calendar"]',
    content: 'This calendar shows your attendance history. Green indicates present days, and you can see your clock in/out times.',
    placement: 'top',
  },
  {
    target: '[data-tour="attendance-stats"]',
    content: 'View your attendance statistics including total hours worked, days present, and monthly summary.',
    placement: 'top',
  },
];

// Leave Management Tour
export const leaveManagementTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Leave Management! Here you can apply for leave, view your leave balance, and track leave requests.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="leave-balance"]',
    content: 'This shows your available leave balance. You can see how many days you have for different leave types.',
    placement: 'top',
  },
  {
    target: '[data-tour="apply-leave-button"]',
    content: 'Click here to apply for leave. Select the leave type, dates, and provide a reason for your request.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="leave-requests-list"]',
    content: 'View all your leave requests and their status (Pending, Approved, Rejected). You can also cancel pending requests.',
    placement: 'top',
  },
  {
    target: '[data-tour="leave-calendar"]',
    content: 'This calendar shows your approved leave dates and helps you plan your time off.',
    placement: 'top',
  },
];

// Users Tour
export const usersTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Users Management! Here you can view and manage all users in your organization.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="users-list"]',
    content: 'This is the list of all users. You can see their roles, departments, and contact information.',
    placement: 'top',
  },
  {
    target: '[data-tour="user-card"]',
    content: 'Click on any user to view their profile, see their tasks, projects, and work history.',
    placement: 'top',
  },
  {
    target: '[data-tour="add-user-button"]',
    content: 'Click here to add a new user to the system. You can assign roles, departments, and set permissions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-filters"]',
    content: 'Filter users by department, role, or search by name to find specific users quickly.',
    placement: 'bottom',
  },
];

// Settings Tour
export const settingsTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Settings! Configure departments, designations, and other organizational settings here.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="settings-tabs"]',
    content: 'Use these tabs to navigate between different settings: Departments, Designations, Functions, and Tenant Values.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="departments-section"]',
    content: 'Manage your organization\'s departments. Add, edit, or remove departments as needed.',
    placement: 'top',
  },
  {
    target: '[data-tour="designations-section"]',
    content: 'Manage job designations and titles. These are used when creating user profiles.',
    placement: 'top',
  },
];

// Organization Tour
export const organizationTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Organization! View your organization chart, employee documents, and organizational structure.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="org-chart"]',
    content: 'This is your organization chart. It shows the hierarchical structure of your organization and reporting relationships.',
    placement: 'top',
  },
  {
    target: '[data-tour="employee-documents"]',
    content: 'View and manage employee documents. Upload, download, or organize important employee files.',
    placement: 'top',
  },
  {
    target: '[data-tour="payroll-documents"]',
    content: 'Access payroll-related documents and financial information for your organization.',
    placement: 'top',
  },
];

// Tour key to config mapping
export const tourConfigs: Record<string, Step[]> = {
  dashboard: dashboardTour,
  tasks: tasksTour,
  'project-listing': projectsTour,
  'my-reports': workReportsTour,
  'all-reports': workReportsTour,
  'add-report': workReportsTour,
  attendance: attendanceTour,
  'leave-management': leaveManagementTour,
  users: usersTour,
  settings: settingsTour,
  organization: organizationTour,
};

// Get tour config by route
export const getTourByRoute = (route: string): Step[] | null => {
  // Extract base route (remove leading slash and get first segment)
  const baseRoute = route.replace(/^\//, '').split('/')[0];
  return tourConfigs[baseRoute] || null;
};

