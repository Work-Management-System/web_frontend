# Landing page screenshots

Drop portal screenshots here to use them on the landing page. The app currently uses images from `../backgrounds/`, `../kanbanColumn/`, and `../notification/`. For a stronger impact, add your own:

- **dashboard.png** – Main dashboard / welcome screen
- **tasks.png** – Kanban or task list view
- **reports.png** – Reports or analytics screen
- **attendance.png** – Attendance or time tracking screen
- **leave.png** – Leave management screen
- **projects.png** – Project listing or project detail

Suggested size: ~1200×800px (or similar 3:2 ratio). After adding files, update the image paths in `src/app/components/LandingPage.tsx` (e.g. `featureTabsContent`, `onboardingSteps`, `benefits`, hero section) to use `/images/landing/dashboard.png`, etc.
