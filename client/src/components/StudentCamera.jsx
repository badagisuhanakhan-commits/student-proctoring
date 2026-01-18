import { useEffect, useState, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";
import StudentChat from "./StudentChat";
// import useStudentHeartbeat from "./useStudentHeartbeat";
// import useStudentVisibilityCheck from "./useStudentVisibilityCheck";
import { Box, Button, Heading, VStack, HStack, Text } from "@chakra-ui/react";

const StudentCamera = () => {
  const { user } = useUser();
  const socket = useSocket();
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnections = useRef({});
  const joinedRef = useRef(false);
  const pcTracksAdded = useRef({});
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true); // ✅ audio toggle state

  // useStudentHeartbeat();
  // useStudentVisibilityCheck();

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

        socket.emit("join-student", { userId: user.id, name: user.name });
        socket.emit("student-ready", { userId: user.id, name: user.name });

        socket.on("signal", async ({ from, data }) => {
          let pc = peerConnections.current[from];
          if (!pc) {
            pc = new RTCPeerConnection();
            peerConnections.current[from] = pc;

            pc.onicecandidate = (event) => {
              if (event.candidate) {
                socket.emit("signal", {
                  to: from,
                  data: { candidate: event.candidate },
                });
              }
            };

            pc.ontrack = (event) => {
              console.log("Remote track received from faculty", event.streams);
            };
          }

          if (data.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data));

            if (!pcTracksAdded.current[from] && localStreamRef.current) {
              localStreamRef.current
                .getTracks()
                .forEach((track) => pc.addTrack(track, localStreamRef.current));
              pcTracksAdded.current[from] = true;
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", { to: from, data: pc.localDescription });
          } else if (data.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
              console.error("Error adding ICE candidate:", err);
            }
          }
        });
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      socket.off("signal");
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [socket, user]);

  // ✅ Toggle video
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setVideoOn(videoTrack.enabled);

    socket.emit("student-video-toggle", {
      userId: user.id,
      name: user.name,
      videoOn: videoTrack.enabled,
    });
  };

  // ✅ Toggle audio
  const toggleAudio = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setAudioOn(audioTrack.enabled);

    // Optional: notify faculty if needed
    socket.emit("student-audio-toggle", {
      userId: user.id,
      name: user.name,
      audioOn: audioTrack.enabled,
    });
  };

  return (
    <Box minH="100vh" bg="#2f4f4f" p={6}>
      <VStack spacing={4} align="center">
        {/* Student Info */}
        <Heading color={"#fffaf0"} size="md">
          Student: {user.name}
        </Heading>

        {/* Video */}
        <Box
          border="2px solid teal"
          borderRadius="md"
          overflow="hidden"
          w={{ base: "90%", md: "400px" }}
          h={{ base: "225px", md: "300px" }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>

        {/* Controls */}
        <HStack spacing={4}>
          <Button colorScheme={videoOn ? "teal" : "red"} onClick={toggleVideo}>
            {videoOn ? "Turn Off Video" : "Turn On Video"}
          </Button>
          <Button
            colorScheme={audioOn ? "green" : "orange"}
            onClick={toggleAudio}
          >
            {audioOn ? "Mute" : "Unmute"}
          </Button>
        </HStack>

        {/* Status */}
        <Text fontSize="sm" color="gray.500">
          Video is {videoOn ? "ON" : "OFF"}, Audio is {audioOn ? "ON" : "OFF"}
        </Text>

        {/* Chat */}
        <StudentChat />
      </VStack>
    </Box>
  );
};

export default StudentCamera;
