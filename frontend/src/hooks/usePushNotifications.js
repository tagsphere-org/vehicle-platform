import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import features from '../config/features'
import api from '../services/api'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export default function usePushNotifications() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    if (!features.firebase) return
    initialized.current = true

    if (Capacitor.isNativePlatform()) {
      initNativePush()
    } else {
      initWebPush()
    }
  }, [])
}

async function initWebPush() {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    // Register service worker and pass Firebase config
    const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    if (sw.active) {
      sw.active.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig })
    }
    sw.addEventListener('statechange', () => {
      if (sw.active) {
        sw.active.postMessage({ type: 'FIREBASE_CONFIG', config: firebaseConfig })
      }
    })

    // Dynamically import Firebase messaging
    const { initializeApp, getApps } = await import('firebase/app')
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
    const messaging = getMessaging(app)

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) return

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: sw
    })

    if (token) {
      await api.post('/auth/fcm-token', { token, platform: 'web' }).catch(() => {})
    }

    // Foreground message handler — show toast notification
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {}
      if (title && Notification.permission === 'granted') {
        new Notification(title, { body: body || '', icon: '/favicon.svg' })
      }
    })
  } catch (error) {
    console.error('Web push init error:', error.message)
  }
}

async function initNativePush() {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async (token) => {
      const platform = Capacitor.getPlatform()
      await api.post('/auth/fcm-token', { token: token.value, platform }).catch(() => {})
    })

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error)
    })

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification)
    })
  } catch (error) {
    console.error('Native push init error:', error.message)
  }
}
