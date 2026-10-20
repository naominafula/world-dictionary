// Wait for the HTML elements to load completely before running scripts
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("q");
  const languageSelect = document.getElementById("lang");
  const searchButton = document.getElementById("go");
  const resultBox = document.getElementById("result");
  const historyBox = document.getElementById("history");

  const HISTORY_KEY = "wordbook-history";

  function showMessage(message, isError = false) {
    const errorClass = isError ? "msg error" : "msg";
    resultBox.innerHTML = `<p class="${errorClass}">${message}</p>`;
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors so the app still works.
    }
  }

  function renderHistory() {
    const history = getHistory();
    historyBox.innerHTML = "";

    if (!history.length) return;

    history.forEach((term) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = term;
      button.addEventListener("click", () => {
        searchInput.value = term;
        searchWord();
      });
      historyBox.appendChild(button);
    });
  }

  function renderResults(data) {
    const entry = data[0];
    const word = entry.word;
    const phonetic = entry.phonetic ||
      entry.phonetics?.find((item) => item.text)?.text ||
      "";
    const meanings = entry.meanings || [];

    const meaningMarkup = meanings.map((meaning) => {
      const defs = (meaning.definitions || []).slice(0, 3).map((item) => {
        const exampleMarkup = item.example
          ? `<span class="example">Example: "${item.example}"</span>`
          : "";

        return `<li><p>${item.definition}</p>${exampleMarkup}</li>`;
      }).join("");

      const synonyms = meaning.synonyms?.length
        ? `<p class="syn">Synonyms: ${meaning.synonyms.slice(0, 5).join(", ")}</p>`
        : "";

      return `
        <div class="meaning">
          <h3>${meaning.partOfSpeech || "Definition"}</h3>
          <ol>${defs}</ol>
          ${synonyms}
        </div>
      `;
    }).join("");

    const phoneticMarkup = phonetic
      ? `<span class="phonetic">/${phonetic.replace(/\//g, "")}/</span>`
      : "";

    resultBox.innerHTML = `
      <div class="word">
        <h2>${word}</h2>
        ${phoneticMarkup}
      </div>
      ${meaningMarkup || "<p class='msg'>No definitions found.</p>"}
    `;
  }

  async function searchWord() {
    const word = searchInput.value.trim();

    if (!word) {
      showMessage("Type a word and press Search to see its meaning.");
      return;
    }

    const language = languageSelect.value;
    const url = `https://api.dictionaryapi.dev/api/v2/entries/${language}/${encodeURIComponent(word)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Word not found");
      }

      const data = await response.json();
      renderResults(data);

      const history = getHistory();
      const nextHistory = [
        word,
        ...history.filter((item) => item.toLowerCase() !== word.toLowerCase())
      ].slice(0, 8);

      saveHistory(nextHistory);
      renderHistory();
    } catch (error) {
      showMessage(`Sorry, we couldn't find definitions for "${word}".`, true);
    }
  }

  searchButton.addEventListener("click", searchWord);
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchWord();
    }
  });

  renderHistory();
  showMessage("Type a word and press Search to see its meaning.");
});