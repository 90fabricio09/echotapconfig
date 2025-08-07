import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase - EchoTap
const firebaseConfig = {
  apiKey: "AIzaSyCk8nKmx_Uk642n_V1hbLP5w2ZCrEIuwoY",
  authDomain: "echotap-9ca44.firebaseapp.com",
  projectId: "echotap-9ca44",
  storageBucket: "echotap-9ca44.firebasestorage.app",
  messagingSenderId: "686318623221",
  appId: "1:686318623221:web:0058e953d965703e1de8bc",
  measurementId: "G-4SBQCTJ6EQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app; 