/**
 * AuthContext — stores JWT token and user info globally.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../api'

interface AuthUser {
  id: string
  email: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('sh_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => { localStorage.removeItem('sh_token'); setToken(null) })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('sh_token', data.access_token)
    setToken(data.access_token)
    setUser({ id: data.user_id, email, role: data.role })
  }

  const logout = () => {
    localStorage.removeItem('sh_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
