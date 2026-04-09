import { useRef, useEffect, useState } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function Whiteboard({ fullScreen }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const { id: roomId } = useParams();

  // 🎨 TOOL STATES
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = fullScreen ? window.innerHeight * 0.8 : 300;

    ctx.lineCap = "round";

    const drawLine = ({ x0, y0, x1, y1, color, size, tool }) => {
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

    // 🔥 RECEIVE DRAW
    socket.on("draw", drawLine);

    // 🔥 CLEAR BOARD
    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off("draw");
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

    const ctx = canvasRef.current.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);

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

    socket.emit("draw", {
      roomId,
      x0: prevX,
      y0: prevY,
      x1: x,
      y1: y,
      color,
      size,
      tool,
    });

    canvasRef.current.prevX = x;
    canvasRef.current.prevY = y;
  };

  // 🔥 CLEAR BOARD
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear", { roomId });
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ color: "white" }}>Whiteboard</h3>

      {/* 🎛 TOOLBAR */}
      <div style={styles.toolbar}>
        <button onClick={() => setTool("pencil")}>✏️</button>
        <button onClick={() => setTool("marker")}>🖊️</button>
        <button onClick={() => setTool("highlighter")}>🖍️</button>
        <button onClick={() => setTool("eraser")}>🧽</button>

        {/* COLOR */}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        {/* SIZE */}
        <input
          type="range"
          min="1"
          max="10"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />

        {/* CLEAR */}
        <button onClick={clearBoard}>Clear</button>
      </div>

      {/* 🎨 CANVAS */}
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