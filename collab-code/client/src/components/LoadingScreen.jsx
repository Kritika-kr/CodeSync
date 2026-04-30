import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div style={styles.container}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        style={styles.spinner}
      />

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={styles.text}
      >
        Setting up your workspace...
      </motion.h2>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--bg)",
    color: "var(--text)",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--border)",
    borderTop: "4px solid var(--primary)",
    borderRadius: "50%",
    marginBottom: "20px",
  },

  text: {
    fontSize: "16px",
    color: "var(--subtext)",
  },
};