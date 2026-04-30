import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
import { motion } from "framer-motion";
// import LoadingScreen from "../components/LoadingScreen";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joinName, setJoinName] = useState("");
  // const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};
  const createRoom = () => {
    if (!username.trim()) return alert("Enter your name");

    // setLoading(true);

    const id = uuid();

    setTimeout(() => {
      navigate(`/room/${id}`, { state: { username } });
    }, 1200); // 🔥 delay for animation
  };
  // if (loading) return <LoadingScreen />;
 const joinRoom = () => {
  if (!roomId.trim() || !joinName.trim()) {
    return alert("Enter room ID and name");
  }

  navigate(`/room/${roomId}`, { state: { username: joinName } });
};

  return (
    <motion.div
   initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
  style={container}
>
      <div style={container}>
        <div style={bgGlow1}></div>
        <div style={bgGlow2}></div>
        <div style={helix}></div>
        <div style={helix2}></div>
        <div style={dottedRing}></div>
        <div style={dottedRing2}></div>
        <div style={wrapper}>
          {/* LEFT */}
          <motion.div
  initial="hidden"
  animate="show"
  exit="hidden"
  variants={{
    hidden: {},
    show: {
      transition: { staggerChildren: 0.1 }
    }
  }}
  style={left}
>
            <div style={badge}>New • Real-time sync</div>

            <h1 style={title}>CodeSync</h1>

            <p style={subtitle}>
              Collaborate on code with your team in real-time. Fast, minimal,
              and built for developers.
            </p>

            {/* Feature Chips */}
            <div style={chipRow}>
              <div style={chip}>Instant sync</div>
              <div style={chip}>Live chat</div>
              <div style={chip}>Clean UI</div>
            </div>

            {/* Stats */}
            <div style={stats}>
              <div>
                <h3 style={statNumber}>100ms</h3>
                <p style={statLabel}>Latency</p>
              </div>
              <div>
                <h3 style={statNumber}>∞</h3>
                <p style={statLabel}>Rooms</p>
              </div>
              <div>
                <h3 style={statNumber}>24/7</h3>
                <p style={statLabel}>Uptime</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
  style={card}
>
            <h2 style={cardTitle}>Start Session</h2>

            <input
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={input}
              onFocus={(e) =>
                (e.target.style.boxShadow = "0 0 0 2px rgba(37,99,235,0.4)")
              }
              onBlur={(e) => (e.target.style.boxShadow = "none")}
            />

            <button
              style={primaryBtn}
              onClick={createRoom} // 🔥 ADD THIS
            >
              Create Room
            </button>

            <div style={divider}>or</div>

            <input
  placeholder="Enter your name"
  value={joinName}
  onChange={(e) => setJoinName(e.target.value)}
  style={input}
/>

<input
  placeholder="Enter Room ID"
  value={roomId}
  onChange={(e) => setRoomId(e.target.value)}
  style={input}
/>

            <button onClick={joinRoom} style={secondaryBtn}>
              Join Room
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
const container = {
  height: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  color: "white",
  background: "#020617",
};

const wrapper = {
  width: "100%",
  maxWidth: "1200px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center", // ✅ CHANGE THIS
  gap: "100px",
};
/* LEFT */

const features = {
  marginTop: "28px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  fontSize: "15px",
  color: "#cbd5f5",
};

/* RIGHT CARD */
const card = {
  width: "380px",
  padding: "30px",
  borderRadius: "16px",
  background: "#0f172a",
  border: "1px solid #1e293b",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
};

/* TEXT */
const cardTitle = {
  marginBottom: "20px",
  fontSize: "20px",
  fontWeight: "600",
};

/* INPUT */
const input = {
  width: "100%",
  padding: "13px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "1px solid #1e293b",
  background: "#020617",
  color: "white",
  fontSize: "14px",
  transition: "all 0.2s ease",
};

/* BUTTON BASE */
const buttonBase = {
  width: "100%",
  padding: "13px",
  borderRadius: "10px",
  fontWeight: "500",
  cursor: "pointer",
  transition: "all 0.2s ease",
};

/* PRIMARY */
const primaryBtn = {
  width: "100%",
  padding: "13px",
  background: "#2563eb",
  borderRadius: "10px",
};

const secondaryBtn = {
  width: "100%",
  padding: "13px",
  background: "#16a34a",
  borderRadius: "10px",
};

/* LINK */
const linkBtn = {
  background: "none",
  color: "#38bdf8",
  marginBottom: "10px",
  cursor: "pointer",
  fontSize: "13px",
};

/* DIVIDER */
const divider = {
  textAlign: "center",
  margin: "12px 0",
  color: "#64748b",
  fontSize: "13px",
};
/* LEFT WRAPPER */
const left = {
  flex: 1.3,
  maxWidth: "600px",
  // ❌ REMOVE marginTop
};

/* BADGE */
const badge = {
  display: "inline-block",
  padding: "6px 12px",
  fontSize: "12px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.1)",
  color: "#60a5fa",
  marginBottom: "16px",
  border: "1px solid rgba(37,99,235,0.2)",
};

/* TITLE */
const title = {
  fontSize: "60px",
  transform: "translateY(0)",
  transition: "all 0.6s ease",
  fontWeight: "700",
  marginTop: "10px", // 👈 NEW
  marginBottom: "20px", // 👈 increase from 10
  letterSpacing: "-1px",
};

/* SUBTITLE */
const subtitle = {
  fontSize: "16px",
  color: "#94a3b8",
  lineHeight: "1.6",
};

/* CHIP ROW */
const chipRow = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
};

