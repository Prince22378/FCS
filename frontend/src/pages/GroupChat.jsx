// import React, { useState, useEffect, useRef } from "react";
// import api from "../api";
// // import "../styles/ChatRoomPage.css";
// import "../styles/GroupChat.css";

// const GroupChat = ({ selectedGroup, currentUserId }) => {
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [mediaFile, setMediaFile] = useState(null);
//   const isFetchingRef = useRef(false);
//   const [showAddMembersOverlay, setShowAddMembersOverlay] = useState(false);
//   const [showCurrentMembersOverlay, setShowCurrentMembersOverlay] = useState(false);
//   const [friendsList, setFriendsList] = useState([]);
//   const [selectedMembers, setSelectedMembers] = useState([]);


//   const formatTime = (dateString) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//     } catch {
//       return "";
//     }
//   };

//   useEffect(() => {
//     const fetchFriends = async () => {
//       try {
//         const res = await api.get("/api/friends/");
//         setFriendsList(res.data);
//       } catch (err) {
//         console.error("Error fetching friends list", err);
//       }
//     };
  
//     if (showAddMembersOverlay) fetchFriends();
//   }, [showAddMembersOverlay]);
  
//     // Handle fetching the group messages
// //   useEffect(() => {
// //     if (selectedGroup) {
// //         fetchMessages();
// //     }
// //   }, [selectedGroup]);

//   const fetchGroupMessages = async () => {
//     if (!selectedGroup || isFetchingRef.current) return;
//     isFetchingRef.current = true;

//     try {
//       const res = await api.get(`/api/groups/${selectedGroup.id}/messages/`);
//       setMessages(res.data);
//     } catch (err) {
//       console.error("Error fetching group messages:", err);
//     } finally {
//       isFetchingRef.current = false;
//     }
//   };

//   // Add the group member's full name here by matching their ID with friendsList
//   const getMemberName = (memberId) => {
//     const friend = friendsList.find((f) => f.id === memberId);
//     return friend ? friend.full_name : "Unknown User";
//   };

// //   useEffect(() => {
// //     const fetchFriends = async () => {
// //       try {
// //         const res = await api.get("/api/friends/");
// //         setFriendsList(res.data);  // Make sure we store the friends list
// //       } catch (err) {
// //         console.error("Error fetching friends list", err);
// //       }
// //     };
  
// //     if (showAddMembersOverlay || showCurrentMembersOverlay) fetchFriends();
// //   }, [showAddMembersOverlay, showCurrentMembersOverlay]);
  

//   useEffect(() => {
//     let isActive = true;

//     const loopFetch = async () => {
//       if (!isActive) return;
//       await fetchGroupMessages();
//       setTimeout(loopFetch, 2000);
//     };

//     loopFetch();
//     return () => {
//       isActive = false;
//     };
//   }, [selectedGroup]);

//   const handleSend = async () => {
//     if (!newMessage.trim() && !mediaFile) return;

//     const formData = new FormData();
//     formData.append("content", newMessage);
//     if (mediaFile) formData.append("media", mediaFile);

