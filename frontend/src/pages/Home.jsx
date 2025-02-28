import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

const Homepage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return navigate("/login");

        const decodedToken = jwtDecode(token);
        const userId = decodedToken.user_id;  // Extract user_id

        const response = await api.get(`/api/profile/${userId}/`);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile", error);
        navigate("/login");
      }
    };
    fetchUserProfile();
  }, [navigate]);

  return (
    <>
      <div className="container mx-auto p-4">
        {user ? (
          <div className="text-center">
            <img
              src={user.image}
              alt="Profile"
              className="rounded-full w-32 h-32 mx-auto"
            />
            <h2 className="text-xl font-bold">{user.full_name}</h2>
            <p>{user.bio}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </>
  );
};

export default Homepage;