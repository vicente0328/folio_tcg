import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch, deleteDoc,
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

/** Create a new card in the pool */
export async function createCard(cardData: CardData): Promise<void> {
  const cardDoc = {
    id: cardData.card_id,
    card_id: cardData.card_id,
    book: cardData.book,
    grade: cardData.grade,
    original: cardData.original,
    translation: cardData.translation,
    chapter: cardData.chapter,
    author: cardData.author,
    ...(cardData.btl ? { btl: cardData.btl } : {}),
    ...(cardData.source_lang ? { source_lang: cardData.source_lang } : {}),
    status: 'pool',
    current_owner: null,
    max_copies: 1,
    issued_copies: 0,
  };
  await setDoc(doc(db, 'cards', cardData.card_id), cardDoc);
}

/** Update an existing card's metadata (pool + owner's inventory if owned) */
export async function updateCard(cardId: string, data: Partial<CardData>): Promise<void> {
  const allowed: Record<string, unknown> = {};
  const fields: (keyof CardData)[] = ['book', 'author', 'grade', 'original', 'translation', 'chapter', 'btl', 'source_lang'];
  for (const f of fields) {
    if (data[f] !== undefined) allowed[f] = data[f];
  }
  if (Object.keys(allowed).length === 0) return;

  // Update the pool document
  const cardDocRef = doc(db, 'cards', cardId);
  await updateDoc(cardDocRef, allowed);

  // If the card is owned, also update it in the owner's inventory subcollection
  const cardSnap = await getDoc(cardDocRef);
  if (cardSnap.exists()) {
    const cardData = cardSnap.data();
    if (cardData.status === 'owned' && cardData.current_owner) {
      const invSnap = await getDocs(
        query(
          collection(db, 'users', cardData.current_owner, 'inventory'),
          where('card_id', '==', cardId),
        ),
      );
      const batch = writeBatch(db);
      invSnap.docs.forEach(d => batch.update(d.ref, allowed));
      if (!invSnap.empty) await batch.commit();
    }
  }
}

/** Get only available (drawable) cards from the pool */
export async function getAvailablePool(): Promise<PoolCard[]> {
  const pool = await getCardPool();
  return pool.filter(c => c.status === 'pool');
}

/**
 * Atomically claim cards for a user from the Firestore pool.
 *
 * All cards are unique: transaction sets status "pool" → "owned" (fails if already owned)
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

        // All cards are unique (1 per sentence) — must be in "pool" status
        if (data.status !== 'pool') {
          throw new Error('already_owned');
        }
        t.update(cardDocRef, {
          status: 'owned',
          current_owner: uid,
        });
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
  const now = new Date().toISOString();
  if (claimed.length > 0) {
    const batch = writeBatch(db);
    for (const card of claimed) {
      const ref = doc(collection(db, 'users', uid, 'inventory'));
      batch.set(ref, {
        ...card,
        obtainedAt: now,
        source: 'gacha',
      });
    }
    await batch.commit();
  }

  // Return cards with obtainedAt so local state sorts correctly
  return claimed.map(c => ({ ...c, obtainedAt: now, source: 'gacha' } as CardData));
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

    // All cards are unique — update current_owner in global pool
    for (const card of requestCards) {
      const cardRef = doc(db, 'cards', card.card_id);
      t.update(cardRef, { current_owner: fromUid });
    }
    for (const card of offerCards) {
      const cardRef = doc(db, 'cards', card.card_id);
      t.update(cardRef, { current_owner: toUid });
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

// ─── Like System ───

export interface CardLike {
  uid: string;
  displayName: string;
  likedAt: string;
}

/** Toggle like on a card. Returns the new liked state. */
export async function toggleCardLike(cardId: string, uid: string, displayName: string): Promise<boolean> {
  const likeRef = doc(db, 'cards', cardId, 'likes', uid);
  const snap = await getDoc(likeRef);

  if (snap.exists()) {
    await deleteDoc(likeRef);
    return false;
  } else {
    await setDoc(likeRef, {
      uid,
      displayName,
      likedAt: new Date().toISOString(),
    });
    return true;
  }
}

