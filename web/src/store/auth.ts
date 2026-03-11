import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AuthUser = {
  id: string
  username: string
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => {
        try {
          localStorage.removeItem('good-idea-files')
        } catch {
          // ignore localStorage access errors
        }
        set({ token: null, user: null })
      },
    }),
    {
      name: 'good-idea-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
)

