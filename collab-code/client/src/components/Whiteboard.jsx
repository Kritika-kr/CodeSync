import { useRef, useEffect } from "react";
import socket from "../socket";
import { useParams } from "react-router-dom";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const { id: roomId } = useParams();

  let drawing = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // ✅ Set proper size
    canvas.width = 600;
    canvas.height = 300;

    const drawLine = (x0, y0, x1, y1) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    };

    // ✅ Receive drawing
    socket.on("draw", ({ x0, y0, x1, y1 }) => {
      drawLine(x0, y0, x1, y1);
    });

    return () => socket.off("draw");
  }, []);

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
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
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
          background: "#111",
          cursor: "crosshair",
          border: "2px solid white",
          display: "block",
          width: "100%"
        }}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
      />
    </div>
  );
}