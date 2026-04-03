import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import {
  getAllUsers,
  getUserInventoryWithIds,
  getIncomingTrades,
  getOutgoingTrades,
  createTrade as firestoreCreateTrade,
  acceptTrade as firestoreAcceptTrade,
  rejectTrade as firestoreRejectTrade,
  withdrawTrade as firestoreWithdrawTrade,
  type InventoryCard,
  type Trade,
} from '../lib/firestore';
import { type UserProfile } from '../context/AuthContext';
import { type CardData } from '../data/cards';

export interface ExchangeState {
  collectors: UserProfile[];
  selectedCollector: UserProfile | null;
  collectorInventory: InventoryCard[];
  incomingTrades: Trade[];
  outgoingTrades: Trade[];
  loading: boolean;
  loadingInventory: boolean;
  error: string | null;
}

export function useExchange() {
  const { user, userProfile } = useAuth();
  const { refreshInventory, syncPoints, inventory } = useGame();

  const [collectors, setCollectors] = useState<UserProfile[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<UserProfile | null>(null);
  const [collectorInventory, setCollectorInventory] = useState<InventoryCard[]>([]);
  const [incomingTrades, setIncomingTrades] = useState<Trade[]>([]);
  const [outgoingTrades, setOutgoingTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** All other users' cards with owner info, loaded once for Discover/Search */
  const [allOtherCards, setAllOtherCards] = useState<(InventoryCard & { ownerUid: string; ownerName: string })[]>([]);
  const [allCardsLoaded, setAllCardsLoaded] = useState(false);

  // Load collectors + trades on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [users, incoming, outgoing] = await Promise.all([
          getAllUsers(),
          getIncomingTrades(user.uid),
          getOutgoingTrades(user.uid),
        ]);
        // Exclude current user from collectors list
        const others = users.filter(u => u.uid !== user.uid);
        setCollectors(others);
        setIncomingTrades(incoming);
        setOutgoingTrades(outgoing);

        // Load all other users' inventories for Discover/Search
        const allCards: (InventoryCard & { ownerUid: string; ownerName: string })[] = [];
        const inventories = await Promise.all(others.map(u => getUserInventoryWithIds(u.uid)));
        others.forEach((u, i) => {
          inventories[i].forEach(card => {
            allCards.push({ ...card, ownerUid: u.uid, ownerName: u.displayName });
          });
        });
        setAllOtherCards(allCards);
        setAllCardsLoaded(true);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    })();
  }, [user]);

  // Load a collector's inventory
  const selectCollector = useCallback(async (collector: UserProfile | null) => {
    setSelectedCollector(collector);
    if (!collector) {
      setCollectorInventory([]);
      return;
    }
    setLoadingInventory(true);
    try {
      const inv = await getUserInventoryWithIds(collector.uid);
      setCollectorInventory(inv);
    } catch (err: any) {
      setError(err.message);
    }
    setLoadingInventory(false);
  }, []);

  // Propose a trade
  const proposeTrade = useCallback(async (
    toUser: UserProfile,
    requestCards: InventoryCard[],
    offerPoints: number,
    offerCards: InventoryCard[],
  ) => {
    if (!user || !userProfile) return;
    setError(null);

    const trade: Omit<Trade, 'resolvedAt'> = {
      id: '', // will be set by createTrade
      from_user: user.uid,
      from_user_name: userProfile.displayName,
      to_user: toUser.uid,
      to_user_name: toUser.displayName,
      offer_points: offerPoints,
      offer_cards: offerCards.map(c => ({
        card_id: c.card_id,
        book: c.book,
        grade: c.grade,
        original: c.original,
        translation: c.translation,
        chapter: c.chapter,
        author: c.author,
      } as CardData)),
      offer_card_doc_ids: offerCards.map(c => c.docId),
      request_cards: requestCards.map(c => ({
        card_id: c.card_id,
        book: c.book,
        grade: c.grade,
        original: c.original,
        translation: c.translation,
        chapter: c.chapter,
        author: c.author,
      } as CardData)),
      request_card_doc_ids: requestCards.map(c => c.docId),
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      await firestoreCreateTrade(trade);
      // Refresh outgoing trades
      const outgoing = await getOutgoingTrades(user.uid);
      setOutgoingTrades(outgoing);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, userProfile]);

  // Accept a trade
  const handleAcceptTrade = useCallback(async (tradeId: string) => {
    if (!user) return;
    setError(null);
    try {
      await firestoreAcceptTrade(tradeId, user.uid);
      // Refresh everything
      const [incoming, outgoing] = await Promise.all([
        getIncomingTrades(user.uid),
        getOutgoingTrades(user.uid),
      ]);
      setIncomingTrades(incoming);
      setOutgoingTrades(outgoing);
      await refreshInventory();
      // Sync points from Firestore
      const users = await getAllUsers();
      const me = users.find(u => u.uid === user.uid);
      if (me) syncPoints(me.points);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, refreshInventory, syncPoints]);

  // Reject a trade
  const handleRejectTrade = useCallback(async (tradeId: string) => {
    if (!user) return;
    setError(null);
    try {
      await firestoreRejectTrade(tradeId, user.uid);
      setIncomingTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'rejected' } : t));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Withdraw a trade
  const handleWithdrawTrade = useCallback(async (tradeId: string) => {
    if (!user) return;
    setError(null);
    try {
      await firestoreWithdrawTrade(tradeId, user.uid);
      setOutgoingTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'rejected' } : t));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Refresh trades
  const refreshTrades = useCallback(async () => {
    if (!user) return;
    const [incoming, outgoing] = await Promise.all([
      getIncomingTrades(user.uid),
      getOutgoingTrades(user.uid),
    ]);
    setIncomingTrades(incoming);
    setOutgoingTrades(outgoing);
  }, [user]);

  const pendingIncomingCount = incomingTrades.filter(t => t.status === 'pending').length;

  return {
    collectors,
    selectedCollector,
    collectorInventory,
    incomingTrades,
    outgoingTrades,
    loading,
    loadingInventory,
    error,
    pendingIncomingCount,
    allOtherCards,
    allCardsLoaded,
    selectCollector,
    proposeTrade,
    handleAcceptTrade,
    handleRejectTrade,
    handleWithdrawTrade,
    refreshTrades,
  };
}
