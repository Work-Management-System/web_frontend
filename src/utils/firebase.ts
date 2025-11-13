import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAoCgUQK2ASmV5RdlDQc-FpPGXwniL6vk0",
  authDomain: "work-management-10d26.firebaseapp.com",
  projectId: "work-management-10d26",
  storageBucket: "work-management-10d26.firebasestorage.app",
  messagingSenderId: "828838037787",
  appId: "1:828838037787:web:acd0e7b54ec51a01252bbe",
  measurementId: "G-74EZ77ZSDE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;