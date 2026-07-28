function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-záéíóúüñ0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

function jaccard(a, b) {
  const sa = new Set(a), sb = new Set(b);
  const inter = new Set([...sa].filter(x => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

function buildIndexFromTokenized(tokenized) {
  const termDocs = new Map();
  const allTerms = new Set();
  for (const tokens of tokenized) {
    const seen = new Set();
    for (const t of tokens) {
      allTerms.add(t);
      if (!seen.has(t)) { seen.add(t); termDocs.set(t, (termDocs.get(t) || 0) + 1); }
    }
  }
  const n = tokenized.length;
  const idf = {};
  for (const term of allTerms) idf[term] = Math.log((n + 1) / ((termDocs.get(term) || 0) + 1)) + 1;
  const vectors = tokenized.map(tokens => {
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const len = tokens.length || 1;
    const vec = {};
    for (const k in tf) vec[k] = (tf[k] / len) * (idf[k] || 0);
    return vec;
  });
  return { idf, vectors };
}

function vecSparse(text, idf) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return {};
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const len = tokens.length;
  const v = {};
  for (const k in tf) if (idf[k]) v[k] = (tf[k] / len) * idf[k];
  return v;
}

function cosineSim(vecA, vecB) {
  let dot = 0, n1 = 0, n2 = 0;
  for (const k in vecA) {
    const a = vecA[k]; n1 += a * a;
    const b = vecB[k]; if (b !== undefined) dot += a * b;
  }
  for (const k in vecB) n2 += vecB[k] * vecB[k];
  const denom = Math.sqrt(n1) * Math.sqrt(n2);
  return denom === 0 ? 0 : dot / denom;
}

function bigramSets(text) {
  const set = new Set();
  for (let i = 0; i < text.length - 1; i++) set.add(text.substring(i, i + 2));
  return set;
}

function bigramSim(querySet, docSet) {
  let inter = 0;
  for (const x of querySet) if (docSet.has(x)) inter++;
  const union = querySet.size + docSet.size - inter;
  return union === 0 ? 0 : inter / union;
}

function editDistance(s1, s2) {
  const n = s1.length, m = s2.length;
  if (n === 0) return m;
  if (m === 0) return n;
  if (Math.abs(n - m) > Math.max(n, m) * 0.6) return Math.max(n, m);
  const dp = [Array.from({ length: m + 1 }, (_, i) => i)];
  for (let i = 1; i <= n; i++) {
    dp[i] = [i];
    for (let j = 1; j <= m; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (s1[i - 1] === s2[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[n][m];
}

class ChatBot {
  constructor(entries) {
    this.update(entries);
  }

  update(entries) {
    this.entries = entries;
    if (entries.length === 0) { this.vectors = []; this.idf = {}; return; }

    this.questions = entries.map(e => e.question);
    this.tokenized = this.questions.map(q => tokenize(q));
    this.bigramSets = this.questions.map(q => bigramSets(q.toLowerCase()));
    this.lowerQuestions = this.questions.map(q => q.toLowerCase());

    const { idf, vectors } = buildIndexFromTokenized(this.tokenized);
    this.idf = idf;
    this.vectors = vectors;
  }

  answer(question, quality) {
    if (this.entries.length === 0) {
      return { question: '', answer: '', confidence: 0 };
    }

    const qTokens = tokenize(question);

    if (quality === 'low') {
      let best = { entry: this.entries[0], score: -1 };
      for (let i = 0; i < this.entries.length; i++) {
        const score = jaccard(qTokens, this.tokenized[i]);
        if (score > best.score) best = { entry: this.entries[i], score };
      }
      return {
        question: best.entry.question,
        answer: best.entry.answer,
        confidence: Math.max(0, Math.min(1, best.score))
      };
    }

    const qVec = vecSparse(question, this.idf);

    if (quality === 'medium') {
      let best = { entry: this.entries[0], score: -1 };
      for (let i = 0; i < this.entries.length; i++) {
        const score = cosineSim(qVec, this.vectors[i]);
        if (score > best.score) best = { entry: this.entries[i], score };
      }
      return {
        question: best.entry.question,
        answer: best.entry.answer,
        confidence: Math.max(0, Math.min(1, best.score))
      };
    }

    const qBigram = bigramSets(question.toLowerCase());
    const qLower = question.toLowerCase();

    const candidates = [];
    for (let i = 0; i < this.entries.length; i++) {
      candidates.push({ idx: i, cos: cosineSim(qVec, this.vectors[i]) });
    }
    candidates.sort((a, b) => b.cos - a.cos);

    const top = candidates.slice(0, 100);
    let best = { entry: this.entries[0], score: -1 };

    for (const { idx, cos } of top) {
      const big = bigramSim(qBigram, this.bigramSets[idx]);
      const edit = 1 - editDistance(qLower, this.lowerQuestions[idx]) / Math.max(qLower.length, this.lowerQuestions[idx].length);
      const score = cos * 0.5 + big * 0.25 + edit * 0.25;
      if (score > best.score) best = { entry: this.entries[idx], score };
    }

    return {
      question: best.entry.question,
      answer: best.entry.answer,
      confidence: Math.max(0, Math.min(1, best.score))
    };
  }
}

module.exports = { ChatBot };
