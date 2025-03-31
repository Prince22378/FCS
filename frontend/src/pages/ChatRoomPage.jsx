import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN, PRIVATE_KEY } from "../constants";
import { ec as EC } from "elliptic"; // Elliptic Curve Crypto
import "../styles/ChatRoomPage.css";  

const ec = new EC("p256"); // Using P-256 Curve

import { ACCESS_TOKEN } from "../constants";
import "../styles/ChatRoomPage.css";
import GroupChat from "./GroupChat"; // ✅ Make sure this path is correct

const ChatroomPage = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // ✅ New
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [friendTyping, setFriendTyping] = useState(false);
  const [friendImages, setFriendImages] = useState({});
  const [showGroupOverlay, setShowGroupOverlay] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [groups, setGroups] = useState([]);
  const [friendPublicKey, setFriendPublicKey] = useState(null);
  const [privateKeyHex, setPrivateKeyHex] = useState("");
  const isFetchingRef = useRef(false);


  // Convert HEX to Uint8Array
  const hexToUint8Array = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));

  // Convert Uint8Array to HEX
  const uint8ArrayToHex = (uint8Array) =>
    Array.from(uint8Array).map((b) => b.toString(16).padStart(2, "0")).join("");

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
    // Load stored private key
    const storedPrivateKey = localStorage.getItem(PRIVATE_KEY);
    if (storedPrivateKey) {
      setPrivateKeyHex(storedPrivateKey);
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUserId) {
      api.get("/api/friends/").then(res => {
        setFriends(res.data);
        setFriendsList(res.data);
      });
      api.get("/api/groups/").then(res => {
        setGroups(res.data);
      });
    }
  }, [currentUserId]);

  useEffect(() => {
    friends.forEach((f) => f.user?.id && fetchFriendImage(f.user.id));
  }, [friends]);

  useEffect(() => {
    if (!selectedFriend) return;
    const fetchPublicKey = async () => {
      try {
        const res = await api.get(`/api/public-profile/${selectedFriend.user.id}/`);
        setFriendPublicKey(res.data.public_key); // Public key in HEX format
      } catch (err) {
        console.error("Error fetching public key", err);
      }
    };
    fetchPublicKey();
  }, [selectedFriend]);

  const fetchMessages = async () => {
    if (!selectedFriend || !currentUserId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await api.get(
        `/api/get-messages/${currentUserId}/${selectedFriend.user.id}/`
      );
      setMessages(res.data || []);
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

  // Encrypt Message
  const encryptMessage = (message, publicKeyHex) => {
    if (!publicKeyHex) return null;
    const key = ec.keyFromPublic(publicKeyHex, "hex");
    const msgHex = uint8ArrayToHex(new TextEncoder().encode(message));
    return key.getPublic().mul(new EC("p256").genKeyPair().priv).encode("hex", { compressed: true }) + msgHex;
  };

  // Decrypt Message
  const decryptMessage = (encryptedMessage) => {
    if (!privateKeyHex) return null;
    const key = ec.keyFromPrivate(privateKeyHex, "hex");
    const encryptedHex = encryptedMessage.substring(0, 66);
    const encryptedKey = ec.keyFromPublic(encryptedHex, "hex");
    const sharedSecret = encryptedKey.getPublic().mul(key.getPrivate());
    const decryptedBuffer = hexToUint8Array(encryptedMessage.substring(66));
    return new TextDecoder().decode(decryptedBuffer);
  };

  const handleSend = async () => {
    // Do not send if both message and media are empty
    if (!newMessage.trim() && !mediaFile) return;
  
    const formData = new FormData();
    formData.append("sender", currentUserId);
    formData.append("reciever", selectedFriend.user.id);
  
    // If there's a message, include it
    if (newMessage.trim() && friendPublicKey) {
      formData.append("message", encryptMessage(newMessage.trim(), friendPublicKey));
    }
  
    // If there's a media file, include it
    if (mediaFile) {
      formData.append("media", mediaFile);
    }
  
    try {
      const res = await api.post("/api/send-messages/", formData);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage(""); // Clear the message input field
      setMediaFile(null); // Clear the media file input
    } catch (err) {
      console.error("Error sending message", err);
    }
  };


  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // const handleCreateGroup = async () => {
  //   try {
  //     const res = await api.post("/api/create-group/", {
  //       name: groupName,
  //       bio: groupBio,
  //       members: selectedMembers,
  //     });
  //     setGroups((prev) => [...prev, res.data]);
  //     setShowGroupOverlay(false);
  //     setCurrentStep(1);
  //     setGroupName("");
  //     setGroupBio("");
  //     setSelectedMembers([]);
  //   } catch (err) {
  //     console.error("Error creating group", err);
  //   }
  // };
  const handleCreateGroup = async () => {
    const formData = new FormData();
    formData.append("name", groupName);
    formData.append("bio", groupBio);
    selectedMembers.forEach(id => formData.append("members", id));
    if (mediaFile) formData.append("image", mediaFile);
  
    try {
      const res = await api.post("/api/create-group/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setGroups((prev) => [...prev, res.data]);
      setShowGroupOverlay(false);
      setCurrentStep(1);
      setGroupName("");
      setGroupBio("");
      setMediaFile(null);
      setSelectedMembers([]);
    } catch (err) {
      console.error("Error creating group", err);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedFriend(null); // clear private chat
  };

  return (
    <div className="chatroom-container">
      <div className="chat-sidebar">
        <h2>ChatApp</h2>
        <input className="search-input" placeholder="Search chat..." />

        <div className="sidebar-section">
          <h3>Friends</h3>
          {friends.map((friend) => (
            <div
              key={friend.id}
              className={`chat-friend ${selectedFriend?.id === friend.id ? "active" : ""}`}
              onClick={() => {
                setSelectedFriend(friend);
                setSelectedGroup(null);
              }}
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

        <div className="sidebar-section">
          <h3>Groups</h3>
          <button onClick={() => setShowGroupOverlay(true)}>Create Group</button>
          {groups.map((group) => (
            <div
              key={group.id}
              className={`chat-friend ${selectedGroup?.id === group.id ? "active" : ""}`}
              onClick={() => handleGroupSelect(group)}
            >
              <img
                className="chat-avatar"
                src={
                  group.image
                    ? `${api.defaults.baseURL}/api${group.image}`
                    : "/group-default.png"
                }
                alt={group.name}
              />
              <span>{group.name}</span>
            </div>
          ))}

        </div>
      </div>

      <div className="chat-window">
        <div className="chat-header">
          {selectedFriend && (
            <div className="chat-title">
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
            </div>
          )}
          {selectedGroup && (
            <div className="chat-title">
              <img
                className="chat-header-avatar"
                src={selectedGroup.image ? `${api.defaults.baseURL}/api${selectedGroup.image}` : "/group-default.png"}
                alt={selectedGroup.name}
              />
              <span>{selectedGroup.name}</span>
            </div>
          )}
        </div>

        <div className="chat-body">
          {selectedGroup ? (
            <GroupChat selectedGroup={selectedGroup} currentUserId={currentUserId} />
          ) : selectedFriend ? (
            messages.map((msg, i) => {
              const isMe = String(msg.sender?.id || msg.sender) === String(currentUserId);
              return (
                <div key={i} className={`chat-message ${isMe ? "sent" : "received"}`}>
                  {msg.message && <div>{decryptMessage(msg.message) || "[Encrypted]"}</div>}
                  {msg.media && (
                    msg.media.endsWith(".mp4") ? (
                      <video src={`${api.defaults.baseURL}/api${msg.media}`} controls />
                    ) : (
                      <img src={`${api.defaults.baseURL}/api${msg.media}`} alt="media" />
                    )
                  )}
                  <div className="chat-meta">
                    <small>{formatTime(msg.date)}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="select-user-message">Select a user or group to start chat</div>
          )}
        </div>

        {selectedFriend && !selectedGroup && (
          <div className="chat-input-container">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(e) => {
                // Check if the Enter key is pressed and Shift key is not pressed
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevent the Enter key from inserting a newline
                  handleSend(); // Send the message or media
                }
              }}
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
