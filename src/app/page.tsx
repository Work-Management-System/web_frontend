"use client"
import { useAppselector } from '@/redux/store';

import React, { useEffect } from 'react';
import Dashboard from './(DashboardLayout)/dashboard/page';
import { redirect } from 'next/navigation';

const Page = () => {
  const authData = useAppselector(state => state.auth.value);
useEffect(() => {
  redirect('/dashboard');
}, []);

  return (
    <></>

  );
};

export default Page;
