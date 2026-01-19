import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Radio,
  RadioGroup,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useSocket } from "@/context/SocketContext";
import { useUser } from "@/context/UserContext";

const StudentExam = () => {
  const socket = useSocket();
  const { user } = useUser();
  const toast = useToast();

  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false); // ✅ track submission
  const [paperKey, setPaperKey] = useState(0);

  // 📥 Receive paper in real-time
  useEffect(() => {
    socket.on("new-question-paper", (newPaper) => {
      // ✅ Reset everything when new paper arrives
      console.log("[Student] New question paper received:", newPaper);
      setPaper(newPaper);
      setAnswers(new Array(newPaper.questions.length).fill(null));
      setResult(null);
      setSubmitted(false);
      setPaperKey((prev) => prev + 1); // ✅ force re-render all RadioGroups

      toast({
        title: "New Question Paper Available",
        description: paper
          ? `Title: ${paper.title}`
          : "A new question paper has been published.",
        status: "info",
      });
    });

    return () => socket.off("new-question-paper");
  }, [socket]);

  // 🧠 Select answer
  const selectAnswer = (qi, value) => {
    const updated = [...answers];
    updated[qi] = Number(value);
    setAnswers(updated);
  };

  // 🚀 Submit answers
  const submitAnswers = async () => {
    if (answers.some((a) => a === null)) {
      toast({
        title: "Answer all questions",
        status: "warning",
      });
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/question-paper/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paperId: paper._id,
            studentId: user.id,
            studentName: user.name,
            answers,
          }),
        },
      );

      const data = await res.json();
      setResult(data);
      setSubmitted(true); // ✅ disable submit button

      toast({
        title: "Submitted successfully",
        status: "success",
      });
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err.message,
        status: "error",
      });
    }
  };

  if (!paper) return null;

  return (
    <Box
      key={paperKey}
      width="100%"
      bg="white"
      p={6}
      rounded="md"
      boxShadow="md"
      mt={6}
    >
      <Heading size="md" mb={4}>
        {paper.title}
      </Heading>

      <VStack spacing={5} align="stretch">
        {paper.questions.map((q, qi) => (
          <Box key={`${q._id}-${qi}`}>
            <Text fontWeight="bold">
              Q{qi + 1}. {q.question}
            </Text>

            <RadioGroup
              mt={2}
              value={answers[qi]}
              onChange={(v) => selectAnswer(qi, v)}
              isDisabled={submitted} // ✅ disable selecting after submit
            >
              <VStack align="start">
                {q.options.map((opt, oi) => (
                  <Radio key={`${q._id}-${oi}`} value={oi}>
                    {opt}
                  </Radio>
                ))}
              </VStack>
            </RadioGroup>
          </Box>
        ))}
      </VStack>

      <Button
        mt={6}
        colorScheme="teal"
        onClick={submitAnswers}
        isDisabled={submitted} // ✅ disable submit button after submit
      >
        Submit Answers
      </Button>

      {/* ✅ Result */}
      {result && (
        <Box mt={4}>
          <Text fontWeight="bold">
            Score: {result.score} / {result.total}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default StudentExam;
