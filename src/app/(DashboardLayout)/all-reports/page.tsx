'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Autocomplete,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Stack,
    Tabs,
    Tab,
    CircularProgress,
    Card,
    Skeleton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import createAxiosInstance from '@/app/axiosInstance';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import FolderIcon from '@mui/icons-material/Folder';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// User interface
interface User {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
}

// Task interface
interface TaskReport {
    task_name: string;
    project: {
        id: string;
        title: string;
        description?: string;
        start_date?: string;
        end_date?: string;
        status?: string;
        current_phase?: string;
        client_details?: { name: string; email: string; contact: string }[];
    };
    time_taken: number;
    status: string;
    description?: string;
}

// Work log interface
interface WorkLog {
    created_at: string;
    taskReports: TaskReport[];
    user?: User;
}

// Ticket interface
interface Ticket {
    id: string;
    created_at: string;
    priority: string;
    project: { title: string };
    current_user?: { id: string; first_name?: string; last_name?: string; email?: string };
}

// Project summary interface
interface ProjectSummary {
    name: string;
    totalWorked: number; // in minutes
    p1Tickets: number;
    p2Tickets: number;
    p3Tickets: number;
    totalTickets: number;
}
interface UserSummary {
    id: string;
    name: string;
    totalWorked: number; // in minutes
    p1Tickets: number;
    p2Tickets: number;
    p3Tickets: number;
    totalTickets: number;
}

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
    background: 'var(--primary-color-1, #1e3c72)',
    color: '#fff',
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: theme.shadows[6],
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: 'var(--primary-color-1, #2a4d9b)',
    color: '#fff',
    fontWeight: 'bold',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    color: '#555',
    minHeight: '45px',
    padding: theme.spacing(0.5, 1.5),
    borderRadius: '8px',
    '& .MuiTab-iconWrapper': {
        marginRight: theme.spacing(1),
        fontSize: '1.2rem',
    },
    '&.Mui-selected': {
        color: '#fff',
        background: 'linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
}));

const StyledSubTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#555',
    borderRadius: '8px',
    padding: '4px 12px',
    minHeight: '38px',
    height: '38px',
    transition: 'all 0.3s ease',
    '&.Mui-selected': {
        color: '#555',
        // background: 'var(--primary-color-2)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, .5)',
    },
}));

const FilterCard = styled(Paper)(({ theme }) => ({
    background: '#fff',
    borderRadius: '12px',
    padding: theme.spacing(1.5),
    margin: theme.spacing(0),
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}));

