import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { clearAllDrafts } from "./activityDraft";
import { clearAllScratchpads } from "./scratchpad";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  planType?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  isOnboarded?: boolean;
  username?: string | null;
  profession?: string | null;
  level?: string | null;
  goal?: string | null;
  firstTopic?: string | null;
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
  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onboard: (data: { name: string; username: string; phone?: string; profession: string; level: string; goal: string; firstTopic: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setAuth: (user, token) => {
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        Cookies.set("shankh-token", token, {
          expires: 7,
          path: "/",
          secure: isSecure,
          sameSite: "strict",
        });
        Cookies.set("shankh-onboarded", String(user.isOnboarded ?? false), {
          expires: 7,
          path: "/",
          secure: isSecure,
          sameSite: "strict",
        });
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
          Cookies.remove("shankh-onboarded", { path: "/" });
          clearAllDrafts();
          clearAllScratchpads();
          set({ user: null, token: null, error: null });
        }
      },

      updateProfile: async (data) => {
        const { token } = get();
        if (!token) throw new Error("Not authenticated");

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${backendUrl}/api/v1/auth/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to update profile");

        set((state) => ({ user: state.user ? { ...state.user, ...json.data.user } : json.data.user }));
      },

      changePassword: async (oldPassword, newPassword) => {
        const { token } = get();
        if (!token) throw new Error("Not authenticated");

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${backendUrl}/api/v1/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to change password");
      },

      onboard: async (data) => {
        const { token } = get();
        if (!token) throw new Error("Not authenticated");

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${backendUrl}/api/v1/auth/onboard`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to onboard");

        get().setAuth(json.data.user, token);
      },
    }),
    {
      name: "shankh-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
