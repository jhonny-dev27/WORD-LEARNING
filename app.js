/* =====================================================
   APP PRINCIPAL - LÓGICA ONLINE / OFFLINE
   Arquivo: app.js
   ===================================================== */

/* =========================
   ELEMENTOS DA INTERFACE
========================= */
const wordEl = document.getElementById("word");
const meaningEl = document.getElementById("meaning");
const etymologyEl = document.getElementById("etymology");
const translationEl = document.getElementById("translation");
const statusEl = document.getElementById("connection-status");
const nextBtn = document.getElementById("next-word");

/* =========================
   STATUS DE CONEXÃO
========================= */
function updateConnectionStatus() {
  if (navigator.onLine) {
    statusEl.textContent = "Online";
    statusEl.classList.remove("offline");
    statusEl.classList.add("online");
  } else {
    statusEl.textContent = "Offline";
    statusEl.classList.remove("online");
    statusEl.classList.add("offline");
  }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

/* =========================
   BUSCA ONLINE DE PALAVRAS
========================= */

/**
 * Busca uma palavra simples online (exemplo seguro)
 * IMPORTANTE: essa função pode ser substituída por APIs mais completas depois
 */
async function fetchWordOnline() {
  try {
    const response = await fetch(
      "https://random-word-api.herokuapp.com/word?lang=pt"
    );
    const data = await response.json();
    const word = data[0];

    return {
      word: word,
      meaning: "Significado não disponível automaticamente.",
      etymology: "Etimologia não disponível automaticamente.",
      translation_en: "Translation unavailable.",
    };
  } catch (error) {
    console.warn("Falha ao buscar palavra online:", error);
    return null;
  }
}

/* =========================
   EXIBIÇÃO DE PALAVRA
========================= */
async function displayWord(wordData) {
  if (!wordData) {
    wordEl.textContent = "Nenhuma palavra disponível";
    meaningEl.textContent = "-";
    etymologyEl.textContent = "-";
    translationEl.textContent = "-";
    return;
  }

  wordEl.textContent = wordData.word;
  meaningEl.textContent = wordData.meaning;
  etymologyEl.textContent = wordData.etymology;
  translationEl.textContent = wordData.translation_en;

  if (wordData.id) {
    await markWordSeen(wordData.id, false);
  }
}

/* =========================
   FLUXO PRINCIPAL
========================= */
async function loadNextWord() {
  // 1. Se estiver online, tenta enriquecer o banco
  if (navigator.onLine) {
    const isEmpty = await isDatabaseEmpty();

    if (isEmpty) {
      const newWord = await fetchWordOnline();
      if (newWord) {
        await saveWord(newWord);
      }
    }
  }

  // 2. Sempre tenta buscar do banco local
  const word = await getNextWord();
  await displayWord(word);
}

/* =========================
   EVENTOS
========================= */
nextBtn.addEventListener("click", loadNextWord);

/* =========================
   INICIALIZAÇÃO
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  updateConnectionStatus();
  await loadNextWord();
});
