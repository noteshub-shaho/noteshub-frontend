import { createContext, useContext, useState, useEffect, useRef } from "react";
import { SESSION_EXPIRED_EVENT } from "../services/api";
import client from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      return null;
    }
  });

  const hasPinged = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasPinged.current) {
      hasPinged.current = true;
      client.post("/api/auth/ping").catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      // Redirect to login, preserving the current path so the user is
      // sent back after re-authenticating.
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?redirect=${redirect}`;
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  // token       – short-lived access token (10 d)
  // refreshToken – long-lived refresh token (30 d); may be absent for
  //                legacy sessions that pre-date refresh support.
  const login = (userData, token, refreshToken) => {
    const updatedUser = {
      ...userData,
      termsAccepted: userData?.termsAccepted ?? false,
    };
    localStorage.setItem("token", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      // Never keep a previous account's refresh token around.
      localStorage.removeItem("refreshToken");
    }
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setIsAuthenticated(true);
    setUser(updatedUser);
  };

  const updateUser = (updater) => {
    setUser((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};