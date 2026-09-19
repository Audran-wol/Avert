import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface AvertSession {
  id: string;
  user: { name: string; email: string; initials: string };
  kind: "demo";
  expiresAt: number;
}

interface AuthValue {
  session: AvertSession | null;
  ready: boolean;
  enterDemo: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const SESSION_KEY = "avert.demo-session.v1";
const AuthContext = createContext<AuthValue | null>(null);

function loadSession(): AvertSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AvertSession;
    if (session.kind !== "demo" || session.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AvertSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  const value = useMemo<AuthValue>(() => ({
    session,
    ready,
    enterDemo: () => {
      const next: AvertSession = {
        id: crypto.randomUUID(),
        user: { name: "Demo Operator", email: "demo@avert.africa", initials: "DO" },
        kind: "demo",
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
    },
    signIn: async (_email: string, _password: string) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      throw new Error("Organization sign-in is not connected yet. Use the isolated demo workspace for this build.");
    },
    signOut: () => {
      window.sessionStorage.removeItem(SESSION_KEY);
      setSession(null);
    },
  }), [session, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
