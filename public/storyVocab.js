import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const wordDisplay = document.getElementById('word-display');
const promptDisplay = document.getElementById('prompt-display');
const currentCountElem = document.getElementById('current-count');
const totalCountElem = document.getElementById('total-count');
const storyTitleDisplay = document.getElementById('story-title-display');
const loadingOverlay = document.getElementById('loading-overlay');
const statusMessage = document.getElementById('status-message');
const loadingSpinner = document.getElementById('loading-spinner');
const startBtn = document.getElementById('start-btn');

let storyData = null;
let vocabs = [];
let currentIndex = 0;
let currentSyllableIndex = 0;
let storyId = null;

// States: 'SYLLABLES', 'WHOLE_WORD', 'ASK_SPELLING', 'SHOW_SPELLING', 'WAIT_FOR_NEXT_WORD'
let currentState = 'SYLLABLES';
let isPracticeStarted = false;
let isSpeaking = false;

// Initialize
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  storyId = urlParams.get('id');

  if (!storyId) {
    statusMessage.textContent = 'No story ID provided.';
    return;
  }

  try {
    const docRef = doc(db, "stories", storyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      storyData = docSnap.data();
      vocabs = storyData.story.vocabs || [];
      storyTitleDisplay.textContent = storyData.story.title || 'Untitled Story';

      if (vocabs.length === 0) {
        statusMessage.textContent = 'No vocabulary found in this story.';
      } else {
        totalCountElem.textContent = vocabs.length;
        renderWord();

        // Show start button instead of immediately starting
        loadingSpinner.classList.add('hidden');
        statusMessage.classList.add('hidden');
        startBtn.classList.remove('hidden');

        startBtn.onclick = startPractice;
      }
    } else {
      statusMessage.textContent = 'Story not found.';
    }
  } catch (error) {
    console.error("Error loading story:", error);
    statusMessage.textContent = 'Error loading story.';
  }
}

async function startPractice() {
  if (isPracticeStarted) return;
  isPracticeStarted = true;
  loadingOverlay.classList.add('hidden');
  renderWord(false, false, true); // Render without highlight
  await speak("What word is this?");
  setTimeout(() => renderWord(), 500); // Show highlight after 500ms
}

function renderWord(spellingMode = false, obscured = false, skipHighlight = false) {
  const vocab = vocabs[currentIndex];
  if (!vocab) return;
  const syllables = vocab.brokenDownWord.split('|');

  wordDisplay.innerHTML = '';
  wordDisplay.classList.remove('hidden');
  promptDisplay.style.display = 'none';

  syllables.forEach((s, i) => {
    const span = document.createElement('span');
    let text = s;
    if (obscured) {
      text = s.replace(/[a-zA-Z]/g, '_');
    }

    if (spellingMode) {
      text = text.split('').join(' ');
      // If there's a space at the end of a syllable and start of next, it might look like double space.
      // But since they are in different spans, the spacing is controlled by CSS/display.
      // Let's ensure a small gap between spans too if they are "spelt".
    }

    span.textContent = text;
    span.className = 'syllable';
    if (!skipHighlight) {
      if (['WHOLE_WORD', 'ASK_SPELLING', 'SHOW_SPELLING', 'WAIT_FOR_NEXT_WORD'].includes(currentState) || (currentState === 'SYLLABLES' && i === currentSyllableIndex)) {
        span.classList.add('active');
      }
    }
    wordDisplay.appendChild(span);

    // Add a space between syllable spans if in spelling mode to keep the letter rhythm
    if (spellingMode && i < syllables.length - 1) {
      wordDisplay.appendChild(document.createTextNode(' '));
    }
  });

  currentCountElem.textContent = currentIndex + 1;
}

async function handleSpace() {
  if (!isPracticeStarted) {
    startPractice();
    return;
  }

  if (isSpeaking) return;

  const vocab = vocabs[currentIndex];
  if (!vocab) return;

  if (currentState === 'SYLLABLES') {
    const part = vocab.pronunciationParts[currentSyllableIndex];
    await speak(part);

    // Wait 200ms after finished reading
    setTimeout(() => {
      currentSyllableIndex++;
      if (currentSyllableIndex >= vocab.pronunciationParts.length) {
        currentState = 'WHOLE_WORD';
      }
      renderWord();
    }, 200);

  } else if (currentState === 'WHOLE_WORD') {
    // Read the whole word
    const fullWord = vocab.brokenDownWord.replace(/\|/g, '');
    await speak(fullWord);
    currentState = 'ASK_SPELLING';
    // Wait for next space to show underscores
  } else if (currentState === 'ASK_SPELLING') {
    // Show underscores for the word and ask "How do you spell?"
    renderWord(true, true);
    const fullWord = vocab.brokenDownWord.replace(/\|/g, '');
    const questionText = `How do you spell this word?`;
    const questionUtterance = `How do you spell the word, ${fullWord}?`;
    promptDisplay.textContent = questionText;
    promptDisplay.style.display = 'block';
    await speak(questionUtterance);
    currentState = 'SHOW_SPELLING';
  } else if (currentState === 'SHOW_SPELLING') {
    // Show word and spell out (syllable by syllable, letter by letter)
    promptDisplay.style.display = 'none';
    renderWord(true, false);

    // Highlight each syllable as we spell it
    const syllables = vocab.brokenDownWord.split('|');
    const spans = wordDisplay.querySelectorAll('.syllable');

    for (let i = 0; i < syllables.length; i++) {
      // Remove previous active
      spans.forEach(s => s.classList.remove('active'));
      if (spans[i]) spans[i].classList.add('active');

      // Spell out the letters of the current syllable in lowercase at a very slow rate
      const spelling = syllables[i].toLowerCase().split('').join('-');
      await speak(spelling, 0.6);

      if (i < syllables.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // After showing spelling, say the full word again
    const fullWord = vocab.brokenDownWord.replace(/\|/g, '');
    await speak(fullWord);

    currentState = 'WAIT_FOR_NEXT_WORD';
    renderWord(); // Highlight whole word
  } else if (currentState === 'WAIT_FOR_NEXT_WORD') {
    // Move to next word after user confirms with space
    currentIndex++;
    if (currentIndex >= vocabs.length) {
      // Finished all words
      wordDisplay.innerHTML = '<div style="font-size: 3rem">Well done! 🎉</div>';
      currentState = 'FINISHED';
    } else {
      currentSyllableIndex = 0;
      currentState = 'SYLLABLES';
      renderWord(false, false, true); // Render without highlight
      speak("What word is this?").then(() => {
        setTimeout(() => renderWord(), 500); // Show highlight after 500ms
      });
    }
  }
}

function speak(text, rate = 0.7) {
  return new Promise((resolve) => {
    isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate; // Custom rate or default 0.9
    utterance.onend = () => {
      isSpeaking = false;
      resolve();
    };
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      isSpeaking = false;
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}

// Event Listeners
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleSpace();
  } else if (e.key.toLowerCase() === 'u') {
    window.location.href = 'storyStorage.html';
  } else if (e.key.toLowerCase() === 'v') {
    if (storyId) {
      window.location.href = `viewerStory.html?id=${storyId}`;
    }
  }
});

init();
