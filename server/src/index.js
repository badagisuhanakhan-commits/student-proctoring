import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
// import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());

connectDB();
app.use("/api/auth", authRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const students = new Map();  // socketId -> { userId, name }
const faculties = new Map(); // socketId -> { userId, name }

io.on("connection", (socket) => {
  console.log("[Server] Socket connected:", socket.id);

  socket.on("join-student", ({ userId, name }) => {
    students.set(socket.id, { userId, name });
    console.log(`[Server] Student joined: ${name}, socketId: ${socket.id}`);
  });

  socket.on("student-ready", ({ userId, name }) => {
    console.log(`[Server] Student ready: ${name}, socketId: ${socket.id}`);
    // Notify all faculties about this student
    faculties.forEach((f, fid) => {
      console.log(`[Server] Notifying faculty ${f.name} about student ${name}`);
      io.to(fid).emit("student-ready", {
        userId,
        name,
        socketId: socket.id,
      });

      // Also send faculty socket ID to student
      socket.emit("faculty-available", { facultySocketId: fid, facultyName: f.name });
    });
  });


  socket.on("join-faculty", ({ userId, name }) => {
    faculties.set(socket.id, { userId, name });
    console.log(`[Server] Faculty joined: ${name}, socketId: ${socket.id}`);

    const activeStudents = Array.from(students.entries()).map(([socketId, data]) => ({
      name: data.name,
      socketId,
      userId: data.userId,
    }));
    console.log("[Server] Sending active students to faculty:", activeStudents);
    socket.emit("active-students", activeStudents);
  });

  socket.on("signal", ({ to, data }) => {
    console.log(`[Server] Signal from ${socket.id} to ${to}, type: ${data?.type || 'candidate'}`);
    io.to(to).emit("signal", { from: socket.id, data });
  });

  // Chat from student to faculty
  // socket.on("chat-to-faculty", ({ message, studentName }) => {
  //   console.log(`[Server] Chat from student ${socket.id} (${studentName}) to all faculties: ${message}`);
  //   // Broadcast to all faculties
  //   faculties.forEach((f, fid) => {
  //     io.to(fid).emit("chat-from-student", { message, studentName });
  //   });
  // });

  // // Chat from faculty to student
  // socket.on("chat-to-students", ({ message, facultyName }) => {
  //   console.log(`[Server] Chat from faculty ${socket.id} (${facultyName}) to all students: ${message}`);
  //   // Broadcast to all students
  //   students.forEach((s, sid) => {
  //     io.to(sid).emit("chat-from-faculty", { message, facultyName });
  //   });
  // });


  // Chat from student
  socket.on("chat-to-all", ({ message, sender }) => {
    console.log(`[Server] Chat from ${sender}: ${message}`);

    // Broadcast to all students
    students.forEach((s, sid) => {
      io.to(sid).emit("chat-message", { message, sender });
    });

    // Broadcast to all faculties
    faculties.forEach((f, fid) => {
      io.to(fid).emit("chat-message", { message, sender });
    });
  });

  // Chat from faculty
  socket.on("chat-to-all-faculty", ({ message, sender }) => {
    console.log(`[Server] Chat from faculty ${sender}: ${message}`);

    // Broadcast to all students
    students.forEach((s, sid) => {
      io.to(sid).emit("chat-message", { message, sender });
    });

    // Broadcast to all faculties (including sender)
    faculties.forEach((f, fid) => {
      io.to(fid).emit("chat-message", { message, sender });
    });
  });

  socket.on("student-heartbeat", () => {
    // we can update lastActive time
    if (students.has(socket.id)) {
      const s = students.get(socket.id);
      s.lastActive = Date.now();
      students.set(socket.id, s);

      // notify all faculty about updated status
      faculties.forEach((f, fid) => {
        io.to(fid).emit("student-status", {
          socketId: socket.id,
          name: s.name,
          lastActive: s.lastActive,
        });
      });
    }
  });



  socket.on("disconnect", () => {
    if (students.has(socket.id)) {
      const s = students.get(socket.id);
      students.delete(socket.id);
      console.log(`[Server] Student disconnected: ${s.name}, socketId: ${socket.id}`);
      faculties.forEach((f, fid) =>
        io.to(fid).emit("student-left", { socketId: socket.id, userId: s.userId })
      );
    }
    if (faculties.has(socket.id)) {
      const f = faculties.get(socket.id);
      faculties.delete(socket.id);
      console.log(`[Server] Faculty disconnected: ${f.name}, socketId: ${socket.id}`);
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
