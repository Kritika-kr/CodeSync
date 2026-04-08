import axios from "axios";

export const runCode = async (code, language) => {
  try {
    const res = await axios.post("http://localhost:5000/run", {
      code,
      language,
    });

    return res.data.output?.trim() || "No output";
  } catch {
    return "Error running code";
  }
};