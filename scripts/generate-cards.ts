/**
 * Card Generator — Main CLI Script
 *
 * Generates FOLIO TCG cards from a book using a 5-stage pipeline:
 *   1. Source text acquisition (Gutenberg / local file)
 *   2. Quote selection via Gemini AI
 *   3. Verification against source text
 *   4. Translation + BTL commentary generation
 *   5. Card ID assignment + Firestore seeding
 *
 * Usage:
 *   npx tsx scripts/generate-cards.ts \
 *     --book "위대한 개츠비" \
 *     --author "F. Scott Fitzgerald" \
 *     --lang en \
 *     --gutenberg-id 64317 \
 *     --prefix GG \
 *     --count 100 \
 *     --dry-run
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { fetchGutenbergText, readLocalText } from './lib/source-text.js';
import { selectQuotes } from './lib/gemini-quotes.js';
import { verifyQuotes } from './lib/verify-quotes.js';
import { enrichQuotes } from './lib/gemini-enrich.js';
import { assignCardIds, validatePrefix, type CardRecord } from './lib/card-ids.js';

// ─── CLI Argument Parsing ───

interface Args {
  book: string;
  author: string;
  lang: string;
  gutenbergId?: number;
  sourceFile?: string;
  prefix: string;
  count: number;
  dryRun: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (key === 'dry-run') {
        flags['dryRun'] = 'true';
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = args[i + 1];
        i++;
      }
    }
  }

  if (!flags.book || !flags.author || !flags.lang || !flags.prefix) {
    console.error(`
Usage: npx tsx scripts/generate-cards.ts [options]

Required:
  --book <title>          Korean book title (displayed on cards)
  --author <name>         Author name (displayed on cards)
  --lang <code>           Source language code (en/fr/ru/de)
  --prefix <XX>           2-letter card ID prefix

Source (one required):
  --gutenberg-id <id>     Project Gutenberg book ID
  --source-file <path>    Local text file path

Optional:
  --count <n>             Target card count (default: 100)
  --dry-run               Generate & verify without writing to Firestore
`);
    process.exit(1);
  }

  if (!flags.gutenbergId && !flags.sourceFile) {
    console.error('Error: Either --gutenberg-id or --source-file is required.');
    process.exit(1);
  }

  return {
    book: flags.book,
    author: flags.author,
    lang: flags.lang,
    gutenbergId: flags.gutenbergId ? parseInt(flags.gutenbergId) : undefined,
    sourceFile: flags.sourceFile,
    prefix: flags.prefix.toUpperCase(),
    count: parseInt(flags.count || '100'),
    dryRun: flags.dryRun === 'true',
  };
}

// ─── Firebase Setup ───

const firebaseConfig = {
  apiKey: 'AIzaSyA6ko15QyhueLIUxfpgGTv59LNP5qnBsBI',
  authDomain: 'folio-tcg.firebaseapp.com',
  projectId: 'folio-tcg',
  storageBucket: 'folio-tcg.firebasestorage.app',
  messagingSenderId: '1071968392780',
  appId: '1:1071968392780:web:743dab6c3f575e24f7c6e9',
};

async function seedToFirestore(cards: CardRecord[]): Promise<{ created: number; skipped: number }> {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('\n📦 Seeding to Firestore...');
  console.log('  Authenticating as admin...');
  await signInWithEmailAndPassword(auth, 'admin@folio.com', 'admin123');

  // Check existing cards
  const existingSnap = await getDocs(collection(db, 'cards'));
  const existingIds = new Set(existingSnap.docs.map(d => d.id));

  let created = 0;
  let skipped = 0;

  for (const card of cards) {
    if (existingIds.has(card.card_id)) {
      skipped++;
      continue;
    }

    await setDoc(doc(db, 'cards', card.card_id), {
      id: card.card_id,
      card_id: card.card_id,
      book: card.book,
      grade: card.grade,
      original: card.original,
      translation: card.translation,
      chapter: card.chapter,
      author: card.author,
      btl: card.btl,
      source_lang: card.source_lang,
      status: 'pool',
      current_owner: null,
      max_copies: 1,
      issued_copies: 0,
    });
    created++;
    process.stdout.write(`\r  Seeded: ${created} | Skipped: ${skipped}`);
  }

  console.log('');
  return { created, skipped };
}

// ─── Main Pipeline ───

async function main() {
  const args = parseArgs();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    console.error('Error: GEMINI_API_KEY not set in environment or .env file.');
    process.exit(1);
  }

  // Validate prefix
  const prefixCheck = validatePrefix(args.prefix);
  if (!prefixCheck.valid) {
    console.error(`Error: ${prefixCheck.reason}`);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════');
  console.log('  FOLIO Card Generator');
  console.log('═══════════════════════════════════════════');
  console.log(`  Book:    ${args.book}`);
  console.log(`  Author:  ${args.author}`);
  console.log(`  Lang:    ${args.lang}`);
  console.log(`  Prefix:  ${args.prefix}`);
  console.log(`  Target:  ${args.count} cards`);
  console.log(`  Mode:    ${args.dryRun ? 'DRY RUN' : 'LIVE (will write to Firestore)'}`);
  console.log('═══════════════════════════════════════════\n');

  // ── Stage 1: Source Text ──
  console.log('📖 Stage 1: Acquiring source text...');
  let sourceText: string;
  if (args.gutenbergId) {
    sourceText = await fetchGutenbergText(args.gutenbergId);
  } else {
    sourceText = await readLocalText(args.sourceFile!);
  }
  console.log(`  ✓ Source text: ${sourceText.length.toLocaleString()} characters\n`);

  // ── Stage 2: Quote Selection ──
  console.log('🔍 Stage 2: Selecting quotes via Gemini...');
  const rawQuotes = await selectQuotes(
    geminiKey, sourceText, args.book, args.author, args.lang, args.count,
  );
  console.log(`  ✓ ${rawQuotes.length} candidate quotes selected\n`);

  // ── Stage 3: Verification ──
  console.log('✅ Stage 3: Verifying quotes against source text...');
  const { verified, rejected } = verifyQuotes(rawQuotes, sourceText);
  console.log(`  ✓ Verified: ${verified.length} | Rejected: ${rejected.length}`);

  if (rejected.length > 0) {
    console.log('  Rejected quotes:');
    for (const r of rejected.slice(0, 10)) {
      console.log(`    ✗ "${r.quote.original.slice(0, 60)}..." — ${r.reason}`);
    }
    if (rejected.length > 10) {
      console.log(`    ... and ${rejected.length - 10} more`);
    }
  }

  if (verified.length < args.count) {
    console.log(`\n  ⚠ Only ${verified.length} verified quotes (target: ${args.count})`);
    console.log('  Proceeding with available quotes...');
  }
  console.log('');

  // ── Stage 4: Translation + BTL ──
  console.log('🌏 Stage 4: Translating and generating BTL commentary...');
  const { enriched, warnings } = await enrichQuotes(
    geminiKey, verified, args.book, args.author, args.lang,
  );

  if (warnings.length > 0) {
    console.log('  Warnings:');
    for (const w of warnings) {
      console.log(`    ⚠ ${w}`);
    }
  }
  console.log('');

  // ── Stage 5: Card ID Assignment ──
  console.log('🃏 Stage 5: Assigning card IDs and enforcing grade distribution...');
  const cards = assignCardIds(
    enriched, args.prefix, args.book, args.author, args.lang,
    Math.min(args.count, enriched.length),
  );

  // Grade summary
  const gradeCounts: Record<string, number> = { Legendary: 0, Epic: 0, Rare: 0, Common: 0 };
  for (const c of cards) gradeCounts[c.grade]++;
  console.log(`  ✓ ${cards.length} cards generated`);
  console.log(`    Legendary: ${gradeCounts.Legendary} | Epic: ${gradeCounts.Epic} | Rare: ${gradeCounts.Rare} | Common: ${gradeCounts.Common}`);

  // Suggested pack definition
  console.log(`\n  Suggested pack definition for packs.ts:`);
  console.log(`  {`);
  console.log(`    id: 'book-${args.prefix.toLowerCase()}',`);
  console.log(`    name: '${args.book}',`);
  console.log(`    description: '${args.book} — ${args.author}',`);
  console.log(`    price: 100,`);
  console.log(`    cardCount: 5,`);
  console.log(`    filter: (c) => c.book === '${args.book}',`);
  console.log(`    color: 'bg-[#2C3E50]',`);
  console.log(`    accent: 'border-brand-cream/20',`);
  console.log(`  }`);

  // ── Output ──
  const outputDir = path.resolve(import.meta.dirname || '.', 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${args.prefix}-cards.json`);
  fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));
  console.log(`\n  📄 Cards saved to: ${outputPath}`);

  if (args.dryRun) {
    console.log('\n  🏁 Dry run complete. Review the output JSON and re-run without --dry-run to seed Firestore.');
  } else {
    const { created, skipped } = await seedToFirestore(cards);
    console.log(`\n  🏁 Done! Created: ${created}, Skipped: ${skipped}`);
    console.log(`  Total cards for "${args.book}": ${cards.length}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message || err);
  process.exit(1);
});
