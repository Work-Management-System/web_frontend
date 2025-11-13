// 'use client';
// import React, { useEffect, useState, useCallback } from 'react';
// import { Field, FieldArray, useFormik, useFormikContext, FormikProvider, FastField } from 'formik';
// import * as Yup from 'yup';
// import {
//   Button, TextField, MenuItem, Select, FormControl, Typography, Card, CardContent, Box,
//   IconButton, FormHelperText, Checkbox, FormControlLabel, Table, TableBody, TableCell,
//   TableContainer, TableHead, TableRow, Paper, Collapse, Tooltip,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Chip,
//   DialogActions,
//   Autocomplete
// } from '@mui/material';
// import { AddCircleOutline, RemoveCircleOutline, Refresh, Add, Delete, Save, Send } from '@mui/icons-material';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { TimePicker } from '@mui/x-date-pickers/TimePicker';
// import dayjs, { Dayjs } from 'dayjs';
// import toast from 'react-hot-toast';
// import createAxiosInstance from '@/app/axiosInstance';
// import { useAppselector } from '@/redux/store';
// import RequiredLabel from '../layout/shared/logo/RequiredLabel';
// import AddIcon from "@mui/icons-material/Add";
// import { Functionality } from '../settings/FunctionalitySettings';

// type Task = {
//   project_id: string;
//   task_name: string;
//   description: string;
//   eta: Dayjs | null;
//   status: 'pending' | 'in_progress' | 'completed';
//   timeTaken: string;
//   start_time: Dayjs | null;
//   end_time: Dayjs | null;
//   remark: string;
//   visible_to: string[];
// };

// type DailyWorkReportFormValues = {
//   reportDate: Dayjs;
//   officein: Dayjs | null;
//   officeout: Dayjs | null;
//   leave: string;
//   tasks: Task[];
// };
// interface User {
//   id: string;
//   first_name: string;
//   last_name: string;
//   email: string;
// }
// const defaultTask: Task = {
//   project_id: '',
//   task_name: '',
//   description: '',
//   eta: null,
//   status: 'pending',
//   timeTaken: '',
//   start_time: null,
//   end_time: null,
//   remark: '',
//   visible_to: [],
// };

// const validationSchema = Yup.object({
//   officein: Yup.mixed<Dayjs>().required('Required'),
//   officeout: Yup.mixed<Dayjs>().required('Required'),
//   leave: Yup.string(),
//   tasks: Yup.array()
//     .of(
//       Yup.object().shape({
//         project_id: Yup.string().required('Project required'),
//         task_name: Yup.string().required('Task required'),
//         description: Yup.string().required('Description required'),
//         eta: Yup.mixed<Dayjs>().nullable(),
//         status: Yup.string().oneOf(['pending', 'in_progress', 'completed']).required('Status required'),
//         timeTaken: Yup.number()
//           .typeError("Time taken must be a number")
//           .required("Time taken Required")
//           .moreThan(0, "Time taken must be greater than 0"),
//         start_time: Yup.mixed<Dayjs>().required('Start Time Required'),
//         end_time: Yup.mixed<Dayjs>().required('End Time Required'),
//         remark: Yup.string(),
//         visible_to: Yup.array().of(Yup.string()),
//       })
//     )
//     .min(1, 'At least one task required'),
// });

// const TaskRow = React.memo(
//   ({
//     task,
//     taskIndex,
//     globalIndex,
//     projectId,
//     projectTasks,
//     removeTask,
//     addTask,
//     reportEditable
//   }: {
//     task: Task;
//     taskIndex: number;
//     globalIndex: number;
//     projectId: string;
//     projectTasks: Task[];
//     removeTask: (index: number) => void;
//     addTask: (task: Task) => void;
//     reportEditable: boolean;
//   }) => {
//     const { setFieldValue } = useFormikContext<DailyWorkReportFormValues>();

//     const updateTimeTaken = useCallback(
//       (start_time: Dayjs | null, end_time: Dayjs | null) => {
//         let timeTaken = "";
//         if (
//           start_time &&
//           dayjs.isDayjs(start_time) &&
//           end_time &&
//           dayjs.isDayjs(end_time)
//         ) {
//           const duration = end_time.diff(start_time, "minute");
//           if (duration >= 0) {
//             timeTaken = `${duration}`;
//           }
//         }
//         setFieldValue(`tasks[${globalIndex}].timeTaken`, timeTaken);
//       },
//       [setFieldValue, globalIndex]
//     );
//     const stripHtml = (html: string): string => {
//       if (!html) return '';
//       const div = document.createElement('div');
//       div.innerHTML = html;
//       return div.textContent || div.innerText || '';
//     };

//     const formatTime = (minutes: number | string) => {
//       const total = parseInt(minutes as string, 10);
//       if (isNaN(total)) return "0 mins";
//       const hours = Math.floor(total / 60);
//       const mins = total % 60;
//       if (hours >= 1) {
//         return `${hours} hr ${mins} mins`;
//       }
//       return `${mins} mins`;
//     };
//     return (
//       <TableRow
//         sx={{
//           bgcolor: taskIndex % 2 === 0 ? '#fff' : '#f8f9fa',
//           '&:hover': { bgcolor: 'rgba(227, 242, 253, 0.5)' },
//         }}
//       >
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '15%' }}>
//           <FastField name={`tasks[${globalIndex}].task_name`}>
//             {({ field, meta }: any) => (
//               <TextField
//                 {...field}
//                 fullWidth
//                 multiline
//                 placeholder="Enter task name"
//                 error={meta.touched && Boolean(meta.error)}
//                 helperText={meta.touched && meta.error}
//                 variant="standard"
//                 slotProps={{
//                   input: {
//                     readOnly: !reportEditable,
//                   },
//                 }}
//                 sx={{
//                   fontSize: '0.75rem',
//                   '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
//                   '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
//                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                     borderBottom: 'none',
//                   },
//                 }}
//               />
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '40%' }}>
//           <FastField name={`tasks[${globalIndex}].description`}>
//             {({ field, meta }: any) => (
//               <TextField
//                 {...field}
//                 fullWidth
//                 multiline
//                 placeholder="Enter description"
//                 error={meta.touched && Boolean(meta.error)}
//                 helperText={meta.touched && meta.error}
//                 variant="standard"
//                 minRows={1}
//                 value={stripHtml(field.value)}
//                 slotProps={{
//                   input: {
//                     readOnly: !reportEditable,
//                   },
//                 }}
//                 sx={{
//                   fontSize: '0.75rem',
//                   resize: 'vertical',
//                   '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem', resize: 'vertical' },
//                   '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
//                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                     borderBottom: 'none',
//                   },
//                 }}
//                 InputProps={{ inputComponent: 'textarea' }}
//               />
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '9%' }}>
//           <FastField name={`tasks[${globalIndex}].status`}>
//             {({ field, meta }: any) => (
//               <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
//                 <Select
//                   {...field}
//                   variant="standard"
//                   displayEmpty
//                   slotProps={{
//                     input: {
//                       readOnly: !reportEditable,
//                     },
//                   }}
//                   sx={{
//                     fontSize: '0.75rem',
//                     padding: '1px 4px',
//                     '&:before, &:after, &:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
//                   }}
//                 >
//                   <MenuItem value="" disabled selected sx={{ fontSize: '0.75rem' }}>
//                     Status
//                   </MenuItem>
//                   <MenuItem value="pending" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
//                   <MenuItem value="in_progress" sx={{ fontSize: '0.75rem' }}>In Progress</MenuItem>
//                   <MenuItem value="completed" sx={{ fontSize: '0.75rem' }}>Completed</MenuItem>
//                 </Select>
//                 {meta.touched && meta.error && (
//                   <FormHelperText sx={{ fontSize: '0.65rem' }}>{meta.error}</FormHelperText>
//                 )}
//               </FormControl>
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, width: '9%' }}>
//           <FastField name={`tasks[${globalIndex}].start_time`}>
//             {({ field, meta }: any) => (
//               <Box
//                 sx={{
//                   pointerEvents: !reportEditable ? 'none' : 'auto', 
//                   opacity: 1, 
//                 }}
//               >
//               <TimePicker
//                 value={field.value}
//                 onChange={(value) => {
//                   setFieldValue(field.name, value);
//                   updateTimeTaken(value, task.end_time);
//                 }}
//                 slotProps={{
//                   textField: {
//                     fullWidth: true,
//                     variant: 'standard',
//                     placeholder: 'HH:MM',
//                     error: meta.touched && Boolean(meta.error),
//                     helperText: meta.touched && meta.error,
//                     sx: {
//                       fontSize: '0.75rem',
//                       '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
//                       '& .MuiSvgIcon-root': {
//                         fontSize: '1rem',
//                       },
//                       '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
//                       '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                         borderBottom: 'none',
//                       },
//                     },
//                   },
//                 }}
//               />
//               </Box>
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, width: '9%' }}>
//           <FastField name={`tasks[${globalIndex}].end_time`}>
//             {({ field, meta }: any) => (
//               <Box
//                 sx={{
//                   pointerEvents: !reportEditable ? 'none' : 'auto', 
//                   opacity: 1, 
//                 }}
//               >
//               <TimePicker
//                 value={field.value}
//                 onChange={(value) => {
//                   setFieldValue(field.name, value);
//                   updateTimeTaken(task.start_time, value);
//                 }}
//                 // disabled={!reportEditable}
//                 slotProps={{
//                   textField: {
//                     fullWidth: true,
//                     variant: 'standard',
//                     placeholder: 'HH:MM',
//                     error: meta.touched && Boolean(meta.error),
//                     helperText: meta.touched && meta.error,
//                     sx: {
//                       fontSize: '0.75rem',
//                       '& .MuiSvgIcon-root': {
//                         fontSize: '1rem',
//                       },
//                       '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
//                       '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
//                       '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                         borderBottom: 'none',
//                       },
//                     },
//                   },
//                 }}
//               />
//               </Box>
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '5%' }}>
//           <FastField name={`tasks[${globalIndex}].timeTaken`}>
//             {({ field,meta }: any) => (
//               <TextField
//                 {...field}
//                 value={formatTime(field.value)}
//                 fullWidth
//                 type="text"
//                 variant="standard"
//                 InputProps={{ readOnly: true }}
//                 placeholder="Minutes"
//                 error={meta.touched && Boolean(meta.error)}        
//                 helperText={meta.touched && meta.error}    
//                 slotProps={{
//                   input: {
//                     readOnly: !reportEditable,
//                   },
//                 }}
//                 sx={{
//                   fontSize: '0.75rem',
//                   '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
//                   '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
//                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                     borderBottom: 'none',
//                   },
//                 }}
//               />
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '5%' }}>
//           <FastField name={`tasks[${globalIndex}].eta`}>
//             {({ field, meta }: any) => (
//               <TextField
//                 type="number"
//                 {...field}
//                 value={field.value ?? ''}
//                 fullWidth
//                 variant="standard"
//                 placeholder="ETA (in mins)"
//                 error={meta.touched && Boolean(meta.error)}
//                 helperText={meta.touched && meta.error}
//                 slotProps={{
//                   input: {
//                     readOnly: !reportEditable,
//                   },
//                 }}
//                 sx={{
//                   fontSize: '0.75rem',
//                   '& .MuiInputBase-input': {
//                     padding: '1px 4px',
//                     fontSize: '0.75rem',
//                   },
//                   '& .MuiInputBase-input::placeholder': {
//                     fontSize: '0.75rem',
//                     color: '#757575',
//                     opacity: 1,
//                   },
//                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                     borderBottom: 'none',
//                   },
//                 }}
//               />
//             )}
//           </FastField>
//         </TableCell>
//         <TableCell sx={{ py: 0.2, px: 0.4, width: '5%' }}>
//           <Box sx={{ display: 'flex', gap: 0.2 }}>
//             <IconButton
//               aria-label="Remove task"
//               onClick={() => removeTask(globalIndex)}
//               disabled={projectTasks.length === 1}
//               sx={{ color: '#ff4d4f', padding: '2px', '&:hover': { color: '#d32f2f' } }}
//             >
//               <RemoveCircleOutline sx={{ fontSize: '0.95rem' }} />
//             </IconButton>
//             <IconButton
//               aria-label="Add task"
//               onClick={() => addTask({ ...defaultTask, project_id: projectId })}
//               sx={{ color: '#2e7d32', padding: '2px', '&:hover': { color: '#1b5e20' } }}
//             >
//               <AddCircleOutline sx={{ fontSize: '0.95rem' }} />
//             </IconButton>
//           </Box>
//         </TableCell>
//       </TableRow>
//     );
//   },
//   (prevProps, nextProps) => {
//     return (
//       prevProps.task === nextProps.task &&
//       prevProps.taskIndex === nextProps.taskIndex &&
//       prevProps.globalIndex === nextProps.globalIndex &&
//       prevProps.projectId === nextProps.projectId &&
//       prevProps.projectTasks.length === nextProps.projectTasks.length
//     );
//   }
// );

