import { useRef, useEffect, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function Whiteboard({ fullScreen }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const { id: roomId } = useParams();

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
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ color: "white" }}>Whiteboard</h3>

      {/* TOOLBAR */}
      <div style={styles.toolbar}>
        <button onClick={() => setTool("pencil")}>✏️</button>
        <button onClick={() => setTool("marker")}>🖊️</button>
        <button onClick={() => setTool("highlighter")}>🖍️</button>
        <button onClick={() => setTool("eraser")}>🧽</button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <input
          type="range"
          min="1"
          max="10"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />

        <button onClick={undo}>Undo</button>
        <button onClick={redo}>Redo</button>
        <button onClick={clearBoard}>Clear</button>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          background: "#020617",
          border: "2px solid #334155",
          borderRadius: "10px",
          cursor: "crosshair",
          width: "100%",
          height: fullScreen ? "80vh" : "300px",
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onMouseMove={draw}
      />
    </div>
  );
}

const styles = {
  toolbar: {
    display: "flex",
    gap: "8px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
};