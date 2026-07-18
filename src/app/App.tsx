import { useState } from "react";
import { AuthPage } from "./components/AuthPage";
import { AdminApp } from "./components/AdminApp";
import { UserApp } from "./components/UserApp";
import type { AuthUser } from "./components/shared";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }
  if (user.role === "admin") {
    return <AdminApp user={user} onLogout={() => setUser(null)} />;
  }
  return <UserApp user={user} onLogout={() => setUser(null)} />;
}