// const ProjectSection = React.memo(
//   ({ projectId, projects, toggleProject, removeProject, expandedProjects, reportEditable }: {
//     projectId: string;
//     projects: { id: string; title: string }[];
//     toggleProject: (projectId: string) => void;
//     removeProject: (projectId: string) => void;
//     expandedProjects: { [key: string]: boolean };
//     reportEditable: boolean;
//   }) => {
//     const { values } = useFormikContext<DailyWorkReportFormValues>();
//     const project = projects.find((p) => p.id === projectId);
//     const projectTasks = values.tasks.filter((task) => task.project_id === projectId);
//     const taskIndices = values.tasks
//       .map((task, idx) => (task.project_id === projectId ? idx : -1))
//       .filter((idx) => idx !== -1);
//     const isExpanded = !!expandedProjects[projectId];

//     return (
//       <>
//         <TableRow sx={{ bgcolor: '#e8ecef' }}>
//           <TableCell colSpan={8} sx={{ p: 0 }}>
//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, px: 1 }}>
//               <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                 <IconButton size="small" onClick={() => toggleProject(projectId)} sx={{ color: '#1a237e', mr: 1 }}>
//                   <Add
//                     sx={{
//                       fontSize: '0.75rem',
//                       transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
//                       transition: 'transform 0.3s',
//                     }}
//                   />
//                 </IconButton>
//                 <Typography sx={{ fontSize: '0.8rem', color: '#1a237e' }}>
//                   {project?.title || 'Unknown Project'}
//                 </Typography>
//               </Box>
//               <IconButton
//                 size="small"
//                 onClick={() => removeProject(projectId)}
//                 sx={{ color: '#ff4d4f', '&:hover': { color: '#d32f2f' } }}
//               >
//                 <Delete sx={{ fontSize: '0.95rem' }} />
//               </IconButton>
//             </Box>
//           </TableCell>
//         </TableRow>
//         <TableRow>
//           <TableCell colSpan={8} sx={{ p: 0 }}>
//             <Collapse in={isExpanded} timeout="auto" unmountOnExit>
//               <Box sx={{ border: '1px solid #e8ecef', bgcolor: 'white' }}>
//                 <FieldArray name="tasks">
//                   {({ remove, push }: any) => (
//                     <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
//                       <TableBody>
//                         {projectTasks.map((task, taskIndex) => (
//                           <TaskRow
//                             key={taskIndices[taskIndex]}
//                             task={task}
//                             taskIndex={taskIndex}
//                             globalIndex={taskIndices[taskIndex]}
//                             projectId={projectId}
//                             projectTasks={projectTasks}
//                             removeTask={remove}
//                             addTask={push}
//                             reportEditable={reportEditable}
//                           />
//                         ))}
//                       </TableBody>
//                     </Table>
//                   )}
//                 </FieldArray>
//               </Box>
//             </Collapse>
//           </TableCell>
//         </TableRow>
//       </>
//     );
//   },
//   (prevProps, nextProps) => {
//     return (
//       prevProps.projectId === nextProps.projectId &&
//       prevProps.expandedProjects[prevProps.projectId] === nextProps.expandedProjects[nextProps.projectId]
//     );
//   }
// );

// const DailyWorkReportForm = () => {
//   const [hasLeave, setHasLeave] = useState(false);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [availableUsers, setAvailableUsers] = useState<User[]>([]);
//   const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
//   const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
//   const [initialReportingUsers, setInitialReportingUsers] = useState<User[]>([]);
//   const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
//   const [reportAlreadyAdded, setReportAlreadyAdded] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
//   const [Functionalities, setFunctionalities] = useState<Functionality[]>([]);
//   const axiosInstance = createAxiosInstance();
//   const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
//   const authData = useAppselector((state) => state.auth.value);
//   const userId = authData?.user?.id;
//   const today = dayjs();
//   const savedFormData = localStorage.getItem('unsavedFormData') || null;
//   const parsedData: DailyWorkReportFormValues | null = savedFormData
//     ? JSON.parse(savedFormData, (key, value) =>
//       ['reportDate', 'officein', 'officeout', 'eta', 'start_time', 'end_time'].includes(key) && value
//         ? dayjs(value)
//         : value
//     )
//     : null;

//   const defaultOfficeIn: Dayjs = dayjs().hour(9).minute(0).second(0);
//   const defaultOfficeOut: Dayjs = dayjs() || dayjs().hour(18).minute(30).second(0);

//   const isReportsEditable = Functionalities.some(
//     (f) => f.key === "reports_editable" && f.is_enabled
//   );

//   const initialValues: DailyWorkReportFormValues = {
//     reportDate: parsedData?.reportDate || today,
//     officein: parsedData?.officein || defaultOfficeIn,
//     officeout: parsedData?.officeout || defaultOfficeOut,
//     leave: parsedData?.leave ?? '',
//     tasks: parsedData?.tasks || [],
//   };

//   const formik = useFormik<DailyWorkReportFormValues>({
//     initialValues,
//     validationSchema,
//     onSubmit: async (values, { resetForm }) => {
//       setIsSubmitting(true); // Disable submit button
//       const payload = {
//         officein: values.officein?.toISOString(),
//         officeout: values.officeout?.toISOString(),
//         leave: values.leave,
//         tasks: values.tasks.map((task) => ({
//           project_id: task.project_id,
//           task_name: task.task_name,
//           description: task.description,
//           eta: task.eta,
//           status: task.status,
//           start_time: task.start_time?.toISOString(),
//           end_time: task.end_time?.toISOString(),
//           time_taken: Number(task?.timeTaken) || 0,
//         })),
//       };

