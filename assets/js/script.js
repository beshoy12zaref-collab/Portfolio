const reels = [
  {cat:'Brand Story', title:'Arousa Tea'},
  {cat:'Social Reel', title:'OpenClos'},
  {cat:'Showreel', title:'2026 Reel'},
  {cat:'Narrative', title:'Untitled Short'},
  {cat:'Music Edit', title:'Visualizer'},
  {cat:'Commercial', title:'Product Spot'}
];
const track = document.getElementById('reelTrack');
track.innerHTML = reels.map((r,i) => `
  <div class="reel-item">
    <div class="reel-card" tabindex="0" role="button" aria-label="Preview ${r.title}">
      <div class="reel-fill">VIDEO<br>PLACEHOLDER</div>
      <div class="play">▶</div>
    </div>
    <div class="reel-meta">
      <span class="reel-num">${String(i+1).padStart(2,'0')}</span>
      <span class="reel-title">${r.title}</span>
      <span class="reel-cat">${r.cat}</span>
    </div>
  </div>`).join('');
function scrollCarousel(dir){ track.scrollBy({left: dir*260, behavior:'smooth'}); }

// accessible preview modal — plays a real video when a src is supplied,
// otherwise shows an intentional "coming soon" state
let lastFocused = null;
const overlay = document.getElementById('modalOverlay');
const modalBox = overlay.querySelector('.modal-box');
const modalVideo = document.getElementById('modalVideo');
const modalText = document.getElementById('modalText');
function openModal(title, opts = {}){
  lastFocused = document.activeElement;
  modalBox.classList.toggle('landscape', !!opts.landscape);
  modalBox.classList.toggle('has-video', !!opts.src);
  if(opts.src){
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
  modalBox.classList.remove('has-yt'); overlay.classList.remove('yt-open'); document.getElementById('modalYT').innerHTML = '';
  modalBox.classList.remove('has-video');
  if(lastFocused) lastFocused.focus();
}
track.querySelectorAll('.reel-card').forEach((card,i) => {
  card.addEventListener('click', () => openModal(reels[i].title));
  card.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openModal(reels[i].title); } });
});
overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
overlay.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if(e.key==='Escape' && overlay.classList.contains('open')) closeModal(); });

/* ================================================================
   EDIT YOUR LANDSCAPE (16:9) VIDEOS HERE
   src:    video URL or file path (e.g. 'videos/project-1.mp4'). Leave '' → "Video coming soon".
   poster: poster image URL/path (16:9 recommended, e.g. 1920×1080). Leave '' → branded placeholder.
   ================================================================ */
const LONG_FORM = [
  {title:'Featured Long-Form Project', cat:'Documentary', src:'', poster:''},  // featured (large)
  {title:'Long-Form Project 02',       cat:'Brand Film',  src:'', poster:''},
  {title:'Long-Form Project 03',       cat:'YouTube',     src:'', poster:''}
];
const AI_SKILLS = [
  {title:'AI Video Generation',     desc:'Prompt-built footage shaped into a finished, story-driven edit.',        tags:['Generative','Prompt Design'], src:'', poster:''},
  {title:'AI-Assisted Compositing', desc:'Generated elements matched and blended into live-action plates.',        tags:['Compositing','VFX'],          src:'', poster:''},
  {title:'AI Product Visuals',      desc:'Product shots and environments created and animated with AI tools.',     tags:['Product','Motion'],           src:'', poster:''},
  {title:'AI Visual Storytelling',  desc:'Generative scenes cut to rhythm and sound for a complete narrative.',     tags:['Storytelling','Editing'],     src:'', poster:''}
];

const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function posterHTML(v, i){
  const empty = !v.src;
  return `<button type="button" class="vposter${empty?' is-empty':''}" data-i="${i}" aria-label="${empty?'Video coming soon: ':'Play '}${esc(v.title)}">
      ${v.poster ? `<img src="${esc(v.poster)}" alt="" loading="lazy">` : `<span class="vmark" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>`}
      <span class="vplay" aria-hidden="true">▶</span>
      ${empty ? '<span class="vsoon">Video coming soon</span>' : ''}
      ${!v.poster ? '<span class="vratio" aria-hidden="true">16:9</span>' : ''}
    </button>`;
}
function bindPosters(root, list){
  root.querySelectorAll('.vposter').forEach(btn => btn.addEventListener('click', () => {
    const v = list[+btn.dataset.i];
    openModal(v.title, {landscape:true, src:v.src, poster:v.poster});
  }));
}
const lfGrid = document.getElementById('longFormGrid');
lfGrid.innerHTML = LONG_FORM.map((v,i) => `
  <div class="vcard${i===0?' featured':''}">
    ${posterHTML(v,i)}
    <div class="vmeta">
      <span class="reel-num">${String(i+1).padStart(2,'0')}</span>
      <span class="reel-title">${esc(v.title)}</span>
      <span class="reel-cat">${esc(v.cat)}</span>
    </div>
  </div>`).join('');
bindPosters(lfGrid, LONG_FORM);

const aiGrid = document.getElementById('aiSkillsGrid');
aiGrid.innerHTML = AI_SKILLS.map((v,i) => `
  <article class="ai-card rv">
    ${posterHTML(v,i)}
    <div class="ai-body">
      <span class="ai-num">${String(i+1).padStart(2,'0')}</span>
      <h3>${esc(v.title)}</h3>
      <p>${esc(v.desc)}</p>
      ${v.tags && v.tags.length ? `<div class="tags">${v.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    </div>
  </article>`).join('');
bindPosters(aiGrid, AI_SKILLS);

const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
burgerBtn.addEventListener('click', () => {
  burgerBtn.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burgerBtn.classList.remove('open'); mobileMenu.classList.remove('open');
}));

const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); } });
}, {threshold:.15});
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
    const res = await fetch('https://formsubmit.co/ajax/beshoy12zaref@gmail.com', {
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
    status.innerHTML = 'Sorry, something went wrong. Please try again or email me at <a href="mailto:beshoy12zaref@gmail.com">beshoy12zaref@gmail.com</a>.';
  }finally{
    btn.disabled = false; btn.textContent = 'Send Message';
  }
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

// Showreel: the approved custom frame opens the YouTube video in the shared lightbox on click
const SHOWREEL_YT_ID = 'jtzYctPIu3E';
(function(){
  const frame = document.getElementById('showreelFrame');
  if(!frame) return;
  function openShowreel(){
    lastFocused = document.activeElement;
    modalText.textContent = '';
    modalBox.classList.add('landscape', 'has-yt');
    modalBox.classList.remove('has-video');
    overlay.classList.add('yt-open');
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + SHOWREEL_YT_ID + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.title = 'Showreel';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    document.getElementById('modalYT').replaceChildren(f);
    overlay.classList.add('open');
    overlay.querySelector('.modal-close').focus();
  }
  frame.addEventListener('click', openShowreel);
  frame.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openShowreel(); } });
})();
