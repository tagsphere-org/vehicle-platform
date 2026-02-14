import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import features from '../config/features'
import api from '../services/api'

function VehicleScan() {
  const { qrId, vehicleNumber } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [alertSent, setAlertSent] = useState(false)
  const [showAlertOptions, setShowAlertOptions] = useState(false)
  const [sendingAlert, setSendingAlert] = useState(false)
  const [emergencyContact, setEmergencyContact] = useState(null)
  const [loadingEmergency, setLoadingEmergency] = useState(false)

  // Store qrCodeId for API calls (returned from both lookup methods)
  const [resolvedQrId, setResolvedQrId] = useState(qrId || null)

  useEffect(() => {
    fetchVehicle()
  }, [qrId, vehicleNumber])

  const fetchVehicle = async () => {
    try {
      let response
      if (vehicleNumber) {
        response = await api.get(`/scan/vehicle/${vehicleNumber.toUpperCase()}`)
      } else {
        response = await api.get(`/scan/${qrId}`)
      }
      setVehicle(response.data)
      // Use returned qrCodeId for subsequent call/alert API calls
      if (response.data.qrCodeId) {
        setResolvedQrId(response.data.qrCodeId)
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError(vehicleNumber
          ? 'Vehicle not found. This number may not be registered yet.'
          : 'Vehicle not found. This QR code may not be activated yet.')
      } else {
        setError('Failed to load vehicle information')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCall = async () => {
    if (!vehicle?.canCall || !resolvedQrId) {
      return
    }
    try {
      const response = await api.post(`/scan/${resolvedQrId}/call`)
      window.location.href = response.data.phone
    } catch (err) {
      if (err.response?.status === 503) {
        alert('Direct calls are coming soon.')
      } else if (err.response?.status === 403) {
        alert('Call not available. You can send an alert instead.')
      } else {
        alert('Failed to get owner contact')
      }
    }
  }

  const handleAlert = async (alertType) => {
    if (!resolvedQrId) return
    setSendingAlert(true)
    try {
      await api.post(`/scan/${resolvedQrId}/alert`, { alertType })
      setAlertSent(true)
      setShowAlertOptions(false)
    } catch (err) {
      alert('Failed to send alert')
    } finally {
      setSendingAlert(false)
    }
  }

  const handleEmergencyContact = async () => {
    if (!resolvedQrId) return
    setLoadingEmergency(true)
    try {
      const response = await api.post(`/scan/${resolvedQrId}/emergency-contact`)
      setEmergencyContact(response.data.emergencyContact)
    } catch (err) {
      if (err.response?.status === 404) {
        alert('No emergency contact available for this vehicle.')
      } else {
        alert('Failed to get emergency contact')
      }
    } finally {
      setLoadingEmergency(false)
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>!</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Oops!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    )
  }

  const callsAvailable = features.calls && vehicle?.callsEnabled

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
            {callsAvailable && vehicle?.canCall ? (
              <button className="btn call-btn" onClick={handleCall}>
                Call Owner
              </button>
            ) : callsAvailable ? (
              <div className="alert alert-info" style={{ textAlign: 'center' }}>
                <strong>Direct call not available</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  The owner has not enabled direct calls. Send an alert instead.
                </p>
              </div>
            ) : (
              <div className="alert alert-info" style={{ textAlign: 'center' }}>
                <strong>Direct calls coming soon</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  Send an alert to notify the vehicle owner.
                </p>
              </div>
            )}

            {!showAlertOptions ? (
              <button
                className="btn alert-btn"
                onClick={() => setShowAlertOptions(true)}
              >
                Send Alert
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
                    Parked incorrectly
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('lights_on')}
                    disabled={sendingAlert}
                  >
                    Lights are on
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('emergency')}
                    disabled={sendingAlert}
                  >
                    Emergency
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleAlert('other')}
                    disabled={sendingAlert}
                  >
                    Other reason
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

        {/* Emergency SOS Section */}
        {vehicle?.hasEmergencyContact && (
          <div style={{ marginTop: '1.5rem' }}>
            {!emergencyContact ? (
              <button
                className="btn"
                onClick={handleEmergencyContact}
                disabled={loadingEmergency}
                style={{
                  background: 'var(--danger)',
                  color: '#fff',
                  width: '100%'
                }}
              >
                {loadingEmergency ? 'Loading...' : 'Emergency SOS'}
              </button>
            ) : (
              <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)' }}>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--danger)' }}>
                  Emergency Contact
                </h3>
                <p style={{ marginBottom: '0.25rem' }}>
                  <strong>{emergencyContact.name}</strong>
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {emergencyContact.maskedPhone}
                </p>
                <a
                  href={emergencyContact.phone}
                  className="btn btn-primary"
                  style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
                >
                  Call Emergency Contact
                </a>
              </div>
            )}
          </div>
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
