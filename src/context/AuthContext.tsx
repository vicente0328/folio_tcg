import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  points: number;
  lastAttendance: string | null;
  attendanceStreak: number;
  wishlist: string[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
    }
    return snap.exists();
  };

  const createProfile = async (firebaseUser: User) => {
    const isAdmin = firebaseUser.email === 'admin@folio.com';
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      displayName: isAdmin ? 'Admin' : (firebaseUser.displayName || 'Collector'),
      email: firebaseUser.email || '',
      points: isAdmin ? 100000 : 2000,
      lastAttendance: null,
      attendanceStreak: 0,
      wishlist: [],
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), profile);
    setUserProfile(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const exists = await fetchProfile(firebaseUser.uid);
        if (!exists) {
          await createProfile(firebaseUser);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signInEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signInEmail, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
