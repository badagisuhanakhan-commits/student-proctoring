import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";
import FacultyChat from "./FacultyChat";

const FacultyDashboard = () => {
    const { user } = useUser();
    const socket = useSocket();

    const [students, setStudents] = useState([]); // { socketId, name, stream }
    const [studentStatus, setStudentStatus] = useState({}); // socketId -> lastActive
    const peerConnections = useRef({});
    const [studentVideoStatus, setStudentVideoStatus] = useState({}); // socketId -> videoOn
    const [studentTabStatus, setStudentTabStatus] = useState({}); // socketId -> visible



    useEffect(() => {
        if (!socket || !user) return;
        console.log(`[Faculty] Dashboard loaded for ${user.name}`);

        socket.emit("join-faculty", { userId: user.id, name: user.name });

        const createOffer = async ({ name, socketId }) => {
            if (peerConnections.current[socketId]) return;
            console.log(`[Faculty] Creating offer for student: ${name}, socketId: ${socketId}`);

            const pc = new RTCPeerConnection();
            pc.addTransceiver("video", { direction: "recvonly" });
            pc.addTransceiver("audio", { direction: "recvonly" });
            peerConnections.current[socketId] = pc;

            pc.ontrack = (event) => {
                console.log(`[Faculty] Track received from ${name}`, event.streams);
                if (event.streams && event.streams[0]) {
                    setStudents((prev) =>
                        prev.map((s) =>
                            s.socketId === socketId ? { ...s, stream: event.streams[0] } : s
                        )
                    );
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("signal", { to: socketId, data: { candidate: event.candidate } });
                    console.log(`[Faculty] ICE candidate sent to ${name}`);
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("signal", { to: socketId, data: offer });
            console.log(`[Faculty] Offer sent to ${name}`);
        };

        socket.on("active-students", (studentsList) => {
            console.log("[Faculty] Active students received:", studentsList);
            setStudents(studentsList.map((s) => ({ ...s, stream: null })));
            studentsList.forEach(createOffer);
        });

        socket.on("student-ready", (student) => {
            console.log(`[Faculty] Student ready: ${student.name}, socketId: ${student.socketId}`);
            if (!peerConnections.current[student.socketId]) {
                setStudents((prev) => [...prev, { ...student, stream: null }]);
                createOffer(student);
            }
        });

        socket.on("signal", async ({ from, data }) => {
            const pc = peerConnections.current[from];
            if (!pc) return;

            if (data.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(data));
            } else if (data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        socket.on("student-left", ({ socketId }) => {
            setStudents((prev) => prev.filter((s) => s.socketId !== socketId));
            if (peerConnections.current[socketId]) {
                peerConnections.current[socketId].close();
                delete peerConnections.current[socketId];
            }
        });

        socket.on("student-status", ({ socketId, name, lastActive }) => {
            setStudentStatus((prev) => ({
                ...prev,
                [socketId]: { name, lastActive },
            }));
        });

        socket.on("student-video-toggle", ({ userId, name, socketId, videoOn }) => {
            console.log(`[Faculty] Video status from ${name}: ${videoOn ? "ON" : "OFF"}`);
            setStudentVideoStatus(prev => ({ ...prev, [socketId]: videoOn }));
        });

        socket.on("student-tab-status", ({ socketId, name, visible }) => {
            console.log(`[Faculty] Tab status update from ${name}: ${visible ? "Active" : "Inactive"}`);
            setStudentTabStatus(prev => ({ ...prev, [socketId]: visible }));
        });

        return () => {
            socket.off("active-students");
            socket.off("student-ready");
            socket.off("signal");
            socket.off("student-left");
            socket.off("student-status");
            socket.off("student-video-toggle");
            socket.off("student-tab-status");
            Object.values(peerConnections.current).forEach((pc) => pc.close());
        };
    }, [socket, user]);

    console.log("studentTabStatus:", studentTabStatus);

    return (
        <div>
            <h2>Faculty Dashboard: {user.name}</h2>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {students.map((s) => (
                    <div key={s.socketId} style={{ textAlign: "center" }}>
                        <video
                            autoPlay
                            playsInline
                            width={300}
                            style={{ border: "1px solid black" }}
                            ref={(el) => {
                                if (el && s.stream) el.srcObject = s.stream;
                            }}
                        />
                        <div>{s.name}</div>
                        <div style={{ fontSize: "12px", color: "gray" }}>
                            {studentStatus[s.socketId] &&
                                Date.now() - studentStatus[s.socketId].lastActive < 10000
                                ? "Online"
                                : "Inactive"}
                        </div>
                        <div>
                            {studentTabStatus[s.socketId] === false ? "Inactive Tab" : "Active Tab"}
                        </div>
                    </div>
                ))}
            </div>
            <FacultyChat studentSocketId={user?.socketId || socket.id} studentName={user.name} />
        </div>
    );
};

export default FacultyDashboard;