/** Get all likes for a card */
export async function getCardLikes(cardId: string): Promise<CardLike[]> {
  const snap = await getDocs(collection(db, 'cards', cardId, 'likes'));
  return snap.docs.map(d => d.data() as CardLike);
}

/** Check if a specific user liked a card */
export async function isCardLiked(cardId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'cards', cardId, 'likes', uid));
  return snap.exists();
}

// ─── Book Metadata ───

export interface BookMetadata {
  book: string;
  originalTitle: string;
  author: string;
  authorBio: string;
  authorWorks: string[];
  authorSignificance: string;
  plotSummary: string;
  chapters: Array<{ id: string; title: string; summary: string }>;
  literaryAnalysis: string;
  themes: string[];
  sourceLang: string;
  gutenbergId: number;
  generatedAt: string;
}

// ─── Collection System ───

export interface FolioCollection {
  id: string;
  uid: string;
  displayName: string;
  title: string;
  cards: [CardData, CardData, CardData];
  cardIds: [string, string, string];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionLike {
  uid: string;
  displayName: string;
  likedAt: string;
}

/** Save or update user's featured collection (one per user) */
export async function saveCollection(
  uid: string, displayName: string, title: string, cards: [CardData, CardData, CardData],
): Promise<string> {
  const cardIds = cards.map(c => c.card_id) as [string, string, string];
  const now = new Date().toISOString();

  // Strip undefined values (Firestore rejects them) and extra inventory fields
  const cleanCards = cards.map(c => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c)) {
      if (v !== undefined && k !== 'docId') clean[k] = v;
    }
    return clean;
  }) as unknown as [CardData, CardData, CardData];

  // Check for existing collection
  const q = query(collection(db, 'collections'), where('uid', '==', uid));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existing = snap.docs[0];
    await updateDoc(existing.ref, { title, cards: cleanCards, cardIds, displayName, updatedAt: now });
    return existing.id;
  }

  const ref = doc(collection(db, 'collections'));
  const data: FolioCollection = {
    id: ref.id, uid, displayName, title, cards: cleanCards, cardIds,
    createdAt: now, updatedAt: now,
  };
  await setDoc(ref, data);
  return ref.id;
}

/** Get a user's featured collection */
export async function getUserCollection(uid: string): Promise<FolioCollection | null> {
  const q = query(collection(db, 'collections'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data() as FolioCollection;
}

/** Delete user's collection */
export async function deleteCollection(collectionId: string): Promise<void> {
  await deleteDoc(doc(db, 'collections', collectionId));
}

/** Toggle like on a collection */
export async function toggleCollectionLike(collectionId: string, uid: string, displayName: string): Promise<boolean> {
  const likeRef = doc(db, 'collections', collectionId, 'likes', uid);
  const snap = await getDoc(likeRef);
  if (snap.exists()) {
    await deleteDoc(likeRef);
    return false;
  }
  await setDoc(likeRef, { uid, displayName, likedAt: new Date().toISOString() });
  return true;
}

/** Get all likes for a collection */
export async function getCollectionLikes(collectionId: string): Promise<CollectionLike[]> {
  const snap = await getDocs(collection(db, 'collections', collectionId, 'likes'));
  return snap.docs.map(d => d.data() as CollectionLike);
}

/** Check if user liked a collection */
export async function isCollectionLiked(collectionId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'collections', collectionId, 'likes', uid));
  return snap.exists();
}

// ─── Book Metadata ───

/** Save book metadata to Firestore */
export async function saveBookMetadata(bookTitle: string, data: BookMetadata): Promise<void> {
  await setDoc(doc(db, 'books', bookTitle), data);
}

/** Get book metadata from Firestore */
export async function getBookMetadata(bookTitle: string): Promise<BookMetadata | null> {
  const snap = await getDoc(doc(db, 'books', bookTitle));
  return snap.exists() ? snap.data() as BookMetadata : null;
}
