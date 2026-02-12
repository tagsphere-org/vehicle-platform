import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Dashboard() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVehicles()
  }, [])

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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          Hello, {user?.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your registered vehicles
        </p>
      </div>

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
          <div style={{ marginBottom: '1rem' }}>
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
        <h3 style={{ marginBottom: '0.5rem' }}>Your QR Link</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Share this with people who need to scan your vehicle:
        </p>
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            style={{
              background: 'var(--background)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              wordBreak: 'break-all'
            }}
          >
            <strong>{vehicle.vehicleNumber}:</strong>{' '}
            <span style={{ color: 'var(--primary)' }}>
              tagsphere.in/v/{vehicle.qrCodeId}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
