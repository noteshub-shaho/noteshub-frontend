import "../pages/auth/auth.css";
import logo from "../assets/logo.jpg";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        {title && <img src={logo} alt="NotesHub" style={{ height: 48, objectFit: "contain", mixBlendMode: "multiply", marginBottom: "0.5rem" }} />}
        <p className="auth-subtitle">{subtitle}</p>
        {children}
        {footer && (
          <div className="auth-footer">{footer}</div>
        )}
      </div>
    </div>
  );
}
