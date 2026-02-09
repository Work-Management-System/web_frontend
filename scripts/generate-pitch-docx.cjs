const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const fs = require("fs");
const path = require("path");

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function body(text, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, bold })],
    spacing: { after: 180 },
  });
}

function space() {
  return new Paragraph({ spacing: { after: 120 } });
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        heading1("Manazeit"),
        body("All-in-one work management for your team."),
        space(),
        heading2("What we provide"),
        body(
          "Manazeit is a single platform that brings projects, tasks, time tracking, attendance, leave, and team communication into one place. Your team gets one source of truth: no more switching between tools, no lost updates, and no scattered spreadsheets. You see who is doing what, who is in today, and how work is progressing—in real time.",
        ),
        body(
          "We built it for teams and organizations that want clarity without complexity. You get a clear view of workload and progress, digital attendance and leave that are ready for payroll, and daily work reports that can be exported to Excel for clients or internal use. Roles and permissions are built in so you control who sees and edits what.",
        ),
        space(),
        heading2("Why one platform wins"),
        body(
          "One platform means your people log in once and do everything there: check their tasks, clock in, submit a leave request, log their daily work, and message teammates. Managers and HR get visibility without chasing people across apps. Everything is in one place, so reporting and accountability become straightforward.",
        ),
        space(),
        heading2("A day with Manazeit"),
        body(
          "Imagine a typical Tuesday at a 25-person design agency. By 9:15 everyone has clocked in; the dashboard shows who is in and who is on leave. The project manager opens the task board, moves three deliverables to In progress, and assigns the next batch. By noon two leave requests land in the system; the manager approves one and adds a short note to the other—all from the same screen. In the afternoon, the team uses project chat to align on a client revision instead of digging through email. At 5, team members submit their daily work reports: project, task, time spent, and status. The manager reviews, adds remarks where needed, and exports the client report to Excel with one click for billing. No spreadsheets, no email chains, no “what did you do today?”—just one platform from clock-in to delivery.",
        ),
        body(
          "That is the experience we deliver: one place for your team to plan, track, and report work, so you can focus on outcomes instead of tooling.",
        ),
        space(),
        heading2("Interactive client journey"),
        body(
          "This section walks through how someone actually uses and interacts with Manazeit from first contact to daily use. The journey is the same for everyone; what you see depends on your role (employee, manager, or admin).",
        ),
        body(
          "First contact. You land on the Manazeit site: a clear homepage with the value proposition, feature highlights, and how it works. You click Log in or Try for free. If your organization already uses Manazeit, you enter your credentials (and subdomain if applicable) and sign in. If you are new, you register: set up your organization and create the first admin account. Once in, you may be asked to set or reset your password; then you are in the app.",
        ),
        body(
          "First look. After login you see the main layout: a sidebar with menu items (Dashboard, Add Work Report, Daily Work Reports, Reports, Tasks, Attendance, Leave, Users, Organization, Project Listing, Chat, and role-dependent items such as Settings and System Roles). You click Dashboard. The dashboard loads: a welcome message, date range if relevant, and cards or charts showing what matters for your role—e.g. your task count, leave balance, attendance status, or (for managers) team and project stats, missed reports, ticket breakdown. You get your bearings in one screen.",
        ),
        body(
          "Morning: clock in and plan. You open Attendance. Your current status is shown (e.g. not clocked in). You click Clock in; the system records the time and updates the screen to “Working.” You can start or end break and start or end lunch during the day; each action is one click and the status updates immediately. Next you open Tasks. The Kanban board shows your (or your team’s) tasks in columns: To Do, In Progress, On Hold, Testable, Completed, Reopened. You drag a task from To Do to In Progress. You open a task to see or edit details, add a subtask, or check history. If you need time off, you open Leave, see your balance by type, click to apply, choose dates and type (full-day, half-day, or short leave), add a reason, and submit. The request appears in your history and goes to your reviewer.",
        ),
        body(
          "Through the day: work and collaborate. You work from the same app. You open a project from Project Listing, then the Documents tab: you create a document from a template (e.g. Meeting Notes or Technical Spec) or open an existing one. You edit in the rich-text editor; if someone else has the doc open, you see their cursor and presence (real-time collaboration). You can lock the doc or adjust who can view or edit via Permissions. You open Version history to see past saves or restore one. In the same project you upload or download files from the Files tab. For quick coordination you open Chat: you pick a DM or a space, send messages, attach files, reply in a thread, or add a reaction. You see who is online. Everything stays in context—project, tasks, and conversation in one place.",
        ),
        body(
          "End of day: report and clock out. You open Add Work Report. You choose the report date, set office in and office out times, and add one or more task rows: project, task name, description, status, time taken, start and end time, remarks. You submit. The report is saved and appears under My Reports; your manager can see it under All Reports (filtered by date or user). You go back to Attendance and click Clock out. The system records the time; your day is closed with an accurate timesheet and a clear work log.",
        ),
        body(
          "Manager and HR: review and act. If you are a manager, you use the same login and layout. On the dashboard you see team and project metrics, missed reports, and ticket summaries. In All Reports you switch to view by user or by project, set a date range, filter, and review work logs; you add remarks where needed and export to Excel (summary plus work log and ticket sheets) for billing or payroll. In Leave you see pending requests, open one, add a reviewer note, and approve or reject. In Attendance you see who is in, on break, or on leave via the dashboard or the attendance views. In Tasks you filter by team or project, move cards, or assign work. You never leave the platform to get the full picture.",
        ),
        body(
          "Admin: configure once. If you are an admin, you use Settings to add or edit departments and designations and to toggle functionality. In System Roles you create or edit roles and set per-module permissions (create, read, update, delete) so each role sees only what they need. Users and Organization give you the directory, profiles, and org tree; you upload or manage employee and payroll documents in one place. The rest of the journey is the same as above—you also clock in, do tasks, submit reports, and use chat—but you have the extra screens that keep the organization structured and secure.",
        ),
        body(
          "End to end, the client journey is: land on the product, sign in (or register), open the dashboard, then use the sidebar to move between attendance, tasks, leave, reports, projects (and their documents and files), and chat. Every action is a click or a short form; the system responds immediately and keeps data in one place. There are no separate tools to open, no spreadsheets to maintain by hand, and no “where did we discuss this?”—because the journey is one continuous flow inside Manazeit.",
        ),
        space(),
        heading2("Dashboard"),
        body(
          "Your central view of the organization. Welcome banner and date-range filters. You see active projects, task progress, who is present, leave balances, and key metrics at a glance. Analytics include project and user stats, ticket counts by status and priority, missed reports count, current attendance status, assigned projects count, team size, your task count, and leave balance. Category cards and project overview with ticket breakdown (pending, in progress, testable, completed, on hold, reopened). Role-based views so managers see team data and admins see org-wide trends. No need to open multiple screens to answer how the team is doing or what is on track.",
        ),
        space(),
        heading2("Tasks"),
        body(
          "Visual Kanban board with six columns: To Do, In Progress, On Hold, Testable, Completed, and Reopened. Drag and drop tasks between columns. Each card shows assignee, due date, and priority (P1–P4). Filter by project, person, department, priority, or search. View modes: My tasks, All tasks, By department, or By team. Full task form: title, description, project, assignee, priority, deadline in days and hours, subtasks, and full change history. Confirm before saving unassigned tasks. Nothing gets lost and workload is easy to balance.",
        ),
        space(),
        heading2("Add Work Report"),
        body(
          "Daily work log in one form. Select report date; set office in and office out times; mark if on leave. Add multiple task rows: pick project, enter task name and description, set status (pending, in progress, completed), ETA, time taken, start and end time, remarks, and who can see the entry. Validation ensures required fields and at least one task. Submit once; the report is stored and appears in My Reports and (for managers) in All Reports.",
        ),
        space(),
        heading2("My Reports"),
        body(
          "Your own report history. Reports listed by date with accordion expand to show task-level detail: project, task name, description, status, time taken, start and end time, remarks. Managers see subordinate reports in a hierarchy and can expand to see nested teams. Export your reports to Excel or Word. Pagination and filters so you can find any past day quickly.",
        ),
        space(),
        heading2("All Reports"),
        body(
          "Manager and admin view of team work. Switch view by user or by project. Set date range and filter by user or project. See filtered work logs and tickets; summary cards show total worked minutes, total tickets, and P1 count. Export to Excel: one file with three sheets—User or Project Summary, Work Log Details (all task rows in range), and Ticket Details. Optional drawer to drill into a single user or project and export that slice to Excel. Full audit trail for billing and payroll.",
        ),
        space(),
        heading2("Attendance and time tracking"),
        body(
          "One-click clock in and clock out. Separate actions for start break, end break, start lunch, and end lunch. Current status always visible: Working, Break, Lunch, or Clocked out. Optional notes and location per record. Calendar view and list view by date; total hours calculated per day. Company-wide lunch settings: default start time and duration, and optional auto-start and auto-end so lunch is applied consistently. Timesheets and monthly views for accurate, auditable attendance. Support for regularization and overtime where configured.",
        ),
        space(),
        heading2("Leave management"),
        body(
          "Leave balance by type (e.g. annual, sick): balance, used, and pending shown on cards. Apply for leave: choose type, date range, full-day or half-day (with first-half or second-half), or short leave with minutes and period (early, middle, late). Submit reason; request goes to reviewer. Approve or reject with optional reviewer note; status and reviewed-at are stored. Leave calendar and request history. Leave types support paid or unpaid, allow half-day, and color coding. Policies per type: accrual frequency (monthly, yearly, or none), allowance per period, carry-forward (on/off and limit), auto-approve, max balance cap, and role-specific allowances. Optional policy file upload. Full audit trail for HR.",
        ),
        space(),
        heading2("Users and profiles"),
        body(
          "User directory with search and filters. Add user: name, email, phone, role, department, designation, joining date, employee code, address, profile image, emergency contact, blood group, gender, date of birth, reporting manager. Toggle active or inactive. Open a detailed profile: personal info, designation, department, list of projects with time spent, and task reports history. Export user list to Excel or Word for HR or planning.",
        ),
        space(),
        heading2("Organization"),
        body(
          "Three tabs in one place. Employee Documents: central repository for employee-related documents. Payroll Documents: payroll-related files and references. Organizational Tree: visual hierarchy of reporting structure. Tree shows name, designation, department, email, employee code, direct reports count; expand and collapse nodes; search; zoom and pan. Clear picture of who reports to whom and where key documents live.",
        ),
        space(),
        heading2("Projects"),
        body(
          "Project list with status, dates, and key info. Add or edit project: title, start and end dates, client details (name, email, contact), timeline milestones, description, current phase. Project detail page: overview, team members with time spent, timeline, client block, Documents tab, and Files tab. Bulk upload projects via Excel using a provided template. Export project list to Excel or Word.",
        ),
        body(
          "Documents: Create a document from templates—Blank, Meeting Notes, Sprint Planning, Technical Spec, Project Brief, or Requirements. Rich-text editor: headings, bold, italic, underline, lists, tables, images (paste or upload), links, code blocks, blockquote, alignment. Real-time collaboration: see who is viewing or editing, live cursors and presence, so multiple people edit the same doc at once. Lock document to restrict editing to users with permission. Version history: list all saved versions with author and time; restore any version with one click. Permissions: set per user whether they can view, comment, or edit; default is team access with optional restrict-to-permitted-only.",
        ),
        body(
          "Files: Upload files to the project; each file shows name, size, uploaded-by, and date. Download or delete. All project-related docs and files stay in one place with clear ownership and history.",
        ),
        space(),
        heading2("Chat and collaboration"),
        body(
          "Spaces sidebar: separate lists for direct messages (DMs) and group or project spaces. Search spaces and DMs. Create new DM or new space. Unread badge per space; last message preview. Chat panel: send messages, attach files, add emoji, reply in thread to keep follow-ups tied to a message. Edit or delete your messages. Add or remove reactions on messages. Search within chat. Mark as read. Contact info panel for the space or person. Presence: see who is online or away. Real-time delivery so the team discusses work in context without leaving the platform.",
        ),
        space(),
        heading2("Settings"),
        body(
          "Single place to configure the organization. Departments: add, edit, delete departments; toggle active. Designations: add, edit, delete job titles or designations. Functionality: toggle features or behaviours on or off. Tenant values: organization-level values or branding text. All in one settings area so admins can shape how the product behaves without developer help.",
        ),
        space(),
        heading2("System roles"),
        body(
          "Create and edit roles with names, descriptions, and tags. Mark role active, protected, or visible. Per-module permissions: for each module (Dashboard, Add Work Report, My Reports, All Reports, Tasks, Attendance, Leave, Users, Profile, Projects, Organization, Settings, Tenant settings, Subscriptions, Chat, Blog, SEO), set create, read, update, and delete. Control who can see and edit what across the entire platform. Export roles list to Excel or Word.",
        ),
        space(),
        heading2("Blog and SEO"),
        body(
          "Blog: Create and edit posts with title, slug, excerpt, content, featured image, meta title, meta description, OG image, and publish date. List all posts with search and pagination. Publish or keep as draft. SEO settings: set default title, description, and keywords for the site; default OG image for social sharing; Twitter handle; site name; canonical base URL. Your content and how you appear in search and when shared stay under your control.",
        ),
        space(),
        heading2("Summary"),
        body(
          "Manazeit gives you one platform for planning, executing, and reporting work. Dashboard with analytics and role-based views; Tasks with Kanban, filters, and full history; Add Work Report and My Reports with task-level detail and export; All Reports with user or project view and multi-sheet Excel export; Attendance with clock in/out, break and lunch, and company lunch settings; Leave with balances, policies, and approval workflow; Users and profiles with export; Organization with employee and payroll docs and org tree; Projects with documents (templates, rich-text, real-time collaboration, version history, permissions) and file uploads, plus bulk upload and export; Chat with DMs, spaces, threads, reactions, and presence; Settings for departments, designations, and functionality; System roles with per-module create/read/update/delete. Your team works in one place; you get visibility and control without the cost and confusion of multiple tools.",
        ),
        body(
          "We would be glad to walk you through a short demo and answer any questions.",
        ),
      ],
    },
  ],
});

async function run() {
  const outPath = path.join(
    __dirname,
    "..",
    "..",
    "Manazeit_Product_Pitch.docx",
  );
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
