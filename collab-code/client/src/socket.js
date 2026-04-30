import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.DEV 
  ? "http://localhost:5000"  // local dev
  : "https://collab-code-platform.onrender.com"; // production

const socket = io(SERVER_URL, { autoConnect: true });

export default socket;