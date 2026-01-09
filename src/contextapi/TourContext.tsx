"use client";
// Import polyfill BEFORE react-joyride
import '@/utils/react-dom-polyfill';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { Box, Typography } from '@mui/material';
import { Close, ArrowForward, ArrowBack } from '@mui/icons-material';

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

// Modern, fancy tour styles
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
  tooltipContainer: {
    textAlign: 'left',
    padding: '28px 32px',
    position: 'relative',
    zIndex: 2,
  },
  tooltipTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: '12px',
    lineHeight: 1.3,
    background: 'linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  tooltipContent: {
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#4a5568',
    marginBottom: '24px',
    fontWeight: 400,
  },
  buttonNext: {
    background: 'linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)',
    borderRadius: '12px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(59, 130, 246, 0.2)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'none',
    letterSpacing: '0.3px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(59, 130, 246, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0px)',
    },
  },
  buttonBack: {
    marginRight: '12px',
    color: '#64748b',
    fontSize: '15px',
    fontWeight: 500,
    padding: '12px 20px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    background: '#ffffff',
    transition: 'all 0.3s ease',
    textTransform: 'none',
    cursor: 'pointer',
    '&:hover': {
      background: '#f8f9fa',
      borderColor: '#cbd5e1',
      color: '#475569',
    },
  },
  buttonSkip: {
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    textTransform: 'none',
    cursor: 'pointer',
    '&:hover': {
      color: '#64748b',
      background: 'rgba(148, 163, 184, 0.1)',
    },
  },
  badge: {
    background: 'linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%)',
    borderRadius: '12px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    mixBlendMode: 'normal',
  },
  spotlight: {
    borderRadius: '12px',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 0 2px rgba(59, 130, 246, 0.5)',
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

  // Inject custom CSS for fancy tour animations
  useEffect(() => {
    if (run) {
      const styleId = 'joyride-custom-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          /* Modern Tour Tooltip Animations */
          [data-joyride-tooltip] {
            animation: tourFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          @keyframes tourFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          /* Decorative gradient background */
          [data-joyride-tooltip]::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color-1) 0%, var(--primary-color-2) 50%, var(--primary-color-1) 100%);
            background-size: 200% 100%;
            animation: gradientShift 3s ease infinite;
            border-radius: 20px 20px 0 0;
          }
          
          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          /* Shine effect on tooltip */
          [data-joyride-tooltip]::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            animation: shine 3s infinite;
            pointer-events: none;
            border-radius: 20px;
          }
          
          @keyframes shine {
            0% {
              left: -100%;
            }
            50%, 100% {
              left: 100%;
            }
          }
          
          /* Enhanced button hover effects */
          [data-joyride-button-next]:hover {
            transform: translateY(-2px) !important;
          }
          
          [data-joyride-button-next]:active {
            transform: translateY(0px) !important;
          }
          
          /* Progress indicator styling */
          [data-joyride-progress] {
            background: linear-gradient(135deg, var(--primary-color-1) 0%, var(--primary-color-2) 100%) !important;
            border-radius: 10px !important;
            height: 4px !important;
          }
        `;
        document.head.appendChild(style);
      }
      
      return () => {
        // Cleanup on unmount
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
              arrow: {
                length: 8,
                spread: 16,
              },
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

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};

