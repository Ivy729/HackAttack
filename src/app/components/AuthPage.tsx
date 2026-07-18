import { useState } from "react";
import { Shield, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, User, ShieldCheck } from "lucide-react";
import type { AuthUser } from "./shared";
import { USERS } from "./shared";

type Role = "user" | "admin";

function RolePicker({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5">
      <button
        type="button"
        onClick={() => onChange("user")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
          role === "user"
            ? "bg-blue-700 text-white"
            : "bg-white text-gray-500 hover:bg-gray-50"
        }`}
      >
        <User size={14} />
        Employee
      </button>
      <button
        type="button"
        onClick={() => onChange("admin")}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors border-l border-gray-200 ${
          role === "admin"
            ? "bg-[#0f1923] text-white"
            : "bg-white text-gray-500 hover:bg-gray-50"
        }`}
      >
        <ShieldCheck size={14} />
        Admin
      </button>
    </div>
  );
}

type AuthView = "login" | "signup" | "forgot";

const DEPTS = ["Engineering","Legal","Finance","Marketing","HR","Sales","Product","Research","Design","Operations"];

function resolveUser(email: string): AuthUser {
  if (email.toLowerCase() === "admin@acme.com") {
    return { name: "Admin Kumar", email: "admin@acme.com", dept: "Security", role: "admin", initials: "AK" };
  }
  const found = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    return {
      name: found.name,
      email: found.email,
      dept: found.dept,
      role: "user",
      initials: found.name.split(" ").map(n => n[0]).join(""),
    };
  }
  const initials = email.split("@")[0].split(".").map((p: string) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "U";
  return { name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, c => c.toUpperCase()), email, dept: "General", role: "user", initials };
}

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "Password"}
        className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
      />
      <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function LoginView({ onLogin, onView }: { onLogin: (u: AuthUser) => void; onView: (v: AuthView) => void }) {
  const [role, setRole]         = useState<Role>("user");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setError("");
    setEmail(r === "admin" ? "admin@acme.com" : "james.wu@acme.com");
    setPassword("demo1234");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (role === "admin" && email !== "admin@acme.com") {
      setError("Admin access requires admin@acme.com credentials.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(resolveUser(email));
    }, 800);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-400 mt-1">Access your SentinelAI workspace</p>
      </div>

      <RolePicker role={role} onChange={handleRoleChange} />

      {/* Role context hint */}
      <div className={`text-xs px-3 py-2 rounded border flex items-start gap-2 ${
        role === "admin"
          ? "bg-[#0f1923]/5 border-[#0f1923]/20 text-gray-700"
          : "bg-blue-50 border-blue-100 text-blue-800"
      }`}>
        {role === "admin"
          ? <ShieldCheck size={12} className="mt-0.5 flex-shrink-0 text-gray-500" />
          : <User size={12} className="mt-0.5 flex-shrink-0 text-blue-500" />}
        <span>
          {role === "admin"
            ? "Admin access — governance dashboard, approvals, and security controls."
            : "Employee access — AI Gateway, tool catalog, and request tracking."}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2.5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Work email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={role === "admin" ? "admin@acme.com" : "you@company.com"}
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="email"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600">Password</label>
            <button type="button" onClick={() => onView("forgot")} className="text-xs text-blue-600 hover:underline">
              Forgot password?
            </button>
          </div>
          <PasswordField value={password} onChange={setPassword} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full disabled:opacity-50 text-white rounded py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
          role === "admin"
            ? "bg-[#0f1923] hover:bg-[#1a2d3d]"
            : "bg-blue-700 hover:bg-blue-600"
        }`}
      >
        {loading
          ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</>
          : `Sign in as ${role === "admin" ? "Admin" : "Employee"}`}
      </button>

      <p className="text-xs text-center text-gray-400">
        Don't have an account?{" "}
        <button type="button" onClick={() => onView("signup")} className="text-blue-600 hover:underline font-medium">
          Create account
        </button>
      </p>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400 mb-1.5 font-medium">Quick demo — click to fill</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button"
            onClick={() => handleRoleChange("user")}
            className={`text-left text-xs px-2.5 py-2 rounded border transition-colors ${
              role === "user"
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}>
            <div className="flex items-center gap-1 mb-0.5 font-medium">
              <User size={10} /> Employee
            </div>
            <p className="font-mono text-xs opacity-70 truncate">james.wu@acme.com</p>
          </button>
          <button type="button"
            onClick={() => handleRoleChange("admin")}
            className={`text-left text-xs px-2.5 py-2 rounded border transition-colors ${
              role === "admin"
                ? "border-gray-400 bg-[#0f1923]/5 text-gray-800"
                : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}>
            <div className="flex items-center gap-1 mb-0.5 font-medium">
              <ShieldCheck size={10} /> Admin
            </div>
            <p className="font-mono text-xs opacity-70 truncate">admin@acme.com</p>
          </button>
        </div>
      </div>
    </form>
  );
}

function SignUpView({ onView }: { onView: (v: AuthView) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", dept: "", role: "", password: "", confirm: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.dept || !form.role || !form.password) { setError("Please fill in all fields."); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 900);
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
          <CheckCircle size={22} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Request submitted</h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Your account request has been sent to your security team. You'll receive an email at <span className="font-medium text-gray-700">{form.email}</span> once approved.
          </p>
        </div>
        <button onClick={() => onView("login")} className="w-full border border-gray-200 rounded py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onView("login")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Create account</h2>
          <p className="text-sm text-gray-400 mt-0.5">Your security team will review and approve</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertCircle size={13} className="flex-shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-2.5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
          <input type="text" value={form.name} onChange={set("name")} placeholder="Jane Smith"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Work email</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 (555) 000-0000"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
          <select value={form.dept} onChange={set("dept")}
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select department…</option>
            {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select value={form.role} onChange={set("role")}
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select role…</option>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
          <PasswordField value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
          <PasswordField value={form.confirm} onChange={v => setForm(f => ({ ...f, confirm: v }))} placeholder="Repeat your password" />
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
        {loading
          ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</>
          : "Create account"}
      </button>
    </form>
  );
}

function ForgotView({ onView }: { onView: (v: AuthView) => void }) {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setError(""); setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 700);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onView("login")} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reset password</h2>
          <p className="text-sm text-gray-400 mt-0.5">We'll send a link to your work email</p>
        </div>
      </div>

      {sent ? (
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
            <CheckCircle size={22} className="text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            If <span className="font-medium text-gray-800">{email}</span> is associated with an account, you'll receive a reset link within a few minutes.
          </p>
          <button type="button" onClick={() => onView("login")} className="w-full border border-gray-200 rounded py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            Back to sign in
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <AlertCircle size={13} className="flex-shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Work email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {loading ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</> : "Send reset link"}
          </button>
        </>
      )}
    </form>
  );
}

export function AuthPage({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [view, setView] = useState<AuthView>("login");

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center p-10 bg-[#0f1923]">
        <div className="flex items-center gap-2.5 self-start">
          <Shield size={18} className="text-blue-400" />
          <span className="text-white text-base font-semibold tracking-tight">SentinelAI</span>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <p className="text-gray-500 text-xs font-medium mb-6">Enterprise governance</p>
          <h1 className="text-white text-3xl font-semibold leading-snug mb-5">
            Enterprise AI access,<br />under control.
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Every request is scanned, policy-checked, and audited before it reaches any model.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center bg-[#f2f3f5] px-6 py-10">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <Shield size={16} className="text-blue-700" />
          <span className="text-gray-900 font-semibold">SentinelAI</span>
        </div>

        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          {view === "login"  && <LoginView  onLogin={onLogin} onView={setView} />}
          {view === "signup" && <SignUpView onView={setView} />}
          {view === "forgot" && <ForgotView onView={setView} />}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Protected by SentinelAI · <a href="#" className="hover:underline">Privacy</a> · <a href="#" className="hover:underline">Terms</a>
        </p>
      </div>
    </div>
  );
}
