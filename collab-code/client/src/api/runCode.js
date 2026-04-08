import axios from "axios";

export const runCode = async (code, language) => {
  try {
    const res = await axios.post("https://collab-code-platform.onrender.com/", {
      code,
      language,
    });

    return res.data.output?.trim() || "No output";
  } catch {
    return "Error running code";
  }
};