const features = {
  firebase: process.env.ENABLE_FIREBASE === 'true',
  razorpay: process.env.ENABLE_RAZORPAY === 'true',
  notifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  calls: process.env.ENABLE_CALLS === 'true',
};

// Validate credentials when features are enabled
if (features.firebase) {
  const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`FATAL: ENABLE_FIREBASE=true but missing ${key}`);
      process.exit(1);
    }
  }
}

if (features.razorpay) {
  const required = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`FATAL: ENABLE_RAZORPAY=true but missing ${key}`);
      process.exit(1);
    }
  }
}

module.exports = features;
