import React, { createContext, useContext, useState } from 'react'
import Cookies from 'js-cookie'
import type { AuthUser } from '../types'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isAuthenticated: false,
})

function readUserCookie(): AuthUser | null {
  const stored = Cookies.get('user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => Cookies.get('token') ?? null)
  const [user, setUser] = useState<AuthUser | null>(() => readUserCookie())

  const login = (newToken: string, newUser: AuthUser) => {
    Cookies.set('token', newToken, { expires: 1 })
    Cookies.set('user', JSON.stringify(newUser), { expires: 1 })
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    Cookies.remove('token')
    Cookies.remove('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
