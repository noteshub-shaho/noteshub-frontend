import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { buildCouponRequestUrl } from "../../utils/whatsapp";
import { formatRupees } from "../../utils/currency";

const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TagIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function PurchaseModal({ noteKey, noteTitle, fingerprints, onClose, onSuccess }) {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [eligibleCoupon, setEligibleCoupon] = useState(null);

  useEffect(() => {
    api.paidNotes.getConfig(noteKey)
      .then((res) => setConfig(res.data))
      .catch(() => setError("Failed to load note details."))
      .finally(() => setLoading(false));
  }, [noteKey]);

  useEffect(() => {
    api.paidNotes.getEligibleCoupon(noteKey)
      .then((res) => setEligibleCoupon(res.data))
      .catch(() => setEligibleCoupon(null));
  }, [noteKey]);

  const hasEligibleCoupon = !!eligibleCoupon?.eligible;
  const payablePaise = couponApplied ? couponApplied.finalPricePaise : config ? config.price * 100 : null;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.paidNotes.validateCoupon(code, noteKey);
      setCouponApplied(res.data);
      setCouponInput("");
    } catch (err) {
      setCouponApplied(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponError(null);
  };

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const orderRes = await api.paidNotes.createOrder(noteKey, couponApplied?.code);
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
                // The stable v2 fingerprint is frozen as this purchase's
                // device identity; it does not change with browser layout.
                deviceFingerprint: fingerprints.fingerprint,
              },
              fingerprints
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
      const message = err.response?.data?.message || "Failed to initiate payment.";
      if (couponApplied && (err.response?.status === 400 || err.response?.status === 409)) {
        setCouponApplied(null);
        setCouponError(`${message} You can pay the regular price instead.`);
      } else {
        setError(message);
      }
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
        maxHeight: "92vh", overflowY: "auto",
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
              padding: "1rem", marginBottom: "1rem",
              border: "1px solid #e2e8f0",
            }}>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {couponApplied ? "Discounted Price" : "Price"}
              </p>
              {couponApplied ? (
                <>
                  <p style={{ margin: "2px 0 0", fontSize: "0.95rem", fontWeight: 600, color: "#94a3b8", textDecoration: "line-through" }}>
                    {formatRupees(couponApplied.originalPricePaise)}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "1.8rem", fontWeight: 800, color: "#16a34a" }}>
                    {formatRupees(couponApplied.finalPricePaise)}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", fontWeight: 600, color: "#16a34a" }}>
                    You save {formatRupees(couponApplied.discountAmountPaise)} ({couponApplied.discountPercent}% off)
                  </p>
                </>
              ) : (
                <p style={{ margin: "4px 0 0", fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
                  {formatRupees(config.price * 100)}
                </p>
              )}
            </div>

            {!couponApplied ? (
              <div style={{
                background: hasEligibleCoupon ? "#f0fdf4" : "#f8fafc",
                borderRadius: "12px",
                padding: "0.9rem 1rem", marginBottom: "1.5rem",
                border: hasEligibleCoupon ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                textAlign: "left",
              }}>
                {hasEligibleCoupon && (
                  <p style={{
                    margin: "0 0 0.6rem", fontSize: "0.8rem", fontWeight: 700,
                    color: "#15803d", display: "flex", alignItems: "center", gap: "6px",
                  }}>
                    <CheckIcon />
                    You have an exclusive {eligibleCoupon.discountPercent}% OFF coupon for this note —
                    enter the code you received.
                  </p>
                )}

                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  marginBottom: "0.6rem", color: "#4f46e5",
                }}>
                  <TagIcon />
                  <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Have a coupon code?</span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={applyingCoupon}
                    style={{
                      flex: 1, minWidth: 0, padding: "0.6rem 0.75rem",
                      borderRadius: "8px", border: "1px solid #cbd5e1",
                      fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.5px",
                      fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a",
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon}
                    style={{
                      padding: "0.6rem 1rem", borderRadius: "8px", border: "none",
                      background: applyingCoupon ? "#818cf8" : "#4f46e5",
                      color: "white", fontWeight: 700, fontSize: "0.85rem",
                      cursor: applyingCoupon ? "not-allowed" : "pointer",
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {applyingCoupon ? "Applying..." : "Apply Coupon"}
                  </button>
                </div>

                {couponError && (
                  <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0.6rem 0 0" }}>
                    {couponError}
                  </p>
                )}

                {!hasEligibleCoupon && (
                  <p style={{ margin: "0.7rem 0 0", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.5 }}>
                    Don't have a coupon?{" "}
                    <a
                      href={buildCouponRequestUrl({
                        name: user?.username,
                        email: user?.email,
                        noteTitle: noteTitle || config.title,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}
                    >
                      Get up to 50% OFF on WhatsApp →
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div style={{
                background: "#f0fdf4", borderRadius: "12px",
                padding: "0.85rem 1rem", marginBottom: "1.5rem",
                border: "1px solid #bbf7d0",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", textAlign: "left", minWidth: 0 }}>
                  <span style={{ color: "#16a34a", display: "flex" }}><CheckIcon /></span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: "#15803d", wordBreak: "break-all" }}>
                      {couponApplied.code}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#16a34a" }}>
                      Coupon applied · {couponApplied.discountPercent}% off
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={paying}
                  style={{
                    background: "none", border: "none", color: "#64748b",
                    fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                    fontFamily: "Inter, system-ui, sans-serif", flexShrink: 0,
                  }}
                >
                  Remove
                </button>
              </div>
            )}

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
              {paying ? "Processing..." : `Pay ${formatRupees(payablePaise)}`}
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