//       try {
//         await axiosInstance.post('/work-logs', payload);
//         toast.success('Report submitted!');
//         localStorage.removeItem('unsavedFormData');
//         resetForm();
//         setSelectedProjects([]);
//         setExpandedProjects({});
//       } catch (error) {
//         toast.error('Submission failed!');
//       } finally {
//         setIsSubmitting(false); // Re-enable submit button
//       }
//     },
//   });

//   const addNewProject = useCallback(
//     (projectId: string) => {
//       if (projectId && !selectedProjects.includes(projectId)) {
//         setSelectedProjects((prev) => [...prev, projectId]);
//         formik.setFieldValue('tasks', [
//           ...formik.values.tasks,
//           { ...defaultTask, project_id: projectId },
//         ]);
//         setExpandedProjects((prev) => ({ ...prev, [projectId]: true }));
//       }
//     },
//     [formik, selectedProjects]
//   );

//   const removeProject = useCallback(
//     (projectId: string) => {
//       formik.setFieldValue(
//         'tasks',
//         formik.values.tasks.filter((task) => task.project_id !== projectId)
//       );
//       setSelectedProjects((prev) => prev.filter((id) => id !== projectId));
//       setExpandedProjects((prev) => {
//         const { [projectId]: _, ...rest } = prev;
//         return rest;
//       });
//     },
//     [formik]
//   );

//   const toggleProject = useCallback(
//     (projectId: string) => {
//       setExpandedProjects((prev) => ({
//         ...prev,
//         [projectId]: !prev[projectId],
//       }));
//     },
//     []
//   );

//   const resetTasks = useCallback(() => {
//     formik.setFieldValue('tasks', []);
//     setSelectedProjects([]);
//     setExpandedProjects({});
//     localStorage.removeItem('unsavedFormData');
//   }, [formik]);

//   const handleSaveToLocalStorage = useCallback(() => {
//     const { officein, officeout, leave, tasks } = formik.values;
//     const hasValidTask = tasks.some((task: any) =>
//       ['project_id', 'task_name', 'description', 'status', 'remark'].some(
//         (key) => (task[key]?.trim?.() ?? '') !== ''
//       ) || task.eta !== null
//     );

//     if (officein || officeout || leave || hasValidTask) {
//       localStorage.setItem('unsavedFormData', JSON.stringify(formik.values));
//       toast.success('Data saved!');
//     } else {
//       toast.error('Nothing to save.');
//     }
//   }, [formik]);
//   const fetchFunctionalities = async () => {
//     try {
//       const res = await axiosInstance.get("/functionality/get-all");
//       console.log("Fetch Functionalities response:", res.data);
//       if (res.data.status !== "success") throw new Error("Failed to fetch Functionalities");
//       setFunctionalities(res.data.data || []);
//     } catch (error) {
//       console.error("Error fetching Functionalities:", error.response?.data, error.message);
//       toast.error(error?.response?.data?.message || "Failed to fetch Functionalities");
//     } finally {
//     }
//   };
//   useEffect(() => {
//     const fetchProjects = async () => {
//       try {
//         const res = await axiosInstance.get(`/project-management/user-projects/${userId}`);
//         setProjects(res.data || []);
//       } catch (err) {
//         console.error('Error fetching projects:', err);
//       }
//     };
//     fetchProjects();
//     fetchFunctionalities();
//   }, []);

//   useEffect(() => {
//     const fetchTickets = async () => {
//       try {
//         const today = new Date();
//         const res = await axiosInstance.get(
//           `/task-maangement/by-user/${userId}?moved_date=${today}`
//         );
//         console.log("task submission", res.data);

//         // Check if response indicates report already added
//         if (res.data === "Report already added for today") {
//           setReportAlreadyAdded(true);
//           return; // Exit early, no further changes
//         }

//         const tickets = res.data?.tickets || [];
//         const newTasks: Task[] = [];
//         const newSelectedProjects = new Set<string>();
//         const newExpandedProjects: { [key: string]: boolean } = {};

//         tickets.forEach((ticket: any) => {
//           const projectId = ticket.project.id;
//           const status = ticket.status === "testable" || ticket.status === "completed"? "completed": "in_progress";
//           const completedSubtaskDescriptions = ticket.subTasks?.filter((sub: any) => sub.status === "completed" && sub.description).map((sub: any) => sub.description).join("\n") || "";

//           const finalDescription = [ticket.description,completedSubtaskDescriptions,].filter(Boolean).join("\nSubtasks: ");

//           newTasks.push({
//             ...defaultTask,
//             project_id: projectId,
//             task_name: ticket.title,
//             description: finalDescription,
//             status,
//             ...(ticket?.timeTaken?.time_taken && {
//               start_time: ticket.timeTaken.start_time ? dayjs(ticket.timeTaken.start_time) : null,
//               end_time: ticket.timeTaken.end_time ? dayjs(ticket.timeTaken.end_time) : null,
//               timeTaken: ticket.timeTaken.time_taken,
//             }),
//           });

//           newSelectedProjects.add(projectId);
//           newExpandedProjects[projectId] = true;
//         });

//         if (newTasks.length > 0) {
//           const existingTasks = formik.values.tasks;
//           const uniqueTasks = newTasks.filter(
//             (newTask) =>
//               !existingTasks.some(
//                 (task) =>
//                   task.project_id === newTask.project_id &&
//                   task.task_name === newTask.task_name &&
//                   task.description === newTask.description
//               )
//           );
//           formik.setFieldValue('tasks', [...existingTasks, ...uniqueTasks]);
//           setSelectedProjects(Array.from(newSelectedProjects));
//           setExpandedProjects(newExpandedProjects);
//         }
//       } catch (err) {
//         console.error('Error fetching tickets:', err);
//         toast.error('Failed to fetch ticket data.');
//       }
//     };

//     if (userId) {
//       fetchTickets();
//     }
//   }, []);

//   const handleOpenDialog = async () => {
//     setOpenDialog(true);
//     setIsSubmitting(true);
//     try {
//       const [usersRes, reportingUsersRes] = await Promise.all([
//         axiosInstance.get(`/user/list`),  // or tenant-based fetch
//         axiosInstance.get(`/user/reporting-users/${userId}`),
//       ]);

//       setAvailableUsers(usersRes.data.data || []);
//       setInitialReportingUsers((reportingUsersRes.data.data || []).map((u: User) => u.id));
//       setSelectedUsers((reportingUsersRes.data.data || []).map((u: User) => u.id));
//     } catch (err) {
//       console.error("Failed to open dialog:", err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     setSelectedUsers([]);
//     setInitialReportingUsers([]);
//   };
//   const isDirty = JSON.stringify(selectedUsers) !== JSON.stringify(initialReportingUsers);

//   const handleSave = async () => {
//     const reporting_users = selectedUsers
//       .map((id) => availableUsers.find((u) => u.id === id))
//       .filter(Boolean)
//       .map((u) => ({
//         id: u!.id,
//         first_name: u!.first_name,
//         last_name: u!.last_name,
//         email: u!.email,
//       }));

//     try {
//       await axiosInstance.patch(`/user/reporting-users/${userId}`, { reporting_users });
//       toast.success('Reporting users updated successfully');
//       handleCloseDialog();
//     } catch (err) {
//       console.error("Failed to update reporting users", err);
//       toast.error("Failed to update reporting users");
//     }
//   };


//   useEffect(() => {
//     const fetchUsers = async () => {
//       const res = await axiosInstance.get(`/user/list`);
//       setAvailableUsers(res.data.data);
//     };
//     fetchUsers();
//   }, []);


