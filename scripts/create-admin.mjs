/**
 * Create admin account with email/password auth and 100,000 points.
 *
 * Prerequisites: Email/Password auth must be enabled in Firebase Console
 * (Authentication > Sign-in method > Email/Password > Enable)
 *
 * Usage: node scripts/create-admin.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6ko15QyhueLIUxfpgGTv59LNP5qnBsBI",
  authDomain: "folio-tcg.firebaseapp.com",
  projectId: "folio-tcg",
  storageBucket: "folio-tcg.firebasestorage.app",
  messagingSenderId: "1071968392780",
  appId: "1:1071968392780:web:743dab6c3f575e24f7c6e9",
};

const ADMIN_EMAIL = 'admin@folio.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_POINTS = 100000;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  let uid;

  // Try to create the user, or sign in if already exists
  try {
    console.log(`Creating user ${ADMIN_EMAIL}...`);
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    uid = cred.user.uid;
    console.log(`User created: ${uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('User already exists, signing in...');
      const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      uid = cred.user.uid;
      console.log(`Signed in: ${uid}`);
    } else {
      console.error('Auth error:', err.code, err.message);
      process.exit(1);
    }
  }

  // Create/update Firestore profile with 100,000 points
  const userRef = doc(db, 'users', uid);
  const existing = await getDoc(userRef);

  const profile = {
    uid,
    displayName: 'Admin',
    email: ADMIN_EMAIL,
    points: ADMIN_POINTS,
    lastAttendance: null,
    attendanceStreak: 0,
    wishlist: [],
    pityCounter: 0,
    isAdmin: true,
  };

  if (existing.exists()) {
    // Just update points and admin flag
    await setDoc(userRef, { ...existing.data(), points: ADMIN_POINTS, isAdmin: true }, { merge: true });
    console.log(`Updated existing profile: ${ADMIN_POINTS} points`);
  } else {
    await setDoc(userRef, profile);
    console.log(`Created profile: ${ADMIN_POINTS} points`);
  }

  console.log('\n--- Admin Account ---');
  console.log(`Email:    ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`UID:      ${uid}`);
  console.log(`Points:   ${ADMIN_POINTS.toLocaleString()}`);
  console.log('---------------------');

  process.exit(0);
}

main();
