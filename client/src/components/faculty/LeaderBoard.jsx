import { Box, Heading, Text, HStack, VStack } from "@chakra-ui/react";

export const LeaderBoard = ({ leaderboard }) => {
  console.log("Rendering LeaderBoard with data:", leaderboard);
  return (
    <Box mt={6} bg="white" p={4} rounded="md" boxShadow="md">
      <Heading size="sm" mb={3}>
        Leaderboard
      </Heading>
      {leaderboard.length === 0 ? (
        <Text>No submissions yet</Text>
      ) : (
        <VStack spacing={2} align="stretch">
          {leaderboard.map((s, i) => (
            <HStack
              key={s.studentId}
              justify="space-between"
              p={2}
              bg={i === 0 ? "green.100" : "gray.50"}
              rounded="md"
            >
              <Text>{s.studentName}</Text>
              <Text>{s.score}</Text>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
};
