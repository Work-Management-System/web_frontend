// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDLmJUVMDRe7sb-7uZ8Qb0BFKdkJ0XsIno",
    authDomain: "manazeit666-4b36f.firebaseapp.com",
    projectId: "manazeit666-4b36f",
    storageBucket: "manazeit666-4b36f.firebasestorage.app",
    messagingSenderId: "1062765587674",
    appId: "1:1062765587674:web:8efef71f599b3b32a789e3",
    measurementId: "G-19EZRHFN9Y"
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
