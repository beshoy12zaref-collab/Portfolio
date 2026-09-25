/* ================================================================
   DEFAULT / FALLBACK CONTENT
   This is what renders immediately, with no network calls, so the
   site is never empty. If assets/js/portfolio-data.js later loads
   live data from Supabase successfully, it calls the render*()
   functions below again with that data — otherwise this fallback
   content simply stays on screen.
   ================================================================ */
const DEFAULT_REELS = [
  {title:'Arousa Tea',    cat:'Brand Story', src:'', poster:''},
  {title:'OpenClos',      cat:'Social Reel', src:'', poster:''},
  {title:'2026 Reel',     cat:'Showreel',    src:'', poster:''},
  {title:'Untitled Short',cat:'Narrative',   src:'', poster:''},
  {title:'Visualizer',    cat:'Music Edit',  src:'', poster:''},
  {title:'Product Spot',  cat:'Commercial',  src:'', poster:''}
];

/* EDIT YOUR LANDSCAPE (16:9) VIDEOS HERE (used only until Supabase data loads)
   src:    video URL or file path (e.g. 'videos/project-1.mp4'). Leave '' → "Video coming soon".
   poster: poster image URL/path (16:9 recommended, e.g. 1920×1080). Leave '' → branded placeholder. */
const DEFAULT_LONG_FORM = [
  {title:'Featured Long-Form Project', cat:'Documentary', src:'', poster:''},  // featured (large)
  {title:'Long-Form Project 02',       cat:'Brand Film',  src:'', poster:''},
  {title:'Long-Form Project 03',       cat:'YouTube',     src:'', poster:''}
];
const DEFAULT_AI_SKILLS = [
  {title:'AI Video Generation',     desc:'Prompt-built footage shaped into a finished, story-driven edit.',        tags:['Generative','Prompt Design'], src:'', poster:''},
  {title:'AI-Assisted Compositing', desc:'Generated elements matched and blended into live-action plates.',        tags:['Compositing','VFX'],          src:'', poster:''},
  {title:'AI Product Visuals',      desc:'Product shots and environments created and animated with AI tools.',     tags:['Product','Motion'],           src:'', poster:''},
  {title:'AI Visual Storytelling',  desc:'Generative scenes cut to rhythm and sound for a complete narrative.',     tags:['Storytelling','Editing'],     src:'', poster:''}
];
let DEFAULT_SHOWREEL_YT_ID = 'jtzYctPIu3E';
let CONTACT_EMAIL = 'beshoy12zaref@gmail.com';

const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Recognizes youtube.com/watch, youtu.be, youtube.com/shorts and youtube.com/embed links
   and returns the 11-character video id, or null if the string isn't a YouTube link. */
function parseYouTubeId(url){
  if(!url || typeof url !== 'string') return null;
  try{
    const u = new URL(url, location.href);
    const host = u.hostname.replace(/^www\./,'').replace(/^m\./,'');
    if(host === 'youtu.be'){
      const id = u.pathname.split('/').filter(Boolean)[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if(host === 'youtube.com' || host === 'youtube-nocookie.com'){
      if(u.pathname === '/watch'){
        const id = u.searchParams.get('v');
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      const parts = u.pathname.split('/').filter(Boolean);
      if((parts[0] === 'shorts' || parts[0] === 'embed') && parts[1]){
        return /^[\w-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  }catch(e){ /* not a valid URL */ }
  return null;
}

/* Declared here (before the render*() calls below) rather than further down, because
   renderAiSkills() references it immediately when called for the default content at
   load time — declaring it later with `const` would throw a temporal-dead-zone
   ReferenceError and abort the rest of this script. */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); } });
}, {threshold:.15});

/* Thumbnail fallback: if an uploaded/linked thumbnail 404s or otherwise fails
   to load, drop back to the exact placeholder markup that was already there
   (never a broken-image icon). The placeholder element is always rendered
   in the DOM and simply hidden by CSS (`.has-thumb`) while a thumbnail
   image is present; on error we remove the image (and its overlay) and
   drop the `has-thumb` class so CSS reveals the placeholder again. */
function handleThumbError(img){
  const card = img.closest('.reel-card') || img.closest('.vposter');
  if(card) card.classList.remove('has-thumb');
  const overlay = img.nextElementSibling;
  if(overlay && overlay.classList && overlay.classList.contains('thumb-overlay')) overlay.remove();
  img.remove();
}

