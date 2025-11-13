import React from 'react';
import { Group, Assignment, ReportProblem } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAppselector } from '@/redux/store';
interface DashboardCardProps {
    title: string;
    value: number | string;
    change: number;
    icon: React.ReactElement<any>;
    url:string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, change, icon,url }) =>{
    const router = useRouter();

    return (
    <div className="bg-white p-4 rounded-lg shadow-lg min-w-[383px] mt-3 mb-3.5" onClick={()=>router.push(url)} style={{ cursor: 'pointer' }}>
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
            {React.cloneElement(icon)}
        </div>
        <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold">{value}</p>
            {change > 0 &&
            <span className="text-sm text-green-400">+{change}</span>
            }
        </div>
    </div>
)}

interface TenantDetailsCardsProps {
    projectStats: { totalProjects: number; newProjectsLastMonth: number };
    userStats: { totalUsers: number; usersCreatedLastMonth: number };
    worklogCountYesterday: number;
}

const TenantDetailsCards: React.FC<TenantDetailsCardsProps> = ({ projectStats, userStats, worklogCountYesterday }) => {
const userPriority = useAppselector((state) => state.role.value.priority);
const today = new Date();
    const cards: DashboardCardProps[] = [
        {
            title: 'Total Users',
            value: userStats?.totalUsers,
            change: userStats?.usersCreatedLastMonth,
            icon: <Group className="text-blue-500" /> ,
            url:'/users'
        },
        {
            title: 'Total Projects',
            value: projectStats?.totalProjects,
            change: projectStats?.newProjectsLastMonth,
            icon: <Assignment className="text-green-500" />,
            url:'/project-listing'  
        },
        {
            title: 'Missed reports yesterday',
            value: today.getDay() === 1 ? "Yesterday was Sunday🌞" : (userStats?.totalUsers ?? 0) - (worklogCountYesterday ?? 0),
            change: -1,
            icon: <ReportProblem className="text-red-500" />  ,
            url:'/my-reports'
        },
    ];
    const visibleCards = userPriority === 3
        ? cards.filter((c) => c.change !== -1)
        : cards;
    return (
        <div
            className={`grid grid-cols-1 ${userPriority === 3 ? "md:grid-cols-2" : "md:grid-cols-3"
                } gap-6`}
        >
            {visibleCards.map((card, index) => (
                <DashboardCard key={index} {...card} />
            ))}
        </div>
    );
};

export default TenantDetailsCards;
