// lesson.js – lektionsmotor för Sofias matematik

let _steps = [];
let _options = {};
let _current = 0;
let _attempts = 0;
let _isDrawing = false;
let _lastX = 0;
let _lastY = 0;

function initLesson(steps, options) {
  _steps = steps;
  _options = options;
  _current = 0;

  document.getElementById('backBtn').onclick = () => {
    window.location.href = options.backUrl;
  };

  renderStep();
}

function renderStep() {
  buildDots();
  const s = _steps[_current];
  const content = document.getElementById('content');
  content.innerHTML = '';
  content.scrollTop = 0;

  if (s.type === 'theory') {
    renderTheory(s, content);
  } else {
    renderExercise(s, content);
  }

  // Låt MathJax rendera ny matematik
  if (window.MathJax) {
    MathJax.typesetPromise([content]).catch(err => console.log(err));
  }
}

function renderTheory(s, container) {
  const exLines = s.example.split('\n').map(l => `<div>${l}</div>`).join('');

  container.innerHTML = `
    <div class="theory-block">
      <div class="theory-label">Teori</div>
      <div class="theory-text">${s.text}</div>
      <div class="theory-example">${exLines}</div>
    </div>
    <button class="btn-primary" onclick="nextStep()">Jag förstår – visa uppgifter</button>
  `;
}

function renderExercise(s, container) {
  _attempts = 0;

  container.innerHTML = `
    <div class="exercise-q" id="exerciseQ">${s.q}</div>

    <div class="draw-wrap">
      <div class="draw-label">Rita dina uträkningar här</div>
      <canvas class="draw-canvas" id="drawCanvas" width="600" height="340"></canvas>
      <div class="draw-tools">
        <button class="btn-ghost" style="width:auto; padding:4px 14px;" onclick="clearCanvas()">Rensa</button>
      </div>
    </div>

    <input
      class="answer-input"
      id="answerInput"
      type="text"
      inputmode="text"
      placeholder="Svaret är…"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    >

    <div class="feedback" id="feedback"></div>

    <button class="btn-primary" id="checkBtn" onclick="checkAnswer()">Kontrollera</button>
    <button class="btn-secondary" id="nextBtn" style="display:none" onclick="nextStep()">
      ${_current < _steps.length - 1 ? 'Nästa' : (_options.doneText || 'Klar')}
    </button>
    <button class="btn-ghost" id="hintBtn" onclick="showHint()">Visa ledtråd</button>
  `;

  setupCanvas();

  document.getElementById('answerInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkAnswer();
  });
}

function setupCanvas() {
  const canvas = document.getElementById('drawCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2A2A28';

  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - r.left) * scaleX,
      y: (src.clientY - r.top) * scaleY
    };
  };

  const start = (e) => {
    e.preventDefault();
    _isDrawing = true;
    const p = getPos(e);
    _lastX = p.x; _lastY = p.y;
  };

  const move = (e) => {
    if (!_isDrawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(_lastX, _lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    _lastX = p.x; _lastY = p.y;
  };

  const end = () => { _isDrawing = false; };

  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove',  move,  { passive: false });
  canvas.addEventListener('touchend',   end);
  canvas.addEventListener('mousedown',  start);
  canvas.addEventListener('mousemove',  move);
  canvas.addEventListener('mouseup',    end);
}

function clearCanvas() {
  const c = document.getElementById('drawCanvas');
  if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

function normalizeAnswer(str) {
  return str.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
}

function checkAnswer() {
  const s = _steps[_current];
  const input = document.getElementById('answerInput');
  const fb = document.getElementById('feedback');
  const val = normalizeAnswer(input.value);

  if (!val) {
    fb.className = 'feedback retry';
    fb.textContent = 'Skriv ditt svar i rutan.';
    return;
  }

  _attempts++;

  const correct = normalizeAnswer(s.answer);
  const alts = (s.altAnswers || []).map(normalizeAnswer);
  const isCorrect = val === correct || alts.includes(val);

  if (isCorrect) {
    input.className = 'answer-input correct';
    fb.className = 'feedback correct';
    fb.innerHTML = s.ok;
    document.getElementById('checkBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'block';
    document.getElementById('hintBtn').style.display = 'none';
    if (window.MathJax) MathJax.typesetPromise([fb]);
  } else {
    input.className = 'answer-input retry';
    fb.className = 'feedback retry';
    fb.innerHTML = _attempts >= 2 ? s.hint : s.retry;
    input.value = '';
    setTimeout(() => input.focus(), 100);
    if (window.MathJax) MathJax.typesetPromise([fb]);
  }
}

function showHint() {
  const s = _steps[_current];
  const fb = document.getElementById('feedback');
  fb.className = 'feedback retry';
  fb.innerHTML = s.hint;
  document.getElementById('hintBtn').style.display = 'none';
  if (window.MathJax) MathJax.typesetPromise([fb]);
}

function nextStep() {
  _current++;
  if (_current >= _steps.length) {
    showDone();
  } else {
    renderStep();
  }
}

function showDone() {
  const content = document.getElementById('content');
  const dots = document.getElementById('dots');
  dots.innerHTML = '';

  content.innerHTML = `
    <div class="done-wrap">
      <div class="done-icon">⭐</div>
      <div class="done-title">Bra jobbat!</div>
      <div class="done-sub">Du har gått igenom alla uppgifter i det här avsnittet.</div>
      <button class="btn-primary" style="max-width:280px" onclick="window.location.href='${_options.doneUrl}'">
        ${_options.doneText || 'Tillbaka'}
      </button>
    </div>
  `;
}

function buildDots() {
  const wrap = document.getElementById('dots');
  if (!wrap) return;
  wrap.innerHTML = '';
  _steps.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i < _current ? ' done' : i === _current ? ' active' : '');
    wrap.appendChild(d);
  });
}
