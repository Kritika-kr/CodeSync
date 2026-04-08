const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const usersInRoom = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ JOIN ROOM
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!usersInRoom[roomId]) {
      usersInRoom[roomId] = [];
    }

    const exists = usersInRoom[roomId].find(
      (u) => u.id === socket.id
    );

    if (!exists) {
      usersInRoom[roomId].push({
        id: socket.id,
        username,
      });
    }

    io.to(roomId).emit("room_users", usersInRoom[roomId]);
  });

  // 🔥 LEAVE ROOM (manual leave button)
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);

    if (usersInRoom[roomId]) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(
        (u) => u.id !== socket.id
      );

      io.to(roomId).emit("room_users", usersInRoom[roomId]);
    }

    // 🔥 notify others (remove video)
    socket.to(roomId).emit("user-disconnected", socket.id);
  });

  // ✅ CODE SYNC
  socket.on("code_change", ({ roomId, code }) => {
    socket.to(roomId).emit("code_update", code);
  });

  // ✅ CHAT
  socket.on("send_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive_message", {
      username,
      message,
    });
  });

  // 🔥 VIDEO SIGNALING
  socket.on("video-offer", ({ offer, roomId }) => {
    socket.to(roomId).emit("video-offer", offer);
  });

  socket.on("video-answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("video-answer", answer);
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // 🎨 WHITEBOARD
  socket.on("draw", ({ roomId, x0, y0, x1, y1 }) => {
    socket.to(roomId).emit("draw", { x0, y0, x1, y1 });
  });

  // 🔥 DISCONNECT (important)
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let roomId in usersInRoom) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(
        (u) => u.id !== socket.id
      );

      io.to(roomId).emit("room_users", usersInRoom[roomId]);

      // 🔥 notify all users in room
      socket.to(roomId).emit("user-disconnected", socket.id);
    }
  });
});


// ✅ CODE EXECUTION (DEPLOY SAFE)
app.post("/run", (req, res) => {
  const { code, language } = req.body;

  try {
    if (language !== "javascript") {
      return res.json({
        output: "⚠️ Only JavaScript supported in deployed version",
      });
    }

    const filePath = path.join(__dirname, "temp.js");
    fs.writeFileSync(filePath, code);

    exec(`node ${filePath}`, (error, stdout, stderr) => {
      if (error) return res.json({ output: error.message });
      if (stderr) return res.json({ output: stderr });

      res.json({ output: stdout || "No output" });

      fs.unlinkSync(filePath);
    });
  } catch {
    res.json({ output: "Execution error" });
  }
});


// ✅ START SERVER
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});