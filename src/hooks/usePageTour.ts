"use client";
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTour } from '@/contextapi/TourContext';
import { getTourByRoute, isTourCompleted } from '@/utils/tours/tourConfigs';

/**
 * Hook to automatically trigger tour when user visits a page for the first time
 * Usage: Add `usePageTour()` at the top of your page component
 */
export const usePageTour = () => {
  const pathname = usePathname();
  const { runTour } = useTour();
  const hasRunTour = useRef(false);

  useEffect(() => {
    // Reset when pathname changes
    hasRunTour.current = false;

    // Small delay to ensure page is fully rendered
    const timer = setTimeout(() => {
      const baseRoute = pathname.replace(/^\//, '').split('/')[0];
      const tourKey = baseRoute || 'dashboard';
      
      // Check if tour exists for this route
      const tourSteps = getTourByRoute(pathname);
      
      if (tourSteps && !isTourCompleted(tourKey) && !hasRunTour.current) {
        hasRunTour.current = true;
        runTour(tourKey, tourSteps);
      }
    }, 500); // Wait 500ms for page to render

    return () => clearTimeout(timer);
  }, [pathname, runTour]);
};


