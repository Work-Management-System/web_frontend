"use client";
import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import { useAppselector } from '@/redux/store';

const BannerContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)',
  borderRadius: '20px',
  padding: '32px 40px',
  marginBottom: '32px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  [theme.breakpoints.down('md')]: {
    padding: '24px',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
}));

const BannerContent = styled(Box)({
  flex: 1,
  zIndex: 2,
});

const BannerTitle = styled(Typography)({
  fontSize: '1.75rem',
  fontWeight: 600,
  marginBottom: '8px',
  lineHeight: 1.3,
});

const BannerDescription = styled(Typography)({
  fontSize: '1rem',
  marginBottom: '20px',
  lineHeight: 1.6,
  maxWidth: '600px',
});

const DecorativeShape = styled(Box)({
  position: 'absolute',
  right: '-50px',
  top: '-50px',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.1)',
  zIndex: 1,
});

const DecorativeShape2 = styled(Box)({
  position: 'absolute',
  right: '100px',
  bottom: '-80px',
  width: '200px',
  height: '200px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.08)',
  zIndex: 1,
});

interface WelcomeBannerProps {
  newItemsCount?: number;
  onReviewClick?: () => void;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ 
  newItemsCount = 0,
  onReviewClick 
}) => {
  const user = useAppselector((state) => state.user.user);
  const userName = user?.first_name || 'User';
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <BannerContainer>
      <DecorativeShape />
      <DecorativeShape2 />
      <BannerContent>
        <BannerTitle
          sx={{
            color: '#ffffff',
            fontWeight: 600,
          }}
        >
          {getGreeting()} {userName}
        </BannerTitle>
        <BannerDescription
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          {newItemsCount > 0 
            ? `You have ${newItemsCount} new ${newItemsCount === 1 ? 'item' : 'items'}. It is a lot of work for today! So let's start.`
            : `Welcome back! You're all caught up. Ready to tackle today's tasks?`
          }
        </BannerDescription>
      </BannerContent>
      {/* Decorative illustration placeholder - you can add an actual image here */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          display: { xs: 'none', lg: 'block' },
          width: '200px',
          height: '200px',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
          }}
        >
          👋
        </Box>
      </Box>
    </BannerContainer>
  );
};

export default WelcomeBanner;

