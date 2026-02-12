import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function AddVehicle() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    qrId: '',
    activationPin: '',
    vehicleNumber: '',
    vehicleType: 'car'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'vehicleNumber' ? value.toUpperCase() : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/vehicle/register', formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register vehicle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Add Vehicle</h1>
          <p className="card-subtitle">
            Enter your QR code details and vehicle information
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">QR Code ID</label>
            <input
              type="text"
              name="qrId"
              className="form-input"
              placeholder="Enter 7-character code (e.g., ABC1234)"
              value={formData.qrId}
              onChange={handleChange}
              maxLength={7}
              style={{ textTransform: 'uppercase' }}
              required
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Found on your TagSphere sticker
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Activation PIN</label>
            <input
              type="text"
              name="activationPin"
              className="form-input"
              placeholder="6-digit PIN"
              value={formData.activationPin}
              onChange={handleChange}
              maxLength={6}
              required
            />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Found inside the sticker packaging
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              className="form-input"
              placeholder="MH12AB1234"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select
              name="vehicleType"
              className="form-input"
              value={formData.vehicleType}
              onChange={handleChange}
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="truck">Truck</option>
              <option value="auto">Auto</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Vehicle'}
          </button>

          <button
            type="button"
            className="btn btn-outline mt-2"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.5rem' }}>Don't have a sticker?</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Purchase TagSphere QR stickers from our website or authorized dealers.
        </p>
      </div>
    </div>
  )
}

export default AddVehicle
