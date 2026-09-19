import { useState } from "react";

const PRESET_AMOUNTS = [10, 20, 50, 100];
const MIN_AMOUNT = 2;
const API_URL = import.meta.env.VITE_API_URL;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STATUS = {
  IDLE: "idle",
  CREATING: "creating",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

export default function DonateModal({ onClose }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [isManual, setIsManual] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualError, setManualError] = useState("");
  const [status, setStatus] = useState(STATUS.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const [paidAmount, setPaidAmount] = useState(null);

  const getEffectiveAmount = () => {
    if (isManual) {
      const val = parseFloat(manualAmount);
      return isNaN(val) ? null : val;
    }
    return selectedAmount;
  };

  const validateManual = (val) => {
    if (val === "" || val === null || val === undefined)
      return "Please enter an amount";
    const num = parseFloat(val);
    if (isNaN(num) || !/^\d+(\.\d{1,2})?$/.test(String(val).trim()))
      return "Enter a valid amount";
    if (num < MIN_AMOUNT) return `Minimum donation is ₹${MIN_AMOUNT}`;
    if (num <= 0) return "Amount must be greater than 0";
    return "";
  };

  const handleManualInput = (e) => {
    const val = e.target.value;
    if (/[^0-9.]/.test(val)) return;
    if ((val.match(/\./g) || []).length > 1) return;
    setManualAmount(val);
    setManualError(validateManual(val));
  };

  const handlePreset = (amount) => {
    setSelectedAmount(amount);
    setIsManual(false);
    setManualAmount("");
    setManualError("");
    setErrorMsg("");
  };

  const handleManualToggle = () => {
    setIsManual(true);
    setSelectedAmount(null);
    setErrorMsg("");
  };

  const handleDonate = async () => {
    setErrorMsg("");

    const amount = getEffectiveAmount();

    if (isManual) {
      const err = validateManual(manualAmount);
      if (err) {
        setManualError(err);
        return;
      }
    }

    if (!amount || amount < MIN_AMOUNT) {
      setErrorMsg("Please select or enter a valid donation amount");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setErrorMsg("Payment service could not be loaded. Please try again.");
      return;
    }

    setStatus(STATUS.CREATING);

    let order;
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/donations/create-order`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus(STATUS.IDLE);
        setErrorMsg(
          data.message || "Failed to create payment order. Please try again."
        );
        return;
      }

      order = data;
    } catch {
      setStatus(STATUS.IDLE);
      setErrorMsg("Could not reach payment service. Check your connection.");
      return;
    }

    setStatus(STATUS.PROCESSING);

    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "NotesHub",
      description: "Support NotesHub",
      order_id: order.orderId,
      handler: async (response) => {
        try {
          const token = localStorage.getItem("token");
          const headers = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          const verifyRes = await fetch(`${API_URL}/api/donations/verify`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            setPaidAmount(verifyData.amount);
            setStatus(STATUS.SUCCESS);
          } else {
            setStatus(STATUS.FAILED);
            setErrorMsg(
              verifyData.message ||
                "Payment verification failed. Contact support if money was deducted."
            );
          }
        } catch {
          setStatus(STATUS.FAILED);
          setErrorMsg(
            "Verification request failed. Contact support if money was deducted."
          );
        }
      },
      modal: {
        ondismiss: () => {
          setStatus(STATUS.CANCELLED);
        },
      },
      theme: { color: "#0f172a" },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", () => {
      setStatus(STATUS.FAILED);
      setErrorMsg("Payment failed. Please try again.");
    });

    rzp.open();
  };

  const handleRetry = () => {
    setStatus(STATUS.IDLE);
    setErrorMsg("");
    setSelectedAmount(null);
    setIsManual(false);
    setManualAmount("");
    setManualError("");
    setPaidAmount(null);
  };

  const isLoading =
    status === STATUS.CREATING || status === STATUS.PROCESSING;
  const paidAmountInRupees = paidAmount
    ? (paidAmount / 100).toFixed(0)
    : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(15,23,42,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "backdropFade 0.2s ease",
      }}
      onClick={
        status === STATUS.IDLE || status === STATUS.CANCELLED
          ? onClose
          : undefined
      }
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "2rem 1.75rem",
          maxWidth: "380px",
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          textAlign: "center",
          animation: "modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#fff1f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#e11d48"
            stroke="#e11d48"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        <h2
          style={{
            margin: "0 0 0.4rem",
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Support NotesHub
        </h2>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "0.85rem",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          NotesHub is <strong>100% free and ad-free</strong>. If it helped you
          in your studies, consider supporting us — every contribution keeps
          this platform alive!
        </p>

        {status === STATUS.SUCCESS && (
          <div style={{ padding: "1.5rem 0" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "#0f172a",
                margin: "0 0 0.4rem",
              }}
            >
              Thank you for supporting NotesHub!
            </p>
            {paidAmountInRupees && (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#16a34a",
                  fontWeight: 700,
                  margin: "0 0 0.5rem",
                }}
              >
                ₹{paidAmountInRupees} donated successfully
              </p>
            )}
            <p
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                margin: "0 0 1.5rem",
              }}
            >
              Your support means the world to us.
            </p>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Close
            </button>
          </div>
        )}

        {status === STATUS.FAILED && (
          <div style={{ padding: "0.5rem 0 1rem" }}>
            <div
              style={{
                background: "#fef2f2",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <p
                style={{
                  color: "#dc2626",
                  fontWeight: 700,
                  margin: "0 0 0.3rem",
                  fontSize: "0.9rem",
                }}
              >
                Payment Failed
              </p>
              <p style={{ color: "#7f1d1d", fontSize: "0.8rem", margin: 0 }}>
                {errorMsg}
              </p>
            </div>
            <button
              onClick={handleRetry}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "none",
                background: "#0f172a",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
                marginBottom: "0.6rem",
              }}
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "1.5px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Maybe Later
            </button>
          </div>
        )}

        {(status === STATUS.IDLE ||
          status === STATUS.CREATING ||
          status === STATUS.PROCESSING ||
          status === STATUS.CANCELLED) && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handlePreset(amt)}
                  disabled={isLoading}
                  style={{
                    padding: "0.6rem 0",
                    borderRadius: "10px",
                    border:
                      selectedAmount === amt && !isManual
                        ? "2px solid #0f172a"
                        : "1.5px solid #e2e8f0",
                    background:
                      selectedAmount === amt && !isManual ? "#0f172a" : "white",
                    color:
                      selectedAmount === amt && !isManual ? "white" : "#334155",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontFamily: "Inter, system-ui, sans-serif",
                    transition: "all 0.15s",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleManualToggle}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.6rem",
                borderRadius: "10px",
                border: isManual ? "2px solid #0f172a" : "1.5px solid #e2e8f0",
                background: isManual ? "#f8fafc" : "white",
                color: "#334155",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
                marginBottom: "0.75rem",
                transition: "all 0.15s",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              Enter manually
            </button>

            {isManual && (
              <div style={{ marginBottom: "0.75rem", textAlign: "left" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: manualError
                      ? "1.5px solid #dc2626"
                      : "1.5px solid #cbd5e1",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "white",
                  }}
                >
                  <span
                    style={{
                      padding: "0 0.75rem",
                      color: "#64748b",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      borderRight: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      alignSelf: "stretch",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    value={manualAmount}
                    onChange={handleManualInput}
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: "0.65rem 0.75rem",
                      border: "none",
                      outline: "none",
                      fontSize: "0.9rem",
                      color: "#0f172a",
                      fontFamily: "Inter, system-ui, sans-serif",
                      background: "transparent",
                    }}
                  />
                </div>
                {manualError && (
                  <p
                    style={{
                      color: "#dc2626",
                      fontSize: "0.75rem",
                      margin: "0.3rem 0 0 0.2rem",
                    }}
                  >
                    {manualError}
                  </p>
                )}
              </div>
            )}

            {errorMsg && status !== STATUS.FAILED && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "0.78rem",
                  margin: "0 0 0.75rem",
                  textAlign: "left",
                }}
              >
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleDonate}
              disabled={isLoading || (isManual && !!manualError)}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "12px",
                border: "none",
                background: isLoading ? "#94a3b8" : "#0f172a",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
                marginBottom: "0.6rem",
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {status === STATUS.CREATING && (
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              )}
              {status === STATUS.CREATING
                ? "Preparing..."
                : status === STATUS.PROCESSING
                ? "Processing..."
                : "Support NotesHub"}
            </button>

            <p
              style={{
                margin: "0 0 1rem",
                fontSize: "0.78rem",
                color: "#94a3b8",
              }}
            >
              100% optional. No pressure. We're grateful either way.
            </p>

            <button
              onClick={onClose}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "none",
                background: isLoading ? "#f1f5f9" : "#0f172a",
                color: isLoading ? "#94a3b8" : "white",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Maybe Later
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes backdropFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}