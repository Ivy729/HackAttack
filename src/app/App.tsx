import { useState } from "react";
import { AuthPage } from "./components/AuthPage";
import { AdminApp } from "./components/AdminApp";
import { UserApp } from "./components/UserApp";
import type { AuthUser } from "./components/shared";
import { logout } from "../services/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }
  if (user.role === "admin") {
    return <AdminApp user={user} onLogout={handleLogout} />;
  }
  return <UserApp user={user} onLogout={handleLogout} />;
}
