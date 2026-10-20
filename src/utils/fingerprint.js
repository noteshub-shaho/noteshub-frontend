// Device identity for paid notes.
//
// The original fingerprint hashed navigator.userAgent, navigator.platform,
// screen dimensions and a canvas snapshot. Those values change when a
// browser switches between mobile and desktop website layouts (for example
// Chrome's "Desktop site" toggle), so the same physical phone produced a
// different fingerprint and lost access to notes it had already purchased.
//
// The v2 fingerprint is derived from a random 256-bit device id persisted
// in localStorage. It is independent of user agent, viewport, screen size
// and rendering mode, so layout or responsive-mode switches never change
// the device identity. Like any browser-storage-based approach it is
// scoped to a single browser profile and can be cleared by the user; the
// legacy fingerprint is still computed and sent alongside it so purchases
// registered with the old algorithm keep validating.

const DEVICE_ID_STORAGE_KEY = "noteshub_device_id_v2";

function getOrCreateDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    return id;
  } catch {
    // Storage unavailable (e.g. private mode with blocked storage): fall
    // back to the most stable signals available. This degrades to roughly
    // the old behaviour instead of failing outright.
    return `na-${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
  }
}

async function sha256Hex(value) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Stable, layout-independent device fingerprint (v2).
export async function getDeviceFingerprint() {
  try {
    return `v2-${await sha256Hex(`noteshub-device-v2|||${getOrCreateDeviceId()}`)}`;
  } catch {
    return `v2-${btoa(getOrCreateDeviceId()).slice(0, 64)}`;
  }
}

// Legacy (pre-v2) fingerprint. Kept only so purchases registered with the
// old algorithm still validate; new purchases store the v2 fingerprint.
export async function getLegacyDeviceFingerprint() {
  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.platform,
    ];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("NotesHub🔒", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("NotesHub🔒", 4, 17);
    components.push(canvas.toDataURL());

    return await sha256Hex(components.join("|||"));
  } catch {
    const fallback = navigator.userAgent + screen.width + screen.height + navigator.language;
    return btoa(fallback).slice(0, 64);
  }
}

// Both fingerprints in one call, sent as x-device-fingerprint (v2) and
// x-device-fingerprint-legacy headers.
export async function getDeviceFingerprints() {
  const [fingerprint, legacyFingerprint] = await Promise.all([
    getDeviceFingerprint(),
    getLegacyDeviceFingerprint(),
  ]);
  return { fingerprint, legacyFingerprint };
}
