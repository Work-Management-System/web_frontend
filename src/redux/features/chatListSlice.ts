import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import createAxiosInstance from "@/app/axiosInstance";

type ActiveChat = {
    _id: string;
    userId: string;
    first_name: string;
    last_name: string;
    profileImage: string;
    lastMessage: string;
    lastMessageDate: string;
    isRead: boolean;
};

type InitialState = {
    chatList: ActiveChat[];
};

const initialState: InitialState = {
    chatList: [],
};

export const getChatListAsync: any = createAsyncThunk(
    "chat/list",
    async () => {
        try {
            const axiosInstance = createAxiosInstance();
            const apiRes = await axiosInstance.get(`/chat/active-chats`);
            return apiRes?.data?.data;
        } catch (error) {
            throw error;
        }
    }
);

const chatListSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getChatListAsync.fulfilled, (state, action: PayloadAction<ActiveChat[]>) => {
            state.chatList = action.payload;
        });
    },
});

export default chatListSlice.reducer;
