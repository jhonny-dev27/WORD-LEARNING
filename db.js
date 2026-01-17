/* =====================================================
   BANCO DE DADOS LOCAL - IndexedDB
   Arquivo: db.js
   ===================================================== */

const DB_NAME = "WordLearningDB";
const DB_VERSION = 1;
const STORE_NAME = "words";

/**
 * Abre ou cria o banco de dados
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("word", "word", { unique: true });
        store.createIndex("difficulty_score", "difficulty_score");
        store.createIndex("last_seen", "last_seen");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva uma nova palavra no banco
 */
async function saveWord(wordData) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.add({
      word: wordData.word,
      meaning: wordData.meaning,
      etymology: wordData.etymology,
      translation_en: wordData.translation_en,
      times_seen: 0,
      times_correct: 0,
      last_seen: null,
      difficulty_score: 1,
    });

    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false); // evita duplicação quebrar o app
  });
}

/**
 * Retorna todas as palavras salvas
 */
async function getAllWords() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Seleciona uma palavra de forma inteligente
 * Prioriza:
 * - palavras pouco vistas
 * - palavras com dificuldade maior
 */
async function getNextWord() {
  const words = await getAllWords();

  if (words.length === 0) return null;

  // Ordenação inteligente
  words.sort((a, b) => {
    const scoreA = a.difficulty_score - (a.times_seen * 0.1);
    const scoreB = b.difficulty_score - (b.times_seen * 0.1);
    return scoreB - scoreA;
  });

  return words[0];
}

/**
 * Atualiza estatísticas após visualização
 */
async function markWordSeen(id, wasCorrect = false) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = () => {
      const word = request.result;
      if (!word) return resolve(false);

      word.times_seen += 1;
      word.last_seen = Date.now();

      if (wasCorrect) {
        word.times_correct += 1;
        word.difficulty_score = Math.max(1, word.difficulty_score - 1);
      } else {
        word.difficulty_score += 1;
      }

      store.put(word);
      resolve(true);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Verifica se o banco está vazio
 */
async function isDatabaseEmpty() {
  const words = await getAllWords();
  return words.length === 0;
}
