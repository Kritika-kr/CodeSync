import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import { runCode } from "../api/runCode";

export default function CodeEditor() {
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
        }}
      >
        {/* Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        <button onClick={handleRun}>
          {loading ? "Running..." : "Run Code"}
        </button>
      </div>

      {/* 🔹 Editor */}
      <div style={{ height: "400px", marginTop: "10px" }}>
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
        <h4>Output:</h4>
        <pre
          style={{
            background: "#0f172a",
            color: "#22c55e",
            padding: "10px",
            borderRadius: "8px",
            minHeight: "100px",
          }}
        >
          {output}
        </pre>
      </div>
    </div>
  );
}