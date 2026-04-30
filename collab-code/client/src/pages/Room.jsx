import { useParams, useLocation } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import Chat from "../components/chat";
import VideoCall from "../components/VideoCall";
import Whiteboard from "../components/Whiteboard";
import { useEffect, useState } from "react";
import socket from "../socket";
import { AnimatePresence, motion } from "framer-motion";
import PreJoin from "../components/PreJoin";
import { useTheme } from "../context/ThemeContext";
import LoadingScreen from "../components/LoadingScreen";
import {
  Users, MessageSquare, Video, Maximize,
  Sun, Moon, PenTool, Copy, LogOut,
} from "lucide-react";

export default function Room() {
  const [videoOn, setVideoOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [output, setOutput] = useState("");
  const [outputLoading, setOutputLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { id: roomId } = useParams();
  const location = useLocation();
  const [fullWhiteboard, setFullWhiteboard] = useState(false);

  const username =
    location.state?.username || localStorage.getItem("username") || "Guest";

  const [users, setUsers] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);

 const handleJoin = (stream, settings) => {
  console.log("✅ handleJoin called, stream tracks:", stream?.getTracks());
  setLocalStream(stream);
  setVideoOn(settings.camOn);
  setMicOn(settings.micOn);
  setLoadingJoin(true);

  if (!socket.connected) socket.connect();

  setTimeout(() => {
    setJoined(true);
    setLoadingJoin(false);
    // ✅ REMOVED socket.emit("join_room") from here
  }, 800);
};

  useEffect(() => {
    // ✅ REMOVED the early join_room emit that was here before
    socket.on("room_users", setUsers);
    return () => socket.off("room_users");
  }, []);

  const leaveRoom = () => {
    socket.emit("leave_room", roomId);
    window.location.replace("/");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleVideo = async () => {
    if (!localStream) return;

    if (videoOn) {
      // Turn off — just disable the track, don't stop it
      // Stopping kills the track permanently; disabling is reversible
      localStream.getVideoTracks().forEach((t) => { t.enabled = false; });
      setVideoOn(false);
    } else {
      // Turn back on
      const existingTrack = localStream.getVideoTracks()[0];

      if (existingTrack && existingTrack.readyState === "live") {
        // Track still alive, just re-enable
        existingTrack.enabled = true;
        setVideoOn(true);
      } else {
        // Track was stopped (e.g. browser ended it), get a new one
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];

          // Replace in existing stream
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) localStream.removeTrack(oldTrack);
          localStream.addTrack(newVideoTrack);

          // ✅ Update all peer connections with new track
          // VideoCall handles this via streamRef, but we need to signal the parent's stream update
          setLocalStream(new MediaStream([
            newVideoTrack,
            ...localStream.getAudioTracks(),
          ]));
          setVideoOn(true);
        } catch (e) {
          console.error("Could not re-enable camera:", e);
        }
      }
    }
  };

  const toggleMic = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !micOn;
    setMicOn(!micOn);
  };

  return (
    <AnimatePresence mode="wait">
      {!joined && !loadingJoin && (
        <motion.div key="prejoin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PreJoin onJoin={handleJoin} />
        </motion.div>
      )}

      {loadingJoin && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoadingScreen />
        </motion.div>
      )}

      {joined && (
        <motion.div
          key="room"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={styles.container}>
            <div style={{ ...styles.container, gridTemplateColumns: "240px 1fr 320px" }}>

              {/* LEFT PANEL */}
              <div style={styles.panel}>
                <div style={styles.panelHeader}>
                  <div style={styles.headerLeft}>
                    <Users size={18} />
                    <span>Workspace</span>
                  </div>
                  <div style={styles.countBadge}>{users.length}</div>
                </div>

                <div style={styles.userList}>
                  {users.filter((u) => u != null).map((u) => (
                    <div key={u.id} style={styles.userRow}>
                      <div style={styles.avatar}>{u.username[0].toUpperCase()}</div>
                      <span style={styles.username}>{u.username}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.footer}>
                  <button style={styles.copyBtn} onClick={() => navigator.clipboard.writeText(roomId)}>
                    <Copy size={14} /> Copy ID
                  </button>
                  <button style={styles.leaveBtn} onClick={leaveRoom}>
                    <LogOut size={14} /> Leave
                  </button>
                </div>
              </div>

              {/* MAIN */}
              <div style={styles.main}>
                <div style={styles.topbar}>
                  <img src="/logo.png" alt="logo" style={styles.logo} />
                  <span style={styles.brandText}>CodeSync • {roomId}</span>
                  <div style={styles.controls}>
                    <button style={{ ...styles.controlBtn, ...(showChat && styles.activeBtn) }} onClick={() => setShowChat(!showChat)}>
                      <MessageSquare size={16} />
                    </button>
                    <button style={{ ...styles.controlBtn, ...(showVideo && styles.activeBtn) }} onClick={() => setShowVideo(!showVideo)}>
                      <Video size={16} />
                    </button>
                    <button style={{ ...styles.controlBtn, ...(isFullscreen && styles.activeBtn) }} onClick={toggleFullscreen}>
                      <Maximize size={16} />
                    </button>
                    <button style={{ ...styles.controlBtn, ...(fullWhiteboard && styles.activeBtn) }} onClick={() => setFullWhiteboard(!fullWhiteboard)}>
                      <PenTool size={16} />
                    </button>
                    <button style={{ ...styles.controlBtn, ...(theme === "light" && styles.activeBtn) }} onClick={toggleTheme}>
                      {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                  </div>
                </div>

                <div style={styles.content}>
                  {fullWhiteboard ? (
                    <div style={styles.fullWhiteboard}><Whiteboard /></div>
                  ) : (
                    <>
                      <div style={styles.editor}>
                        <CodeEditor fullScreen={false} onOutput={setOutput} onLoading={setOutputLoading} />
                      </div>
                      <div style={styles.output}>
                        <div style={styles.cardHeader}>Output</div>
                        <div style={styles.outputBox}>
                          {outputLoading ? "Running..." : (output || "No output")}
                        </div>
                      </div>
                      <div style={styles.whiteboard}><Whiteboard /></div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div style={styles.rightPanel}>
                {showVideo && (
                  <div style={styles.videoCard}>
                    <div style={styles.cardHeader}>🎥 Video</div>
                    <VideoCall
                      username={username}
                      users={users}
                      videoOn={videoOn}
                      myId={socket.id}
                      micOn={micOn}
                      stream={localStream}
                      toggleVideo={toggleVideo}
                      toggleMic={toggleMic}
                    />
                  </div>
                )}
                {showChat && (
                  <div style={styles.chatCard}>
                    <Chat />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  container: { display: "grid", height: "100vh", background: "var(--bg)", color: "var(--text)" },
  output: { height: "110px", borderRadius: "10px", overflow: "hidden", background: "var(--card)", border: "1px solid var(--border)", display: "flex", flexDirection: "column" },
  outputBox: { flex: 1, padding: "8px 10px", fontSize: "12px", fontFamily: "monospace", color: "#22c55e", overflowY: "auto" },
  panel: { padding: "16px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--card)" },
  logo: { height: "30px", filter: "drop-shadow(0 0 6px rgba(59,130,246,0.5))" },
  brandText: { fontSize: "18px", fontWeight: "700", background: "linear-gradient(90deg, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", fontWeight: "600", color: "var(--text)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "6px" },
  countBadge: { background: "var(--primary)", color: "#fff", padding: "2px 8px", borderRadius: "999px", fontSize: "12px" },
  userList: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px", overflowY: "auto" },
  userRow: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "600" },
  username: { fontSize: "14px", color: "var(--text)" },
  footer: { marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" },
  copyBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "8px", background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px" },
  leaveBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", borderRadius: "8px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px" },
  main: { display: "flex", flexDirection: "column", gap: "12px", padding: "14px", height: "100%", overflow: "hidden", minHeight: 0 },
  topbar: { display: "flex", justifyContent: "space-between", padding: "10px", background: "var(--card)", borderRadius: "10px", border: "1px solid var(--border)" },
  controls: { display: "flex", gap: "8px" },
  controlBtn: { width: "34px", height: "34px", borderRadius: "8px", background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" },
  activeBtn: { background: "var(--primary)", color: "#fff", boxShadow: "0 0 10px rgba(37,99,235,0.5)" },
  content: { display: "flex", flexDirection: "column", gap: "14px", flex: 1, minHeight: 0 },
  editor: { height: "320px", borderRadius: "12px", overflow: "hidden", background: "var(--card)", border: "1px solid var(--border)" },
  whiteboard: { flex: 1, minHeight: "250px", borderRadius: "12px", overflow: "hidden", background: "var(--card)", border: "1px solid var(--border)" },
  rightPanel: { display: "flex", flexDirection: "column", padding: "12px", gap: "20px", borderLeft: "1px solid var(--border)", minHeight: 0 },
  videoCard: { height: "320px", background: "var(--card)", borderRadius: "10px", overflow: "visible", border: "1px solid var(--border)", position: "relative" },
  chatCard: { flex: 1, background: "var(--card)", borderRadius: "10px", overflow: "hidden", minHeight: 0, marginTop: "40px", border: "1px solid var(--border)" },
  cardHeader: { padding: "8px", fontSize: "13px", borderBottom: "1px solid var(--border)", color: "var(--text)" },
  fullWhiteboard: { flex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column", borderRadius: "12px", overflow: "hidden", background: "var(--card)", border: "1px solid var(--border)" },
};