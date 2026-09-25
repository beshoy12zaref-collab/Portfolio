/* ================================================================
   PUBLIC SITE — live Supabase data loader.
   Loads AFTER script.js (so the DEFAULT_* fallback content from
   script.js has already rendered synchronously) and AFTER
   supabase-config.js (so window.supabaseClient exists).

   Contract: every network call here is wrapped in try/catch and is
   purely additive — if Supabase is unreachable, errors, times out,
   or a given section/row has no live data, this file does nothing
   for that piece and the static defaults already on screen stay
   exactly as they are. The site must never end up empty because of
   this file.

   Also exposes window.PortfolioImport — shared default-data →
   Supabase-row mapping helpers reused by admin/admin.js for the
   one-time "Import Current Portfolio" action, so the DEFAULT_*
   arrays and the row shape are defined in exactly one place.
   ================================================================ */
(function () {
  'use strict';

  function isHttpUrl(u) {
    if (!u || typeof u !== 'string') return false;
    try {
      const parsed = new URL(u, location.href);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  /* ---------------- shared import helpers (used by admin.js too) --------------- */
  window.PortfolioImport = window.PortfolioImport || {
    /* Maps the script.js DEFAULT_* fallback arrays into `projects` table rows.
       Field names match the schema exactly: title, section, category,
       description, video_url, thumbnail_url, display_order, is_visible. */
    buildProjectRows: function () {
      const rows = [];
      let order = 0;

      if (typeof DEFAULT_SHOWREEL_YT_ID === 'string' && DEFAULT_SHOWREEL_YT_ID) {
        rows.push({
          title: 'Showreel',
          section: 'showreel',
          category: 'Showreel',
          description: '',
          video_url: 'https://youtu.be/' + DEFAULT_SHOWREEL_YT_ID,
          thumbnail_url: '',
          display_order: order++,
          is_visible: true
        });
      }

      order = 0;
      (typeof DEFAULT_LONG_FORM !== 'undefined' ? DEFAULT_LONG_FORM : []).forEach(function (v) {
        rows.push({
          title: v.title || '',
          section: 'long_form',
          category: v.cat || '',
          description: '',
          video_url: v.src || '',
          thumbnail_url: v.poster || '',
          display_order: order++,
          is_visible: true
        });
      });

      order = 0;
      (typeof DEFAULT_REELS !== 'undefined' ? DEFAULT_REELS : []).forEach(function (r) {
        rows.push({
          title: r.title || '',
          section: 'reels',
          category: r.cat || '',
          description: '',
          video_url: r.src || '',
          thumbnail_url: r.poster || '',
          display_order: order++,
          is_visible: true
        });
      });

      order = 0;
      (typeof DEFAULT_AI_SKILLS !== 'undefined' ? DEFAULT_AI_SKILLS : []).forEach(function (a) {
        rows.push({
          title: a.title || '',
          section: 'ai_skills',
          category: (a.tags && a.tags.length) ? a.tags.join(', ') : '',
          description: a.desc || '',
          video_url: a.src || '',
          thumbnail_url: a.poster || '',
          display_order: order++,
          is_visible: true
        });
      });

      return rows;
    },

    /* Maps a `projects` row back into the {title, cat, src, poster[, desc, tags]}
       shape script.js's render*() functions expect. */
    rowToRenderItem: function (row) {
      const item = {
        title: row.title || '',
        cat: row.category || '',
        src: isHttpUrl(row.video_url) || (typeof row.video_url === 'string' && row.video_url.startsWith('./')) ? row.video_url : '',
        poster: isHttpUrl(row.thumbnail_url) || (typeof row.thumbnail_url === 'string' && row.thumbnail_url.startsWith('./')) ? row.thumbnail_url : ''
      };
      if (row.section === 'ai_skills') {
        item.desc = row.description || '';
        item.tags = row.category ? row.category.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [];
      }
      return item;
    }
  };

  /* ---------------------------- live projects ---------------------------- */
  async function loadProjects() {
    if (!window.supabaseClient) return;
    try {
      const { data, error } = await window.supabaseClient
        .from('projects')
        .select('id, title, section, category, description, video_url, thumbnail_url, display_order, is_visible')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error || !Array.isArray(data)) return;

      const bySection = { showreel: [], long_form: [], reels: [], ai_skills: [] };
      data.forEach(function (row) {
        if (bySection[row.section]) bySection[row.section].push(row);
      });

      if (bySection.showreel.length) {
        const sr = bySection.showreel[0];
        if (isHttpUrl(sr.video_url) && typeof setShowreelVideo === 'function') setShowreelVideo(sr.video_url);
        if (typeof setShowreelText === 'function') setShowreelText(sr.title, sr.description);
        if (isHttpUrl(sr.thumbnail_url) && typeof setShowreelThumbnail === 'function') setShowreelThumbnail(sr.thumbnail_url);
      }
      if (bySection.long_form.length && typeof renderLongForm === 'function') {
        renderLongForm(bySection.long_form.map(window.PortfolioImport.rowToRenderItem));
      }
      if (bySection.reels.length && typeof renderReels === 'function') {
        renderReels(bySection.reels.map(window.PortfolioImport.rowToRenderItem));
      }
      if (bySection.ai_skills.length && typeof renderAiSkills === 'function') {
        renderAiSkills(bySection.ai_skills.map(window.PortfolioImport.rowToRenderItem));
      }
    } catch (e) {
      /* Supabase unreachable / any unexpected shape — static defaults stay. */
    }
  }

  /* ---------------------------- live site content ---------------------------- */

  /* `site_content` schema (confirmed): a single-row-per-group table —
     columns `id text primary key, content jsonb, updated_at timestamptz`.
     Convention adopted here (must match admin/admin.js exactly): ONE row,
     id = 'site', whose `content` JSON object holds every editable field,
     keyed exactly by the Site Content form's `data-key` attributes
     (hero_intro, about_heading, about_paragraph, contact_heading,
     contact_paragraph, email, instagram_url, showreel_heading,
     longform_heading, longform_description, reels_heading,
     reels_description, aiskills_heading, aiskills_description).
     See README.md for the full convention. Read code stays defensive: it
     tolerates a field value being a plain string OR an object like
     {text: "..."}, and simply skips anything missing or malformed. */
  function extractText(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text;
      if (typeof value.value === 'string') return value.value;
    }
    return '';
  }

  function setText(selector, text) {
    if (!text) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
  }

  async function loadSiteContent() {
    if (!window.supabaseClient) return;
    try {
      const { data, error } = await window.supabaseClient
        .from('site_content')
        .select('id, content')
        .eq('id', 'site')
        .maybeSingle();
      if (error || !data || typeof data.content !== 'object' || data.content === null) return;

      const map = {};
      Object.keys(data.content).forEach(function (key) {
        map[key] = extractText(data.content[key]);
      });

      setText('.hero-line', map.hero_intro);
      setText('#about h2', map.about_heading);
      setText('#about .bio', map.about_paragraph);
      setText('#contact h2', map.contact_heading);
      /* No `contact_paragraph` target exists in the current markup that is
         unambiguous — `#contact .rv p` would also match the live form's
         status message (`#formStatus`), corrupting it. The field stays
         editable/stored in the dashboard but is intentionally not applied
         here until a dedicated element exists. See README.md. */

      if (map.email && typeof esc === 'function') {
        setText('.contact-side .email', map.email);
        if (typeof setContactEmail === 'function') setContactEmail(map.email);
      }

      if (map.instagram_url && isHttpUrl(map.instagram_url)) {
        const a = document.querySelector('.socials a[href*="instagram"]');
        if (a) a.setAttribute('href', map.instagram_url);
      }

      setText('#showreel h2', map.showreel_heading);
      setText('#longform h2', map.longform_heading);
      setText('#longform .shead p', map.longform_description);
      setText('#reels h2', map.reels_heading);
      setText('#reels .shead p', map.reels_description);
      setText('#ai-skills h2', map.aiskills_heading);
      setText('#ai-skills .shead p', map.aiskills_description);
    } catch (e) {
      /* Supabase unreachable / unexpected schema — static defaults stay. */
    }
  }

  function init() {
    loadProjects();
    loadSiteContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
