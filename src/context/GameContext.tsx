import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { type CardData } from '../data/cards';
import { drawFromPool, type DrawOptions } from '../lib/gacha';
import {
  getUserInventory, getUserInventoryWithIds, updateUserPoints, updatePityCounter,
  claimCards, getAvailablePool, type PoolCard, type InventoryCard,
} from '../lib/firestore';
import { useAuth } from './AuthContext';

interface GameState {
  inventory: CardData[];
  points: number;
  pityCounter: number;
  loading: boolean;
  /** Available cards in the Firestore pool (drawable) */
  pool: PoolCard[];
}

type GameAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'INIT'; inventory: CardData[]; points: number; pityCounter: number; pool: PoolCard[] }
  | { type: 'ADD_CARDS'; cards: CardData[] }
  | { type: 'REMOVE_CARDS'; docIds: string[] }
  | { type: 'SET_POINTS'; points: number }
  | { type: 'SET_PITY'; pityCounter: number }
  | { type: 'REMOVE_FROM_POOL'; cardIds: string[] };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'INIT':
      return { inventory: action.inventory, points: action.points, pityCounter: action.pityCounter, pool: action.pool, loading: false };
    case 'ADD_CARDS':
      return { ...state, inventory: [...state.inventory, ...action.cards] };
    case 'REMOVE_CARDS': {
      const removeIds = new Set(action.docIds);
      return { ...state, inventory: state.inventory.filter(c => !removeIds.has((c as any).docId)) };
    }
    case 'SET_POINTS':
      return { ...state, points: action.points };
    case 'SET_PITY':
      return { ...state, pityCounter: action.pityCounter };
    case 'REMOVE_FROM_POOL': {
      const ids = new Set(action.cardIds);
      return {
        ...state,
        pool: state.pool.filter(c => !ids.has(c.card_id)),
      };
    }
    default:
      return state;
  }
}

interface GameContextType extends GameState {
  drawCards: (count: number, cost: number, guarantee?: CardData['grade'], options?: DrawOptions) => Promise<CardData[]>;
  spendPoints: (amount: number) => Promise<boolean>;
  addPoints: (amount: number) => Promise<void>;
  /** Sync local points to a known-correct total (no Firestore write) */
  syncPoints: (total: number) => void;
  /** Reload inventory from Firestore (e.g. after a trade) */
  refreshInventory: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, userProfile } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, {
    inventory: [],
    points: 0,
    pityCounter: 0,
    loading: true,
    pool: [],
  });

  // Load inventory + available pool when user is authenticated
  useEffect(() => {
    if (!user || !userProfile) {
      dispatch({ type: 'SET_LOADING', loading: false });
      return;
    }
    (async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      const [inventory, pool] = await Promise.all([
        getUserInventoryWithIds(user.uid),
        getAvailablePool(),
      ]);
      dispatch({
        type: 'INIT',
        inventory,
        points: userProfile.points,
        pityCounter: (userProfile as any).pityCounter || 0,
        pool,
      });
    })();
  }, [user, userProfile]);

  const drawCards = async (
    count: number,
    cost: number,
    guarantee?: CardData['grade'],
    options?: DrawOptions,
  ): Promise<CardData[]> => {
    if (!user) return [];
    if (state.points < cost) return [];

    const newPoints = state.points - cost;

    // Draw from the Firestore-backed pool
    const { cards, newPity } = drawFromPool(state.pool, count, state.pityCounter, guarantee, options);

    if (cards.length === 0) return [];

    // Update points & pity immediately for responsiveness
    dispatch({ type: 'SET_POINTS', points: newPoints });
    dispatch({ type: 'SET_PITY', pityCounter: newPity });

    // Atomically claim cards in Firestore (pool → owned)
    const claimed = await claimCards(user.uid, cards);

    // Update local state
    dispatch({ type: 'ADD_CARDS', cards: claimed });
    dispatch({
      type: 'REMOVE_FROM_POOL',
      cardIds: claimed.map(c => c.card_id),
    });

    // Persist points and pity (fire-and-forget — local state already updated)
    updateUserPoints(user.uid, newPoints);
    updatePityCounter(user.uid, newPity);

    return claimed;
  };

  const spendPoints = async (amount: number): Promise<boolean> => {
    if (!user || state.points < amount) return false;
    const newPoints = state.points - amount;
    dispatch({ type: 'SET_POINTS', points: newPoints });
    await updateUserPoints(user.uid, newPoints);
    return true;
  };

  const addPoints = async (amount: number): Promise<void> => {
    if (!user) return;
    const newPoints = state.points + amount;
    dispatch({ type: 'SET_POINTS', points: newPoints });
    await updateUserPoints(user.uid, newPoints);
  };

  const syncPoints = (total: number) => {
    dispatch({ type: 'SET_POINTS', points: total });
  };

  const refreshInventory = async () => {
    if (!user) return;
    const inventory = await getUserInventoryWithIds(user.uid);
    dispatch({ type: 'INIT', inventory, points: state.points, pityCounter: state.pityCounter, pool: state.pool });
  };

  return (
    <GameContext.Provider value={{ ...state, drawCards, spendPoints, addPoints, syncPoints, refreshInventory }}>
      {children}
    </GameContext.Provider>
  );
}
