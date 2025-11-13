// utils/exportUsersToDocx.ts
import { Report } from '@/app/(DashboardLayout)/my-reports/page';
import { Project } from '@/app/(DashboardLayout)/project-listing/page';
import { Role } from '@/app/(DashboardLayout)/system-roles/page';
import { Tenant } from '@/app/(DashboardLayout)/tenant-settings/page';
import { TaskReport } from '@/app/(DashboardLayout)/users/[id]/page';
import { User } from '@/app/(DashboardLayout)/users/page';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType , HeadingLevel, ImageRun} from 'docx';
import { saveAs } from 'file-saver';

import * as fs from 'fs'; 
export type SingleUser = {
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    designation: string;
    department: string;
    joiningDate: string;
    employeeCode: string;
    role: string | null;
    role_id?: string;
    tenant_id?: string;
    profile_image: string;
    emergency_contact: string;
    blood_group: string;
    gender: string;
    dob: string;
    reporting_manager?: string;
};

type SingleUserProject = {
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_delete: boolean;
    id: string;
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

const UsertableHeaders = [
  'Name',
  'Email',
  'Phone',
  'Department',
  'Designation',
  'Joining Date',
  'Employee Code',
  'Role',
  'Status',
];

export const exportUsersToDocx = async (users: User[], fileName = 'Employees_Details') => {
  const rows: TableRow[] = [];

  // Header Row
  rows.push(
    new TableRow({
      children: UsertableHeaders.map(
        (header) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: 'ffffff',
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: {
              fill: '4472C4', // Blue
            },
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
      ),
    })
  );

  // User Rows
  users.forEach((user) => {
    rows.push(
      new TableRow({
        children: [
          cell(`${user.first_name} ${user.last_name}`),
          cell(user.email),
          cell(user.phone ?? '-'),
          cell(user.department ?? '-'),
          cell(user.designation ?? '-'),
          cell(user.joiningDate ?? '-'),
          cell(user.employeeCode ?? '-'),
          cell(user.role?.name ?? '-'),
          cell(user.is_active ? 'Active' : 'Inactive'),
        ],
      })
    );
  });

  const table = new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Employee Report',
                bold: true,
                size: 32,
                font: 'Arial',
              }),
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER,
          }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

// Helper function to create table cells
const cell = (text: string) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: 'Arial',
            size: 22,
          }),
        ],
      }),
    ],
  });
export const exportTenantsToDocx = async (tenants: Tenant[], fileName = 'Tenants_List') => {
  const tableRows: TableRow[] = [];

  // Header
  const headers = [
    'ID', 'Name', 'Subdomain', 'Address', 'Website', 'Status', 'Active',
    'Admin Name', 'Admin Email', 'Tenant Email', 'Tenant Phone',
  ];

  tableRows.push(new TableRow({
    children: headers.map((header) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: header, bold: true }),
            ],
          }),
        ],
        width: { size: 20, type: WidthType.PERCENTAGE },
      })
    ),
  }));

  // Rows
  tenants.forEach((tenant) => {
    tableRows.push(new TableRow({
      children: [
        tenant.id,
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
      ].map((text) =>
        new TableCell({
          children: [new Paragraph(String(text))],
          width: { size: 20, type: WidthType.PERCENTAGE },
        })
      ),
    }));
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Tenant List',
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 300 },
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

const tableCell = (text: string, bold = false) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
        spacing: { after: 100 },
      }),
    ],
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
  });
  
