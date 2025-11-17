"use client";
import React from 'react';
import { Box, Typography, styled, Button, IconButton, Chip } from '@mui/material';
import { useRouter } from 'next/navigation';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuItem } from '@mui/material';

const TableContainer = styled(Box)({
  backgroundColor: 'var(--card-bg-color)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: '1px solid rgba(0,0,0,0.05)',
});

const TableHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
});

const TableTitle = styled(Typography)({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: 'var(--text-color)',
});

const ViewAllButton = styled(Button)({
  textTransform: 'none',
  fontSize: '0.875rem',
  color: 'var(--primary-color-1)',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
});

const TableWrapper = styled(Box)({
  overflowX: 'auto',
});

const StyledTable = styled('table')({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
});

const TableHead = styled('thead')({
  backgroundColor: 'var(--primary-bg-colors)',
});

const TableHeaderRow = styled('tr')({
  '& th': {
    padding: '16px',
    textAlign: 'left',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-color)',
    borderBottom: '2px solid rgba(0,0,0,0.1)',
  },
});

const TableBody = styled('tbody')({
  '& tr': {
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
  },
});

const TableRow = styled('tr')<{ isSelected?: boolean }>(({ isSelected }) => ({
  backgroundColor: isSelected ? 'rgba(var(--primary-color-1-rgb), 0.1)' : 'transparent',
  '& td': {
    padding: '16px',
    fontSize: '0.875rem',
    color: 'var(--text-color)',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  },
}));

const StatusChip = styled(Chip)<{ statusColor: string }>(({ statusColor }) => ({
  backgroundColor: statusColor,
  color: '#ffffff',
  fontSize: '0.75rem',
  fontWeight: 500,
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

const StatusDot = styled(Box)<{ color: string }>(({ color }) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'inline-block',
  marginRight: '8px',
}));

interface ProgressItem {
  id: string;
  fullName: string;
  designation: string;
  status: string;
  statusColor: string;
}

interface ProgressTableProps {
  title?: string;
  items: ProgressItem[];
  viewAllRoute?: string;
  onItemClick?: (id: string) => void;
}

const ProgressTable: React.FC<ProgressTableProps> = ({
  title = "Recruitment Progress",
  items,
  viewAllRoute,
  onItemClick,
}) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = React.useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, rowId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleRowClick = (id: string) => {
    if (onItemClick) {
      onItemClick(id);
    }
  };

  const getStatusDisplay = (status: string, statusColor: string) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <StatusDot color={statusColor} />
        <Typography sx={{ fontSize: '0.875rem' }}>{status}</Typography>
      </Box>
    );
  };

  return (
    <TableContainer>
      <TableHeader>
        <TableTitle>{title}</TableTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {viewAllRoute && (
            <ViewAllButton onClick={() => router.push(viewAllRoute)}>
              View All
            </ViewAllButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => handleMenuClick(e, 'header')}
            sx={{ color: 'var(--text-color)' }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </TableHeader>
      <TableWrapper>
        <StyledTable>
          <TableHead>
            <TableHeaderRow>
              <th>Full Name</th>
              <th>Designation</th>
              <th>Status</th>
              <th style={{ width: '40px' }}></th>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                isSelected={selectedRow === item.id}
                onClick={() => handleRowClick(item.id)}
                sx={{ cursor: 'pointer' }}
              >
                <td>
                  <Typography sx={{ fontWeight: 500 }}>
                    {item.fullName}
                  </Typography>
                </td>
                <td>
                  <Typography>{item.designation}</Typography>
                </td>
                <td>
                  {getStatusDisplay(item.status, item.statusColor)}
                </td>
                <td>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, item.id)}
                    sx={{ color: 'var(--text-color)' }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </td>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </TableWrapper>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '150px',
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
      </Menu>
    </TableContainer>
  );
};

export default ProgressTable;

