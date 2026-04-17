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

  // JOIN ROOM
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!usersInRoom[roomId]) usersInRoom[roomId] = [];

    const exists = usersInRoom[roomId].some(
      (u) => u.id === socket.id
    );

    if (!exists) {
      usersInRoom[roomId].push({ id: socket.id, username });
    }

    io.to(roomId).emit("room_users", usersInRoom[roomId]);
  });

  // LEAVE ROOM
  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);

    if (usersInRoom[roomId]) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(
        (u) => u.id !== socket.id
      );

      io.to(roomId).emit("room_users", usersInRoom[roomId]);
    }

    socket.to(roomId).emit("user-disconnected", socket.id);
  });

  // CODE SYNC
  socket.on("code_change", ({ roomId, code }) => {
    socket.to(roomId).emit("code_update", code);
  });

  // CHAT
  socket.on("send_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive_message", { username, message });
  });

  // VIDEO SIGNALING
  socket.on("video-offer", ({ offer, roomId }) => {
    socket.to(roomId).emit("video-offer", offer);
  });

  socket.on("video-answer", ({ answer, roomId }) => {
    socket.to(roomId).emit("video-answer", answer);
  });

  socket.on("ice-candidate", ({ candidate, roomId }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  // WHITEBOARD DRAW (FULL DATA)
  socket.on("draw", (data) => {
    socket.to(data.roomId).emit("draw", data);
  });

  // UNDO
  socket.on("undo", ({ roomId }) => {
    socket.to(roomId).emit("undo");
  });

  // REDO
  socket.on("redo", ({ roomId, stroke }) => {
    socket.to(roomId).emit("redo", stroke);
  });

  // CLEAR BOARD
  socket.on("clear", ({ roomId }) => {
    socket.to(roomId).emit("clear");
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let roomId in usersInRoom) {
      const before = usersInRoom[roomId].length;

      usersInRoom[roomId] = usersInRoom[roomId].filter(
        (u) => u.id !== socket.id
      );

      if (usersInRoom[roomId].length !== before) {
        io.to(roomId).emit("room_users", usersInRoom[roomId]);
        socket.to(roomId).emit("user-disconnected", socket.id);
      }

      // 🔥 CLEAN EMPTY ROOM
      if (usersInRoom[roomId].length === 0) {
        delete usersInRoom[roomId];
      }
    }
  });
});


// SAFE CODE RUNNER
app.post("/run", (req, res) => {
  const { code, language } = req.body;

  if (language !== "javascript") {
    return res.json({
      output: "⚠️ Only JavaScript supported",
    });
  }

  try {
    // UNIQUE FILE NAME (IMPORTANT)
    const fileName = `temp_${Date.now()}.js`;
    const filePath = path.join(__dirname, fileName);

    fs.writeFileSync(filePath, code);

    exec(`node ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
      let output = "";

      if (error) output = error.message;
      else if (stderr) output = stderr;
      else output = stdout || "No output";

      res.json({ output });

      // CLEAN FILE
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    res.json({ output: "Execution error" });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});