import { useRef, useEffect } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function Whiteboard({ fullScreen }) {
  const canvasRef = useRef(null);
  const { id: roomId } = useParams();

  let drawing = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 🔥 Dynamic size
    canvas.width = canvas.offsetWidth;
    canvas.height = fullScreen ? window.innerHeight * 0.8 : 300;

    ctx.lineCap = "round";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    const drawLine = (x0, y0, x1, y1) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.closePath();
    };

    // 🔥 Receive drawing
    socket.on("draw", ({ x0, y0, x1, y1 }) => {
      drawLine(x0, y0, x1, y1);
    });

    return () => socket.off("draw");
  }, [fullScreen]);

  const startDrawing = (e) => {
    drawing = true;
    canvasRef.current.prevX = e.nativeEvent.offsetX;
    canvasRef.current.prevY = e.nativeEvent.offsetY;
  };

  const stopDrawing = () => {
    drawing = false;
  };

  const draw = (e) => {
    if (!drawing) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    const prevX = canvasRef.current.prevX;
    const prevY = canvasRef.current.prevY;

    const ctx = canvasRef.current.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    socket.emit("draw", {
      roomId,
      x0: prevX,
      y0: prevY,
      x1: x,
      y1: y,
    });

    canvasRef.current.prevX = x;
    canvasRef.current.prevY = y;
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ color: "white" }}>Whiteboard</h3>

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