import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');
const TMP_DIR = '/tmp';

mkdirSync(DATA_DIR, { recursive: true });

function writeJsonl(filename, pairs) {
  const path = join(DATA_DIR, filename);
  const lines = pairs.map(p => JSON.stringify({ question: p.q, answer: p.a }));
  writeFileSync(path, lines.join('\n') + '\n');
  console.log(`[OK] ${filename}  —  ${pairs.length} pares`);
}

function extractWikipedia(path) {
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const pairs = [];
  for (const article of raw) {
    const qna = article.dialogue?.qna;
    if (!qna) continue;
    for (let i = 0; i < qna.length - 1; i++) {
      if (qna[i].role === 'user' && qna[i + 1].role === 'assistant') {
        pairs.push({ q: qna[i].text.trim(), a: qna[i + 1].text.trim() });
      }
    }
  }
  return pairs;
}

function extractMinecraft(path) {
  const text = readFileSync(path, 'utf-8');
  const pairs = [];
  for (const line of text.trim().split('\n')) {
    try {
      const obj = JSON.parse(line);
      const msgs = obj.messages;
      if (msgs?.length >= 3) {
        const user = msgs.find(m => m.role === 'user');
        const assistant = msgs.find(m => m.role === 'assistant');
        if (user && assistant) {
          pairs.push({ q: user.content.trim(), a: assistant.content.trim() });
        }
      }
    } catch (_) {}
  }
  return pairs;
}

function extractEnglish(path) {
  const text = readFileSync(path, 'utf-8');
  const pairs = [];
  for (const line of text.trim().split('\n')) {
    try {
      const obj = JSON.parse(line);
      if (obj.question && obj.answer) {
        pairs.push({ q: obj.question.trim(), a: obj.answer.trim() });
      }
    } catch (_) {}
  }
  return pairs;
}

writeJsonl('wikipedia.jsonl', extractWikipedia(join(TMP_DIR, 'wikipedia_es_raw.json')));
writeJsonl('minecraft.jsonl', extractMinecraft(join(TMP_DIR, 'minecraft_raw.jsonl')));
writeJsonl('english.jsonl', extractEnglish(join(TMP_DIR, 'english_raw.jsonl')));
