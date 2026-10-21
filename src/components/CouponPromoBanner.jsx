import { buildCouponRequestUrl } from "../utils/whatsapp";

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TicketIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export default function CouponPromoBanner({ userName, userEmail, noteTitle }) {
  const waUrl = buildCouponRequestUrl({
    name: userName,
    email: userEmail,
    noteTitle,
  });

  return (
    <div className="coupon-promo-banner" style={{
      position: "relative", overflow: "hidden",
      borderRadius: "18px", padding: "1.5rem 1.5rem 1.4rem",
      marginBottom: "1.5rem",
      background: "linear-gradient(120deg, #4f46e5 0%, #6d28d9 55%, #7c3aed 100%)",
      boxShadow: "0 12px 32px rgba(79,70,229,0.28)",
      color: "white",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div aria-hidden="true" style={{
        position: "absolute", top: "-60px", right: "-40px",
        width: "180px", height: "180px", borderRadius: "50%",
        background: "rgba(255,255,255,0.08)",
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", bottom: "-70px", right: "90px",
        width: "140px", height: "140px", borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
      }} />

      <div style={{ position: "relative", display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "14px", flexShrink: 0,
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TicketIcon />
        </div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
              Get Up to 50% OFF!
            </h3>
            <span style={{
              background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "999px", padding: "2px 10px",
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.4px",
              textTransform: "uppercase",
            }}>
              T&amp;C Apply
            </span>
          </div>
          <p style={{ margin: "0.4rem 0 1rem", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.9)", maxWidth: "460px" }}>
            Unlock your study notes at a special discounted price. Request your personal
            coupon on WhatsApp, it only takes a moment, and you can still buy at the
            regular price if you prefer.
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#22c55e", color: "white",
              padding: "0.7rem 1.2rem", borderRadius: "10px",
              fontWeight: 800, fontSize: "0.9rem", textDecoration: "none",
              boxShadow: "0 6px 18px rgba(34,197,94,0.35)",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#16a34a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#22c55e"; }}
          >
            <WhatsAppIcon />
            Get Your Coupon on WhatsApp
          </a>
          <p style={{ margin: "0.7rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            Opens WhatsApp with your name, email, and this note pre-filled. You review and
            press Send nothing is sent automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
