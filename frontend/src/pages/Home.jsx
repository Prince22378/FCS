import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

const Homepage = () => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;  // Extract user_id

        // Fetch profile data using /profile/${userId}/
        const response = await api.get(`/api/profile/${userId}/`);
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/login");
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleEditProfile = () => {
    // Redirect to the profile edit page
    navigate("/edit-profile");
  };

  return (
    <div className="container mx-auto p-4">
      {profile ? (
        <div className="text-center">
          <img
            src={profile.image}
            alt="Profile"
            className="rounded-full w-32 h-32 mx-auto"
          />
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <p>{profile.bio}</p>
          <button
            onClick={handleEditProfile}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Homepage;
