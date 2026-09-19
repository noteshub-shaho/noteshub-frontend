import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import muLogo from "../../assets/mu-logo.png";
import msbteLogo from "../../assets/msbte-logo.png";
import "./app.css";

const BookOpenIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const subjectsData = {
  mu: {
    sem3: ["aoa", "coa", "maths", "dsgt", "genai", "important-answers"],
    sem4: ["syllabus", "cth", "os", "dbms", "web-technologies", "oe-ibs", "lab-experiments", "assignments", "Business-Model-Development", "Design-Thinking", "important-answers", "internal-assessments"],
    sem5: ["syllabus", "lab-experiment", "internal-assessments-1"],
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
  "lab-experiment": ["se-lab", "aisc-lab", "dwm-lab", "cn-lab", "wml-lab"],
};

const universityData = {
  mu: [
    { id: 3, name: "Sem 3", semKey: "sem3" },
    { id: 4, name: "Sem 4", semKey: "sem4" },
    { id: 5, name: "Sem 5", semKey: "sem5" },
  ],
  msbte: [
    { id: 4, name: "Sem 4", semKey: "sem4" },
    { id: 5, name: "Sem 5", semKey: "sem5" },
    { id: 6, name: "Sem 6", semKey: "sem6" },
  ],
};

function formatFileCount(count) {
  const n = Number(count) || 0;
  if (n < 5) return `${n}+ Files`;
  return `${Math.floor(n / 5) * 5}+ Files`;
}

function getSubjectCount(university, semKey) {
  const list = subjectsData[university]?.[semKey] || [];
  return list.reduce((total, subject) => {
    if (nestedSubjects[subject]) return total + nestedSubjects[subject].length;
    return total + 1;
  }, 0);
}

async function fetchSemesterFileCount(university, semKey) {
  const allSubjects = subjectsData[university]?.[semKey] || [];

  const flatSubjects = [];
  allSubjects.forEach((subject) => {
    if (nestedSubjects[subject]) {
      nestedSubjects[subject].forEach((sub) => {
        flatSubjects.push({ subject, subSubject: sub });
      });
    } else {
      flatSubjects.push({ subject, subSubject: null });
    }
  });

  const BASE_URL = `${import.meta.env.VITE_API_URL}/api/notes`;

  const results = await Promise.allSettled(
    flatSubjects.map(({ subject, subSubject }) => {
      const url = subSubject
        ? `${BASE_URL}/${university}/${semKey}/${subject}/${subSubject}`
        : `${BASE_URL}/${university}/${semKey}/${subject}`;
      return fetch(url).then((r) => r.json());
    })
  );

  return results.reduce((total, result) => {
    if (result.status === "fulfilled" && result.value?.success) {
      return total + (result.value.count || 0);
    }
    return total;
  }, 0);
}

const AccessNotes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUniversity = (searchParams.get("uni") || "mu").toLowerCase();

  const [fileCounts, setFileCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);

  const currentFolders = universityData[selectedUniversity] || [];
  const isMuSelected = selectedUniversity === "mu";

  useEffect(() => {
    const cacheKey = `semesterData:${selectedUniversity}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          setFileCounts(parsed);
          setLoadingCounts(false);
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(cacheKey);
    }

    setLoadingCounts(true);
    const folders = universityData[selectedUniversity] || [];

    Promise.allSettled(
      folders.map(({ semKey }) =>
        fetchSemesterFileCount(selectedUniversity, semKey).then((count) => ({ semKey, count }))
      )
    ).then((results) => {
      const counts = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          counts[result.value.semKey] = result.value.count;
        }
      });
      if (Object.keys(counts).length > 0) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(counts));
        } catch {}
      }
      setFileCounts(counts);
      setLoadingCounts(false);
    });
  }, [selectedUniversity]);

  const pageTitle = isMuSelected
    ? "Mumbai University Notes - All Semesters | NotesHub"
    : "MSBTE Notes - All Semesters | NotesHub";
  const pageDesc = isMuSelected
    ? "Free semester-wise notes for Mumbai University engineering students. Sem 3 and Sem 4 study material, assignments, and important answers."
    : "Free semester-wise notes for MSBTE diploma students. Sem 4, 5, and 6 study material, manuals, and microprojects.";

  const openSemester = (semId) => {
    navigate(`/subjects/${selectedUniversity}/sem${semId}`);
  };

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`${import.meta.env.VITE_FRONTEND_URL}/access-notes`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
      </Helmet>
      <main className="page-container">

        <div className="hero-card" style={{ textAlign: "center" }}>
          <div className="dash-card-icon dash-icon-indigo" style={{ margin: "0 auto 1rem" }}>
            <BookOpenIcon />
          </div>
          <h1 className="hero-title">Access Your Notes</h1>
          <p className="hero-subtitle">
            Choose your university and semester to access study materials.
          </p>
        </div>

        <div className="university-toggle">
          <button
            onClick={() => setSearchParams({ uni: "mu" })}
            className={`university-btn ${isMuSelected ? "active-mu" : "inactive"}`}
          >
            <img src={muLogo} alt="MU" className="toggle-logo" />
            Mumbai University
          </button>

          <button
            onClick={() => setSearchParams({ uni: "msbte" })}
            className={`university-btn ${!isMuSelected ? "active-msbte" : "inactive"}`}
          >
            <img src={msbteLogo} alt="MSBTE" className="toggle-logo" />
            MSBTE
          </button>
        </div>

        <div className="notes-container">
          <h2
            className="university-heading"
            style={{
              borderBottom: `3px solid ${isMuSelected ? "#4f46e5" : "#ea580c"}`,
              justifyContent: "flex-start",
              textAlign: "left",
            }}
          >
            <img
              src={isMuSelected ? muLogo : msbteLogo}
              alt={isMuSelected ? "MU" : "MSBTE"}
              className="toggle-logo"
            />
            {isMuSelected ? "Mumbai University" : "MSBTE"}
          </h2>

          <div className="notes-grid">
            {currentFolders.map((folder) => {
              const subjectCount = getSubjectCount(selectedUniversity, folder.semKey);
              const rawCount = fileCounts[folder.semKey];
              const fileLabel = loadingCounts ? "Loading..." : formatFileCount(rawCount ?? 0);

              return (
                <div key={folder.id} className="notes-card">
                  <h3 style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
                    {folder.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                    {subjectCount} Subjects &bull; {fileLabel}
                  </p>
                  <button
                    onClick={() => openSemester(folder.id)}
                    className={`notes-btn ${isMuSelected ? "mu" : "msbte"}`}
                    style={{ width: "100%", textAlign: "center", marginTop: 14 }}
                  >
                    View Notes →
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};

export default AccessNotes;