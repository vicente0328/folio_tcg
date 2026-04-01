import Papa from 'papaparse';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import csvData from '../data/cards.csv?raw';

export async function seedDatabase() {
  try {
    const cardsRef = collection(db, 'cards');
    const snapshot = await getDocs(cardsRef);
    
    if (!snapshot.empty) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding database...');
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    
    const batch = writeBatch(db);
    
    parsed.data.forEach((row: any, index) => {
      const cardId = String(row.card_id || '').trim();
      const grade = String(row.grade || 'Common').trim();
      const book = String(row.book || row['\uFEFFbook'] || '').trim();
      const original = String(row.original || '').trim();
      const translation = String(row.translation || '').trim();
      const chapter = String(row.chapter || '').trim();

      const bookAuthors: Record<string, string> = {
        '이방인': 'Albert Camus',
        '죄와 벌': 'Ф. М. Достоевский',
        '안나 카레니나': 'Л. Н. Толстой',
        '레미제라블': 'Victor Hugo',
        '데미안': 'Hermann Hesse',
      };
      const author = bookAuthors[book] || '';
      
      if (!cardId) return; // Skip empty rows

      let maxCopies = 100; // Common
      if (grade === 'Legendary') maxCopies = 1;
      else if (grade === 'Epic') maxCopies = 1;
      else if (grade === 'Rare') maxCopies = 1;

      if (grade === 'Legendary' || grade === 'Epic' || grade === 'Rare') {
        const docRef = doc(cardsRef, `${cardId}-1`);
        batch.set(docRef, {
          id: `${cardId}-1`,
          book: book,
          card_id: cardId,
          grade: grade,
          original: original,
          translation: translation,
          chapter: chapter,
          author: author,
          status: 'pool',
          max_copies: 1
        });
      } else {
        // For Common, let's just create 3 instances for the demo to avoid hitting batch limits (500)
        for (let i = 1; i <= 3; i++) {
          const docRef = doc(cardsRef, `${cardId}-${i}`);
          batch.set(docRef, {
            id: `${cardId}-${i}`,
            book: book,
            card_id: cardId,
            grade: grade,
            original: original,
            translation: translation,
            chapter: chapter,
            author: author,
            status: 'pool',
            max_copies: 100
          });
        }
      }
    });

    await batch.commit();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
