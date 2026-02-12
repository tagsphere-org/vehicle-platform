import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="text-center mb-3">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
          TagSphere
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
          Smart QR stickers for your vehicle
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>How it works</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>1</div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Get your sticker</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Purchase a TagSphere QR sticker for your vehicle
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>2</div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Register & activate</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Link the sticker to your vehicle using the activation code
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>3</div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Get contacted safely</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Anyone can scan & contact you without seeing your number
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.5rem' }}>Why TagSphere?</h3>
        <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
          <li>Your phone number stays private</li>
          <li>Get alerts when someone needs you</li>
          <li>Works even when phone is silent</li>
          <li>One-time purchase, no subscription</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {isAuthenticated ? (
          <Link to="/dashboard" className="btn btn-primary btn-large">
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary btn-large">
              Register Your Vehicle
            </Link>
            <p className="text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Home
