import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth, type UserProfile } from './AuthContext';
import { useGame } from './GameContext';
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
import { type CardData } from '../data/cards';

export interface ExchangeContextType {
  collectors: UserProfile[];
  selectedCollector: UserProfile | null;
  collectorInventory: InventoryCard[];
  incomingTrades: Trade[];
  outgoingTrades: Trade[];
  loading: boolean;
  loadingInventory: boolean;
  error: string | null;
  pendingIncomingCount: number;
  allOtherCards: (InventoryCard & { ownerUid: string; ownerName: string })[];
  allCardsLoaded: boolean;
  selectCollector: (collector: UserProfile | null) => Promise<void>;
  proposeTrade: (toUser: UserProfile, requestCards: InventoryCard[], offerPoints: number, offerCards: InventoryCard[]) => Promise<void>;
  handleAcceptTrade: (tradeId: string) => Promise<void>;
  handleRejectTrade: (tradeId: string) => Promise<void>;
  handleWithdrawTrade: (tradeId: string) => Promise<void>;
  refreshTrades: () => Promise<void>;
}

const ExchangeContext = createContext<ExchangeContextType | null>(null);

export function useExchange() {
  const ctx = useContext(ExchangeContext);
  if (!ctx) throw new Error('useExchange must be used within ExchangeProvider');
  return ctx;
}

export function ExchangeProvider({ children }: { children: ReactNode }) {
  const { user, userProfile } = useAuth();
  const { refreshInventory, syncPoints } = useGame();

  const [collectors, setCollectors] = useState<UserProfile[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<UserProfile | null>(null);
  const [collectorInventory, setCollectorInventory] = useState<InventoryCard[]>([]);
  const [incomingTrades, setIncomingTrades] = useState<Trade[]>([]);
  const [outgoingTrades, setOutgoingTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const others = users.filter(u => u.uid !== user.uid);
        setCollectors(others);
        setIncomingTrades(incoming);
        setOutgoingTrades(outgoing);

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

  const proposeTrade = useCallback(async (
    toUser: UserProfile,
    requestCards: InventoryCard[],
    offerPoints: number,
    offerCards: InventoryCard[],
  ) => {
    if (!user || !userProfile) return;
    setError(null);

    const trade: Omit<Trade, 'resolvedAt'> = {
      id: '',
      from_user: user.uid,
      from_user_name: userProfile.displayName,
      to_user: toUser.uid,
      to_user_name: toUser.displayName,
      offer_points: offerPoints,
      offer_cards: offerCards.map(c => ({
        card_id: c.card_id, book: c.book, grade: c.grade,
        original: c.original, translation: c.translation,
        chapter: c.chapter, author: c.author,
      } as CardData)),
      offer_card_doc_ids: offerCards.map(c => c.docId),
      request_cards: requestCards.map(c => ({
        card_id: c.card_id, book: c.book, grade: c.grade,
        original: c.original, translation: c.translation,
        chapter: c.chapter, author: c.author,
      } as CardData)),
      request_card_doc_ids: requestCards.map(c => c.docId),
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      await firestoreCreateTrade(trade);
      const outgoing = await getOutgoingTrades(user.uid);
      setOutgoingTrades(outgoing);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, userProfile]);

  const handleAcceptTrade = useCallback(async (tradeId: string) => {
    if (!user) return;
    setError(null);
    try {
      await firestoreAcceptTrade(tradeId, user.uid);
    } catch (err: any) {
      const msg = err.message;
      if (msg === 'card_no_longer_owned') {
        setError('이 카드는 이미 다른 거래로 이동되었습니다.');
      } else if (msg === 'trade_not_pending') {
        setError('이 거래는 이미 처리되었습니다.');
      } else if (msg === 'insufficient_points') {
        setError('상대방의 포인트가 부족합니다.');
      } else {
        setError(msg);
      }
      const [incoming, outgoing] = await Promise.all([
        getIncomingTrades(user.uid),
        getOutgoingTrades(user.uid),
      ]);
      setIncomingTrades(incoming);
      setOutgoingTrades(outgoing);
      throw err;
    }
    // Refresh everything after successful accept
    const [incoming, outgoing] = await Promise.all([
      getIncomingTrades(user.uid),
      getOutgoingTrades(user.uid),
    ]);
    setIncomingTrades(incoming);
    setOutgoingTrades(outgoing);
    await refreshInventory();
    const users = await getAllUsers();
    const me = users.find(u => u.uid === user.uid);
    if (me) syncPoints(me.points);
    // Reload other users' cards to reflect ownership changes
    const others = collectors.filter(u => u.uid !== user.uid);
    const allCards: (InventoryCard & { ownerUid: string; ownerName: string })[] = [];
    const inventories = await Promise.all(others.map(u => getUserInventoryWithIds(u.uid)));
    others.forEach((u, i) => {
      inventories[i].forEach(card => {
        allCards.push({ ...card, ownerUid: u.uid, ownerName: u.displayName });
      });
    });
    setAllOtherCards(allCards);
  }, [user, refreshInventory, syncPoints, collectors]);

  const handleRejectTrade = useCallback(async (tradeId: string) => {
    if (!user) return;
    setError(null);
    try {
      await firestoreRejectTrade(tradeId, user.uid);
      setIncomingTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'rejected' as const, resolvedAt: new Date() } : t));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const handleWithdrawTrade = useCallback(async (tradeId: string) => {
    if (!user) return;
    setError(null);
    try {
      await firestoreWithdrawTrade(tradeId, user.uid);
      setOutgoingTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'rejected' as const, resolvedAt: new Date() } : t));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

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

  return (
    <ExchangeContext.Provider value={{
      collectors, selectedCollector, collectorInventory,
      incomingTrades, outgoingTrades,
      loading, loadingInventory, error,
      pendingIncomingCount, allOtherCards, allCardsLoaded,
      selectCollector, proposeTrade,
      handleAcceptTrade, handleRejectTrade, handleWithdrawTrade,
      refreshTrades,
    }}>
      {children}
    </ExchangeContext.Provider>
  );
}
