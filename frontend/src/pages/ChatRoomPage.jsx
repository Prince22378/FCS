import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { ACCESS_TOKEN, PRIVATE_KEY } from "../constants";
import { ec as EC } from "elliptic"; // Elliptic Curve Crypto
import "../styles/ChatRoomPage.css";  

const ec = new EC("p256"); // Using P-256 Curve


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
      const res = await api.post("/api/send-messages/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (newMessage.trim()) {
        formData.append("message", newMessage.trim());
      }
    
      // If there's a media file, include it
      if (mediaFile) {
        formData.append("media", mediaFile);
      }

  
      // Add the sent message (or media) to the chat window
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
                      {msg.message && <div>{decryptMessage(msg.message) || "[Encrypted]"}</div>}

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
            onKeyDown={(e) => {
              // Check if the Enter key is pressed
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent the Enter key from inserting a newline
                handleSend(); // Send the message or media
              }
            }}
          />
          
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setMediaFile(e.target.files[0])} // Set selected media file
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
