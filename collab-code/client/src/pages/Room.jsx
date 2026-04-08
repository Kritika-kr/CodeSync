import { useParams, useLocation, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import Chat from "../components/chat";
import VideoCall from "../components/VideoCall";
import Whiteboard from "../components/Whiteboard";
import { useEffect, useState } from "react";
import socket from "../socket";

export default function Room() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username || "Guest";

  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [fullEditor, setFullEditor] = useState(false);
  const [fullWhiteboard, setFullWhiteboard] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { roomId, username });

    socket.on("room_users", (users) => {
      setUsers(users);
    });

    if (window.innerWidth < 768) {
      setShowUsers(false);
    }

    return () => socket.off("room_users");
  }, []);

  const leaveRoom = () => {
    socket.emit("leave_room", roomId);
    navigate("/");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* 🔹 USERS PANEL */}
      <div
        style={{
          width: showUsers ? "200px" : "0px",
          overflow: "hidden",
          transition: "0.3s",
          background: "#1e293b",
          color: "white",
          padding: showUsers ? "10px" : "0px",
        }}
      >
        {showUsers && (
          <>
            <h3>Users ({users.length})</h3>

            {users.map((u) => (
              <p key={u.id}>• {u.username}</p>
            ))}

            <hr />

            <button onClick={() => navigator.clipboard.writeText(roomId)}>
              Copy Room ID
            </button>

            <button
              onClick={leaveRoom}
              style={{
                marginTop: "10px",
                background: "red",
                color: "white",
                padding: "6px",
                border: "none",
                width: "100%",
              }}
            >
              Leave Room
            </button>
          </>
        )}
      </div>

      {/* 🔹 CENTER */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
        }}
      >
        {/* 🔥 CONTROL BAR */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          
          <button onClick={() => setShowUsers(!showUsers)}>👥</button>

          <button onClick={() => setShowChat(!showChat)}>
            {showChat ? "Hide Chat" : "Show Chat"}
          </button>

          <button onClick={() => setShowVideo(!showVideo)}>
            {showVideo ? "Hide Video" : "Show Video"}
          </button>

          <button onClick={() => setFullEditor(!fullEditor)}>
            {fullEditor ? "Exit Editor" : "Full Editor"}
          </button>

          <button onClick={() => setFullWhiteboard(!fullWhiteboard)}>
            {fullWhiteboard ? "Exit Board" : "Full Board"}
          </button>
        </div>

        <h3>Room: {roomId}</h3>

        {!fullWhiteboard && <CodeEditor fullScreen={fullEditor} />}

        {!fullEditor && <Whiteboard fullScreen={fullWhiteboard} />}
      </div>

      {/* 🔹 RIGHT PANEL (DYNAMIC) */}
      {(showChat || showVideo) && (
        <div
          style={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #334155",
            background: "#0f172a",
          }}
        >
          {/* Video */}
          {showVideo && (
            <div style={{ padding: "10px", borderBottom: "1px solid #334155" }}>
              <VideoCall />
            </div>
          )}

          {/* Chat */}
          {showChat && (
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Chat />
            </div>
          )}
        </div>
      )}
    </div>
  );
}