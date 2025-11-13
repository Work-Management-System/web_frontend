'use client';
import { getChatListAsync } from '@/redux/features/chatListSlice';
import { useAppselector } from '@/redux/store';
import { Avatar, Box, IconButton, Typography, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import socket from '@/utils/SocketConnection';

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);

const orangeText = 'var(--primary-2-text-color)';

function ChatList({ onUserSelect }) {
    const dispatch = useDispatch();
    const chatList = useAppselector((state) => state.chat.chatList);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChatId, setSelectedChatId] = useState(null);

    const { _id } = useAppselector(
        (state: any) => state.user.value
    );

    useEffect(() => {
        dispatch(getChatListAsync());
    }, [dispatch]);

    useEffect(() => {
        if (_id) {
            socket.emit('addUserToOnlineList', { _id });
        }

        return () => {
            socket.emit('removeUserFromOnlineList', { _id })
        };
    }, [])

    const handleUserSelect = (chat) => {
        setSelectedChatId(chat._id);
        onUserSelect(chat);
    };

    const formatMessageDate = (date) => {
        const now = dayjs();
        const messageDate = dayjs(date);

        if (messageDate.isSame(now, 'day')) {
            return messageDate.format('hh:mm A');
        } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
            return 'Yesterday';
        } else if (messageDate.isAfter(now.subtract(7, 'day'))) {
            return messageDate.format('dddd');
        } else {
            return messageDate.format('DD/MM/YYYY');
        }
    };

    const filteredChats = chatList.filter((chat) =>
        `${chat.first_name} ${chat.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ background: '#fff', height: '100vh' }}>
            <Typography variant='h3' sx={{ padding: '15px 15px 15px' }}>
                <strong>Chats</strong>
            </Typography>

            <Box sx={{ position: 'relative', margin: '0px 15px 7px' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        backgroundColor: '#F6F6F6',
                        borderRadius: '40px',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '40px',
                            paddingRight: '45px',
                            '& fieldset': { borderColor: '#ddd' },
                            '&:hover fieldset': { borderColor: orangeText },
                            '&.Mui-focused fieldset': { borderColor: orangeText },
                        },
                        '& .MuiInputBase-input': {
                            padding: '10px',
                            fontSize: '14px',
                            height: 'auto',
                        },
                    }}
                />
                <IconButton color="primary" sx={{ position: 'absolute', right: '3px', top: '50%', transform: 'translateY(-50%)' }}>
                    <SearchIcon sx={{ color: orangeText }} />
                </IconButton>
            </Box>

            {filteredChats.map((chat, index) => (
                <Box
                    className={`hover-box-active ${selectedChatId === chat._id ? 'active-hover-color' : ''}`}
                    key={chat?._id}
                    onClick={() => handleUserSelect(chat)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0px 15px',
                    }}
                >
                    <Box
                        className="list-botton"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            borderBottom: index !== filteredChats.length - 1 ? '1px solid #ddd' : 'none',
                            padding: '15px 0px',
                        }}
                    >
                        <Avatar src={chat?.profileImage} sx={{ bgcolor: orangeText, height: '40px', width: '40px' }} />
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <Typography variant='h4' sx={{ color: orangeText, fontSize: '14px', lineHeight: '1' }}>
                                    {chat?.first_name} {chat?.last_name}
                                </Typography>
                                <Typography sx={{ color: '#333333', fontSize: '12px' }}>
                                    {formatMessageDate(chat.lastMessageDate)}
                                </Typography>
                            </Box>
                            <Typography
                                sx={{
                                    color: '#333333',
                                    fontSize: '12px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: 3,
                                    maxHeight: '4.5em',
                                }}
                            >
                                {chat.lastMessage.length > 35
                                    ? `${chat.lastMessage.slice(0, 35)}...`
                                    : chat.lastMessage}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

export default ChatList;