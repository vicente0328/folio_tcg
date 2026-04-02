import {
  collection, doc, getDocs, setDoc, updateDoc, writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import { type CardData } from '../data/cards';
import { type UserProfile } from '../context/AuthContext';

/** Get user's card inventory from subcollection */
export async function getUserInventory(uid: string): Promise<CardData[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'inventory'));
  return snap.docs.map(d => d.data() as CardData);
}

/** Add drawn cards to user's inventory (batch write) */
export async function addCardsToInventory(uid: string, cards: CardData[]): Promise<void> {
  const batch = writeBatch(db);
  for (const card of cards) {
    const ref = doc(collection(db, 'users', uid, 'inventory'));
    batch.set(ref, {
      ...card,
      obtainedAt: new Date().toISOString(),
      source: 'gacha',
    });
  }
  batch.commit();
}

/** Update user's points in Firestore */
export async function updateUserPoints(uid: string, points: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { points });
}

/** Update user's pity counter in Firestore */
export async function updatePityCounter(uid: string, pityCounter: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { pityCounter });
}

/** Update arbitrary user profile fields */
export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as DocumentData);
}
