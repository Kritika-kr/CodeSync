import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { useParams, useLocation } from "react-router-dom";

export default function Chat() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username || "Guest";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // 🔥 Receive messages
  useEffect(() => {
    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, []);

  // 🔥 Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔥 Send message
  const sendMessage = () => {
    if (!message.trim()) return;

    const time = new Date().toLocaleTimeString();

    socket.emit("send_message", {
      roomId,
      username,
      message: {
        text: message,
        time,
      },
    });

    setMessage("");
  };

  return (
    <div
      style={{
        width: "250px",
        background: "#0f172a",
        color: "white",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h3>Chat</h3>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>
              {msg.username === username ? "You" : msg.username}:
            </strong>{" "}
            {msg.message.text}
            <span style={{ fontSize: "10px", marginLeft: "5px" }}>
              ({msg.message.time})
            </span>
          </p>
        ))}

        {/* Auto scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage();
        }}
      />

      <button onClick={sendMessage} style={{ marginTop: "5px" }}>
        Send
      </button>
    </div>
  );
}