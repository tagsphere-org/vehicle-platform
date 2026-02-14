import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { sendOtp, verifyOtp, authMode } = useAuth()

  const [step, setStep] = useState('phone') // phone, otp
  const [phone, setPhone] = useState('')
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
      const { isNewUser } = await verifyOtp(confirmationResultRef.current, otp)

      if (isNewUser) {
        navigate('/register', { state: { phone, verified: true } })
      } else {
        navigate('/dashboard')
      }
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
          <h1 className="card-title">Login</h1>
          <p className="card-subtitle">Enter your phone number to continue</p>
        </div>

        {authMode === 'mock' && (
          <div className="alert" style={{ background: 'var(--bg-secondary, #fef3c7)', border: '1px solid #f59e0b', color: '#92400e', marginBottom: '1rem' }}>
            Dev Mode — Any 6-digit OTP will work
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
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
              disabled={loading || phone.length !== 10}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
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
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              className="btn btn-outline mt-2"
              onClick={() => {
                setStep('phone')
                setOtp('')
                setError('')
              }}
            >
              Change Number
            </button>
          </form>
        )}

        {authMode === 'firebase' && <div id="recaptcha-container"></div>}

        <p className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
