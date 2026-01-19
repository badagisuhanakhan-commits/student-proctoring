import Submission from "../models/Submission.js";
import QuestionPaper from "../models/QuestionPaper.js";

export const getLastLeaderBoard = async (req, res) => {
  try {
    const lastPaper = await QuestionPaper.findOne().sort({ createdAt: -1 });
    if (!lastPaper) return res.json({ leaderboard: [], paperId: null });
    console.log("Last paper found:", lastPaper);

    const submissions = await Submission.find({ paperId: lastPaper._id });

    console.log("Submissions for last paper:", lastPaper._id, submissions);

    const leaderboard = submissions.map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      score: s.score,
      submittedAt: s.createdAt,
    }));

    // Sort descending by score
    leaderboard.sort((a, b) => b.score - a.score);

    res.json({ paperId: lastPaper._id, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
