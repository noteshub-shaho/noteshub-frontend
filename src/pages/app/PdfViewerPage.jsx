import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const pagesElRef = useRef(null);
  const pdfDocRef = useRef(null);
  const pdfTaskRef = useRef(null);
  const dimsRef = useRef([]);
  const renderedRef = useRef(new Map());
  const offsetsRef = useRef([]);
  const scrollRafRef = useRef(0);
  const scaleRef = useRef(1);
  const fitScaleRef = useRef(0);
  /** Pinch gesture state — refs only, so touch tracking never re-renders React. */
  const pinchRef = useRef(null);
  const pinchRafRef = useRef(0);
  /** Scroll anchor applied in the layout effect right after a zoom commit. */
  const pendingAnchorRef = useRef(null);
  /** Live zoom readout updated directly during a pinch gesture. */
  const zoomLabelRef = useRef(null);

  // Read the in-memory store once (via lazy state init, not during render via ref).
  const [storeInfo] = useState(() => pdfStore.get());
  const userEmail = storeInfo.email;
  const pdfTitle = storeInfo.title;

  // Route the viewer was opened from (set by the launching screen), used as
  // the safe destination when there is no browser-history entry to go back to.
  const returnTo =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/") &&
    location.state.from !== "/pdf-viewer"
      ? location.state.from
      : null;

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

  const safeFallback = useCallback(() => {
    navigate(returnTo || "/dashboard", { replace: true });
  }, [navigate, returnTo]);

  useEffect(() => {
    const data = storeInfo.data;
    if (!data) {
      // Direct link / expired session state: never leave a blank screen.
      safeFallback();
      return undefined;
    }

    let cancelled = false;
    const renderedMap = renderedRef.current;
    (async () => {
      try {
        // Keep a reference to the LOADING TASK (not just the document):
        // pdf.js v6+ PDFDocumentProxy has no destroy(); the task owns the
        // worker/transport and is what must be destroyed on unmount.
        // pdf.js transfers the buffer to its worker (detaching it), so pass
        // a copy — this keeps the stored bytes usable if the effect ever
        // re-runs (StrictMode, remounts) instead of failing with DataCloneError.
        const task = pdfjsLib.getDocument({ data: data.slice() });
        pdfTaskRef.current = task;
        const pdf = await task.promise;
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
          try {
            void task.destroy();
          } catch {
            /* already destroyed */
          }
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
      pdfDocRef.current = null;
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = 0;
      }
      const task = pdfTaskRef.current;
      pdfTaskRef.current = null;
      if (task) {
        try {
          void task.destroy();
        } catch {
          /* already destroyed */
        }
      }
    };
  }, [storeInfo.data, safeFallback]);

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
    const scrollLeft = scrollEl.scrollLeft;
    const next = new Array(children.length);
    for (let i = 0; i < children.length; i++) {
      const r = children[i].getBoundingClientRect();
      next[i] = {
        top: r.top - scrollRect.top + scrollTop,
        height: r.height,
        left: r.left - scrollRect.left + scrollLeft,
        width: r.width,
      };
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

  /* ---------------------------------- */
  /* Zoom anchoring (pinch + buttons)   */
  /* ---------------------------------- */

  /**
   * Capture the content point currently under (clientX, clientY) as a
   * page-relative anchor, so it can be restored after the layout changes
   * to a new scale. Works on the untransformed layout (used for the zoom
   * buttons and by the pinch commit once its transform is removed).
   */
  const captureAnchorAt = useCallback((clientX, clientY) => {
    const offs = offsetsRef.current;
    if (!offs.length) return null;
    const scrollEl = scrollRef.current;
    const docEl = pagesElRef.current;
    if (!scrollEl || !docEl) return null;
    const scrollRect = scrollEl.getBoundingClientRect();
    // Page offsets are stored in scroll-content coordinates; keep the
    // anchor in the same coordinate space to stay exact.
    const x = clientX - scrollRect.left + scrollEl.scrollLeft;
    const y = clientY - scrollRect.top + scrollEl.scrollTop;
    let idx = 0;
    for (let i = 0; i < offs.length; i++) {
      if (offs[i] && offs[i].top <= y) idx = i;
      else break;
    }
    const p = offs[idx];
    if (!p) return null;
    return {
      i: idx,
      ratio: p.height > 0 ? clamp((y - p.top) / p.height, 0, 1) : 0,
      xInPage: x - (p.left || 0),
      oldScale: scaleRef.current,
      clientX,
      clientY,
    };
  }, []);

  /**
   * Scroll so the anchored content point sits back at its captured client
   * position, now that the layout has been re-measured at the new scale.
   */
  const applyAnchor = useCallback((a) => {
    const el = scrollRef.current;
    const docEl = pagesElRef.current;
    if (!el || !docEl) return;
    const pageNode = docEl.children[a.i];
    if (!pageNode) return;
    const ratio = scaleRef.current / (a.oldScale || 1);
    const pr = pageNode.getBoundingClientRect();
    el.scrollTop += pr.top + a.ratio * pr.height - a.clientY;
    el.scrollLeft += pr.left + a.xInPage * ratio - a.clientX;
  }, []);

  /* Layout measurement + scroll anchoring whenever the scale changes. */
  useLayoutEffect(() => {
    if (status !== "ready" || !dims || !availableWidth) return;
    const docEl = pagesElRef.current;
    const anchor = pendingAnchorRef.current;
    pendingAnchorRef.current = null;
    if (anchor && docEl) {
      // A committed pinch: drop the temporary visual transform — the real
      // layout now matches it — and keep the anchor point under the same
      // spot on screen. Runs before paint, so there is no visible jump.
      docEl.style.transform = "";
      docEl.style.transformOrigin = "";
      applyAnchor(anchor);
    }
    measureOffsets();
    updateCurrentPage();
    managePages();
  }, [status, dims, availableWidth, scale, measureOffsets, managePages, updateCurrentPage, applyAnchor]);

  /* ---------------------------------- */
  /* Pinch-to-zoom gesture              */
  /*                                                          */
  /* The gesture runs entirely on refs + direct DOM writes:   */
  /* during tracking, the document gets a composited CSS      */
  /* transform (GPU scale around the finger midpoint) and NO  */
  /* React state changes, no re-layout and no PDF re-renders  */
  /* happen. Exactly one React commit occurs when the gesture */
  /* ends: the final scale is committed and the visible pages */
  /* are re-rendered once at full resolution.                  */
  /* ---------------------------------- */

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || status !== "ready") return undefined;

    const getDistance = (t) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const getMidpoint = (t) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    const setDocTransform = (g, factor, dx, dy) => {
      const docEl = pagesElRef.current;
      if (!docEl) return;
      docEl.style.transformOrigin = `${g.origin.x}px ${g.origin.y}px`;
      docEl.style.transform =
        factor === 1 && dx === 0 && dy === 0
          ? ""
          : `translate(${dx}px, ${dy}px) scale(${factor})`;
    };

    const setZoomLabel = (value) => {
      if (zoomLabelRef.current) {
        zoomLabelRef.current.textContent = `${Math.round(value * 100)}%`;
      }
    };

    const applyGestureFrame = () => {
      pinchRafRef.current = 0;
      const g = pinchRef.current;
      if (!g || !g.move) return;
      const move = g.move;
      g.move = null;
      const visual = clamp(
        g.layoutScale * (move.dist / g.startDist),
        MIN_SCALE,
        MAX_SCALE
      );
      g.visualScale = visual;
      setDocTransform(
        g,
        visual / g.layoutScale,
        g.baseDx + (move.midX - g.mid0.x),
        g.baseDy + (move.midY - g.mid0.y)
      );
      setZoomLabel(visual);
    };

    const scheduleGestureFrame = () => {
      if (pinchRafRef.current) return;
      pinchRafRef.current = requestAnimationFrame(applyGestureFrame);
    };

    /**
     * Re-anchor the gesture when the set of fingers changes (a finger is
     * lifted and another lands, etc.). The visual state (scale + position)
     * is preserved exactly; only the input baseline is reset.
     */
    const rebaselineGesture = (touches) => {
      const g = pinchRef.current;
      if (!g) return;
      const mid = getMidpoint(touches);
      const f = g.visualScale / g.layoutScale;
      const dx = g.baseDx + (mid.x - g.mid0.x);
      const dy = g.baseDy + (mid.y - g.mid0.y);
      // Doc-layout point currently under the new midpoint:
      // pos(O') = docRect0 + O + f*(O' - O) + d = mid
      //   => O' = O + (mid - docRect0 - O - d) / f
      const origin = {
        x: g.origin.x + (mid.x - g.docLeft - g.origin.x - dx) / f,
        y: g.origin.y + (mid.y - g.docTop - g.origin.y - dy) / f,
      };
      // Re-parameterize the same transform around the new origin/baseline
      // so nothing moves at the moment of the switch.
      g.baseDx += (g.origin.x - origin.x) * (1 - f);
      g.baseDy += (g.origin.y - origin.y) * (1 - f);
      g.origin = origin;
      g.mid0 = mid;
      g.startDist = getDistance(touches) || 1;
      g.move = null;
    };

    /** End the gesture: commit the final scale with a single React update. */
    const endGesture = () => {
      const g = pinchRef.current;
      if (!g) return;
      // Apply the last tracked frame first, so the committed state matches
      // where the fingers actually ended up.
      if (g.move) applyGestureFrame();
      pinchRef.current = null;
      if (pinchRafRef.current) {
        cancelAnimationFrame(pinchRafRef.current);
        pinchRafRef.current = 0;
      }
      const docEl = pagesElRef.current;
      const f = g.visualScale / g.layoutScale;

      if (Math.abs(g.visualScale - g.layoutScale) < 1e-3 || !docEl) {
        // No net zoom change — simply drop the temporary transform.
        if (docEl) {
          docEl.style.transform = "";
          docEl.style.transformOrigin = "";
        }
        setZoomLabel(scaleRef.current);
        return;
      }

      // Content point under the current midpoint, expressed back in the
      // pre-gesture (committed layout) coordinates, used as the scroll
      // anchor. pos(X) = docRect0 + O + f*(X - O) + d = lastMid
      //   => X = O + (lastMid - docRect0 - O - d) / f
      const offs = offsetsRef.current;
      const scrollEl = scrollRef.current;
      const scRect = scrollEl?.getBoundingClientRect();
      const dx = g.baseDx + (g.lastMidX - g.mid0.x);
      const dy = g.baseDy + (g.lastMidY - g.mid0.y);
      const X = {
        x: g.origin.x + (g.lastMidX - g.docLeft - g.origin.x - dx) / f,
        y: g.origin.y + (g.lastMidY - g.docTop - g.origin.y - dy) / f,
      };
      // Doc-layout coords -> scroll-content coords (the doc can sit inside
      // scroller padding and carries un-scaled margins of its own).
      const docLeftContent = scRect ? g.docLeft - scRect.left + scrollEl.scrollLeft : 0;
      const docTopContent = scRect ? g.docTop - scRect.top + scrollEl.scrollTop : 0;
      const contentX = X.x + docLeftContent;
      const contentY = X.y + docTopContent;
      let idx = 0;
      for (let i = 0; i < offs.length; i++) {
        if (offs[i] && offs[i].top <= contentY) idx = i;
        else break;
      }
      const p = offs[idx];
      pendingAnchorRef.current = p
        ? {
            i: idx,
            ratio: p.height > 0 ? clamp((contentY - p.top) / p.height, 0, 1) : 0,
            xInPage: contentX - (p.left || 0),
            oldScale: g.layoutScale,
            clientX: g.lastMidX,
            clientY: g.lastMidY,
          }
        : null;
      setZoom(g.visualScale / (fitScaleRef.current || 1));
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 2 || pinchRef.current) return;
      // A previous gesture's zoom commit has not been applied to the layout
      // yet; starting now would capture stale geometry. Wait for the commit.
      if (pendingAnchorRef.current) return;
      const docEl = pagesElRef.current;
      if (!docEl) return;
      // Rect of the UNTRANSFORMED document (the gesture clears any previous
      // transform before starting, so this is exact).
      const docRect = docEl.getBoundingClientRect();
      const mid = getMidpoint(e.touches);
      pinchRef.current = {
        layoutScale: scaleRef.current,
        visualScale: scaleRef.current,
        startDist: getDistance(e.touches) || 1,
        origin: { x: mid.x - docRect.left, y: mid.y - docRect.top },
        docLeft: docRect.left,
        docTop: docRect.top,
        mid0: mid,
        lastMidX: mid.x,
        lastMidY: mid.y,
        baseDx: 0,
        baseDy: 0,
        move: null,
      };
    };

    const onTouchMove = (e) => {
      const g = pinchRef.current;
      if (!g || e.touches.length < 2) return;
      // Keep the browser from panning/zooming the page while two fingers
      // drive our gesture. One-finger scrolling is untouched (this handler
      // ignores single-touch moves).
      if (e.cancelable) e.preventDefault();
      const mid = getMidpoint(e.touches);
      g.lastMidX = mid.x;
      g.lastMidY = mid.y;
      g.move = { dist: getDistance(e.touches), midX: mid.x, midY: mid.y };
      scheduleGestureFrame();
    };

    const onTouchEnd = (e) => {
      const g = pinchRef.current;
      if (!g) return;
      if (e.touches.length >= 2) {
        rebaselineGesture(e.touches);
        return;
      }
      // Fewer than two fingers: finish the gesture and commit the zoom.
      endGesture();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      if (pinchRafRef.current) {
        cancelAnimationFrame(pinchRafRef.current);
        pinchRafRef.current = 0;
      }
      pinchRef.current = null;
    };
  }, [status]);

  /* ---------------------------------- */
  /* Zoom controls                      */
  /* ---------------------------------- */

  const changeZoom = useCallback(
    (factor) => {
      const el = scrollRef.current;
      if (!el) return;
      const next = clamp(scaleRef.current * factor, MIN_SCALE, MAX_SCALE);
      if (Math.abs(next - scaleRef.current) < 1e-3) {
        setJumpOpen(false);
        return;
      }
      // Anchor the viewport center so zoom buttons keep the reading position
      // on both axes.
      const rect = el.getBoundingClientRect();
      pendingAnchorRef.current = captureAnchorAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      setZoom(next / (fitScaleRef.current || 1));
      setJumpOpen(false);
    },
    [captureAnchorAt]
  );

  const resetZoom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pendingAnchorRef.current = captureAnchorAt(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );
    setZoom(1);
    setJumpOpen(false);
  }, [captureAnchorAt]);

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

  /**
   * Close: go back to the previous in-app screen when the browser history
   * has one; otherwise fall back to a safe NotesHub route. This keeps the
   * X button and the browser Back button consistent and never strands the
   * user on a blank screen (e.g. after opening /pdf-viewer directly).
   */
  const handleClose = useCallback(() => {
    const idx = window.history.state?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
    } else {
      safeFallback();
    }
  }, [navigate, safeFallback]);

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

  const docStyle = useMemo(() => {
    if (!dims || !availableWidth || !scale) return null;
    const maxW = dims.reduce((m, d) => Math.max(m, d.w), 0);
    // Scaled spacing keeps the layout purely linear in `scale`, so a
    // committed pinch matches the gesture's uniform transform exactly
    // (fixed-px gaps would shift content near page boundaries at commit).
    const wide = typeof window !== "undefined" && window.innerWidth >= 640;
    return {
      width: maxW * scale,
      gap: `${(wide ? 18 : 14) * scale}px`,
      padding: `${(wide ? 18 : 14) * scale}px 0 ${(wide ? 32 : 28) * scale}px`,
    };
  }, [dims, availableWidth, scale]);

  const docElement = useMemo(() => {
    if (!dims || !availableWidth || !scale || !docStyle) return null;
    return (
      <div
        className="pv-doc"
        ref={pagesElRef}
        style={docStyle}
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
  }, [dims, availableWidth, scale, docStyle]);

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
          <span className="pv-zoom-value" ref={zoomLabelRef}>
            {Math.round(scale * 100)}%
          </span>
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
