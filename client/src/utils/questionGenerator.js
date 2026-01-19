// src/utils/questionGenerator.js
export const generateRandomQuestionPaper = (numQuestions = 5) => {
  const questions = [];

  for (let i = 0; i < numQuestions; i++) {
    const q = {
      id: Date.now() + Math.random(),
      question: `Random Question ${i + 1}?`,
      options: [
        `Option A for Q${i + 1}`,
        `Option B for Q${i + 1}`,
        `Option C for Q${i + 1}`,
        `Option D for Q${i + 1}`,
      ],
      correctAnswer: Math.floor(Math.random() * 4),
    };
    questions.push(q);
  }

  return {
    title: `Random Paper ${new Date().toLocaleTimeString()}`,
    questions,
  };
};
