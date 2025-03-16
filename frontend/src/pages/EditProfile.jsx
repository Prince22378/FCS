// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../api";
// import { jwtDecode } from "jwt-decode";
// import { ACCESS_TOKEN } from "../constants";

// const EditProfile = () => {
//   const [profile, setProfile] = useState({
//     full_name: "",
//     bio: "",
//     image: "",
//   });
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       try {
//         const token = localStorage.getItem(ACCESS_TOKEN);
//         if (!token) return navigate("/login");

//         const decodedToken = jwtDecode(token);
//         const userId = decodedToken.user_id;

//         // Fetch profile data
//         const response = await api.get(`/api/profile/${userId}/`);
//         setProfile(response.data);
//       } catch (error) {
//         console.error("Error fetching user profile", error);
//         navigate("/login");
//       }
//     };
//     fetchUserProfile();
//   }, [navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const token = localStorage.getItem(ACCESS_TOKEN);
//       const decodedToken = jwtDecode(token);
//       const userId = decodedToken.user_id;

//       // Create FormData object to send file and other form data
//       const formData = new FormData();
//       formData.append("full_name", profile.full_name);
//       formData.append("bio", profile.bio);
//       formData.append("image", profile.image);  // Appending the image file

//       // Send updated profile to backend via /profile/${userId}/
//       await api.put(`/api/profile/${userId}/`, formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",  // Ensure the request is set to handle file uploads
//         },
//       });

//       alert("Profile updated successfully!");
//       navigate("/");
//     } catch (error) {
//       console.error("Error updating profile", error);
//     }
//   };

//   const handleChange = (e) => {
//     if (e.target.name === "image") {
//       // If the image file is selected, update the state with the file
//       setProfile({
//         ...profile,
//         image: e.target.files[0],  // Set the image file here
//       });
//     } else {
//       setProfile({
//         ...profile,
//         [e.target.name]: e.target.value,
//       });
//     }
//   };

//   return (
//     <div className="container mx-auto p-4">
//       <h2 className="text-xl font-bold">Edit Profile</h2>
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label htmlFor="full_name" className="block">Full Name</label>
//           <input
//             type="text"
//             id="full_name"
//             name="full_name"
//             value={profile.full_name}
//             onChange={handleChange}
//             className="border p-2 w-full"
//           />
//         </div>
//         <div className="mt-4">
//           <label htmlFor="bio" className="block">Bio</label>
//           <textarea
//             id="bio"
//             name="bio"
//             value={profile.bio}
//             onChange={handleChange}
//             className="border p-2 w-full"
//           />
//         </div>
//         <div className="mt-4">
//           <label htmlFor="image" className="block">Profile Image</label>
//           <input
//             type="file"
//             id="image"
//             name="image"
//             accept="image/*"
//             onChange={handleChange}
//             className="border p-2 w-full"
//           />
//         </div>
//         <button
//           type="submit"
//           className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
//         >
//           Save Changes
//         </button>
//       </form>
//     </div>
//   );
// };

// export default EditProfile;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import "../styles/EditProfile.css"; // Import the CSS file

const EditProfile = () => {
  const [profile, setProfile] = useState({
    full_name: "",
    bio: "",
    image: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;

        // Fetch profile data
        const response = await api.get(`/api/profile/${userId}/`);
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/login");
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.user_id;

      // Create FormData object to send file and other form data
      const formData = new FormData();
      formData.append("full_name", profile.full_name);
      formData.append("bio", profile.bio);
      formData.append("image", profile.image); // Appending the image file

      // Send updated profile to backend via /profile/${userId}/
      await api.put(`/api/profile/${userId}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Ensure the request is set to handle file uploads
        },
      });

      alert("Profile updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating profile", error);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "image") {
      // If the image file is selected, update the state with the file
      setProfile({
        ...profile,
        image: e.target.files[0], // Set the image file here
      });
    } else {
      setProfile({
        ...profile,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <div className="edit-profile-container">
      <h2 className="edit-profile-heading">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div>
          <label htmlFor="full_name" className="edit-profile-label">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={profile.full_name}
            onChange={handleChange}
            className="edit-profile-input"
          />
        </div>
        <div>
          <label htmlFor="bio" className="edit-profile-label">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            className="edit-profile-textarea"
          />
        </div>
        <div>
          <label htmlFor="image" className="edit-profile-label">Profile Image</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="edit-profile-file-input"
          />
        </div>
        <button
          type="submit"
          className="edit-profile-button"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;