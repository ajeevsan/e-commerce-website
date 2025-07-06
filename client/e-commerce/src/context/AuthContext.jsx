// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!Cookies.get("token"));
  const [userName, setUserName] = useState(Cookies.get("userName") || '');

  useEffect(() => {
    const token = Cookies.get("token");
    const name = Cookies.get("userName");
    if (token) setIsAuthenticated(true);
    if (name) setUserName(name);
  }, []);

  const login = (token, name) => {
    Cookies.set("token", token);
    Cookies.set("userName", name);
    setIsAuthenticated(true);
    setUserName(name);
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("userName");
    setIsAuthenticated(false);
    setUserName('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
