import createAxiosInstance from "@/app/axiosInstance";

export interface DocumentUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
}

export interface ProjectDocument {
  id: string;
  title: string;
  content?: any;
  template_type: string;
  is_locked: boolean;
  default_permission: "view" | "comment" | "edit";
  created_by: DocumentUser;
  updated_by?: DocumentUser;
  locked_by?: DocumentUser;
  locked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentPermission {
  id: string;
  user: DocumentUser;
  permission: "view" | "comment" | "edit";
  granted_at: string;
  granted_by?: DocumentUser;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  change_summary?: string;
  created_by?: DocumentUser;
  version_created_at: string;
}

export interface DocumentTemplate {
  type: string;
  name: string;
  description: string;
}

export type PermissionLevel = "view" | "comment" | "edit";

// Create document
export const createDocument = async (
  projectId: string,
  title: string,
  template_type?: string
): Promise<ProjectDocument> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.post(`/project-documents/${projectId}`, {
    title,
    template_type: template_type || "blank",
  });
  return response.data.data;
};

// Get all documents for a project
export const getProjectDocuments = async (
  projectId: string,
  search?: string
): Promise<ProjectDocument[]> => {
  const axiosInstance = createAxiosInstance();
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  const response = await axiosInstance.get(
    `/project-documents/${projectId}?${params.toString()}`
  );
  return response.data.data;
};

// Get a single document
export const getDocument = async (
  projectId: string,
  documentId: string
): Promise<{ document: ProjectDocument; userPermission: PermissionLevel }> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get(
    `/project-documents/${projectId}/${documentId}`
  );
  return response.data.data;
};

// Update document
export const updateDocument = async (
  projectId: string,
  documentId: string,
  data: { title?: string; content?: any }
): Promise<ProjectDocument> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.patch(
    `/project-documents/${projectId}/${documentId}`,
    data
  );
  return response.data.data;
};

// Delete document
export const deleteDocument = async (
  projectId: string,
  documentId: string
): Promise<void> => {
  const axiosInstance = createAxiosInstance();
  await axiosInstance.delete(`/project-documents/${projectId}/${documentId}`);
};

// Lock/unlock document
export const lockDocument = async (
  projectId: string,
  documentId: string,
  is_locked: boolean,
  default_permission?: PermissionLevel
): Promise<ProjectDocument> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.patch(
    `/project-documents/${projectId}/${documentId}/lock`,
    { is_locked, default_permission }
  );
  return response.data.data;
};

// Get document permissions
export const getDocumentPermissions = async (
  projectId: string,
  documentId: string
): Promise<DocumentPermission[]> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get(
    `/project-documents/${projectId}/${documentId}/permissions`
  );
  return response.data.data;
};

// Set user permission
export const setUserPermission = async (
  projectId: string,
  documentId: string,
  user_id: string,
  permission: PermissionLevel
): Promise<DocumentPermission> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.post(
    `/project-documents/${projectId}/${documentId}/permissions`,
    { user_id, permission }
  );
  return response.data.data;
};

// Remove user permission
export const removeUserPermission = async (
  projectId: string,
  documentId: string,
  targetUserId: string
): Promise<void> => {
  const axiosInstance = createAxiosInstance();
  await axiosInstance.delete(
    `/project-documents/${projectId}/${documentId}/permissions/${targetUserId}`
  );
};

// Get version history
export const getVersionHistory = async (
  projectId: string,
  documentId: string
): Promise<DocumentVersion[]> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get(
    `/project-documents/${projectId}/${documentId}/versions`
  );
  return response.data.data;
};

// Create version snapshot
export const createVersion = async (
  projectId: string,
  documentId: string,
  change_summary?: string
): Promise<DocumentVersion> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.post(
    `/project-documents/${projectId}/${documentId}/versions`,
    { change_summary }
  );
  return response.data.data;
};

// Restore version
export const restoreVersion = async (
  projectId: string,
  documentId: string,
  versionId: string
): Promise<ProjectDocument> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.post(
    `/project-documents/${projectId}/${documentId}/versions/${versionId}/restore`
  );
  return response.data.data;
};

// Get templates
export const getTemplates = async (): Promise<DocumentTemplate[]> => {
  const axiosInstance = createAxiosInstance();
  const response = await axiosInstance.get("/project-documents/templates/list");
  return response.data.data;
};

