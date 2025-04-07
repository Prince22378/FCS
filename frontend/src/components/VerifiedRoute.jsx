import { useEffect, useState } from "react";
import ProtectedRoute from "./ProtectedRoute";
import api from "../api";

function VerifiedRoute({ children }) {
    const [isVerified, setIsVerified] = useState(null);

    useEffect(() => {
        const checkVerification = async () => {
            try {
                const response = await api.get("/api/user/me/"); // Adjust endpoint
                setIsVerified(response.data.is_verified);
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
            {isVerified ? children : <div>Please wait for admin verification</div>}
        </ProtectedRoute>
    );
}

export default VerifiedRoute;