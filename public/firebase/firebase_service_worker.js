const firebaseConfig = {
    apiKey: "AIzaSyD7bqFxpBE9MaefYrfkh9zbjakqKyWayy4",
    authDomain: "web-push-notification-6c833.firebaseapp.com",
    projectId: "web-push-notification-6c833",
    storageBucket: "web-push-notification-6c833.firebasestorage.app",
    messagingSenderId: "120059432509",
    appId: "1:120059432509:web:b79bebb3107f36100b2454",
  };
  
  firebase.initializeApp(firebaseConfig);
  
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon,
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
  