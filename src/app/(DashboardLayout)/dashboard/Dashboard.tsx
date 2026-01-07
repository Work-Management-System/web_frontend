"use client";
import { useState, useEffect, FormEvent, Component, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import createAxiosInstance from '@/app/axiosInstance';
import { useAppselector } from "@/redux/store";
import type { ApexOptions } from 'apexcharts';
import { usePaletteChange } from '@/contextapi/PaletteChangeContext';
import UserTaskModal from '../components/kanban-card/UserTaskModal';
import { Close, ExpandMore, ArrowBackIos, ArrowForwardIos, TaskAlt, AccessTime, Folder, PriorityHigh, Warning, CheckCircle, HourglassEmpty, Pause, DirectionsRun } from '@mui/icons-material';
import { Box, Typography, IconButton, Accordion, AccordionSummary, Avatar, AccordionDetails, Select, MenuItem, Menu, Tooltip } from '@mui/material';
import React from 'react';
import { useTaskContext } from '@/contextapi/TaskContext';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useRouter } from 'next/navigation';
import ProjectOverview from './ProjectOverview';
import TenantDetailsCards from './TenantDetailsCards';
import SortIcon from '@mui/icons-material/Sort';
import { color } from 'framer-motion';
import WelcomeBanner from './components/WelcomeBanner';
import CategoryCards from './components/CategoryCards';
import DashboardSidebar from './components/DashboardSidebar';
import { Box as MuiBox, Grid } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import ReportIcon from '@mui/icons-material/Report';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import toast from 'react-hot-toast';
import { usePageTour } from '@/hooks/usePageTour';

// Dynamically import react-apexcharts
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Error Boundary for Charts
interface ChartErrorBoundaryProps {
    children: React.ReactNode;
}

class ChartErrorBoundary extends Component<ChartErrorBoundaryProps> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return <div className="text-red-500 p-4">Failed to load chart. Please try again.</div>;
        }
        return this.props.children;
    }
}

interface AnalyticsResponse {
    onboardingTrend: { period: string; count: number }[];
    statusCounts: { active: number; inactive: number; suspended: number };
    subscriptionStatusCounts: { active: number; inactive: number; expired: number };
    revenueAnalytics: { period: string; revenue: string }[];
    projectPhases: { phase: string; count: number }[];
    ticketPriorities: { priority: string; count: number }[];
    ticketStatuses: { status: string; count: number }[];
    usersWithNoTasks: { id: string; first_name: string; last_name: string; email: string }[];
    usersWithNoActiveTasks: { id: string; first_name: string; last_name: string; email: string }[];
    remarkedReports?: {
        taskReports_id: string;
        taskReports_task_name: string;
        taskReports_status: string;
        taskReports_description: string;
        taskReports_remarks: string;
        taskReports_start_time: string;
        taskReports_end_time: string;
    }[];
    allProjectDetails?: {
        projectId: number;
        projectTitle: string;
        projectDescription: string;
        projectStartDate: string; // or Date if you want to cast it
        projectStatus: string;
        totalTickets: number;
        pendingTickets: number;
        inProgressTickets: number;
        testableTickets: number;
        debuggingTickets: number;
        completedTickets: number;
        onHoldTickets: number;
        totalTeamMembers: number;
    }[];
    projectStats: { totalProjects: number; newProjectsLastMonth: number; };
    userStats: { totalUsers: number; usersCreatedLastMonth: number; };
    worklogCountYesterday: number;
}

interface User {
    id: string;
    first_name: string;
    last_name: string;
}

