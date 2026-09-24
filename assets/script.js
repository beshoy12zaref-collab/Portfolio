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

// simple accessible preview modal
let lastFocused = null;
const overlay = document.getElementById('modalOverlay');
function openModal(title){
  lastFocused = document.activeElement;
  document.getElementById('modalText').textContent = `"${title}" — preview not yet available. Upload the real edit to enable playback here.`;
  overlay.classList.add('open');
  overlay.querySelector('.modal-close').focus();
}
function closeModal(){
  overlay.classList.remove('open');
  if(lastFocused) lastFocused.focus();
}
track.querySelectorAll('.reel-card').forEach((card,i) => {
  card.addEventListener('click', () => openModal(reels[i].title));
  card.addEventListener('keydown', e => { if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openModal(reels[i].title); } });
});
overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
overlay.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if(e.key==='Escape' && overlay.classList.contains('open')) closeModal(); });

const aiCards = [
  {title:'Generative Backplate', desc:'AI-generated environment composited into a live-action plate.', tags:['AI Video','Compositing']},
  {title:'Prompt-to-Motion', desc:'Fully generative motion sequence built from iterative prompt design.', tags:['AI Video','Prompt Design']},
  {title:'AI-Assisted Grade', desc:'Style-matched grading pass using AI-assisted color tools.', tags:['Motion','Compositing']},
  {title:'Synthetic B-Roll', desc:'AI b-roll generated and blended into a documentary edit.', tags:['AI Video','Motion']}
];
document.getElementById('aiRow').innerHTML = aiCards.map((c,i) => `
  <div class="ai-card${i===0?' featured':''}">
    <div class="ai-thumb">VIDEO PLACEHOLDER · 16:9</div>
    <div class="ai-body">
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="tags">${c.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    </div>
  </div>`).join('');

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

function handleForm(e){
  e.preventDefault();
  const btn = e.target.querySelector('.cta-btn');
  btn.textContent = "Not connected yet — email me directly";
  btn.disabled = true;
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
