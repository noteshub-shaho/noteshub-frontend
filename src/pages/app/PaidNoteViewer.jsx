import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { getDeviceFingerprint } from "../../utils/fingerprint";
import PurchaseModal from "../../components/modals/PurchaseModal";
import * as pdfjsLib from "pdfjs-dist";
import "./app.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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

function PdfViewer({ pdfData, userEmail, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rendering, setRendering] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const preventSave = (e) => e.preventDefault();
    el.addEventListener("contextmenu", preventSave);
    el.addEventListener("dragstart", preventSave);
    return () => {
      el.removeEventListener("contextmenu", preventSave);
      el.removeEventListener("dragstart", preventSave);
    };
  }, []);

  useEffect(() => {
    if (!pdfData) return;
    const loadPdf = async () => {
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    };
    loadPdf();
  }, [pdfData]);

  useEffect(() => {
    if (!pdfDocRef.current || currentPage < 1) return;
    renderPage(currentPage);
  }, [currentPage, scale, pdfDocRef.current]);

  const renderPage = async (pageNum) => {
    if (!pdfDocRef.current) return;
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
    setRendering(true);
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;
      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;

      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = "#4f46e5";
      ctx.font = `bold ${Math.max(14, viewport.width / 22)}px Inter, sans-serif`;
      ctx.translate(viewport.width / 2, viewport.height / 2);
      ctx.rotate(-Math.PI / 6);
      const wText = `${userEmail} · NotesHub`;
      const wWidth = ctx.measureText(wText).width;
      for (let y = -viewport.height; y < viewport.height; y += 130) {
        for (let x = -viewport.width; x < viewport.width; x += wWidth + 60) {
          ctx.fillText(wText, x, y);
        }
      }
      ctx.restore();
    } catch (e) {
      if (e?.name !== "RenderingCancelledException") console.error(e);
    } finally {
      setRendering(false);
    }
  };

  const handleCanvasTap = (e) => {
    if (e.type === "click") {
      setScale((s) => s < 2.0 ? Math.min(3, s + 0.4) : 1.2);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        active: true,
        startDist: Math.sqrt(dx * dx + dy * dy),
        startScale: scale,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (!pinchRef.current.active || e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ratio = dist / pinchRef.current.startDist;
    const newScale = Math.min(3, Math.max(0.5, pinchRef.current.startScale * ratio));
    setScale(parseFloat(newScale.toFixed(1)));
  };

  const handleTouchEnd = () => {
    pinchRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", marginTop: "1.5rem", background: "#1e1e2e" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {hidden && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30, background: "rgba(15,23,42,0.95)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ color: "white", fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>Content hidden while tab is inactive</p>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#0f172a", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || rendering}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#1e293b", color: "white", cursor: "pointer", fontSize: "0.85rem" }}
          >‹ Prev</button>
          <span style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || rendering}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#1e293b", color: "white", cursor: "pointer", fontSize: "0.85rem" }}
          >Next ›</button>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} style={{ padding: "6px 10px", borderRadius: "8px", border: "none", background: "#1e293b", color: "white", cursor: "pointer" }}>−</button>
          <span style={{ color: "white", fontSize: "0.8rem" }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.2))} style={{ padding: "6px 10px", borderRadius: "8px", border: "none", background: "#1e293b", color: "white", cursor: "pointer" }}>+</button>
          <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontSize: "0.8rem" }}>Close</button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{ overflowY: "auto", overflowX: "auto", maxHeight: "80vh", display: "flex", justifyContent: "center", padding: "1rem", userSelect: "none", touchAction: "pan-x pan-y" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasTap}
          style={{ display: "block", userSelect: "none", cursor: "zoom-in", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
        />
      </div>
      <p style={{ color: "#475569", fontSize: "0.7rem", textAlign: "center", padding: "6px 0 8px", margin: 0, background: "#0f172a" }}>
        Tap to zoom · Pinch to zoom on mobile
      </p>
    </div>
  );
}

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
  const [activePdfData, setActivePdfData] = useState(null);
  const [activeFileName, setActiveFileName] = useState(null);
  const blobUrlRef = useRef(null);

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
      .then(() => setEntitlementStatus("authorized"))
      .catch((err) => {
        const msg = err.response?.data?.message || "";
        if (msg === "Device not authorized") {
          setEntitlementStatus("device-blocked");
        } else {
          setEntitlementStatus("not-purchased");
        }
      });
  }, [fingerprint, isAuthenticated, noteKey, deviceToken]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const handleOpen = async (file) => {
    if (entitlementStatus === "not-purchased") { setPurchaseTarget(file); return; }
    if (entitlementStatus === "device-blocked") return;

    setOpeningFile(file.name);
    try {
      const res = await api.paidNotes.streamFile(noteKey, file.name, deviceToken, fingerprint);
      const arrayBuffer = res.data;
      const uint8 = new Uint8Array(arrayBuffer);
      setActivePdfData(uint8);
      setActiveFileName(file.name);
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg === "No entitlement") {
        setEntitlementStatus("not-purchased");
        setPurchaseTarget(file);
      } else {
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

        {activePdfData && (
          <PdfViewer
            pdfData={activePdfData}
            userEmail={user?.email || ""}
            onClose={() => { setActivePdfData(null); setActiveFileName(null); }}
          />
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