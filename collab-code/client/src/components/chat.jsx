import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import { useParams, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
export default function Chat() {
  const { id: roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username || "Guest";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const bottomRef = useRef(null);

  // RECEIVE MESSAGE
  useEffect(() => {
    const handler = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, []);

  // TYPING
  useEffect(() => {
    const handler = (user) => {
      if (user !== username) {
        setTypingUser(user);
        setTimeout(() => setTypingUser(""), 2000);
      }
    };

    socket.on("typing", handler);
    return () => socket.off("typing", handler);
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND MESSAGE
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("send_message", {
      roomId,
      username,
      message,
      time: new Date().toISOString(),
    });

    setMessage("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}><MessageCircle size={18}/> Chat</div>

      {/* MESSAGES */}
      <div style={styles.messages}>
        {messages.map((msg, i) => {
          const isMe = msg.username === username;

          return (
            <div key={i} style={isMe ? styles.rowRight : styles.row}>
              {!isMe && (
                <div style={styles.avatar}>
                  {msg.username[0].toUpperCase()}
                </div>
              )}

              <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: isMe ? "flex-end" : "flex-start",
  }}>
                {/* NAME + TIME */}
                <div style={isMe ? styles.metaRight : styles.meta}>
                  {msg.username} •{" "}
                  {msg.time
                    ? new Date(msg.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>

                {/* MESSAGE */}
                <div style={isMe ? styles.myMsg : styles.otherMsg}>
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* TYPING */}
      {typingUser && (
        <div style={styles.typing}>{typingUser} typing...</div>
      )}

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            socket.emit("typing", username);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendBtn}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--card)",
    borderRadius: "12px",
    color: "var(--text)",
  },

  header: {
  padding: "10px",
  borderBottom: "1px solid var(--border)",
  textAlign: "center",
  fontWeight: "600",
  background: "rgba(30,41,59,0.6)",
  backdropFilter: "blur(10px)",
},

  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  row: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },

  rowRight: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems:"flex-end",
  },

  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "bold",
  },

  meta: {
    fontSize: "11px",
    color: "var(--subtext)",
    marginBottom: "2px",
  },

  metaRight: {
    fontSize: "11px",
    color: "var(--subtext)",
    textAlign: "right",
    marginBottom: "2px",
  },

myMsg: {
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  padding: "6px 10px",  // 🔥 tighter bubble
  borderRadius: "16px 16px 4px 16px",
  color: "#fff",
  maxWidth: "60%",        // 🔥 KEEP ONLY HERE
  alignSelf: "flex-end",
 
  fontSize: "10px", 
  // overflowWrap: "break-word",
  wordBreak: "normal",   
  fontSize:"12px",
  minWidth: "60px",
  lineHeight: "15px",
  whiteSpace: "pre-wrap",
},

otherMsg: {
  background: "#1e293b",
  minWidth: "40px",
  // overflowWrap: "break-word",
  wordBreak: "normal",   
  alignSelf: "flex-start", 
  fontSize: "10px", 
   fontSize:"12px",
  lineHeight: "15px",
  padding: "6px 10px",  // 🔥 tighter bubble
  borderRadius: "16px 16px 16px 4px",
  color: "#e2e8f0",
  maxWidth: "66%",
  
 
  whiteSpace: "pre-wrap",
},

  typing: {
    fontSize: "12px",
    padding: "6px 10px",
    color: "var(--subtext)",
  },

  inputBox: {
  display: "flex",
  gap: "8px",
  padding: "10px",
  borderTop: "1px solid var(--border)",
  background: "rgba(30,41,59,0.6)",
  backdropFilter: "blur(10px)",
},

input: {
  flex: 1,
  padding: "10px",
  borderRadius: "10px",
  background: "#020617",
  color: "#fff",
},

sendBtn: {
  padding: "10px 14px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  borderRadius: "10px",
  color: "#fff",
},
};