import { useEffect } from "react";
import { useSocket } from "../../context/SocketContext";

const useStudentHeartbeat = () => {
  const socket = useSocket();
  useEffect(() => {
    const interval = setInterval(() => {
      socket.emit("student-heartbeat");
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [socket]);
  return null;
};
export default useStudentHeartbeat;
