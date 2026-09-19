import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import logo from "../../assets/logo.jpg";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Hide navbar on auth pages
  const authPages = ["/login", "/signup", "/forgot-password", "/verify-otp", "/reset-password", "/verify-email"];
  if (authPages.includes(location.pathname)) return null;

  // Nav items for authenticated users
  const authNavItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Access Notes", path: "/access-notes" },
    { name: "Disclaimer", path: "/disclaimer" },
    { name: "Contact Us", path: "/contact" },
  ];

  // Nav items for public (not logged in) users
  const publicNavItems = [
    { name: "Access Notes", path: "/access-notes" },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  return (
    <header
      style={{
        background: "white",
        padding: "0.6rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <img
        src={logo}
        alt="NotesHub"
        onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
        style={{
          height: "48px",
          width: "148px",
          cursor: "pointer",
          objectFit: "contain",
          mixBlendMode: "multiply",
          display: "block",
        }}
      />

      {isMobile && (
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            fontSize: "26px",
            cursor: "pointer",
            userSelect: "none",
            transition: "transform 0.2s ease",
            transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ☰
        </div>
      )}

      <div
        style={{
          display: "flex",
          position: isMobile ? "absolute" : "static",
          top: isMobile ? "65px" : "auto",
          right: 0,
          width: isMobile ? "100%" : "auto",
          background: isMobile ? "white" : "transparent",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          gap: "1rem",
          padding: isMobile ? "20px 0" : 0,
          boxShadow: isMobile ? "0 4px 10px rgba(0,0,0,0.05)" : "none",
          maxHeight: isMobile ? (menuOpen ? "400px" : "0px") : "none",
          overflow: "hidden",
          opacity: isMobile ? (menuOpen ? 1 : 0) : 1,
          transform: isMobile
            ? menuOpen
              ? "translateY(0)"
              : "translateY(-8px)"
            : "none",
          transition: "max-height 0.22s ease, opacity 0.18s ease, transform 0.18s ease",
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={() => setMenuOpen(false)}
            style={({ isActive }) => ({
              padding: "0.7rem 1.3rem",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "500",
              background: isActive ? "#f8fafc" : "transparent",
              color: isActive ? "#334155" : "#64748b",
              transition: "all 0.18s ease",
              fontSize: "0.9rem",
            })}
          >
            {item.name}
          </NavLink>
        ))}

        {isAuthenticated ? (
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "1px solid #bb1c1c",
              background: "#fee2e2",
              color: "#e20606",
              fontWeight: "500",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Log Out
          </button>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => { setMenuOpen(false); navigate("/login"); }}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#374151",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate("/signup"); }}
              style={{
                padding: "0.5rem 1.1rem",
                borderRadius: "8px",
                border: "none",
               background: "#4f46e5",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;