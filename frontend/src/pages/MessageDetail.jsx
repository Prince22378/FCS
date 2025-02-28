import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import moment from 'moment';
import api from '../api';
// import '../styles/Message.css';

const MessageDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [profile, setProfile] = useState(null);

    const user_id = JSON.parse(localStorage.getItem('ACCESS_TOKEN'))?.user_id;

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/${user_id}/${id}/`);
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 1000);
        return () => clearInterval(interval);
    }, [id, user_id]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/profile/${id}/`);
                setProfile(response.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, [id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await api.post('/messages/send/', {
                sender: user_id,
                receiver: id,
                message: newMessage,
            });
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="message-container">
            <div className="message-header">
                {profile && (
                    <div className="profile-info">
                        <img src={profile.image} alt={profile.full_name} className="profile-pic" />
                        <span>{profile.full_name || profile.username}</span>
                    </div>
                )}
            </div>
            <div className="message-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-item ${msg.sender.id === user_id ? 'sent' : 'received'}`}>
                        <p>{msg.message}</p>
                        <small>{moment.utc(msg.date).local().fromNow()}</small>
                    </div>
                ))}
            </div>
            <div className="message-input">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default MessageDetail;
