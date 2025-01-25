// Import the functions you need from the Firebase SDKs
import {
  initializeApp,
  getApp,
  getApps,
  deleteApp,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-messaging.js";

// Load configuration from local storage or set default values

const savedFirebaseConfig = localStorage.getItem("firebaseConfig") || null;
let savedConfig = savedFirebaseConfig
  ? JSON.parse(localStorage.getItem("firebaseConfig"))
  : null;

const defaultConfig = {
  firebaseConfig: savedConfig?.firebaseConfig || {
    apiKey: "AIzaSyD7bqFxpBE9MaefYrfkh9zbjakqKyWayy4",
    authDomain: "web-push-notification-6c833.firebaseapp.com",
    projectId: "web-push-notification-6c833",
    storageBucket: "web-push-notification-6c833.firebasestorage.app",
    messagingSenderId: "120059432509",
    appId: "1:120059432509:web:b79bebb3107f36100b2454",
  },
  vapidKey:
    savedConfig?.vapidKey ||
    "BLZvNjBrwYrXlvQ3HDxexB0E9bQxcCGlntuuRawZPkzqJ7zsLUhyrP4uQfb1BOI-LWnoSA-bmOSHS13A4F7h3-M",
};

if (!savedConfig) {
  savedConfig = defaultConfig;
}

let app, messaging;

function showAlertWithReload() {
  Swal.fire({
    title: "Firebase app registered successfully!",
    text: "Generate token now.",
    icon: "success",
    confirmButtonText: "Reload Page",
  }).then((result) => {
    if (result.isConfirmed) {
      // Reload the page
      window.location.reload();
    }
  });
}

// Initialize Firebase dynamically
// Initialize Firebase with new config and handle existing app

// Initialize Firebase with new config and handle existing app
function initializeFirebase(config, vapidKey) {
  try {
    // Check if the Firebase app already exists
    const apps = getApps();
    if (apps.length > 0) {
      // If the default app exists, delete it
      const defaultApp = getApp(); // Get the default app
      deleteApp(defaultApp)
        .then(() => {
          console.log("Deleted existing Firebase app.");
          // Now, initialize the new app with the provided config
          const app = initializeApp(config);
          const messaging = getMessaging(app);
          $("#app-status").text("Firebase app initialized successfully!");
          localStorage.setItem(
            "firebaseConfig",
            JSON.stringify({ firebaseConfig: config, vapidKey })
          );
          requestNotificationPermission();
          setupOnMessage();
          showAlertWithReload();
        })
        .catch((error) => {
          console.error("Error deleting Firebase app:", error);
        });
    } else {
      // If no Firebase apps exist, just initialize the new app
      app = initializeApp(config);
      messaging = getMessaging(app);
      $("#app-status").text("Firebase app initialized successfully!");
      localStorage.setItem(
        "firebaseConfig",
        JSON.stringify({ firebaseConfig: config, vapidKey })
      );
      requestNotificationPermission();
      setupOnMessage();
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    $("#app-status").text(
      "Error initializing Firebase. Check the configuration."
    );
  }
}

// Display saved config and VAPID key on the page
function displayConfig() {
  const config = JSON.parse(localStorage.getItem("firebaseConfig")) || {};
  $("#current-config").text(JSON.stringify(config.firebaseConfig, null, 2));
  $("#current-vapid").text(config.vapidKey || "Not set");
}

// Request notification permission
// Request notification permission and register the service worker
async function requestNotificationPermission() {
  if (window.Notification) {
    try {
      $("#notification-status").text("Requesting notification permission...");
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted.");
        $("#notification-status").text("Granted");
        $("#generate-token").prop("disabled", false);
      } else {
        console.log("Notification permission denied.");
        $("#notification-status").text("Denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  } else {
    console.log("This browser does not support desktop notifications.");
    $("#notification-status").text("Not Supported");
  }
}

// Generate a FCM token
function generateToken() {
  $("#status-message").text("Generating token...");
  const config = JSON.parse(localStorage.getItem("firebaseConfig"));
  console.log(config.vapidKey);
  console.log(messaging);
  $("#generate-token").prop("disabled", true);

  getToken(messaging, { vapidKey: config.vapidKey })
    .then((currentToken) => {
      $("#generate-token").prop("disabled", false);
      if (currentToken) {
        console.log("Token generated:", currentToken);
        $("#status-message").text("Token generated successfully!");
        $("#token-display").text(currentToken);
        $("#copy-token").prop("disabled", false);
      } else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
        $("#status-message").text(
          "Failed to generate token. Please try again."
        );
      }
    })
    .catch((err) => {
      $("#generate-token").prop("disabled", false);
      console.error("Error generating token:", err);
      $("#status-message").text(
        "Error generating token. Check console for details."
      );
    });
}

function showAlertWithLink() {
  Swal.fire({
    title: "Token copied to clipboard!",
    text: "Would you like to test the push notification?",
    icon: "success",
    showCancelButton: true,
    confirmButtonText: "Test Now",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      // Redirect to the test push notification link
      window.location.href = "https://testfcm.online";
    }
  });
}

// Copy token to clipboard
function copyToken() {
  const token = $("#token-display").text();
  navigator.clipboard.writeText(token).then(() => {
    showAlertWithLink();
  });
}

// Save new Firebase configuration
function saveConfig() {
  try {
    const newConfigInput = $("#json-config").val();
    const newVapidKey = $("#vapid-key").val();
    if (!newConfig || !newVapidKey) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill Firebase Config  And VAPID Key both",
      });
      return;
    }
    const newConfig = JSON.parse(newConfigInput);

    initializeFirebase(newConfig, newVapidKey);
    displayConfig();
  } catch (error) {
    console.error("Invalid JSON configuration:", error);
    Swal.fire({
      icon: "error",
      title: "Validation Error",
      text: "Invalid JSON configuration. Please check the format and try again",
    });
    return;
  }
}

// Handle incoming messages
function setupOnMessage() {
  if (messaging) {
    onMessage(messaging, (payload) => {
      console.log("Message received:", payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: payload.data.icon,
        data: payload.notification,
      };
      new Notification(notificationTitle, notificationOptions).onclick = () => {
        window.open(payload.notification.click_action, "_blank").focus();
      };
    });
  } else {
    console.error(
      "Messaging is not initialized. Cannot set onMessage handler."
    );
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Service Worker registered with scope:", registration.scope);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
} else {
  console.log("Service workers are not supported in this browser.");
}

$(document).ready(() => {
  console.log(savedConfig);
  if (savedConfig?.firebaseConfig && savedConfig?.vapidKey) {
    initializeFirebase(savedConfig.firebaseConfig, savedConfig.vapidKey);
    displayConfig();
  } else {
    $("#app-status").text(
      "Firebase not configured. Please set the configuration."
    );
  }

  $("#generate-token").click(() => {
    generateToken();
  });

  $("#copy-token").click(() => {
    copyToken();
  });

  $("#save-config").click(() => {
    saveConfig();
  });
});
