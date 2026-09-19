import { createContext, useContext, useState } from "react";

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
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = (userData, token) => {
    const updatedUser = {
      ...userData,
      termsAccepted: userData?.termsAccepted ?? false,
    };
    localStorage.setItem("token", token);
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