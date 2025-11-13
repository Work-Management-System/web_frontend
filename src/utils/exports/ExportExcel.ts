import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { User } from '@/app/(DashboardLayout)/users/page';
import { Tenant } from '@/app/(DashboardLayout)/tenant-settings/page';
import { Project } from '@/app/(DashboardLayout)/project-listing/page';
import ExcelJS from 'exceljs';
import { Role } from '@/app/(DashboardLayout)/system-roles/page';
import { Report } from '@/app/(DashboardLayout)/my-reports/page';
import { TaskReport } from '@/app/(DashboardLayout)/users/[id]/page';
  const columnColors = [
    'FFFDEBD0', 'FFFADBD8', 'FFD6EAF8', 'FFD5F5E3', 'FFF9E79F', 'FFE8DAEF',
    'FFAED6F1', 'FFF5CBA7', 'FFABEBC6', 'FFEDBB99', 'FFBB8FCE', 'FFA3E4D7',
    'FFB2BABB', 'FFF7DC6F', 'FF82E0AA', 'FFF1948A',
  ];
  type UserProject = {
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
    // id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    description: string;
    current_phase: string;
    client_details: { name: string; email: string; contact: string }[];
    project_timeline: { time: string; title: string }[];
    teams: {
        created_at: string;
        updated_at: string;
        is_active: boolean;
        is_delete: boolean;
        id: string;
        status: string;
        time_spent: number;
        user: {
            first_name: string;
            last_name: string;
            email: string;
            designation: string;
        };
    }[];
};
type SingleUser = {
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
    // id: string;
    first_name: string;
    last_name: string;
    email: string;
    // password: string;
    phone: string;
    address: string;
    designation: string;
    department: string;
    joiningDate: string;
    employeeCode: string;
    role: string | null;
    role_id?: string;
    tenant_id?: string;
    // profile_image: string;
    emergency_contact: string;
    bloodGroup: string;
    gender: string;
    dob: string;
    reporting_manager?: string;
};
export const exportUsersToExcel = async (users: User[], fileName = 'Stylish_Employees_Report') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Employees');

  const headers = [
    'Name',
    'Email',
    'Phone',
    'Address',
    'Designation',
    'Department',
    'Joining Date',
    'Employee Code',
    'Role',
    'Emergency Contact',
    'Blood Group',
    'Gender',
    'Date of Birth',
    'Reporting Manager',
    'Status',
  ];

  // Add header row
  worksheet.addRow(headers);

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  headerRow.height = 30;

  // Add user rows with per-column background color
  users.forEach((user) => {
    const row = worksheet.addRow([
      `${user.first_name} ${user.last_name}`,
      user.email,
      user.phone ?? '-',
      user.address ?? '-',
      user.designation ?? '-',
      user.department ?? '-',
      user.joiningDate ?? '-',
      user.employeeCode ?? '-',
      user.role?.name ?? '-',
      user.emergency_contact ?? '-',
      user.blood_group ?? '-',
      user.gender ?? '-',
      user.dob ?? '-',
      user.reporting_manager ?? '-',
      user.is_active ? 'Active' : 'Inactive',
    ]);

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnColors[colNumber - 1] },
      };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
  });

  // Auto column width
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() || '';
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = maxLength;
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportTenantsToExcel = async (
  tenants: Tenant[],
  fileName = 'Tenants_Report'
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tenants');

  const headers = [
    'Name',
    'Subdomain',
    'Address',
    'Website',
    'Status',
    'Active',
    'Admin Name',
    'Admin Email',
    'Tenant Email',
    'Tenant Phone',
  ];

  // Add and style header row
  worksheet.addRow(headers);
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  });
  headerRow.height = 30;

  // Add tenant data rows
  tenants.forEach((tenant) => {
    const row = worksheet.addRow([
      tenant.tenant_name,
      tenant.subdomain,
      tenant.address ?? '-',
      tenant.website_url ?? '-',
      tenant.status,
      tenant.is_active ? 'Yes' : 'No',
      `${tenant.administrator_user.first_name} ${tenant.administrator_user.last_name}`,
      tenant.administrator_user.email,
      tenant.tenant_email ?? '-',
      tenant.tenant_phone ?? '-',
    ]);

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnColors[colNumber - 1] },
      };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
  });

  // Auto column width
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() || '';
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = maxLength;
  });

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportProjectsToExcel = async (
  projects: Project[],
  fileName = 'Projects_Report'
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Projects');

  const headers = [
    'Title', 'Start Date', 'End Date', 'Status', 'Description',
    'Current Phase', 'Is Active', 'Is Deleted', 'Created At', 'Updated At',
    'Client Details', 'Project Timeline',
  ];

  // Add and style header row
  worksheet.addRow(headers);
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
  });
  headerRow.height = 30;

  // Add project data rows
  projects.forEach((project) => {
    const clientDetails = project.client_details && project.client_details.length > 0
      ? project.client_details
          .map((c) => `${c.name} (${c.email ?? '-'})`)
          .join('; ')
      : '-';

    const timeline = project.project_timeline && project.project_timeline.length > 0
      ? project.project_timeline
          .map((t) => `${t.time}: ${t.title}`)
          .join('; ')
      : '-';

    const row = worksheet.addRow([
      project.title ?? '-',
      project.start_date ?? '-',
      project.end_date ?? '-',
      project.status ?? '-',
      project.description ?? '-',
      project.current_phase ?? '-',
      project.is_active ? 'Yes' : 'No',
      project.is_delete ? 'Yes' : 'No',
      project.created_at ?? '-',
      project.updated_at ?? '-',
      clientDetails,
      timeline,
    ]);

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnColors[colNumber - 1] || 'FFFFFFFF' },
      };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
  });

  // Auto column width
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() || '';
      maxLength = Math.max(maxLength, value.length + 2);
    });
    column.width = maxLength;
  });

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportRolesToExcel = async (roles: Role[], fileName = 'Roles_Report') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Roles');

  if (roles.length === 0) {
    worksheet.addRow(['No roles data available']);
  } else {
    // Identify all modules from all roles
    const allModulesMap = new Map<string, string>();
    roles.forEach(role => {
      role.modules.forEach(mod => {
        if (!allModulesMap.has(mod.key)) {
          allModulesMap.set(mod.key, mod.name);
        }
      });
    });

    const modules = Array.from(allModulesMap.entries()).map(([key, name]) => ({ key, name }));
    const permissionTypes = ['Read', 'Create', 'Update', 'Delete'];

    // Build header rows
    const baseHeaders = ['Id', 'Name', 'Description', 'Tag', 'Active', 'Protected', 'Visible'];
    const modulePermissionHeaders = modules.flatMap(() => permissionTypes);

    const headerRow1 = [...baseHeaders, ...modules.flatMap(m => Array(4).fill(m.name))];
    const headerRow2 = [...Array(baseHeaders.length).fill(''), ...modules.flatMap(() => permissionTypes)];

    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);

    // Merge module headers (row 1)
    let colIndex = baseHeaders.length + 1;
    modules.forEach(() => {
      worksheet.mergeCells(1, colIndex, 1, colIndex + 3); // Merge 4 columns
      colIndex += 4;
    });

    // Style headers
    [1, 2].forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.eachCell((cell) => {
       cell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F4E78' }, // Navy blue
};
cell.font = {
  color: { argb: 'FFFFFFFF' }, // White font
  bold: true,
};
cell.border = {
    right: { style: 'medium', color: { argb: 'FFBFBFBF' } },

};

      });
      row.height = 25;
    });

    // Freeze top two rows
    worksheet.views = [{ state: 'frozen', ySplit: 2 }];

    // Add data rows
    roles.forEach(role => {
      const baseData = [
        role.id,
        role.name,
        role.description ?? '-',
        role.tag ?? '-',
        role.is_active ? 'Yes' : 'No',
        role.is_protected ? 'Yes' : 'No',
        role.is_visible ? 'Yes' : 'No',
      ];

      const permissionsData = modules.flatMap(({ key }) => {
        const module = role.modules.find(m => m.key === key);
        return module
          ? [
              module.permissions.read ? 'Yes' : 'No',
              module.permissions.create ? 'Yes' : 'No',
              module.permissions.update ? 'Yes' : 'No',
              module.permissions.delete ? 'Yes' : 'No',
            ]
          : ['No', 'No', 'No', 'No'];
      });

      const row = worksheet.addRow([...baseData, ...permissionsData]);
      
      row.eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
    });

    // Auto column width
    worksheet.columns.forEach((column) => {
      let maxLength = 12;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, value.length + 2);
      });
      column.width = maxLength;
    });
  }

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};

