import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { type CardData } from '../data/cards';
import { drawMultiple } from '../lib/gacha';
import { getUserInventory, addCardsToInventory, updateUserPoints, updatePityCounter } from '../lib/firestore';
import { useAuth } from './AuthContext';

interface GameState {
  inventory: CardData[];
  points: number;
  pityCounter: number;
  loading: boolean;
}

type GameAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'INIT'; inventory: CardData[]; points: number; pityCounter: number }
  | { type: 'ADD_CARDS'; cards: CardData[] }
  | { type: 'SET_POINTS'; points: number }
  | { type: 'SET_PITY'; pityCounter: number };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'INIT':
      return { inventory: action.inventory, points: action.points, pityCounter: action.pityCounter, loading: false };
    case 'ADD_CARDS':
      return { ...state, inventory: [...state.inventory, ...action.cards] };
    case 'SET_POINTS':
      return { ...state, points: action.points };
    case 'SET_PITY':
      return { ...state, pityCounter: action.pityCounter };
    default:
      return state;
  }
}

interface GameContextType extends GameState {
  drawCards: (count: number, cost: number, guarantee?: CardData['grade']) => Promise<CardData[]>;
  spendPoints: (amount: number) => Promise<boolean>;
  addPoints: (amount: number) => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, {
    inventory: [],
    points: 0,
    pityCounter: 0,
    loading: true,
  });

  // Load inventory when user is authenticated
  useEffect(() => {
    if (!user || !userProfile) {
      dispatch({ type: 'SET_LOADING', loading: false });
      return;
    }
    (async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      const inventory = await getUserInventory(user.uid);
      dispatch({
        type: 'INIT',
        inventory,
        points: userProfile.points,
        pityCounter: (userProfile as any).pityCounter || 0,
      });
    })();
  }, [user, userProfile]);

  const drawCards = async (count: number, cost: number, guarantee?: CardData['grade']): Promise<CardData[]> => {
    if (!user) return [];
    if (state.points < cost) return [];

    const newPoints = state.points - cost;
    const { cards, newPity } = drawMultiple(count, state.pityCounter, guarantee);

    // Update local state immediately for responsiveness
    dispatch({ type: 'SET_POINTS', points: newPoints });
    dispatch({ type: 'SET_PITY', pityCounter: newPity });
    dispatch({ type: 'ADD_CARDS', cards });

    // Persist to Firestore in background
    await Promise.all([
      addCardsToInventory(user.uid, cards),
      updateUserPoints(user.uid, newPoints),
      updatePityCounter(user.uid, newPity),
    ]);

    return cards;
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
