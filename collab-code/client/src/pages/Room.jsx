import { useParams, useLocation } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import Chat from "../components/chat";
import VideoCall from "../components/VideoCall";
import Whiteboard from "../components/Whiteboard";
import { useEffect, useState } from "react";
import socket from "../socket";

export default function Room() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username || "Guest";

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!roomId || !username) return;

    socket.emit("join_room", { roomId, username });

    socket.on("room_users", (users) => {
      setUsers(users);
    });

    return () => socket.off("room_users");
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* LEFT: USERS */}
      <div
        style={{
          width: "200px",
          background: "#1e293b",
          color: "white",
          padding: "10px",
        }}
      >
        <h3>Users ({users.length})</h3>

        {users.map((u) => (
          <p key={u.id}>• {u.username}</p>
        ))}

        <hr />

        <button onClick={() => navigator.clipboard.writeText(roomId)}>
          Copy Room ID
        </button>
      </div>

      {/* CENTER: EDITOR + WHITEBOARD */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",   // ✅ IMPORTANT FIX
        }}
      >
        <h3>Room: {roomId}</h3>

        <CodeEditor />

        {/* 🎨 WHITEBOARD */}
        <Whiteboard />
      </div>

      {/* RIGHT: VIDEO + CHAT */}
      <div
        style={{
          width: "300px",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #ccc",
        }}
      >
        {/* Video */}
        <div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
          <VideoCall />
        </div>

        {/* Chat */}
        <div style={{ flex: 1 }}>
          <Chat />
        </div>
      </div>
    </div>
  );
}