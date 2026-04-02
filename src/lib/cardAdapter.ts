import { type CardData } from '../data/cards';

export interface UICard {
  id: number;
  cardId: string;
  author: string;
  work: string;
  originalQuote: string;
  translatedQuote: string;
  context: string;
  chapter: string;
  rarity: string;
}

/** Deterministic numeric hash from card_id string */
function hashId(cardId: string): number {
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    hash = ((hash << 5) - hash) + cardId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Between the Lines commentary data
// Maps card_id to commentary text. Cards without entries show chapter info.
const BTL_DATA: Record<string, string> = {
  // Legendary cards — each has a unique BTL
  'AE-L01': "소설의 첫 문장이자 문학사에서 가장 유명한 오프닝 중 하나. '아니면 어제였는지도 모르겠다'에서 드러나는 뫼르소의 무관심은 사회가 요구하는 감정의 형식을 거부하는 부조리한 자유의 선언이다.",
  'CC-L01': "라스콜니코프가 자신의 범죄를 정당화하려는 '비범인 이론'의 핵심. 도스토예프스키는 이 문장을 통해 인간 이성의 오만이 어떻게 자기 파괴로 이어지는지 보여준다.",
  'AK-L01': "러시아 문학 역사상 가장 유명한 첫 문장. 톨스토이는 이 단순한 관찰로 소설 전체의 주제를 압축한다 — 행복은 평범하지만, 불행은 저마다 고유한 서사를 가진다.",
  'LM-L01': "장발장이 미리엘 주교의 은촌대를 훔친 후 돌려받는 장면. 위고는 이 순간을 통해 인간 구원의 가능성을 선언한다 — 벌이 아닌 자비가 사람을 변화시킨다.",
  'DM-L01': "소설의 첫 문장이자 싱클레어의 자아 탐색 여정의 출발점. 헤세는 '두 세계'의 대립을 통해 모든 인간이 겪는 내면과 외면의 분열을 상징한다.",
};

/** Convert backend CardData to the shape UI components expect */
export function toUICard(card: CardData, index?: number): UICard {
  const btl = BTL_DATA[card.card_id];
  const context = btl || `${card.book} · ${card.chapter}`;

  return {
    id: index ?? hashId(card.card_id),
    cardId: card.card_id,
    author: card.author,
    work: card.book,
    originalQuote: card.original,
    translatedQuote: card.translation,
    context,
    chapter: card.chapter,
    rarity: card.grade,
  };
}