// ============================================EXPORT USER REPORT TO EXCEL=============================================

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');
};

const formatTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const exportReportsToExcel = async (
  reports: Report[],
  fileName = 'Reports_Report'
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reports');

  // Main headers for Reports
  const mainHeaders = ['Name','Created At', 'Office In', 'Office Out', 'Leave'];

  // Headers for task reports
  const taskHeaders = [
    'Project Title',
    'Task Name',
    'Description',
    'Status',
    'ETA',
    'Time Taken',
    'Start Time',
    'End Time',
    'Remarks',
  ];

  let currentRow = 1;

  // Add a bold title
  worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'Reports Export';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };
  currentRow += 2;

  for (const report of reports) {
    // Add main report header row
    worksheet.getRow(currentRow).values = [
      ...mainHeaders,
      ...taskHeaders.map(() => ''), // empty cells to align spacing
    ];

    const headerRow = worksheet.getRow(currentRow);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    headerRow.eachCell((cell) => {
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });
    currentRow++;

    // Add report summary data row with formatted date/time
    worksheet.getRow(currentRow).values = [
      report.user ? `${report.user.first_name} ${report.user.last_name}` : '',
      formatDateTime(report.created_at),
      formatDateTime(report.officein),
      formatDateTime(report.officeout),
      report.leave ? 'Yes' : 'No',
    ];
    worksheet.getRow(currentRow).eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    currentRow++;

    // Add task report headers
    worksheet.getRow(currentRow).values = ['', '', '', '', ...taskHeaders];
    const taskHeaderRow = worksheet.getRow(currentRow);
    taskHeaderRow.font = { bold: true };
    taskHeaderRow.alignment = { horizontal: 'center' };
    taskHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    taskHeaderRow.eachCell((cell) => {
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });
    currentRow++;

    // Add all task report rows with formatted start/end time
    for (const task of report.taskReports) {
      worksheet.getRow(currentRow).values = [
        '', '', '', '', // empty cells for alignment
        task.project?.title ?? '-',
        task.task_name,
        task.description,
        task.status,
        task.eta,
        task.time_taken,
        formatTime(task.start_time),
        formatTime(task.end_time),
        task.remarks,
      ];
      worksheet.getRow(currentRow).eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
      currentRow++;
    }

    // Add an empty row for spacing
    currentRow++;
  }

  // Auto-width for all columns
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, value.length + 5);
    });
    column.width = maxLength;
  });

  // Generate file buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};
