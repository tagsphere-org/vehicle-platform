import { useState, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sendOtp, verifyOtp, authMode } = useAuth()

  // If redirected from Login after Firebase verification found a new user
  const alreadyVerified = location.state?.verified || false
  const initialPhone = location.state?.phone || ''

  const [step, setStep] = useState(alreadyVerified ? 'name-only' : 'details') // details, otp, name-only
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(initialPhone)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const confirmationResultRef = useRef(null)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const confirmationResult = await sendOtp(phone)
      confirmationResultRef.current = confirmationResult
      setStep('otp')
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number.')
      } else {
        setError(err.message || 'Failed to send OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOtp(confirmationResultRef.current, otp, name)
      navigate('/add-vehicle')
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please try again.')
      } else {
        setError(err.response?.data?.error || err.message || 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // User was already verified by Firebase in Login flow, just needs to provide name
  const handleNameSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Re-send OTP to get a fresh confirmationResult for this registration
      const confirmationResult = await sendOtp(phone)
      confirmationResultRef.current = confirmationResult
      setStep('otp-after-name')
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAfterName = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyOtp(confirmationResultRef.current, otp, name)
      navigate('/add-vehicle')
    } catch (err) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please try again.')
      } else {
        setError(err.response?.data?.error || err.message || 'Verification failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Create Account</h1>
          <p className="card-subtitle">Register to link your vehicle</p>
        </div>

        {authMode === 'mock' && (
          <div className="alert" style={{ background: 'var(--bg-secondary, #fef3c7)', border: '1px solid #f59e0b', color: '#92400e', marginBottom: '1rem' }}>
            Dev Mode — Any 6-digit OTP will work
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {step === 'details' && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  padding: '0.75rem 0.75rem',
                  background: 'var(--bg-secondary, #f3f4f6)',
                  border: '1px solid var(--border, #d1d5db)',
                  borderRadius: 'var(--radius, 0.5rem)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  userSelect: 'none'
                }}>+91</span>
                <input
                  type="tel"
                  className="form-input"
                  style={{ flex: 1, marginBottom: 0 }}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name || phone.length !== 10}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
                required
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                OTP sent to +91 {phone}
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Creating Account...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              className="btn btn-outline mt-2"
              onClick={() => {
                setStep('details')
                setOtp('')
                setError('')
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === 'name-only' && (
          <form onSubmit={handleNameSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Phone: +91 {phone} (verified)
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !name}
            >
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'otp-after-name' && (
          <form onSubmit={handleVerifyAfterName}>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input
                type="text"
                className="form-input otp-input"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoFocus
                required
              />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                OTP sent to +91 {phone}
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Creating Account...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              className="btn btn-outline mt-2"
              onClick={() => {
                setStep('name-only')
                setOtp('')
                setError('')
              }}
            >
              Back
            </button>
          </form>
        )}

        {authMode === 'firebase' && <div id="recaptcha-container"></div>}

        <p className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
