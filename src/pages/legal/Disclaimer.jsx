const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const Disclaimer = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <main style={{ width: "100%", maxWidth: 1200, margin: "auto", padding: "28px 20px" }}>

        <div style={{ background: "white", padding: 40, borderRadius: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", background: "#f5f3ff", color: "#7c3aed" }}>
            <ShieldIcon />
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.75rem", lineHeight: 1.2, letterSpacing: "-0.5px" }}>Disclaimer &amp; Terms of Use</h1>
          <p style={{ fontSize: "1rem", color: "#64748b", margin: 0, lineHeight: 1.7 }}>Please read this carefully before using NotesHub.</p>
        </div>

        <div style={{ background: "white", padding: "3rem 3.5rem", borderRadius: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", lineHeight: 1.85, color: "#475569", fontSize: "0.95rem" }}>
          <p style={{ marginBottom: "1.25rem" }}>
            NotesHub is an independent educational platform created to help students
            access study materials in an organized and user-friendly manner. While
            we aim to provide accurate and helpful academic resources, we do not
            guarantee that all content on this platform is completely error-free or
            updated at all times.
          </p>
          <p style={{ marginBottom: "1.25rem" }}>
            The materials provided on NotesHub may include notes, previous question
            papers, subject references, or academic resources collected from various
            public and educational sources. These materials are shared only for
            learning and reference purposes.
          </p>
          <p style={{ marginBottom: "1.25rem" }}>
            NotesHub is not officially affiliated with any university, board, or
            academic institution unless explicitly stated. All university names,
            logos, and academic references belong to their respective owners.
          </p>
          <p style={{ marginBottom: "1.25rem" }}>
            We do not claim ownership of copyrighted academic content unless clearly
            mentioned. If any organization or individual believes that their
            copyrighted content has been shared improperly, they may contact us for
            prompt review and removal if required.
          </p>
          <p style={{ marginBottom: "1.25rem" }}>NotesHub will not be held responsible for:</p>
          <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>Any academic loss caused by incorrect or outdated information</li>
            <li style={{ marginBottom: "0.5rem" }}>Loss of data, results, marks, or exam-related misunderstandings</li>
            <li style={{ marginBottom: "0.5rem" }}>Technical interruptions, website downtime, or service delays</li>
            <li style={{ marginBottom: "0.5rem" }}>Any reliance placed on the materials available on this platform</li>
          </ul>
          <p style={{ marginBottom: "1.25rem" }}>
            Students are strongly advised to verify important academic information
            such as syllabus updates, exam schedules, and official notices directly
            from their university or institute websites.
          </p>
          <p style={{ marginBottom: "1.25rem" }}>
            By using NotesHub, you acknowledge and agree to this disclaimer policy
            and accept that the platform is intended purely as a supportive
            educational tool.
          </p>
        </div>

      </main>
    </div>
  );
};

export default Disclaimer;