const track = document.getElementById('reelTrack');
function reelCardHTML(r, i){
  const hasThumb = !!r.poster;
  return `
  <div class="reel-item">
    <div class="reel-card${hasThumb?' has-thumb':''}" tabindex="0" role="button" data-i="${i}" aria-label="Preview ${esc(r.title)}">
      <div class="reel-fill">VIDEO<br>PLACEHOLDER</div>
      ${hasThumb ? `<img src="${esc(r.poster)}" alt="" loading="lazy" onerror="handleThumbError(this)">` : ''}
      ${hasThumb ? `<div class="thumb-overlay" aria-hidden="true"></div>` : ''}
      <div class="play">▶</div>
    </div>
    <div class="reel-meta">
      <span class="reel-num">${String(i+1).padStart(2,'0')}</span>
      <span class="reel-title">${esc(r.title)}</span>
      <span class="reel-cat">${esc(r.cat)}</span>
    </div>
  </div>`;
}
function bindReelCards(list){
  track.querySelectorAll('.reel-card').forEach(card => {
    const i = +card.dataset.i;
    card.addEventListener('click', () => openModal(list[i].title, {src:list[i].src, poster:list[i].poster}));
    card.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openModal(list[i].title, {src:list[i].src, poster:list[i].poster}); } });
  });
}
function renderReels(list){
  track.innerHTML = list.map(reelCardHTML).join('');
  bindReelCards(list);
}
renderReels(DEFAULT_REELS);
function scrollCarousel(dir){ track.scrollBy({left: dir*260, behavior:'smooth'}); }

// accessible preview modal — plays a real video (direct file or YouTube link) when a src
// is supplied, otherwise shows an intentional "coming soon" state
let lastFocused = null;
const overlay = document.getElementById('modalOverlay');
const modalBox = overlay.querySelector('.modal-box');
const modalVideo = document.getElementById('modalVideo');
const modalText = document.getElementById('modalText');
const modalYT = document.getElementById('modalYT');
function openModal(title, opts = {}){
  lastFocused = document.activeElement;
  modalBox.classList.toggle('landscape', !!opts.landscape);
  const ytId = parseYouTubeId(opts.src);
  modalBox.classList.toggle('has-yt', !!ytId);
  modalBox.classList.toggle('has-video', !!opts.src && !ytId);
  if(ytId){
    modalText.textContent = '';
    overlay.classList.add('yt-open');
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.title = title || 'Video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    modalYT.replaceChildren(f);
  } else if(opts.src){
    modalVideo.src = opts.src;
    if(opts.poster) modalVideo.poster = opts.poster; else modalVideo.removeAttribute('poster');
    modalVideo.setAttribute('aria-label', title);
    const p = modalVideo.play(); if(p && p.catch) p.catch(()=>{});
  } else if(opts.landscape){
    modalText.innerHTML = '<span class="modal-soon">Video coming soon</span>';
    modalText.appendChild(document.createTextNode(`"${title}" is being prepared — the full edit will play here once it's uploaded.`));
  } else {
    modalText.textContent = `"${title}" — preview not yet available. Upload the real edit to enable playback here.`;
  }
  overlay.classList.add('open');
  overlay.querySelector('.modal-close').focus();
}
function closeModal(){
  overlay.classList.remove('open');
  modalVideo.pause(); modalVideo.removeAttribute('src'); modalVideo.load();
  modalBox.classList.remove('has-yt'); overlay.classList.remove('yt-open'); modalYT.innerHTML = '';
  modalBox.classList.remove('has-video');
  if(lastFocused) lastFocused.focus();
}
overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
overlay.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if(e.key==='Escape' && overlay.classList.contains('open')) closeModal(); });

