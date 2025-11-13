'use client'
import React, { useState, useMemo } from 'react';
import { Calendar, Users } from 'lucide-react';
import { IconButton, Menu, MenuItem, Box, Tooltip } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import { useRouter } from 'next/navigation';

interface Project {
    projectId: number;
    projectTitle: string;
    projectDescription: string;
    projectStartDate: string;
    projectStatus: string;
    totalTickets: number;
    pendingTickets: number;
    inProgressTickets: number;
    testableTickets: number;
    debuggingTickets: number;
    completedTickets: number;
    onHoldTickets: number;
    totalTeamMembers: number;
}

interface ProjectOverviewProps {
    projects: Project[];
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects }) => {
    const [search, setSearch] = useState("");
    const [sortOption, setSortOption] = useState("titleAsc");
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const router = useRouter();

    // Handle menu open/close
    const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setAnchorEl(null);
    };

    const handleSortSelect = (sortOption: string) => {
        setSortOption(sortOption);
        setAnchorEl(null);
    };

    const filteredProjects = useMemo(() => {
        let filtered = projects?.filter(p =>
            p.projectTitle.toLowerCase().includes(search.toLowerCase())
        );

        return filtered?.sort((a, b) => {
            const progressA = a.totalTickets > 0 ? (a.completedTickets / a.totalTickets) * 100 : 0;
            const progressB = b.totalTickets > 0 ? (b.completedTickets / b.totalTickets) * 100 : 0;

            switch (sortOption) {
                case "progressDesc": return progressB - progressA;
                case "progressAsc": return progressA - progressB;
                case "titleAsc": return a.projectTitle.localeCompare(b.projectTitle);
                case "titleDesc": return b.projectTitle.localeCompare(a.projectTitle);
                case "dateDesc": return new Date(b.projectStartDate).getTime() - new Date(a.projectStartDate).getTime();
                case "dateAsc": return new Date(a.projectStartDate).getTime() - new Date(b.projectStartDate).getTime();
                default: return 0;
            }
        });
    }, [projects, search, sortOption]);

    return (
        <div className="bg-white/50 shadow-lg p-2 rounded-2xl mb-6 min-w-[30vw]">
            {/* Header with title & sort */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <h6 className="text-lg font-semibold text-gray-800">Project Overview</h6>
                <IconButton onClick={handleSortClick} sx={{ color: '#172b4d' }}>
                    <SortIcon />
                </IconButton>
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
                    <MenuItem onClick={() => handleSortSelect("progressDesc")}>Progress: High → Low</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("progressAsc")}>Progress: Low → High</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("titleAsc")}>Title: A → Z</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("titleDesc")}>Title: Z → A</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("dateDesc")}>Start Date: New → Old</MenuItem>
                    <MenuItem onClick={() => handleSortSelect("dateAsc")}>Start Date: Old → New</MenuItem>
                </Menu>
            </Box>

            {/* Search bar */}
            <input
                type="text"
                placeholder="Search by project title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full mb-3 border-blue-400"
            />

            {/* Projects list */}
            <div className="overflow-y-auto max-h-[62vh]">
                {filteredProjects?.map((project, index) => {
                    const progress = project.totalTickets > 0
                        ? Math.min(100, (project.completedTickets / project.totalTickets) * 100)
                        : 0;

                    return (
                        <div
                            key={index}
                            className="mb-3 p-4 rounded-lg border border-radius-sm border-gray-200 bg-white cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => router.push(`/project-listing/${project.projectId}`)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center justify-between">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    <h3 className="text-sm font-semibold" style={{ color: "var(--primary-color-1)" }}>
                                        {project.projectTitle}
                                    </h3>
                                </div>
                                <span className="ml-2 px-1 py-1/2 text-black text-xs rounded-full">
                                    {project.projectStatus}
                                </span>
                            </div>

                            <p className="text-sm text-gray-700 mb-2">{project.projectDescription}</p>

                            {/* Progress bar */}
                            <Tooltip
                                title={`${project.completedTickets}/${project.totalTickets} tickets completed`}
                                placement="top"
                                arrow
                                sx={{
                                    '& .MuiTooltip-tooltip': {
                                        backgroundColor: '#b91c1c', // Changed to red (previously #1e40af)
                                    },
                                    '& .MuiTooltip-arrow': {
                                        color: '#b91c1c', // Match arrow color to new tooltip background
                                    }
                                }}>
                                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                                    <div
                                        className="h-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </Tooltip>

                            <div className="text-sm text-gray-700 flex justify-between">
                                <span>Progress</span>
                                <span>{progress.toFixed(1)}%</span>
                            </div>

                            <div className="text-sm text-gray-700 flex justify-between mt-2">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(project.projectStartDate).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {project.totalTeamMembers} members
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProjectOverview;