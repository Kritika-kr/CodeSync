import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
export default function PreJoin({ onJoin }) {
  const videoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(s);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.log("Permission denied", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleMic = () => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn(!camOn);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      style={styles.wrapper}
    >
  
  <div style={styles.container}>
    
    {/* 🎥 LEFT VIDEO */}
    <div style={styles.videoSection}>
      {camOn ? (
        <video ref={videoRef} autoPlay muted style={styles.video} />
      ) : (
        <div style={styles.cameraOff}>Camera is Off</div>
      )}

      <div style={styles.nameTag}>You</div>
    </div>

    {/* ⚙️ RIGHT PANEL */}
    <div style={styles.sidePanel}>
      
      <h2 style={styles.title}>Ready to join?</h2>

      <p style={styles.subtitle}>
        Check your camera and microphone before joining
      </p>

      {/* CONTROLS */}
      <div style={styles.controls}>
        <button
          style={{
            ...styles.controlBtn,
            background: micOn ? "#2563eb" : "#ef4444",
          }}
          onClick={toggleMic}
        >
          🎤
        </button>

        <button
          style={{
            ...styles.controlBtn,
            background: camOn ? "#2563eb" : "#ef4444",
          }}
          onClick={toggleCam}
        >
          🎥
        </button>
      </div>

      {/* JOIN */}
      <button
        style={styles.joinBtn}
        onClick={() => onJoin(stream, { micOn, camOn })}
      >
        Join Now
      </button>

    </div>
  </div>
</motion.div>
  );
}

const styles = {
  wrapper: {
  height: "100vh",
  background: "radial-gradient(circle at top, #0f172a, #020617)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

container: {
  display: "flex",
  gap: "30px",
  padding: "20px",
},

videoSection: {
  width: "520px",
  height: "300px",
  borderRadius: "18px",
  overflow: "hidden",
  position: "relative",
  background: "#000",
  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.08)",
}
,
video: {
  width: "100%",
  height: "100%",
  objectFit: "cover",
},

cameraOff: {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: "16px",
},

nameTag: {
  position: "absolute",
  bottom: "10px",
  left: "10px",
  background: "rgba(0,0,0,0.5)",
  padding: "4px 8px",
  borderRadius: "6px",
  fontSize: "12px",
},

sidePanel: {
  width: "260px",
  padding: "22px",
  borderRadius: "18px",
  background: "rgba(15,23,42,0.6)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
},

title: {
  fontSize: "20px",
  fontWeight: "600",
  marginBottom: "6px",
},

subtitle: {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "20px",
},

controls: {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
},

controlBtn: {
  width: "46px",
  height: "46px",
  borderRadius: "50%",
  border: "none",
  color: "#fff",
  fontSize: "16px",
  cursor: "pointer",
  background: "rgba(37,99,235,0.2)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  transition: "all 0.2s ease",
}
,
joinBtn: {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "none",
  color: "#fff",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 6px 20px rgba(34,197,94,0.4)",
  transition: "all 0.2s ease",
}
};