import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import { api } from "../../services/api";
import Message from "../../components/common/Message";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
     const res = await api.auth.sendResetOtp({ email });
      setMessage({ type: "success", text: res.data.message || "OTP sent to your email." });
      setTimeout(() => navigate(`/verify-otp?email=${email}`), 1200);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to send OTP. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="NotesHub"
      subtitle="Enter your email to receive an OTP"
      footer={<Link className="link" to="/login">Back to login</Link>}
    >
      <Message type={message?.type} text={message?.text} />
      <form onSubmit={submit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Sending...
            </span>
          ) : "Send OTP"}
        </button>
      </form>
    </AuthLayout>
  );
}
