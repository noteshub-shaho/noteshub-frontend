import { useState, useEffect } from "react";
import { api } from "../../services/api";

const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function PurchaseModal({ noteKey, noteTitle, deviceFingerprint, onClose, onSuccess }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.paidNotes.getConfig(noteKey)
      .then((res) => setConfig(res.data))
      .catch(() => setError("Failed to load note details."))
      .finally(() => setLoading(false));
  }, [noteKey]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const orderRes = await api.paidNotes.createOrder(noteKey);
      const { orderId, amount, currency, keyId, noteTitle: title } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "NotesHub",
        description: title,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.paidNotes.verifyPurchase(
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                deviceFingerprint,
              },
              deviceFingerprint
            );
            if (verifyRes.data?.deviceToken) {
              localStorage.setItem(`device_token_${noteKey}`, verifyRes.data.deviceToken);
            }
            onSuccess();
          } catch {
            setError("Payment verification failed. Contact support.");
          }
        },
        prefill: {},
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate payment.");
      setPaying(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "white", borderRadius: "20px", padding: "2.5rem 2rem",
        maxWidth: "400px", width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        textAlign: "center", animation: "modalPop 0.22s ease-out",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#eef2ff", color: "#4f46e5",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}>
          <LockIcon />
        </div>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem" }}>
          {noteTitle || "Paid Note"}
        </h2>

        {loading && (
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading details...</p>
        )}

        {!loading && config && (
          <>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              Purchase once and access on your registered device anytime.
            </p>
            <div style={{
              background: "#f8fafc", borderRadius: "12px",
              padding: "1rem", marginBottom: "1.5rem",
              border: "1px solid #e2e8f0",
            }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Price
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
                ₹{config.price}
              </p>
            </div>

            {error && (
              <p style={{ color: "#dc2626", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              style={{
                width: "100%", padding: "0.85rem",
                borderRadius: "10px", border: "none",
                background: paying ? "#818cf8" : "#4f46e5",
                color: "white", fontWeight: 700, fontSize: "0.95rem",
                cursor: paying ? "not-allowed" : "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
                transition: "background 0.15s ease",
              }}
            >
              {paying ? "Processing..." : `Pay ₹${config.price}`}
            </button>
          </>
        )}

        {!loading && error && !config && (
          <p style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "1rem", background: "none", border: "none",
            color: "#94a3b8", fontSize: "0.8rem", cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}