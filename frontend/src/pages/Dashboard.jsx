import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import usePushNotifications from '../hooks/usePushNotifications'
import api from '../services/api'

function Dashboard() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState(null)

  // Emergency contact state
  const [emergencyContact, setEmergencyContact] = useState(null)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyLoading, setEmergencyLoading] = useState(false)
  const [emergencyError, setEmergencyError] = useState('')

  // Initialize push notifications
  usePushNotifications()

  useEffect(() => {
    fetchVehicles()
    fetchSubscription()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.hasEmergencyContact) {
        setEmergencyContact({
          name: response.data.emergencyContactName
        })
      }
    } catch {
      // Profile fetch failed silently
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/subscription/my-plan')
      setSubscription(response.data)
    } catch {
      // Subscription fetch failed silently
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicle/my-vehicles')
      setVehicles(response.data.vehicles)
    } catch (err) {
      setError('Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (vehicleId) => {
    if (!confirm('Are you sure you want to deactivate this vehicle?')) {
      return
    }

    try {
      await api.delete(`/vehicle/${vehicleId}`)
      setVehicles(vehicles.filter(v => v.id !== vehicleId))
    } catch (err) {
      alert('Failed to deactivate vehicle')
    }
  }

  const handleSaveEmergencyContact = async (e) => {
    e.preventDefault()
    setEmergencyError('')
    setEmergencyLoading(true)

    try {
      const response = await api.put('/auth/emergency-contact', {
        name: emergencyName,
        phone: emergencyPhone
      })
      setEmergencyContact({
        name: response.data.emergencyContact.name,
        maskedPhone: response.data.emergencyContact.maskedPhone
      })
      setShowEmergencyModal(false)
      setEmergencyName('')
      setEmergencyPhone('')
    } catch (err) {
      setEmergencyError(err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Failed to save')
    } finally {
      setEmergencyLoading(false)
    }
  }

  const handleRemoveEmergencyContact = async () => {
    if (!confirm('Remove emergency contact?')) return
    try {
      await api.delete('/auth/emergency-contact')
      setEmergencyContact(null)
    } catch {
      alert('Failed to remove emergency contact')
    }
  }

  const vehicleIcons = {
    car: '🚗',
    bike: '🏍️',
    truck: '🚛',
    auto: '🛺',
    other: '🚙'
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="dashboard-welcome">
        <h1>Hello, {user?.name}</h1>
        <p>Manage your registered vehicles</p>
      </div>

      {/* Subscription Status Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>
              {subscription?.plan === 'premium' ? 'Premium' : subscription?.plan === 'basic' ? 'Basic' : 'Free'} Plan
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {subscription?.plan === 'free' || !subscription
                ? 'Upgrade to get notifications and call features'
                : subscription?.status === 'active'
                  ? `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : 'Plan expired'}
            </p>
          </div>
          {(!subscription || subscription.plan === 'free' || subscription.status === 'expired') && (
            <Link to="/pricing" className="btn btn-primary" style={{ width: 'auto', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Emergency Contact</h3>
            {emergencyContact ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {emergencyContact.name} {emergencyContact.maskedPhone && `(${emergencyContact.maskedPhone})`}
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Add an emergency contact for your vehicles
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              style={{ width: 'auto', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
              onClick={() => {
                setEmergencyName(emergencyContact?.name || '')
                setEmergencyPhone('')
                setEmergencyError('')
                setShowEmergencyModal(true)
              }}
            >
              {emergencyContact ? 'Edit' : 'Add Emergency Contact'}
            </button>
            {emergencyContact && (
              <button
                className="btn"
                style={{ width: 'auto', padding: '0.625rem 1.25rem', fontSize: '0.875rem', background: 'none', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                onClick={handleRemoveEmergencyContact}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact Modal */}
      {showEmergencyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              {emergencyContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>
            <form onSubmit={handleSaveEmergencyContact}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Contact name"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  pattern="[6-9]\d{9}"
                  title="Enter a valid 10-digit Indian mobile number"
                />
              </div>
              {emergencyError && (
                <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {emergencyError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={emergencyLoading}>
                  {emergencyLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowEmergencyModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚗</div>
          <h3>No vehicles registered</h3>
          <p>Add your first vehicle to get started</p>
          <Link to="/add-vehicle" className="btn btn-primary mt-2">
            Add Vehicle
          </Link>
        </div>
      ) : (
        <>
          <div className="vehicle-cards-grid">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-card">
                <div className="vehicle-card-icon">
                  {vehicleIcons[vehicle.vehicleType] || '🚗'}
                </div>
                <div className="vehicle-card-info">
                  <div className="vehicle-card-number">
                    {vehicle.vehicleNumber}
                  </div>
                  <div className="vehicle-card-stats">
                    {vehicle.totalScans} scans
                    {vehicle.lastScannedAt && (
                      <> · Last: {new Date(vehicle.lastScannedAt).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeactivate(vehicle.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Link to="/add-vehicle" className="btn btn-outline">
            + Add Another Vehicle
          </Link>
        </>
      )}

      <div className="card mt-3">
        <h3 className="mb-1">Your QR Link</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Share this with people who need to scan your vehicle:
        </p>
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="qr-link-item">
            <strong>{vehicle.vehicleNumber}:</strong>{' '}
            <span className="qr-link-url">
              tagsphere.co.in/v/{vehicle.qrCodeId}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