export const exportProjectsToDocx = async (projects: Project[], fileName = 'Projects_List') => {
  const tableRows: TableRow[] = [];

  // Header row
  const headers = [
    'ID', 'Title', 'Start Date', 'End Date', 'Status', 'Description',
    'Current Phase', 'Is Active', 'Is Deleted', 'Created At', 'Updated At',
    'Clients', 'Timeline',
  ];

  tableRows.push(
    new TableRow({
      children: headers.map((header) => tableCell(header, true)),
    })
  );

  // Data rows
  projects.forEach((project) => {
    const clientSummary = project.client_details
      .map((c) => `${c.name} (${c.email})`)
      .join('; ') || '-';

    const timelineSummary = project.project_timeline
      .map((t) => `${t.time}: ${t.title}`)
      .join('; ') || '-';

    const cells = [
      project.id,
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
      clientSummary,
      timelineSummary,
    ].map((text) => tableCell(String(text)));

    tableRows.push(new TableRow({ children: cells }));
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Project Report',
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

export const exportRolesToDocx = async (
  roles: Role[],
  fileName = 'System_Roles_Report'
): Promise<void> => {
  const rows: TableRow[] = [];

  // Header row with columns for modules and permissions
  const headers = ['Module', 'Read', 'Create', 'Update', 'Delete'];
  rows.push(
    new TableRow({
      children: headers.map(
        (header) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: 'ffffff',
                    font: 'Arial',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            shading: { fill: '4472C4' },
            width: { size: 20, type: WidthType.PERCENTAGE },
          })
      ),
    })
  );

  // Add role & module data rows
  roles.forEach((role) => {
    // Role name row spanning all columns
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
             new Paragraph({
  children: [
    new TextRun({
      text: `Role: ${role.name}`,
      bold: true,
      font: 'Arial',
      size: 28,
    }),
  ],
})
            ],
            columnSpan: 5,
            shading: { fill: 'D9E1F2' },
          }),
        ],
      })
    );

    // Modules rows with permission emojis
    role.modules.forEach((module) => {
      rows.push(
        new TableRow({
          children: [
            createCell(module.name),
            createPermissionCell(module.permissions.read),
            createPermissionCell(module.permissions.create),
            createPermissionCell(module.permissions.update),
            createPermissionCell(module.permissions.delete),
          ],
        })
      );
    });
  });

  const table = new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
  top: { style: 'single', size: 1, color: 'CCCCCC' },
  bottom: { style: 'single', size: 1, color: 'CCCCCC' },
  left: { style: 'single', size: 1, color: 'CCCCCC' },
  right: { style: 'single', size: 1, color: 'CCCCCC' },
  insideHorizontal: { style: 'single', size: 1, color: 'CCCCCC' },
  insideVertical: { style: 'single', size: 1, color: 'CCCCCC' },
},

  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'System Roles & Permissions Report',
                bold: true,
                size: 32,
                font: 'Arial',
              }),
            ],
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER,
          }),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

// Helper to create simple text cell
const createCell = (text: string): TableCell =>
  new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, font: 'Arial', size: 22 })],
      }),
    ],
  });

// Helper to create permission cell with emoji and colored text
const createPermissionCell = (allowed: boolean): TableCell =>
  new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: allowed ? '✅' : '❌',
            font: 'Arial',
            size: 22,
            color: allowed ? '008000' : 'FF0000',
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });


  
export const exportReportsToDocx = async (
  reports: Report[],
  fileName = 'Reports'
) => {
  const doc = new Document({
    sections: [
      {
        children: reports.flatMap((report, index) => {
          // Header for each report
          const reportHeader = new Paragraph({
  children: [
    new TextRun({
      bold: true,   // <-- Apply bold here
    }),
  ],
})

          // Basic info paragraphs
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  const [hh, mm] = timeStr.split(':');
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
};

const officeInOut = new Paragraph({
  children: [
    new TextRun({
      text: "Name: ",
      bold: true,
      shading: {
        // fill: "D9EAD3", // Light green
        type: "clear",
        color: "auto",
      }, break: 1,
    }),
    new TextRun({
      text:`${report.user.first_name} `,
      shading: {
        fill: "FFF2CC", // Light yellow
        type: "clear",
        color: "auto",
      },

    }),
    new TextRun({
      text: `${report.user.last_name} `,
      shading: {
        fill: "FFF2CC", // Light yellow
        type: "clear",
        color: "auto",
      },

    }),
    new TextRun({
      text: "Office In: ",
      bold: true,
      shading: {
        // fill: "D9EAD3", // Light green
        type: "clear",
        color: "auto",
      },break: 1,
    }),
    new TextRun({
      text: formatTime(report.officein),
      shading: {
        fill: "FFF2CC", // Light yellow
        type: "clear",
        color: "auto",
      },
      
    }),

    new TextRun({
      text: "Office Out: ",
      bold: true,
      shading: {
        // fill: "D9EAD3",
        type: "clear",
        color: "auto",
      }, break: 1,
    }),
    new TextRun({
      text: formatTime(report.officeout),
      shading: {
        fill: "FFF2CC",
        type: "clear",
        color: "auto",
      },
    }),

    new TextRun({
      text: "Leave: ",
      bold: true,
      shading: {
        // fill: "D9EAD3",
        type: "clear",
        color: "auto",
      },break: 1,
    }),
    new TextRun({
      text: report.leave ? "Yes" : "No",
      shading: {
        fill: report.leave ? "FFF2CC" : "D0E0E3", // Red or Blue
        type: "clear",
        color: "auto",
      },
    }),
  ],
  spacing: { after: 200 },
  alignment: AlignmentType.LEFT,
});

          // Create a table for taskReports
          const taskReportsTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header row
              new TableRow({
                children: [
                  'Project', 'Task Name', 'Description', 'Status', 'ETA', 'Time Taken', 'Start Time', 'End Time', 'Remarks'
                ].map(
                  (header) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: header,
                              bold: true,
                            }),
                          ],
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: {
                        fill: 'BFBFBF', // Light gray background for header
                      },
                    })
                ),
              }),

              // Data rows
              ...report.taskReports.map(
                (task) =>
                  new TableRow({
                    children: [
                      task.project?.title ?? '-',
                      task.task_name,
                      task.description,
                      task.status,
                      task.eta,
                      task.time_taken,
                      task.start_time,
                      task.end_time,
                      task.remarks,
                    ].map(
                      (text) =>
                        new TableCell({
                          children: [new Paragraph(String(text))],
                        })
                    ),
                  })
              ),
            ],
          });

          return [reportHeader, officeInOut, taskReportsTable, new Paragraph('')]; // blank paragraph as spacer
        }),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

