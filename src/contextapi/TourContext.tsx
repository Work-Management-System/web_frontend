"use client";
// =============================================================================
// TOUR FEATURE DISABLED - Commented out due to issues
// To re-enable, uncomment the original code and remove the disabled version
// =============================================================================

// --- DISABLED: Original imports ---
// import '@/utils/react-dom-polyfill';
// import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { usePathname } from 'next/navigation';
// import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
// import { Box, Typography } from '@mui/material';
// import { Close, ArrowForward, ArrowBack } from '@mui/icons-material';

import React, { createContext, useContext, useCallback } from "react";

// Step type placeholder (to maintain type compatibility)
export interface Step {
  target: string;
  content: React.ReactNode;
  placement?: string;
  disableBeacon?: boolean;
  title?: string;
}

interface TourContextType {
  runTour: (tourKey: string, steps: Step[]) => void;
  stopTour: () => void;
  isTourRunning: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Tour storage key prefix
const TOUR_STORAGE_PREFIX = "tour_completed_";

// Check if tour has been completed - DISABLED: always returns true
export const isTourCompleted = (tourKey: string): boolean => {
  // DISABLED: Tour feature is commented out
  return true;
  // --- ORIGINAL CODE ---
  // if (typeof window === 'undefined') return false;
  // return localStorage.getItem(`${TOUR_STORAGE_PREFIX}${tourKey}`) === 'true';
};

// Mark tour as completed - DISABLED: no-op
export const markTourCompleted = (tourKey: string): void => {
  // DISABLED: Tour feature is commented out
  return;
  // --- ORIGINAL CODE ---
  // if (typeof window === 'undefined') return;
  // localStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourKey}`, 'true');
};

// Reset tour (for testing/admin purposes) - DISABLED: no-op
export const resetTour = (tourKey: string): void => {
  // DISABLED: Tour feature is commented out
  return;
  // --- ORIGINAL CODE ---
  // if (typeof window === 'undefined') return;
  // localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${tourKey}`);
};

// --- DISABLED: Tour styles (commented out) ---
/*
const tourStyles: Styles = {
  options: {
    primaryColor: 'var(--primary-color-1)',
    zIndex: 10000,
    arrowColor: 'transparent',
  },
  tooltip: {
    borderRadius: '20px',
    padding: 0,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    border: 'none',
    maxWidth: '420px',
    minWidth: '320px',
    position: 'relative',
    overflow: 'hidden',
  },
  // ... rest of styles omitted for brevity
};
*/

interface TourProviderProps {
  children: React.ReactNode;
}

// DISABLED: TourProvider now just renders children without tour functionality
export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  // No-op functions for tour (disabled)
  const runTour = useCallback((tourKey: string, tourSteps: Step[]) => {
    // DISABLED: Tour feature is commented out - do nothing
  }, []);

  const stopTour = useCallback(() => {
    // DISABLED: Tour feature is commented out - do nothing
  }, []);

  return (
    <TourContext.Provider value={{ runTour, stopTour, isTourRunning: false }}>
      {children}
      {/* DISABLED: Joyride component removed */}
    </TourContext.Provider>
  );
};

// --- ORIGINAL TourProvider (DISABLED) ---
/*
export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentTourKey, setCurrentTourKey] = useState<string | null>(null);
  const pathname = usePathname();

  const runTour = useCallback((tourKey: string, tourSteps: Step[]) => {
    if (isTourCompleted(tourKey)) {
      return;
    }
    setCurrentTourKey(tourKey);
    setSteps(tourSteps);
    setRun(true);
  }, []);

  const stopTour = useCallback(() => {
    setRun(false);
    setSteps([]);
    setCurrentTourKey(null);
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (currentTourKey) {
        markTourCompleted(currentTourKey);
      }
      stopTour();
    }
  };

  useEffect(() => {
    if (run) {
      const styleId = 'joyride-custom-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `...tour CSS...`;
        document.head.appendChild(style);
      }
      return () => {
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
          styleElement.remove();
        }
      };
    }
  }, [run]);

  return (
    <TourContext.Provider value={{ runTour, stopTour, isTourRunning: run }}>
      {children}
      {run && steps.length > 0 && (
        <Joyride
          steps={steps}
          run={run}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={tourStyles}
          floaterProps={{
            disableAnimation: false,
            styles: {
              arrow: { length: 8, spread: 16 },
            },
          }}
          locale={{
            back: 'Back',
            close: 'Close',
            last: 'Finish',
            next: 'Next',
            open: 'Open the dialog',
            skip: 'Skip',
          }}
        />
      )}
    </TourContext.Provider>
  );
};
*/

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    // DISABLED: Instead of throwing error, return no-op functions
    // This prevents crashes if useTour is called outside TourProvider
    return {
      runTour: () => {},
      stopTour: () => {},
      isTourRunning: false,
    };
    // --- ORIGINAL CODE ---
    // throw new Error('useTour must be used within TourProvider');
  }
  return context;
};
