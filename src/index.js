const express = require('express');
const path = require('path');
const fs = require('fs');
const { ChatBot } = require('./engine');

const app = express();

app.use(express.json());

function loadData(dir) {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    for (const line of content.trim().split('\n')) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.question && parsed.answer) entries.push(parsed);
      } catch (_) { /* skip malformed */ }
    }
  }
  return entries;
}

const dataDir = path.join(__dirname, 'data');

function reload() {
  const entries = loadData(dataDir);
  if (entries.length > 0) {
    bot.update(entries);
    console.log(`[Ryn] ${entries.length} entries loaded`);
  }
}

const entries = loadData(dataDir);
const bot = new ChatBot(entries.length > 0 ? entries : [
  { question: 'hola', answer: '¡Hola! Soy Ryn, ¿en qué puedo ayudarte?' }
]);
console.log(`[Ryn] ${entries.length} entries loaded`);

let watchTimeout;
fs.watch(dataDir, (event, filename) => {
  if (!filename || !filename.endsWith('.jsonl')) return;
  clearTimeout(watchTimeout);
  watchTimeout = setTimeout(reload, 300);
});

app.post('/chat/', (req, res) => {
  const { question, quality = 'medium' } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'La pregunta es requerida' });
  }

  if (!['low', 'medium', 'high'].includes(quality)) {
    return res.status(400).json({ error: 'Quality debe ser low, medium o high' });
  }

  const result = bot.answer(question.trim(), quality);

  res.json({
    question: result.question,
    answer: result.answer,
    quality,
    confidence: Number(result.confidence.toFixed(4))
  });
});

module.exports = app;
