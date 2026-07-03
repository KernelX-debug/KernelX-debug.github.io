/* ============================================================
   Angel Casas — script.js
   Matrix rain (ambient) + terminal typewriter + audio player
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Matrix rain (ambient background) ---------------- */

const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

const glyphs = "アイウエオカキクケコサシスセソ0123456789<>/[]{}#";
const fontSize = 15;
let drops = [];

function setupColumns(){
  const columns = Math.floor(canvas.width / fontSize);
  drops = new Array(columns).fill(0).map(() => Math.random() * -50);
}
setupColumns();

window.addEventListener('resize', () => {
  resizeCanvas();
  setupColumns();
});

function drawMatrix(){
  ctx.fillStyle = "rgba(10,12,16,0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + "px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(29, 213, 26, 0.94)";

  for(let i = 0; i < drops.length; i++){
    if(Math.random() > 0.55){ drops[i]++; continue; } // sparsify + slow down

    const text = glyphs[Math.floor(Math.random() * glyphs.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if(drops[i] * fontSize > canvas.height && Math.random() > 0.985){
      drops[i] = 0;
    }
    drops[i]++;
  }
}

if(!reduceMotion){
  setInterval(drawMatrix, 60);
}

/* ---------------- Terminal typewriter ---------------- */

const termBody = document.getElementById('terminalBody');

const termLines = [
  { text: "root@angelcasas:~$", type: "cmd" },
  { text: "just a child learning new things every day", type: "out" },
  { text: "", type: "out" },
  { text: "root@angelcasas:~$ about me:", type: "cmd" },
  { text: "rol      : Developer · Cybersecurity", type: "out" },
  { text: "estado   : [ONLINE]", type: "out" }
];

// Contador real y persistente vía CounterAPI (gratis, sin backend propio).
// V1 no requiere API key: https://docs.counterapi.dev/api/endpoints/v1/
const COUNTER_NAMESPACE = "kernelx-debug-angelcasas";
const COUNTER_NAME = "site-views";
const COUNTER_BASE_URL = `https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_NAME}`;
const LAST_VISIT_KEY = "angelcasas_last_visit";
const FALLBACK_VISIT_COUNT = 32; // se usa solo si la API no responde (offline, bloqueada, etc.)

// Solo suma +1 una vez por día por navegador (evita que un F5 infle el número).
// El resto de las veces solo consulta el valor actual, sin incrementarlo.
async function getVisitCount(){
  const today = new Date().toISOString().slice(0, 10);
  let lastVisit = null;
  try{ lastVisit = localStorage.getItem(LAST_VISIT_KEY); } catch(e){ /* localStorage bloqueado */ }

  const shouldIncrement = lastVisit !== today;
  const endpoint = shouldIncrement ? `${COUNTER_BASE_URL}/up` : COUNTER_BASE_URL;

  try{
    const res = await fetch(endpoint);
    if(!res.ok) throw new Error("counter request failed");
    const data = await res.json();
    if(shouldIncrement){
      try{ localStorage.setItem(LAST_VISIT_KEY, today); } catch(e){ /* localStorage bloqueado */ }
    }
    return typeof data.count === "number" ? data.count : null;
  } catch(err){
    return null;
  }
}

const visitCountPromise = getVisitCount();

async function renderStatic(){
  termBody.innerHTML = "";
  termLines.forEach(line => {
    const div = document.createElement('div');
    div.className = "term-line " + line.type;
    div.textContent = line.text;
    termBody.appendChild(div);
  });
  const count = await visitCountPromise;
  const visitsDiv = document.createElement('div');
  visitsDiv.className = "term-line out";
  visitsDiv.innerHTML = `visitas  : <span id="visitCount">${String(count !== null ? count : FALLBACK_VISIT_COUNT).padStart(4,'0')}</span><span class="cursor"></span>`;
  termBody.appendChild(visitsDiv);
}

function typeTerminal(){
  if(reduceMotion){
    renderStatic();
    return;
  }

  let li = 0;

  function typeLine(){
    if(li >= termLines.length){
      appendVisitsLine();
      return;
    }

    const line = termLines[li];
    const div = document.createElement('div');
    div.className = "term-line " + line.type;
    termBody.appendChild(div);

    let ci = 0;
    (function typeChar(){
      if(ci < line.text.length){
        div.textContent += line.text[ci];
        ci++;
        setTimeout(typeChar, 14);
      } else {
        li++;
        setTimeout(typeLine, line.text === "" ? 120 : 180);
      }
    })();
  }

  typeLine();
}

async function appendVisitsLine(){
  const div = document.createElement('div');
  div.className = "term-line out";
  div.innerHTML = 'visitas  : <span id="visitCount">0000</span><span class="cursor"></span>';
  termBody.appendChild(div);

  const count = await visitCountPromise;
  animateVisitCount(count !== null ? count : FALLBACK_VISIT_COUNT);
}

function animateVisitCount(target){
  const el = document.getElementById('visitCount');
  if(!el) return;
  let current = 0;
  const stepTime = target > 300 ? 12 : 45; // números grandes suben más rápido
  const step = setInterval(() => {
    current++;
    el.textContent = String(current).padStart(4, '0');
    if(current >= target){
      el.textContent = String(target).padStart(4, '0');
      clearInterval(step);
    }
  }, stepTime);
}

typeTerminal();

/* ---------------- Audio player ---------------- */

const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const progress = document.getElementById('progress');
const timeCurrent = document.getElementById('timeCurrent');
const timeTotal = document.getElementById('timeTotal');
const player = document.getElementById('player');

// "My Way" (2008 Remastered) runs 4:36 — used as the initial/fallback
// display until the browser confirms the real duration from metadata.
const FALLBACK_DURATION_SECONDS = 4 * 60 + 36;

let playing = false;

function formatTime(seconds){
  if(!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

timeTotal.textContent = formatTime(FALLBACK_DURATION_SECONDS);

audio.addEventListener('loadedmetadata', () => {
  timeTotal.textContent = formatTime(
    isFinite(audio.duration) ? audio.duration : FALLBACK_DURATION_SECONDS
  );
});

audio.addEventListener('durationchange', () => {
  if(isFinite(audio.duration)){
    timeTotal.textContent = formatTime(audio.duration);
  }
});

playBtn.addEventListener('click', () => {
  if(!playing){
    audio.play();
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    playBtn.setAttribute('aria-label', 'Pausar');
    player.classList.add('playing');
  } else {
    audio.pause();
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    playBtn.setAttribute('aria-label', 'Reproducir');
    player.classList.remove('playing');
  }
  playing = !playing;
});

audio.addEventListener('timeupdate', () => {
  const duration = isFinite(audio.duration) ? audio.duration : FALLBACK_DURATION_SECONDS;
  const percent = (audio.currentTime / duration) * 100 || 0;
  progress.style.width = Math.min(percent, 100) + "%";
  timeCurrent.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('ended', () => {
  playing = false;
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  playBtn.setAttribute('aria-label', 'Reproducir');
  player.classList.remove('playing');
  progress.style.width = "0%";
  timeCurrent.textContent = "0:00";
});
