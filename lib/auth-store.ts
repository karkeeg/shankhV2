import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        // Set cookie for middleware (Next.js server-side can read this)
        Cookies.set("shankh-token", token, { expires: 7 }); // 7 days
        set({ user, token });
      },

      logout: () => {
        // Remove cookie
        Cookies.remove("shankh-token");
        set({ user: null, token: null });
        // Optional: clear other stores if needed
      },
    }),
    {
      name: "shankh-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
