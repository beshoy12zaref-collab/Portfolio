/* ================================================================
   ADMIN DASHBOARD — plain JS, gated behind a verified Supabase
   session for beshoy12zaref@gmail.com only. No registration UI.
   No service_role key / secret / DB password anywhere in this file
   — only the publishable key from supabase-config.js, used exactly
   as a normal authenticated browser client would use it.
   ================================================================ */
(function () {
  'use strict';

  const ADMIN_EMAIL = 'beshoy12zaref@gmail.com';
  const BUCKET = 'portfolio-media';
  const sb = window.supabaseClient;

  /* ---------------- small shared helpers (duplicated from script.js on
     purpose — the admin page intentionally does not load the public
     site's script.js, to avoid its DOM-bound render calls throwing on
     elements that don't exist here). ---------------- */
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function parseYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const u = new URL(url, location.href);
      const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
      if (host === 'youtu.be') {
        const id = u.pathname.split('/').filter(Boolean)[0];
        return /^[\w-]{11}$/.test(id) ? id : null;
      }
      if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (u.pathname === '/watch') {
          const id = u.searchParams.get('v');
          return id && /^[\w-]{11}$/.test(id) ? id : null;
        }
        const parts = u.pathname.split('/').filter(Boolean);
        if ((parts[0] === 'shorts' || parts[0] === 'embed') && parts[1]) {
          return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null;
        }
      }
    } catch (e) { /* not a valid URL */ }
    return null;
  }

  function isHttpUrl(u) {
    if (!u || typeof u !== 'string') return false;
    try { const p = new URL(u, location.href); return p.protocol === 'http:' || p.protocol === 'https:'; }
    catch (e) { return false; }
  }

  /* Default fallback content, duplicated here from assets/js/script.js
     (same values) so the one-time "Import Current Portfolio" action
     works without loading the public site's script onto this page. */
  const DEFAULT_REELS = [
    { title: 'Arousa Tea', cat: 'Brand Story', src: '', poster: '' },
    { title: 'OpenClos', cat: 'Social Reel', src: '', poster: '' },
    { title: '2026 Reel', cat: 'Showreel', src: '', poster: '' },
    { title: 'Untitled Short', cat: 'Narrative', src: '', poster: '' },
    { title: 'Visualizer', cat: 'Music Edit', src: '', poster: '' },
    { title: 'Product Spot', cat: 'Commercial', src: '', poster: '' }
  ];
  const DEFAULT_LONG_FORM = [
    { title: 'Featured Long-Form Project', cat: 'Documentary', src: '', poster: '' },
    { title: 'Long-Form Project 02', cat: 'Brand Film', src: '', poster: '' },
    { title: 'Long-Form Project 03', cat: 'YouTube', src: '', poster: '' }
  ];
  const DEFAULT_AI_SKILLS = [
    { title: 'AI Video Generation', desc: 'Prompt-built footage shaped into a finished, story-driven edit.', tags: ['Generative', 'Prompt Design'], src: '', poster: '' },
    { title: 'AI-Assisted Compositing', desc: 'Generated elements matched and blended into live-action plates.', tags: ['Compositing', 'VFX'], src: '', poster: '' },
    { title: 'AI Product Visuals', desc: 'Product shots and environments created and animated with AI tools.', tags: ['Product', 'Motion'], src: '', poster: '' },
    { title: 'AI Visual Storytelling', desc: 'Generative scenes cut to rhythm and sound for a complete narrative.', tags: ['Storytelling', 'Editing'], src: '', poster: '' }
  ];
  const DEFAULT_SHOWREEL_YT_ID = 'jtzYctPIu3E';

  /* Hardcoded seed text — matches what's actually in index.html today,
     used only for the one-time import when `projects` is empty. */
  const DEFAULT_SITE_CONTENT = {
    hero_intro: "I'm Beshoy — a Video Editor & Motion Designer creating engaging visual experiences through video editing and motion graphics.",
    about_heading: 'Crafting Stories That Move.',
    about_paragraph: "For the past four years, I've worked with brands, creators, and agencies to turn ideas into edits that feel clear, cinematic, and intentional. From fast-paced social content to long-form stories, I focus on rhythm, structure, and the details that keep people watching.",
    contact_heading: "Let's Create Something.",
    email: 'beshoy12zaref@gmail.com',
    instagram_url: 'https://www.instagram.com/besho_zareff?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==',
    showreel_heading: 'Showreel',
    longform_heading: 'Long Form',
    longform_description: 'Landscape edits with room to breathe — story, structure, and pacing across the full runtime.',
    reels_heading: 'Selected Reels',
    reels_description: 'A run of short-form edits — pacing, sound design, and story built for the scroll.',
    aiskills_heading: 'AI Skills',
    aiskills_description: 'Skills shown through the work — generative footage, compositing, and AI-built visuals cut to story.'
  };

  function buildImportProjectRows() {
    const rows = [];
    rows.push({ title: 'Showreel', section: 'showreel', category: 'Showreel', description: '', video_url: 'https://youtu.be/' + DEFAULT_SHOWREEL_YT_ID, thumbnail_url: '', display_order: 0, is_visible: true });
    DEFAULT_LONG_FORM.forEach((v, i) => rows.push({ title: v.title, section: 'long_form', category: v.cat, description: '', video_url: v.src || '', thumbnail_url: v.poster || '', display_order: i, is_visible: true }));
    DEFAULT_REELS.forEach((r, i) => rows.push({ title: r.title, section: 'reels', category: r.cat, description: '', video_url: r.src || '', thumbnail_url: r.poster || '', display_order: i, is_visible: true }));
    DEFAULT_AI_SKILLS.forEach((a, i) => rows.push({ title: a.title, section: 'ai_skills', category: a.tags.join(', '), description: a.desc, video_url: a.src || '', thumbnail_url: a.poster || '', display_order: i, is_visible: true }));
    return rows;
  }

  /* ================= session / auth gating ================= */
  let currentSession = null;

  function showLogin() {
    document.getElementById('loginView').hidden = false;
    document.getElementById('appView').hidden = true;
  }
  function showApp() {
    document.getElementById('loginView').hidden = true;
    document.getElementById('appView').hidden = false;
  }

  async function verifiedSession() {
    if (!sb) return null;
    try {
      const { data, error } = await sb.auth.getSession();
      if (error || !data || !data.session) return null;
      const email = data.session.user && data.session.user.email;
      if (email !== ADMIN_EMAIL) {
        try { await sb.auth.signOut(); } catch (e) {}
        return null;
      }
      return data.session;
    } catch (e) {
      return null;
    }
  }

  async function checkSessionAndRender() {
    currentSession = await verifiedSession();
    if (currentSession) {
      showApp();
      initDashboardData();
    } else {
      showLogin();
    }
  }

  function wireLogin() {
    const form = document.getElementById('loginForm');
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      errEl.textContent = '';
      if (!sb) { errEl.textContent = 'Cannot reach the login service right now. Please try again later.'; return; }
      const email = document.getElementById('li-email').value.trim();
      const password = document.getElementById('li-password').value;
      btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error || !data || !data.session) {
          errEl.textContent = 'Sign-in failed. Check your email and password and try again.';
          return;
        }
        if (data.session.user.email !== ADMIN_EMAIL) {
          try { await sb.auth.signOut(); } catch (e) {}
          errEl.textContent = 'This account is not authorized for admin access.';
          return;
        }
        currentSession = data.session;
        form.reset();
        showApp();
        initDashboardData();
      } catch (e) {
        errEl.textContent = 'Network error — could not reach the login service.';
      } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
      }
    });
  }

  function wireLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try { if (sb) await sb.auth.signOut(); } catch (e) {}
      currentSession = null;
      showLogin();
    });
  }

  /* ================= nav ================= */
  function wireNav() {
    const items = document.querySelectorAll('.navitem[data-view]');
    items.forEach(btn => {
      btn.addEventListener('click', () => {
        items.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById('view-' + btn.dataset.view);
        if (view) view.classList.add('active');
        document.getElementById('sidebar').classList.remove('open');
        if (btn.dataset.view === 'media') loadMedia();
        if (btn.dataset.view === 'analytics') loadAnalytics();
        if (btn.dataset.view === 'content') loadSiteContent();
      });
    });
    document.getElementById('navToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  /* ================= dashboard / projects data ================= */
  let allProjects = [];

  async function initDashboardData() {
    await loadProjects();
    updateDashboardStats();
    loadAnalyticsQuiet();
  }

  async function loadProjects() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from('projects').select('*').order('section', { ascending: true }).order('display_order', { ascending: true });
      if (error || !Array.isArray(data)) { allProjects = []; return; }
      allProjects = data;
      renderProjectsList();
      const importBanner = document.getElementById('importBanner');
      if (importBanner) importBanner.hidden = allProjects.length !== 0;
    } catch (e) {
      allProjects = [];
    }
  }

  function updateDashboardStats() {
    document.getElementById('statProjects').textContent = allProjects.length;
    document.getElementById('statVisible').textContent = allProjects.filter(p => p.is_visible).length;
  }

  const SECTION_LABELS = { showreel: 'Showreel', long_form: 'Long Form', reels: 'Reels', ai_skills: 'AI Skills' };

  function renderProjectsList() {
    const container = document.getElementById('projectsList');
    const search = (document.getElementById('projSearch').value || '').toLowerCase().trim();
    const sectionFilter = document.getElementById('projSectionFilter').value;

    const sections = ['showreel', 'long_form', 'reels', 'ai_skills'];
    let html = '';
    sections.forEach(sec => {
      if (sectionFilter && sectionFilter !== sec) return;
      const rows = allProjects
        .filter(p => p.section === sec)
        .filter(p => !search || (p.title || '').toLowerCase().includes(search) || (p.category || '').toLowerCase().includes(search))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      if (!rows.length) return;
      html += `<div class="section-group" data-section="${sec}">
        <div class="section-group-head">${SECTION_LABELS[sec]}</div>
        ${rows.map(p => projectRowHTML(p)).join('')}
      </div>`;
    });
    container.innerHTML = html || '<p class="hint">No projects match.</p>';
    bindProjectRowEvents();
    bindDragAndDrop();
  }

  function projectRowHTML(p) {
    const thumb = isHttpUrl(p.thumbnail_url) ? `<img class="proj-thumb" src="${esc(p.thumbnail_url)}" alt="">` : `<div class="proj-thumb"></div>`;
    return `<div class="proj-row" draggable="true" data-id="${esc(p.id)}" data-section="${esc(p.section)}">
      ${thumb}
      <div class="proj-info">
        <div class="proj-title">${esc(p.title)}</div>
        <div class="proj-cat">${esc(p.category || '')}</div>
      </div>
      <div class="proj-actions">
        <label class="vis-toggle"><input type="checkbox" class="vis-check" data-id="${esc(p.id)}" ${p.is_visible ? 'checked' : ''}> Visible</label>
        ${isHttpUrl(p.video_url) ? `<a class="btn" href="${esc(p.video_url)}" target="_blank" rel="noopener noreferrer">Preview</a>` : ''}
        <button class="btn edit-btn" data-id="${esc(p.id)}">Edit</button>
        <button class="btn danger del-btn" data-id="${esc(p.id)}">Delete</button>
      </div>
    </div>`;
  }

  function bindProjectRowEvents() {
    document.querySelectorAll('.vis-check').forEach(cb => {
      cb.addEventListener('change', async () => {
        const id = cb.dataset.id;
        try {
          await sb.from('projects').update({ is_visible: cb.checked }).eq('id', id);
          const p = allProjects.find(x => String(x.id) === String(id));
          if (p) p.is_visible = cb.checked;
          updateDashboardStats();
        } catch (e) { cb.checked = !cb.checked; }
      });
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openProjectForm(allProjects.find(p => String(p.id) === String(btn.dataset.id))));
    });
    document.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this project? This cannot be undone.')) return;
        const id = btn.dataset.id;
        try {
          await sb.from('projects').delete().eq('id', id);
          await loadProjects();
          updateDashboardStats();
        } catch (e) { alert('Delete failed. Please try again.'); }
      });
    });
  }

  function bindDragAndDrop() {
    let draggedId = null;
    document.querySelectorAll('.proj-row').forEach(row => {
      row.addEventListener('dragstart', () => { draggedId = row.dataset.id; row.classList.add('dragging'); });
      row.addEventListener('dragend', () => row.classList.remove('dragging'));
      row.addEventListener('dragover', e => {
        e.preventDefault();
        const group = row.closest('.section-group');
        const dragging = group.querySelector('.dragging');
        if (!dragging || dragging === row) return;
        const rect = row.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        group.insertBefore(dragging, before ? row : row.nextSibling);
      });
      row.addEventListener('drop', async e => {
        e.preventDefault();
        const group = row.closest('.section-group');
        const ids = Array.from(group.querySelectorAll('.proj-row')).map(r => r.dataset.id);
        try {
          await Promise.all(ids.map((id, i) => sb.from('projects').update({ display_order: i }).eq('id', id)));
          ids.forEach((id, i) => {
            const p = allProjects.find(x => String(x.id) === String(id));
            if (p) p.display_order = i;
          });
        } catch (e) { /* best effort */ }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const s = document.getElementById('projSearch');
    const f = document.getElementById('projSectionFilter');
    if (s) s.addEventListener('input', renderProjectsList);
    if (f) f.addEventListener('change', renderProjectsList);
  });

  /* ================= project add/edit form ================= */
  let pendingThumbUpload = null; // {file}

  function openProjectForm(project) {
    document.getElementById('projectModalTitle').textContent = project ? 'Edit Project' : 'Add Project';
    document.getElementById('pf-id').value = project ? project.id : '';
    document.getElementById('pf-title').value = project ? project.title || '' : '';
    document.getElementById('pf-section').value = project ? project.section || 'reels' : 'reels';
    document.getElementById('pf-category').value = project ? project.category || '' : '';
    document.getElementById('pf-description').value = project ? project.description || '' : '';
    document.getElementById('pf-video').value = project ? project.video_url || '' : '';
    document.getElementById('pf-thumb-url').value = project ? project.thumbnail_url || '' : '';
    document.getElementById('pf-order').value = project ? (project.display_order || 0) : (allProjects.filter(p => p.section === (project ? project.section : 'reels')).length);
    document.getElementById('pf-visible').checked = project ? !!project.is_visible : true;
    document.getElementById('pf-video-note').textContent = '';
    document.getElementById('pf-thumb-file').value = '';
    document.getElementById('pf-upload-progress').hidden = true;
    document.getElementById('pf-upload-bar').style.width = '0%';
    pendingThumbUpload = null;
    const preview = document.getElementById('pf-thumb-preview');
    if (project && isHttpUrl(project.thumbnail_url)) { preview.src = project.thumbnail_url; preview.classList.add('show'); }
    else { preview.removeAttribute('src'); preview.classList.remove('show'); }
    document.getElementById('projectFormStatus').textContent = '';
    document.getElementById('projectModal').classList.add('open');
  }
  function closeProjectForm() { document.getElementById('projectModal').classList.remove('open'); }

  function wireProjectForm() {
    document.getElementById('addProjectBtn').addEventListener('click', () => openProjectForm(null));
    document.getElementById('projectModalClose').addEventListener('click', closeProjectForm);
    document.getElementById('projectFormCancel').addEventListener('click', closeProjectForm);

    document.getElementById('pf-video').addEventListener('input', e => {
      const note = document.getElementById('pf-video-note');
      const val = e.target.value.trim();
      if (!val) { note.textContent = ''; return; }
      if (!isHttpUrl(val)) { note.textContent = 'Must be a valid http(s) URL.'; return; }
      const yt = parseYouTubeId(val);
      note.textContent = yt ? 'Recognized as a YouTube video.' : 'Will be treated as a direct video file link.';
    });

    document.getElementById('pf-thumb-file').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!okTypes.includes(file.type)) { alert('Only JPEG, PNG, WEBP or GIF images are allowed.'); e.target.value = ''; return; }
      if (file.size > 10 * 1024 * 1024) { alert('Image must be 10MB or smaller.'); e.target.value = ''; return; }
      pendingThumbUpload = { file };
      const preview = document.getElementById('pf-thumb-preview');
      const reader = new FileReader();
      reader.onload = ev => { preview.src = ev.target.result; preview.classList.add('show'); };
      reader.readAsDataURL(file);
    });

    document.getElementById('projectForm').addEventListener('submit', async e => {
      e.preventDefault();
      const status = document.getElementById('projectFormStatus');
      const saveBtn = document.getElementById('projectFormSave');
      status.className = 'save-status'; status.textContent = '';
      const videoVal = document.getElementById('pf-video').value.trim();
      if (videoVal && !isHttpUrl(videoVal)) { status.className = 'save-status err'; status.textContent = 'Video URL must be a valid http(s) link.'; return; }

      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      try {
        let thumbUrl = document.getElementById('pf-thumb-url').value.trim();
        if (pendingThumbUpload) {
          status.textContent = 'Uploading thumbnail…';
          thumbUrl = await uploadThumbnail(pendingThumbUpload.file);
        }

        const row = {
          title: document.getElementById('pf-title').value.trim(),
          section: document.getElementById('pf-section').value,
          category: document.getElementById('pf-category').value.trim(),
          description: document.getElementById('pf-description').value.trim(),
          video_url: videoVal,
          thumbnail_url: thumbUrl,
          display_order: parseInt(document.getElementById('pf-order').value, 10) || 0,
          is_visible: document.getElementById('pf-visible').checked
        };

        const id = document.getElementById('pf-id').value;
        if (id) {
          const { error } = await sb.from('projects').update(row).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await sb.from('projects').insert(row);
          if (error) throw error;
        }
        status.className = 'save-status ok'; status.textContent = 'Saved.';
        await loadProjects();
        updateDashboardStats();
        setTimeout(closeProjectForm, 500);
      } catch (err) {
        status.className = 'save-status err';
        status.textContent = 'Save failed: ' + (err && err.message ? err.message : 'unknown error');
      } finally {
        saveBtn.disabled = false; saveBtn.textContent = 'Save';
      }
    });
  }

  function safeExt(filename, mime) {
    const fromName = (filename.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fromName) return fromName;
    const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    return map[mime] || 'bin';
  }

  function uploadThumbnail(file) {
    return new Promise((resolve, reject) => {
      if (!currentSession || !currentSession.access_token) { reject(new Error('Not signed in.')); return; }
      const ext = safeExt(file.name || '', file.type);
      const path = Date.now() + '-' + (crypto && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)) + '.' + ext;
      const url = SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + currentSession.access_token);
      xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('x-upsert', 'false');

      const progressWrap = document.getElementById('pf-upload-progress');
      const bar = document.getElementById('pf-upload-bar');
      progressWrap.hidden = false;
      xhr.upload.onprogress = evt => {
        if (evt.lengthComputable) bar.style.width = Math.round((evt.loaded / evt.total) * 100) + '%';
      };
      xhr.onload = () => {
        progressWrap.hidden = true;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path);
        } else {
          reject(new Error('Upload failed (' + xhr.status + ').'));
        }
      };
      xhr.onerror = () => { progressWrap.hidden = true; reject(new Error('Upload network error.')); };
      xhr.send(file);
    });
  }

  /* ================= site content ================= */
  async function loadSiteContent() {
    const status = document.getElementById('contentStatus');
    status.textContent = '';
    if (!sb) return;
    try {
      const { data, error } = await sb.from('site_content').select('*');
      if (error || !Array.isArray(data)) return;
      const map = {};
      data.forEach(row => {
        if (row && typeof row.key === 'string') {
          const v = row.value;
          map[row.key] = typeof v === 'string' ? v : (v && typeof v === 'object' ? (v.text || v.value || '') : '');
        }
      });
      Object.keys(map).forEach(key => {
        const el = document.getElementById('sc-' + key);
        if (el && map[key]) el.value = map[key];
      });
    } catch (e) { /* keep fields blank — defensive */ }
  }

  function wireSiteContentForm() {
    document.getElementById('contentForm').addEventListener('submit', async e => {
      e.preventDefault();
      const status = document.getElementById('contentStatus');
      status.className = 'save-status'; status.textContent = 'Saving…';
      if (!sb) { status.className = 'save-status err'; status.textContent = 'Not connected.'; return; }
      const fields = document.querySelectorAll('#contentForm [data-key]');
      const writes = [];
      fields.forEach(el => {
        const val = el.value.trim();
        if (!val) return;
        writes.push({ key: el.dataset.key, value: val, updated_at: new Date().toISOString() });
      });
      try {
        for (const row of writes) {
          const { error } = await sb.from('site_content').upsert(row, { onConflict: 'key' });
          if (error) throw error;
        }
        status.className = 'save-status ok'; status.textContent = 'Saved. The public site will pick this up on next load.';
      } catch (err) {
        status.className = 'save-status err';
        status.textContent = 'Save failed — check that your site_content table matches the expected key/value shape (see README). ' + (err && err.message ? err.message : '');
      }
    });
  }

  /* ================= media ================= */
  async function loadMedia() {
    const grid = document.getElementById('mediaGrid');
    grid.innerHTML = '<p class="hint">Loading…</p>';
    if (!sb) { grid.innerHTML = '<p class="hint">Not connected.</p>'; return; }
    try {
      const { data, error } = await sb.storage.from(BUCKET).list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (error || !Array.isArray(data)) { grid.innerHTML = '<p class="hint">Could not load media.</p>'; return; }
      if (!data.length) { grid.innerHTML = '<p class="hint">No files yet.</p>'; return; }
      grid.innerHTML = data.map(f => {
        const publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + f.name;
        return `<div class="media-item">
          <img src="${esc(publicUrl)}" alt="" loading="lazy" onerror="this.style.opacity=0.2">
          <div class="media-name">${esc(f.name)}</div>
          <div class="media-actions">
            <button class="btn copy-url-btn" data-url="${esc(publicUrl)}">Copy URL</button>
            <button class="btn danger del-media-btn" data-name="${esc(f.name)}">Delete</button>
          </div>
        </div>`;
      }).join('');
      grid.querySelectorAll('.copy-url-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          try { navigator.clipboard.writeText(btn.dataset.url); btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy URL', 1200); }
          catch (e) { prompt('Copy URL:', btn.dataset.url); }
        });
      });
      grid.querySelectorAll('.del-media-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete "' + btn.dataset.name + '" from storage? This cannot be undone, and any project using it will show a broken thumbnail.')) return;
          try {
            const { error } = await sb.storage.from(BUCKET).remove([btn.dataset.name]);
            if (error) throw error;
            loadMedia();
          } catch (e) { alert('Delete failed.'); }
        });
      });
    } catch (e) {
      grid.innerHTML = '<p class="hint">Could not load media.</p>';
    }
  }

  /* ================= analytics ================= */
  async function loadAnalyticsQuiet() {
    try { await computeAnalytics(); } catch (e) { /* dashboard stat cards just stay blank */ }
  }

  async function loadAnalytics() {
    await computeAnalytics();
  }

  async function computeAnalytics() {
    if (!sb) return;
    try {
      const { data, error } = await sb.from('page_views').select('page_path, referrer, device_type, visitor_id, created_at');
      if (error || !Array.isArray(data)) return;

      const total = data.length;
      const uniqueVisitors = new Set(data.map(r => r.visitor_id)).size;
      const now = Date.now();
      const dayMs = 86400000;
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const today = data.filter(r => new Date(r.created_at) >= todayStart).length;
      const last7 = data.filter(r => now - new Date(r.created_at).getTime() <= 7 * dayMs).length;
      const last30 = data.filter(r => now - new Date(r.created_at).getTime() <= 30 * dayMs).length;
      const mobile = data.filter(r => r.device_type === 'mobile').length;
      const desktop = data.filter(r => r.device_type === 'desktop').length;

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('statViews', total);
      set('statVisitors', uniqueVisitors);
      set('aTotal', total);
      set('aUnique', uniqueVisitors);
      set('aToday', today);
      set('a7', last7);
      set('a30', last30);
      set('aMobile', mobile + ' / ' + desktop);

      const refCounts = {};
      data.forEach(r => {
        const ref = r.referrer && r.referrer.trim() ? r.referrer : '(direct)';
        let key = ref;
        try { key = ref === '(direct)' ? ref : new URL(ref).hostname; } catch (e) {}
        refCounts[key] = (refCounts[key] || 0) + 1;
      });
      const topRefs = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const refList = document.getElementById('referrersList');
      if (refList) {
        refList.innerHTML = topRefs.length
          ? topRefs.map(([k, v]) => `<div class="ref-row"><span>${esc(k)}</span><span>${v}</span></div>`).join('')
          : '<p class="hint">No data yet.</p>';
      }

      drawVisitsChart(data);
    } catch (e) { /* leave stat cards as-is */ }
  }

  function drawVisitsChart(data) {
    const canvas = document.getElementById('visitsChart');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const days = 14;
    const counts = new Array(days).fill(0);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    data.forEach(r => {
      const d = new Date(r.created_at); d.setHours(0, 0, 0, 0);
      const diff = Math.round((now - d) / 86400000);
      if (diff >= 0 && diff < days) counts[days - 1 - diff]++;
    });
    const max = Math.max(1, ...counts);
    const padding = 24;
    const barGap = 6;
    const barW = (w - padding * 2) / days - barGap;

    ctx.strokeStyle = '#33383C';
    ctx.beginPath(); ctx.moveTo(padding, h - padding); ctx.lineTo(w - padding, h - padding); ctx.stroke();

    ctx.fillStyle = '#F36B36';
    counts.forEach((c, i) => {
      const barH = (h - padding * 2) * (c / max);
      const x = padding + i * (barW + barGap);
      const y = h - padding - barH;
      ctx.fillRect(x, y, barW, Math.max(1, barH));
    });
  }

  /* ================= import current portfolio ================= */
  function wireImport() {
    const btn = document.getElementById('importBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!confirm('Import the current default portfolio content into your database? This runs once — click OK to continue.')) return;
      btn.disabled = true; btn.textContent = 'Importing…';
      try {
        const { data: check } = await sb.from('projects').select('id', { count: 'exact', head: false }).limit(1);
        if (check && check.length) { alert('Projects already exist — import skipped to avoid duplicates.'); return; }

        const rows = buildImportProjectRows();
        const { error: projErr } = await sb.from('projects').insert(rows);
        if (projErr) throw projErr;

        for (const key of Object.keys(DEFAULT_SITE_CONTENT)) {
          try { await sb.from('site_content').upsert({ key, value: DEFAULT_SITE_CONTENT[key], updated_at: new Date().toISOString() }, { onConflict: 'key' }); }
          catch (e) { /* site_content shape may differ — best effort, see README */ }
        }

        alert('Import complete. The public site will pick up this content on its next load.');
        await loadProjects();
        updateDashboardStats();
        loadSiteContent();
      } catch (err) {
        alert('Import failed: ' + (err && err.message ? err.message : 'unknown error'));
      } finally {
        btn.disabled = false; btn.textContent = 'Import Current Portfolio';
      }
    });
  }

  /* ================= boot ================= */
  document.addEventListener('DOMContentLoaded', () => {
    wireLogin();
    wireLogout();
    wireNav();
    wireProjectForm();
    wireSiteContentForm();
    wireImport();
    document.getElementById('refreshMediaBtn').addEventListener('click', loadMedia);
    document.getElementById('refreshAnalyticsBtn').addEventListener('click', loadAnalytics);

    checkSessionAndRender();

    if (sb) {
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          currentSession = null;
          showLogin();
          return;
        }
        if (session.user && session.user.email === ADMIN_EMAIL) {
          currentSession = session;
          showApp();
        } else {
          sb.auth.signOut().catch(() => {});
        }
      });
    }
  });
})();
