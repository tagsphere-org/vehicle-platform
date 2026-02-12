import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sendOtp, login } = useAuth()

  const [step, setStep] = useState('details') // details, otp
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(location.state?.phone || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState('')

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await sendOtp(phone)

      if (!result.isNewUser) {
        // User already exists, redirect to login
        setError('Account already exists. Please login instead.')
        return
      }

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
      await login(phone, otp, name)
      navigate('/add-vehicle')
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed')
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

        {error && <div className="alert alert-error">{error}</div>}

        {devOtp && (
          <div className="alert alert-info">
            <strong>Dev Mode:</strong> Your OTP is {devOtp}
          </div>
        )}

        {step === 'details' ? (
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
              disabled={loading || !name || phone.length !== 10}
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
              {loading ? 'Creating Account...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              className="btn btn-outline mt-2"
              onClick={() => {
                setStep('details')
                setOtp('')
                setDevOtp('')
              }}
            >
              Back
            </button>
          </form>
        )}

        <p className="text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