//   return (
//     <>
//       <FormikProvider value={formik}>
//         <Box
//           sx={{
//             minHeight: '100vh',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             p: 2,
//             bgcolor: 'linear-gradient(135deg, #e8ecef 0%, #f8f9fa 100%)',
//             width: '100%',
//           }}
//         >
//           <Card
//             sx={{
//               width: '100%',
//               backdropFilter: 'blur(10px)',
//               background: 'rgba(255, 255, 255, 0.9)',
//               boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//               borderRadius: 2,
//               border: '1px solid rgba(255, 255, 255, 0.2)',
//               p: 2,
//             }}
//           >
//             <CardContent sx={{ p: 2 }}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
//                 <Typography
//                   variant="h5"
//                   sx={{
//                     fontWeight: 700,
//                     color: 'var(--primary-1-text-color)',
//                     letterSpacing: '0.5px',
//                   }}
//                 >
//                   Daily Work Report
//                 </Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
//                   <Typography
//                     variant="h5"
//                     sx={{
//                       fontWeight: 700,
//                       color: 'var(--primary-1-text-color)',
//                       letterSpacing: '0.5px',
//                     }}
//                   >
//                     CC
//                   </Typography>
//                   <IconButton
//                     aria-label="Add CC user"
//                     onClick={handleOpenDialog}
//                     sx={{
//                       "&:hover": {
//                         backgroundColor: "var(--primary-color-1)",
//                         color: "white",
//                       },
//                       transition: "all 0.3s",
//                     }}
//                   >
//                     <AddIcon />
//                   </IconButton>
//                 </Box>
//               </Box>
//               {reportAlreadyAdded ? (
//                 <Box
//                   sx={{
//                     display: 'flex',
//                     flexDirection: 'column',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     minHeight: '400px',
//                     bgcolor: '#f8f9fa',
//                     borderRadius: 2,
//                     border: '1px solid #e8ecef',
//                     p: 3,
//                   }}
//                 >
//                   <Typography
//                     variant="h6"
//                     sx={{
//                       color: '#1a237e',
//                       fontWeight: 500,
//                       mb: 2,
//                     }}
//                   >
//                     Report Already Added for Today
//                   </Typography>
//                   <Typography
//                     sx={{
//                       color: '#424242',
//                       fontSize: '1rem',
//                       textAlign: 'center',
//                     }}
//                   >
//                     You have already submitted a daily work report for today. Please check back tomorrow or contact support if you need assistance.
//                   </Typography>
//                 </Box>
//               ) : (
//                 <form onSubmit={formik.handleSubmit}>
//                   <LocalizationProvider dateAdapter={AdapterDayjs}>
//                     <Box
//                       sx={{
//                         display: 'flex',
//                         gap: 3,
//                         alignItems: 'center',
//                         mb: 2,
//                         p: 1,
//                         borderRadius: 2,
//                         bgcolor: 'rgba(255, 255, 255, 0.8)',
//                         border: '1px solid #e8ecef',
//                         width: '100%',
//                       }}
//                     >
//                       <Field name="officein">
//                         {({ field, meta }: any) => (
//                           <TimePicker
//                             value={field.value}
//                             onChange={(value) => formik.setFieldValue('officein', value)}
//                             slotProps={{
//                               textField: {
//                                 size: 'small',
//                                 variant: 'standard',
//                                 error: meta.touched && Boolean(meta.error),
//                                 helperText: meta.touched && meta.error,
//                                 sx: {
//                                   width: 100,
//                                   fontSize: '0.8rem',
//                                   '& .MuiInputBase-input': { padding: '2px 4px', fontSize: '0.7rem' },
//                                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                                     borderBottom: 'none',
//                                   },
//                                 },
//                               },
//                             }}
//                           />
//                         )}
//                       </Field>
//                       <Field name="officeout">
//                         {({ field, meta }: any) => (
//                           <TimePicker
//                             value={field.value}
//                             onChange={(value) => formik.setFieldValue('officeout', value)}
//                             slotProps={{
//                               textField: {
//                                 size: 'small',
//                                 variant: 'standard',
//                                 error: meta.touched && Boolean(meta.error),
//                                 helperText: meta.touched && meta.error,
//                                 sx: {
//                                   width: 100,
//                                   fontSize: '0.8rem',
//                                   '& .MuiInputBase-input': { padding: '2px 4px', fontSize: '0.7rem' },
//                                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                                     borderBottom: 'none',
//                                   },
//                                 },
//                               },
//                             }}
//                           />
//                         )}
//                       </Field>
//                       <FormControlLabel
//                         control={
//                           <Checkbox
//                             checked={hasLeave}
//                             onChange={(e) => {
//                               const isChecked = e.target.checked;
//                               setHasLeave(isChecked);
//                               if (!isChecked) formik.setFieldValue('leave', '');
//                             }}
//                             sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: 16 } }}
//                           />
//                         }
//                         label="Leave?"
//                         sx={{
//                           fontSize: '0.8rem',
//                           color: '#424242',
//                           m: 0,
//                           '& .MuiFormControlLabel-label': { fontSize: '0.8rem' },
//                         }}
//                       />
//                       {hasLeave && (
//                         <Box sx={{ flex: 1 }}>
//                           <Field name="leave">
//                             {({ field }: any) => (
//                               <TextField
//                                 {...field}
//                                 fullWidth
//                                 size="small"
//                                 variant="standard"
//                                 placeholder="Reason for leave"
//                                 sx={{
//                                   fontSize: '0.8rem',
//                                   '& .MuiInputBase-input': { padding: '2px 4px', fontSize: '0.8rem' },
//                                   '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
//                                     borderBottom: 'none',
//                                   },
//                                 }}
//                               />
//                             )}
//                           </Field>
//                         </Box>
//                       )}
//                     </Box>

//                     <Box sx={{ mb: 2 }}>
//                       <Select
//                         value=""
//                         onChange={(e) => addNewProject(e.target.value as string)}
//                         displayEmpty
//                         renderValue={() => 'Add Project'}
//                         size="small"
//                         sx={{
//                           bgcolor: 'white',
//                           borderRadius: 1,
//                           fontSize: '0.75rem',
//                           '& .MuiSelect-select': { padding: '4px 8px' },
//                           '&:before, &:after, &:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
//                         }}
//                       >
//                         <MenuItem value="" disabled>
//                           Select a Project
//                         </MenuItem>
//                         {projects
//                           .filter((p) => !selectedProjects.includes(p.id))
//                           .map((project) => (
//                             <MenuItem key={project.id} value={project.id} sx={{ fontSize: '0.75rem' }}>
//                               {project.title}
//                             </MenuItem>
//                           ))}
//                       </Select>
//                     </Box>

//                     <TableContainer
//                       component={Paper}
//                       sx={{
//                         maxHeight: '60vh',
//                         minHeight: '400px',
//                         border: '1px solid #e8ecef',
//                         borderRadius: 2,
//                         bgcolor: 'white',
//                         width: '100%',
//                       }}
//                     >
//                       {selectedProjects.length === 0 ? (
//                         <Typography sx={{ textAlign: 'center', py: 2, color: '#424242' }}>
//                           No projects selected. Add a project to start.
//                         </Typography>
//                       ) : (
//                         <Table sx={{ width: '100%', tableLayout: 'fixed' }} stickyHeader>
//                           <TableHead>
//                             <TableRow sx={{ bgcolor: '#f1f3f5' }}>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '15%' }}><RequiredLabel label="Task" /></TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '45%' }}><RequiredLabel label="Description" /></TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '10%' }}><RequiredLabel label="Status" /></TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '7%' }}>Start</TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '7%' }}>End</TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '6%' }}>Time</TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '8%' }}>ETA(min)</TableCell>
//                               <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '4%' }}>Action</TableCell>
//                             </TableRow>
//                           </TableHead>
//                           <TableBody>
//                             {selectedProjects.map((projectId) => (
//                               <ProjectSection
//                                 key={projectId}
//                                 projectId={projectId}
//                                 projects={projects}
//                                 toggleProject={toggleProject}
//                                 removeProject={removeProject}
//                                 expandedProjects={expandedProjects}
//                                 reportEditable={isReportsEditable}
//                               />
//                             ))}
//                           </TableBody>
//                         </Table>
//                       )}
//                     </TableContainer>

//                     {formik.touched.tasks && formik.errors.tasks && typeof formik.errors.tasks === 'string' && (
//                       <Typography color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
//                         {formik.errors.tasks}
//                       </Typography>
//                     )}

