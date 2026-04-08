import { useEffect, useRef } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function VideoCall() {
  const { id: roomId } = useParams();

  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef();

  useEffect(() => {
    let stream;

    const init = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localVideo.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
});

      // add tracks
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      // receive remote stream
      peerConnection.current.ontrack = (event) => {
        remoteVideo.current.srcObject = event.streams[0];
      };

      // send ICE candidates
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

    // 🔥 RECEIVE OFFER
    socket.on("video-offer", async (offer) => {
      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("video-answer", { answer, roomId });
    });

    // 🔥 RECEIVE ANSWER
    socket.on("video-answer", async (answer) => {
      await peerConnection.current.setRemoteDescription(answer);
    });

    // 🔥 RECEIVE ICE
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

  // 🔥 START CALL
  const startCall = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("video-offer", { offer, roomId });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Video</h3>

      <video ref={localVideo} autoPlay muted width="120" />
      <video ref={remoteVideo} autoPlay width="120" />

      <br />

      <button onClick={startCall}>Start Call</button>
    </div>
  );
}