export default function Dashboard() {
    usePageTour(); // Trigger tour on first visit
    const { paletteChangeSignal } = usePaletteChange();
    const axiosInstance = createAxiosInstance();
    const [groupBy, setGroupBy] = useState<'month' | 'day'>('month');
    const [startDate, setStartDate] = useState<string>(
        format(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), 'yyyy-MM-dd')
    );
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFilterFormVisible, setIsFilterFormVisible] = useState(false);
    const role = useAppselector((state) => state.role.value);
    const userPriority = useAppselector((state) => state.role.value?.priority ?? 0);
    const user = useAppselector((state) => state.user.user);
    const [chartKey, setChartKey] = useState(0); // Key to force chart re-render
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [missedReportsCount, setMissedReportsCount] = useState<number>(0);
    const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
    const [assignedProjectsCount, setAssignedProjectsCount] = useState<number>(0);
    const [teamUsersCount, setTeamUsersCount] = useState<number>(0);
    const [userTasksCount, setUserTasksCount] = useState<number>(0);
    const [leaveBalanceCount, setLeaveBalanceCount] = useState<number>(0);
    const router = useRouter();
    const isUUID = (str: string): boolean =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // State for chart colors
    const [chartColors, setChartColors] = useState({
        primaryColor1: '#007bff',
        primaryColor2: '#28a745',
        primaryColor3: '#CCCCCC',
        bgColor: '#f8f9fa',
        textColor: '#333333',
        primaryBgColor: '#e9ecef',
    });

    // Helper to get CSS variable value
    function getCssVar(varName: string) {
        if (typeof window === 'undefined') return null;
        const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return value || null;
    }

    // Update colors when palette changes
    useEffect(() => {
        const updateColors = () => {
            const newColors = {
                primaryColor1: getCssVar('--primary-color-1') || '#007bff',
                primaryColor2: getCssVar('--primary-color-2') || '#28a745',
                primaryColor3: getCssVar('--primary-color-3') || '#CCCCCC',
                bgColor: getCssVar('--bg-color') || '#f8f9fa',
                textColor: getCssVar('--text-color') || '#333333',
                primaryBgColor: getCssVar('--primary-bg-colors') || '#e9ecef',
            };
            console.log('PaletteChangeSignal:', paletteChangeSignal);
            console.log('New Colors:', newColors);
            setChartColors(newColors);
            setChartKey((prev) => prev + 1); // Force chart re-render
        };

        const timeout = setTimeout(updateColors, 100);
        return () => clearTimeout(timeout);
    }, [paletteChangeSignal]);

    // Fetch analytics data
    const fetchAnalytics = async (e?: FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/analytics', {
                params: {
                    groupBy: groupBy,
                    startDate: startDate,
                    endDate: endDate,
                    role: role?.name,
                    userId: user?.id,
                },
            });

            if (!response.data) {
                throw new Error('Failed to fetch analytics');
            }
            setAnalytics(response.data);
        } catch (err) {
            setError((err as Error).message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchMissedReportsCount = async () => {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0];
            
            let apiUrl = '';
            if (userPriority === 1) {
                // Admin: get all missed reports
                apiUrl = `work-logs/missed-reports`;
            } else if (userPriority === 2) {
                // Manager: get missed reports for their team
                apiUrl = `work-logs/missed-reports`;
            } else {
                // Team Lead or User: get missed reports for manager
                apiUrl = `work-logs/missed-reports-for-manager/${user?.id}`;
            }
            
            const response = await axiosInstance.get(apiUrl, {
                params: { date: dateStr }
            });
            
            // Count total missed reports (sum of all users' missed reports)
            const count = Array.isArray(response.data) 
                ? response.data.reduce((sum: number, user: any) => sum + (user.missedReports?.length || 0), 0)
                : 0;
            setMissedReportsCount(count);
        } catch (error) {
            console.error("Failed to fetch missed reports count:", error);
            setMissedReportsCount(0);
        }
    };

    const fetchAttendanceStatus = async () => {
        try {
            const response = await axiosInstance.get('/attendance/status');
            if (response.data?.data) {
                setAttendanceStatus(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch attendance status:", error);
            setAttendanceStatus(null);
        }
    };

    const fetchAssignedProjectsCount = async () => {
        try {
            if (userPriority === 1) {
                // Admin: get all projects
                const response = await axiosInstance.get('/project-management/list');
                setAssignedProjectsCount(response.data?.data?.length || 0);
            } else {
                // Manager/Employee: get assigned projects
                const response = await axiosInstance.get(`/project-management/user-projects/${user?.id}`);
                setAssignedProjectsCount(Array.isArray(response.data) ? response.data.length : (response.data?.data?.length || 0));
            }
        } catch (error) {
            console.error("Failed to fetch assigned projects count:", error);
            setAssignedProjectsCount(0);
        }
    };

    const fetchTeamUsersCount = async () => {
        // Skip API call for SuperAdmin (priority 1)
        if (userPriority === 1) {
            setTeamUsersCount(0);
            return;
        }
        
        try {
            // For all roles, get total user count
            const response = await axiosInstance.get('/user/list');
            setTeamUsersCount(response.data?.data?.length || 0);
        } catch (error) {
            console.error("Failed to fetch team users count:", error);
            setTeamUsersCount(0);
        }
    };

    const handleClockInOut = async () => {
        try {
            if (!attendanceStatus) {
                // Clock In
                await axiosInstance.post('/attendance/clock-in', {});
                toast.success('Clocked in successfully');
            } else if (attendanceStatus.status === 'CLOCKED_IN' || attendanceStatus.status === 'ON_BREAK' || attendanceStatus.status === 'ON_LUNCH') {
                // Clock Out
                await axiosInstance.post('/attendance/clock-out', {});
                toast.success('Clocked out successfully');
            } else {
                // Clock In
                await axiosInstance.post('/attendance/clock-in', {});
                toast.success('Clocked in successfully');
            }
            await fetchAttendanceStatus();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to clock in/out');
        }
    };

    const fetchLeaveBalanceCount = async () => {
        try {
            const response = await axiosInstance.get('/leave-management/balances');
            const balances = response.data?.data || [];
            // Sum up all available leave balances
            const totalBalance = balances.reduce((sum: number, balance: any) => {
                return sum + (parseFloat(balance.balance) || 0);
            }, 0);
            setLeaveBalanceCount(Math.round(totalBalance));
        } catch (error) {
            console.error("Failed to fetch leave balance count:", error);
            setLeaveBalanceCount(0);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        fetchUsers();
        fetchTasks();
        fetchMissedReportsCount();
        fetchAttendanceStatus();
        fetchAssignedProjectsCount();
        fetchTeamUsersCount();
        fetchLeaveBalanceCount();
    }, []);

    const fetchUsers = async () => {
        // Skip API call for SuperAdmin (priority 1)
        if (userPriority === 1) {
            setAllUsers([]);
            return;
        }
        
        try {
            const response = await axiosInstance.get(userPriority === 4 ? `/user/find-one/${user.id}` : userPriority === 3 ? `/user/team-list/${user.id}` : "/user/list");

            const normalizedData = Array.isArray(response.data.data)
                ? response.data.data
                : [response.data.data]; // wrap in array if it's a single object

            setAllUsers(normalizedData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setAllUsers([]);
        }
    };

    const fetchTasks = async () => {
        // Skip API call for SuperAdmin (priority 1)
        if (userPriority === 1) {
            setFilteredReports([]);
            return;
        }
        
        try {
            let apiUrl = userPriority === 4 ? `/task-maangement/by-user/${user.id}` : `/task-maangement/list`;
            const response = await axiosInstance.get(apiUrl);
            const tickets = response.data.tickets || [];

            const uniqueTickets = tickets
                ?.filter((ticket: any) => ticket.id && isUUID(ticket.id))
                ?.filter(
                    (ticket: any, index: number, self: any[]) =>
                        self.findIndex((t) => t.id === ticket.id) === index
                );

            const mappedReports: Report[] = uniqueTickets?.map((ticket: any) => ({
                id: ticket.id,
                title: ticket.title,
                ticket_no: ticket.ticket_no,
                status: ticket.status,
                priority: ticket.priority,
                projectTitle: ticket.project?.title || "",
                current_user: {
                    id: ticket.current_user?.id ? ticket.current_user?.id : "",
                    first_name: ticket.current_user?.first_name ? ticket.current_user?.first_name : "",
                    last_name: ticket.current_user?.last_name ? ticket.current_user?.last_name : "",
                },
                project_id: ticket.project?.id || "",
                description: ticket.description,
                deadline_minutes: ticket.deadline_minutes || "",
                history: (ticket.history || [])?.map((item: any) => ({
                    moved_at: item.moved_at, // or `new Date(item.moved_at)` if you prefer Date
                    moved_by: item.moved_by,
                    to_status: item.to_status,
                    from_status: item.from_status,
                })),
            }));

            setFilteredReports(mappedReports);
            
            // Calculate user tasks count based on role
            if (userPriority === 1) {
                // Admin: count all tasks not completed/testable
                const adminTasksCount = mappedReports.filter(r => 
                    !['completed', 'testable'].includes(r.status?.toLowerCase())
                ).length;
                setUserTasksCount(adminTasksCount);
            } else {
                // Manager/Employee: count only their tasks
                const userTasks = mappedReports.filter(r => 
                    r.current_user?.id === user?.id &&
                    !['completed', 'testable'].includes(r.status?.toLowerCase())
                );
                setUserTasksCount(userTasks.length);
            }
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            if (error.response?.status === 404) {
                // toast.error("Tasks could not be loaded. Please check the server.");
            }
            setFilteredReports([]);
            setUserTasksCount(0);
        }
    };

    const toggleFilterForm = () => {
        setIsFilterFormVisible((prev) => !prev);
    };

    function formatDateTime(isoString: string) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    }

    // Chart Configurations
    const onboardingChartOptions: ApexOptions = {
        chart: {
            id: 'onboardingChart', type: 'bar', height: 350, events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    router.push(`/tenant-settings`);
                },
            },
        },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: analytics?.onboardingTrend?.map((item) => item.period) || [] },
        yaxis: { title: { text: 'New Tenants' } },
        colors: [chartColors.primaryColor1],
        legend: { position: 'top', labels: { colors: [chartColors.textColor] } },
        title: {
            text: 'Onboarding Trend', align: 'left', style: {
                color: chartColors.textColor,
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '16px'
            }
},
        tooltip: { enabled: true },
        grid: { borderColor: chartColors.bgColor },
    };

    const onboardingChartSeries = [{
        name: 'New Tenants',
        data: analytics?.onboardingTrend?.map((item) => Number(item.count)) || [],
    }];

    const revenueChartOptions: ApexOptions = {
        chart: {
            id: 'revenueChart', type: 'bar', height: 350, events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    router.push(`/subscriptions-listing`);
                },
            },
        },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: analytics?.revenueAnalytics?.map((item) => item.period) || [] },
        yaxis: { title: { text: 'Revenue (₹)' } },
        colors: [chartColors.primaryColor2],
        legend: { position: 'top', labels: { colors: [chartColors.textColor] } },
        title: { text: 'Revenue Analytics', align: 'left',style: {
            color: chartColors.textColor,
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '16px'        
            }
},
        tooltip: { enabled: true },
        grid: { borderColor: chartColors.bgColor },
    };

    const revenueChartSeries = [{
        name: 'Revenue (₹)',
        data: analytics?.revenueAnalytics?.map((item) => Number(item.revenue)) || [],
    }];

    const tenantStatusChartOptions: ApexOptions = {
        chart: {
            id: 'tenantStatusChart', type: 'donut', height: 250, events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    router.push(`/tenant-settings`);
                },
            },
        },
        labels: ['Active', 'Inactive', 'Suspended'],
        series: analytics?.statusCounts
            ? [analytics.statusCounts.active, analytics.statusCounts.inactive, analytics.statusCounts.suspended]
            : [],
        colors: [
            chartColors.primaryColor1,
            chartColors.primaryColor2,
            chartColors.primaryColor3,
            chartColors.bgColor,
            chartColors.textColor,
            '#bbbbbb',
        ],
        legend: { position: 'bottom', labels: { colors: [chartColors.textColor] } },
        title: {
            text: 'Tenant Status Counts', align: 'left', style: {
                color: chartColors.textColor,
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '16px'
            }
},
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
    };

    const subscriptionStatusChartOptions: ApexOptions = {
        chart: {
            id: 'subscriptionStatusChart', type: 'donut', height: 250,
            events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    router.push(`/subscriptions-listing`);
                },
            },
        },
        labels: ['Active', 'Inactive', 'Expired'],
        series: analytics?.subscriptionStatusCounts
            ? [analytics.subscriptionStatusCounts.active, analytics.subscriptionStatusCounts.inactive, analytics.subscriptionStatusCounts.expired]
            : [],
        colors: [
            chartColors.primaryColor1,
            chartColors.primaryColor2,
            chartColors.primaryColor3,
            chartColors.bgColor,
            chartColors.textColor,
            '#bbbbbb',
        ],
        legend: { position: 'bottom', labels: { colors: [chartColors.textColor] } },
        title: {
            text: 'Subscription Status Counts', align: 'left', style: {
                color: chartColors.textColor,
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '16px'
            }
},
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
    };

    const projectPhasesChartOptions: ApexOptions = {
        chart: {
            id: 'projectPhasesChart',
            type: 'pie',
            height: 350,
            events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    // Redirect to project listing page with filter param
                    router.push(`/project-listing`);
                },
            },
        }, labels: analytics?.projectPhases?.map((stat) => stat.phase) || [],
        series: analytics?.projectPhases?.map((stat) => stat.count) || [],
        colors: [
            chartColors.textColor,
            chartColors.primaryColor2,
            '#bbbbbb',
            chartColors.primaryColor1,
        ],
        legend: { position: 'bottom', labels: { colors: [chartColors.textColor] } },
        title: {
            text: 'Projects by Phase', align: 'left', style: {
                color: chartColors.textColor,
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '16px'
            }},
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        tooltip: {
            enabled: true,
            fillSeriesColor: true,
            custom: function ({ series, seriesIndex, w }) {
                return `<div class="p-2 text-white rounded " style="background-color: ${w.globals.colors[seriesIndex]}">
            <span class="font-bold">${w.globals.labels[seriesIndex]}</span>: ${series[seriesIndex]}
        </div>`;
            },
        },
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
    };

    const priorityChartOptions: ApexOptions = {
        chart: {
            id: 'priorityChart', type: 'pie', height: 350, events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    router.push(`/tasks`);
                },
            },
        },
        labels: analytics?.ticketPriorities?.map((p) => p.priority) || [],
        series: analytics?.ticketPriorities?.map((p) => p.count) || [],
        colors: [
            chartColors.primaryColor3,
            chartColors.primaryColor1,
            chartColors.primaryColor2,

        ],
        title: {
            text: 'Tickets by Priority',
            align: 'left',
            style: {
                color: chartColors.textColor,
                fontFamily: 'inherit',   
                fontWeight: 600,        
                fontSize: '16px'        
            } 
        },  
        legend: { position: 'bottom', labels: { colors: [chartColors.textColor] } },
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        tooltip: {
            enabled: true,
            fillSeriesColor: true,
            custom: function ({ series, seriesIndex, w }) {
                return `<div class="p-2 text-white rounded " style="background-color: ${w.globals.colors[seriesIndex]}">
            <span class="font-bold">${w.globals.labels[seriesIndex]}</span>: ${series[seriesIndex]}
        </div>`;
            },
        },
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
    };

    const statusChartOptions: ApexOptions = {
        chart: {
            id: 'statusChart', type: 'donut', height: 350, events: {
                dataPointSelection: function (_event, _chartContext, config) {
                    const selectedPhase = config.w.globals.labels[config.dataPointIndex];
                    router.push(`/tasks`);
                },
            },
        },
        labels: analytics?.ticketStatuses?.map((s) => s.status) || [],
        series: analytics?.ticketStatuses?.map((s) => s.count) || [],
        colors: [
            chartColors.primaryColor1,
            chartColors.primaryColor2,
            chartColors.textColor,
            '#bbbbbb',
            chartColors.primaryColor2,

        ],
                title: {
            text: 'Tickets by Status', align: 'left', style: {
                color: chartColors.textColor,
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '16px'
            }
},
        legend: { position: 'bottom', labels: { colors: [chartColors.textColor] } },
        dataLabels: { enabled: true, style: { colors: ['#fff'] } },
        tooltip: {
            enabled: true,
            fillSeriesColor: true,
            custom: function ({ series, seriesIndex, w }) {
                return `<div class="p-2 text-white rounded " style="background-color: ${w.globals.colors[seriesIndex]}">
            <span class="font-bold">${w.globals.labels[seriesIndex]}</span>: ${series[seriesIndex]}
        </div>`;
            },
        },
        responsive: [{ breakpoint: 480, options: { chart: { width: 200 }, legend: { position: 'bottom' } } }],
    };

    const columns = [
        { id: "pending", title: "TO DO" },
        { id: "in_progress", title: "IN PROGRESS" },
        { id: "on_hold", title: "ON HOLD" },
        { id: "testable", title: "TESTABLE" },
        { id: "completed", title: "Completed" },
        { id: "debugging", title: "REOPENED" },
    ];

    return (
        <div className="container mx-auto" data-tour="dashboard-root">
            {userPriority === 1 && (
                <>
                    {analytics && (
                        <>
                            {/* Welcome Banner */}
                            <div data-tour="welcome-banner">
                                <WelcomeBanner 
                                    newItemsCount={analytics?.worklogCountYesterday || 0}
                                    onReviewClick={() => router.push('/my-reports')}
                                />
                            </div>

                            {/* Category Cards */}
                            {/* <CategoryCards
                                title="Quick Access"
                                viewAllRoute="/dashboard"
                                categories={[
                                    {
                                        name: userPriority === 1 ? 'Employees' : 'Team',
                                        count: userPriority === 1 ? teamUsersCount : teamUsersCount,
                                        icon: <GroupIcon />,
                                        bgColor: 'var(--primary-color-1)',
                                        route: userPriority === 4 ? '#' : '/users',
                                        disabled: userPriority === 4
                                    },
                                    {
                                        name: 'Projects',
                                        count: assignedProjectsCount,
                                        icon: <FolderIcon />,
                                        bgColor: 'var(--primary-color-2)',
                                        route: '/project-listing'
                                    },
                                    {
                                        name: 'Tasks',
                                        count: userTasksCount,
                                        icon: <AssignmentIcon />,
                                        bgColor: '#f44336',
                                        route: '/tasks'
                                    },
                                    {
                                        name: 'Reports',
                                        count: missedReportsCount || 0,
                                        icon: <ReportIcon />,
                                        bgColor: '#4caf50',
                                        route: '/my-reports'
                                    },
                                    {
                                        name: 'Clock In/Out',
                                        count: 0,
                                        icon: <AccessTimeIcon />,
                                        bgColor: '#9c27b0',
                                        route: '/attendance',
                                        isClockInOut: true,
                                        onClockAction: handleClockInOut,
                                        clockButtonText: attendanceStatus?.status === 'CLOCKED_IN' || attendanceStatus?.status === 'ON_BREAK' || attendanceStatus?.status === 'ON_LUNCH' ? 'Clock Out' : 'Clock In'
                                    },
                                    {
                                        name: 'Leave',
                                        count: leaveBalanceCount,
                                        icon: <BeachAccessIcon />,
                                        bgColor: '#ff9800',
                                        route: '/leave-management'
                                    },
                                ]}
                            /> */}

                            {/* Attendance Sidebar - Full Width */}
                            {/* <Box sx={{ mb: 3 }}>
                                <DashboardSidebar
                                    onUserClick={(id) => router.push(`/users/${id}`)}
                                />
                            </Box> */}
                        </>
                    )}
                    <h1 className="text-2xl font-bold mb-4">Tenant Analytics Dashboard</h1>
                    <div className="mb-6">
                        <button
                            onClick={toggleFilterForm}
                            className={`w-full text-left bg-blue-100 text-blue-900 font-semibold px-4 py-3 rounded-t-lg border border-blue-200 shadow-sm hover:bg-blue-200 transition-colors duration-200 ${isFilterFormVisible ? 'rounded-b-none' : 'rounded-b-lg'}`}
                        >
                            {isFilterFormVisible ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out bg-white/50  border border-t-0 border-blue-200 rounded-b-lg shadow-sm ${isFilterFormVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <form onSubmit={fetchAnalytics} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label htmlFor="groupBy" className="block text-sm font-medium text-gray-700">
                                            Group By
                                        </label>
                                        <select
                                            id="groupBy"
                                            value={groupBy}
                                            onChange={(e) => setGroupBy(e.target.value as 'month' | 'day')}
                                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="month">Month</option>
                                            <option value="day">Day</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                            Start Date
                                        </label>
                                        <input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                            End Date
                                        </label>
                                        <input
                                            id="endDate"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
                                        >
                                            {loading ? 'Loading...' : 'Fetch Analytics'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {analytics && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 cursor-pointer">
                            <div className="bg-white/50  p-4 rounded-md shadow">
                                <ChartErrorBoundary>
                                    <ReactApexChart
                                        key={`onboardingChart-${chartKey}`}
                                        options={onboardingChartOptions}
                                        series={onboardingChartSeries}
                                        type="bar"
                                        height={350}
                                    />
                                </ChartErrorBoundary>
                            </div>
                            <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                <ChartErrorBoundary>
                                    <ReactApexChart
                                        key={`revenueChart-${chartKey}`}
                                        options={revenueChartOptions}
                                        series={revenueChartSeries}
                                        type="bar"
                                        height={350}
                                    />
                                </ChartErrorBoundary>
                            </div>
                            <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                <ChartErrorBoundary>
                                    <ReactApexChart
                                        key={`tenantStatusChart-${chartKey}`}
                                        options={tenantStatusChartOptions}
                                        series={tenantStatusChartOptions.series}
                                        type="donut"
                                        height={250}
                                    />
                                </ChartErrorBoundary>
                            </div>
                            <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                <ChartErrorBoundary>
                                    <ReactApexChart
                                        key={`subscriptionStatusChart-${chartKey}`}
                                        options={subscriptionStatusChartOptions}
                                        series={subscriptionStatusChartOptions.series}
                                        type="donut"
                                        height={250}
                                    />
                                </ChartErrorBoundary>
                            </div>
                            <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                <ChartErrorBoundary>
                                    <ReactApexChart
                                        key={`projectPhasesChart-${chartKey}`}
                                        options={projectPhasesChartOptions}
                                        series={projectPhasesChartOptions.series}
                                        type="pie"
                                        height={350}
                                    />
                                </ChartErrorBoundary>
                            </div>
                        </div>
                    )}
                </>
            )}
            {(userPriority === 2 || userPriority === 3) && (
                <>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {analytics && (
                        <>
                            {/* Welcome Banner */}
                            <WelcomeBanner 
                                newItemsCount={analytics?.worklogCountYesterday || 0}
                                onReviewClick={() => router.push('/my-reports')}
                            />

                            {/* Category Cards */}
                            <Box data-tour="dashboard-quick-access">
                            <CategoryCards
                                title="Quick Access"
                                viewAllRoute="/dashboard"
                                categories={[
                                    {
                                        name: userPriority === 1 ? 'Employees' : 'Team',
                                        count: userPriority === 1 ? teamUsersCount : teamUsersCount,
                                        icon: <GroupIcon />,
                                        bgColor: 'var(--primary-color-1)',
                                        route: userPriority === 4 ? '#' : '/users',
                                        disabled: userPriority === 4
                                    },
                                    {
                                        name: 'Projects',
                                        count: assignedProjectsCount,
                                        icon: <FolderIcon />,
                                        bgColor: 'var(--primary-color-2)',
                                        route: '/project-listing'
                                    },
                                    {
                                        name: 'Tasks',
                                        count: userTasksCount,
                                        icon: <AssignmentIcon />,
                                        bgColor: '#f44336',
                                        route: '/tasks'
                                    },
                                    {
                                        name: 'Reports',
                                        count: missedReportsCount || 0,
                                        icon: <ReportIcon />,
                                        bgColor: '#4caf50',
                                        route: '/my-reports'
                                    },
                                    {
                                        name: 'Clock In/Out',
                                        count: 0,
                                        icon: <AccessTimeIcon />,
                                        bgColor: '#9c27b0',
                                        route: '/attendance',
                                        isClockInOut: true,
                                        onClockAction: handleClockInOut,
                                        clockButtonText: attendanceStatus?.status === 'CLOCKED_IN' || attendanceStatus?.status === 'ON_BREAK' || attendanceStatus?.status === 'ON_LUNCH' ? 'Clock Out' : 'Clock In'
                                    },
                                    {
                                        name: 'Leave',
                                        count: leaveBalanceCount,
                                        icon: <BeachAccessIcon />,
                                        bgColor: '#ff9800',
                                        route: '/leave-management'
                                    },
                                ]}
                            />
                            </Box>

                            {/* Attendance Sidebar - Full Width */}
                            <Box sx={{ mb: 3, width: "100%" }} data-tour="dashboard-attendance-sidebar">
                                <DashboardSidebar
                                    onUserClick={(id) => router.push(`/users/${id}`)}
                                />
                            </Box>

                            {/* Main Content Grid */}
                            <Grid container spacing={3} sx={{ mb: 3, width: "100%", maxWidth: "100%" }}>
                                {/* Left Column - Main Content */}
                                <Grid item xs={12} lg={12} sx={{ width: "100%", maxWidth: "100%" }}>
                                    {/* User Tasks and Project Overview */}
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mt: 3, width: "100%" }}>
                                        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }} data-tour="user-tasks">
                                            <UserTasks
                                                users={allUsers}
                                                reports={filteredReports}
                                                columns={columns}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 1 }} data-tour="project-overview">
                                            <ProjectOverview projects={analytics?.allProjectDetails} />
                                        </Box>
                                    </Box>

                                    {/* Charts Section */}
                                    <div className="space-y-6" style={{ marginTop: '24px', width: '100%', maxWidth: '100%' }} data-tour="analytics-charts">
                                {/* Pie Charts in One Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Pie Chart: Project Phases */}
                                    <div className="bg-white/50 p-4 rounded-md shadow cursor-pointer">
                                        <ChartErrorBoundary>
                                            <ReactApexChart
                                                key={`projectPhasesChart-${chartKey}`}
                                                options={projectPhasesChartOptions}
                                                series={projectPhasesChartOptions.series}
                                                type="pie"
                                                height={320}
                                                width="100%"
                                            />
                                        </ChartErrorBoundary>
                                    </div>
                                    {/* Pie Chart: Priority */}
                                    <div className="bg-white/50 p-4 rounded-md shadow cursor-pointer">
                                        <ChartErrorBoundary>
                                            <ReactApexChart
                                                key={`priorityChart-${chartKey}`}
                                                options={priorityChartOptions}
                                                series={priorityChartOptions.series}
                                                type="pie"
                                                height={270}
                                                width="100%"
                                            />
                                        </ChartErrorBoundary>
                                    </div>
                                    {/* Donut Chart: Status */}
                                    <div className="bg-white/50 p-4 rounded-md shadow cursor-pointer">
                                        <ChartErrorBoundary>
                                            <ReactApexChart
                                                key={`statusChart-${chartKey}`}
                                                options={statusChartOptions}
                                                series={statusChartOptions.series}
                                                type="donut"
                                                height={290}
                                                width="100%"
                                            />
                                        </ChartErrorBoundary>
                                    </div>
                                </div>
                                {/* Tables in One Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Users with No Active Tasks */}
                                    {analytics?.usersWithNoActiveTasks && (
                                        <div className="bg-white/50 p-6 rounded-2xl shadow-xl border border-gray-200">
                                            <h6 className="font-bold text-gray-800 mb-6">👥 Users with No Active Tasks</h6>
                                            <div className="overflow-x-auto">
                                                <div className="max-h-80 overflow-y-auto rounded-xl shadow-sm">
                                                    <table className="min-w-full">
                                                        <thead style={{ backgroundColor: chartColors.primaryBgColor }}>
                                                            <tr>
                                                                <th
                                                                    style={{ color: chartColors.textColor }}
                                                                    className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"
                                                                >
                                                                    Name
                                                                </th>
                                                                <th
                                                                    style={{ color: chartColors.textColor }}
                                                                    className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"
                                                                >
                                                                    Email
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {analytics.usersWithNoActiveTasks?.map((user) => (
                                                                <tr
                                                                    key={user.id}
                                                                    className="hover:bg-blue-50 transition-colors duration-200"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                                                                        {user.first_name} {user.last_name}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                                        {user.email}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Users with Overdue Tasks */}
                                    {analytics?.usersWithNoTasks && (
                                        <div className="bg-white/50 p-6 rounded-2xl shadow-xl border border-gray-200">
                                            <h6 className="font-bold text-gray-800 mb-6">👥 Users with No Tasks</h6>
                                            <div className="overflow-x-auto">
                                                <div className="max-h-80 overflow-y-auto rounded-xl shadow-sm">
                                                    <table className="min-w-full">
                                                        <thead style={{ backgroundColor: chartColors.primaryBgColor }}>
                                                            <tr>
                                                                <th
                                                                    style={{ color: chartColors.textColor }}
                                                                    className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"
                                                                >
                                                                    Name
                                                                </th>
                                                                <th
                                                                    style={{ color: chartColors.textColor }}
                                                                    className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"
                                                                >
                                                                    Email
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {analytics?.usersWithNoTasks.map((user) => (
                                                                <tr
                                                                    key={user.id}
                                                                    className="hover:bg-blue-50 transition-colors duration-200"
                                                                >
                                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-medium">
                                                                        {user.first_name} {user.last_name}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                                        {user.email}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                                </Grid>

                            </Grid>
                        </>
                    )}
                </>
            )}

            {userPriority === 4 && (
                <>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {analytics && (
                        <>
                            {/* Welcome Banner */}
                            <WelcomeBanner 
                                newItemsCount={analytics?.worklogCountYesterday || 0}
                                onReviewClick={() => router.push('/my-reports')}
                            />

                            {/* Category Cards */}
                            <CategoryCards
                                title="Quick Access"
                                viewAllRoute="/dashboard"
                                categories={[
                                    {
                                        name: userPriority === 1 ? 'Employees' : 'Team',
                                        count: userPriority === 1 ? teamUsersCount : teamUsersCount,
                                        icon: <GroupIcon />,
                                        bgColor: 'var(--primary-color-1)',
                                        route: userPriority === 4 ? '#' : '/users',
                                        disabled: userPriority === 4
                                    },
                                    {
                                        name: 'Projects',
                                        count: assignedProjectsCount,
                                        icon: <FolderIcon />,
                                        bgColor: 'var(--primary-color-2)',
                                        route: '/project-listing'
                                    },
                                    {
                                        name: 'Tasks',
                                        count: userTasksCount,
                                        icon: <AssignmentIcon />,
                                        bgColor: '#f44336',
                                        route: '/tasks'
                                    },
                                    {
                                        name: 'Reports',
                                        count: missedReportsCount || 0,
                                        icon: <ReportIcon />,
                                        bgColor: '#4caf50',
                                        route: '/my-reports'
                                    },
                                    {
                                        name: 'Clock In/Out',
                                        count: 0,
                                        icon: <AccessTimeIcon />,
                                        bgColor: '#9c27b0',
                                        route: '/attendance',
                                        isClockInOut: true,
                                        onClockAction: handleClockInOut,
                                        clockButtonText: attendanceStatus?.status === 'CLOCKED_IN' || attendanceStatus?.status === 'ON_BREAK' || attendanceStatus?.status === 'ON_LUNCH' ? 'Clock Out' : 'Clock In'
                                    },
                                    {
                                        name: 'Leave',
                                        count: leaveBalanceCount,
                                        icon: <BeachAccessIcon />,
                                        bgColor: '#ff9800',
                                        route: '/leave-management'
                                    },
                                ]}
                            />

                            {/* Attendance Sidebar - Full Width */}
                            <Box sx={{ mb: 3 }}>
                                <DashboardSidebar
                                    onUserClick={(id) => router.push(`/users/${id}`)}
                                />
                            </Box>

                            <UserTasks
                                users={allUsers}
                                reports={filteredReports}
                                columns={columns}
                            />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                    <ChartErrorBoundary>
                                        <ReactApexChart
                                            key={`projectPhasesChart-${chartKey}`}
                                            options={projectPhasesChartOptions}
                                            series={projectPhasesChartOptions.series}
                                            type="pie"
                                            height={350}
                                        />
                                    </ChartErrorBoundary>
                                </div>
                                <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                    <ChartErrorBoundary>
                                        <ReactApexChart
                                            key={`priorityChart-${chartKey}`}
                                            options={priorityChartOptions}
                                            series={priorityChartOptions.series}
                                            type="pie"
                                            height={350}
                                        />
                                    </ChartErrorBoundary>
                                </div>
                                <div className="bg-white/50  p-4 rounded-md shadow cursor-pointer">
                                    <ChartErrorBoundary>
                                        <ReactApexChart
                                            key={`statusChart-${chartKey}`}
                                            options={statusChartOptions}
                                            series={statusChartOptions.series}
                                            type="donut"
                                            height={350}
                                        />
                                    </ChartErrorBoundary>
                                </div>
                                {analytics?.remarkedReports && (
                                    <div className="bg-white/50  rounded-xl p-6 hover:shadow-xl transition-shadow duration-300">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Task Report</h3>
                                        {analytics.remarkedReports?.map((report) => (
                                            <div
                                                key={report.taskReports_id}
                                                className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-lg mb-6"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-md font-medium text-gray-700">
                                                        {report.taskReports_task_name}
                                                    </h4>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${report.taskReports_status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                    >
                                                        {report.taskReports_status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <span className="font-medium">Description:</span>{' '}
                                                    {report.taskReports_description}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Remarks:</span> {report.taskReports_remarks}
                                                </p>
                                                <div className="flex justify-between text-sm text-gray-500 mt-2">
                                                    <p>
                                                        <span className="font-medium">Start:</span>{' '}
                                                        {formatDateTime(report.taskReports_start_time)}
                                                    </p>
                                                    <p>
                                                        <span className="font-medium">End:</span>{' '}
                                                        {formatDateTime(report.taskReports_end_time)}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    <span className="font-medium">Task ID:</span> {report.taskReports_id}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}


const UserTasks = ({ users, reports, columns }) => {
    const userPriority = useAppselector((state) => state.role.value?.priority ?? 0);
    // Group tasks by user and priority
    const userTasks = useMemo(() => {
        const taskMap = {};
        users.forEach((user) => {
            taskMap[user.id] = {
                p1: { count: 0, tasks: [] },
                p2: { count: 0, tasks: [] },
                p3: { count: 0, tasks: [] },
                total: 0,
            };
        });

        reports
            ?.filter((report) => ["pending", "in_progress", "on_hold"].includes(report.status))
            .forEach((report) => {
                const userId = report.current_user.id;
                if (taskMap[userId]) {
                    const priority = report.priority.toLowerCase();
                    if (["p1", "p2", "p3"].includes(priority)) {
                        taskMap[userId][priority].count += 1;
                        taskMap[userId][priority].tasks.push(report);
                        taskMap[userId].total += 1;
                    }
                }
            });

        return taskMap;
    }, [users, reports]);

    // State for sorting
    const [sortBy, setSortBy] = useState("name-asc"); // Default sort by name (A-Z)
    const [anchorEl, setAnchorEl] = useState(null); // Menu anchor

    // Handle menu open/close
    const handleSortClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setAnchorEl(null);
    };

    const handleSortSelect = (sortOption) => {
        setSortBy(sortOption);
        setAnchorEl(null);
    };

    // Sort users based on sortBy value
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            if (sortBy === "name-asc") {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (sortBy === "name-desc") {
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameB.localeCompare(nameA);
            } else if (sortBy === "totalTasks") {
                const totalA = (userTasks[a.id]?.total || 0);
                const totalB = (userTasks[b.id]?.total || 0);
                return totalB - totalA; // Descending
            } else if (sortBy === "p1Tasks") {
                const p1A = (userTasks[a.id]?.p1.count || 0);
                const p1B = (userTasks[b.id]?.p1.count || 0);
                return p1B - p1A; // Descending
            } else if (sortBy === "p2Tasks") {
                const p2A = (userTasks[a.id]?.p2.count || 0);
                const p2B = (userTasks[b.id]?.p2.count || 0);
                return p2B - p2A; // Descending
            } else if (sortBy === "p3Tasks") {
                const p3A = (userTasks[a.id]?.p3.count || 0);
                const p3B = (userTasks[b.id]?.p3.count || 0);
                return p3B - p3A; // Descending
            }
            return 0;
        });
    }, [users, userTasks, sortBy]);

    // Score-based color assignment
    const getUserColor = (p1Count, p2Count, p3Count) => {
        const score = p1Count * 3 + p2Count * 2 + p3Count * 1;
        if (score === 0) return "rgba(200, 200, 200, 0.3)"; // Gray: No tasks
        else if (score >= 1 && score <= 3) return "rgba(153, 255, 153, 0.3)"; // Green: Light work
        else if (score >= 4 && score <= 6) return "rgba(255, 255, 153, 0.3)"; // Yellow: Medium load
        else return "rgba(255, 102, 102, 0.3)"; // Red: Heavy load
    };

    const getTaskCountColor = (status) => {
        switch (status) {
            case "pending":
                return "#f44336";
            case "in_progress":
                return "#ff9800";
            case "on_hold":
                return "#7f7f7f";
            case "testable":
                return "#007bff";
            case "debugging":
                return "#358f75";
            case "completed":
                return "#4caf50";
            default:
                return "#dfe1e6";
        }
    };

    // Carousel navigation refs
    const carouselRefs = useRef({});
    if (!carouselRefs.current) carouselRefs.current = {};

    const scrollCarousel = (userId, priority, direction) => {
        const refKey = `${userId}-all`;
        if (!carouselRefs.current[refKey]) {
            carouselRefs.current[refKey] = React.createRef();
        }
        const ref = carouselRefs.current[refKey];
        if (ref.current) {
            const scrollAmount = 700;
            ref.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    // State for controlling Accordion expansion
    const [expandedAccordions, setExpandedAccordions] = useState({});

    const handleAccordionChange = (userId) => (event, isExpanded) => {
        setExpandedAccordions((prev) => ({
            ...prev,
            [userId]: isExpanded,
        }));
    };

    return (
        <div className="bg-white/50 p-3 rounded-2xl mb-6" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "semibold", color: "#172b4d" }}>
                    User Task Overview
                </Typography>
                {userPriority !== 4 &&
                <IconButton onClick={handleSortClick} sx={{ color: "#172b4d" }}>
                    <SortIcon />
                </IconButton>
}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleSortClose}
                    PaperProps={{
                        sx: {
                            mt: 1,
                            minWidth: 180,
                        },
                    }}
                >
                    <MenuItem onClick={() => handleSortSelect("name-asc")}>Sort by Name (A-Z)</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("name-desc")}>Sort by Name (Z-A)</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("totalTasks")}>Sort by Total Tasks</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("p1Tasks")}>Sort by P1 Tasks</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("p2Tasks")}>Sort by P2 Tasks</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("p3Tasks")}>Sort by P3 Tasks</MenuItem>
                </Menu>
            </Box>
            <div className="p-2 rounded-2xl mb-6 max-h-[68vh] overflow-y-auto">
                {/* Column Headers */}
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        backgroundColor: "#ffffffcd",
                        p: 0.5,
                        borderRadius: "12px 12px 0 0",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: "bold", color: "#172b4d", flex: 2 }}>User</Typography>
                        <Typography sx={{ fontWeight: "bold", color: "#172b4d", textAlign: "center", flex: 1 }}>
                            P1
                        </Typography>
                        <Typography sx={{ fontWeight: "bold", color: "#172b4d", textAlign: "center", flex: 1 }}>
                            P2
                        </Typography>
                        <Typography sx={{ fontWeight: "bold", color: "#172b4d", textAlign: "center", flex: 1 }}>
                            P3
                        </Typography>
                    </Box>
                </Box>

                {/* Scrollable User List */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: "auto",
                        px: 1,
                        py: 1,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "#888",
                            borderRadius: 3,
                            maxHeight: "50%",
                        },
                    }}
                >
                    {sortedUsers.length > 0 ? (
                        sortedUsers.map((user) => {
                            const tasks = userTasks[user.id] || {
                                p1: { count: 0, tasks: [] },
                                p2: { count: 0, tasks: [] },
                                p3: { count: 0, tasks: [] },
                                total: 0,
                            };
                            const userColor = getUserColor(tasks.p1.count, tasks.p2.count, tasks.p3.count);
                            if (!carouselRefs.current[`${user.id}-all`]) {
                                carouselRefs.current[`${user.id}-all`] = React.createRef();
                            }

                            return (
                                <Accordion
                                    key={user.id}
                                    expanded={expandedAccordions[user.id] || false}
                                    onChange={handleAccordionChange(user.id)}
                                    sx={{
                                        mb: 1.7,
                                        borderRadius: "12px",
                                        transition: "border-radius 0.3s ease, box-shadow 0.3s ease",
                                        "&:not(.Mui-expanded)": {
                                            borderRadius: "50px",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        },
                                        "&.Mui-expanded": {
                                            borderRadius: "12px",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                        },
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMore sx={{ color: "#172b4d" }} />}
                                        sx={{
                                            backgroundColor: userColor,
                                            "&:hover": { filter: "brightness(95%)" },
                                            "& .MuiAccordionSummary-content": {
                                                alignItems: "center",
                                                margin: "8px 0",
                                                minHeight: "25px",
                                            },
                                            "& .MuiAccordionSummary-content.Mui-expanded": {
                                                alignItems: "center",
                                                margin: "8px 0",
                                            },
                                            transition: "border-radius 0.3s ease, min-height 0.3s ease",
                                            "&:not(.Mui-expanded)": {
                                                borderRadius: "50px",
                                                minHeight: "40px",
                                            },
                                            "&.Mui-expanded": {
                                                borderRadius: "12px 12px 0 0",
                                                minHeight: "40px",
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
                                            <Avatar
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    backgroundColor: "var(--primary-color-1)",
                                                    mr: 1,
                                                    fontSize: 12,
                                                }}
                                            >
                                                {user.first_name?.[0] || ""}
                                                {user.last_name?.[0] || ""}
                                            </Avatar>
                                            <Typography sx={{ flex: 2, color: "#172b4d", fontSize: "0.9rem" }}>
                                                {user.first_name} {user.last_name}
                                            </Typography>
                                            <Typography
                                                sx={{ flex: 1, textAlign: "center", color: "#172b4d", fontSize: "0.9rem" }}
                                            >
                                                {tasks.p1.count}
                                            </Typography>
                                            <Typography
                                                sx={{ flex: 1, textAlign: "center", color: "#172b4d", fontSize: "0.9rem" }}
                                            >
                                                {tasks.p2.count}
                                            </Typography>
                                            <Typography
                                                sx={{ flex: 1, textAlign: "center", color: "#172b4d", fontSize: "0.9rem" }}
                                            >
                                                {tasks.p3.count}
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails
                                        sx={{
                                            p: 1,
                                            backgroundColor: "#f8fafc",
                                            borderRadius: "0 0 12px 12px",
                                            boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: 600,
                                                color: "#1e3a8a",
                                                textTransform: "uppercase",
                                                mb: 0.75,
                                                fontSize: "0.75rem",
                                                letterSpacing: 0.8,
                                            }}
                                        >
                                            Active Tasks
                                        </Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <IconButton
                                                onClick={() => scrollCarousel(user.id, "all", "left")}
                                                size="small"
                                                sx={{
                                                    p: 0.4,
                                                    bgcolor: "#e2e8f0",
                                                    "&:hover": { bgcolor: "#cbd5e1" },
                                                    visibility:
                                                        tasks.p1.tasks.length +
                                                            tasks.p2.tasks.length +
                                                            tasks.p3.tasks.length > 2
                                                            ? "visible"
                                                            : "hidden",
                                                }}
                                            >
                                                <ArrowBackIos fontSize="small" sx={{ color: "#1e3a8a" }} />
                                            </IconButton>
                                            <Box
                                                ref={carouselRefs.current[`${user.id}-all`]}
                                                sx={{
                                                    display: "flex",
                                                    overflowX: "auto",
                                                    gap: 1,
                                                    p: 0.7,
                                                    scrollBehavior: "smooth",
                                                    "&::-webkit-scrollbar": { height: 5 },
                                                    "&::-webkit-scrollbar-thumb": {
                                                        backgroundColor: "#94a3b8",
                                                        borderRadius: 2,
                                                    },
                                                }}
                                            >
                                                {[...tasks.p1.tasks, ...tasks.p2.tasks, ...tasks.p3.tasks]?.map((task) => {
                                                    const priority = task.priority || "p1";
                                                    let gradientColor = "linear-gradient(135deg, #dc2626 0%, #e57373 100%)"; // Softer red for P1
                                                    if (priority === "p2") gradientColor = "linear-gradient(135deg, #d97706 0%, #f4c261 100%)"; // Muted amber for P2
                                                    if (priority === "p3") gradientColor = "linear-gradient(135deg, #059669 0%, #6ccab5 100%)"; // Subdued green for P3

                                                    let statusIcon;
                                                    switch (task.status) {
                                                        case "pending":
                                                            statusIcon = (
                                                                <Tooltip title="Pending">
                                                                    <HourglassEmpty fontSize="small" sx={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }} />
                                                                </Tooltip>
                                                            );
                                                            break;
                                                        case "on_hold":
                                                            statusIcon = (
                                                                <Tooltip title="On Hold">
                                                                    <Pause fontSize="small" sx={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }} />
                                                                </Tooltip>
                                                            );
                                                            break;
                                                        case "in_progress":
                                                            statusIcon = (
                                                                <Tooltip title="In Progress">
                                                                    <DirectionsRun fontSize="small" sx={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }} />
                                                                </Tooltip>
                                                            );
                                                            break;
                                                        default:
                                                            statusIcon = (
                                                                <Tooltip title="Pending">
                                                                    <TaskAlt fontSize="small" sx={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }} />
                                                                </Tooltip>
                                                            );
                                                    }


                                                    return (
                                                        <Box
                                                            key={task.id}
                                                            sx={{
                                                                minWidth: 180,
                                                                width: 180,
                                                                background: 'var(--primary-color-2)',
                                                                borderRadius: 2,
                                                                p: 1,
                                                                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                                                                transition: "all 0.2s ease",
                                                                "&:hover": {
                                                                    transform: "translateY(-4px) scale(1.01)",
                                                                    boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
                                                                },
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                gap: 0.5,
                                                                position: "relative",
                                                                overflow: "hidden",
                                                                height: "auto",
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    position: "absolute",
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    height: 3,
                                                                    background: "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0))",
                                                                }}
                                                            />
                                                            <Box
                                                                sx={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        color: "#fff",
                                                                        fontSize: "0.75rem",
                                                                        textShadow: "0 1px 1px rgba(0,0,0,0.2)",
                                                                    }}
                                                                >
                                                                    {task.ticket_no}
                                                                </Typography>
                                                                <Box sx={{ display: "flex", gap: 0.4, alignItems: "center" }}>
                                                                    {/* Priority Label */}
                                                                    <Box
                                                                        sx={{
                                                                            px: 0.8,
                                                                            py: 0.5,
                                                                            borderRadius: 1,
                                                                            fontSize: "0.65rem",
                                                                            fontWeight: 700,
                                                                            color: "#fff",
                                                                            textAlign: "center",
                                                                            minWidth: 26,
                                                                            cursor: "default",
                                                                            lineHeight: 1.2,
                                                                            ...(priority === "p1" && { bgcolor: "#dc2626" }), // red
                                                                            ...(priority === "p2" && { bgcolor: "#d97706" }), // amber
                                                                            ...(priority === "p3" && { bgcolor: "#059669" }), // green
                                                                        }}
                                                                    >
                                                                        {priority.toUpperCase()}
                                                                    </Box>
                                                                    {/* Status Icon */}
                                                                    <Box
                                                                        sx={{
                                                                            borderRadius: 1,
                                                                            bgcolor: "rgba(0,0,0,0.2)",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        {statusIcon}
                                                                    </Box>
                                                                </Box>
                                                            </Box>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    color: "#fff",
                                                                    fontSize: "0.8rem",
                                                                    lineHeight: 1.2,
                                                                    textShadow: "0 1px 1px rgba(0,0,0,0.2)",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                    maxWidth: "150px",
                                                                    display: "block",
                                                                }}
                                                            >
                                                                {task.title}
                                                            </Typography>
                                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                                    <AccessTime fontSize="small" sx={{ color: "#fff", opacity: 0.9 }} />
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: "#fff",
                                                                            fontSize: "0.65rem",
                                                                            opacity: 0.9,
                                                                        }}
                                                                    >
                                                                        {task.eta || "N/A"}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                                    <Folder fontSize="small" sx={{ color: "#fff", opacity: 0.9 }} />
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            color: "#fff",
                                                                            fontSize: "0.65rem",
                                                                            opacity: 0.9,
                                                                            textOverflow: "ellipsis",
                                                                        }}
                                                                    >
                                                                        {task.projectTitle || "N/A"}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                            <IconButton
                                                onClick={() => scrollCarousel(user.id, "all", "right")}
                                                size="small"
                                                sx={{
                                                    p: 0.4,
                                                    bgcolor: "#e2e8f0",
                                                    "&:hover": { bgcolor: "#cbd5e1" },
                                                    visibility:
                                                        tasks.p1.tasks.length +
                                                            tasks.p2.tasks.length +
                                                            tasks.p3.tasks.length > 2
                                                            ? "visible"
                                                            : "hidden",
                                                }}
                                            >
                                                <ArrowForwardIos fontSize="small" sx={{ color: "#1e3a8a" }} />
                                            </IconButton>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })
                    ) : (
                        <Typography sx={{ color: "#5e6c84", textAlign: "center", py: 2 }}>
                            No users with tasks
                        </Typography>
                    )}
                </Box>
            </div>
        </div>
    );
};