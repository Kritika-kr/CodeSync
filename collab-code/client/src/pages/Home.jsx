import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh"
    }}>
      <h1>Collaborative Coding Platform</h1>

      <input
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br />

      <button onClick={createRoom}>Create Room</button>

      <br />

      <input
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />

      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}