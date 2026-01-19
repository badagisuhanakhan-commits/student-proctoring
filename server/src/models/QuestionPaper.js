// models/QuestionPaper.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: Number, // index of option
});

const questionPaperSchema = new mongoose.Schema({
  facultyId: String,
  title: String,
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("QuestionPaper", questionPaperSchema);
