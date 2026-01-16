import { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";
import StudentChat from "./StudentChat";
import useStudentHeartbeat from "./useStudentHeartbeat";
import useStudentVisibilityCheck from "./useStudentVisibilityCheck";

const StudentCamera = () => {
  const { user } = useUser();
  const socket = useSocket();
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});
  const joinedRef = useRef(false);
  const pcTracksAdded = useRef({}); // Tracks added flag per PC
  const [videoOn, setVideoOn] = useState(true); // ✅ video toggle state

  useStudentHeartbeat();
  useStudentVisibilityCheck();

  useEffect(() => {
    if (!socket || !user || joinedRef.current) return;
    joinedRef.current = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        console.log(`[Student] Camera started for ${user.name}`);
        socket.emit("join-student", { userId: user.id, name: user.name });
        socket.emit("student-ready", { userId: user.id, name: user.name });
        console.log("[Student] Student ready emitted with tracks");

        // Handle signals from faculty
        socket.on("signal", async ({ from, data }) => {
          console.log(
            `[Student] Signal received from ${from}, type: ${data?.type || "candidate"}`
          );

          let pc = peerConnections.current[from];
          if (!pc) {
            pc = new RTCPeerConnection();
            peerConnections.current[from] = pc;

            // Add ICE candidate handler
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit("signal", { to: from, data: { candidate: event.candidate } });
                console.log(`[Student] ICE candidate sent to ${from}`);
              }
            };

            // Handle any remote tracks (optional)
            pc.ontrack = (event) => {
              console.log(`[Student] Remote track received from ${from}`, event.streams);
            };
          }

          if (data.type === "offer") {
            console.log("[Student] Offer received, setting remote description");
            await pc.setRemoteDescription(new RTCSessionDescription(data));

            // Add local tracks only once per PC
            if (!pcTracksAdded.current[from] && localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current);
              });
              pcTracksAdded.current[from] = true;
              console.log(`[Student] Local tracks added for PC with ${from}`);
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", { to: from, data: pc.localDescription });
            console.log("[Student] Answer sent to faculty");
          } else if (data.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log("[Student] ICE candidate added");
            } catch (err) {
              console.error("[Student] Error adding ICE candidate:", err);
            }
          }
        });
      } catch (err) {
        console.error("[Student] Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      socket.off("signal");
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [socket, user]);

  // ✅ Toggle video function
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setVideoOn(videoTrack.enabled);

    // Notify faculty
    socket.emit("student-video-toggle", { userId: user.id, name: user.name, videoOn: videoTrack.enabled });
    console.log(`[Student] Video toggled: ${videoTrack.enabled ? "ON" : "OFF"}`);
  };

  return (
    <div>
      <h3>Student: {user.name}</h3>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "400px", border: "1px solid black" }}
      />
    <button onClick={toggleVideo} style={{ marginTop: "10px" }}>
        {videoOn ? "Turn Off Video" : "Turn On Video"}
      </button>
      <StudentChat />
    </div>
  );
};

export default StudentCamera;
