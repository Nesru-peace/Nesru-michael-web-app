// Nesru Michael Web App - Frontend + Auth + Storage + PWA Logic
const APP_STORAGE_KEY = 'nm_webapp_data_v1';

// Default state
let state = {
  user: null,
  posts: [
    {
      id: 1,
      title: 'Baga Nagaan Gara Web App Nesru Michael Dhuftan!',
      body: 'Kun Web App guutuu (PWA) bilbilaafi kompiitara irratti hojjetudha. Galmaa\'uun ergaa keessan maxxansuu fi kuusuu dandeessu.',
      author: 'Nesru Michael',
      date: new Date().toLocaleDateString(),
      image: null
    }
  ],
  supabaseUrl: '',
  supabaseKey: ''
};

let supabaseClient = null;
let deferredPrompt = null;

// Load saved state
function loadState() {
  const saved = localStorage.getItem(APP_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } catch (e) {
      console.error('State parse error', e);
    }
  }
  initSupabase();
}

function saveState() {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

function initSupabase() {
  if (state.supabaseUrl && state.supabaseKey && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
      document.getElementById('storage-mode-badge').textContent = 'Supabase Cloud';
    } catch (e) {
      console.warn('Supabase init failed, using local storage:', e);
    }
  } else {
    document.getElementById('storage-mode-badge').textContent = 'Local Storage Ready';
  }
}

// Toast helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Navigation
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  const navBtn = document.querySelector(`.nav-item[data-target="${pageId}"]`);
  if (navBtn) navBtn.classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    if ((target === 'page-dashboard' || target === 'page-profile') && !state.user) {
      showToast('Dura seeni (Login) ykn Demo fayyadami!');
      switchPage('page-auth');
      return;
    }
    switchPage(target);
  });
});

// Auth Tabs
document.querySelectorAll('.tab-btn').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const mode = tab.getAttribute('data-auth-tab');
    document.getElementById('login-form').classList.toggle('hidden', mode !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', mode !== 'register');
  });
});

// Login Form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showToast('Dogoggora Login: ' + error.message);
      return;
    }
    state.user = {
      name: data.user.user_metadata?.full_name || email.split('@')[0],
      email: data.user.email,
      phone: '+251923502787'
    };
  } else {
    state.user = {
      name: email.split('@')[0],
      email: email,
      phone: '+251923502787'
    };
  }

  saveState();
  updateUI();
  switchPage('page-dashboard');
  showToast('Baga nagaan seentan!');
});

// Register Form
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) {
      showToast('Dogoggora Galmee: ' + error.message);
      return;
    }
  }

  state.user = { name, email, phone: '+251923502787' };
  saveState();
  updateUI();
  switchPage('page-dashboard');
  showToast('Galmeen keessan milkaa\'eera!');
});

// Demo Login
document.getElementById('demo-login-btn').addEventListener('click', () => {
  state.user = {
    name: 'Nesru Michael',
    email: 'nesrumichael@gmail.com',
    phone: '+251923502787'
  };
  saveState();
  updateUI();
  switchPage('page-dashboard');
  showToast('Demo Akkaawuntiin seentaniittu!');
});

// Create Post
document.getElementById('post-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('post-title').value.trim();
  const body = document.getElementById('post-body').value.trim();
  const fileInput = document.getElementById('post-image');

  const finalizePost = (imageData) => {
    const newPost = {
      id: Date.now(),
      title,
      body,
      author: state.user ? state.user.name : 'Nesru Michael',
      date: new Date().toLocaleDateString(),
      image: imageData
    };
    state.posts.unshift(newPost);
    saveState();
    renderPosts();
    document.getElementById('post-form').reset();
    showToast('Barreeffamni maxxanfameera!');
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => finalizePost(ev.target.result);
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    finalizePost(null);
  }
});

function deletePost(id) {
  state.posts = state.posts.filter(p => p.id !== id);
  saveState();
  renderPosts();
  showToast('Barreeffamni haqameera.');
}

function renderPosts() {
  const list = document.getElementById('posts-list');
  document.getElementById('stat-posts').textContent = state.posts.length;

  if (state.posts.length === 0) {
    list.innerHTML = '<div class="card"><p class="muted-label">Hanga ammaatti barreeffamni hin jiru.</p></div>';
    return;
  }

  list.innerHTML = state.posts.map(post => `
    <article class="post-item">
      <div class="post-header">
        <span class="post-author">${escapeHTML(post.author)}</span>
        <span class="post-date">${escapeHTML(post.date)}</span>
      </div>
      <h4>${escapeHTML(post.title)}</h4>
      <p>${escapeHTML(post.body)}</p>
      ${post.image ? `<img src="${post.image}" alt="Post image" class="post-img" />` : ''}
      <button class="btn-delete-post" onclick="deletePost(${post.id})">🗑️ Haqi (Delete)</button>
    </article>
  `).join('');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Profile Update
document.getElementById('profile-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.user) return;
  state.user.name = document.getElementById('edit-name').value.trim();
  state.user.phone = document.getElementById('edit-phone').value.trim();
  saveState();
  updateUI();
  showToast('Profile kee haaromfameera!');
});

// Supabase Config Save
document.getElementById('supabase-config-form').addEventListener('submit', (e) => {
  e.preventDefault();
  state.supabaseUrl = document.getElementById('sb-url').value.trim();
  state.supabaseKey = document.getElementById('sb-key').value.trim();
  saveState();
  initSupabase();
  showToast('Qindaa\'inni Supabase ol-kaa\'ameera!');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  state.user = null;
  saveState();
  switchPage('page-auth');
  showToast('Akkaawuntii keessaa baataniittu.');
});

function updateUI() {
  if (state.user) {
    document.getElementById('dash-user-name').textContent = state.user.name;
    document.getElementById('profile-name').textContent = state.user.name;
    document.getElementById('profile-email').textContent = state.user.email;
    document.getElementById('edit-name').value = state.user.name;
    document.getElementById('edit-phone').value = state.user.phone || '+251923502787';
    const initials = state.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('profile-avatar').textContent = initials || 'NM';
  }
  document.getElementById('sb-url').value = state.supabaseUrl || '';
  document.getElementById('sb-key').value = state.supabaseKey || '';
  renderPosts();
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-btn').classList.remove('hidden');
});

document.getElementById('install-btn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('App bilbila keessan irratti fe\'amaa jira!');
  }
  deferredPrompt = null;
  document.getElementById('install-btn').classList.add('hidden');
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW reg error:', err));
  });
}

// Initialize App
loadState();
updateUI();
if (state.user) {
  switchPage('page-dashboard');
}
