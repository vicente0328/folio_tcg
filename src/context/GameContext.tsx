import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { type CardData } from '../data/cards';
import { drawMultiple, type DrawOptions } from '../lib/gacha';
import { getUserInventory, updateUserPoints, updatePityCounter, claimCards, getOwnedCardIds } from '../lib/firestore';
import { useAuth } from './AuthContext';

interface GameState {
  inventory: CardData[];
  points: number;
  pityCounter: number;
  loading: boolean;
  /** Globally owned unique card IDs (Rare+) — prevents drawing already-claimed cards */
  ownedCardIds: Set<string>;
}

type GameAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'INIT'; inventory: CardData[]; points: number; pityCounter: number; ownedCardIds: Set<string> }
  | { type: 'ADD_CARDS'; cards: CardData[] }
  | { type: 'SET_POINTS'; points: number }
  | { type: 'SET_PITY'; pityCounter: number }
  | { type: 'ADD_OWNED_IDS'; cardIds: string[] };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'INIT':
      return { inventory: action.inventory, points: action.points, pityCounter: action.pityCounter, ownedCardIds: action.ownedCardIds, loading: false };
    case 'ADD_CARDS':
      return { ...state, inventory: [...state.inventory, ...action.cards] };
    case 'SET_POINTS':
      return { ...state, points: action.points };
    case 'SET_PITY':
      return { ...state, pityCounter: action.pityCounter };
    case 'ADD_OWNED_IDS': {
      const next = new Set(state.ownedCardIds);
      for (const id of action.cardIds) next.add(id);
      return { ...state, ownedCardIds: next };
    }
    default:
      return state;
  }
}

interface GameContextType extends Omit<GameState, 'ownedCardIds'> {
  drawCards: (count: number, cost: number, guarantee?: CardData['grade'], options?: DrawOptions) => Promise<CardData[]>;
  spendPoints: (amount: number) => Promise<boolean>;
  addPoints: (amount: number) => Promise<void>;
  ownedCardIds: Set<string>;
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
    ownedCardIds: new Set<string>(),
  });

  // Load inventory + global owned cards when user is authenticated
  useEffect(() => {
    if (!user || !userProfile) {
      dispatch({ type: 'SET_LOADING', loading: false });
      return;
    }
    (async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      const [inventory, ownedCardIds] = await Promise.all([
        getUserInventory(user.uid),
        getOwnedCardIds(),
      ]);
      dispatch({
        type: 'INIT',
        inventory,
        points: userProfile.points,
        pityCounter: (userProfile as any).pityCounter || 0,
        ownedCardIds,
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

    // Draw with scarcity: pass globally owned card IDs
    const drawOptions: DrawOptions = {
      ...options,
      ownedCardIds: state.ownedCardIds,
    };
    const { cards, newPity } = drawMultiple(count, state.pityCounter, guarantee, drawOptions);

    if (cards.length === 0) return [];

    // Update local state immediately for responsiveness
    dispatch({ type: 'SET_POINTS', points: newPoints });
    dispatch({ type: 'SET_PITY', pityCounter: newPity });

    // Atomically claim cards (Rare+ get global ownership)
    const claimed = await claimCards(user.uid, cards);

    // Update local state with actually claimed cards
    dispatch({ type: 'ADD_CARDS', cards: claimed });
    dispatch({
      type: 'ADD_OWNED_IDS',
      cardIds: claimed.filter(c => c.grade !== 'Common').map(c => c.card_id),
    });

    // Persist points and pity
    await Promise.all([
      updateUserPoints(user.uid, newPoints),
      updatePityCounter(user.uid, newPity),
    ]);

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

  return (
    <GameContext.Provider value={{ ...state, drawCards, spendPoints, addPoints }}>
      {children}
    </GameContext.Provider>
  );
}
