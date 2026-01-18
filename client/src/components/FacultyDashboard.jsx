import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";
import FacultyChat from "./FacultyChat";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Badge,
  VStack,
  Flex,
  Divider,
} from "@chakra-ui/react";

const FacultyDashboard = () => {
  const { user } = useUser();
  const socket = useSocket();

  // States
  const [students, setStudents] = useState([]); // Each student: { socketId, name, stream, audioOn }
  const [studentStatus, setStudentStatus] = useState({}); // Last active time per student
  const peerConnections = useRef({});
  const [studentVideoStatus, setStudentVideoStatus] = useState({}); // Video on/off
  const [studentTabStatus, setStudentTabStatus] = useState({}); // Tab active/inactive

  useEffect(() => {
    if (!socket || !user) return;
    console.log(`[Faculty] Dashboard loaded for ${user.name}`);

    socket.emit("join-faculty", { userId: user.id, name: user.name });

    // --- WebRTC Offer creation ---
    const createOffer = async ({ name, socketId }) => {
      if (peerConnections.current[socketId]) return;
      console.log(`[Faculty] Creating offer for ${name} (${socketId})`);

      const pc = new RTCPeerConnection();
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      peerConnections.current[socketId] = pc;

      pc.ontrack = (event) => {
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
          socket.emit("signal", {
            to: socketId,
            data: { candidate: event.candidate },
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal", { to: socketId, data: offer });
    };

    // --- Socket Events ---
    socket.on("active-students", (studentsList) => {
      setStudents(
        studentsList.map((s) => ({ ...s, stream: null, audioOn: true }))
      );
      studentsList.forEach(createOffer);
    });

    socket.on("student-ready", (student) => {
      if (!peerConnections.current[student.socketId]) {
        setStudents((prev) => [
          ...prev,
          { ...student, stream: null, audioOn: true },
        ]);
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

    socket.on("student-video-toggle", ({ socketId, videoOn }) => {
      setStudentVideoStatus((prev) => ({ ...prev, [socketId]: videoOn }));
    });

    socket.on("student-audio-toggle", ({ socketId, audioOn }) => {
      console.log(`[Faculty] Student ${socketId} audio toggled: ${audioOn}`);
      setStudents((prev) =>
        prev.map((s) => (s.socketId === socketId ? { ...s, audioOn } : s))
      );
    });

    socket.on("student-tab-status", ({ socketId, visible }) => {
      setStudentTabStatus((prev) => ({ ...prev, [socketId]: visible }));
    });

    return () => {
      socket.off("active-students");
      socket.off("student-ready");
      socket.off("signal");
      socket.off("student-left");
      socket.off("student-status");
      socket.off("student-video-toggle");
      socket.off("student-audio-toggle");
      socket.off("student-tab-status");
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, [socket, user]);

  return (
    <Box minH="100vh" bg="#5f9ea0" p={6}>
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        bg="white"
        p={4}
        rounded="md"
        boxShadow="sm"
      >
        <Heading size="md">Faculty Dashboard</Heading>
        <Text fontWeight="bold">{user.name}</Text>
      </Flex>

      {/* Students Grid */}
      <Grid templateColumns="repeat(auto-fill, minmax(320px, 1fr))" gap={6}>
        {students.map((s) => {
          const isOnline =
            studentStatus[s.socketId] &&
            Date.now() - studentStatus[s.socketId].lastActive < 10000;
          const isTabActive = studentTabStatus[s.socketId] !== false;
          const isVideoOn = studentVideoStatus[s.socketId] ?? true;
          const isAudioOn = s.audioOn ?? true;

          return (
            <GridItem key={s.socketId}>
              <Box
                bg="white"
                p={4}
                rounded="md"
                boxShadow="md"
                position="relative"
              >
                {/* Audio Badge */}
                <Badge
                  position="absolute"
                  top="4px"
                  right="4px"
                  colorScheme={isAudioOn ? "green" : "red"}
                  fontSize="0.8em"
                >
                  {isAudioOn ? "Unmuted" : "Muted"}
                </Badge>

                {/* Video */}
                <Box
                  border="1px solid"
                  borderColor="gray.300"
                  rounded="md"
                  overflow="hidden"
                  mb={3}
                >
                  <video
                    autoPlay
                    playsInline
                    style={{ width: "100%" }}
                    ref={(el) => {
                      if (el && s.stream) el.srcObject = s.stream;
                    }}
                  />
                </Box>

                {/* Student Info */}
                <VStack spacing={1} align="start">
                  <Text fontWeight="bold">{s.name}</Text>

                  <Badge
                    colorScheme={isOnline ? "green" : "red"}
                    width="fit-content"
                  >
                    {isOnline ? "Online" : "Inactive"}
                  </Badge>

                  <Badge
                    colorScheme={isTabActive ? "blue" : "orange"}
                    width="fit-content"
                  >
                    {isTabActive ? "Active Tab" : "Inactive Tab"}
                  </Badge>
                </VStack>
              </Box>
            </GridItem>
          );
        })}
      </Grid>

      {/* Chat Section */}
      <FacultyChat
        studentSocketId={user?.socketId || socket.id}
        studentName={user.name}
      />
    </Box>
  );
};

export default FacultyDashboard;
