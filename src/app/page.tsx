"use client"
import React from 'react';
import LandingPage from './components/LandingPage';
import Snowfall from 'react-snowfall';

const Page = () => {
  // Always show landing page at base route
  // Middleware handles redirecting authenticated users to /dashboard

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Snowfall
        snowflakeCount={100}
        speed={[0.5, 3]}
        wind={[-0.5, 2]}
        radius={[0.5, 3]}
        color="#ffffff"
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      />
      <LandingPage />
    </div>
  );
};

export default Page;
