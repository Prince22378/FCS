import { useEffect, useState } from "react";
import ProtectedRoute from "./ProtectedRoute";
import { ACCESS_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import api from "../api";

function VerifiedRoute({ children }) {
    const [isVerified, setIsVerified] = useState(null);

    useEffect(() => {
        const checkVerification = async () => {
            try {
                const token = localStorage.getItem(ACCESS_TOKEN);
                if (!token) {
                    setIsVerified(false);
                    return;
                }
                const decodedToken = jwtDecode(token);
                const userId = decodedToken.user_id;
                const response = await api.get(`/api/profile/${userId}/`); 
                setIsVerified(response.data.verified);
            } catch (error) {
                console.error("Verification check failed:", error);
                setIsVerified(false);
            }
        };

        checkVerification();
    }, []);

    if (isVerified === null) {
        return <div>Loading verification status...</div>;
    }

    return (
        <ProtectedRoute>
            {isVerified ? children : <div>Only verified users can use marketplace, Please get verified first</div>}
        </ProtectedRoute>
    );
}

export default VerifiedRoute;