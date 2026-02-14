import features from './features'

let auth = null

if (features.firebase) {
  const { initializeApp } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

export { auth }
