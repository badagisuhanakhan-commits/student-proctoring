// models/Submission.js
import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  paperId: mongoose.Schema.Types.ObjectId,
  studentId: String,
  studentName: String,
  answers: [Number],
  score: Number,
  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Submission", submissionSchema);
