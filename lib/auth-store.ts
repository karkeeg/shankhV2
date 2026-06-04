import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { clearAllDrafts } from "./activityDraft";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setAuth: (user, token) => {
        // Set cookie for middleware (Next.js server-side can read this)
        Cookies.set("shankh-token", token, { expires: 7, path: "/" });
        set({ user, token, error: null });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Login failed");
          }

          get().setAuth(data.data.user, data.data.token);
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (name, email, password, role) => {
        set({ isLoading: true, error: null });
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
          const res = await fetch(`${backendUrl}/api/v1/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Signup failed");
          }

          get().setAuth(data.data.user, data.data.token);
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
          await fetch(`${backendUrl}/api/v1/auth/logout`, { method: "POST" });
        } catch (err) {
          console.error("Logout error:", err);
        } finally {
          Cookies.remove("shankh-token", { path: "/" });
          clearAllDrafts();
          set({ user: null, token: null, error: null });
        }
      },
    }),
    {
      name: "shankh-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
