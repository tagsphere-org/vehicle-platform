import { createContext, useContext, useState, useEffect, useRef } from 'react'
import features from '../config/features'
import { auth as firebaseAuth } from '../config/firebase'
import api from '../services/api'

const AuthContext = createContext(null)

const authMode = features.firebase ? 'firebase' : 'mock'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const recaptchaVerifierRef = useRef(null)

  useEffect(() => {
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

  // --- Firebase mode ---
  const setupRecaptcha = (containerId) => {
    if (recaptchaVerifierRef.current) {
      try { recaptchaVerifierRef.current.clear() } catch (_) {}
      recaptchaVerifierRef.current = null
    }

    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = ''
    }

    // Dynamic import already happened at module level via config/firebase.js
    // RecaptchaVerifier and signInWithPhoneNumber loaded on demand below
    return import('firebase/auth').then(({ RecaptchaVerifier }) => {
      recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, containerId, {
        size: 'invisible',
        callback: () => {},
      })
      return recaptchaVerifierRef.current
    })
  }

  const sendOtpFirebase = async (phone, containerId = 'recaptcha-container') => {
    const recaptchaVerifier = await setupRecaptcha(containerId)
    const { signInWithPhoneNumber } = await import('firebase/auth')
    const fullPhone = '+91' + phone
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, fullPhone, recaptchaVerifier)
    return confirmationResult
  }

  const verifyOtpFirebase = async (confirmationResult, otp, name = null) => {
    const result = await confirmationResult.confirm(otp)
    const idToken = await result.user.getIdToken()

    const payload = { idToken }
    if (name) payload.name = name

    const response = await api.post('/auth/firebase-verify', payload)
    const { token, user: userData, isNewUser } = response.data

    if (token) {
      localStorage.setItem('token', token)
      setUser(userData)
    }

    return { userData, isNewUser }
  }

  // --- Mock mode ---
  const sendOtpMock = async (phone) => {
    await api.post('/auth/mock-send-otp', { phone })
    // Return an object with _mockPhone so verifyOtp can read it back
    return { _mockPhone: phone }
  }

  const verifyOtpMock = async (confirmationResult, otp, name = null) => {
    const phone = confirmationResult._mockPhone
    const payload = { phone, otp }
    if (name) payload.name = name

    const response = await api.post('/auth/mock-verify', payload)
    const { token, user: userData, isNewUser } = response.data

    if (token) {
      localStorage.setItem('token', token)
      setUser(userData)
    }

    return { userData, isNewUser }
  }

  // --- Unified interface ---
  const sendOtp = features.firebase ? sendOtpFirebase : sendOtpMock
  const verifyOtp = features.firebase ? verifyOtpFirebase : verifyOtpMock

  const logout = async () => {
    localStorage.removeItem('token')
    setUser(null)
    if (features.firebase && firebaseAuth) {
      try {
        const { signOut } = await import('firebase/auth')
        await signOut(firebaseAuth)
      } catch (error) {
        // Firebase signout failure is non-critical
      }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authMode,
      sendOtp,
      verifyOtp,
      logout,
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
