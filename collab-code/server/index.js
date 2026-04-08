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

  // 🎨 WHITEBOARD DRAW
  socket.on("draw", ({ roomId, x0, y0, x1, y1 }) => {
    socket.to(roomId).emit("draw", { x0, y0, x1, y1 });
  });

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    for (let roomId in usersInRoom) {
      usersInRoom[roomId] = usersInRoom[roomId].filter(
        (u) => u.id !== socket.id
      );

      io.to(roomId).emit("room_users", usersInRoom[roomId]);
    }

    console.log("User disconnected:", socket.id);
  });
});


app.post("/run", (req, res) => {
  const { code, language } = req.body;

  const fileName = "temp";
  let command;

  try {
    if (language === "javascript") {
      fs.writeFileSync(`${fileName}.js`, code);
      command = `node ${fileName}.js`;
    }

    else if (language === "python") {
      fs.writeFileSync(`${fileName}.py`, code);
      command = `python ${fileName}.py`;
    }

    else if (language === "cpp") {
      fs.writeFileSync(`${fileName}.cpp`, code);
      command = `g++ ${fileName}.cpp -o ${fileName}.exe && ${fileName}.exe`;
    }

    else if (language === "java") {
      fs.writeFileSync(`Main.java`, code);
      command = `javac Main.java && java Main`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) return res.json({ output: error.message });
      if (stderr) return res.json({ output: stderr });

      res.json({ output: stdout || "No output" });
    });

  } catch {
    res.json({ output: "Execution error" });
  }
});
// ✅ START SERVER
server.listen(5000, () => {
  console.log("Server running on port 5000");
});