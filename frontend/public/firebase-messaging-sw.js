/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Config is passed via the main app when registering the service worker
// The app sets self.__FIREBASE_CONFIG__ via a message before messaging init
let messagingInitialized = false;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG' && !messagingInitialized) {
    firebase.initializeApp(event.data.config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        self.registration.showNotification(title, {
          body: body || '',
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: payload.data
        });
      }
    });

    messagingInitialized = true;
  }
});
