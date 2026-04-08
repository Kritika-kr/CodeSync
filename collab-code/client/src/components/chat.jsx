import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { useParams, useLocation } from "react-router-dom";

export default function Chat() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username || "Guest";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const chatRef = useRef(null);
  const bottomRef = useRef(null);

  
  useEffect(() => {
    const handler = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handler);

    return () => socket.off("receive_message", handler);
  }, []);

  
  useEffect(() => {
    const container = chatRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + 50;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      roomId,
      username,
      message,
    });

    setMessage("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "10px",
        background: "#0f172a",
      }}
    >
      <h3 style={{ textAlign: "center", color: "white" }}>Chat</h3>

  
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          borderRadius: "10px",
          background: "#020617",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {messages.map((msg, index) => {
          const isMe = msg.username === username;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  background: isMe ? "#22c55e" : "#334155",
                  color: "white",
                  wordBreak: "break-word",
                }}
              >
                {!isMe && (
                  <div style={{ fontSize: "10px", opacity: 0.6 }}>
                    {msg.username}
                  </div>
                )}

                <div>{msg.message}</div>
              </div>
            </div>
          );
        })}

  
        <div ref={bottomRef} />
      </div>

  
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            outline: "none",
            background: "#1e293b",
            color: "white",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 14px",
            background: "#22c55e",
            border: "none",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}