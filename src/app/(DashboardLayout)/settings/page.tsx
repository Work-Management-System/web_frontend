'use client'
import React, {useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Paper,
    styled
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import TenantList from '../tenant-settings/page';
import RoleList from '../system-roles/page';
import DepartmentSettings from './DepartmentSettings';
import DesignationSettings from './DesignationSettings';
import FunctionalitySettings from './FunctionalitySettings';
import TenantValues from './TenantValues';

// Custom Styled Components
const GlassCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: theme.spacing(1),
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '.9rem',
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
        color: 'var(--primary-color-1)',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
    },
    '&:hover': {
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
    },
}));
// Tab Panel Component
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box>
                    {children}
                </Box>
            )}
        </div>
    );
}


// Main Settings Page Component
const SettingsPage = () => {
    const [tabValue, setTabValue] = useState(0);
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Box
            sx={{
                maxWidth: 1600,
                mx: 'auto',
                p: 2,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%)',
                minHeight: '100vh',
            }}
        >
            <GlassCard sx={{ mb: 3 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <SettingsIcon sx={{ color: "var(--primary-color-2)" }} />
                        <Typography variant="h3" sx={{ fontWeight: 600 }}>
                            Settings
                        </Typography>
                    </Box>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label="settings tabs"
                        sx={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                            '& .MuiTabs-indicator': { backgroundColor: 'var(--primary-color-2)' },
                        }}
                    >
                        <StyledTab label="Departments" />
                        <StyledTab label="Designations" />
                        <StyledTab label="Tenant Settings" />
                        <StyledTab label="Roles Settings" />
                        <StyledTab label="Functionalities" />
                        <StyledTab label="Tenant Values" />
                    </Tabs>
                </Box>
            </GlassCard>

            <TabPanel value={tabValue} index={0}>
                <DepartmentSettings />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <DesignationSettings />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                    <TenantList />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
                        <RoleList />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
                <FunctionalitySettings />
            </TabPanel>
            <TabPanel value={tabValue} index={5}>
                <TenantValues />
            </TabPanel>
        </Box>
    );
};

export default SettingsPage;