import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DonateModal from "../../components/modals/DonateModal";
import { api } from "../../services/api";
import "./app.css";

const NotesIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SupportIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const HeartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const parseSemester = (noteKey) => {
  const parts = noteKey.split("/");
  const uni = (parts[0] || "").toUpperCase();
  const sem = (parts[1] || "").replace("sem", "SEM ");
  return `${uni} ${sem}`.trim();
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDonate, setShowDonate] = useState(false);
  const [importantNotes, setImportantNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  useEffect(() => {
    api.paidNotes.getImportantNotes()
      .then((res) => {
        if (res.data?.success) setImportantNotes(res.data.notes);
      })
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, []);

  const grouped = importantNotes.reduce((acc, note) => {
    const sem = parseSemester(note.noteKey);
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(note);
    return acc;
  }, {});

  return (
    <div className="page-wrapper">
      <main className="page-container">

        <div className="hero-card">
          <h1 className="hero-title">
            Welcome back,<br />
            <span className="highlight-text">{user?.name || "Student"}</span>
          </h1>
          <p className="hero-subtitle">
            Your go-to spot for Mumbai University &amp; MSBTE notes. Let's crush those exams.
          </p>
        </div>

        {!notesLoading && importantNotes.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>Important Notes</span>
              <span style={{
                background: "#eef2ff", color: "#4f46e5",
                fontSize: "0.7rem", fontWeight: 700,
                padding: "2px 8px", borderRadius: "999px",
              }}>PAID</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {importantNotes.map((note) => (
                <div
                  key={note.noteKey}
                  onClick={() => navigate(`/paid-notes/${note.noteKey}`)}
                  style={{
                    background: "white",
                    border: "1px solid #eef2ff",
                    borderRadius: "16px",
                    padding: "1.1rem 1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    boxShadow: "0 4px 14px rgba(79,70,229,0.07)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 22px rgba(79,70,229,0.14)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.07)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "10px",
                      background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, color: "white",
                    }}>
                      <StarIcon />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {note.title}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748b" }}>₹{note.price}</p>
                    </div>
                  </div>
                  <span style={{ color: "#4f46e5", fontSize: "1rem", flexShrink: 0 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

  <div className="card-grid">
          <div className="dashboard-card" onClick={() => navigate("/access-notes")}>
            <div className="dash-card-icon dash-icon-indigo">
              <NotesIcon />
            </div>
            <h3>Access Notes</h3>
            <p>All your study materials, organized by semester and subject.</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate("/contact")}>
            <div className="dash-card-icon dash-icon-blue">
              <SupportIcon />
            </div>
            <h3>Get Help</h3>
            <p>Quick support whenever you're stuck or need assistance.</p>
          </div>
        </div>

      {/* Support Banner */}
        <div
onClick={() => setShowDonate(true)}
          style={{
            marginTop: "1.5rem",
            background: "white",
            border: "1.5px solid #eef2ff",
            borderRadius: "20px",
            padding: "1.25rem 1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            gap: "1rem",
            flexWrap: "wrap",
            boxShadow: "0 6px 20px rgba(79, 70, 229, 0.08)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{
              width: 48, height: 48, borderRadius: "12px",
              background: "#fff1f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <HeartIcon />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
                NotesHub is ad-free
              </p>
              <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                If it helped you, consider supporting us with a small donation!
              </p>
            </div>
          </div>
      <button style={{
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
          flexShrink: 0,
          }}>
            Support Us
          </button>
        </div>



        {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}

      </main>
    </div>
  );
};

export default Dashboard;
