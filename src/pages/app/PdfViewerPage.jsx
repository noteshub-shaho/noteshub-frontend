import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import { pdfStore } from "../../utils/pdfStore";
import "./pdfViewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/** Maximum rendered width (CSS px) of a page on very large screens. */
const MAX_PAGE_WIDTH = 900;
/** Zoom multiplicative step. */
const ZOOM_STEP = 1.25;
const MIN_SCALE = 0.15;
const MAX_SCALE = 6;
/** Pages within this margin of the viewport are rendered. */
const NEAR_PX = 800;
/** Pages beyond this margin have their canvases released. */
const FAR_PX = 3000;
/** Cap devicePixelRatio to limit canvas memory usage. */
const DPR_CAP = 2;

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FitWidthIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const FullscreenIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

const DotsLoader = () => (
  <div className="pv-loader-wrap">
    <p className="pv-loader-label">Loading</p>
    <div className="pv-dots">
      <span className="pv-dot" />
      <span className="pv-dot" />
      <span className="pv-dot" />
    </div>
  </div>
);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function PdfViewerPage() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const pagesElRef = useRef(null);
  const pdfDocRef = useRef(null);
  const dimsRef = useRef([]);
  const renderedRef = useRef(new Map());
  const offsetsRef = useRef([]);
  const anchorRef = useRef(null);
  const scrollRafRef = useRef(0);
  const scaleRef = useRef(1);
  const fitScaleRef = useRef(0);

  // Read the in-memory store once (via lazy state init, not during render via ref).
  const [storeInfo] = useState(() => pdfStore.get());
  const userEmail = storeInfo.email;
  const pdfTitle = storeInfo.title;

  const [dims, setDims] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [hidden, setHidden] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ------------------------------------------------------------------ */
  /* Document loading (secure data comes from pdfStore — unchanged flow) */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const data = storeInfo.data;
    if (!data) {
      navigate(-1);
      return undefined;
    }

    let cancelled = false;
    const renderedMap = renderedRef.current;
    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        // Page metadata (dimensions) for every page keeps the layout stable
        // while canvases are lazily rendered during scrolling.
        const pageDims = await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, idx) => {
            const page = await pdf.getPage(idx + 1);
            const viewport = page.getViewport({ scale: 1 });
            return { w: viewport.width, h: viewport.height };
          })
        );
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfDocRef.current = pdf;
        dimsRef.current = pageDims;
        setDims(pageDims);
        setTotalPages(pdf.numPages);
        setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load PDF:", err);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      pdfStore.clear();
      renderedMap.clear();
      offsetsRef.current = [];
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
    };
  }, [storeInfo.data, navigate]);

  /* ---------------------------------- */
  /* Viewport width measurement         */
  /* ---------------------------------- */

  useEffect(() => {
    if (status !== "ready") return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;

    let frame = 0;
    const measure = () => {
      const cs = getComputedStyle(el);
      const pad =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const w = Math.max(0, Math.round(el.clientWidth - pad));
      setAvailableWidth((prev) => (Math.abs(prev - w) > 1 ? w : prev));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [status]);

  /* ---------------------------------- */
  /* Scale                              */
  /* ---------------------------------- */

  const fitScale = useMemo(() => {
    if (!dims || !availableWidth) return 0;
    const maxW = dims.reduce((m, d) => Math.max(m, d.w), 0);
    if (!maxW) return 0;
    return Math.min(availableWidth, MAX_PAGE_WIDTH) / maxW;
  }, [dims, availableWidth]);

  const scale = fitScale * zoom;

  useLayoutEffect(() => {
    scaleRef.current = scale;
    fitScaleRef.current = fitScale;
  }, [scale, fitScale]);

  /* ---------------------------------- */
  /* Page rendering (lazy + recycling)  */
  /* ---------------------------------- */

  const renderPageAt = useCallback(
    async (i) => {
      const pdf = pdfDocRef.current;
      const dimsArr = dimsRef.current;
      const node = pagesElRef.current?.children[i];
      if (!pdf || !dimsArr[i] || !node) return;

      const run = { scale: scaleRef.current, task: null };
      renderedRef.current.set(i, run);

      try {
        const page = await pdf.getPage(i + 1);
        if (renderedRef.current.get(i) !== run) return;

        const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
        const viewport = page.getViewport({ scale: run.scale * dpr });
        const canvas = node.querySelector("canvas");
        if (!canvas) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const task = page.render({ canvas, viewport });
        run.task = task;
        await task.promise;
        if (renderedRef.current.get(i) !== run) return;

        // Per-user watermark — identical content, placement and style to the
        // original single-page viewer.
        const ctx = canvas.getContext("2d");
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#4f46e5";
        ctx.font = `bold ${Math.max(11, viewport.width / 28)}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(userEmail, viewport.width / 2, Math.max(11, viewport.width / 28) + 10);
        ctx.fillText(userEmail, viewport.width / 2, viewport.height - 18);
        ctx.restore();

        node.classList.remove("pv-error");
        node.classList.add("pv-rendered");
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Failed to render PDF page ${i + 1}:`, err);
          if (renderedRef.current.get(i) === run) node.classList.add("pv-error");
        }
      }
    },
    [userEmail]
  );

  const discardPage = useCallback((i) => {
    const entry = renderedRef.current.get(i);
    if (!entry) return;
    if (entry.task) {
      try {
        entry.task.cancel();
      } catch {
        /* already finished or cancelled */
      }
    }
    renderedRef.current.delete(i);
    const node = pagesElRef.current?.children[i];
    if (!node) return;
    node.classList.remove("pv-rendered");
    const canvas = node.querySelector("canvas");
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }, []);

  const ensureRendered = useCallback(
    (i) => {
      const entry = renderedRef.current.get(i);
      if (entry && Math.abs(entry.scale - scaleRef.current) < 1e-3) return;
      if (entry?.task) {
        try {
          entry.task.cancel();
        } catch {
          /* already finished or cancelled */
        }
      }
      void renderPageAt(i);
    },
    [renderPageAt]
  );

  const managePages = useCallback(() => {
    const el = scrollRef.current;
    const offs = offsetsRef.current;
    if (!el || !offs.length) return;
    const vh = el.clientHeight;
    const top = el.scrollTop;
    for (let i = 0; i < offs.length; i++) {
      const p = offs[i];
      if (!p) continue;
      const nearStart = p.top + p.height > top - NEAR_PX;
      const nearEnd = p.top < top + vh + NEAR_PX;
      if (nearStart && nearEnd) {
        ensureRendered(i);
      } else if (!(p.top + p.height > top - FAR_PX && p.top < top + vh + FAR_PX)) {
        discardPage(i);
      }
    }
  }, [ensureRendered, discardPage]);

  const updateCurrentPage = useCallback(() => {
    const el = scrollRef.current;
    const offs = offsetsRef.current;
    if (!el || !offs.length) return;
    const probe = el.scrollTop + el.clientHeight * 0.25;
    let idx = 0;
    for (let i = 0; i < offs.length; i++) {
      if (offs[i] && offs[i].top <= probe) idx = i;
      else break;
    }
    setCurrentPage((prev) => (prev === idx + 1 ? prev : idx + 1));
  }, []);

  const measureOffsets = useCallback(() => {
    const scrollEl = scrollRef.current;
    const docEl = pagesElRef.current;
    if (!scrollEl || !docEl) return;
    const children = docEl.children;
    const scrollRect = scrollEl.getBoundingClientRect();
    const scrollTop = scrollEl.scrollTop;
    const next = new Array(children.length);
    for (let i = 0; i < children.length; i++) {
      const r = children[i].getBoundingClientRect();
      next[i] = { top: r.top - scrollRect.top + scrollTop, height: r.height };
    }
    offsetsRef.current = next;
  }, []);

  /* ---------------------------------- */
  /* Scroll handling                    */
  /* ---------------------------------- */

  const scheduleScrollWork = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      updateCurrentPage();
      managePages();
    });
  }, [updateCurrentPage, managePages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || status !== "ready") return undefined;
    el.addEventListener("scroll", scheduleScrollWork, { passive: true });
    return () => el.removeEventListener("scroll", scheduleScrollWork);
  }, [status, scheduleScrollWork]);

  /* Layout measurement + scroll anchoring whenever the scale changes. */
  useLayoutEffect(() => {
    if (status !== "ready" || !dims || !availableWidth) return;
    measureOffsets();
    const anchor = anchorRef.current;
    anchorRef.current = null;
    const el = scrollRef.current;
    if (anchor && el) {
      const p = offsetsRef.current[anchor.i];
      if (p) el.scrollTop = p.top + anchor.ratio * p.height;
    }
    updateCurrentPage();
    managePages();
  }, [status, dims, availableWidth, scale, measureOffsets, managePages, updateCurrentPage]);

  const pinchRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || status !== "ready") return undefined;

    const getDistance = (t) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const getMidpoint = (t) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    const onTouchStart = (e) => {
      if (e.touches.length !== 2) return;
      const mid = getMidpoint(e.touches);
      const rect = el.getBoundingClientRect();
      pinchRef.current = {
        startDist: getDistance(e.touches),
        startScale: scaleRef.current,
        startScrollTop: el.scrollTop,
        startScrollLeft: el.scrollLeft,
        midRelY: mid.y - rect.top + el.scrollTop,
        midRelX: mid.x - rect.left + el.scrollLeft,
        midClientY: mid.y,
        midClientX: mid.x,
      };
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();

      const dist = getDistance(e.touches);
      const rawFactor = dist / pinchRef.current.startDist;
      const newScale = clamp(
        pinchRef.current.startScale * rawFactor,
        MIN_SCALE,
        MAX_SCALE
      );
      const fit = fitScaleRef.current || 1;
      const newZoom = newScale / fit;

      const scaleRatio = newScale / pinchRef.current.startScale;
      const newScrollTop =
        pinchRef.current.midRelY * scaleRatio - (pinchRef.current.midClientY - el.getBoundingClientRect().top);
      const newScrollLeft =
        pinchRef.current.midRelX * scaleRatio - (pinchRef.current.midClientX - el.getBoundingClientRect().left);

      anchorRef.current = null;
      setZoom(newZoom);

      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollTop = newScrollTop;
        el.scrollLeft = newScrollLeft;
      });
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [status]);

  const captureAnchor = useCallback(() => {
    const el = scrollRef.current;
    const offs = offsetsRef.current;
    if (!el || !offs.length) return null;
    const top = el.scrollTop;
    let idx = 0;
    for (let i = 0; i < offs.length; i++) {
      if (offs[i] && offs[i].top <= top + 1) idx = i;
      else break;
    }
    const p = offs[idx];
    const ratio =
      p && p.height > 0 ? clamp((top - p.top) / p.height, 0, 1) : 0;
    return { i: idx, ratio };
  }, []);

  const changeZoom = useCallback(
    (factor) => {
      const fit = fitScaleRef.current || 1;
      const next = clamp(scaleRef.current * factor, MIN_SCALE, MAX_SCALE);
      anchorRef.current = captureAnchor();
      setZoom(next / fit);
      setJumpOpen(false);
    },
    [captureAnchor]
  );

  const resetZoom = useCallback(() => {
    anchorRef.current = captureAnchor();
    setZoom(1);
    setJumpOpen(false);
  }, [captureAnchor]);

  const jumpToPage = useCallback(
    (n) => {
      const el = scrollRef.current;
      const offs = offsetsRef.current;
      if (!el || !offs.length || !Number.isFinite(n)) return;
      const p = offs[clamp(Math.round(n), 1, totalPages) - 1];
      if (!p) return;
      el.scrollTo({ top: p.top, behavior: "smooth" });
    },
    [totalPages]
  );

  const handleClose = useCallback(() => navigate(-1), [navigate]);

  /* ---------------------------------- */
  /* Fullscreen (optional)              */
  /* ---------------------------------- */

  const fullscreenSupported =
    typeof document !== "undefined" &&
    !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);

  useEffect(() => {
    if (!fullscreenSupported) return undefined;
    const onChange = () =>
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [fullscreenSupported]);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      void (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
    } else {
      void (el.requestFullscreen?.() || el.webkitRequestFullscreen?.());
    }
  }, []);

  /* ---------------------------------- */
  /* Tab visibility guard (unchanged)   */
  /* ---------------------------------- */

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  /* ---------------------------------- */
  /* Rendered page list                 */
  /* ---------------------------------- */

  const docElement = useMemo(() => {
    if (!dims || !availableWidth || !scale) return null;
    const maxW = dims.reduce((m, d) => Math.max(m, d.w), 0);
    return (
      <div
        className="pv-doc"
        ref={pagesElRef}
        style={{ width: maxW * scale }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {dims.map((d, i) => (
          <div
            key={i}
            className="pv-page"
            data-page={i}
            style={{ width: d.w * scale, height: d.h * scale }}
          >
            <canvas />
            <div className="pv-page-ph" aria-hidden="true" />
          </div>
        ))}
      </div>
    );
  }, [dims, availableWidth, scale]);

  /* ---------------------------------- */
  /* Screens                            */
  /* ---------------------------------- */

  if (status === "error") {
    return (
      <div className="pv-root" onContextMenu={(e) => e.preventDefault()}>
        <div className="pv-center-state">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>Unable to open this PDF.</p>
          <p className="pv-center-sub">The document could not be loaded. Please go back and try again.</p>
          <button className="pv-back-btn" onClick={handleClose}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pv-root"
      ref={rootRef}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {hidden && (
        <div className="pv-hidden-overlay">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p>Content hidden while tab is inactive</p>
        </div>
      )}

      <header className="pv-toolbar">
        <button className="pv-btn" onClick={handleClose} aria-label="Close viewer" title="Close">
          <CloseIcon />
        </button>

        <span className="pv-title" title={pdfTitle}>
          {pdfTitle}
        </span>

        <div className="pv-controls">
          {jumpOpen ? (
            <input
              className="pv-jump-input"
              autoFocus
              inputMode="numeric"
              value={jumpValue}
              aria-label="Go to page"
              onChange={(e) => setJumpValue(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => setJumpOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  jumpToPage(parseInt(jumpValue, 10));
                  setJumpOpen(false);
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  setJumpOpen(false);
                }
              }}
            />
          ) : (
            <button
              className="pv-page-indicator"
              onClick={() => {
                setJumpValue(String(currentPage));
                setJumpOpen(true);
              }}
              title="Jump to page"
            >
              {currentPage} / {totalPages}
            </button>
          )}

          <button
            className="pv-btn"
            onClick={() => changeZoom(1 / ZOOM_STEP)}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
          <span className="pv-zoom-value">{Math.round(scale * 100)}%</span>
          <button
            className="pv-btn"
            onClick={() => changeZoom(ZOOM_STEP)}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <button
            className={`pv-btn${zoom === 1 ? " pv-btn-active" : ""}`}
            onClick={resetZoom}
            aria-label="Fit to width"
            title="Fit to width"
          >
            <FitWidthIcon />
          </button>
          {fullscreenSupported && (
            <button
              className={`pv-btn${isFullscreen ? " pv-btn-active" : ""}`}
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              title="Fullscreen"
            >
              <FullscreenIcon />
            </button>
          )}
        </div>
      </header>

      <div className="pv-scroll" ref={scrollRef} onScroll={scheduleScrollWork}>
        {docElement}
      </div>

      {!docElement && <DotsLoader />}
    </div>
  );
}
