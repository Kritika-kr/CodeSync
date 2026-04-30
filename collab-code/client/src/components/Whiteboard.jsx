import { useRef, useEffect, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";
const styles = {
  wrapper: {
    position: "relative",
    marginTop: "20px",
    height: "100%",
  },

  /* FLOATING TOOLBAR */
  toolbar: {
    position: "absolute",
    top: "-20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    borderRadius: "14px",

    background: "rgba(0,0,0,0.6)", // works for both themes
    backdropFilter: "blur(12px)",
    border: "1px solid var(--border)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    zIndex: 10,
  },

  toolGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  divider: {
    width: "1px",
    height: "20px",
    background: "var(--border)",
  },

  tool: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "var(--text)",
    transition: "0.2s",
  },

  active: {
    background: "var(--primary)",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
    boxShadow: "0 0 12px rgba(37,99,235,0.6)",
  },

  action: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "var(--text)",
  },

  clear: {
    background: "#ef4444",
    border: "none",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
  },

  color: {
    width: "36px",
    height: "30px",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    cursor: "pointer",
  },

  slider: {
    cursor: "pointer",
  },

  /* CANVAS WRAPPER */
  canvasWrapper: {
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid var(--border)",
    background: "var(--card)",
  },

  /* CANVAS */
  canvas: {
    width: "100%",
    height: "320px",
    cursor: "crosshair",

    /* 🔥 adaptive grid */
    backgroundImage: `
  linear-gradient(var(--grid-color) 1px, transparent 1px),
  linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)
`,
    backgroundSize: "20px 20px",
  },
};

export default function Whiteboard({ fullScreen }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const { id: roomId } = useParams();
  const [showBoard, setShowBoard] = useState(false);

useEffect(() => {
  setTimeout(() => setShowBoard(true), 250);
}, []);

  // TOOL STATES
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(2);

  // HISTORY
  const history = useRef([]);
  const redoStack = useRef([]);

  // DRAW FUNCTION
  const drawLine = (ctx, stroke) => {
    const { x0, y0, x1, y1, color, size, tool } = stroke;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = size * 5;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;

      if (tool === "marker") ctx.lineWidth = size * 3;
      if (tool === "highlighter") {
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = size * 5;
      } else {
        ctx.globalAlpha = 1;
      }
    }

    ctx.stroke();
    ctx.closePath();
  };

  // REDRAW
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    history.current.forEach((stroke) => drawLine(ctx, stroke));
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.width = canvas.offsetWidth;
    canvas.height = fullScreen ? window.innerHeight * 0.8 : 300;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";

    // RECEIVE DRAW
    socket.on("draw", (stroke) => {
      history.current.push(stroke);
      redraw();
    });

    // RECEIVE UNDO
    socket.on("undo", () => {
      history.current.pop();
      redraw();
    });

    // RECEIVE REDO
    socket.on("redo", (stroke) => {
      history.current.push(stroke);
      redraw();
    });

    // CLEAR
    socket.on("clear", () => {
      history.current = [];
      redoStack.current = [];
      redraw();
    });

    return () => {
      socket.off("draw");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear");
    };
  }, [fullScreen]);

  const startDrawing = (e) => {
    drawing.current = true;
    canvasRef.current.prevX = e.nativeEvent.offsetX;
    canvasRef.current.prevY = e.nativeEvent.offsetY;
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const draw = (e) => {
    if (!drawing.current) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    const prevX = canvasRef.current.prevX;
    const prevY = canvasRef.current.prevY;

    const stroke = {
      x0: prevX,
      y0: prevY,
      x1: x,
      y1: y,
      color,
      size,
      tool,
    };

    history.current.push(stroke);
    redoStack.current = [];

    redraw();

    socket.emit("draw", { roomId, ...stroke });

    canvasRef.current.prevX = x;
    canvasRef.current.prevY = y;
  };

  // UNDO
  const undo = () => {
    if (history.current.length === 0) return;

    const last = history.current.pop();
    redoStack.current.push(last);

    redraw();
    socket.emit("undo", { roomId });
  };

  // REDO
  const redo = () => {
    if (redoStack.current.length === 0) return;

    const stroke = redoStack.current.pop();
    history.current.push(stroke);

    redraw();
    socket.emit("redo", { roomId, stroke });
  };

  // CLEAR
  const clearBoard = () => {
    history.current = [];
    redoStack.current = [];

    redraw();
    socket.emit("clear", { roomId });
  };

  return (
  <div style={styles.wrapper}>

    {/* FLOATING TOOLBAR */}
    <div style={styles.toolbar}>

      {/* DRAW TOOLS */}
      <div style={styles.toolGroup}>
        <button style={tool === "pencil" ? styles.active : styles.tool} onClick={() => setTool("pencil")}>✏️</button>
        <button style={tool === "marker" ? styles.active : styles.tool} onClick={() => setTool("marker")}>🖊️</button>
        <button style={tool === "highlighter" ? styles.active : styles.tool} onClick={() => setTool("highlighter")}>🖍️</button>
        <button style={tool === "eraser" ? styles.active : styles.tool} onClick={() => setTool("eraser")}>🧽</button>
      </div>

      {/* DIVIDER */}
      <div style={styles.divider}></div>

      {/* CONTROLS */}
      <div style={styles.toolGroup}>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={styles.color}/>
        <input type="range" min="1" max="10" value={size} onChange={(e) => setSize(e.target.value)} style={styles.slider}/>
      </div>

      {/* DIVIDER */}
      <div style={styles.divider}></div>

      {/* ACTIONS */}
      <div style={styles.toolGroup}>
        <button style={styles.action} onClick={undo}>↩</button>
        <button style={styles.action} onClick={redo}>↪</button>
        <button style={styles.clear} onClick={clearBoard}>🗑</button>
      </div>

    </div>

    {/* CANVAS */}
    <div style={styles.canvasWrapper}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={draw}
      />
    </div>

  </div>
);}