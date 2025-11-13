'use client'
import createAxiosInstance from '@/app/axiosInstance';
import { useAppselector } from '@/redux/store';
import { Avatar, Box, Typography, IconButton, styled, Badge, TextField, List, ListItem, useMediaQuery } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { BsFillSendFill } from 'react-icons/bs';
import { useDispatch } from 'react-redux';
import { getChatListAsync } from '@/redux/features/chatListSlice';
import socket from '@/utils/SocketConnection';
import dayjs from 'dayjs';
import Image from 'next/image';
import alumniDoodle from '@/assets/Images/doodle123.png';
import doodleBg from '@/assets/Images/doodle.jpg';


const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const orangeText = 'var(--primary-2-text-color)';


const StyledListItem = styled(ListItem)(({ theme }) => ({
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '8px 10px 12px',
    maxWidth: '70%',
    lineBreak: 'anywhere',
    marginBottom: '5px',

    '&:first-of-type': {
        marginTop: '0px',
    },
    '&:last-of-type': {
        marginBottom: '20px',
    }
}));

function ChatScreen({ selectedUser }) {
    const [message, setMessage] = useState('');
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [typingStatus, setTypingStatus] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<any>();
    const [users, setUsers] = useState<any>({});

    const messageContainerRef = useRef(null);
    const chatEndRef = useRef(null);
    const axiosInstance = createAxiosInstance();
    const dispatch = useDispatch();

    const { _id, profileImage, first_name, last_name } = selectedUser;
    const receiverId = _id || selectedUser.userId;


    const fetchChatHistory = async () => {
        try {
            const response = await axiosInstance.get(`/chat/chat-history?receiverId=${receiverId}&pageNumber=1&count=12`);
            const responseData = response?.data?.data;
            setReceivedMessages(responseData?.records);
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    const fetchOnlineUsers = async () => {
        try {
            const response = await axiosInstance.get(`/chat/online-users`);
            const responseData = response?.data?.data;
            setOnlineUsers(responseData);
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    };

    const markAsRead = () => {
        socket.emit('markAsRead', receiverId);
    };

    useEffect(() => {
        fetchChatHistory();
        fetchOnlineUsers();
        dispatch(getChatListAsync());
        markAsRead();

        const handleNewMessage = (newMessage) => {
            fetchChatHistory();
            dispatch(getChatListAsync());
        };

        const handleTyping = (data) => {
            setTypingStatus(data.isTyping ? `typing...` : '');
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('typing', handleTyping);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('typing', handleTyping);
        };
    }, [receiverId]);

    useEffect(() => {

        socket.on('onlineUsers', fetchOnlineUsers);

        return () => {
            socket.off('onlineUsers');
        };
    }, [])

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [receivedMessages, receiverId]);


    const sendMessage = (e) => {
        e.preventDefault();
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            return;
        }

        const payload = {
            receiverId,
            content: trimmedMessage,
        };

        socket.emit('sendMessage', payload);
        setMessage('');
    };


    const handleTyping = () => {
        socket.emit('typing', { receiverId, isTyping: true });
        setTimeout(() => {
            socket.emit('typing', { receiverId, isTyping: false });
        }, 2000);
    };

    function isUserOnline(receiverId) {
        const onlineUser = onlineUsers?.find(user => user.userId === receiverId);
        return !!onlineUser;
    }

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


    const Mobile = useMediaQuery('(max-width: 767px)');
    const smallMobile = useMediaQuery('(max-width: 575px)');
    const tablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
    const bigerTablet = useMediaQuery('(min-width: 1025px) and (max-width: 1199px)');

    return (
        <div>
            <Box sx={{ display: 'flex', alignItems: 'center', padding: '15px', background: '#f6f6f6', gap: '10px', position: 'absolute', top: '0', left: '0', right: '0', zIndex: 1 }}>
                <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    invisible={!isUserOnline(receiverId)}
                >
                    <Avatar src={profileImage || '/broken-image.jpg'} sx={{ height: '49px', width: '49px' }} />
                </StyledBadge>
                <Box>
                    <Typography variant='h4' sx={{ fontSize: '16px', color: orangeText }}>
                        {first_name} {last_name}
                    </Typography>
                    {typingStatus && <Typography variant="body2" sx={{ fontSize: '12px' }}>{typingStatus}</Typography>}
                </Box>
            </Box>

            <Box className="background-doodle" ref={messageContainerRef}
                sx={{
                    padding: '79px 0px 0px 20px',
                    marginBottom: '15px',
                    position: 'relative',
                    background: '#ddd',
                    overflowY: 'hidden',
                    ...Mobile && { mb: '0px', padding: '79px 0px 62px 20px', }
                }}>
                <Image src={alumniDoodle} alt="doodle" width={200} height={200} className='doodle-image-chat' layout='responsive'
                    style={{
                        position: 'absolute',
                        top: '0px',
                        left: '0px',
                        width: '100%',
                        height: '100%',
                        overflowY: 'hidden',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                <List sx={{
                    height: '66vh',
                    overflowY: 'auto',
                    paddingRight: '20px',
                    paddingTop: '20px',
                    zIndex: 11,
                    ...Mobile && { height: '76vh', zIndex: 1, },
                    ...tablet && { height: '76vh', zIndex: 1, }
                }}>
                    {receivedMessages?.slice().reverse().map((msg, index) => (
                        <>
                            {
                                msg?.content !== '' &&
                                <StyledListItem
                                    key={index}
                                    className={msg?.sendBy === 'you' ? 'you' : 'other'}
                                    sx={{
                                        alignSelf: msg?.sendBy === 'you' ? 'flex-end' : 'flex-start',
                                        backgroundColor: msg?.sendBy === 'you' ? '#d9fdd3' : '#fff',
                                        justifyContent: 'space-between',
                                        alignItems: 'end',
                                        position: 'relative',
                                    }}
                                >
                                    <Typography sx={{ fontSize: '14px' }}>
                                        {msg?.content}
                                    </Typography>
                                    <Box sx={{ position: 'absolute', bottom: '5px', right: '5px',...Mobile && { bottom: '3px' } }}>
                                        <span style={{
                                            marginLeft: '8px',
                                            width: 'auto',
                                            textAlign: 'right',
                                            display: 'flex',
                                            ...Mobile && { mt: '3px' }
                                        }}>
                                            <Typography sx={{
                                                color: '#333333',
                                                fontSize: '11px',
                                                ...Mobile && { fontSize: '10px', }
                                            }}>
                                                {formatMessageDate(msg.createdAt)}
                                            </Typography>
                                            {msg?.sendBy === 'you' && (
                                                <span
                                                    style={{
                                                        color: msg?.isRead ? 'green' : 'gray',
                                                        marginRight: '4px',
                                                        fontSize: '11px',
                                                        letterSpacing: '-3px',
                                                        ...Mobile && { fontSize: '10px', mt: '3px' }
                                                    }}
                                                >
                                                    ✔✔
                                                </span>
                                            )}
                                        </span>
                                    </Box>
                                </StyledListItem>
                            }
                        </>
                    ))}
                    <div ref={chatEndRef} />
                </List>
            </Box>

            <Box sx={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '15px', background: '#f6f6f6', zIndex: '1' }}>
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px', marginTop: '0px', alignItems: 'end' }}>
                    <TextField
                        fullWidth
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleTyping}
                        placeholder="Type your message..."
                        multiline={true}
                        rows={2}
                        sx={{
                            backgroundColor: '#fff',
                            borderRadius: '15px',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '15px',
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
                    <IconButton type="submit">
                        <BsFillSendFill style={{ transform: 'rotate(45deg)', color: '#ff8700' }} />
                    </IconButton>
                </form>
            </Box>
        </div>
    );
}

export default ChatScreen;
