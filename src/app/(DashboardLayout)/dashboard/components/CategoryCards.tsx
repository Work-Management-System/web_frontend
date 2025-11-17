"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, styled, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import GroupIcon from '@mui/icons-material/Group';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CodeIcon from '@mui/icons-material/Code';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import ReportIcon from '@mui/icons-material/Report';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const CategorySection = styled(Box)(({ theme }) => ({
  marginBottom: '32px',
}));

const SectionHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
});

const SectionTitle = styled(Typography)({
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

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '20px',
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '16px',
  },
}));

const CategoryCard = styled(Box)<{ isClockInOut?: boolean; disabled?: boolean }>(({ theme, isClockInOut, disabled }) => ({
  backgroundColor: 'var(--card-bg-color)',
  borderRadius: '16px',
  padding: '24px',
  cursor: (isClockInOut || disabled) ? 'default' : 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  border: '1px solid rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  minHeight: '160px',
  justifyContent: 'center',
  opacity: disabled ? 0.7 : 1,
  '&:hover': {
    transform: (isClockInOut || disabled) ? 'none' : 'translateY(-4px)',
    boxShadow: (isClockInOut || disabled) ? '0 2px 8px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.12)',
    borderColor: (isClockInOut || disabled) ? 'rgba(0,0,0,0.05)' : 'var(--primary-color-1)',
  },
}));

const ClockButton = styled(Button)({
  marginTop: '12px',
  borderRadius: '8px',
  textTransform: 'none',
  padding: '8px 24px',
  fontSize: '0.875rem',
  fontWeight: 500,
  backgroundColor: 'var(--primary-color-1)',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: 'var(--primary-color-2)',
  },
});

const IconWrapper = styled(Box)<{ bgColor: string }>(({ bgColor }) => ({
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  backgroundColor: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
  '& svg': {
    fontSize: '28px',
    color: '#ffffff',
  },
}));

const CategoryName = styled(Typography)({
  fontSize: '0.95rem',
  fontWeight: 500,
  color: 'var(--text-color)',
  marginBottom: '8px',
});

const CategoryCount = styled(Typography)({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--primary-color-1)',
  transition: 'all 0.3s ease',
});

interface CategoryCardData {
  name: string;
  count: number;
  icon: React.ReactElement;
  bgColor: string;
  route: string;
  isClockInOut?: boolean;
  onClockAction?: () => void;
  clockButtonText?: string;
  disabled?: boolean;
}

interface CategoryCardsProps {
  categories: CategoryCardData[];
  title?: string;
  viewAllRoute?: string;
}

const CategoryCards: React.FC<CategoryCardsProps> = ({ 
  categories, 
  title = "You Need to Hire",
  viewAllRoute 
}) => {
  const router = useRouter();
  const [animatedCounts, setAnimatedCounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    // Initialize animated counts
    const initialCounts: { [key: number]: number } = {};
    categories.forEach((_, index) => {
      initialCounts[index] = 0;
    });
    setAnimatedCounts(initialCounts);

    // Animate each count
    const timers: NodeJS.Timeout[] = [];
    
    categories.forEach((category, index) => {
      if (!category.isClockInOut && category.count > 0) {
        const duration = 1500; // 1.5 seconds
        const steps = 60;
        const increment = category.count / steps;
        const stepDuration = duration / steps;
        
        let currentStep = 0;
        const timer = setInterval(() => {
          currentStep++;
          const newValue = Math.min(Math.floor(increment * currentStep), category.count);
          setAnimatedCounts(prev => ({ ...prev, [index]: newValue }));
          
          if (currentStep >= steps) {
            clearInterval(timer);
            setAnimatedCounts(prev => ({ ...prev, [index]: category.count }));
          }
        }, stepDuration);
        
        timers.push(timer);
      } else {
        setAnimatedCounts(prev => ({ ...prev, [index]: category.count }));
      }
    });

    // Cleanup function
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [categories]);

  const handleCardClick = (route: string) => {
    router.push(route);
  };

  const handleViewAll = () => {
    if (viewAllRoute) {
      router.push(viewAllRoute);
    }
  };

  return (
    <CategorySection>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        {viewAllRoute && (
          <ViewAllButton onClick={handleViewAll}>
            View All
          </ViewAllButton>
        )}
      </SectionHeader>
      <CardsGrid>
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            isClockInOut={category.isClockInOut}
            disabled={category.disabled}
            onClick={(category.isClockInOut || category.disabled) ? undefined : () => handleCardClick(category.route)}
          >
            <IconWrapper bgColor={category.bgColor}>
              {category.icon}
            </IconWrapper>
            <CategoryName>{category.name}</CategoryName>
            {category.isClockInOut ? (
              <ClockButton
                onClick={(e) => {
                  e.stopPropagation();
                  category.onClockAction?.();
                }}
                variant="contained"
              >
                {category.clockButtonText || 'Clock In'}
              </ClockButton>
            ) : (
              <CategoryCount>
                {animatedCounts[index] !== undefined ? animatedCounts[index] : category.count}
              </CategoryCount>
            )}
          </CategoryCard>
        ))}
      </CardsGrid>
    </CategorySection>
  );
};

export default CategoryCards;

