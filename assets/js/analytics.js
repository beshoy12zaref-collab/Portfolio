/* ================================================================
   PUBLIC SITE — minimal, privacy-respecting page-view analytics.
   Loads last, after supabase-config.js. Fully non-blocking and
   fail-silent: never throws, never delays page render, never
   collects personal info. Only fields written: page_path,
   referrer, device_type, visitor_id, created_at — where visitor_id
   is a random anonymous UUID persisted in localStorage (NOT an
   email, name, IP or fingerprint).
   ================================================================ */
(function () {
  'use strict';

  function getVisitorId() {
    try {
      let id = localStorage.getItem('pf_visitor_id');
      if (!id) {
        id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        localStorage.setItem('pf_visitor_id', id);
      }
      return id;
    } catch (e) {
      return null; // localStorage unavailable (private mode etc.) — skip logging
    }
  }

  function getDeviceType() {
    try {
      const ua = navigator.userAgent || '';
      const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
      const isNarrow = (window.innerWidth || document.documentElement.clientWidth || 1024) < 768;
      return (isMobileUA || isNarrow) ? 'mobile' : 'desktop';
    } catch (e) {
      return 'unknown';
    }
  }

  async function logPageView() {
    try {
      if (!window.supabaseClient) return;

      let already = false;
      try { already = sessionStorage.getItem('pf_pv_logged') === '1'; } catch (e) { /* ignore */ }
      if (already) return;

      const visitorId = getVisitorId();
      if (!visitorId) return;

      const row = {
        page_path: location.pathname || '/',
        referrer: document.referrer || null,
        device_type: getDeviceType(),
        visitor_id: visitorId
      };

      const { error } = await window.supabaseClient.from('page_views').insert(row);
      if (!error) {
        try { sessionStorage.setItem('pf_pv_logged', '1'); } catch (e) { /* ignore */ }
      } else {
        // Retry once with an explicit created_at in case the column has no DB default.
        try {
          const row2 = Object.assign({}, row, { created_at: new Date().toISOString() });
          const retry = await window.supabaseClient.from('page_views').insert(row2);
          if (!retry.error) { try { sessionStorage.setItem('pf_pv_logged', '1'); } catch (e) {} }
        } catch (e) { /* fail silent */ }
      }
    } catch (e) {
      /* Never throw, never block the page. */
    }
  }

  function init() {
    try { logPageView(); } catch (e) { /* fail silent */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
