# Firebase Project Setup for TagSphere

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → Name it `TagSphere`
3. Disable Google Analytics (not needed) → **Create project**

## 2. Enable Phone Authentication

1. In the Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Phone** → **Enable** → **Save**
3. Go to **Settings** → **Authorized domains**
4. Add your domains:
   - `localhost` (already added by default)
   - `tagsphere.co.in`

## 3. Add a Web App

1. Go to **Project Settings** (gear icon) → **General**
2. Under **Your apps**, click the web icon (`</>`) → Register app as `TagSphere Web`
3. Copy the `firebaseConfig` object — you'll need these values:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

## 4. Generate Service Account Key (Backend)

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key** → Download the JSON file
3. From the JSON, extract these values for your backend `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

> **Important:** Never commit the service account JSON or private key to git.

## 5. Set Up Test Phone Numbers (Development)

1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Under **Phone numbers for testing**, add test numbers:
   - `+919999999999` → OTP: `123456`
   - `+918888888888` → OTP: `654321`
3. These numbers won't send real SMS and can be used for development/testing.

## 6. Environment Variables Summary

### Backend (`backend/.env`)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="your-private-key"
```

### Frontend (`frontend/.env`)
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Docker / Helm
Pass the same backend variables via secrets. See `helm/tagsphere/values.yaml`.