//     try {
//       const res = await api.post(`/api/groups/${selectedGroup.id}/messages/`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       setMessages((prev) => [...prev, res.data]);
//       setNewMessage("");
//       setMediaFile(null);
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   const handleAddMember = (friendId) => {
//     setSelectedMembers((prevSelected) => {
//       if (prevSelected.includes(friendId)) {
//         return prevSelected.filter((id) => id !== friendId); // Remove member
//       } else {
//         return [...prevSelected, friendId]; // Add member
//       }
//     });
//   };
  
//   const handleAddMembers = async () => {
//     try {
//       const updatedGroup = await api.post(`/api/groups/${selectedGroup.id}/add-members/`, {
//         members: selectedMembers,
//       });
//       setSelectedGroup(updatedGroup.data);
//       setShowAddMembersOverlay(false); // Close overlay
//     } catch (err) {
//       console.error("Error adding members", err);
//     }
//   };
  
//   return (
//     <div className="group-chat-window">
//         {/* <div className="group-chat-header">
//             <div className="group-chat-actions">
//                 <button onClick={() => setShowAddMembersOverlay(true)}>Add Members</button>
//                 <button onClick={() => setShowCurrentMembersOverlay(true)}>See Current Members</button>
//             </div>
//         </div> */}

//       <div className="group-chat-body">
//         {messages.map((msg, i) => {
//           const isMe = msg.sender.id === currentUserId;
//           return (
//             <div key={i} className={`chat-message ${isMe ? "sent" : "received"}`}>
//               <div className="message-sender">
//                 {!isMe && <strong>{msg.sender.username}</strong>}
//               </div>
//               {msg.content && <div>{msg.content}</div>}
//               {msg.media && (
//                 <div className="message-media">
//                     {msg.media.endsWith(".mp4") ? (
//                     <video src={`${api.defaults.baseURL}/api${msg.media}`} controls />
//                     ) : (
//                     <img src={`${api.defaults.baseURL}/api${msg.media}`} alt="media" />
//                     )}
//                 </div>
//                 )}
//               <div className="chat-meta">
//                 <small>{formatTime(msg.created_at)}</small>
//               </div>
//             </div>
//           );
//         })}
//       </div>
  
//       <div className="group-chat-input">
//         <input
//           type="text"
//           placeholder="Type a message..."
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           onKeyDown={(e) => {
//             // Check if the Enter key is pressed and Shift key is not pressed
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault(); // Prevent the Enter key from inserting a newline
//               handleSend(); // Send the message or media
//             }
//           }}
//         />
//         <input
//           type="file"
//           accept="image/*,video/*"
//           onChange={(e) => setMediaFile(e.target.files[0])}
//         />
//         <button className="send-btn" onClick={handleSend}>Send</button>
//       </div>
//     </div>
//   );  
// };

// export default GroupChat;

import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import "../styles/GroupChat.css";

const GroupChat = ({ selectedGroup, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const isFetchingRef = useRef(false);
  const bottomRef = useRef(null);
  const [showAddMembersOverlay, setShowAddMembersOverlay] = useState(false);
  const [showCurrentMembersOverlay, setShowCurrentMembersOverlay] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get("/api/friends/");
        setFriendsList(res.data);
      } catch (err) {
        console.error("Error fetching friends list", err);
      }
    };

    if (showAddMembersOverlay) fetchFriends();
  }, [showAddMembersOverlay]);

  const fetchGroupMessages = async () => {
    if (!selectedGroup || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await api.get(`/api/groups/${selectedGroup.id}/messages/`);
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching group messages:", err);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const getMemberName = (memberId) => {
    const friend = friendsList.find((f) => f.id === memberId);
    return friend ? friend.full_name : "Unknown User";
  };

  useEffect(() => {
    let isActive = true;

    const loopFetch = async () => {
      if (!isActive) return;
      await fetchGroupMessages();
      setTimeout(loopFetch, 2000);
    };

    loopFetch();
    return () => {
      isActive = false;
    };
  }, [selectedGroup]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append("content", newMessage);
    if (mediaFile) formData.append("media", mediaFile);

    try {
      const res = await api.post(`/api/groups/${selectedGroup.id}/messages/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setMediaFile(null);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="group-chat-window">
      <div className="group-chat-body">
        {messages.map((msg, i) => {
          const isMe = msg.sender.id === currentUserId;
          return (
            <div key={i} className={`chat-message ${isMe ? "sent" : "received"}`}>
              <div className="message-sender">
                {!isMe && <strong>{msg.sender.username}</strong>}
              </div>
              {msg.content && <div>{msg.content}</div>}
              {msg.media && (
                <div className="message-media">
                  {msg.media.endsWith(".mp4") ? (
                    <video src={`${api.defaults.baseURL}/api${msg.media}`} controls />
                  ) : (
                    <img src={`${api.defaults.baseURL}/api${msg.media}`} alt="media" />
                  )}
                </div>
              )}
              <div className="chat-meta">
                <small>{formatTime(msg.created_at)}</small>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="group-chat-input">
  {mediaFile && (
    <div className="media-preview">
      {mediaFile.type.startsWith("video") ? (
        <video src={URL.createObjectURL(mediaFile)} controls />
      ) : (
        <img src={URL.createObjectURL(mediaFile)} alt="preview" />
      )}
      <button className="remove-preview" onClick={() => setMediaFile(null)}>✖</button>
    </div>
  )}
  
  <div className="input-wrapper">
    <input
      type="text"
      placeholder="type your message here..."
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      }}
    />
    <div className="icon-buttons">
      <label className="upload-icon">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setMediaFile(e.target.files[0])}
        />
        ⬆️
      </label>
      <button className="send-icon" onClick={handleSend}>➤</button>
    </div>
  </div>
</div>

    </div>
  );
};

export default GroupChat;
