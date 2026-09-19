import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import { api } from "../../services/api";
import Message from "../../components/common/Message";
import { useAuth } from "../../context/AuthContext";
import GoogleAuthButton from "../../components/modals/GoogleAuthButton";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";
  const { login } = useAuth();

  const infoMessage =
    params.get("verified") ? "Email verified! You can now log in." :
    params.get("reset") ? "Password updated! Please log in." : null;

  const errorMessage = params.get("error") ? "Google sign-in failed. Please try again." : null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.auth.login(form);
      login(res.data.user, res.data.accessToken);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="NotesHub"
      subtitle="Access shared notes"
      footer={<Link className="link" to="/signup">Create account</Link>}
    >
      {infoMessage && <Message type="success" text={infoMessage} />}
      {errorMessage && <Message type="error" text={errorMessage} />}
      <Message type={message?.type} text={message?.text} />
      <form onSubmit={submit}>
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <div style={{ position: "relative" }}>
          <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={handleChange} required style={{ paddingRight: "44px" }} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex", alignItems: "center", width: "auto" }}>
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <div className="auth-forgot-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Signing in...
            </span>
          ) : "Continue"}
        </button>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: 12, color: "#94a3b8" }}>OR</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>
      <GoogleAuthButton onError={(text) => setMessage(text ? { type: "error", text } : null)} />
    </AuthLayout>
  );
}