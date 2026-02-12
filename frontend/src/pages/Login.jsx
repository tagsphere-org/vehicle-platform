import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const { sendOtp, login } = useAuth()

  const [step, setStep] = useState('phone') // phone, otp
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState('') // For development

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await sendOtp(phone)

      if (result.isNewUser) {
        // Redirect to registration
        navigate('/register', { state: { phone } })
        return
      }

      // Show dev OTP in development
      if (result.devOtp) {
        setDevOtp(result.devOtp)
      }

      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(phone, otp)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
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

        {error && <div className="alert alert-error">{error}</div>}

        {devOtp && (
          <div className="alert alert-info">
            <strong>Dev Mode:</strong> Your OTP is {devOtp}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
              />
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
                setDevOtp('')
              }}
            >
              Change Number
            </button>
          </form>
        )}

        <p className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