/* CHIP */
const chip = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#0f172a",
  border: "1px solid #1e293b",
  fontSize: "13px",
  color: "#cbd5f5",
};

/* STATS */
const stats = {
  display: "flex",
  gap: "40px",
  marginTop: "30px",
};

/* STAT NUMBER */
const statNumber = {
  fontSize: "20px",
  fontWeight: "600",
};

/* STAT LABEL */
const statLabel = {
  fontSize: "12px",
  color: "#64748b",
};
const bgGlow1 = {
  position: "absolute",
  pointerEvents: "none",
  width: "500px",
  height: "500px",
  background: "radial-gradient(circle, rgba(37,99,235,0.25), transparent)",
  top: "-100px",
  left: "-100px",
  filter: "blur(120px)",
  zIndex: 0,
};

const bgGlow2 = {
  position: "absolute",
  pointerEvents: "none",
  width: "500px",
  height: "500px",
  background: "radial-gradient(circle, rgba(16,185,129,0.2), transparent)",
  bottom: "-100px",
  right: "-100px",
  filter: "blur(120px)",
  zIndex: 0,
};
const helix = {
  position: "absolute",
  width: "420px",
  height: "420px",
  borderRadius: "50%",

  // 👇 OFF CENTER (important)
  top: "35%",
  left: "65%",
  pointerEvents: "none",
  transform: "translate(-50%, -50%) rotate(0deg)",

  // 👇 MUCH LIGHTER
  border: "1px solid rgba(59,130,246,0.08)",

  // 👇 SOFT GLOW (reduced)
  boxShadow: `
    0 0 40px rgba(59,130,246,0.12),
    inset 0 0 30px rgba(59,130,246,0.08)
  `,

  opacity: 0.5, // 👈 KEY CHANGE

  animation: "spin 30s linear infinite", // slower = premium
  zIndex: 0,
};
const helix2 = {
  position: "absolute",
  pointerEvents: "none",
  width: "480px",
  height: "480px",
  borderRadius: "50%",
  top: "65%", // 👉 move down
  left: "25%", // 👉 move left
  transform: "translate(-50%, -50%)",
  border: "1px solid rgba(16,185,129,0.1)",
  boxShadow: `
    0 0 60px rgba(16,185,129,0.12),
    inset 0 0 40px rgba(16,185,129,0.08)
  `,
  opacity: 0.5,
  animation: "spinReverse 40s linear infinite",
  zIndex: 0,
};
const dottedRing = {
  position: "absolute",
  pointerEvents: "none",
  width: "500px",
  height: "500px",
  borderRadius: "50%",

  // 👇 push OUTSIDE top-left corner
  top: "-120px",
  left: "-120px",

  // ❌ remove translate (yeh hi problem thi)
  // transform: "translate(-50%, -50%)",

  border: "2px dashed rgba(59,130,246,0.12)",

  opacity: 0.4,
  animation: "spin 60s linear infinite", // slower = premium
  zIndex: 0,
};
const dottedRing2 = {
  position: "absolute",
  pointerEvents: "none",
  width: "520px",
  height: "520px",
  borderRadius: "50%",

  // 👇 bottom-right placement
  bottom: "10%",
  right: "10%",
  transform: "translate(50%, 50%)",

  // 👇 slightly different color (green tint)
  border: "2px dashed rgba(16,185,129,0.12)",

  // 👇 softer than first
  opacity: 0.4,

  animation: "spinReverse 60s linear infinite", // opposite direction
  zIndex: 0,
};
