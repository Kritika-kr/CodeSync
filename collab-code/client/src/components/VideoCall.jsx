import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function VideoCall() {
  const { id: roomId } = useParams();

  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef();
  const localStream = useRef();

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.current = stream;
      localVideo.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        remoteVideo.current.srcObject = event.streams[0];

        // 🔥 Fix autoplay
        remoteVideo.current.onloadedmetadata = () => {
          remoteVideo.current.play().catch(() => {});
        };
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            roomId,
          });
        }
      };
    };

    init();

    socket.on("video-offer", async (offer) => {
      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("video-answer", { answer, roomId });
    });

    socket.on("video-answer", async (answer) => {
      await peerConnection.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("user-disconnected", () => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    });

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");
    };
  }, []);

  const startCall = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("video-offer", { offer, roomId });
  };

  const toggleCamera = () => {
    const track = localStream.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  };

  const toggleMic = () => {
    const track = localStream.current.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      const sender = peerConnection.current
        .getSenders()
        .find((s) => s.track.kind === "video");

      sender.replaceTrack(screenTrack);

      localVideo.current.srcObject = screenStream;

      setScreenSharing(true);
      setFullScreen(true); // 🔥 auto fullscreen

      screenTrack.onended = () => stopScreenShare();
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const videoTrack = localStream.current.getVideoTracks()[0];

    const sender = peerConnection.current
      .getSenders()
      .find((s) => s.track.kind === "video");

    sender.replaceTrack(videoTrack);

    localVideo.current.srcObject = localStream.current;

    setScreenSharing(false);
    setFullScreen(false);
  };

  return (
    <div style={{ textAlign: "center", color: "white" }}>
      <h3>Video Call</h3>


      {fullScreen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "black",
            zIndex: 999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <video
            ref={screenSharing ? localVideo : remoteVideo}
            autoPlay
            muted={screenSharing}
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />

          <button
            onClick={() => setFullScreen(false)}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "red",
              color: "white",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Exit
          </button>
        </div>
      ) : (
        <>
   
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <video
              ref={localVideo}
              autoPlay
              muted
              playsInline
              style={{
                width: "120px",
                borderRadius: "8px",
                border: "2px solid #22c55e",
              }}
            />

            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              style={{
                width: "120px",
                borderRadius: "8px",
                border: "2px solid #3b82f6",
              }}
            />
          </div>

          <div style={{ marginTop: "10px", display: "flex", gap: "6px", justifyContent: "center" }}>
            <button onClick={startCall}>📞</button>

            <button onClick={toggleCamera}>
              {cameraOn ? "📷" : "🚫📷"}
            </button>

            <button onClick={toggleMic}>
              {micOn ? "🎤" : "🔇"}
            </button>

            <button onClick={toggleScreenShare}>
              {screenSharing ? "Stop Share" : "Share Screen"}
            </button>

        
            <button onClick={() => setFullScreen(true)}>
              ⛶
            </button>
          </div>
        </>
      )}
    </div>
  );
}