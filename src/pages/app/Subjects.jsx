import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./app.css";

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const Subjects = () => {
  const { university, semester } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeParent, setActiveParent] = useState(
    location.state?.activeParent || null
  );

  const subjectsData = {
    mu: {
      sem3: ["aoa", "coa", "maths", "dsgt", "genai", "important-answers"],
      sem4: ["syllabus", "cth", "os", "dbms", "web-technologies", "oe-ibs", "lab-experiments", "assignments", "Business-Model-Development", "Design-Thinking", "important-answers" ,"internal-assessments"],
      sem5: ["syllabus", "lab-experiment","internal-assessments-1"],
    },
    msbte: {
      sem4: ["important-questions", "microproject", "syllabus"],
      sem5: ["microproject", "answers", "manual"],
      sem6: ["eti", "important-answers", "manual", "mgt", "microproject"],
    },
  };

  const nestedSubjects = {
    "lab-experiments": ["dbms-lab", "os-lab", "web-tech-lab"],
    "assignments": ["cth", "dbms", "os", "web-tech", "ibs"],
    "lab-experiment": ["se-lab","aisc-lab","dwm-lab","cn-lab","wml-lab"],
  };

 const subjects = subjectsData[university]?.[semester] || [];
  const isMu = university === "mu";

  const uniName = isMu ? "Mumbai University" : "MSBTE";
  const semLabel = semester ? semester.toUpperCase() : "";
  const pageTitle = `${semLabel} Subjects - ${uniName} | NotesHub`;
  const pageDesc = `Browse all ${semLabel} subjects for ${uniName} on NotesHub. Free engineering notes, assignments, and study material for every subject.`;
  const canonicalUrl = `${import.meta.env.VITE_FRONTEND_URL}/subjects/${university}/${semester}`;

const handleSubjectClick = (subject) => {
    if (nestedSubjects[subject]) {
      setActiveParent(subject);
    } else {
      navigate(`/notes/${university}/${semester}/${subject}`, {
        state: { university, semester },
      });
    }
  };

  const handleSubClick = (sub) => {
    navigate(`/notes/${university}/${semester}/${activeParent}/${sub}`, {
      state: { university, semester, activeParent },
    });
  };
  const displayList = activeParent ? nestedSubjects[activeParent] : subjects;

 return (
    <div className="page-wrapper">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>
      <main className="page-container">

      <div className="hero-card">
          <button
            className="subjects-back-btn"
            onClick={() => activeParent ? setActiveParent(null) : navigate(`/access-notes?uni=${university}`)}
          >
            <BackIcon />
            {activeParent ? `Back to ${semester.toUpperCase()} Subjects` : "Back to Notes"}
          </button>
          <h1 className="hero-title">
            {activeParent
              ? activeParent.toUpperCase().replace(/-/g, " ")
              : `${semester.toUpperCase()} Subjects`}
          </h1>
          <p className="hero-subtitle">
            {activeParent
              ? `Select a subject inside ${activeParent.replace(/-/g, " ")}.`
              : "Select a subject to view available files and notes."}
          </p>
        </div>

        <div className="notes-grid">
          {displayList.map((item, index) => (
            <div key={index} className="notes-card">
              <h3 style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
                {item.toUpperCase().replace(/-/g, " ")}
              </h3>
              {nestedSubjects[item] && !activeParent && (
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                  {nestedSubjects[item].length} subjects
                </p>
              )}
              <button
                onClick={() => activeParent ? handleSubClick(item) : handleSubjectClick(item)}
                className={`notes-btn ${isMu ? "mu" : "msbte"}`}
              >
                {nestedSubjects[item] && !activeParent ? "View →" : "Open →"}
              </button>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default Subjects;
