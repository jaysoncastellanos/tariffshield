import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  plan: string;
  subscriptionStatus: string;
  role: string;
}

export async function signup(name: string, email: string, password: string, plan = "monitor"): Promise<{ user: AuthUser; sessionId: string }> {
  const res = await apiRequest("POST", "/api/auth/signup", { name, email, password, plan });
  return res.json();
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; sessionId: string }> {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  return res.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout", {});
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await apiRequest("GET", "/api/auth/me");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
