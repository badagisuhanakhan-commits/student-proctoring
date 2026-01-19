import QuestionPaper from "../models/QuestionPaper.js";

export const createQuestionPaper = async (req, res) => {
  try {
    const paper = await QuestionPaper.create(req.body);
    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLatestPaper = async (req, res) => {
  const paper = await QuestionPaper.findOne().sort({ createdAt: -1 });
  res.json(paper);
};
