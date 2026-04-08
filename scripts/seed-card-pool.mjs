/**
 * Seed all 175 cards into Firestore `cards` collection.
 * Each card gets: status "pool", current_owner null, max_copies, issued_copies 0
 *
 * All cards: max_copies = 1 (every card is globally unique — one sentence, one card)
 *
 * Usage: node scripts/seed-card-pool.mjs
 *
 * Safe to re-run: skips cards that already exist (won't overwrite owned cards).
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: 'AIzaSyA6ko15QyhueLIUxfpgGTv59LNP5qnBsBI',
  authDomain: 'folio-tcg.firebaseapp.com',
  projectId: 'folio-tcg',
  storageBucket: 'folio-tcg.firebasestorage.app',
  messagingSenderId: '1071968392780',
  appId: '1:1071968392780:web:743dab6c3f575e24f7c6e9',
};

// Every card is unique — one sentence, one owner

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Parse cards from the TypeScript source file
function parseCards() {
  const content = fs.readFileSync('src/data/cards.ts', 'utf8');
  const cards = [];
  // Match each card object literal
  const regex = /\{\s*book:\s*"([^"]+)",\s*card_id:\s*"([^"]+)",\s*grade:\s*"([^"]+)",\s*original:\s*"((?:[^"\\]|\\.)*)"\s*,\s*translation:\s*"((?:[^"\\]|\\.)*)"\s*,\s*chapter:\s*"([^"]+)"\s*,\s*author:\s*"([^"]+)"\s*\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      book: match[1],
      card_id: match[2],
      grade: match[3],
      original: match[4].replace(/\\"/g, '"'),
      translation: match[5].replace(/\\"/g, '"'),
      chapter: match[6],
      author: match[7],
    });
  }
  return cards;
}

async function main() {
  // Sign in as admin to have write permissions
  console.log('Signing in as admin...');
  await signInWithEmailAndPassword(auth, 'admin@folio.com', 'admin123');
  console.log('Authenticated.\n');

  const cards = parseCards();
  console.log(`Parsed ${cards.length} cards from cards.ts\n`);

  if (cards.length === 0) {
    console.error('No cards parsed! Check the regex.');
    process.exit(1);
  }

  // Check what already exists
  const existingSnap = await getDocs(collection(db, 'cards'));
  const existingIds = new Set(existingSnap.docs.map(d => d.id));
  console.log(`${existingIds.size} cards already in Firestore\n`);

  let created = 0;
  let skipped = 0;

  for (const card of cards) {
    if (existingIds.has(card.card_id)) {
      skipped++;
      continue;
    }

    const maxCopies = 1;

    const cardDoc = {
      id: card.card_id,
      card_id: card.card_id,
      book: card.book,
      grade: card.grade,
      original: card.original,
      translation: card.translation,
      chapter: card.chapter,
      author: card.author,
      status: 'pool',
      current_owner: null,
      max_copies: maxCopies,
      issued_copies: 0,
    };

    await setDoc(doc(db, 'cards', card.card_id), cardDoc);
    created++;
    process.stdout.write(`\r  Seeded: ${created} | Skipped: ${skipped}`);
  }

  console.log(`\n\nDone! Created: ${created}, Skipped: ${skipped}`);
  console.log(`Total in pool: ${existingIds.size + created}`);

  // Summary by grade
  const grades = {};
  for (const card of cards) {
    grades[card.grade] = (grades[card.grade] || 0) + 1;
  }
  console.log('\nBy grade:', grades);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
