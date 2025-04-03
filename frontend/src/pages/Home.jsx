import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import "../styles/Home.css";
import { Link } from "react-router-dom";

const Homepage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendRequests, setFriendRequests] = useState([]);
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [showPostModal, setShowPostModal] = useState(false);

  const [posts, setPosts] = useState([]);

  const [newComments, setNewComments] = useState({}); // to hold input comment text
  const [showAllComments, setShowAllComments] = useState({});

  const [likedPosts, setLikedPosts] = useState([]);

  const [showFullBio, setShowFullBio] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [govtDoc, setGovtDoc] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("");

  const [showReportOverlay, setShowReportOverlay] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);

  const reportReasons = [
    "Spam",
    "Abusive Content",
    "Inappropriate Image",
    "Hate Speech",
    "Other",
  ];
  // useEffect(() => {
  //   const fetchUserProfile = async () => {
  //     try {
  //       const token = localStorage.getItem(ACCESS_TOKEN);
  //       if (!token) return navigate("/login");

  //       const decodedToken = jwtDecode(token);
  //       const userId = decodedToken.user_id;

  //       const response = await api.get(`/api/profile/${userId}/`);
  //       setProfile(response.data);

  //       // Fetch friend requests after getting profile
  //       fetchFriendRequests();

  //       setLoading(false);
  //     } catch (error) {
  //       console.error("Error fetching user profile", error);
  //       navigate("/login");
  //     }
  //   };

  //   // const fetchFriendRequests = async () => {
  //   //   try {
  //   //     const response = await api.get("/api/friend-requests/");
  //   //     setFriendRequests(response.data); // Assuming response.data is a list of usernames or user objects
  //   //   } catch (error) {
  //   //     console.error("Error fetching friend requests", error);
  //   //   }
  //   // };

  //   fetchUserProfile();
  // }, [navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");
  
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;
  
        const response = await api.get(`/api/profile/${userId}/`);
        setProfile(response.data); // Update profile state with the updated username and other fields
  
        // Fetch friend requests after getting profile
        fetchFriendRequests();
  
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/login");
      }
    };
  
    fetchUserProfile();
  }, [navigate]);
  
  



  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get("/api/posts/");
        setPosts(response.data);
      } catch (err) {
        console.error("Error fetching posts", err);
      }
    };

    fetchPosts();
  }, []);

  const handleEditProfile = () => navigate("/edit-profile");
  const handleLogout = () => navigate("/logout");
  const handleFriendPage = () => navigate("/friends");
  const handleChatroomPage = () => navigate("/chat");

  const handleFriendRequestResponse = async (requestId, action) => {
    try {
      await api.post(`/api/friend-requests/respond/${requestId}/`, {
        action: action,
      });
      // After accepting/rejecting, refresh the list
      const response = await api.get("/api/friend-requests/");
      setFriendRequests(response.data);
    } catch (error) {
      console.error(`Failed to ${action} friend request:`, error);
    }
  };

  const handleCreatePost = async () => {
    if (!caption.trim() && !image) {
      setError("Please add a caption or an image.");
      return;
    }

    const formData = new FormData();
    formData.append("caption", caption);
    if (image) formData.append("image", image);

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      await api.post("/api/posts/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Reset modal
      setCaption("");
      setImage(null);
      setShowPostModal(false);
      setError("");

      setTimeout(() => {
        fetchPosts(); // reload posts
      }, 300); // 300ms delay for smoother experience


    } catch (err) {
      console.error("Failed to post", err);
      setError("Something went wrong while posting.");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts();
    }, 5000); // 5 sec refresh

    return () => clearInterval(interval); // Clean-up on unmount
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await api.get("/api/friend-requests/");
      setFriendRequests(response.data);
    } catch (error) {
      console.error("Error fetching friend requests", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchFriendRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // const [posts, setPosts] = useState([]);


  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get("/api/posts/");
      // console.log("Posts response:", response.data);
      setPosts(response.data);
    } catch (err) {
      console.error("Error fetching posts", err);
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = newComments[postId];
    if (!text?.trim()) return;

    try {
      await api.post("/api/comment/", { post: postId, text });
      setNewComments({ ...newComments, [postId]: "" });
      fetchPosts(); // refresh comments
    } catch (err) {
      console.error("Comment error", err);
    }
  };



  const handleLike = async (postId) => {
    try {
      await api.post("/api/react/", { post: postId });

      setLikedPosts((prevLiked) => {
        if (prevLiked.includes(postId)) {
          return prevLiked.filter((id) => id !== postId); // unlike
        } else {
          return [...prevLiked, postId]; // like
        }
      });

      fetchPosts(); // refresh post data (likes count)
    } catch (err) {
      console.error("Like error", err);
    }
  };



  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/api/posts/${postId}/`);
      fetchPosts(); // Refresh
      setOpenMenuPostId(null); // Close dropdown
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };


  const handleUsernameClick = async (userId) => {
    try {
      const response = await api.get(`/api/public-profile/${userId}/`);
      setSelectedUserProfile(response.data);
      setShowProfileOverlay(true);
    } catch (error) {
      console.error("Error fetching user profile", error);
    }
  };

  const handleSendFriendRequest = async (toUserId) => {
    try {
      await api.post("/api/friend-requests/send/", {
        to_user_id: toUserId,
      });
      alert("Friend request sent!");
      setShowProfileOverlay(false);
    } catch (err) {
      console.error("Failed to send friend request", err);
      alert("Could not send request.");
    }
  };

  const handleVerifySubmit = async () => {
    if (!govtDoc) return alert("Please upload your government document.");

    const formData = new FormData();
    formData.append("govt_document", govtDoc);

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      await api.put(`/api/profile/${profile.id}/verify/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // ✅ Re-fetch profile after successful submission
      const updatedProfile = await api.get(`/api/profile/${profile.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProfile(updatedProfile.data);

      setVerificationStatus("pending");
      setShowVerifyModal(false);
    } catch (err) {
      console.error("Verification upload failed", err);
      alert("Something went wrong while uploading.");
    }
  };
  
    
  const handleReportPost = (postId) => {
    setSelectedPostId(postId);
    setShowReportOverlay(true);
  };

  const handleCloseReportOverlay = () => {
    setShowReportOverlay(false);
    setReportReason(""); // Reset the reason
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      alert("Please select a reason for reporting.");
      return;
    }

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      await api.post(
        "/api/report/",
        { post: selectedPostId, reason: reportReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Report submitted successfully!");
      handleCloseReportOverlay(); // Close the overlay after successful submission
    } catch (error) {
      console.error("Error submitting report", error);
      alert("Failed to submit the report.");
    }
  };



  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="homepage">
      {/* Left Sidebar */}
      <div className="left-sidebar">
        <div className="profile-section">
          <div className="profile-circle">
            {profile?.image && (
              <img
                src={`${api.defaults.baseURL}/api${profile.image}`}
                alt="Profile"
              />
            )}
          </div>

          {/* <div className="profile-username-verify">
            <span className="profile-username">
              {profile?.full_name || "User_Name"}
            </span>
            <span className="profile-verify">
              {profile?.verified ? "✔ Verified" : "Verify"}
            </span>
          </div> */}
          <div className="profile-username-verify">
            <span className="profile-username">
              {profile?.full_name || "User_Name"}
            </span>

            {profile?.verified ? (
              <span className="profile-verify">✔ Verified</span>
            ) : profile?.is_verification_pending ? (
              <span className="profile-verify pending">🕓 Verification Pending</span>
            ) : (
              <span
                className="profile-verify"
                style={{ color: "#007bff", cursor: "pointer" }}
                onClick={() => setShowVerifyModal(true)}
              >
                Verify
              </span>
            )}
          </div>

          <div className="profile-bio-box">
            {" "}
            {profile?.bio ? (
              <>
                {showFullBio
                  ? profile.bio
                  : profile.bio.split(" ").slice(0, 4).join(" ") +
                  (profile.bio.split(" ").length > 4 ? "..." : "")}
                {profile.bio.split(" ").length > 4 && (
                  <span
                    onClick={() => setShowFullBio(!showFullBio)}
                    style={{ color: "blue", cursor: "pointer", marginLeft: "5px" }}
                  >
                    {showFullBio ? "less" : "more"}
                  </span>
                )}
              </>
            ) : (
              "N/A"
            )}
          </div>
        </div>



        <button onClick={handleEditProfile} className="edit-button">
          Edit Profile
        </button>
        <button className="sidebar-button" onClick={handleFriendPage}>
          Friends
        </button>
        <button
          className="sidebar-button" onClick={handleChatroomPage}>
          Chatroom
        </button>
        <button
          className="sidebar-button"
          onClick={() => navigate('/marketplace')}
        >
          Marketplace
        </button>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Center Content */}
      <div className="main-content"> 
        {/* Create Post */}
        <div className="create-post" onClick={() => setShowPostModal(true)}>
          <input
            type="text"
            placeholder="What's on your mind?"
            className="create-post-input"
            readOnly
          />
        </div>
        {posts.map((post) => {
          // console.log("IMAGE URL:", `${import.meta.env.VITE_API_URL}/api${post.image}`);
          return (
            <div className="post-box" key={post.id}>
              <div className="post-header">
                {post.profile_image && (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/api${post.profile_image}`}
                    alt="Profile"
                    className="post-profile-pic"
                  />
                )}
                <span
                  className="post-username"
                  style={{ cursor: "pointer", color: "#007bff" }}
                  onClick={() => handleUsernameClick(post.user)}
                >
                  {post.username}
                </span>
                {/* ⋮ Menu Button */}
                <div className="post-menu-container">
                  <button
                    className="post-menu-btn"
                    onClick={() =>
                      setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)
                    }
                  >
                    ⋮
                  </button>

                  {openMenuPostId === post.id && (
                    <div className="post-menu-dropdown">
                      {/* Show Delete only if user is author */}
                      {profile?.id === post.user && (
                        <button
                          className="post-menu-item delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          🗑 Delete
                        </button>
                      )}
                      <button
                        className="post-menu-item report"
                        onClick={() => handleReportPost(post.id)}
                      >
                        🚩 Report
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {post.image && (
                <img
                  src={`${import.meta.env.VITE_API_URL}/api${post.image}`}
                  alt="Post"
                  className="post-image"
                />
              )}

              <div className="caption">{post.caption}</div>
              <div className="timestamp">
                {new Date(post.created_at).toLocaleString()}
              </div>
              {/* ❤️ Like Button */}
              {/* <button className="like-btn" onClick={() => handleLike(post.id)}>
              👍 Like ({post.likes_count})
            </button> */}
              <button
                className={`like-btn ${post.has_liked ? "liked" : ""}`}
                onClick={() => handleLike(post.id)}
              >
                👍 Like ({post.likes_count})
              </button>

              {/* 💬 Comments Section */}
              <div className="comments">
                <h4>Comments</h4>
                {(showAllComments[post.id]
                  ? post.comments
                  : post.comments.slice(0, 3)
                ).map((comment) => (
                  <div key={comment.id} className="comment">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/api${comment.profile_image}`}
                      alt="Commenter"
                      className="comment-profile-pic"
                    />
                    <div className="comment-body">
                      <strong>{comment.username}</strong>
                      <p>{comment.text}</p>
                      <small className="comment-time">
                        {new Date(comment.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}

                {/* Show "Load More" if there are more than 3 comments and not all are shown */}
                {post.comments.length > 3 && !showAllComments[post.id] && (
                  <button
                    className="load-more-comments"
                    onClick={() =>
                      setShowAllComments({ ...showAllComments, [post.id]: true })
                    }
                  >
                    Load more comments
                  </button>
                )}


                {/* Add Comment Input */}
                <div className="add-comment">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComments[post.id] || ""}
                    onChange={(e) =>
                      setNewComments({ ...newComments, [post.id]: e.target.value })
                    }
                  />
                  <button onClick={() => handleCommentSubmit(post.id)}>Post</button>
                </div>
              </div>
            </div>
          );
        })}
        {/* Post 1 */}
        {/*div className="post-box">
          <div className="post-header">  // const [posts, setPosts] = useState([]);
            <img
              src="https://via.placeholder.com/40"
              alt="User Profile"
              className="post-profile-pic"
            />
            <span className="post-username">user_A1</span>
          </div>

          <img
            src="https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Post 1"
            className="post-image"
          />

          <div className="caption">This is a caption for post 1</div>
        </div> */}

        {/* Post 2 */}
        {/*<div className="post-box">
          <div className="post-header">
            <img
              src="https://via.placeholder.com/40"
              alt="User Profile"
              className="post-profile-pic"
            />
            <span className="post-username">user_B2</span>
          </div>

          <img
            src="https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Post 2"
            className="post-image"
          />
          <div className="caption">This is the caption for post 2</div>
        </div> */}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        <h3>Friend Requests</h3>
        {friendRequests.length === 0 ? (
          <p>No pending friend requests</p>
        ) : (
          friendRequests.map((req, index) => (
            <div key={index} className="friend-request-item">
              <span>{req.from_user?.username || `User_${index + 1}`}</span>
              <div>
                <button
                  className="accept"
                  onClick={() => handleFriendRequestResponse(req.id, "accept")}
                >
                  &#10003;
                </button>
                <button
                  className="reject"
                  onClick={() => handleFriendRequestResponse(req.id, "reject")}
                >
                  &#10007;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showPostModal && (
        <div className="post-modal-overlay">
          <div className="post-modal">
            <h3>Create Post</h3>

            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="caption-input"
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />

            {error && <p className="error-text">{error}</p>}

            <div className="post-modal-actions">
              <button onClick={handleCreatePost}>Post</button>
              <button onClick={() => setShowPostModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showProfileOverlay && selectedUserProfile && (
        <div className="overlay-backdrop">
          <div className="profile-overlay">
            <button
              className="close-btn"
              onClick={() => setShowProfileOverlay(false)}
            >
              ✖
            </button>
            <img
              src={`${api.defaults.baseURL}/api${selectedUserProfile.image}`}
              alt="User"
              className="overlay-profile-pic"
            />
            <h3>{selectedUserProfile.full_name}</h3>
            <p>{selectedUserProfile.bio || "No bio available"}</p>

            {selectedUserProfile && selectedUserProfile.user.id !== profile?.id && (
              <button
                className="send-request-button"
                onClick={() => handleSendFriendRequest(selectedUserProfile.user.id)}
              >
                Send Friend Request
              </button>
            )}
          </div>
        </div>
      )}

      {showVerifyModal && (
        <div className="overlay-backdrop">
          <div className="profile-overlay">
            <button className="close-btn" onClick={() => setShowVerifyModal(false)}>
              ✖
            </button>
            <h3>Upload Government Document</h3>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setGovtDoc(e.target.files[0])}
            />

            <button onClick={handleVerifySubmit} className="send-request-button">
              Submit for Verification
            </button>
          </div>
        </div>
      )}

      {/* Report Overlay */}
      {showReportOverlay && (
        <div className="overlay-backdrop">
          <div className="report-overlay">
            <h3>Report Post</h3>
            <label>Select a reason:</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="">-- Select a reason --</option>
              {reportReasons.map((reason, index) => (
                <option key={index} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            <div className="report-actions">
              <button onClick={handleReportSubmit}>Submit Report</button>
              <button onClick={handleCloseReportOverlay}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>

  );
};

export default Homepage;
