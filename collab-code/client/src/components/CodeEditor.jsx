import Editor from "@monaco-editor/react";
import { useState, useEffect } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
import { runCode } from "../api/runCode";
const styles = {
  wrapper: {
    background: "var(--card)",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    overflow: "hidden",
  },

  /* TOP BAR */
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "var(--card)",
    borderBottom: "1px solid var(--border)",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  dotRed: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#ef4444",
  },

  dotYellow: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#facc15",
  },

  dotGreen: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#22c55e",
  },

  fileName: {
    marginLeft: "10px",
    fontSize: "13px",
    color: "var(--subtext)",
  },

  right: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  select: {
    background: "var(--card)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "4px 8px",
  },

  runBtn: {
    background: "#16a34a",
    padding: "6px 12px",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    transition: "0.2s",
  },

  /* EDITOR */
  editor: {
    height: "400px",
    background: "var(--card)",
  },

  /* OUTPUT */
  output: {
    borderTop: "1px solid var(--border)",
    background: "var(--card)",
  },

  outputHeader: {
    padding: "6px 10px",
    fontSize: "13px",
    color: "var(--subtext)",
    borderBottom: "1px solid var(--border)",
  },

  outputBox: {
    padding: "10px",
    color: "#22c55e",
    minHeight: "80px",
    maxHeight: "150px",
    overflowY: "auto",
    fontSize: "13px",
    background: "var(--bg)",
  },
};

export default function CodeEditor({fullScreen, onOutput, onLoading}) {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("Initial Output");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const { id: roomId } = useParams();

useEffect(() => {
  console.log("OUTPUT UPDATED:", output);
}, [output]);
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

  const handleRun = async () => {
    onLoading(true);                          // ← was setLoading(true)
    const result = await runCode(code, language);
    onOutput(result);                         // ← was setOutput(result)
    onLoading(false);   

console.log("RESULT:", result); // 🔥 debug

setOutput(result); // ✅ IMPORTANT
    setLoading(false);
  };

  return (
  <div style={styles.wrapper}>
    
    {/* 🔥 TOP BAR */}
    <div style={styles.topbar}>
      
      {/* LEFT */}
      <div style={styles.left}>
        <span style={styles.dotRed}></span>
        <span style={styles.dotYellow}></span>
        <span style={styles.dotGreen}></span>

        <span style={styles.fileName}>
          main.{language === "javascript" ? "js" : language}
        </span>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={styles.select}
        >
          <option value="javascript">JS</option>
          <option value="python">PY</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>

        <button onClick={handleRun} style={styles.runBtn}>
          {loading ? "Running..." : "▶ Run"}
        </button>
      </div>
    </div>

    {/* 🔥 EDITOR */}
    <div style={styles.editor}>
      
<Editor
  key={language}
  height="100%"
  language={language === "cpp" ? "cpp" : language}
  theme="vs-dark"
  value={code}  // ← was defaultValue
  onChange={handleChange}
/>
    </div>

    {/* 🔥 OUTPUT */}
    // In CodeEditor.jsx — replace your output div with this:
<div style={{
  background: "#0d0d0d",
  color: "#22c55e",
  padding: "12px 16px",
  minHeight: "80px",
  fontFamily: "monospace",
  fontSize: "13px",
  whiteSpace: "pre-wrap",
  borderTop: "1px solid #333"
}}>
  <div style={{ color: "#666", fontSize: "11px", marginBottom: "6px" }}>OUTPUT</div>
  {loading ? "Running..." : (output || "No output")}
</div>

  </div>
);
}