import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { getDeviceFingerprint } from "../../utils/fingerprint";
import PurchaseModal from "../../components/modals/PurchaseModal";
import "./app.css";

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const DotsLoader = () => (
  <div className="dots-loader-wrap">
    <p className="dots-loader-label">Loading</p>
    <div className="dots-loader">
      <span className="dot" /><span className="dot" /><span className="dot" />
    </div>
  </div>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function PaidNoteViewer() {
  const { university, semester, subject, subSubject } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const noteKey = subSubject
    ? `${university}/${semester}/${subject}/${subSubject}`
    : `${university}/${semester}/${subject}`;

  const [pageLoading, setPageLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState("");
  const [notePrice, setNotePrice] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [entitlementStatus, setEntitlementStatus] = useState("unknown");
  const [fingerprint, setFingerprint] = useState(null);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [openingFile, setOpeningFile] = useState(null);
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);
  const [signedCache, setSignedCache] = useState({});
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint);
  }, []);

  useEffect(() => {
    api.paidNotes.getFileList(noteKey)
      .then((res) => {
        setNoteTitle(res.data.title);
        setNotePrice(res.data.price);
        setFileList(res.data.files || []);
      })
      .catch(() => {
        setFileList([]);
      })
      .finally(() => setPageLoading(false));
  }, [noteKey]);

  useEffect(() => {
    if (!fingerprint || !isAuthenticated) return;
    api.paidNotes.checkEntitlement(noteKey, fingerprint)
      .then(() => setEntitlementStatus("authorized"))
      .catch((err) => {
        const msg = err.response?.data?.message || "";
        if (msg === "Device not authorized") {
          setEntitlementStatus("device-blocked");
        } else {
          setEntitlementStatus("not-purchased");
        }
      });
  }, [fingerprint, isAuthenticated, noteKey]);

  const fetchSignedAccess = useCallback(async (fp) => {
    const res = await api.paidNotes.getSignedAccess(noteKey, fp);
    const map = {};
    (res.data.files || []).forEach((f) => { map[f.name] = f; });
    setSignedCache(map);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => fetchSignedAccess(fp), 12 * 60 * 1000);
    return map;
  }, [noteKey]);

  useEffect(() => () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); }, []);

  const getSignedUrl = async (fileName) => {
    if (signedCache[fileName]) return signedCache[fileName].signedUrl;
    const map = await fetchSignedAccess(fingerprint);
    return map[fileName]?.signedUrl || null;
  };

  const handleOpen = async (file) => {
    if (entitlementStatus === "not-purchased") {
      setPurchaseTarget(file);
      return;
    }
    if (entitlementStatus === "device-blocked") return;
    setOpeningFile(file.name);
    try {
      const url = await getSignedUrl(file.name);
      if (url) setViewerFile({ ...file, signedUrl: url });
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg === "No entitlement") {
        setEntitlementStatus("not-purchased");
        setPurchaseTarget(file);
      }
    } finally {
      setOpeningFile(null);
    }
  };

  const handleDownload = async (file) => {
    if (entitlementStatus === "not-purchased") {
      setPurchaseTarget(file);
      return;
    }
    if (entitlementStatus === "device-blocked") return;
    setDownloadingFile(file.name);
    try {
      const url = await getSignedUrl(file.name);
      if (!url) return;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${file.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      alert("Failed to download. Please try again.");
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleBack = () => navigate(`/subjects/${university}/${semester}`);

  if (!isAuthenticated) return null;
  if (pageLoading) return <DotsLoader />;

  return (
    <div className="page-wrapper">
      <main className="page-container">
        <div className="hero-card">
          <button className="subjects-back-btn" onClick={handleBack}><BackIcon /> Go Back</button>
          <h1 className="hero-title">{noteTitle || noteKey.split("/").pop().replace(/-/g, " ").toUpperCase()}</h1>
          <p className="hero-subtitle">
            {entitlementStatus === "authorized"
              ? `${fileList.length} file${fileList.length !== 1 ? "s" : ""} available`
              : `Paid notes · ₹${notePrice}`}
          </p>
        </div>

        {entitlementStatus === "device-blocked" && (
          <div className="files-status-card" style={{ marginBottom: "1.5rem" }}>
            <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", lineHeight: 1.7, margin: 0 }}>
              This note was purchased on a different device. Access is restricted to your registered device only.
              Contact support to change your registered device.
            </p>
          </div>
        )}

        {fileList.length === 0 ? (
          <div className="files-status-card">
            <p style={{ color: "#64748b", fontSize: "0.9rem", textAlign: "center", margin: 0 }}>No files found for this note.</p>
          </div>
        ) : (
          <div className="notes-grid">
            {fileList.map((file, index) => {
              const isPurchased = entitlementStatus === "authorized";
              const isOpening = openingFile === file.name;
              const isDownloading = downloadingFile === file.name;

              return (
                <div key={index} className="notes-card" style={{ position: "relative" }}>
                  {!isPurchased && (
                    <span style={{
                      position: "absolute", top: 14, right: 14,
                      background: "#eef2ff", color: "#4f46e5",
                      borderRadius: "6px", padding: "2px 8px",
                      fontSize: "0.7rem", fontWeight: 700,
                      display: "flex", alignItems: "center", gap: "4px",
                    }}>
                      <LockIcon /> Paid
                    </span>
                  )}
                  <h3 style={{
                    margin: "0 0 0", fontWeight: 700, fontSize: "1.1rem",
                    color: "#0f172a", paddingRight: !isPurchased ? "60px" : 0,
                  }}>
                    {file.name.replace(/\.[^.]+$/, "")}
                  </h3>
                  <div style={{ marginTop: 14, display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => handleOpen(file)}
                      disabled={isOpening || entitlementStatus === "device-blocked"}
                      className="notes-btn mu"
                      style={{ marginTop: 0, flexShrink: 0, opacity: isOpening ? 0.7 : 1, cursor: isOpening ? "not-allowed" : "pointer" }}
                    >
                      {isOpening ? "Opening..." : isPurchased ? "Open →" : (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <LockIcon /> Buy to Open
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading || entitlementStatus === "device-blocked"}
                      title="Download PDF"
                      style={{
                        flexShrink: 0, width: "36px", height: "36px", minWidth: "36px",
                        padding: 0, border: "none", borderRadius: "9px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: isDownloading || entitlementStatus === "device-blocked" ? "not-allowed" : "pointer",
                        opacity: isDownloading ? 0.7 : 1,
                        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                        boxShadow: "0 4px 12px rgba(79, 70, 229, 0.35)",
                      }}
                    >
                      {isDownloading ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <DownloadIcon />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewerFile && (
          <div style={{ marginTop: "1.5rem", position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", gap: "8px", padding: "10px 14px", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
              {fileList.map((f, i) => (
                <button
                  key={i}
                  onClick={() => handleOpen(f)}
                  style={{
                    padding: "6px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 600,
                    border: viewerFile.name === f.name ? "none" : "1.5px solid #e2e8f0",
                    background: viewerFile.name === f.name ? "#4f46e5" : "white",
                    color: viewerFile.name === f.name ? "white" : "#374151",
                    cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {f.name.replace(/\.[^.]+$/, "")}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <p style={{
                  color: "rgba(79,70,229,0.18)", fontSize: "clamp(14px, 2.5vw, 22px)",
                  fontWeight: 800, transform: "rotate(-30deg)", userSelect: "none",
                  whiteSpace: "nowrap", letterSpacing: "1px",
                }}>
                  Purchased by: {user?.email} | NotesHub
                </p>
              </div>
              <iframe
                src={viewerFile.signedUrl}
                title={viewerFile.name}
                style={{ width: "100%", height: "80vh", border: "none", display: "block" }}
              />
            </div>
          </div>
        )}
      </main>

      {purchaseTarget !== null && fingerprint && (
        <PurchaseModal
          noteKey={noteKey}
          noteTitle={noteTitle}
          deviceFingerprint={fingerprint}
          onClose={() => setPurchaseTarget(null)}
          onSuccess={() => {
            setPurchaseTarget(null);
            setEntitlementStatus("authorized");
            setSignedCache({});
          }}
        />
      )}
    </div>
  );
}