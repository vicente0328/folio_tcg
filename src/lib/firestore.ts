import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch,
  query, where, runTransaction,
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

// ─── Attendance System ───

export interface AttendanceResult {
  alreadyChecked: boolean;
  pointsEarned: number;
  newStreak: number;
}

/** Check attendance and award points. Returns result with earned points. */
export async function checkAttendance(uid: string): Promise<AttendanceResult> {
  const today = new Date().toISOString().slice(0, 10);
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return { alreadyChecked: true, pointsEarned: 0, newStreak: 0 };
  const data = snap.data();

  if (data.lastAttendance === today) {
    return { alreadyChecked: true, pointsEarned: 0, newStreak: data.attendanceStreak || 0 };
  }

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const isConsecutive = data.lastAttendance === yesterdayStr;
  const newStreak = isConsecutive ? (data.attendanceStreak || 0) + 1 : 1;

  // Points: base 10 + streak bonus (streak * 2, max 20) + 30 for 7-day milestone
  let pointsEarned = 10 + Math.min(newStreak * 2, 20);
  if (newStreak % 7 === 0) pointsEarned += 30;

  const newPoints = (data.points || 0) + pointsEarned;

  await updateDoc(userRef, {
    lastAttendance: today,
    attendanceStreak: newStreak,
    points: newPoints,
  });

  return { alreadyChecked: false, pointsEarned, newStreak };
}

// ─── Daily Free Pack ───

/** Check if user has already opened their daily free pack today */
export async function hasOpenedDailyPack(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return false;
  const data = snap.data();
  const lastFree = data.lastFreePack as string | undefined;
  if (!lastFree) return false;
  return lastFree === new Date().toISOString().slice(0, 10);
}

/** Record that user opened their daily free pack */
export async function recordDailyPack(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    lastFreePack: new Date().toISOString().slice(0, 10),
  });
}

// ─── Card Scarcity System ───

/** Get all globally owned card_ids (cards with status "owned") */
export async function getOwnedCardIds(): Promise<Set<string>> {
  const q = query(collection(db, 'cards'), where('status', '==', 'owned'));
  const snap = await getDocs(q);
  return new Set(snap.docs.map(d => d.data().card_id as string));
}

/**
 * Atomically claim cards for a user.
 * For Rare+ cards (unique), uses a transaction to check availability and set ownership.
 * For Common cards, directly adds to inventory.
 * Returns the list of successfully claimed cards (some Rare+ may fail if claimed by another user).
 */
export async function claimCards(uid: string, cards: CardData[]): Promise<CardData[]> {
  const claimed: CardData[] = [];

  for (const card of cards) {
    if (card.grade === 'Common') {
      // Common cards: no global uniqueness, just add to inventory
      claimed.push(card);
      continue;
    }

    // Rare/Epic/Legendary: atomic claim via transaction
    const cardDocRef = doc(db, 'cards', card.card_id);
    try {
      await runTransaction(db, async (t) => {
        const cardSnap = await t.get(cardDocRef);

        if (cardSnap.exists()) {
          const data = cardSnap.data();
          if (data.status === 'owned') {
            throw new Error('already_owned');
          }
          // Update existing doc
          t.update(cardDocRef, {
            status: 'owned',
            current_owner: uid,
          });
        } else {
          // First time this card appears in the global registry
          t.set(cardDocRef, {
            ...card,
            id: card.card_id,
            status: 'owned',
            current_owner: uid,
            max_copies: 1,
          });
        }
      });
      claimed.push(card);
    } catch (err: any) {
      if (err?.message === 'already_owned') {
        // Card was claimed by someone else between draw and claim — skip it
        continue;
      }
      throw err;
    }
  }

  // Batch write claimed cards to user's inventory
  if (claimed.length > 0) {
    const batch = writeBatch(db);
    for (const card of claimed) {
      const ref = doc(collection(db, 'users', uid, 'inventory'));
      batch.set(ref, {
        ...card,
        obtainedAt: new Date().toISOString(),
        source: 'gacha',
      });
    }
    await batch.commit();
  }

  return claimed;
}
