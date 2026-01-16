import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";

const useStudentVisibilityCheck = () => {
    const { user } = useUser();
    const socket = useSocket();
    useEffect(() => {
        if (!socket || !user) return;

        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            console.log(`[Student] Tab visibility changed: ${isVisible ? "Active" : "Inactive"}`);
            socket.emit("student-tab-status", {
                userId: user.id,
                name: user.name,
                visible: isVisible,
            });
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [socket, user]);

    return null;
}

export default useStudentVisibilityCheck;