//                     <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
//                       <IconButton
//                         onClick={resetTasks}
//                         sx={{
//                           bgcolor: 'var(--primary-color-2)',
//                           color: 'white',
//                           p: 1,
//                           '&:hover': { bgcolor: 'var(--primary-color-1)' },
//                         }}
//                       >
//                         <Tooltip title="Reset">
//                           <Refresh sx={{ fontSize: '1rem' }} />
//                         </Tooltip>
//                       </IconButton>
//                       {/* <IconButton
//                       onClick={handleSaveToLocalStorage}
//                       sx={{
//                         bgcolor: 'var(--primary-color-2)',
//                         color: 'white',
//                         p: 1,
//                         '&:hover': { bgcolor: 'var(--primary-color-1)' },
//                       }}
//                     >
//                       <Tooltip title="Save">
//                         <Save sx={{ fontSize: '1rem' }} />
//                       </Tooltip>
//                     </IconButton> */}
//                       <IconButton
//                         type="submit"
//                         disabled={isSubmitting || !formik.dirty} // Disable button during submission
//                         sx={{
//                           bgcolor: isSubmitting ? 'grey.500' : 'var(--primary-color-1)', // Grey when disabled
//                           color: 'white',
//                           p: 1,
//                           '&:hover': { bgcolor: isSubmitting ? 'grey.500' : 'var(--primary-color-1)' },
//                           '&:disabled': {
//                             bgcolor: 'grey.300'
//                           }
//                         }}
//                       >
//                         <Tooltip title="Submit">
//                           <Send sx={{ fontSize: '1rem' }} />
//                         </Tooltip>
//                       </IconButton>
//                     </Box>
//                   </LocalizationProvider>
//                 </form>
//               )}
//             </CardContent>
//           </Card>
//         </Box>
//       </FormikProvider>
//       <Dialog
//         open={openDialog}
//         onClose={handleCloseDialog}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle
//           sx={{
//             bgcolor: "var(--primary-color-1)",
//             color: "#FFFFFF",
//             mb: 2,
//             textAlign: "center",
//             background: "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
//             p: 1.5,
//           }}
//         >
//           Select Reporting Users
//         </DialogTitle>
//         <DialogContent>
//           <FormControl fullWidth sx={{ mt: 1 }}>
//             <Autocomplete
//               multiple
//               id="reporting-users"
//               options={availableUsers.filter((user) => !selectedUsers.includes(user.id))} // Filter out selected users
//               getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
//               filterOptions={(options, { inputValue }) =>
//                 options.filter(
//                   (user) =>
//                     user.first_name.toLowerCase().includes(inputValue.toLowerCase()) ||
//                     user.last_name.toLowerCase().includes(inputValue.toLowerCase()) ||
//                     user.email.toLowerCase().includes(inputValue.toLowerCase())
//                 )
//               }
//               value={availableUsers.filter((u) => selectedUsers.includes(u.id))}
//               onChange={(event, newValue) => {
//                 setSelectedUsers(newValue.map((user) => user.id));
//               }}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   variant="outlined"
//                   placeholder={selectedUsers.length === 0 ? "Search users..." : ""}
//                   sx={{
//                     "& .MuiOutlinedInput-root": {
//                       borderRadius: "8px",
//                       backgroundColor: "#FFFFFF",
//                       "& fieldset": {
//                         borderColor: "var(--primary-color-1)", // Forest green border
//                       },
//                       "&:hover fieldset": {
//                         borderColor: "var(--primary-color-2)", // Berry pink on hover
//                       },
//                       "&.Mui-focused fieldset": {
//                         borderColor: "var(--primary-color-1)", // Forest green when focused
//                       },
//                     },
//                     "& .MuiInputBase-input": {
//                       fontFamily: "'Roboto', sans-serif",
//                       color: "var(--text-color)",
//                     },
//                   }}
//                 />
//               )}
//               renderTags={(value, getTagProps) =>
//                 value.map((user, index) => {
//                   const { key, ...otherProps } = getTagProps({ index });
//                   return (
//                     <Chip
//                       key={user.id} // Explicitly set key
//                       label={`${user.first_name} ${user.last_name}`}
//                       {...otherProps} // Spread remaining props (excluding key)
//                       sx={{
//                         borderRadius: "8px",
//                         backgroundColor: "var(--primary-bg-colors)", // Pale creamy green
//                         color: "var(--primary-1-text-color)", // Darker green text
//                         "& .MuiChip-deleteIcon": {
//                           color: "var(--primary-color-2)", // Berry pink delete icon
//                           "&:hover": {
//                             color: "#B0004A", // Darker pink on hover
//                           },
//                         },
//                       }}
//                     />
//                   );
//                 })
//               }
//               renderOption={(props, option, { selected }) => {
//                 const { key, ...otherProps } = props; // Already fixed
//                 return (
//                   <li
//                     key={option.id}
//                     {...otherProps}
//                     style={{ fontFamily: "'Roboto', sans-serif", color: "var(--text-color)" }}
//                   >
//                     {`${option.first_name} ${option.last_name} (${option.email})`}
//                   </li>
//                 );
//               }}
//               sx={{
//                 "& .MuiAutocomplete-popupIndicator": {
//                   color: "var(--primary-color-1)", // Forest green for dropdown arrow
//                 },
//                 "& .MuiAutocomplete-clearIndicator": {
//                   color: "var(--primary-color-2)", // Berry pink for clear icon
//                 },
//               }}
//             />
//           </FormControl>
//         </DialogContent>
//         <DialogActions>
//           <Button
//             onClick={handleCloseDialog}
//             disabled={isSubmitting}
//             sx={{
//               color: "var(--primary-color-1)",
//               fontFamily: "'Roboto', sans-serif",
//               "&:hover": {
//                 backgroundColor: "var(--primary-bg-colors)",
//               },
//             }}
//           >
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             sx={{
//               bgcolor: "var(--primary-color-1)",
//               color: "#FFFFFF",
//               fontFamily: "'Roboto', sans-serif",
//               "&:hover": {
//                 bgcolor: "var(--primary-color-2)",
//               },
//               "&.Mui-disabled": {
//                 bgcolor: "#B0BEC5",
//                 color: "#FFFFFF",
//               },
//             }}
//             onClick={handleSave}
//             disabled={isSubmitting || !isDirty}
//           >
//             {selectedUsers.length == 0 ? "Proceed without CC" : "Add"}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// };

// export default DailyWorkReportForm;

'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Field, FieldArray, useFormik, useFormikContext, FormikProvider, FastField } from 'formik';
import * as Yup from 'yup';
import {
  Button, TextField, MenuItem, Select, FormControl, Typography, Card, CardContent, Box,
  IconButton, FormHelperText, Checkbox, FormControlLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Collapse, Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  DialogActions,
  Autocomplete
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, Refresh, Add, Delete, Save, Send } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import toast from 'react-hot-toast';
import createAxiosInstance from '@/app/axiosInstance';
import { useAppselector } from '@/redux/store';
import RequiredLabel from '../layout/shared/logo/RequiredLabel';
import AddIcon from "@mui/icons-material/Add";
import { Functionality } from '../settings/FunctionalitySettings';

type Task = {
  project_id: string;
  task_name: string;
  description: string;
  eta: Dayjs | null;
  status: 'pending' | 'in_progress' | 'completed';
  timeTaken: string;
  start_time: Dayjs | null;
  end_time: Dayjs | null;
  remark: string;
  visible_to: string[];
};

type DailyWorkReportFormValues = {
  reportDate: Dayjs;
  officein: Dayjs | null;
  officeout: Dayjs | null;
  leave: string;
  tasks: Task[];
};
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}
const defaultTask: Task = {
  project_id: '',
  task_name: '',
  description: '',
  eta: null,
  status: 'pending',
  timeTaken: '',
  start_time: null,
  end_time: null,
  remark: '',
  visible_to: [],
};

const validationSchema = Yup.object({
  officein: Yup.mixed<Dayjs>().required('Required'),
  officeout: Yup.mixed<Dayjs>().required('Required'),
  leave: Yup.string(),
  tasks: Yup.array()
    .of(
      Yup.object().shape({
        project_id: Yup.string().required('Project required'),
        task_name: Yup.string().required('Task required'),
        description: Yup.string().required('Description required'),
        eta: Yup.mixed<Dayjs>().nullable(),
        status: Yup.string().oneOf(['pending', 'in_progress', 'completed']).required('Status required'),
        timeTaken: Yup.number()
          .typeError("Time taken must be a number")
          .required("Time taken Required")
          .moreThan(0, "Time taken must be greater than 0"),
        start_time: Yup.mixed<Dayjs>().required('Start Time Required'),
        end_time: Yup.mixed<Dayjs>().required('End Time Required'),
        remark: Yup.string(),
        visible_to: Yup.array().of(Yup.string()),
      })
    )
    .min(1, 'At least one task required'),
});

const TaskRow = React.memo(
  ({
    task,
    taskIndex,
    globalIndex,
    projectId,
    projectTasks,
    removeTask,
    addTask,
    reportEditable
  }: {
    task: Task;
    taskIndex: number;
    globalIndex: number;
    projectId: string;
    projectTasks: Task[];
    removeTask: (index: number) => void;
    addTask: (task: Task) => void;
    reportEditable: boolean;
  }) => {
    const { setFieldValue } = useFormikContext<DailyWorkReportFormValues>();

    const updateTimeTaken = useCallback(
      (start_time: Dayjs | null, end_time: Dayjs | null) => {
        let timeTaken = "";
        if (
          start_time &&
          dayjs.isDayjs(start_time) &&
          end_time &&
          dayjs.isDayjs(end_time)
        ) {
          const duration = end_time.diff(start_time, "minute");
          if (duration >= 0) {
            timeTaken = `${duration}`;
          }
        }
        setFieldValue(`tasks[${globalIndex}].timeTaken`, timeTaken);
      },
      [setFieldValue, globalIndex]
    );
    const stripHtml = (html: string): string => {
      if (!html) return '';
      return html
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/ +/g, " ")
        .replace(/<br\s*\/?>/gi, "\n");
    };

    const formatTime = (minutes: number | string) => {
      const total = parseInt(minutes as string, 10);
      if (isNaN(total)) return "0 mins";
      const hours = Math.floor(total / 60);
      const mins = total % 60;
      if (hours >= 1) {
        return `${hours} hr ${mins} mins`;
      }
      return `${mins} mins`;
    };
    return (
      <TableRow
        sx={{
          bgcolor: taskIndex % 2 === 0 ? '#fff' : '#f8f9fa',
          '&:hover': { bgcolor: 'rgba(227, 242, 253, 0.5)' },
        }}
      >
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '15%' }}>
          <FastField name={`tasks[${globalIndex}].task_name`}>
            {({ field, meta }: any) => (
              <TextField
                {...field}
                fullWidth
                multiline
                placeholder="Enter task name"
                error={meta.touched && Boolean(meta.error)}
                helperText={meta.touched && meta.error}
                variant="standard"
                slotProps={{
                  input: {
                    readOnly: !reportEditable,
                  },
                }}
                sx={{
                  fontSize: '0.75rem',
                  '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
                  '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottom: 'none',
                  },
                }}
              />
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '40%' }}>
          <FastField name={`tasks[${globalIndex}].description`}>
            {({ field, meta }: any) => (
              <TextField
                {...field}
                fullWidth
                multiline
                placeholder="Enter description"
                error={meta.touched && Boolean(meta.error)}
                helperText={meta.touched && meta.error}
                variant="standard"
                minRows={1}
                value={stripHtml(field.value)}
                slotProps={{
                  input: {
                    readOnly: !reportEditable,
                  },
                }}
                sx={{
                  fontSize: '0.75rem',
                  resize: 'vertical',
                  '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem', resize: 'vertical' },
                  '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottom: 'none',
                  },
                }}
                InputProps={{ inputComponent: 'textarea' }}
              />
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '9%' }}>
          <FastField name={`tasks[${globalIndex}].status`}>
            {({ field, meta }: any) => (
              <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
                <Select
                  {...field}
                  variant="standard"
                  displayEmpty
                  slotProps={{
                    input: {
                      readOnly: !reportEditable,
                    },
                  }}
                  sx={{
                    fontSize: '0.75rem',
                    padding: '1px 4px',
                    '&:before, &:after, &:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                  }}
                >
                  <MenuItem value="" disabled selected sx={{ fontSize: '0.75rem' }}>
                    Status
                  </MenuItem>
                  <MenuItem value="pending" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
                  <MenuItem value="in_progress" sx={{ fontSize: '0.75rem' }}>In Progress</MenuItem>
                  <MenuItem value="completed" sx={{ fontSize: '0.75rem' }}>Completed</MenuItem>
                </Select>
                {meta.touched && meta.error && (
                  <FormHelperText sx={{ fontSize: '0.65rem' }}>{meta.error}</FormHelperText>
                )}
              </FormControl>
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, width: '9%' }}>
          <FastField name={`tasks[${globalIndex}].start_time`}>
            {({ field, meta }: any) => (
              <Box
                sx={{
                  pointerEvents: !reportEditable ? 'none' : 'auto',
                  opacity: 1,
                }}
              >
                <TimePicker
                  value={field.value}
                  onChange={(value) => {
                    setFieldValue(field.name, value);
                    updateTimeTaken(value, task.end_time);
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'standard',
                      placeholder: 'HH:MM',
                      error: meta.touched && Boolean(meta.error),
                      helperText: meta.touched && meta.error,
                      sx: {
                        fontSize: '0.75rem',
                        '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1rem',
                        },
                        '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
                        '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottom: 'none',
                        },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, width: '9%' }}>
          <FastField name={`tasks[${globalIndex}].end_time`}>
            {({ field, meta }: any) => (
              <Box
                sx={{
                  pointerEvents: !reportEditable ? 'none' : 'auto',
                  opacity: 1,
                }}
              >
                <TimePicker
                  value={field.value}
                  onChange={(value) => {
                    setFieldValue(field.name, value);
                    updateTimeTaken(task.start_time, value);
                  }}
                  // disabled={!reportEditable}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'standard',
                      placeholder: 'HH:MM',
                      error: meta.touched && Boolean(meta.error),
                      helperText: meta.touched && meta.error,
                      sx: {
                        fontSize: '0.75rem',
                        '& .MuiSvgIcon-root': {
                          fontSize: '1rem',
                        },
                        '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
                        '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
                        '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottom: 'none',
                        },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '5%' }}>
          <FastField name={`tasks[${globalIndex}].timeTaken`}>
            {({ field, meta }: any) => (
              <TextField
                {...field}
                value={formatTime(field.value)}
                fullWidth
                type="text"
                variant="standard"
                InputProps={{ readOnly: true }}
                placeholder="Minutes"
                error={meta.touched && Boolean(meta.error)}
                helperText={meta.touched && meta.error}
                slotProps={{
                  input: {
                    readOnly: !reportEditable,
                  },
                }}
                sx={{
                  fontSize: '0.75rem',
                  '& .MuiInputBase-input': { padding: '1px 4px', fontSize: '0.75rem' },
                  '& .MuiInputBase-input::placeholder': { fontSize: '0.75rem', color: '#757575', opacity: 1 },
                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottom: 'none',
                  },
                }}
              />
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ borderRight: '1px solid #e8ecef', py: 0.2, px: 0.4, width: '5%' }}>
          <FastField name={`tasks[${globalIndex}].eta`}>
            {({ field, meta }: any) => (
              <TextField
                type="number"
                {...field}
                value={field.value ?? ''}
                fullWidth
                variant="standard"
                placeholder="ETA (in mins)"
                error={meta.touched && Boolean(meta.error)}
                helperText={meta.touched && meta.error}
                slotProps={{
                  input: {
                    readOnly: !reportEditable,
                  },
                }}
                sx={{
                  fontSize: '0.75rem',
                  '& .MuiInputBase-input': {
                    padding: '1px 4px',
                    fontSize: '0.75rem',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontSize: '0.75rem',
                    color: '#757575',
                    opacity: 1,
                  },
                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottom: 'none',
                  },
                }}
              />
            )}
          </FastField>
        </TableCell>
        <TableCell sx={{ py: 0.2, px: 0.4, width: '5%' }}>
          <Box sx={{ display: 'flex', gap: 0.2 }}>
            <IconButton
              aria-label="Remove task"
              onClick={() => removeTask(globalIndex)}
              disabled={projectTasks.length === 1}
              sx={{ color: '#ff4d4f', padding: '2px', '&:hover': { color: '#d32f2f' } }}
            >
              <RemoveCircleOutline sx={{ fontSize: '0.95rem' }} />
            </IconButton>
            <IconButton
              aria-label="Add task"
              onClick={() => addTask({ ...defaultTask, project_id: projectId })}
              sx={{ color: '#2e7d32', padding: '2px', '&:hover': { color: '#1b5e20' } }}
            >
              <AddCircleOutline sx={{ fontSize: '0.95rem' }} />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.task === nextProps.task &&
      prevProps.taskIndex === nextProps.taskIndex &&
      prevProps.globalIndex === nextProps.globalIndex &&
      prevProps.projectId === nextProps.projectId &&
      prevProps.projectTasks.length === nextProps.projectTasks.length
    );
  }
);

