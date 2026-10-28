import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setToken, getToken } from '@/services/api'

const AuthContext = createContext(null)

/**
 * Auth state: token persisted in localStorage, current user fetched on load.
 * `status`: 'loading' | 'authed' | 'guest'.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  // On mount, if a token exists, validate it by fetching the profile.
  useEffect(() => {
    let active = true
    if (!getToken()) {
      setStatus('guest')
      return
    }
    api
      .me()
      .then((u) => active && (setUser(u), setStatus('authed')))
      .catch(() => {
        if (!active) return
        setToken(null)
        setStatus('guest')
      })
    return () => {
      active = false
    }
  }, [])

  const applyToken = useCallback((tokenResponse) => {
    setToken(tokenResponse.access_token)
    setUser(tokenResponse.user)
    setStatus('authed')
  }, [])

  const login = useCallback(
    async (email, password) => {
      applyToken(await api.login({ email, password }))
    },
    [applyToken],
  )

  const register = useCallback(
    async (payload) => {
      applyToken(await api.register(payload))
    },
    [applyToken],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setStatus('guest')
  }, [])

  const value = useMemo(
    () => ({ user, status, isAuthed: status === 'authed', login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
