import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
} from "lucide-react";

export default function VideoCall({
  username,
  users,
  videoOn,
  micOn,
  stream,
  myId,
  toggleVideo,
  toggleMic,
}) {
  const joinSoundRef = useRef(null);
  const leaveSoundRef = useRef(null);
  const peersRef = useRef({});
  const streamRef = useRef(stream);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteStates, setRemoteStates] = useState({});
  const { id: roomId } = useParams();
  const localVideo = useRef(null);
  const [fullVideo, setFullVideo] = useState(false);
  const [speaking, setSpeaking] = useState("");
  const [screenSharing, setScreenSharing] = useState(false);
  const prevUsersRef = useRef([]);
  const safeUsers = users.filter((u) => u && u.id);

  // ✅ Keep streamRef current
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // 🔊 Audio
  useEffect(() => {
    joinSoundRef.current = new Audio("/sounds/join.mp3");
    leaveSoundRef.current = new Audio("/sounds/leave.mp3");
    joinSoundRef.current.volume = 0.6;
    leaveSoundRef.current.volume = 0.6;
  }, []);

  const playSound = (audioRef) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  useEffect(() => {
    const unlockAudio = () => {
      [joinSoundRef, leaveSoundRef].forEach((ref) => {
        if (ref.current) {
          ref.current.play().catch(() => {});
          ref.current.pause();
          ref.current.currentTime = 0;
        }
      });
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
  }, []);

  // 🔥 Join/leave sounds
  useEffect(() => {
    const prevUsers = prevUsersRef.current;
    if (prevUsers.length === 0) {
      prevUsersRef.current = users;
      return;
    }
    const joined = safeUsers.find(
      (u) => !prevUsers.some((p) => p?.id === u.id),
    );
    if (joined) playSound(joinSoundRef);
    const left = prevUsers.find((p) => !safeUsers.some((u) => u.id === p?.id));
    if (left) playSound(leaveSoundRef);
    prevUsersRef.current = users;
  }, [users]);

  // 🎤 Speaking
  useEffect(() => {
    socket.on("speaking", (user) => {
      setSpeaking(user);
      setTimeout(() => setSpeaking(""), 1200);
    });
    return () => socket.off("speaking");
  }, []);

  // 📷 Local video
  useEffect(() => {
    if (localVideo.current && stream) {
      localVideo.current.srcObject = stream;
      localVideo.current.play().catch(() => {});
    }
  }, [stream, videoOn, fullVideo]);

  // 🔥 Mic/video state
  useEffect(() => {
    socket.emit("peer-media-state", { micOn, videoOn, roomId });
  }, [micOn, videoOn, roomId]);

  useEffect(() => {
    socket.on("peer-media-state", ({ from, micOn: rMic, videoOn: rVideo }) => {
      setRemoteStates((prev) => ({
        ...prev,
        [from]: { micOn: rMic, videoOn: rVideo },
      }));
    });
    return () => socket.off("peer-media-state");
  }, []);

  // ✅ Create peer
  const createPeer = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    peer.ontrack = (event) => {
      console.log("✅ TRACK RECEIVED FROM:", userId, event.streams);
      if (event.streams?.[0]) {
        setRemoteStreams((prev) => ({ ...prev, [userId]: event.streams[0] }));
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: userId,
        });
      }
    };

    peer.onconnectionstatechange = () => {
      console.log(`🔗 Peer ${userId}:`, peer.connectionState);
      if (["failed", "disconnected", "closed"].includes(peer.connectionState)) {
        setRemoteStreams((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        delete peersRef.current[userId];
      }
    };

    return peer;
  };

  // ✅ SIGNALING — offer/answer/ice
  useEffect(() => {
    socket.on("video-offer", async ({ offer, from }) => {
      console.log("📨 OFFER FROM:", from);
      console.log("🎥 stream at offer time:", streamRef.current);

      const peer = createPeer(from);
      peersRef.current[from] = peer;

      const currentStream = streamRef.current;
      if (currentStream) {
        currentStream
          .getTracks()
          .forEach((track) => peer.addTrack(track, currentStream));
      } else {
        console.warn("⚠️ No stream when answering offer from", from);
      }

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("video-answer", { answer, to: from });
        console.log("✅ Answer sent to:", from);
      } catch (e) {
        console.error("❌ Offer handling error:", e);
      }
    });

    socket.on("video-answer", async ({ answer, from }) => {
      console.log("📨 ANSWER FROM:", from);
      const peer = peersRef.current[from];
      if (!peer) {
        console.warn("No peer for answer from", from);
        return;
      }
      if (peer.signalingState !== "have-local-offer") {
        console.warn("Wrong signaling state:", peer.signalingState);
        return;
      }
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Answer applied from:", from);
      } catch (e) {
        console.error("❌ Answer error:", e);
      }
    });

    socket.on("ice-candidate", async ({ candidate, from }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.log("ICE error:", e);
        }
      }
    });

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
    };
  }, []);

  // ✅ NEW PEER JOINED — only existing users call new joiners (no collision)
  useEffect(() => {
    socket.on("new-peer-joined", ({ newPeerId }) => {
      console.log("🆕 New peer joined:", newPeerId);

      if (!streamRef.current) {
        console.warn("⚠️ No stream when new peer joined");
        return;
      }
      if (peersRef.current[newPeerId]) return;

      const peer = createPeer(newPeerId);
      peersRef.current[newPeerId] = peer;

      streamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, streamRef.current);
      });

      peer
        .createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then((offer) =>
          peer.setLocalDescription(offer).then(() => {
            console.log("📞 Sending offer to new peer:", newPeerId);
            socket.emit("video-offer", { offer, to: newPeerId });
          }),
        )
        .catch((e) => console.error("Offer error:", e));
    });

    return () => socket.off("new-peer-joined");
  }, []);
  // ✅ Emit join_room AFTER VideoCall is mounted and all listeners are ready
  useEffect(() => {
    console.log("🔄 VideoCall mounted — emitting join_room");
    socket.emit("join_room", { roomId, username });
  }, []); // runs once on mount
  // 🖥 Screen share
  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (localVideo.current) localVideo.current.srcObject = screenStream;
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
      });
      setScreenSharing(true);
      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.log("Screen share error:", err);
    }
  };

  const stopScreenShare = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideo.current) localVideo.current.srcObject = cameraStream;
      const videoTrack = cameraStream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(videoTrack);
      });
      setScreenSharing(false);
    } catch (err) {
      console.log("Screen share error:", err);
    }
  };

  const allUsers = [...safeUsers];
  while (allUsers.length < 4) allUsers.push(null);

  const renderCard = (u, i, isMeetMode = false) => {
    if (!u) {
      return (
        <div key={i} style={isMeetMode ? styles.emptyBoxmeet : styles.emptyBox}>
          Waiting...
        </div>
      );
    }

    const isMe = u.id === myId;
    const isSpeaking = speaking === u.username;
    const remoteStream = remoteStreams[u.id];
    const rState = remoteStates[u.id] ?? { micOn: true, videoOn: true };
    const cardMicOn = isMe ? micOn : rState.micOn;
    const cardVideoOn = isMe ? videoOn : rState.videoOn;

    const baseStyle = isMeetMode ? styles.meetVideoBox : styles.videoBox;

    const boxStyle = {
      ...baseStyle,

      border: isSpeaking
        ? "3px solid #22c55e"
        : isMeetMode
          ? "none"
          : "1px solid var(--border)",

      boxShadow: isSpeaking
        ? "0 0 20px rgba(34,197,94,0.9), 0 0 40px rgba(34,197,94,0.5)"
        : "none",

      transform: isSpeaking ? "scale(1.05)" : "scale(1)",

      zIndex: isSpeaking ? 2 : 1,
      transition: "all 0.2s ease",
    };

    return (
      <div key={i} style={boxStyle}>
        {isMe ? (
          cardVideoOn ? (
            <video
              ref={(el) => {
                localVideo.current = el;
                if (el && stream) el.srcObject = stream;
              }}
              autoPlay
              muted
              playsInline
              style={styles.video}
            />
          ) : (
            <div style={styles.cameraOff} />
          )
        ) : remoteStream ? (
          <video
            autoPlay
            playsInline
            style={styles.video}
            ref={(el) => {
              if (el && remoteStream && el.srcObject !== remoteStream)
                el.srcObject = remoteStream;
            }}
          />
        ) : (
          <div style={styles.avatar}>{u.username[0].toUpperCase()}</div>
        )}
        <span style={styles.name}>{isMe ? "You" : u.username}</span>
        <div style={styles.statusIcons}>
          {!cardMicOn && (
            <div style={styles.iconOff}>
              <MicOff size={12} />
            </div>
          )}
          {!cardVideoOn && (
            <div style={styles.iconOff}>
              <VideoOff size={12} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (fullVideo) {
    return (
      <div style={styles.meetOverlay}>
        <div style={styles.meetTop}>
          <span>⚡ CodeSync Meet</span>
          <button style={styles.exitBtn} onClick={() => setFullVideo(false)}>
            ✕
          </button>
        </div>
        <div style={styles.meetGrid}>
          {allUsers.slice(0, 4).map((u, i) => renderCard(u, i, true))}
        </div>
        <div style={styles.meetControls}>
          <button
            style={{
              ...styles.controlBtn,
              ...(micOn ? styles.active : styles.inactive),
            }}
            onClick={toggleMic}
          >
            <Mic />
          </button>
          <button
            style={{
              ...styles.controlBtn,
              ...(videoOn ? styles.active : styles.inactive),
            }}
            onClick={toggleVideo}
          >
            <Video />
          </button>
          <button
            style={{
              ...styles.controlBtn,
              ...(screenSharing ? styles.active : {}),
            }}
            onClick={screenSharing ? stopScreenShare : shareScreen}
          >
            <Monitor />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.grid}>
        {allUsers.slice(0, 4).map((u, i) => renderCard(u, i, false))}
      </div>
      <div style={styles.controlsBar}>
        <button
          style={{
            ...styles.controlBtn,
            ...(micOn ? styles.active : styles.inactive),
          }}
          onClick={toggleMic}
        >
          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button
          style={{
            ...styles.controlBtn,
            ...(videoOn ? styles.active : styles.inactive),
          }}
          onClick={toggleVideo}
        >
          {videoOn ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
        <button
          style={{
            ...styles.controlBtn,
            ...(screenSharing ? styles.active : {}),
          }}
          onClick={screenSharing ? stopScreenShare : shareScreen}
        >
          {screenSharing ? <MonitorOff size={16} /> : <Monitor size={16} />}
        </button>
        <button
          style={{ ...styles.controlBtn, ...(fullVideo ? styles.active : {}) }}
          onClick={() => setFullVideo(true)}
        >
          ⛶
        </button>
      </div>
    </div>
  );
}

const styles = {
  statusIcons: {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    display: "flex",
    gap: "5px",
  },
  iconOff: {
    background: "#ef4444",
    borderRadius: "50%",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
  },
  cameraOff: { width: "100%", height: "100%", background: "#0f172a" },
  meetOverlay: {
    position: "fixed",
    inset: 0,
    background: "#020617",
    zIndex: 999,
    height: "100vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  meetTop: {
    height: "50px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    color: "#fff",
    fontSize: "14px",
  },
  exitBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  meetGrid: {
    flex: 1,
    display: "grid",

    height: "calc(100vh - 50px - 80px)",
    gridTemplateColumns: "repeat(2, 1fr)",
    gridTemplateRows: "repeat(2, 1fr)",
    gap: "12px",
    padding: "12px",
  },
  meetVideoBox: {
    position: "relative",
    width: "100%",
    height: "100%",
    aspectRatio: "16 / 9",
    minHeight: "0",

    borderRadius: "12px",
    overflow: "hidden",
    background: "#000",
  },
  meetControls: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "14px",
    padding: "10px 18px",
    borderRadius: "30px",
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(10px)",
  },
  wrapper: {
    height: "100%",
    background: "var(--card)",
    borderRadius: "12px",
    padding: "8px",
    paddingBottom: "0",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "6px",
    width: "100%",
    flex: 1,
    minHeight: 0,
  },
  videoBox: {
    position: "relative",
    borderRadius: "10px",
    overflow: "hidden",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    minHeight: 0,
  },
  emptyBoxmeet: {
    width: "100%",
    height: "100%",
    borderRadius: "12px",
    background: "linear-gradient(145deg, #020617, #0f172a)",
    border: "1px dashed #334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "14px",
    opacity: 0.7,
  },
  emptyBox: {
    borderRadius: "10px",
    background: "var(--bg)",
    border: "1px dashed var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text)",
    fontSize: "13px",
    opacity: 0.6,
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  name: {
    position: "absolute",
    bottom: "6px",
    left: "6px",
    fontSize: "12px",
    background: "rgba(0,0,0,0.6)",
    padding: "4px 8px",
    borderRadius: "8px",
    color: "#fff",
  },
  controlsBar: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    padding: "6px 0",
    borderTop: "1px solid var(--border)",
    background: "var(--card)",
    borderRadius: "0 0 12px 12px",
  },
  controlBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid var(--border)",
    cursor: "pointer",
    fontSize: "12px",
    background: "var(--card)",
    color: "var(--text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  active: { background: "var(--primary)", color: "#fff" },
  inactive: { background: "#ef4444", color: "#fff" },
};
