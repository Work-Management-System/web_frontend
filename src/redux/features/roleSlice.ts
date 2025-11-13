import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define permission structure
type Permission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

// Define each module's structure
type RoleModule = {
  key: string;
  name: string;
  permissions: Permission;
};

// Complete role object
export type Role = {
  id: string;
  name: string;
  tag: string;
  is_protected: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  description: string;
  modules: RoleModule[];
  priority: number;
};

// Define your slice state
const initialState: { value: Role } = {
  value: {
    id: '',
    name: '',
    tag: '',
    is_protected: false,
    is_visible: false,
    created_at: '',
    updated_at: '',
    description: '',
    modules: [],
    priority:0
  },
};

export const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    setRoleDetails: (state, action: PayloadAction<Role>) => {
      state.value = action.payload;
    },
    logout: (state) => {
      state.value = initialState.value;
    },
  },
});

export const { setRoleDetails, logout } = roleSlice.actions;
export default roleSlice.reducer;
