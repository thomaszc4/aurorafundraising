import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = () => {
            try {
                // Manual hard logout
                localStorage.clear();
                console.log("Logged out (hard)");
            } catch (error) {
                console.error("Error logging out:", error);
            } finally {
                // Force reload to clear memory state
                window.location.href = "/auth";
            }
        };

        handleLogout();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Logging out...</p>
        </div>
    );
}
