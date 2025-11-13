import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Role {
  id: string;
  name: string;
}

interface UserState {
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_delete: boolean;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  designation: string | null;
  department: string | null;
  joiningDate: string | null;
  employeeCode: string | null;
  role: Role | null;
  profile_image: string | null;
  emergency_contact: string | null;
  blood_group: string | null;
  gender: string | null;
  dob: string | null;
  currentStatus?: string; // Added currentStatus field
  offlineReason?: string; // Added offlineReason field
  reporting_manager?:string;
}
const defaultUser : UserState= {
  created_at: '',
  updated_at: '',
  is_active: true,
  is_delete: false,
  id: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: null,
  address: null,
  designation: null,
  department: null,
  joiningDate: null,
  employeeCode: null,
  role: {
    id: '',
    name: '',
  },
  profile_image: null,
  emergency_contact: null,
  blood_group: null,
  gender: null,
  dob: null,
  currentStatus: 'online', 
  offlineReason: '',
  reporting_manager:''
};



interface UserSliceState {
  user: UserState | null;
}

const initialState: UserSliceState = {
  user: defaultUser,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
     setCurrentStatus: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.currentStatus = action.payload;
      }  },
  },
});

export const { setUser, clearUser,setCurrentStatus } = userSlice.actions;
export default userSlice.reducer;
