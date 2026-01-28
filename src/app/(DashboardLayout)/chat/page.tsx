'use client';

import React, { useEffect, useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useAppselector } from '@/redux/store';
import { useDispatch } from 'react-redux';
import { fetchSpaces, setActiveSpace, fetchUnreadCounts } from '@/redux/features/spacesSlice';
import SpacesSidebar from './components/SpacesSidebar';
import ChatPanel from './components/ChatPanel';
import ContactInfoPanel from './components/ContactInfoPanel';
import getChatSocket from '@/utils/ChatSocketConnection';
import { useSocketEvents } from './hooks/useSocketEvents';

export default function ChatPage() {
  const dispatch = useDispatch();
  const { spaces, activeSpaceId } = useAppselector((state) => state.spaces);
  const [showContactInfo, setShowContactInfo] = useState(true);
  const mobile = useMediaQuery('(max-width: 767px)');
  const tablet = useMediaQuery('(min-width: 768px) and (max-width: 1199px)');
  const desktop = useMediaQuery('(min-width: 1200px)');

  // Initialize socket and set up event handlers
  useSocketEvents();

  useEffect(() => {
    // Fetch spaces and unread counts immediately on mount
    // Unread counts don't depend on spaces list - backend returns counts for all user's spaces
    console.log('[ChatPage] Mounting - fetching spaces and unread counts');
    dispatch(fetchSpaces());
    dispatch(fetchUnreadCounts()).catch((error) => {
      console.error('[ChatPage] Failed to fetch unread counts:', error);
    });
  }, [dispatch]);

  const handleSpaceCreated = () => {
    // Refresh spaces list after creation
    dispatch(fetchSpaces());
  };

  const handleSpaceSelect = (spaceId: string) => {
    dispatch(setActiveSpace(spaceId));
  };

  const toggleContactInfo = () => {
    setShowContactInfo(!showContactInfo);
  };

  // Get active space details
  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  return (
    <Box 
      sx={{ 
        height: 'calc(100vh - 140px)', 
        display: 'flex', 
        overflow: 'hidden',
        bgcolor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Left Sidebar - Friends & Spaces */}
      <Box
        sx={{
          width: mobile ? '100%' : tablet ? '320px' : '300px',
          minWidth: mobile ? '100%' : tablet ? '320px' : '300px',
          maxWidth: mobile ? '100%' : tablet ? '320px' : '300px',
          display: mobile && activeSpaceId ? 'none' : 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e8e8e8',
          height: '100%',
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <SpacesSidebar
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSpaceSelect={handleSpaceSelect}
          onSpaceCreated={handleSpaceCreated}
        />
      </Box>

      {/* Main Chat Panel */}
      <Box
        sx={{
          flex: 1,
          display: mobile && !activeSpaceId ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          minWidth: 0,
          bgcolor: '#fff',
        }}
      >
        {activeSpaceId ? (
          <ChatPanel
            spaceId={activeSpaceId}
            onBackClick={mobile ? () => dispatch(setActiveSpace(null)) : undefined}
            onToggleInfo={toggleContactInfo}
            showInfoPanel={showContactInfo}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
              color: 'text.secondary',
              bgcolor: '#fafafa',
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: '#e8f0fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Box
                component="span"
                sx={{ fontSize: 48 }}
              >
                💬
              </Box>
            </Box>
            <Box sx={{ fontSize: '1.25rem', fontWeight: 500, color: '#333' }}>
              Select a conversation
            </Box>
            <Box sx={{ fontSize: '0.875rem', color: '#666' }}>
              Choose a friend or space to start chatting
            </Box>
          </Box>
        )}
      </Box>

      {/* Right Sidebar - Contact Info */}
      {activeSpaceId && showContactInfo && !mobile && (
        <Box
          sx={{
            width: tablet ? '280px' : '320px',
            minWidth: tablet ? '280px' : '320px',
            maxWidth: tablet ? '280px' : '320px',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #e8e8e8',
            height: '100%',
            overflow: 'hidden',
            bgcolor: '#fff',
          }}
        >
          <ContactInfoPanel
            spaceId={activeSpaceId}
            space={activeSpace}
            onClose={() => setShowContactInfo(false)}
          />
        </Box>
      )}
    </Box>
  );
}
