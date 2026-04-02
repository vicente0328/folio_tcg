import { type CardData } from './cards';

export interface PackDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  cardCount: number;
  /** Minimum guaranteed rarity in this pack */
  guaranteeMinRarity?: CardData['grade'];
  /** Filter to restrict card pool */
  filter?: (card: CardData) => boolean;
  /** Custom rarity weights */
  rarityWeights?: Record<string, number>;
  /** Visual styling */
  color: string;
  accent: string;
}

// ─── Pack Categories ───

const BOOK_PACKS: PackDefinition[] = [
  {
    id: 'book-stranger',
    name: "L'Étranger",
    description: '이방인 — Albert Camus의 부조리한 세계.',
    price: 100,
    cardCount: 5,
    filter: (c) => c.book === '이방인',
    color: 'bg-brand-orange',
    accent: 'border-brand-brown/20',
  },
  {
    id: 'book-crime',
    name: 'Преступление и наказание',
    description: '죄와 벌 — Достоевский의 심리적 심연.',
    price: 100,
    cardCount: 5,
    filter: (c) => c.book === '죄와 벌',
    color: 'bg-[#3D2B1F]',
    accent: 'border-brand-gold/30',
  },
  {
    id: 'book-anna',
    name: 'Анна Каренина',
    description: '안나 카레니나 — Толстой의 사랑과 사회.',
    price: 100,
    cardCount: 5,
    filter: (c) => c.book === '안나 카레니나',
    color: 'bg-[#4A3040]',
    accent: 'border-brand-cream/20',
  },
  {
    id: 'book-miserables',
    name: 'Les Misérables',
    description: '레미제라블 — Victor Hugo의 구원과 혁명.',
    price: 100,
    cardCount: 5,
    filter: (c) => c.book === '레미제라블',
    color: 'bg-[#2C3E50]',
    accent: 'border-brand-cream/20',
  },
  {
    id: 'book-demian',
    name: 'Demian',
    description: '데미안 — Hermann Hesse의 자아 탐색.',
    price: 100,
    cardCount: 5,
    filter: (c) => c.book === '데미안',
    color: 'bg-[#4A4032]',
    accent: 'border-brand-gold/20',
  },
];

const REGION_PACKS: PackDefinition[] = [
  {
    id: 'region-russia',
    name: 'Russian Masters',
    description: '러시아 문학 — Достоевский, Толстой의 영혼.',
    price: 150,
    cardCount: 5,
    filter: (c) => c.book === '죄와 벌' || c.book === '안나 카레니나',
    rarityWeights: { Common: 50, Rare: 30, Epic: 17, Legendary: 3 },
    color: 'bg-brand-dark',
    accent: 'border-brand-gold/30',
  },
  {
    id: 'region-france',
    name: 'French Elegance',
    description: '프랑스 문학 — Camus, Hugo의 광휘.',
    price: 150,
    cardCount: 5,
    filter: (c) => c.book === '이방인' || c.book === '레미제라블',
    rarityWeights: { Common: 50, Rare: 30, Epic: 17, Legendary: 3 },
    color: 'bg-[#2C3040]',
    accent: 'border-brand-cream/20',
  },
  {
    id: 'region-german',
    name: 'German Depth',
    description: '독일 문학 — Hesse의 내면 여정.',
    price: 150,
    cardCount: 5,
    filter: (c) => c.book === '데미안',
    rarityWeights: { Common: 50, Rare: 30, Epic: 17, Legendary: 3 },
    color: 'bg-[#3A3A2A]',
    accent: 'border-brand-gold/20',
  },
];

const SPECIAL_PACKS: PackDefinition[] = [
  {
    id: 'special-premiere',
    name: 'Première Edition',
    description: 'Season 1 전 작품이 포함된 기본 팩.',
    price: 500,
    cardCount: 5,
    color: 'bg-brand-orange',
    accent: 'border-brand-brown/20',
  },
  {
    id: 'special-legendary',
    name: 'Legendary Guarantee',
    description: 'Epic 이상 1장이 보장되는 프리미엄 팩.',
    price: 800,
    cardCount: 5,
    guaranteeMinRarity: 'Epic',
    rarityWeights: { Common: 30, Rare: 35, Epic: 30, Legendary: 5 },
    color: 'bg-gradient-to-br from-brand-gold to-[#8B7340]',
    accent: 'border-brand-gold/40',
  },
];

export const ALL_PACKS: PackDefinition[] = [
  ...SPECIAL_PACKS,
  ...BOOK_PACKS,
  ...REGION_PACKS,
];

export const PACK_CATEGORIES = [
  { label: 'Special', packs: SPECIAL_PACKS },
  { label: 'By Novel', packs: BOOK_PACKS },
  { label: 'By Region', packs: REGION_PACKS },
] as const;

// ─── Daily Free Pack ───
export const DAILY_FREE_PACK: PackDefinition = {
  id: 'daily-free',
  name: 'Daily Encounter',
  description: '매일 무료로 열 수 있는 카드 팩.',
  price: 0,
  cardCount: 5,
  color: 'bg-brand-orange',
  accent: 'border-brand-brown/20',
};
