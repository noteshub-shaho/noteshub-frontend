export default function Message({ type = "success", text }) {
  if (!text) return null;

  const styles = {
    success: {
      background: "#ecfdf5",
      color: "#065f46",
      border: "1px solid #6ee7b7",
    },
    error: {
      background: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
    },
  };

  return (
    <div
      style={{
        ...styles[type],
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 14,
        marginBottom: 14,
      }}
    >
      {text}
    </div>
  );
}
