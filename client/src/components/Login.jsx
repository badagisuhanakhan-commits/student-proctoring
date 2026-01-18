import { useState } from "react";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          role: data.user.role,
          token: data.token,
        });

        navigate(data.user.role === "faculty" ? "/faculty" : "/student");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.100"
    >
      <Box
        bg="white"
        p={8}
        rounded="md"
        boxShadow="md"
        width="100%"
        maxW="400px"
      >
        <Heading mb={6} textAlign="center">
          Login
        </Heading>

        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>

          <Button colorScheme="teal" width="100%" onClick={handleLogin}>
            Login
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;
