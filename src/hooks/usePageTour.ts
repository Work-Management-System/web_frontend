"use client";
// =============================================================================
// TOUR FEATURE DISABLED - This hook is now a no-op
// To re-enable, uncomment the original code below
// =============================================================================

/**
 * Hook to automatically trigger tour when user visits a page for the first time.
 * 
 * DISABLED: Tour feature has been commented out due to issues.
 * This is now a no-op function that does nothing.
 *
 * Usage: Add `usePageTour()` at the top of your page component.
 */
export const usePageTour = () => {
  // DISABLED: Tour feature is commented out - do nothing
  return;
};

// --- ORIGINAL CODE (DISABLED) ---
/*
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTour, isTourCompleted } from '@/contextapi/TourContext';
import { getTourByRoute } from '@/utils/tours/tourConfigs';
import { useAppselector } from '@/redux/store';

export const usePageTour = () => {
  const pathname = usePathname();
  const { runTour } = useTour();
  const hasRunTour = useRef(false);

  // Read current role priority from Redux
  const userPriority = useAppselector((state) => state.role.value?.priority ?? 0);

  // Map priority to a stable role segment used in tour keys
  const roleSegment: 'admin' | 'manager' | 'employee' =
    userPriority === 2 ? 'admin' : userPriority === 3 ? 'manager' : 'employee';

  useEffect(() => {
    // Reset when pathname changes
    hasRunTour.current = false;

    // Small delay to ensure page is fully rendered
    const timer = setTimeout(() => {
      const baseRoute = pathname.replace(/^\//, '').split('/')[0] || 'dashboard';

      // Tour key is route + role segment so each role can have its own completion state
      const tourKey = `${baseRoute}-${roleSegment}`;

      // Get steps for route and role
      const tourSteps = getTourByRoute(pathname, roleSegment);

      if (tourSteps && !isTourCompleted(tourKey) && !hasRunTour.current) {
        hasRunTour.current = true;
        runTour(tourKey, tourSteps);
      }
    }, 500); // Wait 500ms for page to render

    return () => clearTimeout(timer);
  }, [pathname, roleSegment, runTour]);
};
*/

