import Submission from "../models/Submission.js";
import QuestionPaper from "../models/QuestionPaper.js";
import { io, faculties } from "../index.js"; // use exported Map

export const submitAnswers = async (req, res) => {
  try {
    const { paperId, studentId, studentName, answers } = req.body;

    const paper = await QuestionPaper.findById(paperId);
    if (!paper) return res.status(404).json({ message: "Paper not found" });
    console.log("Paper found for submission:", paperId, paper);
    // Calculate score
    let score = 0;
    paper.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });

    // Save submission
    const submission = new Submission({
      paperId: paperId,
      studentId,
      studentName,
      answers,
      score,
    });

    console.log("Saving submission:", submission);

    await submission.save();

    // ✅ Emit leaderboard update to all faculties
    // Note: faculties is your Map from socket.id -> { userId, name }
    if (faculties && faculties.size > 0) {
      console.log(
        "Emitting leaderboard update to faculties",
        Array.from(faculties.values()),
      );
      faculties.forEach((f, fid) => {
        io.to(fid).emit("leaderboard-update", {
          studentId,
          studentName,
          paperId,
          score,
          submittedAt: Date.now(),
        });
      });
    }

    res.json({ score, total: paper.questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
