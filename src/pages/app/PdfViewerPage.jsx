import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const DotsLoader = () => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#1e1e2e" }}>
    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4f46e5", margin: 0 }}>Loading</p>
    <div style={{ display: "flex", gap: 8 }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 10, height: 10, borderRadius: "50%", background: "#4f46e5",
          display: "inline-block",
          animation: "dotBounce 0.6s ease-in-out infinite",
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  </div>
);

export default function PdfViewerPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);
  const touchStartX = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [rendering, setRendering] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  const userEmail = sessionStorage.getItem("pdf_email") || "";
  const pdfTitle = sessionStorage.getItem("pdf_title") || "Document";

  useEffect(() => {
    const base64 = sessionStorage.getItem("pdf_data");
    if (!base64) { navigate(-1); return; }

    const binary = atob(base64);
    const uint8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) uint8[i] = binary.charCodeAt(i);

    pdfjsLib.getDocument({ data: uint8 }).promise.then((pdf) => {
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setReady(true);
    });

    return () => {
      sessionStorage.removeItem("pdf_data");
      sessionStorage.removeItem("pdf_email");
      sessionStorage.removeItem("pdf_title");
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!ready || !pdfDocRef.current || currentPage < 1) return;
    renderPage(currentPage);
  }, [currentPage, scale, ready]);

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

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setCurrentPage((p) => Math.min(totalPages, p + 1));
      else setCurrentPage((p) => Math.max(1, p - 1));
    }
    touchStartX.current = null;
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (!ready) return <DotsLoader />;

  return (
    <div style={{
      width: "100vw", height: "100dvh", background: "#1e1e2e",
      display: "flex", flexDirection: "column", overflow: "hidden",
      userSelect: "none", WebkitUserSelect: "none",
    }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-10px); opacity: 1; }
        }
        * { -webkit-touch-callout: none; }
      `}</style>

      {hidden && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50, background: "rgba(15,23,42,0.97)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 12,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ color: "white", fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>Content hidden while tab is inactive</p>
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", background: "#0f172a", flexWrap: "wrap", gap: 8, flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1 || rendering}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#1e293b", color: "white", cursor: "pointer", fontSize: "0.85rem" }}>
            ‹ Prev
          </button>
          <span style={{ color: "white", fontSize: "0.85rem", fontWeight: 600 }}>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || rendering}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#1e293b", color: "white", cursor: "pointer", fontSize: "0.85rem" }}>
            Next ›
          </button>
        </div>

        <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, flex: 1, textAlign: "center", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 8px" }}>
          {pdfTitle}
        </span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#1e293b", color: "white", cursor: "pointer" }}>−</button>
          <span style={{ color: "white", fontSize: "0.8rem" }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#1e293b", color: "white", cursor: "pointer" }}>+</button>
          <button onClick={handleClose}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontSize: "0.8rem" }}>
            Close
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1, overflowY: "auto", overflowX: "auto",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          padding: "1rem", touchAction: "pan-x pan-y",
          WebkitOverflowScrolling: "touch",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block", maxWidth: "100%",
            userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}