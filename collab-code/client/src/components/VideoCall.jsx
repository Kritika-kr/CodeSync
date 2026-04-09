import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function VideoCall() {
  const { id: roomId } = useParams();

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);

  // 🔥 Persist camera state
  const [cameraOn, setCameraOn] = useState(() => {
    const saved = localStorage.getItem("cameraOn");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        localStream.current = stream;

        if (localVideo.current) {
          localVideo.current.srcObject = stream;
        }

        // 🔥 Apply saved camera state
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = cameraOn;

        // 🔥 Create connection
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Add tracks
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
        });

        // Remote stream
        peerConnection.current.ontrack = (event) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = event.streams[0];
          }
        };

        // ICE
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              roomId,
            });
          }
        };
      } catch (err) {
        console.error("Media error:", err);
      }
    };

    init();

    // 🔥 SIGNALING
    socket.on("video-offer", async (offer) => {
      if (!peerConnection.current) return;

      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("video-answer", { answer, roomId });
    });

    socket.on("video-answer", async (answer) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        if (!peerConnection.current) return;
        await peerConnection.current.addIceCandidate(candidate);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("user-disconnected", () => {
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
    });

    return () => {
      mounted = false;

      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");

      // 🔥 Cleanup
      localStream.current?.getTracks().forEach((t) => t.stop());
      peerConnection.current?.close();
    };
  }, []);

  // 📞 Start call
  const startCall = async () => {
    if (!peerConnection.current) return;

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("video-offer", { offer, roomId });
  };

  // 🎥 Camera toggle
  const toggleCamera = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (!track) return;

    const newState = !track.enabled;
    track.enabled = newState;

    setCameraOn(newState);
    localStorage.setItem("cameraOn", JSON.stringify(newState));
  };

  // 🎤 Mic toggle
  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  // 🖥️ Screen share
  const toggleScreenShare = async () => {
    try {
      if (!peerConnection.current) return;

      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        const sender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (!sender) return;

        sender.replaceTrack(screenTrack);
        localVideo.current.srcObject = screenStream;

        setScreenSharing(true);
        setFullScreen(true);

        screenTrack.onended = () => stopScreenShare();
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = () => {
    const videoTrack = localStream.current?.getVideoTracks()[0];

    const sender = peerConnection.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (!sender || !videoTrack) return;

    sender.replaceTrack(videoTrack);
    localVideo.current.srcObject = localStream.current;

    setScreenSharing(false);
    setFullScreen(false);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Video Call</h3>

      {/* 🔥 FULLSCREEN */}
      {fullScreen ? (
        <div style={styles.fullscreen}>
          <video
            ref={screenSharing ? localVideo : remoteVideo}
            autoPlay
            muted={screenSharing}
            playsInline
            style={styles.fullVideo}
          />

          <button onClick={() => setFullScreen(false)} style={styles.exitBtn}>
            Exit
          </button>
        </div>
      ) : (
        <>
          {/* VIDEO GRID */}
          <div style={styles.videoRow}>
            {cameraOn ? (
              <video ref={localVideo} autoPlay muted playsInline style={styles.video} />
            ) : (
              <div style={styles.placeholder}>Camera Off</div>
            )}

            <video ref={remoteVideo} autoPlay playsInline style={styles.video} />
          </div>

          {/* CONTROLS */}
          <div style={styles.controls}>
            <button style={styles.btn} onClick={startCall}>📞</button>
            <button style={styles.btn} onClick={toggleCamera}>
              {cameraOn ? "📷" : "🚫"}
            </button>
            <button style={styles.btn} onClick={toggleMic}>
              {micOn ? "🎤" : "🔇"}
            </button>
            <button style={styles.btn} onClick={toggleScreenShare}>
              {screenSharing ? "Stop" : "Share"}
            </button>
            <button style={styles.btn} onClick={() => setFullScreen(true)}>⛶</button>
          </div>
        </>
      )}
    </div>
  );
}

// 🎨 CLEAN UI STYLES
const styles = {
  container: {
    textAlign: "center",
    color: "white",
  },
  title: {
    marginBottom: "10px",
  },
  videoRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  video: {
    width: "120px",
    borderRadius: "8px",
    border: "2px solid #334155",
  },
  placeholder: {
    width: "120px",
    height: "90px",
    background: "#1e293b",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  btn: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "#334155",
    color: "white",
  },
  fullscreen: {
    position: "fixed",
    inset: 0,
    background: "black",
    zIndex: 999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  fullVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  exitBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "red",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};