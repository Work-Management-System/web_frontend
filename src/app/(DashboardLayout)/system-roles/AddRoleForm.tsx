import React from 'react';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, FormGroup, IconButton, Table, TableBody, TableCell,
  TableContainer, TableRow, TextField, Tooltip, Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { useFormik } from 'formik';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import createAxiosInstance from '@/app/axiosInstance';
import privilegeModules from '@/configs/Privileges';
import { useAppselector } from '@/redux/store';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/redux/store';
import { setRoleDetails } from '@/redux/features/roleSlice';

type PermissionType = 'create' | 'read' | 'update' | 'delete';

interface ModulePermission {
  name: string;
  key: string;
  permissions: Record<PermissionType, boolean>;
}

interface RoleFormValues {
  id: string;
  name: string;
  description: string;
  tag: string;
  is_visible: boolean;
  is_protected: boolean;
  modules: ModulePermission[];
}

const initialValues: RoleFormValues = {
  id: '',
  name: '',
  description: '',
  tag: '',
  is_visible: true,
  is_protected: false,
  modules: [],
};

interface RoleFormProps {
  open: boolean;
  handleClose: () => void;
  mode?: "add" | "edit";
  roleData?: RoleFormValues;
}
const systemRoles = [
  { label: 'SuperAdmin', value: 'SuperAdmin' },
  { label: 'Administrator', value: 'Administrator' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Employee', value: 'Employee' },
];
const tags = [
  { label: 'INTERNAL', value: 'INTERNAL' },
  { label: 'EXTERNAL', value: 'EXTERNAL' }

];
const AddRoleForm: React.FC<RoleFormProps> = ({ open, handleClose, mode, roleData }) => {
  const axiosInstance = createAxiosInstance();
  const dispatch = useDispatch<AppDispatch>();
  const currentUserRole = useAppselector((state) => state.role.value);
  
  const formik = useFormik<RoleFormValues>({
    initialValues: roleData || initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        let response;
        if (mode === 'edit') {
          response = await axiosInstance.patch(`/role-management/update/${roleData?.id}`, values);
          
          // Check if the updated role is the current user's role
          if (roleData?.id && roleData.id === currentUserRole?.id) {
            // Refetch the updated role and update Redux to sync menu automatically
            try {
              const updatedRoleResponse = await axiosInstance.get(`/role-management/get-one/${roleData.id}`);
              if (updatedRoleResponse.data?.status && updatedRoleResponse.data?.data) {
                const updatedRole = updatedRoleResponse.data.data;
                
                // Parse modules if it's a string (JSON)
                let modules = updatedRole.modules;
                if (typeof modules === 'string') {
                  try {
                    modules = JSON.parse(modules);
                  } catch (e) {
                    console.error('Failed to parse modules JSON:', e);
                    modules = [];
                  }
                }
                
                // Update the role with parsed modules
                const roleWithParsedModules = {
                  ...updatedRole,
                  modules: modules
                };
                
                dispatch(setRoleDetails(roleWithParsedModules));
                toast.success("Your role has been updated. Menu will refresh automatically.");
                
                // Force a small delay to ensure Redux state is updated before any navigation
                setTimeout(() => {
                  // Trigger a custom event to notify sidebar to refresh
                  window.dispatchEvent(new CustomEvent('roleUpdated'));
                }, 100);
              }
            } catch (refetchError) {
              console.error("Failed to refetch updated role:", refetchError);
              // Don't show error toast here, the main operation succeeded
            }
          }
        } else {
          delete values.id;
          response = await axiosInstance.post('/role-management/create', values);
          
          // If a new role was created and it matches the current user's role name,
          // we might need to refetch, but typically new roles aren't assigned immediately
          // So we'll skip auto-refetch for create operations
        }

        toast.success(response?.data?.message || "Operation successful");
        handleClose();
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || "Error submitting form";
        toast.error(errorMessage);
      }
    },
  });
  const handlePermissionChange = (
    moduleKey: string,
    action: PermissionType
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedModules = [...formik.values.modules];
    const existingModuleIndex = updatedModules.findIndex((mod) => mod.key === moduleKey);

    if (existingModuleIndex > -1) {
      updatedModules[existingModuleIndex].permissions[action] = event.target.checked;
    } else {
      const permissions: Record<PermissionType, boolean> = {
        create: false,
        read: false,
        update: false,
        delete: false,
        [action]: true,
      };
      updatedModules.push({
        name: moduleKey.replace(/_/g, ' '),
        key: moduleKey,
        permissions,
      });
    }

    formik.setFieldValue('modules', updatedModules);
  };
  const getPermissionValue = (
    moduleKey: string,
    action: PermissionType
  ): boolean => {
    const module = formik.values.modules.find((m) => m.key === moduleKey);
    return module?.permissions?.[action] ?? false;
  };
  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle sx={{ background: 'var(--primary-color-2)', color: '#fff' }}>
            {roleData ? 'Edit Role' : 'Add Role'}
            <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 10, top: 10 }}>
              <CloseIcon sx={{ color: '#fff' }} />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ maxHeight: 500 }}>
            <Box display="flex" gap={2} flexWrap="wrap" mb={2} mt={2}>
              <Box flex={2}>
                <Typography variant="subtitle2">Name</Typography>
                <TextField
                  fullWidth
                  name="name"
                  select
                  SelectProps={{ native: true }}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="" disabled>Select a Role</option>
                  {systemRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </TextField>
              </Box>
              <Box flex={2}>
                <Typography variant="subtitle2">Tag</Typography>
                <TextField
                  fullWidth
                  name="tag"
                  select
                  SelectProps={{ native: true }}
                  value={formik.values.tag}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {tags.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </TextField>
              </Box>
              <Box flex={1} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.is_visible}
                      onChange={(e) => formik.setFieldValue('is_visible', e.target.checked)}
                    />
                  }
                  label="Is Visible"
                />
              </Box>
              <Box flex={1} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.is_protected}
                      onChange={(e) => formik.setFieldValue('is_protected', e.target.checked)}
                    />
                  }
                  label="Is Protected"
                />
              </Box>
            </Box>
            <Box flex={2}>
              <Typography variant="subtitle2">Description</Typography>
              <TextField
                fullWidth
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter description"
              />
            </Box>
            <Box mt={3}>
              <Box display="flex" alignItems="center" justifyContent="flex-end" mb={1}>
                <Typography
                  sx={{ border: '1px solid var(--primary-1-text-color)', px: 2, py: 1, borderRadius: '20px', color: 'var(--primary-1-text-color)' }}
                >
                  Privileges
                </Typography>
                <Tooltip title="Check the box to give the privileges">
                  <InfoIcon sx={{ ml: 1, fontSize: 20, color: 'var(--primary-1-text-color)' }} />
                </Tooltip>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    {privilegeModules.map((module) => (
                      <TableRow key={module.key}>
                        <TableCell sx={{ fontWeight: 600 }}>{module.label}</TableCell>
                        {(['create', 'read', 'update', 'delete'] as PermissionType[]).map((action) =>
                          module.permissions.includes(action) ? (
                            <TableCell key={action}>
                              <FormGroup>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={getPermissionValue(module.key, action)}
                                      onChange={handlePermissionChange(module.key, action)}
                                    />
                                  }
                                  label={action}
                                />
                              </FormGroup>
                            </TableCell>
                          ) : (
                            <TableCell key={action}></TableCell>
                          )
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions sx={{ background: '#eee', justifyContent: 'flex-end', p: 2 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: '#1976d2', borderRadius: '30px' }}
            >
              Submit
            </Button>
            <Button
              variant="contained"
              sx={{ backgroundColor: '#f57c00', borderRadius: '30px' }}
              onClick={handleClose}
            >
              Discard
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Toaster position={'top-right'} toastOptions={{ className: 'react-hot-toast' }} gutter={2} />
    </>
  );
};

export default AddRoleForm;
