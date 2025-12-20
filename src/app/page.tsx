"use client"
import React from 'react';
import LandingPage from './components/LandingPage';

const Page = () => {
  // Always show landing page at base route
  // Middleware handles redirecting authenticated users to /dashboard
  return <LandingPage />;
};

export default Page;
