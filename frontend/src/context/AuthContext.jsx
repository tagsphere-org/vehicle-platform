import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (phone, otp, name = null) => {
    const payload = { phone, otp }
    if (name) payload.name = name

    const response = await api.post('/auth/verify-otp', payload)
    const { token, user: userData } = response.data

    localStorage.setItem('token', token)
    setUser(userData)

    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const sendOtp = async (phone) => {
    const response = await api.post('/auth/send-otp', { phone })
    return response.data
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      sendOtp,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
