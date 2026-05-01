import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "https://collab-code-platform.onrender.com";

export const runCode = async (code, language) => {
  try {
    const res = await axios.post(`${API_URL}/run`, {
      code,
      language,
    });

    console.log("FULL RESPONSE:", res.data);

    // 🔥 ALWAYS return string
    return res.data.output?.trim() || "No output";

  } catch (err) {
    console.log(err);
    return "Error running code";
  }
};