function posterHTML(v, i){
  const empty = !v.src;
  const hasThumb = !!v.poster;
  return `<button type="button" class="vposter${empty?' is-empty':''}${hasThumb?' has-thumb':''}" data-i="${i}" aria-label="${empty?'Video coming soon: ':'Play '}${esc(v.title)}">
      <span class="vmark" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>
      ${hasThumb ? `<img src="${esc(v.poster)}" alt="" loading="lazy" onerror="handleThumbError(this)">` : ''}
      ${hasThumb ? `<div class="thumb-overlay" aria-hidden="true"></div>` : ''}
      <span class="vplay" aria-hidden="true">▶</span>
      ${empty ? '<span class="vsoon">Video coming soon</span>' : ''}
      ${!hasThumb ? '<span class="vratio" aria-hidden="true">16:9</span>' : ''}
    </button>`;
}
function bindPosters(root, list){
  root.querySelectorAll('.vposter').forEach(btn => btn.addEventListener('click', () => {
    const v = list[+btn.dataset.i];
    openModal(v.title, {landscape:true, src:v.src, poster:v.poster});
  }));
}

const lfGrid = document.getElementById('longFormGrid');
function renderLongForm(list){
  lfGrid.innerHTML = list.map((v,i) => `
  <div class="vcard${i===0?' featured':''}">
    ${posterHTML(v,i)}
    <div class="vmeta">
      <span class="reel-num">${String(i+1).padStart(2,'0')}</span>
      <span class="reel-title">${esc(v.title)}</span>
      <span class="reel-cat">${esc(v.cat)}</span>
    </div>
  </div>`).join('');
  bindPosters(lfGrid, list);
}
renderLongForm(DEFAULT_LONG_FORM);

