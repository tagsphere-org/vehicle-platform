import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import VehicleScan from './pages/VehicleScan'
import AddVehicle from './pages/AddVehicle'
import ProtectedRoute from './components/ProtectedRoute'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import Pricing from './pages/Pricing'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          navigate(-1)
        } else {
          CapApp.exitApp()
        }
      })
      return () => { listener.then(l => l.remove()) }
    }
  }, [navigate])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="pricing" element={<Pricing />} />

        {/* Vehicle number lookup - public (must be before v/:qrId) */}
        <Route path="v/number/:vehicleNumber" element={<VehicleScan />} />
        {/* QR Scan page - public */}
        <Route path="v/:qrId" element={<VehicleScan />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-vehicle" element={<AddVehicle />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
