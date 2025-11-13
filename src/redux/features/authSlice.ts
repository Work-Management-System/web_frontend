import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type User = {
  id: number;
  email: string;
  phone: string;
};

type Tenant = {
  id: string | null;
  tenant_name: string | null;
  schema_name: string | null;
  subdomain: string | null;
  background_image: string | null;
  address: string | null;
  welcome_note: string | null;
  login_process: string | null;
};

type Role = {
  id: string;
};

export type AuthState = {
  user: User;
  tenant: Tenant;
  role: Role;
  token: string;
  iat: number;
  exp: number;
};

const initialState: { value: AuthState } = {
  value: {
    user: {
      id: 0,
      email: '',
      phone: '',
    },
    tenant: {
      id: '',
      tenant_name: '',
      schema_name: '',
      subdomain: '',
      background_image: '',
      address: '',
      welcome_note: '',
      login_process: '',
    },
    role: {
      id: '',
    },
    token: '',
    iat: 0,
    exp: 0,
  },
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthDetails: (state, action: PayloadAction<AuthState>) => {
      state.value = action.payload;
    },
    logout: (state) => {
      state.value = initialState.value;
    },
  },
});

export const { setAuthDetails, logout } = authSlice.actions;
export default authSlice.reducer;