// ============================================EXPORT USER REPORT TO EXCEL=============================================
export const exportUserReportToExcel = async (
  user: SingleUser,
  projects: UserProject[],
  taskReports: TaskReport[],
  fileName = 'User_Report'
) => {
  const workbook = new ExcelJS.Workbook();

  /** ---------------- UTIL COLORS ---------------- */
  const columnColors = [
    'FFB6D7A8', 'FFFFD966', 'FFA2C4C9', 'FFF9CB9C', 'FFD5A6BD',
    'FFF6B26B', 'FF76A5AF', 'FFEAD1DC', 'FFB4A7D6', 'FFDD7E6B',
    'FFC27BA0', 'FF93C47D', 'FF9FC5E8', 'FFFFE599', 'FFD9EAD3',
    'FFF4CCCC', 'FF6FA8DC', 'FFFFC9C9', 'FFE6B8AF', 'FFCCCCCC'
  ];

  /** ---------------- USER SHEET ---------------- */
  const userSheet = workbook.addWorksheet('User Details');
  const userFields: (keyof SingleUser)[] = [
    'first_name', 'last_name', 'email', 'phone', 'address',
    'designation', 'department', 'joiningDate', 'employeeCode',
    'role','emergency_contact', 'bloodGroup',
    'gender', 'dob', 'reporting_manager', 'created_at', 'updated_at',
    'is_active', 'is_delete'
  ];

  userSheet.addRow(['Field', 'Value']);
  const headerRow = userSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;

  userFields.forEach((key, i) => {
    const value = user[key] ?? '-';
    const row = userSheet.addRow([key, value]);
    row.eachCell((cell, col) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnColors[col - 1] || 'FFFFFFFF' },
      };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
  });

  userSheet.columns.forEach((col) => (col.width = 30));


  /** ---------------- PROJECTS SHEET ---------------- */
  const projectSheet = workbook.addWorksheet('Projects');
  const projectHeaders = [
    'Title', 'Start Date', 'End Date', 'Status', 'Description',
    'Current Phase', 'Is Active', 'Is Deleted', 'Created At', 'Updated At',
    'Client Details', 'Project Timeline', 'Team Members', 'Time Spent Total'
  ];

  projectSheet.addRow(projectHeaders);
  const projHeaderRow = projectSheet.getRow(1);
  projHeaderRow.eachCell((cell, i) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: columnColors[i % columnColors.length] },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  projHeaderRow.height = 25;

  projects.forEach((project) => {
    const clientDetails = project.client_details?.map(c => `${c.name} (${c.email})`).join('; ') || '-';
    const timeline = project.project_timeline?.map(t => `${t.time}: ${t.title}`).join('; ') || '-';
    const teamMembers = project.teams?.map(t => `${t.user.first_name} ${t.user.last_name} (${t.user.designation})`).join('; ') || '-';
    const totalTimeSpent = project.teams?.reduce((sum, t) => sum + t.time_spent, 0) || 0;

    const row = projectSheet.addRow([
      project.title,
      project.start_date,
      project.end_date,
      project.status,
      project.description,
      project.current_phase,
      project.is_active ? 'Yes' : 'No',
      project.is_delete ? 'Yes' : 'No',
      project.created_at,
      project.updated_at,
      clientDetails,
      timeline,
      teamMembers,
      totalTimeSpent,
    ]);

    row.eachCell((cell, i) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnColors[i % columnColors.length] },
      };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
  });

  projectSheet.columns.forEach((column) => {
    let maxLength = 20;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? '';
      maxLength = Math.max(maxLength, value.length + 5);
    });
    column.width = maxLength;
  });


  /** ---------------- TASK REPORT SHEET ---------------- */
  const taskSheet = workbook.addWorksheet('Task Reports');
  const taskHeaders = [
    'Task Name', 'Description', 'Remarks', 'Status',
    'Start Time', 'End Time', 'ETA (hrs)', 'Time Taken (hrs)',
    'Project Title', 'Created At', 'Updated At',
  ];
  taskSheet.addRow(taskHeaders);
  const taskHeaderRow = taskSheet.getRow(1);
  taskHeaderRow.eachCell((cell, i) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: columnColors[i % columnColors.length] },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  taskHeaderRow.height = 25;

  taskReports.forEach((task) => {
    const row = taskSheet.addRow([
      task.task_name,
      task.description,
      task.remarks ?? '-',
      task.status,
      task.start_time,
      task.end_time,
      task.eta,
      task.time_taken,
      task.project?.title ?? '-',
      task.created_at,
      task.updated_at,
    ]);

    row.eachCell((cell, i) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnColors[i % columnColors.length] },
      };
      cell.alignment = { wrapText: true, vertical: 'middle' };
    });
  });

  taskSheet.columns.forEach((column) => {
    let maxLength = 15;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? '';
      maxLength = Math.max(maxLength, value.length + 5);
    });
    column.width = maxLength;
  });


  /** ---------------- EXPORT FILE ---------------- */
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${fileName}.xlsx`);
};