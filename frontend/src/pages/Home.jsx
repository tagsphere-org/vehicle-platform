import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LogoMark = ({ size = 80 }) => (
  <svg
    className="logo-mark"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
  >
    <defs>
      <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="92" height="92" rx="20" ry="20" fill="url(#logo-bg)" />
    <rect x="18" y="18" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="43" y="18" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="68" y="18" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="18" y="43" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="43" y="43" width="14" height="14" rx="3" fill="rgba(255,255,255,0.5)" />
    <rect x="68" y="43" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="18" y="68" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="43" y="68" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <rect x="68" y="68" width="14" height="14" rx="3" fill="rgba(255,255,255,0.9)" />
    <path d="M50 34 C42 34 36 40 36 47.5 C36 58 50 72 50 72 C50 72 64 58 64 47.5 C64 40 58 34 50 34Z" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="50" cy="47.5" r="5" fill="white" />
  </svg>
)

const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/

function Home() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [searchError, setSearchError] = useState('')

  const scrollToFeatures = (e) => {
    e.preventDefault()
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleVehicleSearch = (e) => {
    e.preventDefault()
    const value = vehicleSearch.trim().toUpperCase()
    if (!value) {
      setSearchError('Please enter a vehicle number')
      return
    }
    if (!VEHICLE_NUMBER_REGEX.test(value)) {
      setSearchError('Invalid format (e.g., MH12AB1234)')
      return
    }
    setSearchError('')
    navigate(`/v/number/${value}`)
  }

  return (
    <div>
      {/* Section A: Hero */}
      <div className="container">
        <div className="hero-section">
          <LogoMark size={80} />
          <h1 className="hero-title">TagSphere</h1>
          <p className="hero-subtitle">
            Smart QR stickers that connect you to your vehicle — safely and instantly
          </p>
          {/* Vehicle Number Lookup */}
          <form onSubmit={handleVehicleSearch} style={{ margin: '1.5rem auto 0', maxWidth: '400px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter vehicle number (e.g., MH12AB1234)"
                value={vehicleSearch}
                onChange={(e) => {
                  setVehicleSearch(e.target.value.toUpperCase())
                  setSearchError('')
                }}
                style={{ flex: 1, textTransform: 'uppercase' }}
              />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0.625rem 1.25rem' }}>
                Find Vehicle
              </button>
            </div>
            {searchError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'left' }}>
                {searchError}
              </p>
            )}
          </form>

          <div className="hero-buttons" style={{ marginTop: '1.5rem' }}>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <a href="#features" onClick={scrollToFeatures} className="btn btn-outline btn-large">
                  Learn More
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section B: Product Info */}
      <section className="product-section">
        <div className="container">
          <h2 className="section-heading">What is TagSphere?</h2>
          <p className="section-subheading">
            A smart, privacy-first solution that lets anyone contact you about your parked vehicle — without ever revealing your phone number.
          </p>
          <div className="info-grid">
            <div className="card info-card">
              <div className="info-card-icon">
                <span>📋</span>
              </div>
              <h3>Smart QR Stickers</h3>
              <p>Durable weatherproof stickers with unique QR codes for each vehicle</p>
            </div>
            <div className="card info-card">
              <div className="info-card-icon">
                <span>📞</span>
              </div>
              <h3>Instant Contact</h3>
              <p>Anyone who scans gets a direct way to reach you without seeing your number</p>
            </div>
            <div className="card info-card">
              <div className="info-card-icon">
                <span>🛡️</span>
              </div>
              <h3>Privacy First</h3>
              <p>Your phone number stays hidden; communication happens through our secure platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section C: Features */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-heading">Why Choose TagSphere?</h2>
          <p className="section-subheading">
            Built with security and simplicity at its core
          </p>
          <div className="features-grid">
            <div className="card feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Phone Privacy</h3>
              <p>Your number stays hidden from scanners — always</p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Instant Alerts</h3>
              <p>Get notified the moment someone scans your sticker</p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon">📱</div>
              <h3>Works Everywhere</h3>
              <p>Any phone with a camera can scan — no app needed</p>
            </div>
            <div className="card feature-card">
              <div className="feature-icon">💰</div>
              <h3>One-Time Purchase</h3>
              <p>No subscription, no recurring fees — pay once</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: How it Works */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-heading">How it Works</h2>
          <p className="section-subheading">
            Get started in three simple steps
          </p>
          <div className="card">
            <div className="steps-container">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Get your sticker</h3>
                  <p>Purchase a TagSphere QR sticker for your vehicle</p>
                </div>
              </div>

              <div className="step-divider" aria-hidden="true"></div>

              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Register &amp; activate</h3>
                  <p>Link the sticker to your vehicle using the activation code</p>
                </div>
              </div>

              <div className="step-divider" aria-hidden="true"></div>

              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Get contacted safely</h3>
                  <p>Anyone can scan &amp; contact you without seeing your number</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section E: About Us */}
      <section className="about-section">
        <div className="container">
          <h2 className="section-heading">About Us</h2>
          <div className="card">
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, textAlign: 'center', maxWidth: '640px', margin: '0 auto 2rem' }}>
              TagSphere was built with a simple mission: make vehicle communication safe and effortless.
              We believe no one should have to share their personal phone number just because their car is parked.
              Our platform bridges the gap between vehicle owners and the people around them — securely, privately, and instantly.
            </p>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-number">1,000+</div>
                <div className="stat-label">Vehicles Protected</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5,000+</div>
                <div className="stat-label">QR Scans</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9★</div>
                <div className="stat-label">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-heading">Ready to protect your vehicle?</h2>
          <p className="section-subheading">
            Join thousands of vehicle owners who trust TagSphere for safe, private communication.
          </p>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-large" style={{ maxWidth: '320px', margin: '0 auto' }}>
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-large" style={{ maxWidth: '320px', margin: '0 auto' }}>
              Register Your Vehicle
            </Link>
          )}
        </div>
      </section>

      {/* Section F: Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">TagSphere</div>
          <p className="footer-tagline">Smart QR stickers for safer vehicle communication</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <span className="footer-separator" aria-hidden="true">·</span>
            <Link to="/terms">Terms of Service</Link>
            <span className="footer-separator" aria-hidden="true">·</span>
            <a href="mailto:contact@tagsphere.co.in">Contact</a>
          </div>
          <p className="footer-copyright">© {new Date().getFullYear()} TagSphere. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
