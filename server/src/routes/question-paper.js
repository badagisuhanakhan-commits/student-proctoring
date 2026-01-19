import express from "express";
import {
  createQuestionPaper,
  getLatestPaper,
} from "../controllers/questionPaperController.js";
import { submitAnswers } from "../controllers/submissionController.js";
import { getLastLeaderBoard } from "../controllers/leaderBoardController.js";

const router = express.Router();

router.post("/", createQuestionPaper); // faculty
router.get("/latest", getLatestPaper); // student
router.post("/submit", submitAnswers); // student
router.get("/last-leaderboard", getLastLeaderBoard); // faculty

export default router;
