import { useState } from "react";
import { api } from "../../services/api";

const SupportIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const formatDate = (value) => {
  if (!value) return "Not available";
  try {
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "Not available";
  }
};

const StatusPill = ({ status }) => {
  const styles = {
    PENDING: { background: "#fffbeb", color: "#d97706" },
    APPROVED: { background: "#f0fdf4", color: "#16a34a" },
    REJECTED: { background: "#fef2f2", color: "#dc2626" },
  };
  const label = status === "PENDING" ? "Pending" : status === "APPROVED" ? "Approved" : "Rejected";
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: "999px",
      fontSize: "0.75rem", fontWeight: 700, ...(styles[status] || styles.PENDING),
    }}>
      {label}
    </span>
  );
};

const collectDeviceHints = async () => {
  try {
    const hints = navigator.userAgentData;
    if (!hints || typeof hints.getHighEntropyValues !== "function") return null;
    const values = await hints.getHighEntropyValues(["platform", "platformVersion", "model"]);
    return {
      platform: values.platform || null,
      platformVersion: values.platformVersion || null,
      model: values.model || null,
    };
  } catch {
    return null;
  }
};

export default function RecoveryRequestModal({ noteKey, noteTitle, purchaseDate, fingerprints, onClose, onSubmitted }) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = description.trim();
    if (value.length < 10) {
      setError("Please describe the problem in at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const deviceHints = await collectDeviceHints();
      const res = await api.paidNotes.recovery.createRequest(noteKey, value, fingerprints, deviceHints);
      setSubmitted(res.data.request);
      if (onSubmitted) onSubmitted(res.data.request);
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.activeRequest) {
        setSubmitted(data.activeRequest);
        if (onSubmitted) onSubmitted(data.activeRequest);
      } else {
        setError(data?.message || "Failed to submit the request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "white", borderRadius: "20px", padding: "2.25rem 2rem",
        maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: "modalPop 0.22s ease-out",
        fontFamily: "Inter, system-ui, sans-serif",
      }}>
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#eef2ff", color: "#4f46e5",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <SupportIcon />
            </div>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem", textAlign: "center" }}>
              Contact Admin
            </h2>

            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1.25rem", lineHeight: 1.6, textAlign: "center" }}>
              This browser could not be authorized for your purchase. Describe the problem below
              and an admin will review your request.
            </p>

            <div style={{
              background: "#f8fafc", borderRadius: "12px", padding: "1rem",
              marginBottom: "1.25rem", border: "1px solid #e2e8f0",
            }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Paid note
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                {noteTitle || noteKey}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Purchase date
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#334155" }}>
                {formatDate(purchaseDate)}
              </p>
            </div>

            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#0f172a", marginBottom: "6px" }}>
              Describe the problem <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain your issue. For example, I purchased these notes on my this device, but after clearing Chrome data, NotesHub says they were purchased on another device."
              style={{
                width: "100%", boxSizing: "border-box", resize: "vertical",
                padding: "0.75rem 0.9rem", borderRadius: "10px",
                border: "1.5px solid #e2e8f0", fontSize: "0.875rem",
                fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a",
                lineHeight: 1.6, outline: "none",
              }}
            />

            {error && (
              <p style={{ color: "#dc2626", fontSize: "0.83rem", margin: "0.6rem 0 0" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "0.8rem", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", background: "white",
                  color: "#374155", fontWeight: 600, fontSize: "0.9rem",
                  cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1, padding: "0.8rem", borderRadius: "10px", border: "none",
                  background: submitting ? "#818cf8" : "#4f46e5",
                  color: "white", fontWeight: 700, fontSize: "0.9rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#f0fdf4", color: "#16a34a",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <CheckIcon />
            </div>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem" }}>
              Request Submitted
            </h2>

            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              Your recovery request is now with the NotesHub team. You will receive an email at
              your registered address once a decision is made, and this page will update
              automatically.
            </p>

            <div style={{
              background: "#f8fafc", borderRadius: "12px", padding: "1rem",
              marginBottom: "1.25rem", border: "1px solid #e2e8f0", textAlign: "left",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Status
                </span>
                <StatusPill status={submitted.status} />
              </div>
              <p style={{ margin: "10px 0 0", fontSize: "0.85rem", color: "#334155" }}>
                <span style={{ color: "#94a3b8" }}>Reference: </span>
                <code style={{ fontSize: "0.78rem", background: "#eef2ff", color: "#4f46e5", padding: "2px 6px", borderRadius: "4px", wordBreak: "break-all" }}>
                  {submitted.id}
                </code>
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#334155" }}>
                <span style={{ color: "#94a3b8" }}>Paid note: </span>
                {noteTitle || noteKey}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#334155" }}>
                <span style={{ color: "#94a3b8" }}>Purchased on: </span>
                {formatDate(purchaseDate)}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "#334155" }}>
                <span style={{ color: "#94a3b8" }}>Submitted on: </span>
                {formatDate(submitted.createdAt)}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "0.8rem", borderRadius: "10px", border: "none",
                background: "#4f46e5", color: "white", fontWeight: 700, fontSize: "0.9rem",
                cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
