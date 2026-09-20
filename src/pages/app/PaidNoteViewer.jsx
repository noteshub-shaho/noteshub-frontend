import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { getDeviceFingerprint } from "../../utils/fingerprint";
import PurchaseModal from "../../components/modals/PurchaseModal";
import { pdfStore } from "../../utils/pdfStore";

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
  const [deviceToken, setDeviceToken] = useState(null);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [openingFile, setOpeningFile] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint);
    const stored = localStorage.getItem(`device_token_${noteKey}`);
    if (stored) setDeviceToken(stored);
  }, [noteKey]);

  useEffect(() => {
    api.paidNotes.getFileList(noteKey)
      .then((res) => {
        setNoteTitle(res.data.title);
        setNotePrice(res.data.price);
        setFileList(res.data.files || []);
      })
      .catch(() => setFileList([]))
      .finally(() => setPageLoading(false));
  }, [noteKey]);

  useEffect(() => {
    if (!fingerprint || !isAuthenticated) return;
    api.paidNotes.checkEntitlement(noteKey, deviceToken, fingerprint)
      .then((res) => {
        if (res.data?.deviceToken) {
          localStorage.setItem(`device_token_${noteKey}`, res.data.deviceToken);
          setDeviceToken(res.data.deviceToken);
        }
        setEntitlementStatus("authorized");
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "";
        if (msg === "Device not authorized") {
          setEntitlementStatus("device-blocked");
        } else {
          setEntitlementStatus("not-purchased");
        }
      });
  }, [fingerprint, isAuthenticated, noteKey, deviceToken]);


  const handleOpen = async (file) => {
    if (entitlementStatus === "not-purchased") { setPurchaseTarget(file); return; }
    if (entitlementStatus === "device-blocked") return;

    const currentDeviceToken = localStorage.getItem(`device_token_${noteKey}`);
    setOpeningFile(file.name);
    try {
      const res = await api.paidNotes.streamFile(noteKey, file.name, currentDeviceToken, fingerprint);
      const arrayBuffer = res.data;
      const uint8 = new Uint8Array(arrayBuffer);
      pdfStore.set(
        uint8,
        user?.email || "",
        file.name.replace(/_[a-z0-9]{4,}$/i, "").replace(/\.[^.]+$/, "")
      );
      navigate("/pdf-viewer");
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg === "No entitlement") {
        setEntitlementStatus("not-purchased");
        setPurchaseTarget(file);
      } else {
        console.error("streamFile error:", err);
        alert("Failed to open file. Please try again.");
      }
    } finally {
      setOpeningFile(null);
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
                  <h3 style={{ margin: "0 0 0", fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", paddingRight: !isPurchased ? "60px" : 0 }}>
                    {file.name.replace(/_[a-z0-9]{4,}$/i, "").replace(/\.[^.]+$/, "")}
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
                  </div>
                </div>
              );
            })}
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
            const stored = localStorage.getItem(`device_token_${noteKey}`);
            if (stored) setDeviceToken(stored);
            setPurchaseTarget(null);
            setEntitlementStatus("authorized");
          }}
        />
      )}
    </div>
  );
}