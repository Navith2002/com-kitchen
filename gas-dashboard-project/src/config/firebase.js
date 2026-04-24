import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCpo90DE6V6fh4ToTl69ipvi4dhek76KLA",
  authDomain: "iotproject-b12b4.firebaseapp.com",
  databaseURL:
    "https://iotproject-b12b4-default-rtdb.firebaseio.com",
  projectId: "iotproject-b12b4",
  storageBucket: "iotproject-b12b4.firebasestorage.app",
  messagingSenderId: "254397755394",
  appId: "1:254397755394:web:c782ea3214f09dd1f2371b",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
