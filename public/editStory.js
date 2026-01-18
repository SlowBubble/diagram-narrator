import { app, db, auth } from './firebase-config.js';
import { collection, addDoc, setDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-ai.js";

const promptArea = document.getElementById('story-prompt');
const sentenceCountInput = document.getElementById('sentence-count');
const jsonDisplay = document.getElementById('json-display');
const loadingOverlay = document.getElementById('loading-overlay');
const statusMessage = document.getElementById('status-message');
const authStatus = document.getElementById('auth-status');

let currentUser = null;
let currentStoryId = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authStatus.textContent = `Signed in as ${user.email}`;
  } else {
    authStatus.textContent = 'Not signed in (Stories will be saved as anonymous)';
  }

  // Check for story ID in URL after auth state is determined
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');
  if (storyId && !currentStoryId) {
    loadStory(storyId);
  }
});

async function loadStory(id) {
  loadingOverlay.style.display = 'flex';
  statusMessage.textContent = 'Loading story...';
  try {
    const docRef = doc(db, "stories", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      currentStoryId = id;
      jsonDisplay.value = JSON.stringify(data.story, null, 2);
      statusMessage.textContent = 'Story loaded';

      // Update URL hash or history to keep ID clean if needed,
      // but keeping it in query param is fine for direct access.
    } else {
      statusMessage.textContent = 'Story not found';
    }
  } catch (error) {
    console.error("Error loading story:", error);
    statusMessage.textContent = 'Load error';
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

// Handle Cmd+S to save
window.addEventListener('keydown', async (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    await handleManualSave();
  }
});

async function handleManualSave() {
  if (!jsonDisplay.value.trim()) return;

  statusMessage.textContent = 'Saving...';
  try {
    const storyJson = JSON.parse(jsonDisplay.value);
    await saveStoryToFirestore(storyJson, currentStoryId);
    statusMessage.textContent = 'Saved changes';
  } catch (error) {
    console.error("Manual save failed:", error);
    statusMessage.textContent = 'Save Error: ' + error.message;
    alert("Invalid JSON format. Please fix before saving.");
  }
}

promptArea.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const prompt = promptArea.value.trim();
    const count = parseInt(sentenceCountInput.value) || 6;
    if (!prompt) return;

    await generateStory(prompt, count);
  }
});

async function generateStory(userPrompt, sentenceCount) {
  loadingOverlay.style.display = 'flex';
  statusMessage.textContent = 'Generating...';
  currentStoryId = null; // Reset for new generation

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    const systemPrompt = `You are a specialized assistant that creates educational story structures.
Your goal is to take a story prompt and generate a specific JSON structure.

JSON Structure:
{
  "title": "A short descriptive title",
  "brokenDownSentences": [
    "sentence 1", ...
  ],
  "vocabs": [
    {
      "brokenDownWord": "word 1",
      "pronunciationParts": ["part 1", ...]
    }, ...
  ]
}

Rules:
0. title: A short, catchy title for the story.
1. brokenDownSentences: Generate EXACTLY ${sentenceCount} sentences for the story. Break each sentence into natural, easy-to-read phrases using the "|" character.
   - Example: "Daddy took Lisa to the park." -> "Daddy took Lisa|to the park."
2. vocabs: Extract 5-10 key vocabulary words from the story.
3. brokenDownWord: Break the word into syllables using "|" based on how it is ACTIVELY READ or SPOKEN, not necessarily dictionary rules.
   - CRITICAL: Break syllables so that a consonant is part of the next syllable if it is sounded with the next vowel.
    - Example: "shouted" should be "shou|ted" (not "shout|ed").
    - Example: "together" should be "to|ge|ther" (not "to|geth|er").
    - Example: "color" should be "co|lor" (not "col|or").
    - Example: "teacher" should be "tea|cher" (not "teach|er").
    - Example: "brave" -> "brave" (one syllable)
4. pronunciationParts: For each syllable in brokenDownWord, provide a phonetic string that the Web Speech API will pronounce correctly in isolation.
   - Example: For "Dad|dy", the parts are "Dad" and "dy".
   - "Dad" is pronounced "dad".
   - "dy" in this context is pronounced "dee".
   - So pronunciationParts would be ["dad", "dee"].
5. The output MUST be ONLY valid JSON. No preamble, no markdown blocks, no trailing commas, and no comments.
6. Ensure all keys and string values are enclosed in double quotes.

Story Prompt: ${userPrompt}
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();

    // More robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    // Attempt to remove common JSON pitfalls like trailing commas before closing braces/brackets
    const cleanedText = text
      .replace(/,\s*([\}\]])/g, '$1') // Remove trailing commas
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove comments if any

    const storyJson = JSON.parse(cleanedText);

    // Display JSON in textarea
    jsonDisplay.value = JSON.stringify(storyJson, null, 2);

    // Save to Firestore (initial save)
    await saveStoryToFirestore(storyJson);

    statusMessage.textContent = 'Saved to Firestore';
    promptArea.value = '';
    promptArea.focus();

  } catch (error) {
    console.error("Story generation failed:", error);
    statusMessage.textContent = 'Error: ' + error.message;
    alert("Failed to generate story: " + error.message);
  } finally {
    loadingOverlay.style.display = 'none';
  }
}

async function saveStoryToFirestore(storyJson, existingId = null) {
  try {
    let id = existingId;
    if (!id) {
      if (storyJson.title) {
        // Form ID from title: lowercase, spaces to -, remove special chars
        id = storyJson.title.toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        // Add a timestamp suffix to ensure uniqueness if needed, 
        // or just rely on the slug if that's preferred. 
        // Let's add partial timestamp for safety but keep it readable.
        id = `${id}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;
      } else {
        id = `story-${Date.now()}`;
      }
    }

    const storyDoc = {
      info: {
        id: id,
        createdAt: serverTimestamp(), // This will be overwritten if updating, we should handle that
        updatedAt: serverTimestamp(),
        owner: currentUser ? currentUser.uid : 'anonymous',
        isPublic: true,
      },
      story: storyJson
    };

    if (existingId) {
      // If updating, don't overwrite createdAt
      delete storyDoc.info.createdAt;
      await setDoc(doc(db, "stories", id), storyDoc, { merge: true });
    } else {
      await setDoc(doc(db, "stories", id), storyDoc);
      currentStoryId = id;

      // Update URL with the new ID
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('id', id);
      window.history.pushState({ id }, '', newUrl);
    }

    console.log("Story saved with ID: ", id);
  } catch (e) {
    console.error("Error saving document: ", e);
    throw e;
  }
}

