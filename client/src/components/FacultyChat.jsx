import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";

const FacultyChat = () => {
    const { user } = useUser();
    const socket = useSocket();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = ({ message, sender }) => {
            setMessages(prev => [...prev, { message, sender }]);
        };

        socket.on("chat-message", handleMessage);

        return () => socket.off("chat-message", handleMessage);
    }, [socket]);

    const sendMessage = () => {
        if (!input.trim()) return;
        // socket.emit("chat-to-students", { message: input, facultyName: user.name });
        socket.emit("chat-to-all-faculty", { message: input, sender: user.name });

        setMessages((prev) => [...prev, { sender: user.name, message: input }]);
        setInput("");
    };

    return (
        <div style={{ marginTop: "20px" }}>
            <h4>Class Chat</h4>
            <div style={{ height: "150px", overflowY: "auto", border: "1px solid gray", padding: "5px" }}>
                {messages.map((m, idx) => (
                    <div key={idx}><b>{m.sender}:</b> {m.message}</div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message..."
                style={{ width: "70%" }}
            />
            <button onClick={sendMessage} style={{ width: "25%" }}>Send</button>
        </div>
    );
};

export default FacultyChat;
