// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoCgUQK2ASmV5RdlDQc-FpPGXwniL6vk0",
  authDomain: "work-management-10d26.firebaseapp.com",
  projectId: "work-management-10d26",
  storageBucket: "work-management-10d26.firebasestorage.app",
  messagingSenderId: "828838037787",
  appId: "1:828838037787:web:acd0e7b54ec51a01252bbe",
  measurementId: "G-74EZ77ZSDE"
};


// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    // console.log("Received background message: ", payload);

    const notificationTitle = payload.notification?.title || "Background Notification";
    const notificationOptions = {
        body: payload.notification?.body,
        icon: "/firebase-logo.png",
        data: payload.fcmOptions?.link || "/",
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: handle notification clicks
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.notification.data) {
        clients.openWindow(event.notification.data);
    }
});