const ProjectSection = React.memo(
  ({ projectId, projects, toggleProject, removeProject, expandedProjects, reportEditable }: {
    projectId: string;
    projects: { id: string; title: string }[];
    toggleProject: (projectId: string) => void;
    removeProject: (projectId: string) => void;
    expandedProjects: { [key: string]: boolean };
    reportEditable: boolean;
  }) => {
    const { values } = useFormikContext<DailyWorkReportFormValues>();
    const project = projects.find((p) => p.id === projectId);
    const projectTasks = values.tasks.filter((task) => task.project_id === projectId);
    const taskIndices = values.tasks
      .map((task, idx) => (task.project_id === projectId ? idx : -1))
      .filter((idx) => idx !== -1);
    const isExpanded = !!expandedProjects[projectId];

    return (
      <>
        <TableRow sx={{ bgcolor: '#e8ecef' }}>
          <TableCell colSpan={8} sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" onClick={() => toggleProject(projectId)} sx={{ color: '#1a237e', mr: 1 }}>
                  <Add
                    sx={{
                      fontSize: '0.75rem',
                      transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                </IconButton>
                <Typography sx={{ fontSize: '0.8rem', color: '#1a237e' }}>
                  {project?.title || 'Unknown Project'}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => removeProject(projectId)}
                sx={{ color: '#ff4d4f', '&:hover': { color: '#d32f2f' } }}
              >
                <Delete sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={8} sx={{ p: 0 }}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ border: '1px solid #e8ecef', bgcolor: 'white' }}>
                <FieldArray name="tasks">
                  {({ remove, push }: any) => (
                    <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                      <TableBody>
                        {projectTasks.map((task, taskIndex) => (
                          <TaskRow
                            key={taskIndices[taskIndex]}
                            task={task}
                            taskIndex={taskIndex}
                            globalIndex={taskIndices[taskIndex]}
                            projectId={projectId}
                            projectTasks={projectTasks}
                            removeTask={remove}
                            addTask={push}
                            reportEditable={reportEditable}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </FieldArray>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.projectId === nextProps.projectId &&
      prevProps.expandedProjects[prevProps.projectId] === nextProps.expandedProjects[nextProps.projectId]
    );
  }
);

const DailyWorkReportForm = () => {
  const [hasLeave, setHasLeave] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [initialReportingUsers, setInitialReportingUsers] = useState<User[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<{ [key: string]: boolean }>({});
  const [reportAlreadyAdded, setReportAlreadyAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status
  const [Functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const axiosInstance = createAxiosInstance();
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const authData = useAppselector((state) => state.auth.value);
  const userId = authData?.user?.id;
  const today = dayjs();
  const savedFormData = localStorage.getItem('unsavedFormData') || null;
  const parsedData: DailyWorkReportFormValues | null = savedFormData
    ? JSON.parse(savedFormData, (key, value) =>
      ['reportDate', 'officein', 'officeout', 'eta', 'start_time', 'end_time'].includes(key) && value
        ? dayjs(value)
        : value
    )
    : null;

  const defaultOfficeIn: Dayjs = dayjs().hour(9).minute(0).second(0);
  const defaultOfficeOut: Dayjs = dayjs() || dayjs().hour(18).minute(30).second(0);

  const isReportsEditable = Functionalities.some(
    (f) => f.key === "reports_editable" && f.is_enabled
  );

  const initialValues: DailyWorkReportFormValues = {
    reportDate: parsedData?.reportDate || today,
    officein: parsedData?.officein || defaultOfficeIn,
    officeout: parsedData?.officeout || defaultOfficeOut,
    leave: parsedData?.leave ?? '',
    tasks: parsedData?.tasks || [],
  };

  const formik = useFormik<DailyWorkReportFormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true); // Disable submit button
      const payload = {
        officein: values.officein?.toISOString(),
        officeout: values.officeout?.toISOString(),
        leave: values.leave,
        tasks: values.tasks.map((task) => ({
          project_id: task.project_id,
          task_name: task.task_name,
          description: task.description,
          eta: task.eta,
          status: task.status,
          start_time: task.start_time?.toISOString(),
          end_time: task.end_time?.toISOString(),
          time_taken: Number(task?.timeTaken) || 0,
        })),
      };

      try {
        await axiosInstance.post('/work-logs', payload);
        toast.success('Report submitted!');
        localStorage.removeItem('unsavedFormData');
        resetForm();
        setSelectedProjects([]);
        setExpandedProjects({});
      } catch (error) {
        toast.error('Submission failed!');
      } finally {
        setIsSubmitting(false); // Re-enable submit button
      }
    },
  });

  const addNewProject = useCallback(
    (projectId: string) => {
      if (projectId && !selectedProjects.includes(projectId)) {
        setSelectedProjects((prev) => [...prev, projectId]);
        formik.setFieldValue('tasks', [
          ...formik.values.tasks,
          { ...defaultTask, project_id: projectId },
        ]);
        setExpandedProjects((prev) => ({ ...prev, [projectId]: true }));
      }
    },
    [formik, selectedProjects]
  );

  const removeProject = useCallback(
    (projectId: string) => {
      formik.setFieldValue(
        'tasks',
        formik.values.tasks.filter((task) => task.project_id !== projectId)
      );
      setSelectedProjects((prev) => prev.filter((id) => id !== projectId));
      setExpandedProjects((prev) => {
        const { [projectId]: _, ...rest } = prev;
        return rest;
      });
    },
    [formik]
  );

  const toggleProject = useCallback(
    (projectId: string) => {
      setExpandedProjects((prev) => ({
        ...prev,
        [projectId]: !prev[projectId],
      }));
    },
    []
  );

  const resetTasks = useCallback(() => {
    formik.setFieldValue('tasks', []);
    setSelectedProjects([]);
    setExpandedProjects({});
    localStorage.removeItem('unsavedFormData');
  }, [formik]);

  const handleSaveToLocalStorage = useCallback(() => {
    const { officein, officeout, leave, tasks } = formik.values;
    const hasValidTask = tasks.some((task: any) =>
      ['project_id', 'task_name', 'description', 'status', 'remark'].some(
        (key) => (task[key]?.trim?.() ?? '') !== ''
      ) || task.eta !== null
    );

    if (officein || officeout || leave || hasValidTask) {
      localStorage.setItem('unsavedFormData', JSON.stringify(formik.values));
      toast.success('Data saved!');
    } else {
      toast.error('Nothing to save.');
    }
  }, [formik]);
  const fetchFunctionalities = async () => {
    try {
      const res = await axiosInstance.get("/functionality/get-all");
      console.log("Fetch Functionalities response:", res.data);
      if (res.data.status !== "success") throw new Error("Failed to fetch Functionalities");
      setFunctionalities(res.data.data || []);
    } catch (error) {
      console.error("Error fetching Functionalities:", error.response?.data, error.message);
      toast.error(error?.response?.data?.message || "Failed to fetch Functionalities");
    } finally {
    }
  };
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get(`/project-management/user-projects/${userId}`);
        setProjects(res.data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
    fetchFunctionalities();
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const today = new Date();
        const res = await axiosInstance.get(
          `/task-maangement/by-user/${userId}?moved_date=${today}`
        );
        console.log("task submission", res.data);

        // Check if response indicates report already added
        if (res.data === "Report already added for today") {
          setReportAlreadyAdded(true);
          return; // Exit early, no further changes
        }

        const tickets = res.data?.tickets || [];
        const newTasks: Task[] = [];
        const newSelectedProjects = new Set<string>();
        const newExpandedProjects: { [key: string]: boolean } = {};

        tickets.forEach((ticket: any) => {
          const projectId = ticket.project.id;
          const status =
            ticket.status === "testable" || ticket.status === "completed"
              ? "completed"
              : "in_progress";

          const completedSubtaskDescriptions =
            ticket.subTasks
              ?.filter((sub: any) => sub.status === "completed" && sub.description)
              .map((sub: any) => sub.description)
              .join("\n") || "";

          const finalDescription = [
            ticket.description,
            completedSubtaskDescriptions,
          ]
            .filter(Boolean)
            .join("\nSubtasks: ");

          const periods = ticket.timeTakenPeriods?.length
            ? ticket.timeTakenPeriods
            : [null];

          periods.forEach((period: any, index: number) => {
            newTasks.push({
              ...defaultTask,
              project_id: projectId,
              task_name:
                periods.length > 1
                  ? `${ticket.title} (Session ${index + 1})`
                  : ticket.title,
              description: finalDescription,
              status,
              ...(period && {
                start_time: period.start_time ? dayjs(period.start_time) : null,
                end_time: period.end_time ? dayjs(period.end_time) : null,
                timeTaken: period.time_taken,
              }),
            });
          });

          newSelectedProjects.add(projectId);
          newExpandedProjects[projectId] = true;
          newTasks.sort((a, b) => {
            const aTime = a.start_time ? dayjs(a.start_time).valueOf() : Infinity;
            const bTime = b.start_time ? dayjs(b.start_time).valueOf() : Infinity;
            return aTime - bTime;
          });
        });

        if (newTasks.length > 0) {
          const existingTasks = formik.values.tasks;
          const uniqueTasks = newTasks.filter(
            (newTask) =>
              !existingTasks.some(
                (task) =>
                  task.project_id === newTask.project_id &&
                  task.task_name === newTask.task_name &&
                  task.description === newTask.description
              )
          );
          formik.setFieldValue('tasks', [...existingTasks, ...uniqueTasks]);
          setSelectedProjects(Array.from(newSelectedProjects));
          setExpandedProjects(newExpandedProjects);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        toast.error('Failed to fetch ticket data.');
      }
    };

    if (userId) {
      fetchTickets();
    }
  }, []);

  const handleOpenDialog = async () => {
    setOpenDialog(true);
    setIsSubmitting(true);
    try {
      const [usersRes, reportingUsersRes] = await Promise.all([
        axiosInstance.get(`/user/list`),  // or tenant-based fetch
        axiosInstance.get(`/user/reporting-users/${userId}`),
      ]);

      setAvailableUsers(usersRes.data.data || []);
      setInitialReportingUsers((reportingUsersRes.data.data || []).map((u: User) => u.id));
      setSelectedUsers((reportingUsersRes.data.data || []).map((u: User) => u.id));
    } catch (err) {
      console.error("Failed to open dialog:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUsers([]);
    setInitialReportingUsers([]);
  };
  const isDirty = JSON.stringify(selectedUsers) !== JSON.stringify(initialReportingUsers);

  const handleSave = async () => {
    const reporting_users = selectedUsers
      .map((id) => availableUsers.find((u) => u.id === id))
      .filter(Boolean)
      .map((u) => ({
        id: u!.id,
        first_name: u!.first_name,
        last_name: u!.last_name,
        email: u!.email,
      }));

    try {
      await axiosInstance.patch(`/user/reporting-users/${userId}`, { reporting_users });
      toast.success('Reporting users updated successfully');
      handleCloseDialog();
    } catch (err) {
      console.error("Failed to update reporting users", err);
      toast.error("Failed to update reporting users");
    }
  };


  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axiosInstance.get(`/user/list`);
      setAvailableUsers(res.data.data);
    };
    fetchUsers();
  }, []);


  return (
    <>
      <FormikProvider value={formik}>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            bgcolor: 'linear-gradient(135deg, #e8ecef 0%, #f8f9fa 100%)',
            width: '100%',
          }}
        >
          <Card
            sx={{
              width: '100%',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              p: 2,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'var(--primary-1-text-color)',
                    letterSpacing: '0.5px',
                  }}
                >
                  Daily Work Report
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: 'var(--primary-1-text-color)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    CC
                  </Typography>
                  <IconButton
                    aria-label="Add CC user"
                    onClick={handleOpenDialog}
                    sx={{
                      "&:hover": {
                        backgroundColor: "var(--primary-color-1)",
                        color: "white",
                      },
                      transition: "all 0.3s",
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
              {reportAlreadyAdded ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid #e8ecef',
                    p: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#1a237e',
                      fontWeight: 500,
                      mb: 2,
                    }}
                  >
                    Report Already Added for Today
                  </Typography>
                  <Typography
                    sx={{
                      color: '#424242',
                      fontSize: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    You have already submitted a daily work report for today. Please check back tomorrow or contact support if you need assistance.
                  </Typography>
                </Box>
              ) : (
                <form onSubmit={formik.handleSubmit}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 3,
                        alignItems: 'center',
                        mb: 2,
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        border: '1px solid #e8ecef',
                        width: '100%',
                      }}
                    >
                      <Field name="officein">
                        {({ field, meta }: any) => (
                          <TimePicker
                            value={field.value}
                            onChange={(value) => formik.setFieldValue('officein', value)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                variant: 'standard',
                                error: meta.touched && Boolean(meta.error),
                                helperText: meta.touched && meta.error,
                                sx: {
                                  width: 100,
                                  fontSize: '0.8rem',
                                  '& .MuiInputBase-input': { padding: '2px 4px', fontSize: '0.7rem' },
                                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                    borderBottom: 'none',
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </Field>
                      <Field name="officeout">
                        {({ field, meta }: any) => (
                          <TimePicker
                            value={field.value}
                            onChange={(value) => formik.setFieldValue('officeout', value)}
                            slotProps={{
                              textField: {
                                size: 'small',
                                variant: 'standard',
                                error: meta.touched && Boolean(meta.error),
                                helperText: meta.touched && meta.error,
                                sx: {
                                  width: 100,
                                  fontSize: '0.8rem',
                                  '& .MuiInputBase-input': { padding: '2px 4px', fontSize: '0.7rem' },
                                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                    borderBottom: 'none',
                                  },
                                },
                              },
                            }}
                          />
                        )}
                      </Field>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={hasLeave}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setHasLeave(isChecked);
                              if (!isChecked) formik.setFieldValue('leave', '');
                            }}
                            sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: 16 } }}
                          />
                        }
                        label="Leave?"
                        sx={{
                          fontSize: '0.8rem',
                          color: '#424242',
                          m: 0,
                          '& .MuiFormControlLabel-label': { fontSize: '0.8rem' },
                        }}
                      />
                      {hasLeave && (
                        <Box sx={{ flex: 1 }}>
                          <Field name="leave">
                            {({ field }: any) => (
                              <TextField
                                {...field}
                                fullWidth
                                size="small"
                                variant="standard"
                                placeholder="Reason for leave"
                                sx={{
                                  fontSize: '0.8rem',
                                  '& .MuiInputBase-input': { padding: '2px 4px', fontSize: '0.8rem' },
                                  '& .MuiInput-underline:before, & .MuiInput-underline:after, & .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                    borderBottom: 'none',
                                  },
                                }}
                              />
                            )}
                          </Field>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Select
                        value=""
                        onChange={(e) => addNewProject(e.target.value as string)}
                        displayEmpty
                        renderValue={() => 'Add Project'}
                        size="small"
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          '& .MuiSelect-select': { padding: '4px 8px' },
                          '&:before, &:after, &:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select a Project
                        </MenuItem>
                        {projects
                          .filter((p) => !selectedProjects.includes(p.id))
                          .map((project) => (
                            <MenuItem key={project.id} value={project.id} sx={{ fontSize: '0.75rem' }}>
                              {project.title}
                            </MenuItem>
                          ))}
                      </Select>
                    </Box>

                    <TableContainer
                      component={Paper}
                      sx={{
                        maxHeight: '60vh',
                        minHeight: '400px',
                        border: '1px solid #e8ecef',
                        borderRadius: 2,
                        bgcolor: 'white',
                        width: '100%',
                      }}
                    >
                      {selectedProjects.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', py: 2, color: '#424242' }}>
                          No projects selected. Add a project to start.
                        </Typography>
                      ) : (
                        <Table sx={{ width: '100%', tableLayout: 'fixed' }} stickyHeader>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f1f3f5' }}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '15%' }}><RequiredLabel label="Task" /></TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '45%' }}><RequiredLabel label="Description" /></TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '10%' }}><RequiredLabel label="Status" /></TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '7%' }}>Start</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '7%' }}>End</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '6%' }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '8%' }}>ETA(min)</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: '4%' }}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedProjects.map((projectId) => (
                              <ProjectSection
                                key={projectId}
                                projectId={projectId}
                                projects={projects}
                                toggleProject={toggleProject}
                                removeProject={removeProject}
                                expandedProjects={expandedProjects}
                                reportEditable={isReportsEditable}
                              />
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TableContainer>

                    {formik.touched.tasks && formik.errors.tasks && typeof formik.errors.tasks === 'string' && (
                      <Typography color="error" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        {formik.errors.tasks}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                      <IconButton
                        onClick={resetTasks}
                        sx={{
                          bgcolor: 'var(--primary-color-2)',
                          color: 'white',
                          p: 1,
                          '&:hover': { bgcolor: 'var(--primary-color-1)' },
                        }}
                      >
                        <Tooltip title="Reset">
                          <Refresh sx={{ fontSize: '1rem' }} />
                        </Tooltip>
                      </IconButton>
                      {/* <IconButton
                      onClick={handleSaveToLocalStorage}
                      sx={{
                        bgcolor: 'var(--primary-color-2)',
                        color: 'white',
                        p: 1,
                        '&:hover': { bgcolor: 'var(--primary-color-1)' },
                      }}
                    >
                      <Tooltip title="Save">
                        <Save sx={{ fontSize: '1rem' }} />
                      </Tooltip>
                    </IconButton> */}
                      <IconButton
                        type="submit"
                        disabled={isSubmitting || !formik.dirty} // Disable button during submission
                        sx={{
                          bgcolor: isSubmitting ? 'grey.500' : 'var(--primary-color-1)', // Grey when disabled
                          color: 'white',
                          p: 1,
                          '&:hover': { bgcolor: isSubmitting ? 'grey.500' : 'var(--primary-color-1)' },
                          '&:disabled': {
                            bgcolor: 'grey.300'
                          }
                        }}
                      >
                        <Tooltip title="Submit">
                          <Send sx={{ fontSize: '1rem' }} />
                        </Tooltip>
                      </IconButton>
                    </Box>
                  </LocalizationProvider>
                </form>
              )}
            </CardContent>
          </Card>
        </Box>
      </FormikProvider>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "var(--primary-color-1)",
            color: "#FFFFFF",
            mb: 2,
            textAlign: "center",
            background: "linear-gradient(90deg, var(--primary-color-1), var(--primary-color-2))",
            p: 1.5,
          }}
        >
          Select Reporting Users
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <Autocomplete
              multiple
              id="reporting-users"
              options={availableUsers.filter((user) => !selectedUsers.includes(user.id))} // Filter out selected users
              getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
              filterOptions={(options, { inputValue }) =>
                options.filter(
                  (user) =>
                    user.first_name.toLowerCase().includes(inputValue.toLowerCase()) ||
                    user.last_name.toLowerCase().includes(inputValue.toLowerCase()) ||
                    user.email.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
              value={availableUsers.filter((u) => selectedUsers.includes(u.id))}
              onChange={(event, newValue) => {
                setSelectedUsers(newValue.map((user) => user.id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder={selectedUsers.length === 0 ? "Search users..." : ""}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      "& fieldset": {
                        borderColor: "var(--primary-color-1)", // Forest green border
                      },
                      "&:hover fieldset": {
                        borderColor: "var(--primary-color-2)", // Berry pink on hover
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "var(--primary-color-1)", // Forest green when focused
                      },
                    },
                    "& .MuiInputBase-input": {
                      fontFamily: "'Roboto', sans-serif",
                      color: "var(--text-color)",
                    },
                  }}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((user, index) => {
                  const { key, ...otherProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={user.id} // Explicitly set key
                      label={`${user.first_name} ${user.last_name}`}
                      {...otherProps} // Spread remaining props (excluding key)
                      sx={{
                        borderRadius: "8px",
                        backgroundColor: "var(--primary-bg-colors)", // Pale creamy green
                        color: "var(--primary-1-text-color)", // Darker green text
                        "& .MuiChip-deleteIcon": {
                          color: "var(--primary-color-2)", // Berry pink delete icon
                          "&:hover": {
                            color: "#B0004A", // Darker pink on hover
                          },
                        },
                      }}
                    />
                  );
                })
              }
              renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props; // Already fixed
                return (
                  <li
                    key={option.id}
                    {...otherProps}
                    style={{ fontFamily: "'Roboto', sans-serif", color: "var(--text-color)" }}
                  >
                    {`${option.first_name} ${option.last_name} (${option.email})`}
                  </li>
                );
              }}
              sx={{
                "& .MuiAutocomplete-popupIndicator": {
                  color: "var(--primary-color-1)", // Forest green for dropdown arrow
                },
                "& .MuiAutocomplete-clearIndicator": {
                  color: "var(--primary-color-2)", // Berry pink for clear icon
                },
              }}
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={isSubmitting}
            sx={{
              color: "var(--primary-color-1)",
              fontFamily: "'Roboto', sans-serif",
              "&:hover": {
                backgroundColor: "var(--primary-bg-colors)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: "var(--primary-color-1)",
              color: "#FFFFFF",
              fontFamily: "'Roboto', sans-serif",
              "&:hover": {
                bgcolor: "var(--primary-color-2)",
              },
              "&.Mui-disabled": {
                bgcolor: "#B0BEC5",
                color: "#FFFFFF",
              },
            }}
            onClick={handleSave}
            disabled={isSubmitting || !isDirty}
          >
            {selectedUsers.length == 0 ? "Proceed without CC" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DailyWorkReportForm;