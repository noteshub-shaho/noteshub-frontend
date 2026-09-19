import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";
import { api } from "../../services/api";
import Message from "../../components/common/Message";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
    const res = await api.auth.resetPassword(email, { newPassword, confirmPassword });
      setMessage({ type: "success", text: res.data.message || "Password updated!" });
      setTimeout(() => navigate("/login?reset=true"), 1200);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to reset password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="NotesHub" subtitle="Set a new password for your account">
      <Message type={message?.type} text={message?.text} />
      <form onSubmit={submit}>
        <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        <button disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
