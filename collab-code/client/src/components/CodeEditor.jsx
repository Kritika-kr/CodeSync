import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import { runCode } from "../api/runCode";

export default function CodeEditor({ fullScreen }) {
  const [code, setCode] = useState("// Start coding...");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const { id: roomId } = useParams();

  // 🔥 Sync code
  useEffect(() => {
    const handleCodeUpdate = (newCode) => {
      setCode(newCode);
    };

    socket.on("code_update", handleCodeUpdate);

    return () => socket.off("code_update", handleCodeUpdate);
  }, []);

  const handleChange = (value) => {
    setCode(value);
    socket.emit("code_change", { roomId, code: value });
  };

  // 🔥 Run Code
  const handleRun = async () => {
    setLoading(true);
    const result = await runCode(code, language);
    setOutput(result);
    setLoading(false);
  };

  return (
    <div style={{ width: "100%" }}>
      
      {/* 🔹 Top Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        {/* Language */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: "6px",
            background: "#1e293b",
            color: "white",
            border: "none",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        {/* Run */}
        <button
          onClick={handleRun}
          style={{
            background: "#22c55e",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Running..." : "Run Code"}
        </button>
      </div>

      {/* 🔥 Editor */}
      <div
        style={{
          height: fullScreen ? "80vh" : "400px",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language}
          theme="vs-dark"
          value={code}
          onChange={handleChange}
        />
      </div>

      {/* 🔹 Output */}
      <div style={{ marginTop: "10px" }}>
        <h4 style={{ color: "white" }}>Output:</h4>
        <pre
          style={{
            background: "#020617",
            color: "#22c55e",
            padding: "10px",
            borderRadius: "8px",
            minHeight: "100px",
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {output}
        </pre>
      </div>
    </div>
  );
}