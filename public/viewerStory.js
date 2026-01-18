import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const contentEl = document.getElementById('content');
const loadingEl = document.getElementById('loading');
const storyContainer = document.getElementById('story-container');

let story = null;
let sentences = []; // Array of arrays: [[phrase1, phrase2], [phrase1, ...]]
let currentSentenceIndex = 0;
let currentPhraseIndex = 0;
let isFinished = false;

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');

  if (!storyId) {
    loadingEl.textContent = "No story ID provided.";
    return;
  }

  try {
    const docRef = doc(db, "stories", storyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      story = data.story;
      if (story.title) {
        document.getElementById('story-title').textContent = story.title;
        document.title = `${story.title} - Story Viewer`;
      }
      prepareSentences();
      renderCurrentState();
      loadingEl.classList.add('hidden');
    } else {
      loadingEl.textContent = "Story not found.";
    }
  } catch (error) {
    console.error("Error loading story:", error);
    loadingEl.textContent = "Error loading story.";
  }
}

function prepareSentences() {
  sentences = story.brokenDownSentences.map(s => s.split('|').map(p => p.trim()));
}

function renderCurrentState() {
  if (isFinished) {
    contentEl.innerHTML = '<div class="the-end">The End</div>';
    document.getElementById('controls').classList.add('hidden');
    speak("The End");
    return;
  }

  contentEl.innerHTML = '';
  const sentenceDisplay = document.createElement('div');
  sentenceDisplay.className = 'sentence active';

  const currentPhrases = sentences[currentSentenceIndex];

  currentPhrases.forEach((phrase, idx) => {
    const span = document.createElement('span');
    span.className = 'phrase';
    if (idx === currentPhraseIndex) {
      span.classList.add('active');
    }
    span.textContent = phrase;
    sentenceDisplay.appendChild(span);

    if (idx < currentPhrases.length - 1) {
      sentenceDisplay.appendChild(document.createTextNode(' '));
    }
  });

  contentEl.appendChild(sentenceDisplay);
}

let isProcessing = false;

function nextStep() {
  if (isFinished || isProcessing) return;

  const currentPhrases = sentences[currentSentenceIndex];
  const phraseToSpeak = currentPhrases[currentPhraseIndex];

  isProcessing = true;
  speak(phraseToSpeak, () => {
    setTimeout(() => {
      advanceState();
      renderCurrentState();
      isProcessing = false;
    }, 500);
  });
}

function prevStep() {
  if (isProcessing) return;

  // If at start, do nothing
  if (currentSentenceIndex === 0 && currentPhraseIndex === 0) return;

  currentPhraseIndex--;
  if (currentPhraseIndex < 0) {
    currentSentenceIndex--;
    currentPhraseIndex = sentences[currentSentenceIndex].length - 1;
  }

  isFinished = false; // Reset if we were at the end
  renderCurrentState();
  const phraseToSpeak = sentences[currentSentenceIndex][currentPhraseIndex];
  speak(phraseToSpeak);
}

function manualNextStep() {
  if (isProcessing || isFinished) return;

  const currentPhrases = sentences[currentSentenceIndex];

  currentPhraseIndex++;
  if (currentPhraseIndex >= currentPhrases.length) {
    currentPhraseIndex = 0;
    currentSentenceIndex++;
    if (currentSentenceIndex >= sentences.length) {
      isFinished = true;
    }
  }

  renderCurrentState();
  if (!isFinished) {
    const phraseToSpeak = sentences[currentSentenceIndex][currentPhraseIndex];
    speak(phraseToSpeak);
  } else {
    // Already handled in renderCurrentState's finish block if we want it to speak "The End"
    // which it does in renderCurrentState.
  }
}

function advanceState() {
  const currentPhrases = sentences[currentSentenceIndex];
  currentPhraseIndex++;

  if (currentPhraseIndex >= currentPhrases.length) {
    currentPhraseIndex = 0;
    currentSentenceIndex++;

    if (currentSentenceIndex >= sentences.length) {
      isFinished = true;
    }
  }
}

function speak(text, onEnd) {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Try to find a good voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
  if (preferredVoice) utterance.voice = preferredVoice;

  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    // Fallback for some browsers where onend might not fire reliably
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded (some browsers load them asynchronously)
window.speechSynthesis.onvoiceschanged = () => {
  // This is just to ensure names are available when speak is called
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && (e.metaKey || e.ctrlKey)) {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');
    if (storyId) {
      window.location.href = `editStory.html?id=${storyId}`;
    }
    return;
  }

  // Cmd + U for storyStorage.html
  if (e.key.toLowerCase() === 'u' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    window.location.href = 'storyStorage.html';
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    nextStep();
  }

  if (e.code === 'ArrowRight') {
    e.preventDefault();
    manualNextStep();
  }

  if (e.code === 'ArrowLeft') {
    e.preventDefault();
    prevStep();
  }

  if (e.key.toLowerCase() === 'v') {
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('id');
    if (sid) {
      window.location.href = `storyVocab.html?id=${sid}`;
    }
  }
});

init();
