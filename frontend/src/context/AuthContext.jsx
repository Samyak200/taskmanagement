import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'GET', skipAuthRetry: true })
    } catch (_) {
      // ignore
    }
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const applySession = useCallback(({ accessToken: token, user: u }) => {
    if (token) localStorage.setItem('accessToken', token)
    if (u) setUser(u)
  }, [])

  const reloadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      setLoading(false)
      return false
    }
    const res = await api('/api/auth/get-me', { method: 'GET' })
    if (!res.ok) {
      await logout()
      setLoading(false)
      return false
    }
    const data = await res.json()
    setUser(data.user)
    setLoading(false)
    return true
  }, [logout])

  useEffect(() => {
    reloadUser()
  }, [reloadUser])

  const login = useCallback(async (body) => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuthRetry: true,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || 'Login failed')
    }
    applySession(data)
    return data.user
  }, [applySession])

  const register = useCallback(async (body) => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuthRetry: true,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.message || 'Register failed')
    }
    applySession(data)
    return data.user
  }, [applySession])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      reloadUser,
    }),
    [user, loading, login, register, logout, reloadUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
