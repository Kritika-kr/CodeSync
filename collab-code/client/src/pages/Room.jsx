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

  
  const username =
    location.state?.username ||
    localStorage.getItem("username") ||
    "Guest";

  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [fullEditor, setFullEditor] = useState(false);
  const [fullWhiteboard, setFullWhiteboard] = useState(false);

  // JOIN ROOM
  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { roomId, username });

    socket.on("room_users", setUsers);

    return () => {
      socket.off("room_users");
    };
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      socket.emit("leave_room", roomId);
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      socket.emit("leave_room", roomId);
    };
  }, []);

  //  LEAVE ROOM BUTTON
  const leaveRoom = () => {
    socket.emit("leave_room", roomId);

    //Prevent going back to same room
    window.location.replace("/");
  };

  return (
    <div style={styles.container}>
      
      {/* USERS PANEL */}
      <div style={{ ...styles.sidebar, width: showUsers ? 220 : 0 }}>
        {showUsers && (
          <>
            <h3 style={styles.heading}>Users ({users.length})</h3>

            {users.map((u) => (
              <div key={u.id} style={styles.user}>
                👤 {u.username}
              </div>
            ))}

            <div style={styles.divider} />

            <button
              style={styles.btn}
              onClick={() => navigator.clipboard.writeText(roomId)}
            >
              Copy Room ID
            </button>

            <button style={styles.leaveBtn} onClick={leaveRoom}>
              Leave Room
            </button>
          </>
        )}
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        {/* CONTROLS */}
        <div style={styles.topbar}>
          <button style={styles.controlBtn} onClick={() => setShowUsers(!showUsers)}>👥</button>
          <button style={styles.controlBtn} onClick={() => setShowChat(!showChat)}>💬</button>
          <button style={styles.controlBtn} onClick={() => setShowVideo(!showVideo)}>🎥</button>
          <button style={styles.controlBtn} onClick={() => setFullEditor(!fullEditor)}>🖥</button>
          <button style={styles.controlBtn} onClick={() => setFullWhiteboard(!fullWhiteboard)}>🎨</button>
        </div>

        <h3 style={styles.roomId}>Room: {roomId}</h3>

        {!fullWhiteboard && <CodeEditor fullScreen={fullEditor} />}
        {!fullEditor && <Whiteboard fullScreen={fullWhiteboard} />}
      </div>

      {/* RIGHT PANEL */}
      {(showChat || showVideo) && (
        <div style={styles.rightPanel}>
          {showVideo && (
            <div style={styles.card}>
              <VideoCall />
            </div>
          )}

          {showChat && (
            <div style={{ ...styles.card, flex: 1, overflow: "hidden" }}>
              <Chat />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
  },

  sidebar: {
    background: "#020617",
    padding: "15px",
    overflow: "hidden",
    transition: "0.3s",
    borderRight: "1px solid #334155",
  },

  heading: {
    marginBottom: "10px",
  },

  user: {
    padding: "6px",
    background: "#1e293b",
    marginBottom: "5px",
    borderRadius: "6px",
  },

  divider: {
    height: "1px",
    background: "#334155",
    margin: "10px 0",
  },

  btn: {
    width: "100%",
    padding: "8px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    marginBottom: "8px",
  },

  leaveBtn: {
    width: "100%",
    padding: "8px",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
  },

  topbar: {
    display: "flex",
    gap: "8px",
    marginBottom: "10px",
  },

  controlBtn: {
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "white",
    cursor: "pointer",
  },

  roomId: {
    marginBottom: "10px",
    color: "#94a3b8",
  },

  rightPanel: {
    width: "320px",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #334155",
    background: "#020617",
  },

  card: {
    padding: "10px",
    borderBottom: "1px solid #334155",
  },
};