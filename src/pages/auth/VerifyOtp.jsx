import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import { api } from "../../services/api";
import Message from "../../components/common/Message";

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const email = params.get("email");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.auth.verifyOtp(email, otp);
      setMessage({ type: "success", text: "OTP verified successfully." });
      setTimeout(() => navigate(`/reset-password?email=${email}`), 1200);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Invalid or expired OTP." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="NotesHub" subtitle={`Code sent to ${email || "your email"}`}>
      <Message type={message?.type} text={message?.text} />
      <form onSubmit={submit}>
        <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        <button disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Verifying...
            </span>
          ) : "Verify OTP"}
        </button>
      </form>
    </AuthLayout>
  );
}
