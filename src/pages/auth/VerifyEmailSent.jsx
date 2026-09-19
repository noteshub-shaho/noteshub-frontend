import { Link } from "react-router-dom";
import AuthLayout from "../../layout/AuthLayout";

export default function VerifyEmailSent() {
  return (
    <AuthLayout
      title="NotesHub"
      subtitle="We sent a verification link to your email"
      footer={<Link className="link" to="/login">Back to login</Link>}
    >
      <div className="auth-msg success">
        Please check your inbox and click the verification link. After verification, you can login.
      </div>
    </AuthLayout>
  );
}
