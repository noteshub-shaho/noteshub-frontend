import { useState } from "react";

export default function TermsModal({ onAccept, onDecline }) {
  const [choice, setChoice] = useState("");
  const [loading, setLoading] = useState(false);
  const isAccepted = choice === "accept";

  const handleAccept = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${import.meta.env.VITE_API_URL}/api/terms/accept-terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        user.termsAccepted = true;
        localStorage.setItem("user", JSON.stringify(user));
      }
if (onAccept) onAccept();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (onDecline) onDecline();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        background: "white", width: "100%", maxWidth: 600,
        borderRadius: 20, boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", maxHeight: "90vh",
      }}>
        <div style={{
          padding: "28px 32px 16px",
          borderBottom: "1px solid #f1f5f9",
        }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            NotesHub — Terms & Conditions & Privacy Policy
          </h2>
        </div>

        <div style={{
          overflowY: "auto", padding: "20px 32px",
          fontSize: "0.875rem", color: "#475569", lineHeight: 1.8, flex: 1,
        }}>
          <p style={{ marginBottom: "1rem" }}>Welcome to <strong>NotesHub</strong>. By accessing, registering, or using this platform, you agree to be legally bound by the following Terms & Conditions and Privacy Policy. If you do not agree, please discontinue use of the platform.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Purpose of NotesHub</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub is an educational content-sharing platform created to help students access personal study notes, solved previous year question papers, and educational reference materials. All content is provided strictly for educational and self-learning purposes only.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>No University or Board Affiliation</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub is NOT associated, affiliated, endorsed, or owned by any university, education board, or government or private educational institution. References to universities, boards, courses, or examinations are used only for identification and informational purposes.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>User Responsibility</h4>
          <p style={{ marginBottom: "1rem" }}>Users are solely responsible for how they use the content available on NotesHub. NotesHub does not guarantee academic results or exam outcomes. Users must not misuse, redistribute, or commercially exploit any content from the platform.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Content Accuracy Disclaimer</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub does not guarantee that all content is accurate, complete, or up to date. Study material may be based on personal understanding and shared experiences. Users are advised to cross-verify information with official academic sources.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Account & Access Policy</h4>
          <p style={{ marginBottom: "1rem" }}>Users must register and verify their email to access NotesHub. Users are responsible for maintaining the security of their account credentials. NotesHub reserves the right to restrict or terminate access if misuse or policy violation is detected.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Downloads & Usage Rights</h4>
          <p style={{ marginBottom: "1rem" }}>Content may be viewed and downloaded only for personal educational use. Uploading illegal, misleading, or copyrighted material without permission is prohibited. Violations may result in immediate account suspension.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Limitation of Liability</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub shall not be responsible for academic loss or misunderstanding, errors or omissions in study material, or platform unavailability or technical issues. All services are provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Changes to Terms</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub reserves the right to update or modify these Terms & Conditions at any time. Continued use of the platform indicates acceptance of the revised terms.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Privacy Policy</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub respects user privacy and is committed to protecting personal information.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Information We Collect</h4>
          <p style={{ marginBottom: "1rem" }}>We collect only essential information required for account access and platform functionality, such as email address for authentication and account-related details provided during registration. No unnecessary personal data is collected.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Data Protection</h4>
          <p style={{ marginBottom: "1rem" }}>User information is kept private and used only for platform functionality. NotesHub does not sell, rent, or share user data with third parties.</p>

          <h4 style={{ fontWeight: 600, color: "#1e293b", marginTop: "1.25rem", marginBottom: "0.25rem" }}>Contact</h4>
          <p style={{ marginBottom: "1rem" }}>NotesHub does not guarantee dedicated customer support. Users may contact the platform through available channels for critical concerns.</p>

          <p style={{ marginBottom: "0.5rem" }}>By selecting <strong>"Accept"</strong>, you confirm that you have read, understood, and agreed to the Terms & Conditions and Privacy Policy of NotesHub.</p>
        </div>

        <div style={{
          padding: "20px 32px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.875rem", color: "#374151" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="radio"
                name="terms"
                value="accept"
                onChange={(e) => setChoice(e.target.value)}
                style={{ accentColor: "#4f46e5" }}
              />
              I Accept the Terms & Conditions
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="radio"
                name="terms"
                value="decline"
                onChange={(e) => setChoice(e.target.value)}
                style={{ accentColor: "#4f46e5" }}
              />
              I Do Not Accept
            </label>
          </div>

          <button
            disabled={!choice}
            onClick={isAccepted ? handleAccept : handleDecline}
            style={{
              width: "100%", padding: "10px",
              borderRadius: 12, border: "none",
              background: choice ? "#0f172a" : "#94a3b8",
              color: "white", fontSize: "0.875rem", fontWeight: 600,
              cursor: choice ? "pointer" : "not-allowed",
              transition: "background 0.15s ease",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Please wait...
              </span>
            ) : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