const StatCard = ({ loading, value, label, icon: Icon, iconColor }: any) => (
    <Card sx={{ flex: 1, p: 2, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
            <Icon sx={{ fontSize: 36, color: iconColor }} />
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
                    {loading ? <Skeleton width={60} /> : value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                    {loading ? <Skeleton width={100} /> : label}
                </Typography>
            </Box>
        </Stack>
    </Card>
);

const UserReport = () => {
    const [empUserList, setEmpUserList] = useState<User[]>([]);
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));
    const [toDate, setToDate] = useState<Dayjs | null>(dayjs());
    const [selectedProject, setSelectedProject] = useState<string>('All');
    const [tabValue, setTabValue] = useState<number>(0);
    const [subTabValue, setSubTabValue] = useState<number>(0);
    const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
    const [loadingWorkLogs, setLoadingWorkLogs] = useState<boolean>(true);
    const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
    const [userWorkData, setUserWorkData] = useState<WorkLog[]>([]);
    const [ticketData, setTicketData] = useState<Ticket[]>([]);
    const [error, setError] = useState<string | null>(null);
    const axiosInstance = createAxiosInstance();

    const fetchWorkLogs = async () => {
        try {
            setLoadingWorkLogs(true);
            setError(null);
            const params: any = {};
            if (employeeId) params.user_id = employeeId;
            if (fromDate) params.start_date = fromDate.format('YYYY-MM-DD');
            if (toDate) params.end_date = toDate.format('YYYY-MM-DD');

            const response = await axiosInstance.get('/work-logs/all-user-reports', { params });
            setUserWorkData(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch work logs:', error);
            setError('Failed to load work logs. Please try again.');
            setUserWorkData([]);
        } finally {
            setLoadingWorkLogs(false);
        }
    };

    const fetchTickets = async () => {
        try {
            setLoadingTickets(true);
            setError(null);
            const params: any = {};
            if (employeeId) params.user_id = employeeId;
            if (fromDate) params.start_date = fromDate.format('YYYY-MM-DD');
            if (toDate) params.end_date = toDate.format('YYYY-MM-DD');

            const response = await axiosInstance.get('/task-maangement/list', { params });
            setTicketData(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            setError('Failed to load tickets. Please try again.');
            setTicketData([]);
        } finally {
            setLoadingTickets(false);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                setError(null);
                const response = await axiosInstance.get('/user/list');
                setEmpUserList(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                setError('Failed to load users. Please try again.');
                setEmpUserList([]);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchWorkLogs();
        fetchTickets();
    }, [employeeId, fromDate, toDate]);

    const filteredWorkData = useMemo(() => {
        if (!fromDate || !toDate) return [];
        return userWorkData.filter((work) => {
            const createdDate = dayjs(work.created_at);
            return createdDate.isSameOrAfter(fromDate, 'day') && createdDate.isSameOrBefore(toDate, 'day');
        });
    }, [userWorkData, fromDate, toDate]);

    const filteredTickets = useMemo(() => {
        if (!fromDate || !toDate) return [];
        return ticketData.filter((ticket) => {
            const createdDate = dayjs(ticket.created_at);
            const inRange =
                createdDate.isSameOrAfter(fromDate, 'day') &&
                createdDate.isSameOrBefore(toDate, 'day');
            const matchesEmployee = employeeId && employeeId !== 'All' ? ticket.current_user?.id === employeeId : true;
            const matchesProject = selectedProject === 'All'
                ? true
                : ticket.project?.title === selectedProject;
            return inRange && matchesEmployee && matchesProject;
        });
    }, [ticketData, fromDate, toDate, employeeId, selectedProject]);

    const projectSummaries = useMemo(() => {
        const summaries: ProjectSummary[] = filteredWorkData.reduce((acc: ProjectSummary[], work) => {
            work.taskReports.forEach((task) => {
                const projectName = task.project?.title || 'Unknown';
                const timeTaken = task.time_taken || 0;
                const existingProject = acc.find((p) => p.name === projectName);
                if (existingProject) {
                    existingProject.totalWorked += timeTaken;
                } else {
                    acc.push({
                        name: projectName,
                        totalWorked: timeTaken,
                        p1Tickets: 0,
                        p2Tickets: 0,
                        p3Tickets: 0,
                        totalTickets: 0,
                    });
                }
            });
            return acc;
        }, []);

        filteredTickets.forEach((ticket) => {
            const projectName = ticket.project?.title || 'Unknown';
            const project = summaries.find((p) => p.name === projectName);
            const priority = ticket.priority?.toLowerCase() || '';
            if (project) {
                project.totalTickets += 1;
                if (priority === 'p1') project.p1Tickets += 1;
                else if (priority === 'p2') project.p2Tickets += 1;
                else if (priority === 'p3') project.p3Tickets += 1;
            } else {
                summaries.push({
                    name: projectName,
                    totalWorked: 0,
                    p1Tickets: priority === 'p1' ? 1 : 0,
                    p2Tickets: priority === 'p2' ? 1 : 0,
                    p3Tickets: priority === 'p3' ? 1 : 0,
                    totalTickets: 1,
                });
            }
        });

        return summaries;
    }, [filteredWorkData, filteredTickets]);

    const filteredProjects = useMemo(() => {
        return selectedProject === 'All'
            ? projectSummaries
            : projectSummaries.filter((project) => project.name === selectedProject);
    }, [projectSummaries, selectedProject]);

    const totalWorkedMinutes = filteredProjects.reduce((sum, project) => sum + project.totalWorked, 0);
    const totalTickets = filteredProjects.reduce((sum, project) => sum + project.totalTickets, 0);
    const p1Tickets = filteredProjects.reduce((sum, project) => sum + project.p1Tickets, 0);
    const p2Tickets = filteredProjects.reduce((sum, project) => sum + project.p2Tickets, 0);
    const p3Tickets = filteredProjects.reduce((sum, project) => sum + project.p3Tickets, 0);

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} hr ${mins} min`;
    };

    const projectOptions = [
        'All',
        ...[...new Set(projectSummaries.map((project) => project.name))].sort((a, b) => a.localeCompare(b)),
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        handleRefreshFilters();
    };

    const handleSubTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setSubTabValue(newValue);
    };

    const handleRefresh = () => {
        fetchWorkLogs();
        fetchTickets();
    };

    const handleRefreshFilters = () => {
        setFromDate(dayjs().subtract(1, 'month'));
        setToDate(dayjs());
        setEmployeeId(null);
        setSelectedProject('All');
    };

    const filteredTasks = useMemo(() => {
        return filteredWorkData
            .flatMap((work) =>
                work.taskReports.map((task) => ({
                    ...task,
                    created_at: work.created_at,
                    user: work.user || { id: '', first_name: 'Unknown', last_name: '' },
                })),
            )
            .filter((task) => selectedProject === 'All' || task.project?.title === selectedProject)
            .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)));
    }, [filteredWorkData, selectedProject]);

    const exportUserReportToExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const wsData: any[] = [];
            const filename = `Report_${subTabValue === 0 ? 'ProjectSummary' : 'TaskSummary'}_${dayjs().format('YYYYMMDD')}.xlsx`;

            // Add title and user details
            const reportTitle = subTabValue === 0 ? 'Project Summary Report' : 'Task Summary Report';
            wsData.push([reportTitle]);
            if (employeeId) {
                const selectedUser = empUserList.find((user) => user?.id === employeeId);
                wsData.push(['Employee', selectedUser ? `${selectedUser?.first_name || ''} ${selectedUser?.last_name || ''}` : 'Unknown']);
            } else {
                wsData.push(['Employee', 'All Employees']);
            }
            wsData.push(['Total Time Worked', formatTime(totalWorkedMinutes)]);
            wsData.push(['Date Range', `${fromDate?.format('YYYY-MM-DD') || 'N/A'} to ${toDate?.format('YYYY-MM-DD') || 'N/A'}`]);
            wsData.push(['Project', selectedProject]);
            wsData.push([]);

            // Border style
            const borderStyle = {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } },
            };

            let ws: XLSX.WorkSheet;
            let sheetName: string;

            if (subTabValue === 0) {
                // Project Summary
                wsData.push(['Project', 'Total Worked', 'P1 Tickets', 'P2 Tickets', 'P3 Tickets', 'Total Tickets']);
                filteredProjects.forEach((project) => {
                    wsData.push([
                        project.name,
                        formatTime(project.totalWorked),
                        project.p1Tickets,
                        project.p2Tickets,
                        project.p3Tickets,
                        project.totalTickets,
                    ]);
                });

                ws = XLSX.utils.aoa_to_sheet(wsData);
                sheetName = 'Project Summary';
            } else {
                // Task Summary
                const headers = ['Task Name', 'Project', 'Task Date', 'Time Taken', 'Status'];
                if (employeeId === null) headers.splice(2, 0, 'Assignee');
                wsData.push(headers);

                filteredTasks.forEach((task) => {
                    const row = [
                        task.task_name,
                        task.project?.title || 'Unknown',
                        ...(employeeId === null ? [`${task.user?.first_name || ''} ${task.user?.last_name || ''}`] : []),
                        dayjs(task.created_at).format('YYYY-MM-DD'),
                        formatTime(task.time_taken),
                        task.status,
                    ];
                    wsData.push(row);
                });

                ws = XLSX.utils.aoa_to_sheet(wsData);
                sheetName = 'Task Summary';
            }

            // Apply formatting
            const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
            for (let R = 0; R <= range.e.r; R++) {
                for (let C = 0; C <= range.e.c; C++) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                    ws[cellRef].s = {
                        border: borderStyle,
                        alignment: { vertical: 'center', horizontal: R < 6 ? 'left' : 'center' },
                    };
                    if (R === 0) {
                        ws[cellRef].s = {
                            ...ws[cellRef].s,
                            font: { bold: true, sz: 16, color: { rgb: '1E3C72' } },
                            fill: { fgColor: { rgb: 'E6F0FA' } },
                        };
                    } else if (R >= 1 && R <= 4) {
                        ws[cellRef].s = {
                            ...ws[cellRef].s,
                            font: { bold: true, color: { rgb: '333333' } },
                        };
                    } else if (R === 6) {
                        ws[cellRef].s = {
                            ...ws[cellRef].s,
                            font: { bold: true, color: { rgb: 'FFFFFF' } },
                            fill: { fgColor: { rgb: '2A4D9B' } },
                        };
                    } else if (R > 6) {
                        ws[cellRef].s = {
                            ...ws[cellRef].s,
                            fill: { fgColor: { rgb: R % 2 === 0 ? 'F9F9F9' : 'FFFFFF' } },
                        };
                    }
                }
            }

            // Column widths
            ws['!cols'] = subTabValue === 0
                ? [
                    { wch: 30 },
                    { wch: 15 },
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 12 },
                    { wch: 12 },
                ]
                : [
                    { wch: 30 },
                    { wch: 30 },
                    ...(employeeId === null ? [{ wch: 20 }] : []),
                    { wch: 15 },
                    { wch: 15 },
                    { wch: 15 },
                ];

            // Merge cells for title
            ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: subTabValue === 0 ? 5 : (employeeId === null ? 5 : 4) } }];

            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
            const buf = new ArrayBuffer(wbout.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;
            const blob = new Blob([buf], { type: 'application/octet-stream' });
            saveAs(blob, filename);
        } catch (error) {
            console.error('Failed to export to Excel:', error);
            setError('Failed to export report to Excel. Please try again.');
        }
    };

    const userSummaries = useMemo(() => {
        const summaries: UserSummary[] = filteredWorkData.reduce((acc: UserSummary[], work) => {
            if (!work.user || !work.user.id) return acc; // Skip if user or user.id is undefined
            const userId = work.user.id;
            const userName = `${work.user?.first_name || 'Unknown'} ${work.user?.last_name || ''}`;
            work.taskReports.forEach((task) => {
                if (selectedProject === 'All' || task.project?.title === selectedProject) {
                    const timeTaken = task.time_taken || 0;
                    const existingUser = acc.find((u) => u?.id === userId);
                    if (existingUser) {
                        existingUser.totalWorked += timeTaken;
                    } else {
                        acc.push({
                            id: userId,
                            name: userName,
                            totalWorked: timeTaken,
                            p1Tickets: 0,
                            p2Tickets: 0,
                            p3Tickets: 0,
                            totalTickets: 0,
                        });
                    }
                }
            });
            return acc;
        }, []);

        filteredTickets.forEach((ticket) => {
            if (!ticket.current_user || !ticket.current_user.id) return; // Skip if current_user or id is undefined
            if (selectedProject === 'All' || ticket.project?.title === selectedProject) {
                const userId = ticket.current_user.id;
                const userName = `${ticket.current_user?.first_name || 'Unknown'} ${ticket.current_user?.last_name || ''}`;
                const priority = ticket.priority?.toLowerCase() || '';
                const existingUser = summaries.find((u) => u?.id === userId);
                if (existingUser) {
                    existingUser.totalTickets += 1;
                    if (priority === 'p1') existingUser.p1Tickets += 1;
                    else if (priority === 'p2') existingUser.p2Tickets += 1;
                    else if (priority === 'p3') existingUser.p3Tickets += 1;
                } else {
                    summaries.push({
                        id: userId,
                        name: userName,
                        totalWorked: 0,
                        p1Tickets: priority === 'p1' ? 1 : 0,
                        p2Tickets: priority === 'p2' ? 1 : 0,
                        p3Tickets: priority === 'p3' ? 1 : 0,
                        totalTickets: 1,
                    });
                }
            }
        });

        return summaries;
    }, [filteredWorkData, filteredTickets, selectedProject]);

    const filteredUsers = useMemo(() => {
        return selectedProject === 'All'
            ? userSummaries
            : userSummaries.filter((user) =>
                filteredWorkData.some((work) =>
                    work.user?.id === user.id && work.taskReports.some(task => task.project?.title === selectedProject)
                )
            );
    }, [userSummaries, selectedProject, filteredWorkData]);

    const projectDetails = useMemo(() => {
        if (selectedProject === 'All') return null;
        const workLog = filteredWorkData.find((work) =>
            work.taskReports.some(task => task.project?.title === selectedProject)
        );
        if (!workLog) return null;
        const taskReport = workLog.taskReports.find(task => task.project?.title === selectedProject);
        return taskReport ? taskReport.project : null;
    }, [filteredWorkData, selectedProject]);

    const exportUserSummaryForProjectReportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet([]);
        const colWidths: number[] = [];

        // Styles
        const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin' } } };
        const cellStyle = { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
        const labelStyle = { font: { bold: true } };

        // Project Details
        if (projectDetails && selectedProject !== 'All') {
            const projectData = [
                ['Project Title', projectDetails.title || 'N/A'],
                ['Description', projectDetails.description || 'N/A'],
                ['Start Date', projectDetails.start_date ? dayjs(projectDetails.start_date).format('YYYY-MM-DD') : 'N/A'],
                ['End Date', projectDetails.end_date ? dayjs(projectDetails.end_date).format('YYYY-MM-DD') : 'N/A'],
                ['Status', projectDetails.status || 'N/A'],
                ['Current Phase', projectDetails.current_phase || 'N/A'],
                ['Total Project Working Time', formatTime(totalWorkedMinutes) || 'N/A'],
                ['Client Details', projectDetails.client_details?.length > 0
                    ? projectDetails.client_details.map((client, index) => `Client ${index + 1}: ${client.name} (${client.email}, ${client.contact})`).join('; ')
                    : 'No client details available'],
                [''],
            ];

            XLSX.utils.sheet_add_aoa(worksheet, projectData, { origin: 'A1' });

            // Apply styles to project details
            projectData.forEach((row, rowIndex) => {
                worksheet[`A${rowIndex + 1}`] = { v: row[0], s: labelStyle };
                worksheet[`B${rowIndex + 1}`] = { v: row[1], s: { ...cellStyle, alignment: { wrapText: true } } };
            });

            // Calculate column widths for project details
            projectData.forEach(row => {
                colWidths[0] = Math.max(colWidths[0] || 0, row[0]?.length || 0, 12);
                colWidths[1] = Math.max(colWidths[1] || 0, row[1]?.toString().length || 0, 50);
            });
        }

        // User Summary Data
        const userData = filteredUsers.map(user => ({
            User: user.name,
            'Total Worked': formatTime(user.totalWorked),
            'P1 Tickets': user.p1Tickets,
            'P2 Tickets': user.p2Tickets,
            'P3 Tickets': user.p3Tickets,
            'Total Tickets': user.totalTickets,
        }));

        const startRow = projectDetails && selectedProject !== 'All' ? 9 : 1;
        XLSX.utils.sheet_add_json(worksheet, userData, { origin: `A${startRow}`, skipHeader: false });

        // Apply styles to table
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        for (let row = startRow; row <= range.e.r; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = row === startRow ? headerStyle : cellStyle;
            }
        }

        // Calculate column widths for table
        userData.forEach(row => {
            colWidths[0] = Math.max(colWidths[0] || 0, row.User?.length || 0, 20);
            colWidths[1] = Math.max(colWidths[1] || 0, row['Total Worked']?.length || 0, 15);
            colWidths[2] = Math.max(colWidths[2] || 0, row['P1 Tickets']?.toString().length || 0, 10);
            colWidths[3] = Math.max(colWidths[3] || 0, row['P2 Tickets']?.toString().length || 0, 10);
            colWidths[4] = Math.max(colWidths[4] || 0, row['P3 Tickets']?.toString().length || 0, 10);
            colWidths[5] = Math.max(colWidths[5] || 0, row['Total Tickets']?.toString().length || 0, 12);
        });

        worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'User Summary');
        const projectName = selectedProject === 'All' ? 'All_Projects' : selectedProject.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `user_summary_${projectName}_${dayjs().format('YYYYMMDD')}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    };

    const exportTaskSummaryForProjectReportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet([]);
        const colWidths: number[] = [];

        // Styles
        const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, border: { bottom: { style: 'thin' } } };
        const cellStyle = { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
        const labelStyle = { font: { bold: true } };
        const projectHeaderStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'left' }, fill: { fgColor: { rgb: 'D3D3D3' } } };
        const totalTimeStyle = { font: { italic: true }, alignment: { horizontal: 'left' } };

        // Project Details for specific project
        if (projectDetails && selectedProject !== 'All') {
            const projectData = [
                ['Project Title', projectDetails.title || 'N/A'],
                ['Description', projectDetails.description || 'N/A'],
                ['Start Date', projectDetails.start_date ? dayjs(projectDetails.start_date).format('YYYY-MM-DD') : 'N/A'],
                ['End Date', projectDetails.end_date ? dayjs(projectDetails.end_date).format('YYYY-MM-DD') : 'N/A'],
                ['Status', projectDetails.status || 'N/A'],
                ['Current Phase', projectDetails.current_phase || 'N/A'],
                ['Client Details', projectDetails.client_details?.length > 0
                    ? projectDetails.client_details.map((client, index) => `Client ${index + 1}: ${client.name} (${client.email}, ${client.contact})`).join('; ')
                    : 'No client details available'],
                [''],
            ];

            XLSX.utils.sheet_add_aoa(worksheet, projectData, { origin: 'A1' });

            // Apply styles to project details
            projectData.forEach((row, rowIndex) => {
                worksheet[`A${rowIndex + 1}`] = { v: row[0], s: labelStyle };
                worksheet[`B${rowIndex + 1}`] = { v: row[1], s: { ...cellStyle, alignment: { wrapText: true } } };
                colWidths[0] = Math.max(colWidths[0] || 0, row[0]?.length || 0, 12);
                colWidths[1] = Math.max(colWidths[1] || 0, row[1]?.toString().length || 0, 50);
            });

            // Task Summary Data for specific project
            const taskData = filteredTasks.map(task => ({
                'Task Name': task.task_name,
                Assignee: `${task.user?.first_name || 'Unknown'} ${task.user?.last_name || ''}`,
                'Task Date': dayjs(task.created_at).format('YYYY-MM-DD'),
                'Time Taken': formatTime(task.time_taken),
                Status: task.status,
            }));

            const totalTime = filteredTasks.reduce((sum, task) => sum + (task.time_taken || 0), 0);
            XLSX.utils.sheet_add_aoa(worksheet, [['Total Time Worked', formatTime(totalTime)]], { origin: 'A9' });
            worksheet['A9'] = { v: 'Total Time Worked', s: labelStyle };
            worksheet['B9'] = { v: formatTime(totalTime), s: totalTimeStyle };
            colWidths[0] = Math.max(colWidths[0] || 0, 'Total Time Worked'.length, 12);
            colWidths[1] = Math.max(colWidths[1] || 0, formatTime(totalTime).length, 15);

            XLSX.utils.sheet_add_json(worksheet, taskData, { origin: 'A11', skipHeader: false });

            // Apply styles to table
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
            for (let row = 10; row <= range.e.r; row++) {
                for (let col = 0; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!worksheet[cellAddress]) continue;
                    worksheet[cellAddress].s = row === 10 ? headerStyle : cellStyle;
                }
            }

            // Calculate column widths for table
            taskData.forEach(row => {
                colWidths[0] = Math.max(colWidths[0] || 0, row['Task Name']?.length || 0, 20);
                colWidths[1] = Math.max(colWidths[1] || 0, row.Assignee?.length || 0, 20);
                colWidths[2] = Math.max(colWidths[2] || 0, row['Task Date']?.length || 0, 12);
                colWidths[3] = Math.max(colWidths[3] || 0, row['Time Taken']?.length || 0, 15);
                colWidths[4] = Math.max(colWidths[4] || 0, row.Status?.length || 0, 12);
            });
        } else {
            // Group tasks by project
            const groupedTasks = filteredTasks.reduce((acc: { [key: string]: any[] }, task) => {
                const projectTitle = task.project?.title || 'Unknown';
                if (!acc[projectTitle]) acc[projectTitle] = [];
                acc[projectTitle].push({
                    'Task Name': task.task_name,
                    Assignee: `${task.user?.first_name || 'Unknown'} ${task.user?.last_name || ''}`,
                    'Task Date': dayjs(task.created_at).format('YYYY-MM-DD'),
                    'Time Taken': formatTime(task.time_taken),
                    Status: task.status,
                });
                return acc;
            }, {});

            let currentRow = 1;
            Object.entries(groupedTasks).sort(([a], [b]) => a.localeCompare(b)).forEach(([projectTitle, tasks]) => {
                XLSX.utils.sheet_add_aoa(worksheet, [['Project', projectTitle]], { origin: `A${currentRow}` });
                worksheet[`B${currentRow}`].s = projectHeaderStyle;
                colWidths[1] = Math.max(colWidths[1] || 0, projectTitle.length, 20);
                currentRow++;

                // Add total time worked for the project
                const totalTime = filteredTasks
                    .filter(task => task.project?.title === projectTitle)
                    .reduce((sum, task) => sum + (task.time_taken || 0), 0);
                XLSX.utils.sheet_add_aoa(worksheet, [['Total Time Worked', formatTime(totalTime)]], { origin: `A${currentRow}` });
                worksheet[`A${currentRow}`] = { v: 'Total Time Worked', s: labelStyle };
                worksheet[`B${currentRow}`] = { v: formatTime(totalTime), s: totalTimeStyle };
                colWidths[0] = Math.max(colWidths[0] || 0, 'Total Time Worked'.length, 12);
                colWidths[1] = Math.max(colWidths[1] || 0, formatTime(totalTime).length, 15);
                currentRow += 2;

                // Add task data
                XLSX.utils.sheet_add_json(worksheet, tasks, { origin: `A${currentRow}`, skipHeader: false });
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                for (let row = currentRow - 1; row <= range.e.r; row++) {
                    for (let col = 0; col <= range.e.c; col++) {
                        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                        if (!worksheet[cellAddress]) continue;
                        worksheet[cellAddress].s = row === currentRow - 1 ? headerStyle : cellStyle;
                    }
                }

                // Calculate column widths for tasks
                tasks.forEach((row: any) => {
                    colWidths[0] = Math.max(colWidths[0] || 0, row['Task Name']?.length || 0, 20);
                    colWidths[1] = Math.max(colWidths[1] || 0, row.Assignee?.length || 0, 20);
                    colWidths[2] = Math.max(colWidths[2] || 0, row['Task Date']?.length || 0, 12);
                    colWidths[3] = Math.max(colWidths[3] || 0, row['Time Taken']?.length || 0, 15);
                    colWidths[4] = Math.max(colWidths[4] || 0, row.Status?.length || 0, 12);
                });

                currentRow += tasks.length + 2;
            });
        }

        worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Task Summary');
        const projectName = selectedProject === 'All' ? 'All_Projects' : selectedProject.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `task_summary_${projectName}_${dayjs().format('YYYYMMDD')}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    };

    const stripHtml = (html: string): string => {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    return (
        <Box sx={{ width: '100%', pt: 2 }}>
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
            >
                <StyledTab icon={<PersonSearchIcon />} iconPosition="start" label="User Reports" />
                <StyledTab icon={<FolderIcon />} iconPosition="start" label="Project Reports" />
            </Tabs>

            {tabValue === 0 && (
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
                    {error && (
                        <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <FilterCard>
                        <Typography variant="h5" sx={{ color: 'var(--primary-color-2)', fontWeight: 700 }}>
                            <FilterAltIcon sx={{ color: 'var(--primary-color-1)' }} /> FILTERS
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={2.5}
                            alignItems="flex-end"
                            sx={{ p: 2, flexWrap: "wrap", gap: 1 }}
                        >
                            <Box sx={{ minWidth: 250 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    Employee
                                </Typography>
                                {loadingUsers ? (
                                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
                                ) : (
                                    <Autocomplete
                                        value={empUserList.find((user) => user?.id === employeeId) || null}
                                        onChange={(event, newValue) =>
                                            setEmployeeId(newValue ? newValue.id : null)
                                        }
                                        options={empUserList}
                                        getOptionLabel={(option) => `${option?.first_name || 'Unknown'} ${option?.last_name || ''}`}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder="Select Employee" size="small" />
                                        )}
                                        disabled={loadingUsers}
                                        sx={{
                                            "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ minWidth: 240 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    Project
                                </Typography>
                                {loadingWorkLogs ? (
                                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
                                ) : (
                                    <Autocomplete
                                        value={selectedProject}
                                        onChange={(event, newValue) =>
                                            setSelectedProject((newValue as string) || "All")
                                        }
                                        options={projectOptions}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder="Select Project" size="small" />
                                        )}
                                        sx={{
                                            "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ minWidth: 150 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    From
                                </Typography>
                                <TextField
                                    type="date"
                                    value={fromDate ? fromDate.format("YYYY-MM-DD") : ""}
                                    onChange={(e) =>
                                        setFromDate(e.target.value ? dayjs(e.target.value) : null)
                                    }
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                    }}
                                />
                            </Box>

                            <Box sx={{ minWidth: 150 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    To
                                </Typography>
                                <TextField
                                    type="date"
                                    value={toDate ? toDate.format("YYYY-MM-DD") : ""}
                                    onChange={(e) =>
                                        setToDate(e.target.value ? dayjs(e.target.value) : null)
                                    }
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                        "& .MuiInputBase-input": { padding: "8px" },
                                    }}
                                />
                            </Box>

                            <Box>
                                <Button
                                    variant="contained"
                                    onClick={handleRefresh}
                                    startIcon={<RefreshIcon />}
                                    sx={{
                                        borderRadius: "20px",
                                        px: 2.5,
                                        py: 0.8,
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                        background: "var(--primary-color-1, #1e3c72)",
                                        "&:hover": {
                                            background: "var(--primary-color-2)",
                                        },
                                    }}
                                    disabled={loadingWorkLogs || loadingTickets}
                                >
                                    Refresh
                                </Button>
                            </Box>
                        </Stack>
                    </FilterCard>

                    {loadingWorkLogs || loadingTickets ? (
                        <Stack direction="row" spacing={2.5} sx={{ mb: 3, mt: 2 }}>
                            {[...Array(5)].map((_, index) => (
                                <Skeleton
                                    key={index}
                                    variant="rectangular"
                                    height={100}
                                    sx={{ flex: 1, borderRadius: '12px' }}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={2.5} sx={{ mb: 3, mt: 2 }}>
                            <StatCard
                                loading={loadingWorkLogs}
                                value={formatTime(totalWorkedMinutes)}
                                label="Worked Hours"
                                icon={AccessTimeIcon}
                                iconColor="#4facfe"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={totalTickets}
                                label="Total Created Tickets"
                                icon={TrendingUpIcon}
                                iconColor="#43e97b"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={p1Tickets}
                                label="P1 Tickets"
                                icon={WarningAmberIcon}
                                iconColor="#d70000"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={p2Tickets}
                                label="P2 Tickets"
                                icon={LowPriorityIcon}
                                iconColor="#f59e0b"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={p3Tickets}
                                label="P3 Tickets"
                                icon={KeyboardDoubleArrowDownIcon}
                                iconColor="green"
                            />
                        </Stack>
                    )}

                    <Box sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Tabs value={subTabValue} onChange={handleSubTabChange} variant="fullWidth">
                            <StyledSubTab label="Project Summary" />
                            <StyledSubTab label="Task Summary" />
                        </Tabs>
                        <Box sx={{ p: 2, background: '#fff' }}>
                            {subTabValue === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h5" sx={{ color: 'var(--primary-color-2)', fontWeight: 700 }}>
                                            PROJECT SUMMARY
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={exportUserReportToExcel}
                                            sx={{ borderRadius: '20px', padding: '5px 17px', background: 'var(--primary-color-1, #1e3c72)' }}
                                            disabled={loadingWorkLogs || loadingTickets || filteredProjects.length === 0}
                                        >
                                            <FileDownloadIcon /> Export to Excel
                                        </Button>
                                    </Box>

                                    {loadingWorkLogs || loadingTickets ? (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    {[...Array(6)].map((_, index) => (
                                                        <StyledTableCell key={index}>
                                                            <Skeleton />
                                                        </StyledTableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...Array(3)].map((_, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {[...Array(6)].map((_, colIndex) => (
                                                            <TableCell key={colIndex}>
                                                                <Skeleton />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : filteredProjects.length === 0 ? (
                                        <Typography sx={{ textAlign: 'center', color: '#666' }}>
                                            No Project Summary Available in Current Date Range
                                        </Typography>
                                    ) : (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell>Project</StyledTableCell>
                                                    <StyledTableCell>Total Worked</StyledTableCell>
                                                    <StyledTableCell>P1 Tickets</StyledTableCell>
                                                    <StyledTableCell>P2 Tickets</StyledTableCell>
                                                    <StyledTableCell>P3 Tickets</StyledTableCell>
                                                    <StyledTableCell>Total Tickets</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredProjects.map((project, index) => (
                                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                                        <TableCell>{project.name}</TableCell>
                                                        <TableCell>{formatTime(project.totalWorked)}</TableCell>
                                                        <TableCell>{project.p1Tickets}</TableCell>
                                                        <TableCell>{project.p2Tickets}</TableCell>
                                                        <TableCell>{project.p3Tickets}</TableCell>
                                                        <TableCell>{project.totalTickets}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </Box>
                            )}
                            {subTabValue === 1 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h5" sx={{ color: 'var(--primary-color-2)', fontWeight: 700 }}>
                                            TASK SUMMARY
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={exportUserReportToExcel}
                                            sx={{ borderRadius: '20px', padding: '5px 17px', background: 'var(--primary-color-1, #1e3c72)' }}
                                            disabled={loadingWorkLogs || loadingTickets || filteredTasks.length === 0}
                                        >
                                            <FileDownloadIcon /> Export to Excel
                                        </Button>
                                    </Box>
                                    {loadingWorkLogs || loadingTickets ? (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    {[...Array(employeeId === null ? 6 : 5)].map((_, index) => (
                                                        <StyledTableCell key={index}>
                                                            <Skeleton />
                                                        </StyledTableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...Array(3)].map((_, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {[...Array(employeeId === null ? 6 : 5)].map((_, colIndex) => (
                                                            <TableCell key={colIndex}>
                                                                <Skeleton />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : filteredTasks.length === 0 ? (
                                        <Typography sx={{ textAlign: 'center', color: '#666' }}>
                                            No Task Summary Available in Current Date Range
                                        </Typography>
                                    ) : (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell sx={{ width: '25%' }}>Task Name</StyledTableCell>
                                                    <StyledTableCell>Project</StyledTableCell>
                                                    {employeeId === null ? <StyledTableCell>Assignee</StyledTableCell> : <StyledTableCell>Description</StyledTableCell>}
                                                    <StyledTableCell>Task Date</StyledTableCell>
                                                    <StyledTableCell>Time Taken</StyledTableCell>
                                                    <StyledTableCell>Status</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredTasks.map((task, index) => (
                                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                                        <TableCell>{task.task_name}</TableCell>
                                                        <TableCell>{task.project?.title || 'Unknown'}</TableCell>
                                                        {employeeId === null ? (
                                                            <TableCell>{`${task.user?.first_name || 'Unknown'} ${task.user?.last_name || ''}`}</TableCell>
                                                        ) : (
                                                            <TableCell>{task.description ? stripHtml(task.description) : 'N/A'}</TableCell>
                                                        )}
                                                        <TableCell>{dayjs(task.created_at).format('YYYY-MM-DD')}</TableCell>
                                                        <TableCell>{formatTime(task.time_taken)}</TableCell>
                                                        <TableCell>{task.status}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
            {tabValue === 1 && (
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
                    {error && (
                        <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                    <FilterCard>
                        <Typography variant="h5" sx={{ color: 'var(--primary-color-2)', fontWeight: 700 }}>
                            <FilterAltIcon sx={{ color: 'var(--primary-color-1)' }} /> FILTERS
                        </Typography>
                        <Stack
                            direction="row"
                            alignItems="flex-end"
                            spacing={2.5}
                            sx={{ p: 2, flexWrap: "wrap", gap: 1 }}
                        >
                            <Box sx={{ minWidth: 250 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    Project
                                </Typography>
                                {loadingWorkLogs ? (
                                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
                                ) : (
                                    <Autocomplete
                                        value={selectedProject}
                                        onChange={(event, newValue) =>
                                            setSelectedProject((newValue as string) || "All")
                                        }
                                        options={projectOptions}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder="Select Project" size="small" />
                                        )}
                                        sx={{
                                            "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ minWidth: 240 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    Employee
                                </Typography>
                                {loadingUsers ? (
                                    <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '8px' }} />
                                ) : (
                                    <Autocomplete
                                        value={empUserList.find((user) => user?.id === employeeId) || null}
                                        onChange={(event, newValue) =>
                                            setEmployeeId(newValue ? newValue.id : null)
                                        }
                                        options={[{ id: "", first_name: "All", last_name: "Employees" }, ...empUserList]}
                                        getOptionLabel={(option) => `${option?.first_name || 'Unknown'} ${option?.last_name || ''}`}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder="Select Employee" size="small" />
                                        )}
                                        disabled={loadingUsers}
                                        sx={{
                                            "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ minWidth: 150 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    From
                                </Typography>
                                <TextField
                                    type="date"
                                    value={fromDate ? fromDate.format("YYYY-MM-DD") : ""}
                                    onChange={(e) =>
                                        setFromDate(e.target.value ? dayjs(e.target.value) : null)
                                    }
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                    }}
                                />
                            </Box>

                            <Box sx={{ minWidth: 150 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: "#444", mb: 0.5 }}>
                                    To
                                </Typography>
                                <TextField
                                    type="date"
                                    value={toDate ? toDate.format("YYYY-MM-DD") : ""}
                                    onChange={(e) =>
                                        setToDate(e.target.value ? dayjs(e.target.value) : null)
                                    }
                                    size="small"
                                    sx={{
                                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                                    }}
                                />
                            </Box>

                            <Box>
                                <Button
                                    variant="contained"
                                    onClick={handleRefresh}
                                    startIcon={<RefreshIcon />}
                                    sx={{
                                        borderRadius: "20px",
                                        px: 2.5,
                                        py: 0.8,
                                        textTransform: "uppercase",
                                        fontWeight: 600,
                                        mt: 0.5,
                                        background: "var(--primary-color-1, #1e3c72)",
                                        "&:hover": {
                                            background: "var(--primary-color-2)",
                                        },
                                    }}
                                    disabled={loadingWorkLogs || loadingTickets}
                                >
                                    Refresh
                                </Button>
                            </Box>
                        </Stack>
                    </FilterCard>

                    {loadingWorkLogs || loadingTickets ? (
                        <Stack direction="row" spacing={2.5} sx={{ mb: 3, mt: 2 }}>
                            {[...Array(5)].map((_, index) => (
                                <Skeleton
                                    key={index}
                                    variant="rectangular"
                                    height={100}
                                    sx={{ flex: 1, borderRadius: '12px' }}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={2.5} sx={{ mb: 3, mt: 2 }}>
                            <StatCard
                                loading={loadingWorkLogs}
                                value={formatTime(totalWorkedMinutes)}
                                label="Worked Hours"
                                icon={AccessTimeIcon}
                                iconColor="#4facfe"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={totalTickets}
                                label="Total Created Tickets"
                                icon={TrendingUpIcon}
                                iconColor="#43e97b"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={p1Tickets}
                                label="P1 Tickets"
                                icon={WarningAmberIcon}
                                iconColor="#d70000"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={p2Tickets}
                                label="P2 Tickets"
                                icon={LowPriorityIcon}
                                iconColor="#f59e0b"
                            />
                            <StatCard
                                loading={loadingTickets}
                                value={p3Tickets}
                                label="P3 Tickets"
                                icon={KeyboardDoubleArrowDownIcon}
                                iconColor="green"
                            />
                        </Stack>
                    )}

                    <Box sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Tabs value={subTabValue} onChange={handleSubTabChange} variant="fullWidth">
                            <StyledSubTab label="User Summary" />
                            <StyledSubTab label="Task Summary" />
                        </Tabs>
                        <Box sx={{ p: 2, background: '#fff' }}>
                            {subTabValue === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h5" sx={{ color: 'var(--primary-color-2)', fontWeight: 700 }}>
                                            ASSIGNED USER SUMMARY
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={exportUserSummaryForProjectReportToExcel}
                                            sx={{ borderRadius: '20px', padding: '5px 17px', background: 'var(--primary-color-1, #1e3c72)' }}
                                            disabled={loadingWorkLogs || loadingTickets || filteredUsers.length === 0}
                                        >
                                            <FileDownloadIcon /> Export to Excel
                                        </Button>
                                    </Box>
                                    {loadingWorkLogs || loadingTickets ? (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    {[...Array(6)].map((_, index) => (
                                                        <StyledTableCell key={index}>
                                                            <Skeleton />
                                                        </StyledTableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...Array(3)].map((_, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {[...Array(6)].map((_, colIndex) => (
                                                            <TableCell key={colIndex}>
                                                                <Skeleton />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : filteredUsers.length === 0 ? (
                                        <Typography sx={{ textAlign: 'center', color: '#666' }}>
                                            No Users Assigned in Current Date Range
                                        </Typography>
                                    ) : (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell>User</StyledTableCell>
                                                    <StyledTableCell>Total Worked</StyledTableCell>
                                                    <StyledTableCell>P1 Tickets</StyledTableCell>
                                                    <StyledTableCell>P2 Tickets</StyledTableCell>
                                                    <StyledTableCell>P3 Tickets</StyledTableCell>
                                                    <StyledTableCell>Total Tickets</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredUsers.map((user, index) => (
                                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                                        <TableCell>{user.name}</TableCell>
                                                        <TableCell>{formatTime(user.totalWorked)}</TableCell>
                                                        <TableCell>{user.p1Tickets}</TableCell>
                                                        <TableCell>{user.p2Tickets}</TableCell>
                                                        <TableCell>{user.p3Tickets}</TableCell>
                                                        <TableCell>{user.totalTickets}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </Box>
                            )}
                            {subTabValue === 1 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h5" sx={{ color: 'var(--primary-color-2)', fontWeight: 700 }}>
                                            TASK SUMMARY
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={exportTaskSummaryForProjectReportToExcel}
                                            sx={{ borderRadius: '20px', padding: '5px 17px', background: 'var(--primary-color-1, #1e3c72)' }}
                                            disabled={loadingWorkLogs || loadingTickets || filteredTasks.length === 0}
                                        >
                                            <FileDownloadIcon /> Export to Excel
                                        </Button>
                                    </Box>
                                    {loadingWorkLogs || loadingTickets ? (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    {[...Array(selectedProject === 'All' ? 6 : 5)].map((_, index) => (
                                                        <StyledTableCell key={index}>
                                                            <Skeleton />
                                                        </StyledTableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...Array(3)].map((_, rowIndex) => (
                                                    <TableRow key={rowIndex}>
                                                        {[...Array(selectedProject === 'All' ? 6 : 5)].map((_, colIndex) => (
                                                            <TableCell key={colIndex}>
                                                                <Skeleton />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : filteredTasks.length === 0 ? (
                                        <Typography sx={{ textAlign: 'center', color: '#666' }}>
                                            No Task Summary Available for Selected Project
                                        </Typography>
                                    ) : (
                                        <Table sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell sx={{ width: '25%' }}>Task Name</StyledTableCell>
                                                    <StyledTableCell>Assignee</StyledTableCell>
                                                    {selectedProject === 'All' ? <StyledTableCell>Project</StyledTableCell> : <StyledTableCell>Description</StyledTableCell>}
                                                    <StyledTableCell>Task Date</StyledTableCell>
                                                    <StyledTableCell>Time Taken</StyledTableCell>
                                                    <StyledTableCell>Status</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredTasks.map((task, index) => (
                                                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                                                        <TableCell>{task.task_name}</TableCell>
                                                        <TableCell>{`${task.user?.first_name || 'Unknown'} ${task.user?.last_name || ''}`}</TableCell>
                                                        {selectedProject === 'All' ? (
                                                            <TableCell>{task.project?.title || 'Unknown'}</TableCell>
                                                        ) : (
                                                            <TableCell>{task.description ? stripHtml(task.description) : 'N/A'}</TableCell>
                                                        )}
                                                        <TableCell>{dayjs(task.created_at).format('YYYY-MM-DD')}</TableCell>
                                                        <TableCell>{formatTime(task.time_taken)}</TableCell>
                                                        <TableCell>{task.status}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default UserReport;