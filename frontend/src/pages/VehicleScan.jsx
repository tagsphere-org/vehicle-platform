import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

function VehicleScan() {
  const { qrId } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alertSent, setAlertSent] = useState(false)
  const [showAlertOptions, setShowAlertOptions] = useState(false)
  const [sendingAlert, setSendingAlert] = useState(false)

  useEffect(() => {
    fetchVehicle()
  }, [qrId])

  const fetchVehicle = async () => {
    try {
      const response = await api.get(`/scan/${qrId}`)
      setVehicle(response.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Vehicle not found. This QR code may not be activated yet.')
      } else {
        setError('Failed to load vehicle information')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCall = async () => {
    try {
      const response = await api.post(`/scan/${qrId}/call`)
      // Open phone dialer
      window.location.href = `tel:${response.data.phone}`
    } catch (err) {
      alert('Failed to get owner contact')
    }
  }

  const handleAlert = async (alertType) => {
    setSendingAlert(true)
    try {
      await api.post(`/scan/${qrId}/alert`, { alertType })
      setAlertSent(true)
      setShowAlertOptions(false)
    } catch (err) {
      alert('Failed to send alert')
    } finally {
      setSendingAlert(false)
    }
  }

  if (loading) {
    return (
      <div className="scan-page">
        <div className="loading" style={{ flex: 1 }}>
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="scan-page">
        <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Oops!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="scan-page">
      {/* Vehicle Info Header */}
      <div className="vehicle-info">
        <div className="vehicle-number">{vehicle.vehicleNumber}</div>
        <div className="vehicle-type">
          {vehicle.vehicleType} {vehicle.vehicleColor && `· ${vehicle.vehicleColor}`}
        </div>
        <div style={{ marginTop: '0.5rem', opacity: 0.9 }}>
          Owner: {vehicle.ownerName}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        {alertSent ? (
          <div className="alert alert-success text-center">
            <strong>Alert sent!</strong>
            <p style={{ marginTop: '0.5rem' }}>
              The vehicle owner has been notified.
            </p>
          </div>
        ) : (
          <>
            <button className="btn call-btn" onClick={handleCall}>
              📞 Call Owner
            </button>

            {!showAlertOptions ? (
              <button
                className="btn alert-btn"
                onClick={() => setShowAlertOptions(true)}
              >
                🔔 Send Alert
              </button>
            ) : (
              <div className="card" style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                  What's the issue?
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('parked_wrong')}
                    disabled={sendingAlert}
                  >
                    🚫 Parked incorrectly
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('lights_on')}
                    disabled={sendingAlert}
                  >
                    💡 Lights are on
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('emergency')}
                    disabled={sendingAlert}
                  >
                    🚨 Emergency
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('other')}
                    disabled={sendingAlert}
                  >
                    💬 Other reason
                  </button>
                </div>

                <button
                  className="btn mt-2"
                  onClick={() => setShowAlertOptions(false)}
                  style={{ background: 'transparent', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem'
        }}>
          <p>Powered by TagSphere</p>
          <p>Your phone number stays private</p>
        </div>
      </div>
    </div>
  )
}

export default VehicleScan
