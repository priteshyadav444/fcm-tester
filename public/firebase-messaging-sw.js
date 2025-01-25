importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
importScripts('http://localhost:3000/firebase/firebase_service_worker.js');
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_CONFIG') {
      const { firebaseConfig, vapidKey } = event.data;
  
      // Initialize Firebase in the service worker
      importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js');
      importScripts('https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js');
  
      // Initialize Firebase with the configuration sent from the main thread
      firebase.initializeApp(firebaseConfig);
  
      // Initialize Firebase Messaging with the VAPID Key
      const messaging = firebase.messaging();
      messaging.usePublicVapidKey(vapidKey);
  
      console.log('Firebase initialized in service worker with new config.');
    }
  });