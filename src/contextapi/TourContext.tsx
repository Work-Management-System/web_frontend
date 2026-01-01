"use client";
// Import polyfill BEFORE react-joyride
import '@/utils/react-dom-polyfill';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';

interface TourContextType {
  runTour: (tourKey: string, steps: Step[]) => void;
  stopTour: () => void;
  isTourRunning: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Tour storage key prefix
const TOUR_STORAGE_PREFIX = 'tour_completed_';

// Check if tour has been completed
export const isTourCompleted = (tourKey: string): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${TOUR_STORAGE_PREFIX}${tourKey}`) === 'true';
};

// Mark tour as completed
export const markTourCompleted = (tourKey: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourKey}`, 'true');
};

// Reset tour (for testing/admin purposes)
export const resetTour = (tourKey: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${TOUR_STORAGE_PREFIX}${tourKey}`);
};

// Tour styles
const tourStyles: Styles = {
  options: {
    primaryColor: '#ff9800',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 8,
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  buttonNext: {
    backgroundColor: '#ff9800',
    borderRadius: 4,
    padding: '8px 16px',
  },
  buttonBack: {
    marginRight: 8,
    color: '#666',
  },
  buttonSkip: {
    color: '#666',
  },
};

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentTourKey, setCurrentTourKey] = useState<string | null>(null);
  const pathname = usePathname();

  const runTour = useCallback((tourKey: string, tourSteps: Step[]) => {
    // Check if tour was already completed
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

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

