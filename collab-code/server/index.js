const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const usersInRoom = {};

io.on("connection", (socket) => {
  console.log("⚡ connected:", socket.id);

  socket.on("join_room", ({ roomId, username }) => {
  socket.join(roomId);
  if (!usersInRoom[roomId]) usersInRoom[roomId] = [];

  // Prevent duplicate — check if already in room
  const alreadyIn = usersInRoom[roomId].some(u => u.id === socket.id);
  if (alreadyIn) return;

  usersInRoom[roomId].forEach((u) => {
    io.to(u.id).emit("new-peer-joined", { newPeerId: socket.id });
  });

  usersInRoom[roomId].push({ id: socket.id, username });
  io.to(roomId).emit("room_users", usersInRoom[roomId]);
});

  socket.on("leave_room", (roomId) => handleLeave(socket, roomId));

  socket.on("code_change", ({ roomId, code }) => {
    socket.to(roomId).emit("code_update", code);
  });

  socket.on("send_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive_message", { username, message });
  });

  socket.on("speaking", ({ roomId, username }) => {
    socket.to(roomId).emit("speaking", username);
  });

  socket.on("video-offer", ({ offer, to }) => {
    console.log(`📹 video-offer: ${socket.id} → ${to}`);
    socket.to(to).emit("video-offer", { offer, from: socket.id });
  });

  socket.on("video-answer", ({ answer, to }) => {
    console.log(`📹 video-answer: ${socket.id} → ${to}`);
    socket.to(to).emit("video-answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("peer-media-state", ({ micOn, videoOn, roomId }) => {
    socket.to(roomId).emit("peer-media-state", { from: socket.id, micOn, videoOn });
  });

  socket.on("draw", (data) => socket.to(data.roomId).emit("draw", data));
  socket.on("undo", ({ roomId }) => socket.to(roomId).emit("undo"));
  socket.on("redo", ({ roomId, stroke }) => socket.to(roomId).emit("redo", stroke));
  socket.on("clear", ({ roomId }) => socket.to(roomId).emit("clear"));

  socket.on("disconnect", () => {
    console.log("❌ disconnected:", socket.id);
    for (const roomId in usersInRoom) handleLeave(socket, roomId);
  });
});

function handleLeave(socket, roomId) {
  if (!usersInRoom[roomId]) return;
  usersInRoom[roomId] = usersInRoom[roomId].filter((u) => u.id !== socket.id);
  io.to(roomId).emit("room_users", usersInRoom[roomId]);
  if (usersInRoom[roomId].length === 0) delete usersInRoom[roomId];
}

const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

app.post("/run", (req, res) => {
  const { code, language } = req.body;
  const id = Date.now();
  let file, command, cleanupFiles = [];

  try {
    if (language === "javascript") {
      file = path.join(TEMP_DIR, `temp_${id}.js`);
      fs.writeFileSync(file, code);
      command = `node ${file}`;
      cleanupFiles = [file];
    } else if (language === "python") {
      file = path.join(TEMP_DIR, `temp_${id}.py`);
      fs.writeFileSync(file, code);
      command = `python3 ${file}`;
      cleanupFiles = [file];
    } else if (language === "cpp") {
      file = path.join(TEMP_DIR, `temp_${id}.cpp`);
      const exe = path.join(TEMP_DIR, `temp_${id}`);
      fs.writeFileSync(file, code);
      command = `g++ ${file} -o ${exe} && ${exe}`;
      cleanupFiles = [file, exe];
    } else if (language === "java") {
      file = path.join(TEMP_DIR, `Main.java`);
      fs.writeFileSync(file, code);
      command = `javac ${file} && java -cp ${TEMP_DIR} Main`;
      cleanupFiles = [file, path.join(TEMP_DIR, "Main.class")];
    } else {
      return res.json({ output: "⚠️ Language not supported" });
    }

    exec(command, { timeout: 5000 }, (err, stdout, stderr) => {
      let output = err ? (stderr || err.message) : (stderr?.trim() || stdout?.trim() || "No output");
      res.json({ output });
      cleanupFiles.forEach((f) => fs.unlink(f, () => {}));
    });
  } catch (e) {
    res.json({ output: "Execution error: " + e.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));