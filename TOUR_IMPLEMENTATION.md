# Tour/Tutorial Implementation Guide

This document explains how the react-joyride tour system works and how to add tours to new pages.

## Overview

The tour system automatically shows interactive tutorials when users visit a page for the first time. Tours are stored in localStorage and won't show again once completed.

## Architecture

### 1. Tour Context (`src/contextapi/TourContext.tsx`)
- Manages tour state globally
- Handles tour completion tracking
- Provides `runTour()`, `stopTour()`, and `isTourRunning` to components

### 2. Tour Configurations (`src/utils/tours/tourConfigs.ts`)
- Contains all tour step definitions
- Each module has its own tour configuration
- Tours are mapped to routes automatically

### 3. Page Tour Hook (`src/hooks/usePageTour.ts`)
- Automatically triggers tours on first visit
- Checks localStorage to see if tour was completed
- Waits for page to render before starting tour

## How It Works

1. **User visits a page** → `usePageTour()` hook runs
2. **Hook checks** → Has this tour been completed? (localStorage)
3. **If not completed** → Tour starts automatically
4. **User completes/skips** → Tour marked as completed in localStorage
5. **Future visits** → Tour won't show again

## Adding Tours to New Pages

### Step 1: Add Tour Configuration

Edit `src/utils/tours/tourConfigs.ts`:

```typescript
export const myNewPageTour: Step[] = [
  {
    target: 'body',
    content: 'Welcome to My New Page!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="important-element"]',
    content: 'This is an important feature you should know about.',
    placement: 'top',
  },
];

// Add to tourConfigs mapping
export const tourConfigs: Record<string, Step[]> = {
  // ... existing tours
  'my-new-page': myNewPageTour,
};
```

### Step 2: Add Tour Hook to Page Component

```typescript
import { usePageTour } from '@/hooks/usePageTour';

export default function MyNewPage() {
  usePageTour(); // Add this line
  
  // ... rest of your component
}
```

### Step 3: Add data-tour Attributes

Add `data-tour` attributes to elements you want to highlight:

```tsx
<div data-tour="important-element">
  {/* Your content */}
</div>
```

## Available Tours

- **Dashboard** (`/dashboard`) - Overview of dashboard features
- **Tasks** (`/tasks`) - Kanban board and task management
- **Projects** (`/project-listing`) - Project management
- **Work Reports** (`/my-reports`, `/all-reports`, `/add-report`) - Time tracking
- **Attendance** (`/attendance`) - Clock in/out and attendance tracking
- **Leave Management** (`/leave-management`) - Leave requests and balance
- **Users** (`/users`) - User management
- **Settings** (`/settings`) - Organization settings
- **Organization** (`/organization`) - Org chart and documents

## Tour Selectors

Tours use CSS selectors to target elements. Common patterns:

- `[data-tour="element-name"]` - Recommended: Add data-tour attribute
- `body` - Full page overlay (for welcome messages)
- `.class-name` - CSS class selector
- `#element-id` - ID selector

## Resetting Tours (For Testing)

To reset a tour and see it again:

```typescript
import { resetTour } from '@/contextapi/TourContext';

// Reset specific tour
resetTour('dashboard');

// Or manually in browser console:
localStorage.removeItem('tour_completed_dashboard');
```

## Customizing Tour Appearance

Edit `tourStyles` in `src/contextapi/TourContext.tsx`:

```typescript
const tourStyles: Styles = {
  options: {
    primaryColor: '#ff9800', // Change primary color
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 8,
  },
  // ... more styles
};
```

## Manual Tour Triggering

If you need to manually trigger a tour:

```typescript
import { useTour } from '@/contextapi/TourContext';
import { dashboardTour } from '@/utils/tours/tourConfigs';

function MyComponent() {
  const { runTour } = useTour();
  
  const handleShowTour = () => {
    runTour('dashboard', dashboardTour);
  };
  
  return <button onClick={handleShowTour}>Show Tour</button>;
}
```

## Best Practices

1. **Keep tours short** - 3-5 steps maximum
2. **Focus on key features** - Don't overwhelm users
3. **Use clear language** - Explain what, not just how
4. **Test selectors** - Ensure data-tour attributes are unique
5. **Mobile responsive** - Test tours on mobile devices

## Troubleshooting

### Tour not showing?
- Check if tour was already completed: `localStorage.getItem('tour_completed_<route>')`
- Verify `usePageTour()` is called in component
- Check browser console for errors
- Ensure TourProvider wraps your layout

### Tour targeting wrong element?
- Verify `data-tour` attribute is correctly spelled
- Check element is rendered when tour starts (may need delay)
- Use browser DevTools to inspect element

### Tour styles not applying?
- Check if TourProvider is in component tree
- Verify tourStyles in TourContext
- Check for CSS conflicts

## Future Enhancements

- Backend integration to sync tour completion across devices
- Admin panel to reset tours for users
- Analytics to track tour completion rates
- A/B testing different tour flows


