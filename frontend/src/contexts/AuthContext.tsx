/**
 * AuthContext — stores JWT token, role, client_id, and user profile globally.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import api from '../api'

export interface AuthUser {
  id: string
  email: string
  role: 'advisor' | 'client'
  client_id?: string | null
  created_at?: string
  last_login?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (email: string, password: string) => Promise<{ role: string; client_id?: string | null }>
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
        .then(({ data }) => {
          setUser({
            id: data.id,
            email: data.email,
            role: data.role as 'advisor' | 'client',
            client_id: data.client_id,
            created_at: data.created_at,
            last_login: data.last_login,
          })
        })
        .catch(() => {
          localStorage.removeItem('sh_token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('sh_token', data.access_token)
    setToken(data.access_token)
    const authUser: AuthUser = {
      id: data.user_id,
      email: data.email || email,
      role: data.role,
      client_id: data.client_id,
    }
    setUser(authUser)
    return { role: data.role, client_id: data.client_id }
  }

  const logout = () => {
    api.post('/api/auth/logout').catch(() => {})
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
