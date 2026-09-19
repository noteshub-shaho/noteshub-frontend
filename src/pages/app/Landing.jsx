import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import logo from "../../assets/logo.jpg";
import "./app.css";

const BookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ZapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const GraduationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="lp-root">

      <Helmet>
        <title>NotesHub - Free Study Notes for MU & MSBTE Students</title>
        <meta name="description" content="Access free semester-wise engineering notes for Mumbai University and MSBTE students. Find your subject instantly, preview and download PDFs for free." />
        <meta name="keywords" content="NotesHub, Mumbai University notes, MSBTE notes, engineering notes, semester notes, computer engineering, free study material, MU notes" />
        <link rel="canonical" href={import.meta.env.VITE_FRONTEND_URL} />
        <meta property="og:title" content="NotesHub - Free Study Notes for MU & MSBTE Students" />
        <meta property="og:description" content="Access free semester-wise engineering notes for Mumbai University and MSBTE students." />
        <meta property="og:url" content={import.meta.env.VITE_FRONTEND_URL} />
        <meta property="og:type" content="website" />
      </Helmet>

      <main className="lp-main">
        <div className="lp-badge">
          <GraduationIcon />
          <span>Free for MU &amp; MSBTE Students</span>
        </div>

        <h1 className="lp-heading">
          Study smarter.<br />
          <span className="lp-heading-accent">Not harder.</span>
        </h1>

        <p className="lp-desc">
          Semester wise notes for engineering students, organized by subject, always up to date, and free to access.
        </p>

        <div className="lp-actions">
          <button onClick={() => navigate("/access-notes")} className="lp-cta">
            Access Notes <ArrowIcon />
          </button>
        </div>

        <div className="lp-divider">
          <span>What you get</span>
        </div>

        <div className="lp-features">
          <div className="lp-feature-card">
            <div className="lp-feature-icon lp-icon-blue"><BookIcon /></div>
            <div className="lp-feature-content">
              <h3>MU &amp; MSBTE Notes</h3>
              <p>All semesters covered. Find your subject in seconds, no more hunting through drives or groups.</p>
            </div>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon lp-icon-indigo"><ZapIcon /></div>
            <div className="lp-feature-content">
              <h3>Instant Open</h3>
              <p>One click to open any file. No redirects, no ads, no confusion. Just your notes.</p>
            </div>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon lp-icon-violet"><ShieldIcon /></div>
            <div className="lp-feature-content">
              <h3>Secure Access</h3>
              <p>Email verified login. Your account stays safe and your session stays active.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="lp-footer">
        <img src={logo} alt="NotesHub" style={{ height: 22, objectFit: "contain" }} />
        <span className="lp-footer-dot">·</span>
        <span> &copy; 2026 NotesHub</span>
        <span className="lp-footer-dot">·</span>
        <span>Built for students</span>
      </footer>

    </div>
  );
}