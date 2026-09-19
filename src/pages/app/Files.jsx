import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../context/AuthContext";
import DonateModal from "../../components/modals/DonateModal";
import "./app.css";
const PROTECTED_KEYWORDS = [
  "important-answers",
  "important-questions",
  "important answers",
  "important questions",
  "answers",
  "internal-assessments",
  "manual",
  "lab-experiment",
  "lab-experiments"
];

const isProtectedFile = (fileName) => {
  const lower = fileName.toLowerCase(); 
  return PROTECTED_KEYWORDS.some((kw) => lower.includes(kw));
};


const DotsLoader = () => (
  <div className="dots-loader-wrap">
    <p className="dots-loader-label">Loading Files</p>
    <div className="dots-loader">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  </div>
);

const ClockIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const BackIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);


const AuthGate = ({ fileName, onClose, onLogin, onSignup }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(15,23,42,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}
  >
    <div
      style={{
        background: "white",
        borderRadius: "20px",
        padding: "2.5rem 2rem",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        textAlign: "center",
        animation: "slideUp 0.22s ease-out",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#eef2ff",
          color: "#4f46e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}
      >
        <LockIcon />
      </div>

      <h2
        style={{
          fontSize: "1.3rem",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 0.5rem",
        }}
      >
        Login Required
      </h2>

      <p
        style={{
          fontSize: "0.9rem",
          color: "#64748b",
          lineHeight: 1.7,
          margin: "0 0 1.75rem",
        }}
      >
        <strong style={{ color: "#0f172a" }}>{fileName}</strong> is protected
        content. Login or create an account to access and download this file.
      </p>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={onLogin}
          style={{
            flex: 1,
            padding: "0.8rem 1rem",
            borderRadius: "10px",
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Log In
        </button>
        <button
          onClick={onSignup}
          style={{
            flex: 1,
            padding: "0.8rem 1rem",
            borderRadius: "10px",
            border: "1.5px solid #e2e8f0",
            background: "white",
            color: "#374151",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Sign Up
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: "1rem",
          background: "none",
          border: "none",
          color: "#94a3b8",
          fontSize: "0.8rem",
          cursor: "pointer",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Cancel
      </button>
    </div>
  </div>
);



const SeoHead = ({ pageTitle, pageDesc, canonicalUrl }) => (
  <Helmet>
    <title>{pageTitle}</title>
    <meta name="description" content={pageDesc} />
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={pageDesc} />
    <meta property="og:url" content={canonicalUrl} />
  </Helmet>
);

const Files = () => {
  const { university, semester, subject, subSubject } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [authGate, setAuthGate] = useState(null);
  const [merging, setMerging] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState(null);
const [showDonate, setShowDonate] = useState(false);
  const donateShown = useRef(false);

  const token = localStorage.getItem("token");

  const mergeUrl = subSubject
    ? `${import.meta.env.VITE_API_URL}/api/notes/merge/${university}/${semester}/${subject}/${subSubject}`
    : `${import.meta.env.VITE_API_URL}/api/notes/merge/${university}/${semester}/${subject}`;

  const handleMergeDownload = async () => {
    setMerging(true);
    try {
      const res = await fetch(mergeUrl);
      if (!res.ok) throw new Error("Merge failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${subSubject || subject}-complete-material.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download. Please try again.");
    } finally {
      setMerging(false);
    }
  };

  const apiUrl = subSubject
    ? `${import.meta.env.VITE_API_URL}/api/notes/${university}/${semester}/${subject}/${subSubject}`
    : `${import.meta.env.VITE_API_URL}/api/notes/${university}/${semester}/${subject}`;

 const displayTitle = subSubject
    ? subSubject.toUpperCase().replace(/-/g, " ")
    : subject.toUpperCase().replace(/-/g, " ");

  const uniLabel = university === "msbte" ? "MSBTE" : "Mumbai University";
  const pageTitle = `${displayTitle} Notes - ${semester?.toUpperCase()} ${uniLabel} | NotesHub`;
  const pageDesc = `Download free ${displayTitle} notes for ${uniLabel} ${semester?.toUpperCase()}. PDFs, assignments and study material, organized and ready to view.`;
  const canonicalUrl = subSubject
    ? `${import.meta.env.VITE_FRONTEND_URL}/notes/${university}/${semester}/${subject}/${subSubject}`
    : `${import.meta.env.VITE_FRONTEND_URL}/notes/${university}/${semester}/${subject}`;

const handleBack = () => {
    if (subSubject) {
      navigate(`/subjects/${university}/${semester}`, {
        state: { activeParent: subject, university, semester },
      });
    } else {
      navigate(`/subjects/${university}/${semester}`, {
        state: { university, semester },
      });
    }
  };

const LAB_SUBJECTS_SEM4 = ["dbms-lab", "os-lab", "web-tech-lab"];
const LAB_SUBJECTS_SEM5 = ["aisc-lab", "se-lab", "dwm-lab", "cn-lab", "wml-lab"];
const folderName = subSubject || subject;
const isLabSubject =
  (subject === "lab-experiments" && LAB_SUBJECTS_SEM4.includes((subSubject || "").toLowerCase())) ||
  (subject === "lab-experiment" && LAB_SUBJECTS_SEM5.includes((subSubject || "").toLowerCase()));
const isLabFolder = ["lab-experiments", "lab-experiment"].includes(subject) && !subSubject;
const isFolderProtected = isProtectedFile(folderName) || isLabSubject || isLabFolder;

  
  const folderGate = isFolderProtected && !isAuthenticated;

useEffect(() => {
    if (isAuthenticated && isFolderProtected && !sessionStorage.getItem("donate_shown")) {
      sessionStorage.setItem("donate_shown", "true");
      donateShown.current = true;
      setShowDonate(true);
    }
  }, [isAuthenticated, isFolderProtected]);

  useEffect(() => {
    // If folder is protected and user not logged in, don't fetch
    if (isFolderProtected && !isAuthenticated) return;

    const fetchFiles = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(apiUrl, { headers });
        const data = await res.json();
        if (data.success) {
          const validFiles = data.notes.filter(
            (file) => !file.name.includes("emptyFolderPlaceholder"),
          );
          if (validFiles.length === 0) {
            setStatus("empty");
          } else {
            setFiles(validFiles);
          }
        } else {
          setStatus("empty");
        }
      } catch {
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [apiUrl, token, isFolderProtected, isAuthenticated]);

  const handleFileClick = (file) => {
    if (!isAuthenticated && isProtectedFile(file.name)) {
      setAuthGate({ fileName: file.name });
      return;
    }
    window.open(file.url, "_blank", "noopener noreferrer");
  };

  const handleDownloadPdf = async (file, index) => {
    if (!isAuthenticated && isProtectedFile(file.name)) {
      setAuthGate({ fileName: file.name });
      return;
    }
    setDownloadingIndex(index);
    try {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      alert("Failed to download. Please try again.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  
if (folderGate) {
  return (
      <>
        <SeoHead pageTitle={pageTitle} pageDesc={pageDesc} canonicalUrl={canonicalUrl} />
        <div className="page-wrapper">
          <main className="page-container">
            <div className="hero-card">
              <button className="subjects-back-btn" onClick={handleBack}>
                <BackIcon /> Go Back
              </button>
              <h1 className="hero-title">{displayTitle} Files</h1>
            </div>
            <div className="files-status-card">
              <div className="files-status-icon files-status-icon--soon">
                <LockIcon />
              </div>
              <h3 className="files-status-title">Login Required</h3>
              <p className="files-status-desc">
                This content is protected. Login or create an account to access{" "}
                <strong>{displayTitle}</strong> files.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "1rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <button
                  className={`notes-btn ${university === "msbte" ? "msbte" : "mu"}`}
                 onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
                >
                  Log In
                </button>
                <button
                  className="notes-btn mu"
                  style={{
                    background: "white",
                    color: "#4f46e5",
                    border: "1.5px solid #4f46e5",
                    boxShadow: "none",
                  }}
                  onClick={() => navigate(`/signup?redirect=${encodeURIComponent(window.location.pathname)}`)}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

if (loading) return (
  <>
    <DotsLoader />
    {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
  </>
);

 if (status === "empty") {
   return (
      <>
      <SeoHead pageTitle={pageTitle} pageDesc={pageDesc} canonicalUrl={canonicalUrl} />
      <div className="page-wrapper">
        <main className="page-container">
          <div className="hero-card">
            <button className="subjects-back-btn" onClick={handleBack}>
              <BackIcon /> Go Back
            </button>
            <h1 className="hero-title">{displayTitle} Files</h1>
          </div>
          <div className="files-status-card">
            <div className="files-status-icon files-status-icon--soon">
              <ClockIcon />
            </div>
            <h3 className="files-status-title">Files Coming Soon</h3>
            <p className="files-status-desc">
              The files for <strong>{displayTitle}</strong> will be uploaded
              soon. Check back later!
 </p>
          </div>
        </main>
      </div>
      </>
    );
  }

  if (status === "error") {
   return (
      <>
      <SeoHead pageTitle={pageTitle} pageDesc={pageDesc} canonicalUrl={canonicalUrl} />
      <div className="page-wrapper">
        <main className="page-container">
          <div className="hero-card">
            <button className="subjects-back-btn" onClick={handleBack}>
              <BackIcon /> Go Back
            </button>
            <h1 className="hero-title">{displayTitle} Files</h1>
          </div>
          <div className="files-status-card">
            <div className="files-status-icon files-status-icon--error">
              <AlertIcon />
            </div>
            <h3 className="files-status-title">Failed to Load</h3>
            <p className="files-status-desc">
              Something went wrong while loading files. Please try again later.
            </p>
            <button
              className={`notes-btn ${university === "msbte" ? "msbte" : "mu"}`}
              style={{ marginTop: "1rem" }}
              onClick={() => window.location.reload()}
            >
             Try Again
            </button>
          </div>
        </main>
      </div>
      </>
    );
  }

return (
    <>
      <SeoHead pageTitle={pageTitle} pageDesc={pageDesc} canonicalUrl={canonicalUrl} />
      <div className="page-wrapper">
        <main className="page-container">
          <div className="hero-card">
            <button className="subjects-back-btn" onClick={handleBack}>
              <BackIcon /> Go Back
            </button>
            <h1 className="hero-title">{displayTitle} Files</h1>
            <p className="hero-subtitle">
              {files.length} file{files.length !== 1 ? "s" : ""} available
            </p>
          </div>

          <div className="notes-grid">
            {files.map((file, index) => {
              const locked = !isAuthenticated && isProtectedFile(file.name);
              return (
                <div
                  key={index}
                  className="notes-card"
                  style={{ position: "relative" }}
                >
                  {locked && (
                    <span
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        background: "#eef2ff",
                        color: "#4f46e5",
                        borderRadius: "6px",
                        padding: "2px 8px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: 4 }}
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Login
                    </span>
                  )}
              <h3
                    style={{
                      margin: "0 0 0",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "#0f172a",
                      paddingRight: locked ? "60px" : 0,
                    }}
                  >
                    {file.name.replace(/_[a-z0-9]{4,}$/i, "").replace(/\.pdf$/i, "")}
                  </h3>
                  <div style={{ marginTop: 14, display: "flex", gap: "8px", alignItems: "center", flexWrap: "nowrap" }}>
                    <button
                      onClick={() => handleFileClick(file)}
                      className={`notes-btn ${university === "msbte" ? "msbte" : "mu"}`}
                      style={{ marginTop: 0, flexShrink: 0 }}
                    >
                      {locked ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Login to Open
                        </span>
                      ) : (
                        "Open →"
                      )}
                    </button>
                    {isFolderProtected && (
                      <button
                        onClick={() => handleDownloadPdf(file, index)}
                        title="Download PDF"
                        disabled={downloadingIndex === index}
                        style={{
                          flexShrink: 0,
                          width: "36px",
                          height: "36px",
                          minWidth: "36px",
                          padding: 0,
                          border: "none",
                          borderRadius: "9px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: downloadingIndex === index ? "not-allowed" : "pointer",
                          opacity: downloadingIndex === index ? 0.7 : 1,
                          background: university === "msbte"
                            ? "linear-gradient(135deg, #ea580c, #f97316)"
                            : "linear-gradient(135deg, #4f46e5, #6366f1)",
                          boxShadow: university === "msbte"
                            ? "0 4px 12px rgba(234, 88, 12, 0.35)"
                            : "0 4px 12px rgba(79, 70, 229, 0.35)",
                        }}
                      >
                        {downloadingIndex === index ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={handleMergeDownload}
              disabled={merging}
              className={`notes-btn full-width ${university === "msbte" ? "msbte" : "mu"}`}
              style={{
                padding: "0.9rem 2rem",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: merging ? 0.7 : 1,
                cursor: merging ? "not-allowed" : "pointer",
              }}
            >
              {merging ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Merging PDFs...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Complete Material
                </>
              )}
            </button>
          </div>
        </main>
      </div>

    
    {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
      {authGate && (
        <AuthGate
          fileName={authGate.fileName}
          onClose={() => setAuthGate(null)}
          onLogin={() => navigate("/login")}
          onSignup={() => navigate("/signup")}
        />
      )}
    </>
  );
};

export default Files;