const aiGrid = document.getElementById('aiSkillsGrid');
function renderAiSkills(list){
  aiGrid.innerHTML = list.map((v,i) => `
  <article class="ai-card rv">
    ${posterHTML(v,i)}
    <div class="ai-body">
      <span class="ai-num">${String(i+1).padStart(2,'0')}</span>
      <h3>${esc(v.title)}</h3>
      <p>${esc(v.desc)}</p>
      ${v.tags && v.tags.length ? `<div class="tags">${v.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
  </article>`).join('');
  bindPosters(aiGrid, list);
  document.querySelectorAll('#aiSkillsGrid .ai-card').forEach(el => io && io.observe(el));
}
renderAiSkills(DEFAULT_AI_SKILLS);

const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
burgerBtn.addEventListener('click', () => {
  burgerBtn.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burgerBtn.classList.remove('open'); mobileMenu.classList.remove('open');
}));

document.querySelectorAll('.rv').forEach(el => io.observe(el));

async function handleForm(e){
  e.preventDefault();
  const form = e.target;
  const btn = form.querySelector('.cta-btn');
  const status = document.getElementById('formStatus');
  if(form._honey.value) return; // spam bot
  status.className = 'form-status'; status.textContent = '';
  btn.disabled = true; btn.textContent = 'Sending…';
  try{
    const res = await fetch('https://formsubmit.co/ajax/' + CONTACT_EMAIL, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify({
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        _replyto: form.email.value.trim(),
        _subject: 'New message from your portfolio website',
        _template: 'table',
        _captcha: 'false'
      })
    });
    const data = await res.json().catch(()=>({}));
    if(!res.ok || String(data.success) === 'false') throw new Error(data.message || 'Send failed');
    form.reset();
    status.classList.add('ok');
    status.textContent = 'Thanks — your message has been sent. I’ll get back to you soon.';
  }catch(err){
    status.classList.add('err');
    status.innerHTML = `Sorry, something went wrong. Please try again or email me at <a href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>.`;
  }finally{
    btn.disabled = false; btn.textContent = 'Send Message';
  }
}

/* Lets portfolio-data.js apply a Site Content override for the contact email without
   touching any other approved markup. */
function setContactEmail(email){
  if(!email || typeof email !== 'string') return;
  CONTACT_EMAIL = email;
  const el = document.querySelector('.contact-side .email');
  if(el) el.textContent = email;
  const form = document.getElementById('contactForm');
  if(form) form.action = 'https://formsubmit.co/' + email;
}

(function(){
  const canvas = document.getElementById('pixelCanvas');
  const heroEl = document.querySelector('.hero');
  if(!canvas || !heroEl || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const tile = 34;
  let w,h,cols,rows,tiles=[];
  const palette = ['#333F48','#3B4750','#2B2C2B','#30393F'];
  function build(){
    w = canvas.width = heroEl.clientWidth;
    h = canvas.height = heroEl.clientHeight;
    cols = Math.ceil(w/tile)+1; rows = Math.ceil(h/tile)+1;
    tiles = [];
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      let c = palette[(x+y)%palette.length];
      if((x*7+y*13)%29===0) c = 'rgba(243,107,54,.32)';
      else if((x*11+y*5)%37===0) c = 'rgba(255,248,235,.10)';
      tiles.push({x:x*tile,y:y*tile,base:c,lift:0});
    }
  }
  let mouse={x:-9999,y:-9999};
  function draw(){
    ctx.clearRect(0,0,w,h);
    for(const t of tiles){
      const dx=(t.x+tile/2)-mouse.x, dy=(t.y+tile/2)-mouse.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const target = dist<110 ? (1-dist/110) : 0;
      t.lift += (target-t.lift)*0.12;
      const size = tile*0.72*(1+t.lift*0.28);
      const off = t.lift*4;
      ctx.globalAlpha = 0.55+t.lift*0.4;
      ctx.fillStyle = t.base;
      ctx.fillRect(t.x+(tile-size)/2, t.y-off+(tile-size)/2, size, size);
    }
  }
  let raf=null, running=false;
  function loop(){ draw(); if(running) raf=requestAnimationFrame(loop); }
  function start(){ if(!running){ running=true; loop(); } }
  function stop(){ running=false; if(raf) cancelAnimationFrame(raf); }
  build();
  if(reduceMotion || isTouch){
    draw();
  } else {
    heroEl.addEventListener('mousemove', e=>{
      const r = heroEl.getBoundingClientRect();
      mouse.x = e.clientX-r.left; mouse.y = e.clientY-r.top;
    });
    heroEl.addEventListener('mouseleave', ()=>{ mouse.x=-9999; mouse.y=-9999; });
    new IntersectionObserver(es=>{ es.forEach(e=> e.isIntersecting?start():stop()); }, {threshold:0}).observe(heroEl);
  }
  window.addEventListener('resize', ()=>{ build(); if(!running) draw(); });
})();

// Showreel: the approved custom frame opens a video in the shared lightbox on click.
// Defaults to the YouTube video below; portfolio-data.js can call setShowreelVideo()
// to point it at a different link from Supabase without touching the frame itself.
let SHOWREEL_SRC = 'https://youtu.be/' + DEFAULT_SHOWREEL_YT_ID;
(function(){
  const frame = document.getElementById('showreelFrame');
  if(!frame) return;
  function openShowreel(){ openModal('Showreel', {landscape:true, src:SHOWREEL_SRC}); }
  frame.addEventListener('click', openShowreel);
  frame.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openShowreel(); } });
})();
function setShowreelVideo(url){
  if(!url || typeof url !== 'string') return;
  SHOWREEL_SRC = url;
}

/* Lets portfolio-data.js apply the live Showreel row's title/description
   onto the existing `.sr-label` markup without adding or restructuring any
   DOM — only the text content of the existing <strong> and its trailing
   text node changes. Missing/blank values leave the current text alone. */
function setShowreelText(title, description){
  const label = document.querySelector('#showreelFrame .sr-label');
  if(!label) return;
  if(title){
    const strong = label.querySelector('strong');
    if(strong) strong.textContent = title;
  }
  if(description){
    const node = label.lastChild;
    if(node && node.nodeType === Node.TEXT_NODE) node.textContent = description;
  }
}

/* Lets portfolio-data.js apply the live Showreel row's thumbnail. The
   showreel frame has no <img> by default (it's a plain textured frame), so
   this inserts one — plus the same cinematic overlay used elsewhere — as
   the frame's first children, behind the existing play button/label
   (unaffected). On load failure the image and overlay are removed and the
   frame simply falls back to its original textured background. */
function setShowreelThumbnail(url){
  if(!url || typeof url !== 'string') return;
  const frame = document.getElementById('showreelFrame');
  if(!frame) return;
  let img = frame.querySelector(':scope > img');
  let overlay = frame.querySelector(':scope > .thumb-overlay');
  if(!img){
    img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.onerror = function(){ img.remove(); if(overlay) overlay.remove(); };
    frame.insertBefore(img, frame.firstChild);
    overlay = document.createElement('div');
    overlay.className = 'thumb-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    frame.insertBefore(overlay, img.nextSibling);
  }
  img.src = url;
}
