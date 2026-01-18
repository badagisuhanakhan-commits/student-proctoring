import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { ChatIcon, CloseIcon } from "@chakra-ui/icons";

const StudentChat = () => {
  const { user } = useUser();
  const socket = useSocket();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ message, sender }) => {
      setMessages((prev) => [...prev, { message, sender }]);

      // Auto-open if message is from someone else
      if (sender !== user.name) {
        setIsOpen(true);
      }
    };

    socket.on("chat-message", handleMessage);

    return () => socket.off("chat-message", handleMessage);
  }, [socket, user.name]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;

    socket.emit("chat-to-all", { message: input, sender: user.name });

    // Add message locally
    setMessages((prev) => [...prev, { sender: user.name, message: input }]);
    setInput("");
  }, [input, socket, user.name]);

  return (
    <>
      {/* Chat Button */}
      <IconButton
        icon={<ChatIcon />}
        colorScheme="blue"
        position="fixed"
        bottom="20px"
        right="20px"
        borderRadius="full"
        size="lg"
        onClick={() => setIsOpen((prev) => !prev)}
        zIndex={1000}
      />

      {/* Chat Popup */}
      <Collapse in={isOpen} animateOpacity>
        <Box
          position="fixed"
          bottom="70px"
          right="20px"
          w="300px"
          maxH="400px"
          bg="white"
          boxShadow="lg"
          rounded="md"
          display="flex"
          flexDirection="column"
          zIndex={1000}
        >
          {/* Header */}
          <HStack
            justifyContent="space-between"
            bg="blue.500"
            color="white"
            p={2}
            borderTopRadius="md"
          >
            <Text fontWeight="bold">Class Chat</Text>
            <IconButton
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              color="white"
              onClick={() => setIsOpen(false)}
            />
          </HStack>

          {/* Messages */}
          <Box
            flex="1"
            p={2}
            overflowY="auto"
            borderBottom="1px solid #eee"
            bg="gray.50"
          >
            {messages.map((m, idx) => (
              <Box key={idx} mb={2}>
                <Text fontSize="sm">
                  <b>{m.sender}:</b> {m.message}
                </Text>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <HStack p={2} spacing={2}>
            <Input
              size="sm"
              placeholder="Type message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <Button size="sm" colorScheme="blue" onClick={sendMessage}>
              Send
            </Button>
          </HStack>
        </Box>
      </Collapse>
    </>
  );
};

export default StudentChat;
