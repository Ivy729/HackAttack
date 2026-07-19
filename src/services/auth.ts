import { supabase } from "../lib/supabase";
import type { AuthUser } from "../app/components/shared";
import { USERS } from "../app/components/shared";

/** Demo accounts never touch Supabase — local mock only. */
export const DEMO_PASSWORD = "demo1234";

const DEMO_ADMIN: AuthUser = {
  name: "Admin Kumar",
  email: "admin@acme.com",
  dept: "Security",
  role: "admin",
  initials: "AK",
};

/** Only the advertised demo logins — not every mock USERS row. */
const DEMO_EMAILS = new Set([
  DEMO_ADMIN.email,
  "james.wu@acme.com",
]);

export function isDemoEmail(email: string): boolean {
  return DEMO_EMAILS.has(email.toLowerCase().trim());
}

/** Resolve a known demo account into an AuthUser (no network). */
export function resolveDemoUser(email: string): AuthUser | null {
  const e = email.toLowerCase().trim();

  if (e === DEMO_ADMIN.email) {
    return DEMO_ADMIN;
  }

  const found = USERS.find((u) => u.email.toLowerCase() === e);
  if (!found || !isDemoEmail(e)) return null;

  return {
    name: found.name,
    email: found.email,
    dept: found.dept,
    role: "user",
    initials: found.name
      .split(" ")
      .map((n) => n[0])
      .join(""),
  };
}

function initialsFromName(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function profileToAuthUser(profile: {
  full_name: string;
  email: string;
  department: string;
  role: string;
}): AuthUser {
  const role = profile.role.toLowerCase() === "admin" ? "admin" : "user";
  return {
    name: profile.full_name,
    email: profile.email,
    dept: profile.department,
    role,
    initials: initialsFromName(profile.full_name),
  };
}

export type AuthResult =
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: string };

/**
 * Dual-path login:
 * 1. Demo accounts → resolveDemoUser() (mock, no Supabase)
 * 2. Everyone else → Supabase Auth + profiles table
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  const trimmed = email.trim();

  // ── Path A: Demo accounts (never hit Supabase) ──────────────────────────
  const demoUser = resolveDemoUser(trimmed);
  if (demoUser) {
    if (password !== DEMO_PASSWORD) {
      return { error: "Invalid email or password." };
    }
    return { user: demoUser };
  }

  // ── Path B: Real accounts via Supabase Auth ─────────────────────────────
  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Login failed. Please try again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, department, role, status")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found. Contact your administrator." };
  }

  if (profile.status === "rejected" || profile.status === "disabled") {
    await supabase.auth.signOut();
    return { error: "This account is not active. Contact your administrator." };
  }

  return { user: profileToAuthUser(profile) };
}

export type RegisterInput = {
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  role: "user" | "admin";
  password: string;
};

/**
 * Real registration only — never creates demo accounts.
 * Profile row is created by a DB trigger from user metadata
 * (works even when email confirmation is enabled).
 */
export async function registerUser(input: RegisterInput): Promise<{ error?: string }> {
  const email = input.email.trim().toLowerCase();

  if (isDemoEmail(email)) {
    return { error: "This email is reserved for demo accounts. Use a different email." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone_number: input.phoneNumber.trim() || null,
        department: input.department,
        role: input.role,
      },
    },
  });

  if (error) {
    const msg = error.message?.trim();
    // Supabase often returns "{}" / opaque 500 when the profiles trigger is broken
    if (
      !msg ||
      msg === "{}" ||
      error.status === 500 ||
      msg.toLowerCase().includes("database error")
    ) {
      return {
        error:
          "Account could not be created (database setup issue). In Supabase SQL Editor, run supabase/profiles.sql, then try again.",
      };
    }
    return { error: msg };
  }

  if (!data.user) {
    return { error: "Could not create account. Please try again." };
  }

  // Ensure profile exists and is active (no approval step)
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existing) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: input.fullName.trim(),
      email,
      phone_number: input.phoneNumber.trim() || null,
      department: input.department,
      role: input.role,
      status: "active",
    });

    if (profileError && !profileError.message.toLowerCase().includes("duplicate")) {
      console.warn("Profile insert:", profileError.message);
    }
  } else {
    await supabase.from("profiles").update({ status: "active" }).eq("id", data.user.id);
  }

  return {};
}

export async function resetPassword(email: string): Promise<{ error?: string }> {
  const trimmed = email.trim();

  if (isDemoEmail(trimmed)) {
    return {};
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: `${window.location.origin}/`,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
