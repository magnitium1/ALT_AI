import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext({ user: null, loading: true, reload: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, reload }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