const createTable = (data: Record<string, string | number | null>) => {
  const rows = Object.entries(data).map(([key, value]) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: 'single', size: 1, color: 'cccccc' },
            bottom: { style: 'single', size: 1, color: 'cccccc' },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: key, bold: true })],
              spacing: { after: 100 },
            }),
          ],
        }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: 'single', size: 1, color: 'cccccc' },
            bottom: { style: 'single', size: 1, color: 'cccccc' },
          },
          children: [
            new Paragraph({
              children: [new TextRun(String(value ?? '-'))],
              spacing: { after: 100 },
            }),
          ],
        }),
      ],
    })
  );

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};



export const exportUserDoc = async (
  user: SingleUser,
  projects: SingleUserProject[],
  taskReports: TaskReport[],
  fileName = 'User_Report'
) => {
  const sections: any[] = [];

  sections.push(
    new Paragraph({
      text: 'User Profile',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    })
  );

  const userInfoTable = createTable({
    'Full Name': `${user.first_name} ${user.last_name}`,
    Email: user.email,
    Phone: user.phone,
    Address: user.address,
    Designation: user.designation,
    Department: user.department,
    JoiningDate: user.joiningDate,
    EmployeeCode: user.employeeCode,
    Role: user.role ?? '-',
    emergency_contact: user.emergency_contact,
    BloodGroup: user.blood_group,
    Gender: user.gender,
    DOB: user.dob,
    ReportingManager: user.reporting_manager ?? '-',
    CreatedAt: user.created_at,
    UpdatedAt: user.updated_at,
  });
  sections.push(userInfoTable);

  // === PROJECTS SECTION ===
  if (projects.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Projects',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    projects.forEach((project, index) => {
      sections.push(
        new Paragraph({
          text: `Project ${index + 1}: ${project.title}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );

      const projectTable = createTable({
        'Start Date': project.start_date,
        'End Date': project.end_date,
        Status: project.status,
        Description: project.description,
        'Current Phase': project.current_phase,
        'Client Details': project.client_details.map(cd => `${cd.name} (${cd.email})`).join(', '),
        Timeline: project.project_timeline.map(pt => `${pt.time} - ${pt.title}`).join('; '),
        'Team Members': project.teams.map(tm => `${tm.user.first_name} ${tm.user.last_name} (${tm.user.designation})`).join(', '),
        'Total Time Spent': project.teams.reduce((sum, t) => sum + t.time_spent, 0),
      });

      sections.push(projectTable);
    });
  }

  // === TASK REPORTS SECTION ===
  if (taskReports.length > 0) {
    sections.push(
      new Paragraph({
        text: 'Task Reports',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    taskReports.forEach((task, idx) => {
      sections.push(
        new Paragraph({
          text: `Task ${idx + 1}: ${task.task_name}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );

      const taskTable = createTable({
        Description: task.description,
        Remarks: task.remarks ?? '-',
        Status: task.status,
        'Start Time': task.start_time,
        'End Time': task.end_time,
        ETA: `${task.eta} hrs`,
        'Time Taken': `${task.time_taken} hrs`,
        Project: task.project?.title ?? '-',
        CreatedAt: task.created_at,
        UpdatedAt: task.updated_at,
      });

      sections.push(taskTable);
    });
  }

  // === FINAL DOC CREATION ===
  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

export const generateUserDocx = (
  user: SingleUser,
  projects: SingleUserProject[],
  techStack: string[],
  taskReports: TaskReport[]
) => {
  const createText = (label: string, value: string) =>
    new Paragraph({
      spacing: { after: 150 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, color: "2E74B5" }),
        new TextRun({ text: value || "N/A", color: "444444" }),
      ],
    });

  const createSectionHeading = (text: string) =>
    new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200, before: 300 },
      thematicBreak: true,
    });

  const professionalDetails = [
    createText("Department", user.department),
    createText("Designation", user.designation),
    createText("Employee Code", user.employeeCode),
    createText("Joining Date", user.joiningDate),
    createText("Reporting Manager", user.reporting_manager || "N/A"),
  ];

  const personalDetails = [
    createText("Gender", user.gender),
    createText("Date of Birth", user.dob),
    createText("Blood Group", user.blood_group),
    createText("Emergency Contact", user.emergency_contact),
  ];

  const contactDetails = [
    createText("Email", user.email),
    createText("Phone", user.phone),
    createText("Address", user.address),
  ];

  const techStackParagraphs = techStack.map(
    (tech) =>
      new Paragraph({
        text: `• ${tech}`,
        spacing: { after: 100 },
      })
  );

  const projectParagraphs = projects.map(
    (project) =>
      new Paragraph({
        text: project.title,
        spacing: { after: 100 },
        bullet: { level: 0 },
      })
  );

 const taskReportTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: 'single', size: 1, color: "cccccc" },
    bottom: { style: 'single', size: 1, color: "cccccc" },
    left: { style: 'single', size: 1, color: "cccccc" },
    right: { style: 'single', size: 1, color: "cccccc" },
    insideHorizontal: { style: 'single', size: 1, color: "cccccc" },
    insideVertical: { style: 'single', size: 1, color: "cccccc" },
  },
  rows: [
    // Header Row
    new TableRow({
      children: [
        "Task Name",
        "Project",
        "Start Time",
        "End Time",
        "ETA (hrs)",
        "Time Taken (hrs)",
        "Status",
        "Remarks",
      ].map(
        (header) =>
          new TableCell({
            shading: { fill: "d9eaf7" },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    color: "2E74B5",
                  }),
                ],
              }),
            ],
          })
      ),
    }),

    // Conditional Data Rows
    ...(taskReports.length > 0
      ? taskReports.map((task, index) =>
          new TableRow({
            children: [
              task.task_name,
              task.project.title,
              task.start_time,
              task.end_time,
              task.eta?.toString(),
              task.time_taken?.toString(),
              task.status,
              task.remarks || "N/A",
            ].map((text) =>
              new TableCell({
                shading: index % 2 === 0 ? { fill: "f2f2f2" } : undefined,
                children: [
                  new Paragraph({
                    text,
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 },
                  }),
                ],
              })
            ),
          })
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 8,
                children: [
                  new Paragraph({
                    text: "No task reports available",
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                  }),
                ],
              }),
            ],
          }),
        ]),
  ],
});

  // Final Document
  const doc = new Document({
    sections: [
         {
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: "Employee: ", bold: true, color: "000000" }),
            new TextRun({ text: `${user.first_name} `, bold: true, color: "C00000" }),
            new TextRun({ text: user.last_name, bold: true, color: "C00000" }),
          ],
        }),

          createSectionHeading("Professional Details"),
          ...professionalDetails,

          createSectionHeading("Personal Information"),
          ...personalDetails,

          createSectionHeading("Contact Information"),
          ...contactDetails,

          createSectionHeading("Tech Stack"),
          ...techStackParagraphs,

          createSectionHeading("Projects"),
          ...projectParagraphs,

          createSectionHeading("Task Reports"),
          taskReportTable,
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${user.first_name}_${user.last_name}_Profile.docx`);
  });
};
