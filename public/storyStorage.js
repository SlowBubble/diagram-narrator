import { db, auth, googleProvider } from './firebase-config.js';
import { collection, getDocs, deleteDoc, doc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

const storiesList = document.getElementById('stories-list');
const storiesTable = document.getElementById('stories-table');
const loadingState = document.getElementById('loading-state');
const userDisplayName = document.getElementById('user-display-name');
const authActionLink = document.getElementById('auth-action-link');
const statusBanner = document.getElementById('status-banner');

let currentUser = null;

// Authentication handling
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    userDisplayName.textContent = user.displayName;
    authActionLink.textContent = 'Sign Out';
    loadStories();
  } else {
    userDisplayName.textContent = '';
    authActionLink.textContent = 'Sign In';
    showSignInState();
  }
});

authActionLink.addEventListener('click', async (e) => {
  e.preventDefault();
  if (currentUser) {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  } else {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  }
});

function showSignInState() {
  storiesTable.style.display = 'none';
  loadingState.style.display = 'block';
  loadingState.innerHTML = `
    <div style="margin-bottom: 24px;">Sign in to manage your saved stories.</div>
    <button id="main-signin-btn" class="btn btn-primary">Sign In with Google</button>
  `;
  document.getElementById('main-signin-btn')?.addEventListener('click', () => {
    signInWithPopup(auth, googleProvider);
  });
}

async function loadStories() {
  if (!currentUser) return;

  loadingState.style.display = 'block';
  loadingState.textContent = 'Loading stories...';
  storiesTable.style.display = 'none';

  try {
    const storiesRef = collection(db, "stories");
    // Attempting query - note: might need an index if we use multiple conditions + order
    // For now, let's get all and filter locally if indexed query fails, 
    // but usually user-based filtering is better.
    const q = query(
      storiesRef,
      where("info.owner", "==", currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const stories = [];
    querySnapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });

    // Sort by updatedAt if exists, otherwise createdAt
    stories.sort((a, b) => {
      const timeA = a.info.updatedAt?.seconds || a.info.createdAt?.seconds || 0;
      const timeB = b.info.updatedAt?.seconds || b.info.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    renderStories(stories);
  } catch (error) {
    console.error("Failed to load stories:", error);
    loadingState.textContent = 'Error loading stories. Please try again.';
  }
}

function renderStories(stories) {
  if (stories.length === 0) {
    loadingState.style.display = 'block';
    loadingState.textContent = 'No stories found. Create your first one!';
    return;
  }

  loadingState.style.display = 'none';
  storiesTable.style.display = 'table';
  storiesList.innerHTML = '';

  stories.forEach(item => {
    const tr = document.createElement('tr');
    const updatedAt = item.info.updatedAt?.toDate() || item.info.createdAt?.toDate() || new Date();

    tr.innerHTML = `
      <td>
        <a href="viewerStory.html?id=${item.id}" style="text-decoration: none; color: inherit; display: block;">
          <div class="story-title">${item.story.title || 'Untitled Story'}</div>
          <div style="font-size: 12px; color: #94a3b8;">${item.id}</div>
        </a>
      </td>
      <td class="date-cell">${formatDate(updatedAt)}</td>
      <td class="actions-cell">
        <a href="editStory.html?id=${item.id}" class="btn" style="background: #f1f5f9; color: #475569; margin-right: 8px;">Edit</a>
        <button class="btn btn-outline-danger delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;
    storiesList.appendChild(tr);
  });

  // Attach delete listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this story?')) {
        try {
          await deleteDoc(doc(db, "stories", id));
          showStatus('Story deleted');
          loadStories();
        } catch (err) {
          console.error("Delete failed:", err);
          showStatus('Delete failed');
        }
      }
    });
  });
}

function formatDate(date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showStatus(text) {
  statusBanner.textContent = text;
  statusBanner.classList.add('active');
  setTimeout(() => {
    statusBanner.classList.remove('active');
  }, 3000);
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  // Cmd + Enter for New Story
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    window.location.href = 'editStory.html';
  }
});
