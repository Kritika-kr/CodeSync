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

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
    };
  }, []);

  // 🔥 Start Call
  const startCall = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("video-offer", { offer, roomId });
  };

  // 🎥 Toggle Camera
  const toggleCamera = () => {
    const videoTrack = localStream.current.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  };

  // 🎤 Toggle Mic
  const toggleMic = () => {
    const audioTrack = localStream.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  // 🖥️ SCREEN SHARE
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

      // 🔥 when user stops sharing
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
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Video Call</h3>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <video
          ref={localVideo}
          autoPlay
          muted
          style={{
            width: "120px",
            borderRadius: "8px",
            border: "2px solid #22c55e",
          }}
        />

        <video
          ref={remoteVideo}
          autoPlay
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

        {/* 🖥️ Screen Share */}
        <button onClick={toggleScreenShare}>
          {screenSharing ? "Stop Share" : "Share Screen"}
        </button>
      </div>
    </div>
  );
}