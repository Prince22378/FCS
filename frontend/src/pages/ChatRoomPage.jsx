// // // import React, { useEffect, useState } from "react";
// // // import { useNavigate } from "react-router-dom";
// // // import { jwtDecode } from "jwt-decode";
// // // import api from "../api";
// // // import { ACCESS_TOKEN } from "../constants";
// // // import "../styles/ChatRoomPage.css";

// // // const ChatroomPage = () => {
// // //   const navigate = useNavigate();
// // //   const [friends, setFriends] = useState([]);
// // //   const [currentUserId, setCurrentUserId] = useState(null);
// // //   const [selectedFriend, setSelectedFriend] = useState(null);
// // //   const [messages, setMessages] = useState([]);
// // //   const [newMessage, setNewMessage] = useState("");

// // //   useEffect(() => {
// // //     const init = async () => {
// // //       try {
// // //         const token = localStorage.getItem(ACCESS_TOKEN);
// // //         if (!token) return navigate("/login");

// // //         const decoded = jwtDecode(token);
// // //         setCurrentUserId(decoded.user_id);

// // //         const res = await api.get("/api/friends/");
// // //         setFriends(res.data);
// // //       } catch (err) {
// // //         console.error("Error fetching chat data", err);
// // //       }
// // //     };
// // //     init();
// // //   }, [navigate]);

// // //   const selectFriend = async (friend) => {
// // //     if (!friend?.user?.id) {
// // //       console.error("Selected friend does not have a user ID:", friend);
// // //       return;
// // //     }
  
// // //     setSelectedFriend(friend);
// // //     try {
// // //       const res = await api.get(`/api/get-messages/${currentUserId}/${friend.user.id}/`);
// // //       setMessages(res.data || []);
// // //     } catch (err) {
// // //       console.error("Error loading messages", err);
// // //       setMessages([]); // prevent crash if something fails
// // //     }
// // //   };

// // //   const handleSend = async () => {
// // //     if (!newMessage.trim() || !selectedFriend) return;

// // //     const payload = {
// // //       sender: currentUserId,
// // //       reciever: selectedFriend.user.id,
// // //       message: newMessage.trim(),
// // //     };

// // //     try {
// // //       const res = await api.post("/api/send-messages/", payload);
// // //       setMessages((prev) => [...prev, res.data]);
// // //       setNewMessage("");
// // //     } catch (err) {
// // //       console.error("Error sending message", err);
// // //     }
// // //   };

// // //   return (
// // //     <div className="chatroom-container">
// // //       {/* Left Panel */}
// // //       <div className="chat-sidebar">
// // //         <h2>ChatApp</h2>
// // //         <input className="search-input" placeholder="Search your chat..." />

// // //         {friends.map((friend) => (
// // //           <div
// // //             key={friend.id}
// // //             className={`chat-friend ${
// // //               selectedFriend?.id === friend.id ? "active" : ""
// // //             }`}
// // //             onClick={() => selectFriend(friend)}
// // //           >
// // //             <div className="chat-avatar" />
// // //             <span>{friend.full_name}</span>
// // //           </div>
// // //         ))}
// // //       </div>

// // //       {/* Right Panel */}
// // //       <div className="chat-window">
// // //         <div className="chat-header">
// // //           {selectedFriend ? selectedFriend.full_name : "Username"}
// // //         </div>

// // //         <div className="chat-body">
// // //           {selectedFriend ? (
// // //             messages && messages.length > 0 ? (
// // //               messages.map((msg, i) => (
// // //                 <div
// // //                   key={i}
// // //                   className={`chat-message ${
// // //                     msg.sender === currentUserId ? "sent" : "received"
// // //                   }`}
// // //                 >
// // //                   {msg.message}
// // //                 </div>
// // //               ))
// // //             ) : (
// // //               <div className="no-chat">No chats yet. Type a new message...</div>
// // //             )
// // //           ) : (
// // //             <div className="select-user-message">Select a user to chat</div>
// // //           )}
// // //         </div>

// // //         {selectedFriend && (
// // //           <div className="chat-input-container">
// // //             <input
// // //               type="text"
// // //               placeholder="Type your message here..."
// // //               value={newMessage}
// // //               onChange={(e) => setNewMessage(e.target.value)}
// // //               onKeyDown={(e) => e.key === "Enter" && handleSend()}
// // //             />
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default ChatroomPage;


import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import "../styles/ChatRoomPage.css";

const ChatroomPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [friendTyping, setFriendTyping] = useState(false);
  const [friendImages, setFriendImages] = useState({});
  const isFetchingRef = useRef(false); // 🆕 to stop multiple fetch calls

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const fetchFriendImage = async (userId) => {
    if (friendImages[userId]) return;
    try {
      const res = await api.get(`/api/public-profile/${userId}/`);
      setFriendImages((prev) => ({ ...prev, [userId]: res.data.image }));
    } catch (err) {
      console.error("Error fetching profile image:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return navigate("/login");

    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.user_id);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/api/friends/");
        setFriends(res.data);
      } catch (err) {
        console.error("Error fetching friends", err);
      }
    };

    if (currentUserId) fetchFriends();
  }, [currentUserId]);

  useEffect(() => {
    friends.forEach((f) => f.user?.id && fetchFriendImage(f.user.id));
  }, [friends]);

  const fetchMessages = async () => {
    if (!selectedFriend || !currentUserId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const res = await api.get(
        `/api/get-messages/${currentUserId}/${selectedFriend.user.id}/`
      );
      const newMessages = res.data || [];

      if (messages.length > 0 && newMessages.length > messages.length) {
        const latestMsg = newMessages[newMessages.length - 1];
        if (String(latestMsg.sender) === String(selectedFriend.user.id)) {
          setFriendTyping(true);
          setTimeout(() => setFriendTyping(false), 1000);
        }
      }

      setMessages(newMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let isActive = true;

    const loopFetch = async () => {
      if (!isActive || !selectedFriend || !currentUserId) return;
      await fetchMessages();
      setTimeout(loopFetch, 2000);
    };

    loopFetch();
    return () => {
      isActive = false;
    };
  }, [selectedFriend, currentUserId]);

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("sender", currentUserId);
    formData.append("reciever", selectedFriend.user.id);
    formData.append("message", newMessage);
    if (mediaFile) formData.append("media", mediaFile);

    try {
      const res = await api.post("/api/send-messages/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setMediaFile(null);
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  useEffect(() => {
    const chatBody = document.querySelector(".chat-body");
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  }, [messages]);

  if (!currentUserId) return <div>Loading...</div>;

  return (
    <div className="chatroom-container">
      <div className="chat-sidebar">
        <h2>ChatApp</h2>
        <input className="search-input" placeholder="Search chat..." />
        {friends.map((friend) => (
          <div
            key={friend.id}
            className={`chat-friend ${selectedFriend?.id === friend.id ? "active" : ""}`}
            onClick={() => setSelectedFriend(friend)}
          >
            <img
              className="chat-avatar"
              src={
                friend.user?.id && friendImages[friend.user.id]
                  ? `${api.defaults.baseURL}/api${friendImages[friend.user.id]}`
                  : "/default-avatar.png"
              }
              alt={friend.full_name}
            />
            <span>{friend.full_name}</span>
          </div>
        ))}
      </div>

      <div className="chat-window">
        <div className="chat-header">
          {selectedFriend && (
            <>
              <img
                className="chat-header-avatar"
                src={
                  selectedFriend.user?.id && friendImages[selectedFriend.user.id]
                    ? `${api.defaults.baseURL}/api${friendImages[selectedFriend.user.id]}`
                    : "/default-avatar.png"
                }
                alt={selectedFriend.full_name}
              />
              <span>{selectedFriend.full_name}</span>
            </>
          )}
        </div>

        <div className="chat-body">
          {selectedFriend ? (
            messages.length > 0 ? (
              <>
                {messages.map((msg, i) => {
                  const isMe = String(msg.sender?.id || msg.sender) === String(currentUserId);
                  return (
                    <div key={i} className={`chat-message ${isMe ? "sent" : "received"}`}>
                      {msg.message && <div>{msg.message}</div>}

                      {msg.media && (
                        msg.media.endsWith(".mp4") ? (
                          <video
                            src={`${api.defaults.baseURL}/api${msg.media}`}
                            controls
                            className="chat-media-bubble"
                          />
                        ) : (
                          <img
                            src={`${api.defaults.baseURL}/api${msg.media}`}
                            alt="media"
                            className="chat-media-bubble"
                          />
                        )
                      )}

                      <div className="chat-meta">
                        <small className="message-timestamp">{formatTime(msg.date)}</small>
                        {isMe && msg.is_read && <span className="seen-check">✓✓</span>}
                      </div>
                    </div>
                  );
                })}
                {friendTyping && (
                  <div className="typing-indicator">{selectedFriend?.full_name} is typing...</div>
                )}
              </>
            ) : (
              <div className="no-chat">No chats yet</div>
            )
          ) : (
            <div className="select-user-message">Select a user to start chat</div>
          )}
        </div>

        {selectedFriend && (
          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleTyping}
            />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setMediaFile(e.target.files[0])}
            />
            <button className="send-btn" onClick={handleSend}>Send</button>

            {mediaFile && (
              <div className="media-preview-wrapper">
                <div className="media-preview-inner">
                  <button className="remove-media" onClick={() => setMediaFile(null)}>✕</button>
                  {mediaFile.type.startsWith("image/") ? (
                    <img src={URL.createObjectURL(mediaFile)} alt="preview" />
                  ) : (
                    <video src={URL.createObjectURL(mediaFile)} controls />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatroomPage;
