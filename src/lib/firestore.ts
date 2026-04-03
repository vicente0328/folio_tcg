import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch,
  query, where, runTransaction, serverTimestamp, Timestamp,
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
  /** Total points after attendance reward (used to sync local state) */
  newTotalPoints: number;
}

/** Check attendance and award points. Returns result with earned points. */
export async function checkAttendance(uid: string): Promise<AttendanceResult> {
  const today = new Date().toISOString().slice(0, 10);
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return { alreadyChecked: true, pointsEarned: 0, newStreak: 0, newTotalPoints: 0 };
  const data = snap.data();

  if (data.lastAttendance === today) {
    return { alreadyChecked: true, pointsEarned: 0, newStreak: data.attendanceStreak || 0, newTotalPoints: data.points || 0 };
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

  return { alreadyChecked: false, pointsEarned, newStreak, newTotalPoints: newPoints };
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

// ─── Card Pool System ───

export interface PoolCard extends CardData {
  card_id: string;
  status: 'pool' | 'owned' | 'trading';
  current_owner: string | null;
  max_copies: number;
  issued_copies: number;
}

/** Load the entire card pool from Firestore */
export async function getCardPool(): Promise<PoolCard[]> {
  const snap = await getDocs(collection(db, 'cards'));
  return snap.docs.map(d => d.data() as PoolCard);
}

/** Get only available (drawable) cards from the pool */
export async function getAvailablePool(): Promise<PoolCard[]> {
  const pool = await getCardPool();
  return pool.filter(c => {
    if (c.grade === 'Common') {
      return c.issued_copies < c.max_copies;
    }
    return c.status === 'pool';
  });
}

/**
 * Atomically claim cards for a user from the Firestore pool.
 *
 * - Rare/Epic/Legendary: transaction sets status "pool" → "owned" (fails if already owned)
 * - Common: transaction increments issued_copies (fails if >= max_copies)
 *
 * Returns only successfully claimed cards. Failed claims are silently skipped.
 */
export async function claimCards(uid: string, cards: CardData[]): Promise<CardData[]> {
  const claimed: CardData[] = [];

  for (const card of cards) {
    const cardDocRef = doc(db, 'cards', card.card_id);
    try {
      await runTransaction(db, async (t) => {
        const cardSnap = await t.get(cardDocRef);
        if (!cardSnap.exists()) {
          throw new Error('card_not_in_pool');
        }

        const data = cardSnap.data();

        if (card.grade === 'Common') {
          // Common: check issued_copies < max_copies
          const issued = data.issued_copies || 0;
          if (issued >= data.max_copies) {
            throw new Error('max_copies_reached');
          }
          t.update(cardDocRef, {
            issued_copies: issued + 1,
          });
        } else {
          // Rare+: must be in "pool" status
          if (data.status !== 'pool') {
            throw new Error('already_owned');
          }
          t.update(cardDocRef, {
            status: 'owned',
            current_owner: uid,
          });
        }
      });
      claimed.push(card);
    } catch (err: any) {
      if (['already_owned', 'max_copies_reached', 'card_not_in_pool'].includes(err?.message)) {
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

// ─── Exchange / Trade System ───

export interface InventoryCard extends CardData {
  docId: string;
  obtainedAt: string;
  source: string;
}

export interface Trade {
  id: string;
  from_user: string;
  from_user_name: string;
  to_user: string;
  to_user_name: string;
  offer_points: number;
  offer_cards: CardData[];
  offer_card_doc_ids: string[];
  request_cards: CardData[];
  request_card_doc_ids: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  resolvedAt: Date | null;
}

/** Get all user profiles (for collector list) */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as UserProfile);
}

/** Get a user's inventory with Firestore document IDs */
export async function getUserInventoryWithIds(uid: string): Promise<InventoryCard[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'inventory'));
  return snap.docs.map(d => ({ ...d.data(), docId: d.id } as InventoryCard));
}

/** Create a trade proposal */
export async function createTrade(trade: Omit<Trade, 'resolvedAt'>): Promise<string> {
  const tradeRef = doc(collection(db, 'trades'));
  const tradeWithId = { ...trade, id: tradeRef.id, resolvedAt: null, createdAt: Timestamp.now() };
  await setDoc(tradeRef, tradeWithId);
  return tradeRef.id;
}

function docToTrade(d: DocumentData & { id?: string }, docId: string): Trade {
  return {
    ...d,
    id: docId,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
    resolvedAt: d.resolvedAt?.toDate?.() ?? null,
  } as Trade;
}

/** Get incoming trade proposals (where I'm the recipient) */
export async function getIncomingTrades(uid: string): Promise<Trade[]> {
  const q = query(collection(db, 'trades'), where('to_user', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => docToTrade(d.data(), d.id))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Get outgoing trade proposals (where I'm the proposer) */
export async function getOutgoingTrades(uid: string): Promise<Trade[]> {
  const q = query(collection(db, 'trades'), where('from_user', '==', uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => docToTrade(d.data(), d.id))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Reject a trade proposal (by recipient) */
export async function rejectTrade(tradeId: string, uid: string): Promise<void> {
  const tradeRef = doc(db, 'trades', tradeId);
  const snap = await getDoc(tradeRef);
  if (!snap.exists()) throw new Error('trade_not_found');
  const data = snap.data();
  if (data.to_user !== uid) throw new Error('not_authorized');
  if (data.status !== 'pending') throw new Error('trade_not_pending');
  await updateDoc(tradeRef, { status: 'rejected', resolvedAt: Timestamp.now() });
}

/** Withdraw a trade proposal (by proposer) */
export async function withdrawTrade(tradeId: string, uid: string): Promise<void> {
  const tradeRef = doc(db, 'trades', tradeId);
  const snap = await getDoc(tradeRef);
  if (!snap.exists()) throw new Error('trade_not_found');
  const data = snap.data();
  if (data.from_user !== uid) throw new Error('not_authorized');
  if (data.status !== 'pending') throw new Error('trade_not_pending');
  await updateDoc(tradeRef, { status: 'rejected', resolvedAt: Timestamp.now() });
}

/**
 * Accept a trade and execute atomic swap.
 * - Transfers cards between inventories
 * - Transfers points between users
 * - Updates global cards collection (current_owner for Rare+)
 * - Rejects other pending trades involving the same cards
 */
export async function acceptTrade(tradeId: string, acceptorUid: string): Promise<void> {
  await runTransaction(db, async (t) => {
    // 1. Read trade
    const tradeRef = doc(db, 'trades', tradeId);
    const tradeSnap = await t.get(tradeRef);
    if (!tradeSnap.exists()) throw new Error('trade_not_found');
    const trade = tradeSnap.data();

    if (trade.status !== 'pending') throw new Error('trade_not_pending');
    if (trade.to_user !== acceptorUid) throw new Error('not_authorized');

    const fromUid = trade.from_user;
    const toUid = trade.to_user;
    const offerPoints: number = trade.offer_points || 0;

    // 2. Read both user docs
    const fromUserRef = doc(db, 'users', fromUid);
    const toUserRef = doc(db, 'users', toUid);
    const [fromUserSnap, toUserSnap] = await Promise.all([
      t.get(fromUserRef),
      t.get(toUserRef),
    ]);
    if (!fromUserSnap.exists() || !toUserSnap.exists()) throw new Error('user_not_found');

    const fromUser = fromUserSnap.data();
    const toUser = toUserSnap.data();

    // 3. Verify proposer has enough points
    if (offerPoints > 0 && fromUser.points < offerPoints) {
      throw new Error('insufficient_points');
    }

    // 4. Read all inventory docs involved and verify they still exist
    const requestDocIds: string[] = trade.request_card_doc_ids || [];
    const offerDocIds: string[] = trade.offer_card_doc_ids || [];

    const requestInvRefs = requestDocIds.map(id => doc(db, 'users', toUid, 'inventory', id));
    const offerInvRefs = offerDocIds.map(id => doc(db, 'users', fromUid, 'inventory', id));

    const requestSnaps = await Promise.all(requestInvRefs.map(ref => t.get(ref)));
    const offerSnaps = await Promise.all(offerInvRefs.map(ref => t.get(ref)));

    for (const snap of requestSnaps) {
      if (!snap.exists()) throw new Error('card_no_longer_owned');
    }
    for (const snap of offerSnaps) {
      if (!snap.exists()) throw new Error('card_no_longer_owned');
    }

    // ─── All reads done, now writes ───

    // 5. Transfer requested cards: to_user → from_user
    for (let i = 0; i < requestInvRefs.length; i++) {
      const cardData = requestSnaps[i].data()!;
      t.delete(requestInvRefs[i]);
      const newRef = doc(collection(db, 'users', fromUid, 'inventory'));
      t.set(newRef, { ...cardData, obtainedAt: new Date().toISOString(), source: 'trade' });
    }

    // 6. Transfer offered cards: from_user → to_user
    for (let i = 0; i < offerInvRefs.length; i++) {
      const cardData = offerSnaps[i].data()!;
      t.delete(offerInvRefs[i]);
      const newRef = doc(collection(db, 'users', toUid, 'inventory'));
      t.set(newRef, { ...cardData, obtainedAt: new Date().toISOString(), source: 'trade' });
    }

    // 7. Transfer points
    if (offerPoints > 0) {
      t.update(fromUserRef, { points: fromUser.points - offerPoints });
      t.update(toUserRef, { points: toUser.points + offerPoints });
    }

    // 8. Update global cards collection for Rare+ cards (current_owner)
    const requestCards: CardData[] = trade.request_cards || [];
    const offerCards: CardData[] = trade.offer_cards || [];

    for (const card of requestCards) {
      if (card.grade !== 'Common') {
        const cardRef = doc(db, 'cards', card.card_id);
        t.update(cardRef, { current_owner: fromUid });
      }
    }
    for (const card of offerCards) {
      if (card.grade !== 'Common') {
        const cardRef = doc(db, 'cards', card.card_id);
        t.update(cardRef, { current_owner: toUid });
      }
    }

    // 9. Mark trade as accepted
    t.update(tradeRef, { status: 'accepted', resolvedAt: Timestamp.now() });
  });

  // 10. After transaction: reject other pending trades for the same cards
  await rejectConflictingTrades(tradeId);
}

/** Reject all other pending trades that involve cards from a completed trade */
async function rejectConflictingTrades(completedTradeId: string): Promise<void> {
  const tradeRef = doc(db, 'trades', completedTradeId);
  const tradeSnap = await getDoc(tradeRef);
  if (!tradeSnap.exists()) return;

  const trade = tradeSnap.data();
  const involvedDocIds = new Set([
    ...(trade.request_card_doc_ids || []),
    ...(trade.offer_card_doc_ids || []),
  ]);

  if (involvedDocIds.size === 0) return;

  // Find all pending trades for both users
  const [fromTrades, toTrades] = await Promise.all([
    getDocs(query(collection(db, 'trades'), where('from_user', '==', trade.from_user), where('status', '==', 'pending'))),
    getDocs(query(collection(db, 'trades'), where('to_user', '==', trade.to_user), where('status', '==', 'pending'))),
  ]);

  const batch = writeBatch(db);
  let hasWrites = false;

  for (const d of [...fromTrades.docs, ...toTrades.docs]) {
    if (d.id === completedTradeId) continue;
    const data = d.data();
    const docIds = [...(data.offer_card_doc_ids || []), ...(data.request_card_doc_ids || [])];
    if (docIds.some(id => involvedDocIds.has(id))) {
      batch.update(d.ref, { status: 'rejected', resolvedAt: Timestamp.now() });
      hasWrites = true;
    }
  }

  if (hasWrites) await batch.commit();
}
