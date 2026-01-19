import { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  VStack,
  HStack,
  Text,
  Radio,
  RadioGroup,
  Divider,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
} from "@chakra-ui/react";
import { useSocket } from "../../context/SocketContext";
import { useUser } from "../../context/UserContext";
import { generateRandomQuestionPaper } from "@/utils/questionGenerator";

// 🔁 Fresh factory function (IMPORTANT)
const createEmptyQuestion = () => ({
  id: Date.now() + Math.random(), // ✅ unique per question
  question: "",
  options: ["", "", "", ""],
  correctAnswer: null,
});

const CreateQuestionPaper = () => {
  const { user } = useUser();
  const socket = useSocket();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    createEmptyQuestion(),
    createEmptyQuestion(),
  ]);

  const fillRandomPaper = () => {
    const paper = generateRandomQuestionPaper(3); // 3 random questions
    setTitle(paper.title);
    setQuestions(paper.questions);
  };

  const resetPaper = () => {
    setTitle("");
    setQuestions([createEmptyQuestion(), createEmptyQuestion()]);
  };

  // 🔁 Handlers
  const updateQuestion = (qi, value) => {
    const updated = [...questions];
    updated[qi].question = value;
    setQuestions(updated);
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...questions];
    updated[qi].options[oi] = value;
    setQuestions(updated);
  };

  const setCorrectAnswer = (qi, value) => {
    const updated = [...questions];
    updated[qi].correctAnswer = Number(value);
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const removeQuestion = (qi) => {
    if (questions.length <= 2) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  };

  // 🚀 Submit
  const submitPaper = async () => {
    if (
      !title ||
      questions.some((q) => !q.question || q.correctAnswer === null)
    ) {
      toast({
        title: "Incomplete paper",
        description: "Fill all questions and select correct answers",
        status: "warning",
      });
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/question-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: user.id,
          facultyName: user.name,
          title,
          questions,
        }),
      });

      const savedPaper = await res.json();

      socket.emit("publish-question-paper", savedPaper);

      toast({
        title: "Question paper published",
        status: "success",
      });

      // ✅ Proper reset
      setTitle("");
      setQuestions([createEmptyQuestion(), createEmptyQuestion()]);
      setIsOpen(false); // 👈 close accordion
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err.message,
        status: "error",
      });
    }
  };

  return (
    <Accordion
      allowToggle
      index={isOpen ? 0 : -1}
      onChange={(idx) => setIsOpen(idx === 0)}
      mb={6}
    >
      <AccordionItem border="none">
        <AccordionButton bg="white" p={4} rounded="md" boxShadow="sm">
          <Box flex="1" textAlign="left">
            <Heading size="sm">Set Question Paper</Heading>
          </Box>
          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel pb={4}>
          <Box bg="white" p={6} rounded="md" boxShadow="md">
            <Flex>
              {/* DEV ONLY: Fill random questions */}
              <Button
                mb={4}
                colorScheme="orange"
                variant="outline"
                onClick={fillRandomPaper}
              >
                Fill Random Questions (Dev Only)
              </Button>
              <Button
                mb={4}
                ml={4}
                colorScheme="red"
                variant="outline"
                onClick={resetPaper}
              >
                Reset Paper
              </Button>
            </Flex>
            <Input
              placeholder="Exam Title"
              value={title}
              mb={4}
              onChange={(e) => setTitle(e.target.value)}
            />

            <VStack spacing={6} align="stretch">
              {questions.map((q, qi) => (
                <Box
                  key={q.id}
                  p={4}
                  border="1px solid"
                  borderColor="gray.300"
                  rounded="md"
                  position="relative"
                >
                  {questions.length > 2 && (
                    <Button
                      size="xs"
                      colorScheme="red"
                      position="absolute"
                      top="8px"
                      right="8px"
                      onClick={() => removeQuestion(qi)}
                    >
                      Remove
                    </Button>
                  )}

                  <Text fontWeight="bold">Question {qi + 1}</Text>

                  <Input
                    mt={2}
                    placeholder="Enter question"
                    value={q.question}
                    onChange={(e) => updateQuestion(qi, e.target.value)}
                  />

                  <RadioGroup
                    mt={3}
                    value={q.correctAnswer}
                    onChange={(v) => setCorrectAnswer(qi, v)}
                  >
                    <VStack align="start">
                      {q.options.map((opt, oi) => (
                        <HStack key={`${q.id}-${oi}`} w="100%">
                          <Radio value={oi} />
                          <Input
                            placeholder={`Option ${oi + 1}`}
                            value={opt}
                            onChange={(e) =>
                              updateOption(qi, oi, e.target.value)
                            }
                          />
                        </HStack>
                      ))}
                    </VStack>
                  </RadioGroup>
                </Box>
              ))}
            </VStack>

            <Divider my={4} />

            <HStack justify="space-between">
              <Button
                onClick={addQuestion}
                colorScheme="blue"
                variant="outline"
              >
                + Add Question
              </Button>

              <Button colorScheme="teal" onClick={submitPaper}>
                Publish Paper
              </Button>
            </HStack>
          </Box>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default CreateQuestionPaper;
