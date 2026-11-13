"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const SessionContext = createContext(null);

// `user` comes from the server (root layout) and updates after
// log in / log out because those actions refresh the router.
export function SessionProvider({ user, children }) {
  const [isSignOpen, setIsSignOpen] = useState(false);

  const openSign = useCallback(() => setIsSignOpen(true), []);
  const closeSign = useCallback(() => setIsSignOpen(false), []);
  const toggleSign = useCallback(() => setIsSignOpen((open) => !open), []);

  const value = useMemo(
    () => ({ user, isSignOpen, openSign, closeSign, toggleSign }),
    [user, isSignOpen, openSign, closeSign, toggleSign]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export default function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}
