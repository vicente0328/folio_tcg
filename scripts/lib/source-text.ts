/**
 * Stage 1: Source Text Acquisition
 *
 * Downloads and cleans source text from Project Gutenberg or a local file.
 * The cleaned text serves as ground truth for hallucination prevention.
 */

import fs from 'fs';

/** Download and clean a Project Gutenberg text by book ID */
export async function fetchGutenbergText(gutenbergId: number): Promise<string> {
  const url = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
  console.log(`  Downloading from ${url}...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Gutenberg text: HTTP ${res.status} ${res.statusText}`);
  }

  const raw = await res.text();
  return stripGutenbergBoilerplate(raw);
}

/** Read and clean a local text file */
export async function readLocalText(filePath: string): Promise<string> {
  console.log(`  Reading local file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return normalizeText(raw);
}

/** Strip Gutenberg header and footer boilerplate */
function stripGutenbergBoilerplate(text: string): string {
  // Find start marker
  const startMarkers = [
    '*** START OF THE PROJECT GUTENBERG',
    '*** START OF THIS PROJECT GUTENBERG',
    '***START OF THE PROJECT GUTENBERG',
  ];
  let startIdx = 0;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      // Move past the marker line
      startIdx = text.indexOf('\n', idx) + 1;
      break;
    }
  }

  // Find end marker
  const endMarkers = [
    '*** END OF THE PROJECT GUTENBERG',
    '*** END OF THIS PROJECT GUTENBERG',
    '***END OF THE PROJECT GUTENBERG',
    'End of the Project Gutenberg',
    'End of Project Gutenberg',
  ];
  let endIdx = text.length;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      endIdx = idx;
      break;
    }
  }

  const body = text.slice(startIdx, endIdx);
  return normalizeText(body);
}

/** Normalize Unicode and whitespace */
function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace (collapse multiple spaces, keep newlines)
    .replace(/[^\S\n]+/g, ' ')
    // Remove excessive blank lines (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
