import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { Analytics } from "@vercel/analytics/next"

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const createRoom = () => {
    if (!username.trim()) return alert("Enter your name");

    const id = uuid();
    navigate(`/room/${id}`, { state: { username } });
  };

  const joinRoom = () => {
    if (!roomId.trim() || !username.trim()) {
      return alert("Enter room ID and name");
    }

    navigate(`/room/${roomId}`, { state: { username } });
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        color: "white",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "350px",
          padding: "30px",
          borderRadius: "12px",
          background: "#020617",
          boxShadow: "0 0 30px rgba(34,197,94,0.2)",
          textAlign: "center",
        }}
      >
        {/* Title */}
        <h1 style={{ marginBottom: "10px" }}>Collab Code</h1>

        {/*  Tagline */}
        <p style={{ fontSize: "14px", opacity: 0.7, marginBottom: "20px" }}>
          Code • Chat • Collaborate in Real-time
        </p>

        {/* Username */}
        <input
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && createRoom()}
        />

        {/* Create Room */}
        <button
          onClick={createRoom}
          style={primaryBtn}
          onMouseOver={(e) => (e.target.style.opacity = 0.8)}
          onMouseOut={(e) => (e.target.style.opacity = 1)}
        >
          Create Room
        </button>

        <p style={{ margin: "15px 0", opacity: 0.6 }}>OR</p>

        {/* Generate Room ID */}
        <button
          onClick={() => setRoomId(uuid())}
          style={{
            marginBottom: "10px",
            fontSize: "12px",
            background: "transparent",
            color: "#38bdf8",
            border: "none",
            cursor: "pointer",
          }}
        >
          Generate Room ID
        </button>

        {/* Room ID */}
        <input
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && joinRoom()}
        />

        {/*  Join Room */}
        <button
          onClick={joinRoom}
          style={secondaryBtn}
          onMouseOver={(e) => (e.target.style.opacity = 0.8)}
          onMouseOut={(e) => (e.target.style.opacity = 1)}
        >
          Join Room
        </button>

        {/*  Footer */}
        <p style={{ fontSize: "10px", marginTop: "15px", opacity: 0.5 }}>
          Built by Kritika Kumari 
        </p>
      </div>
    </div>
  );
}

//  Input Style
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  outline: "none",
};

//  Buttons
const primaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#22c55e",
  border: "none",
  color: "white",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#3b82f6",
  border: "none",
  color: "white",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};