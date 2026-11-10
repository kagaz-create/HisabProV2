import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// These values are public identifiers (not secrets). Access is enforced by Firebase Auth and firestore.rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyDAxQZh_i3nXBQkb2cGYAUcZdJA-Eo4IwA',
  authDomain: 'pragmatic-dolphin-pm4ph.firebaseapp.com',
  projectId: 'pragmatic-dolphin-pm4ph',
  storageBucket: 'pragmatic-dolphin-pm4ph.firebasestorage.app',
  messagingSenderId: '480858683509',
  appId: '1:480858683509:web:66570e0c815fec2f9ca03c',
};

export const DATABASE_ID = 'ai-studio-hisabprodigitalk-434ae670-6d7a-4350-b232-07f43f42bb2c';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

function makeDb() {
  try {
    // Offline cache: writes made without internet are kept and uploaded later, even after a reload.
    return initializeFirestore(
      app,
      { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
      DATABASE_ID
    );
  } catch {
    return getFirestore(app, DATABASE_ID);
  }
}

export const db = makeDb();
