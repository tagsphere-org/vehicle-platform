const features = {
  firebase: import.meta.env.VITE_ENABLE_FIREBASE === 'true',
  razorpay: import.meta.env.VITE_ENABLE_RAZORPAY === 'true',
  notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  calls: import.meta.env.VITE_ENABLE_CALLS === 'true',
}

export default features
