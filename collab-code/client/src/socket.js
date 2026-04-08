import { io } from "socket.io-client";

const socket = io("https://collab-code-platform.onrender.com/");

export default socket;