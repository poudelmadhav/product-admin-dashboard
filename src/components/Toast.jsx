import { useEffect } from "react";

const colors = {
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  error: "bg-red-500/10 border-red-500/30 text-red-300",
  info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
};

export default function Toast({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 flex items-center gap-3 border rounded-lg px-4 py-3 font-mono text-sm animate-fade-in shadow-2xl backdrop-blur-sm z-50 ${colors[type]}`}
    >
      {type === "success" && <span>✓</span>}
      {type === "error" && <span>✕</span>}
      {type === "info" && <span>ℹ</span>}
      {message}
    </div>
  );
}
