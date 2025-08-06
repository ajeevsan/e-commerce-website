// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!Cookies.get("token")
  );
  const [userName, setUserName] = useState(Cookies.get("userName") || "");
  const [userId, setUserId] = useState(Cookies.get("userId") || "");

  useEffect(() => {
    const token = Cookies.get("token");
    const name = Cookies.get("userName");
    const userId = Cookies.get("userId");
    if (token) setIsAuthenticated(true);
    if (name) setUserName(name);
    if (userId) setUserId(userId);
  }, []);

  const login = (token, name, userId) => {
    Cookies.set("token", token);
    Cookies.set("userName", name);
    Cookies.set("userId", userId);
    setIsAuthenticated(true);
    setUserName(name);
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("userName");
    Cookies.remove("userId");
    setIsAuthenticated(false);
    setUserName("");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, userName, userId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
