import { useState, useCallback } from "react";

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem("inv_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("inv_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("inv_token", newToken);
    localStorage.setItem("inv_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("inv_token");
    localStorage.removeItem("inv_user");
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, login, logout };
}
