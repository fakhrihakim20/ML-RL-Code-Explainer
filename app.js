// ===== STATE =====
const STATE = {
  provider: localStorage.getItem('ml_provider') || 'gemini',
  geminiToken: localStorage.getItem('ml_gemini_token') || '',
  geminiModel: localStorage.getItem('ml_gemini_model') || 'gemini-2.5-flash',
  hfToken: localStorage.getItem('ml_hf_token') || '',
  orToken: localStorage.getItem('ml_or_token') || '',
  hfModel: localStorage.getItem('ml_hf_model') || 'meta-llama/Llama-3.2-3B-Instruct',
  orModel: localStorage.getItem('ml_or_model') || 'google/gemma-4-31b-it:free',
  customModels: JSON.parse(localStorage.getItem('ml_custom_models') || '[]'),
  explanationData: null,
  visualData: null,
  equationData: null,
  equationImage: null,
  equationInputMode: 'type',
  lastProvider: '',
  lastModel: '',
  inputMode: 'code',
  zooms: { concept: 1, flowchart: 1 }
};

const LOADING_MSGS = [
  "📖 Reading your code carefully...",
  "🧠 Thinking like a professor...",
  "🔍 Finding the key concepts...",
  "✍️ Writing your explanation...",
  "🎯 Making it beginner-friendly...",
  "🔗 Connecting all the pieces...",
  "💡 Adding helpful analogies...",
  "🎓 Almost ready for you!"
];

const SYSTEM_PROMPT_EXPLAIN = `You are a world-class Python and Machine Learning professor. Your single most important job is making complex ideas feel obvious and exciting to a complete beginner — someone who has never written ML code before.

LINE REFERENCE RULE (critical): The user's code will be sent with each line prefixed by its line number in the format 'L{n}: '. Whenever you discuss any specific part of the code — in ANY section — you MUST cite the exact line number(s) using this format: [Line N] or [Lines N-M]. Example: 'The class definition at [Lines 5-12] sets up the neural network.' This lets the reader jump directly to that part of their code.

You follow the Feynman Technique strictly: if you cannot explain something with a real-world analogy a 12-year-old can picture, you do not move on until you can.

TONE RULES (non-negotiable):
- Never use jargon without immediately explaining it in plain English
- Never say "simply" or "just" — those words make beginners feel stupid
- Always be warm, patient, and encouraging — like a great teacher who genuinely wants you to succeed
- Use "you" and "your code" to keep it personal
- When something is hard, say so: "This part trips up a lot of people — here's why it makes sense"

Respond in EXACTLY these sections, with these exact headings:

### 🎯 What This Code Does (The Big Picture)
Write 2-3 sentences maximum. Explain what the code achieves as if you're describing it to someone at a dinner party — no technical words at all. Then in one sentence, name the real-world problem it solves.

### 📊 Difficulty & What You'll Need to Know
Rate the code difficulty: Beginner / Intermediate / Advanced.
List 3-5 prerequisite concepts the reader should know to fully understand this code. For each one, give a one-sentence plain-English description of what it is. If they don't know these yet, tell them that's okay — they'll pick them up as they read.

### 🔍 Section-by-Section Breakdown
Go through each meaningful block, function, or class. For each one:
  **[Block name or what it does]:** Explain what it does in 1-2 plain sentences. Then give a real-world analogy (start with "Think of it like..."). If the block has tricky lines, call them out: "The trickiest line here is X — it means Y."
Use clear sub-headings for each block.

### 🧠 Concept Dictionary
Find every ML/RL/Python concept in the code. For each one:
  **[Concept Name]:** What it means in one plain sentence. Then a real-world analogy in the next sentence starting with "Think of it like...". Then, if relevant, how it's used in this specific code.
Order them from simplest to most complex.

### 🔗 How the Pieces Work Together
Tell the story of what happens when someone runs this code — from the very first line to the very last output. Write it like a narrative, not a list. Use transitions like "first", "then", "which causes", "finally". Make the reader feel like they're watching the code run in slow motion.

### ⚠️ Where Beginners Usually Get Confused
List 3-5 specific things in this code that commonly trip up newcomers. For each one:
  **[The confusing thing]:** Why it's confusing, then the "aha!" explanation that makes it click.

### 💡 Beginner Tips for This Code
Give 4-6 practical tips specific to this code. These are things the reader can actually do: "Try changing X to Y and see what happens", "Add a print() statement after line Z to watch the data", etc. End with a specific encouragement — name something impressive the beginner has just understood.

### 🗺️ Your Learning Roadmap
Based on what this code uses, give a short ordered list of what to learn next. Format: "1. Learn [topic] → because this code uses [specific thing]". Maximum 5 items. End with one resource recommendation on a new line starting with "Resource:".`;

const SYSTEM_PROMPT_VISUAL = `You are a visual learning expert helping a complete beginner understand Python/ML code through diagrams and storytelling.

Your diagrams must be CLEAN and SIMPLE. A beginner looking at your diagram should immediately understand it — no squinting, no confusion. Prefer fewer nodes with clear labels over many nodes with vague labels.

STRICT MERMAID SYNTAX RULES (violations will break rendering — follow exactly):
- Start flowcharts with: flowchart TD
- Start concept maps with: graph LR  
- Node IDs must be short alphanumeric only: A, B, C1, step1, dataIn — NO underscores, NO spaces
- ALL node labels MUST be wrapped in double quotes inside brackets: A["Start the program"]
- NEVER put parentheses, colons, semicolons, slashes, angle brackets, or unicode symbols inside labels
- Keep labels SHORT — maximum 5 words per label
- Decision nodes use curly braces with quoted label: C{"Is reward positive?"}
- Arrow with label: A -->|"then"| B  (quotes around arrow label too)
- classDef lines use NO quotes: classDef process fill:#FEF3C7,stroke:#D97706,color:#78350F
- class assignment lines: class A,B,C process
- Every single node MUST be assigned to exactly one class

SECTION A - FLOWCHART (execution flow):
Show what happens step-by-step when the code runs. Aim for 8-14 nodes maximum.
Use these node classes:
  classDef input fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
  classDef process fill:#FEF3C7,stroke:#D97706,color:#78350F
  classDef decision fill:#EDE9FE,stroke:#7C3AED,color:#3B0764
  classDef output fill:#D1FAE5,stroke:#059669,color:#064E3B
  classDef error fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
  classDef data fill:#FFE4E6,stroke:#E11D48,color:#881337
  classDef loop fill:#FFF7ED,stroke:#EA580C,color:#7C2D12

Wrap in a \`\`\`mermaid code block.

SECTION B - CONCEPT MAP (how ideas relate):
Show how the KEY CONCEPTS in this code connect to each other. Aim for 6-10 concepts maximum. Use plain English relationship labels on arrows ("trains", "uses", "produces", "feeds into", "controls").
Use these node classes:
  classDef core fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
  classDef algo fill:#FEF3C7,stroke:#D97706,color:#78350F
  classDef data fill:#D1FAE5,stroke:#059669,color:#064E3B
  classDef lib fill:#EDE9FE,stroke:#7C3AED,color:#3B0764
  classDef math fill:#FFE4E6,stroke:#E11D48,color:#881337
  classDef infra fill:#F3F4F6,stroke:#6B7280,color:#1F2937

Wrap in a \`\`\`mermaid code block.

SECTION C - PLAIN ENGLISH WALKTHROUGH:
Write exactly 8-10 numbered steps. Each step is ONE simple sentence. Write it like a short story: "First, the program wakes up and loads your data. Then it asks: is this data clean? If yes..."
Make the reader feel like they are watching the code run in real time, in slow motion.

Return ONLY these three sections. Do not add any other commentary or headings.`;

// ===== EQUATION SYSTEM PROMPT =====
const SYSTEM_PROMPT_EQUATION = `You are a world-class mathematics professor and the best tutor in the world. Your superpower is making scary-looking equations feel obvious and exciting to a complete beginner.

You follow the Feynman Technique strictly: if you cannot explain a symbol or concept with a real-world analogy a 12-year-old can picture, you do not move on until you can.

TONE RULES (non-negotiable):
- Never use jargon without immediately explaining it in plain English
- Never say "simply" or "just"
- Always be warm, patient, and encouraging
- Use "you" and "your equation" to keep it personal
- When something is hard, say so: "This part trips up a lot of people — here's why it makes sense"
- For LaTeX notation, always explain what each symbol means in words FIRST before showing the math

Respond in EXACTLY these sections with these exact headings:

### 🎯 What This Equation Says (Plain English)
In 2-3 plain sentences, explain what this equation is describing — as if explaining to someone at dinner who hates math. No symbols. No jargon. Just the idea.

### 🔤 Every Symbol Decoded
List every variable, operator, and symbol in the equation. For each one:
  **[Symbol]:** What it represents in plain English. Then its units/type if applicable. Then "Think of it like..." analogy.
Order from left to right as they appear in the equation.

### 🧠 The Intuition Behind It
Explain WHY this equation is true or useful. Not just what it computes, but the deep intuition. Use a real-world story or analogy. This should make the reader say "Oh, of COURSE it works that way!" Write this as a flowing narrative (3-5 sentences).

### 🌍 Where You'll See This Equation
List 3-5 real-world domains or problems where this equation is used. For each:
  **[Domain/Use Case]:** One sentence explaining how this specific equation applies there.

### 📐 Step-by-Step: How It Works
Walk through what the equation DOES mathematically, step by step. Number each step. Each step is one plain sentence. If the equation is a formula, show how you'd evaluate it with a simple example (use tiny, friendly numbers). If it involves calculus or optimization, explain what "taking the derivative" or "minimizing" physically means in the context of this equation.

### ⚠️ Where People Usually Get Confused
List 2-4 specific things about this equation that commonly trip up learners. For each:
  **[The confusing thing]:** Why it's confusing, then the "aha!" explanation that makes it click.

### 🗺️ Your Learning Roadmap
Based on this equation, give an ordered list of what to learn next to fully master it. Format: "1. Learn [topic] → because this equation uses [specific thing]". Maximum 5 items. End with one resource recommendation on a new line starting with "Resource:".`;

const OR_MODELS = [
  { value: 'google/gemma-4-31b-it:free', label: 'Google Gemma 4 31B' },
  { value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nvidia Nemotron 3 Super 120B' },
  { value: 'nvidia/nemotron-nano-9b-v2:free', label: 'Nvidia Nemotron Nano 9B' },
  { value: 'inclusionai/ling-2.6-1t:free', label: 'InclusionAI Ling 2.6 1T' },
  { value: 'minimax/minimax-m2.5:free', label: 'MiniMax M2.5' },
  { value: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'Nvidia Nemotron 3 Nano 30B' },
  { value: 'openai/gpt-oss-120b:free', label: 'OpenAI GPT-OSS 120B' }
];

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===== THEME =====
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ml_theme', next);
  updateThemeIcon(next);
  const prismTheme = $('#prism-theme-css');
  if (prismTheme) {
    prismTheme.href = next === 'dark'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
  }
  const mermaidTheme = next === 'dark'
    ? { theme: 'base', themeVariables: { primaryColor: '#2A2A27', primaryTextColor: '#E5E5E0', lineColor: '#555', primaryBorderColor: '#444', background: '#1C1C1A', mainBkg: '#1C1C1A', nodeBorder: '#444', clusterBkg: '#252523', titleColor: '#E5E5E0', edgeLabelBackground: '#1C1C1A' }}
    : { theme: 'base', themeVariables: { primaryColor: '#F3F2EE', primaryTextColor: '#1A1A18', lineColor: '#999', primaryBorderColor: '#D0CEC8', background: '#FAF9F6', mainBkg: '#FAF9F6', nodeBorder: '#D0CEC8', clusterBkg: '#ECEAE4', titleColor: '#1A1A18', edgeLabelBackground: '#FAF9F6' }};
  mermaid.initialize({ startOnLoad: false, ...mermaidTheme });
}

function updateThemeIcon(theme) {
  const btn = $('#theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function closeDrawer() {
  $('#setup-drawer').classList.remove('open');
  $('#drawer-overlay').classList.remove('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcon(theme);
  buildModelDropdown();
  restoreState();
  bindEvents();
});

function buildModelDropdown() {
  const sel = $('#or-model');
  const currentVal = sel.value || STATE.orModel;
  sel.innerHTML = '';
  OR_MODELS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value; opt.textContent = m.label;
    sel.appendChild(opt);
  });
  if (STATE.customModels.length > 0) {
    const sep = document.createElement('option');
    sep.disabled = true; sep.textContent = '── Custom Models ──';
    sel.appendChild(sep);
    STATE.customModels.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value; opt.textContent = `★ ${m.label}`; opt.className = 'custom';
      sel.appendChild(opt);
    });
  }
  sel.value = currentVal;
}

function addCustomModel() {
  const input = $('#custom-model');
  const modelId = input.value.trim();
  if (!modelId) return;
  const allModels = [...OR_MODELS, ...STATE.customModels];
  if (allModels.some(m => m.value === modelId)) {
    input.value = '';
    input.placeholder = 'Model already exists!';
    setTimeout(() => { input.placeholder = 'e.g. openai/gpt-4o-mini'; }, 2000);
    return;
  }
  const label = modelId.split('/').pop().replace(/[-_:]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  STATE.customModels.push({ value: modelId, label });
  localStorage.setItem('ml_custom_models', JSON.stringify(STATE.customModels));
  buildModelDropdown();
  $('#or-model').value = modelId;
  STATE.orModel = modelId;
  localStorage.setItem('ml_or_model', modelId);
  input.value = '';
}

function removeCustomModel(modelId) {
  STATE.customModels = STATE.customModels.filter(m => m.value !== modelId);
  localStorage.setItem('ml_custom_models', JSON.stringify(STATE.customModels));
  if (STATE.orModel === modelId) {
    STATE.orModel = OR_MODELS[0].value;
    localStorage.setItem('ml_or_model', STATE.orModel);
  }
  buildModelDropdown();
  $('#or-model').value = STATE.orModel;
}

function restoreState() {
  if (STATE.provider === 'huggingface' && STATE.hfToken) $('#hf-token').value = STATE.hfToken;
  if (STATE.provider === 'openrouter' && STATE.orToken) {
    $('#or-token').value = STATE.orToken;
    $('#or-model').value = STATE.orModel;
  }
  if (STATE.provider === 'gemini' && STATE.geminiToken) {
    $('#gemini-token').value = STATE.geminiToken;
    $('#gemini-model').value = STATE.geminiModel;
  }
  setProvider(STATE.provider);
  updateSaveStatus();
}

function bindEvents() {
  $('#setup-toggle-btn').addEventListener('click', () => {
    $('#setup-drawer').classList.add('open');
    $('#drawer-overlay').classList.add('open');
  });
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#drawer-overlay').addEventListener('click', closeDrawer);
  $$('.provider-tab').forEach(tab => tab.addEventListener('click', () => setProvider(tab.dataset.provider)));
  $('#btn-save').addEventListener('click', saveToken);
  $('#btn-add-model').addEventListener('click', addCustomModel);
  $('#custom-model').addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomModel(); });
  $('#btn-explain').addEventListener('click', () => runExplain());
  $('#btn-visualize').addEventListener('click', () => runVisualize());
  $('#btn-clear').addEventListener('click', clearAll);
  $('#btn-explain-equation').addEventListener('click', () => runExplainEquation());
  $('#btn-clear-equation').addEventListener('click', clearEquation);
  $$('.result-tab').forEach(tab => tab.addEventListener('click', () => switchResultTab(tab.dataset.tab)));
  // Input mode switcher (Code vs Equation)
  $$('.input-mode-tab').forEach(tab => tab.addEventListener('click', () => switchInputMode(tab.dataset.mode)));
  // Equation sub-mode switcher (Type vs Image)
  $$('.eq-input-tab').forEach(tab => tab.addEventListener('click', () => switchEqInputMode(tab.dataset.eqmode)));
  // Live equation text preview
  $('#equation-input').addEventListener('input', debounce(updateEquationPreview, 600));
  // Image upload wiring
  $('#eq-btn-browse').addEventListener('click', () => $('#eq-file-input').click());
  $('#eq-file-input').addEventListener('change', (e) => { if (e.target.files[0]) handleEquationImageFile(e.target.files[0]); });
  // Line number gutter sync
  const codeInput = $('#code-input');
  if (codeInput) {
    codeInput.addEventListener('input',  () => { syncLineNumbers(); updateHighlight(); });
    codeInput.addEventListener('scroll', () => { syncLineNumbers(); syncHighlightScroll(); });
    codeInput.addEventListener('keyup',  () => syncLineNumbers());
    codeInput.addEventListener('paste',  () => setTimeout(() => { syncLineNumbers(); updateHighlight(); }, 0));
    syncLineNumbers();
    updateHighlight();
  }
  $('#eq-btn-paste-img').addEventListener('click', () => triggerPasteImage());
  $('#eq-img-remove').addEventListener('click', clearEquationImage);
  // Drag & drop
  const dz = $('#eq-drop-zone');
  dz.addEventListener('dragover',  (e) => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', ()  => dz.classList.remove('drag-over'));
  dz.addEventListener('drop',      (e) => { e.preventDefault(); dz.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) handleEquationImageFile(f); });
  // Global paste listener (images)
  document.addEventListener('paste', handleGlobalPaste);
}

function handleGlobalPaste(e) {
  // Only intercept if we are in equation-image mode and the clipboard has an image
  if (STATE.inputMode !== 'equation' || STATE.equationInputMode !== 'image') return;
  const items = Array.from(e.clipboardData?.items || []);
  const imgItem = items.find(i => i.type.startsWith('image/'));
  if (!imgItem) return;
  e.preventDefault();
  const file = imgItem.getAsFile();
  if (file) handleEquationImageFile(file);
}

function updateHighlight() {
  const ta = $('#code-input');
  const hl = $('#code-highlight-inner');
  if (!ta || !hl) return;
  hl.textContent = ta.value;
  if (window.Prism) Prism.highlightElement(hl);
}

function syncHighlightScroll() {
  const ta = $('#code-input');
  const pre = $('#code-highlight');
  if (ta && pre) {
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
  }
}

function triggerPasteImage() {
  // Try to read image from clipboard via Clipboard API
  if (!navigator.clipboard?.read) {
    showToast('Press Ctrl+V anywhere on the page to paste an image.');
    return;
  }
  navigator.clipboard.read().then(items => {
    for (const item of items) {
      const imgType = item.types.find(t => t.startsWith('image/'));
      if (imgType) {
        item.getType(imgType).then(blob => handleEquationImageFile(new File([blob], 'pasted.png', { type: imgType })));
        return;
      }
    }
    showToast('No image found in clipboard. Copy an image first, then paste.');
  }).catch(() => {
    showToast('Press Ctrl+V anywhere on the page to paste an image.');
  });
}

function handleEquationImageFile(file) {
  if (!file.type.startsWith('image/')) { showToast('Please upload an image file (JPG, PNG, WebP, GIF).'); return; }
  if (file.size > 10 * 1024 * 1024) { showToast('Image is too large. Please use an image under 10 MB.'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const base64 = dataUrl.split(',')[1];
    const mimeType = file.type;
    STATE.equationImage = { data: base64, mimeType, name: file.name, dataUrl };
    // Show preview
    $('#eq-drop-zone').style.display = 'none';
    const preview = $('#eq-img-preview');
    preview.style.display = 'block';
    $('#eq-img-thumb').src = dataUrl;
    $('#eq-img-caption').textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
    // Show context row
    $('#eq-context-row').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearEquationImage() {
  STATE.equationImage = null;
  $('#eq-img-preview').style.display = 'none';
  $('#eq-drop-zone').style.display = 'block';
  $('#eq-img-thumb').src = '';
  $('#eq-file-input').value = '';
  $('#eq-context-row').style.display = 'none';
}

function switchEqInputMode(mode) {
  STATE.equationInputMode = mode;
  $$('.eq-input-tab').forEach(t => t.classList.toggle('active', t.dataset.eqmode === mode));
  $('#eq-panel-type').style.display = mode === 'type' ? 'block' : 'none';
  $('#eq-panel-image').style.display = mode === 'image' ? 'block' : 'none';
  if (mode === 'image') {
    $('#eq-context-row').style.display = STATE.equationImage ? 'block' : 'none';
  } else {
    $('#eq-context-row').style.display = 'none';
  }
}

function showToast(msg) {
  let t = document.getElementById('eq-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'eq-toast';
    t.className = 'eq-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 3500);
}

function switchInputMode(mode) {
  STATE.inputMode = mode;
  $$('.input-mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  $('#input-panel-code').style.display = mode === 'code' ? 'block' : 'none';
  $('#input-panel-equation').style.display = mode === 'equation' ? 'block' : 'none';
  // Update placeholder
  const ph = $('#results-placeholder');
  if (ph) {
    if (mode === 'equation') {
      ph.querySelector('h3').textContent = 'No equation yet';
      ph.querySelector('p').innerHTML = 'Switch to the <strong>∑ Equation</strong> tab on the left, type or upload an equation, then click <strong>Explain Equation</strong>.';
    } else {
      ph.querySelector('h3').textContent = 'No code yet';
      ph.querySelector('p').innerHTML = 'Paste your Python ML or RL code on the left, then click <strong>Explain</strong> or <strong>Visualize</strong> to begin.';
    }
  }
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function updateEquationPreview() {
  const val = $('#equation-input').value.trim();
  const previewWrap = $('#equation-preview');
  const previewEl = $('#equation-preview-render');
  if (!val) { previewWrap.style.display = 'none'; return; }
  previewWrap.style.display = 'block';
  // Wrap in display math delimiters if no delimiters present
  let toRender = val;
  if (!val.includes('$') && !val.includes('\\(') && !val.includes('\\[')) {
    toRender = `$$${val}$$`;
  }
  previewEl.innerHTML = toRender;
  if (window.renderMathInElement) {
    try {
      renderMathInElement(previewEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } catch(e) { /* silently ignore parse errors */ }
  }
}

// ===== PROVIDER =====
function setProvider(p) {
  STATE.provider = p;
  localStorage.setItem('ml_provider', p);
  $$('.provider-tab').forEach(el => el.classList.toggle('active', el.dataset.provider === p));
  $('#hf-section').style.display = p === 'huggingface' ? 'block' : 'none';
  $('#or-section').style.display = p === 'openrouter' ? 'block' : 'none';
  $('#gemini-section').style.display = p === 'gemini' ? 'block' : 'none';
  if (p === 'huggingface' && STATE.hfToken) $('#hf-token').value = STATE.hfToken;
  if (p === 'openrouter' && STATE.orToken) $('#or-token').value = STATE.orToken;
  if (p === 'gemini' && STATE.geminiToken) $('#gemini-token').value = STATE.geminiToken;
  $$('.model-select-group').forEach(el => el.classList.toggle('visible', p === 'openrouter' || p === 'gemini'));
  updateSaveStatus();
  updateHint();
}

function updateHint() {
  const hint = $('#setup-hint');
  if (STATE.provider === 'gemini') {
    hint.innerHTML = '💡 Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> — free and takes 30 seconds.';
  } else if (STATE.provider === 'huggingface') {
    hint.innerHTML = '💡 Get your free token at <a href="https://huggingface.co" target="_blank">huggingface.co</a> → Sign up → Settings → Access Tokens → New Token (Read role)';
  } else {
    hint.innerHTML = '💡 Get your free key at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a> → Sign up → Keys → Create Key. Free models available!';
  }
}

function saveToken() {
  if (STATE.provider === 'gemini') {
    STATE.geminiToken = $('#gemini-token').value.trim();
    STATE.geminiModel = $('#gemini-model').value.trim();
    localStorage.setItem('ml_gemini_token', STATE.geminiToken);
    localStorage.setItem('ml_gemini_model', STATE.geminiModel);
  } else if (STATE.provider === 'huggingface') {
    STATE.hfToken = $('#hf-token').value.trim();
    STATE.hfModel = $('#hf-model').value.trim();
    localStorage.setItem('ml_hf_token', STATE.hfToken);
    localStorage.setItem('ml_hf_model', STATE.hfModel);
  } else {
    STATE.orToken = $('#or-token').value.trim();
    STATE.orModel = $('#or-model').value;
    localStorage.setItem('ml_or_token', STATE.orToken);
    localStorage.setItem('ml_or_model', STATE.orModel);
  }
  updateSaveStatus();
}

function updateSaveStatus() {
  const el = $('#save-status');
  const token = STATE.provider === 'gemini' ? STATE.geminiToken
              : STATE.provider === 'huggingface' ? STATE.hfToken
              : STATE.orToken;
  if (token) {
    el.textContent = "✅ Token saved — you're ready to go!";
    el.className = 'save-status success';
  } else {
    el.textContent = '';
    el.className = 'save-status';
  }
}

function getToken() {
  if (STATE.provider === 'gemini') return STATE.geminiToken;
  return STATE.provider === 'huggingface' ? STATE.hfToken : STATE.orToken;
}

function getModelLabel() {
  if (STATE.provider === 'gemini') return STATE.geminiModel || 'gemini-2.5-flash';
  if (STATE.provider === 'huggingface') return STATE.hfModel;
  const allModels = [...OR_MODELS, ...STATE.customModels];
  const m = allModels.find(x => x.value === STATE.orModel);
  return m ? m.label : STATE.orModel;
}

function getProviderLabel() {
  if (STATE.provider === 'gemini') return 'Google Gemini';
  return STATE.provider === 'huggingface' ? 'Hugging Face' : 'OpenRouter';
}

// ===== FRIENDLY ERROR MESSAGES =====
function friendlyError(rawMessage) {
  const msg = rawMessage || '';
  if (msg.includes('No API token'))         return '🔑 No API key found. Click "Setup", paste your key, and hit Save.';
  if (msg.includes('paste some Python'))    return '📋 The code box is empty! Paste some Python or ML code first.';
  if (msg.includes('free-models-per-day') || msg.includes('daily limit'))
                                            return '⏰ You\'ve hit today\'s free limit. Try again tomorrow, or switch to a different model in Setup.';
  if (msg.includes('429') || /rate.?limit/i.test(msg))
                                            return '🐢 Too many requests. The app is retrying automatically — just wait a moment.';
  if (msg.includes('401') || /unauthorized|invalid.?key/i.test(msg))
                                            return '🔑 Your API key looks incorrect. Check it in Setup (no extra spaces) and save again.';
  if (msg.includes('403') || /forbidden/i.test(msg))
                                            return '🚫 Access denied. Your key may not have permission for this model. Try a different model.';
  if (/content.?filter|filtered/i.test(msg))
                                            return '🛡️ This model filtered the request. Try a different snippet or model.';
  if (/network|fetch/i.test(msg))          return '🌐 Network error — check your internet connection and try again.';
  if (/unexpected|format/i.test(msg))      return '🤔 The AI returned an unexpected response. Try again, or switch to a different model in Setup.';
  return `❌ Something went wrong: ${msg}\n\nTip: Try switching the AI model in Setup, or paste a smaller snippet.`;
}

// ===== OPENROUTER LIMITS =====
async function checkOpenRouterLimits() {
  const token = STATE.orToken;
  if (!token) {
    const body = $('#or-limits-body');
    body.innerHTML = '<p class="or-limits-error">⚠️ Please save your OpenRouter API key first.</p>';
    body.style.display = 'block';
    return;
  }
  const loading = $('#or-limits-loading');
  const body = $('#or-limits-body');
  const btn = $('#btn-check-limits');
  btn.disabled = true; btn.textContent = 'Checking...';
  loading.style.display = 'flex'; body.style.display = 'none';
  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`API returned ${res.status}.`);
    const json = await res.json();
    const d = json.data;
    const isFree = d.is_free_tier;
    const hasLimit = d.limit !== null;
    const limit = hasLimit ? d.limit : null;
    const remaining = d.limit_remaining;
    const usedPercent = hasLimit && limit > 0 ? Math.min(100, ((limit - (remaining || 0)) / limit) * 100) : 0;
    const fmt = (v) => v === null || v === undefined ? '—' : '$' + Number(v).toFixed(4);
    body.innerHTML = `
      <div class="or-limits-grid">
        <div class="or-stat-row tier-row">
          <span class="or-stat-label">${isFree ? '🆓' : '💎'} Account Tier</span>
          <span class="or-stat-value ${isFree ? 'tier-free' : 'tier-paid'}">${isFree ? 'Free Tier' : 'Paid Tier'}</span>
        </div>
        ${d.label ? `<div class="or-stat-row"><span class="or-stat-label">🏷️ Key Label</span><span class="or-stat-value">${escapeHtml(d.label)}</span></div>` : ''}
        ${hasLimit ? `
        <div class="or-stat-row"><span class="or-stat-label">💳 Credit Limit</span><span class="or-stat-value">${fmt(limit)}</span></div>
        <div class="or-stat-row"><span class="or-stat-label">✅ Remaining</span><span class="or-stat-value remaining">${fmt(remaining)}</span></div>
        <div class="or-limits-bar-wrap"><div class="or-limits-bar" style="width:${usedPercent.toFixed(1)}%"></div></div>
        <div class="or-stat-row"><span class="or-stat-label">🔄 Resets</span><span class="or-stat-value">${d.limit_reset || 'Never'}</span></div>`
        : `<div class="or-stat-row"><span class="or-stat-label">💳 Credit Limit</span><span class="or-stat-value remaining">Unlimited</span></div>`}
      </div>
      <div class="or-usage-section">
        <span class="or-usage-title">📈 Usage Breakdown</span>
        <div class="or-usage-grid">
          <div class="or-usage-item"><span class="or-usage-period">Today</span><span class="or-usage-amount">${fmt(d.usage_daily)}</span></div>
          <div class="or-usage-item"><span class="or-usage-period">This Week</span><span class="or-usage-amount">${fmt(d.usage_weekly)}</span></div>
          <div class="or-usage-item"><span class="or-usage-period">This Month</span><span class="or-usage-amount">${fmt(d.usage_monthly)}</span></div>
          <div class="or-usage-item"><span class="or-usage-period">All Time</span><span class="or-usage-amount">${fmt(d.usage)}</span></div>
        </div>
      </div>
      <div class="or-limits-free-info ${!isFree ? 'paid' : ''}">
        <span class="free-badge ${!isFree ? 'paid-badge' : ''}">⚡ Free Model Limits</span>
        <span>20 req/min • ${isFree ? '50' : '1000'} req/day</span>
        ${isFree ? '<span class="or-limits-hint">Purchase ≥$10 credits → 1000 req/day</span>' : ''}
      </div>`;
    body.style.display = 'block';
  } catch (e) {
    body.innerHTML = `<p class="or-limits-error">❌ ${escapeHtml(e.message)}</p>`;
    body.style.display = 'block';
  } finally {
    loading.style.display = 'none';
    btn.disabled = false; btn.textContent = 'Check Status';
  }
}

// ===== API CALLS =====
async function callAPI(systemPrompt, userCode) {
  const token = getToken();
  if (!token) throw new Error('No API token found. Please save your token in the Setup section.');
  if (!userCode.trim()) throw new Error('Please paste some Python code first.');
  if (STATE.provider === 'gemini') return await callGemini(token, systemPrompt, userCode);
  if (STATE.provider === 'huggingface') return await callHuggingFace(token, systemPrompt, userCode);
  return await callOpenRouter(token, systemPrompt, userCode);
}

// BUG FIX: was hardcoded 'gemini-2.5-flash', now uses STATE.geminiModel
async function callGemini(token, systemPrompt, userCode) {
  const model = STATE.geminiModel || 'gemini-2.5-flash';
  console.log('[Gemini] Calling model:', model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userCode }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 8192 }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google Gemini: ${data?.error?.message || 'API error: ' + res.status}`);
  if (data.candidates?.length > 0) {
    const parts = data.candidates[0].content?.parts;
    if (parts?.length > 0) return parts[0].text || '';
    if (data.candidates[0].finishReason === 'SAFETY')
      throw new Error('content_filter: The model blocked this content for safety reasons.');
  }
  throw new Error('Unexpected response format from Gemini');
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  let retries = 0;
  while (true) {
    const res = await fetch(url, options);
    let isHardLimit = false;
    if (res.status === 429) {
      try {
        const data = await res.clone().json();
        if (data?.error?.message?.includes('free-models-per-day')) isHardLimit = true;
      } catch (e) { /* ignore */ }
    }
    if (res.status === 429 && !isHardLimit && retries < maxRetries) {
      retries++;
      const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
      const secondsTotal = Math.ceil(waitTime / 1000);
      const txt = $('.loading-text');
      if (txt && $('.loading-container').classList.contains('active')) {
        clearInterval(loadingInterval);
        let secondsLeft = secondsTotal;
        txt.textContent = `🐢 Rate limited. Retrying in ${secondsLeft}s... (this is normal!)`;
        const countdown = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) txt.textContent = `🐢 Rate limited. Retrying in ${secondsLeft}s... (this is normal!)`;
        }, 1000);
        await new Promise(r => setTimeout(r, waitTime));
        clearInterval(countdown);
        showLoading(true);
      } else {
        await new Promise(r => setTimeout(r, waitTime));
      }
      continue;
    }
    return res;
  }
}

async function callHuggingFace(token, systemPrompt, userCode) {
  const model = STATE.hfModel || 'meta-llama/Llama-3.2-3B-Instruct';
  console.log('[HuggingFace] Calling model:', model);
  const res = await fetchWithRetry('https://router.huggingface.co/hf-inference/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userCode }],
      max_tokens: 8000, temperature: 0.4
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Hugging Face: ${data?.error?.message || data?.error || 'API error: ' + res.status}`);
  if (data.choices?.length > 0) return data.choices[0].message?.content || '';
  throw new Error('Unexpected response format from Hugging Face');
}

async function callOpenRouter(token, systemPrompt, userCode) {
  const model = STATE.orModel || 'google/gemma-4-31b-it:free';
  console.log('[OpenRouter] Calling model:', model);
  const res = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json',
      'HTTP-Referer': 'ml-code-explainer', 'X-Title': 'ML Code Explainer'
    },
    body: JSON.stringify({
      model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userCode }],
      temperature: 0.4, max_tokens: 8000
    })
  });
  const data = await res.json();
  console.log('[OpenRouter] Status:', res.status, JSON.stringify(data).substring(0, 500));
  if (!res.ok) throw new Error(`OpenRouter: ${data?.error?.message || data?.error?.code || 'API error: ' + res.status}`);
  if (data.error) throw new Error(`OpenRouter: ${data.error.message || JSON.stringify(data.error)}`);
  if (data.choices?.length > 0) {
    const choice = data.choices[0];
    const content = choice.message?.content || choice.text || '';
    if (content) return content;
    if (choice.finish_reason === 'content_filter') throw new Error('content_filter');
  }
  throw new Error('Unexpected OpenRouter response. Check browser console for details.');
}

// ===== EXPLAIN =====
async function runExplain() {
  saveToken();
  const code = $('#code-input').value;
  if (!code.trim()) return showError(friendlyError('paste some Python code'));
  showLoading(true); hideError(); hideResults(); setButtonsDisabled(true);
  try {
    const text = await callAPI(SYSTEM_PROMPT_EXPLAIN, addLineNumbers(code));
    STATE.explanationData = text;
    STATE.lastProvider = getProviderLabel();
    STATE.lastModel = getModelLabel();
    renderExplanation(text);
    showResults();
    switchResultTab('explanation');
  } catch (e) {
    showError(friendlyError(e.message));
  } finally {
    showLoading(false); setButtonsDisabled(false);
  }
}

async function runVisualize() {
  saveToken();
  const code = $('#code-input').value;
  if (!code.trim()) return showError(friendlyError('paste some Python code'));
  showLoading(true); hideError(); hideResults(); setButtonsDisabled(true);
  try {
    const text = await callAPI(SYSTEM_PROMPT_VISUAL, addLineNumbers(code));
    STATE.visualData = text;
    STATE.lastProvider = getProviderLabel();
    STATE.lastModel = getModelLabel();
    renderVisual(text);
    showResults();
    switchResultTab('visual');
  } catch (e) {
    showError(friendlyError(e.message));
  } finally {
    showLoading(false); setButtonsDisabled(false);
  }
}

// ===== LINE NUMBER GUTTER =====
function addLineNumbers(code) {
  return code.split('\n').map((line, i) => `L${i + 1}: ${line}`).join('\n');
}

function syncLineNumbers() {
  const ta = $('#code-input');
  const ln = $('#line-nums');
  if (!ta || !ln) return;
  const count = ta.value.split('\n').length;
  if (ln._lastCount !== count) {
    ln._lastCount = count;
    ln.innerHTML = Array.from({ length: count }, (_, i) =>
      `<div class="ln-num" id="ln-${i + 1}">${i + 1}</div>`
    ).join('');
  }
  ln.scrollTop = ta.scrollTop;
}

function jumpToLine(lineNum) {
  const ta = $('#code-input');
  if (!ta) return;
  const lines = ta.value.split('\n');
  if (lineNum > lines.length) return;
  const startPos = lines.slice(0, lineNum - 1).join('\n').length + (lineNum > 1 ? 1 : 0);
  const endPos   = startPos + lines[lineNum - 1].length;
  ta.focus();
  ta.setSelectionRange(startPos, endPos);
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 22;
  ta.scrollTop = Math.max(0, (lineNum - 4) * lineH);
  syncLineNumbers();
  flashGutterLines(lineNum, lineNum);
}

function jumpToLines(start, end) {
  const ta = $('#code-input');
  if (!ta) return;
  const lines = ta.value.split('\n');
  const clampEnd = Math.min(end, lines.length);
  const startPos = lines.slice(0, start - 1).join('\n').length + (start > 1 ? 1 : 0);
  const endPos   = lines.slice(0, clampEnd).join('\n').length;
  ta.focus();
  ta.setSelectionRange(startPos, Math.min(endPos, ta.value.length));
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 22;
  ta.scrollTop = Math.max(0, (start - 4) * lineH);
  syncLineNumbers();
  flashGutterLines(start, clampEnd);
}

function flashGutterLines(start, end) {
  for (let i = start; i <= end; i++) {
    const el = document.getElementById(`ln-${i}`);
    if (el) {
      el.classList.add('ln-active');
      setTimeout(() => el.classList.remove('ln-active'), 1600);
    }
  }
}

// ===== EQUATION EXPLAIN =====
async function runExplainEquation() {
  saveToken();
  const isImageMode = STATE.equationInputMode === 'image';
  const hasImage = !!STATE.equationImage;
  const eqText = $('#equation-input').value.trim();
  const contextText = $('#eq-context-input')?.value.trim() || '';

  if (!isImageMode && !eqText) return showError('📋 Please type an equation first, or switch to Image mode to upload one.');
  if (isImageMode && !hasImage) return showError('🖼️ Please upload or paste an image of the equation first.');

  showLoading(true); hideError(); hideResults(); setButtonsDisabledAll(true);
  try {
    let text;
    if (hasImage) {
      // Multimodal path — image (+ optional text context)
      if (STATE.provider !== 'gemini') {
        throw new Error('Image input is only supported with the Gemini provider. Please switch to Gemini in API Setup.');
      }
      const token = getToken();
      if (!token) throw new Error('No API token found. Please save your Gemini token in the Setup section.');
      const contextPart = contextText ? `\n\nAdditional context from the user: ${contextText}` : '';
      const eqPart = eqText ? `\n\nThe user also typed this equation or note: ${eqText}` : '';
      const userMsg = `Please explain the equation shown in this image in full detail.${eqPart}${contextPart}`;
      text = await callGeminiWithImage(token, SYSTEM_PROMPT_EQUATION, userMsg, STATE.equationImage);
    } else {
      // Text-only path
      const userMsg = `Please explain the following equation in full detail:\n\n${eqText}${contextText ? '\n\nContext: ' + contextText : ''}`;
      text = await callAPI(SYSTEM_PROMPT_EQUATION, userMsg);
    }
    STATE.equationData = text;
    STATE.lastProvider = getProviderLabel();
    STATE.lastModel = getModelLabel();
    const displayEq = eqText || (hasImage ? null : '');
    renderEquationExplanation(text, displayEq, hasImage ? STATE.equationImage.dataUrl : null);
    showResults();
    switchResultTab('equation');
  } catch (e) {
    showError(friendlyError(e.message));
  } finally {
    showLoading(false); setButtonsDisabledAll(false);
  }
}

async function callGeminiWithImage(token, systemPrompt, userText, imageObj) {
  const model = STATE.geminiModel || 'gemini-2.5-flash';
  console.log('[Gemini Multimodal] Calling model:', model);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: userText },
          { inlineData: { mimeType: imageObj.mimeType, data: imageObj.data } }
        ]
      }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 8192 }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google Gemini: ${data?.error?.message || 'API error: ' + res.status}`);
  if (data.candidates?.length > 0) {
    const parts = data.candidates[0].content?.parts;
    if (parts?.length > 0) return parts[0].text || '';
    if (data.candidates[0].finishReason === 'SAFETY')
      throw new Error('content_filter: The model blocked this content for safety reasons.');
  }
  throw new Error('Unexpected response format from Gemini');
}

function clearEquation() {
  $('#equation-input').value = '';
  $('#equation-preview').style.display = 'none';
  if ($('#eq-context-input')) $('#eq-context-input').value = '';
  clearEquationImage();
  hideResults(); hideError();
  STATE.equationData = null;
  $('#results-placeholder')?.classList.remove('hidden');
}

function renderEquationExplanation(text, originalEq, imageDataUrl) {
  const container = $('#equation-content');
  // Render the original equation / image at the top
  let headerHtml = '';
  if (imageDataUrl) {
    headerHtml = `<div class="eq-source-card eq-source-card--image">
      <span class="eq-source-label">Your Equation (from image)</span>
      <img src="${imageDataUrl}" class="eq-source-image" alt="Equation image">
    </div>`;
  }
  if (originalEq) {
    let rendered = originalEq;
    if (!originalEq.includes('$') && !originalEq.includes('\\(')) rendered = `$$${originalEq}$$`;
    headerHtml = `<div class="eq-source-card"><span class="eq-source-label">Your Equation</span><div class="eq-source-render" id="eq-source-render">${escapeHtml(rendered)}</div></div>`;
  }

  const sections = text.split(/(?=###\s)/).filter(s => s.trim());
  let html = '';
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const rawHeading = lines[0].replace(/^#+\s*/, '');
    const body = lines.slice(1).join('\n').trim();
    html += renderEquationSection(rawHeading, body);
  });
  if (!html) html = `<div class="exp-section exp-section--default">${renderMarkdown(text)}</div>`;
  container.innerHTML = headerHtml + html;

  // Render KaTeX in the equation source card
  const srcEl = document.getElementById('eq-source-render');
  if (srcEl && window.renderMathInElement) {
    srcEl.textContent = srcEl.textContent; // reset from escapeHtml
    srcEl.innerHTML = originalEq.includes('$') ? escapeHtml(originalEq) : `$$${escapeHtml(originalEq)}$$`;
    try { renderMathInElement(srcEl, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch(e) {}
  }

  // Render KaTeX throughout the explanation
  if (window.renderMathInElement) {
    try {
      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    } catch(e) {}
  }

  const toolbar = $('#toolbar-equation-export');
  if (toolbar) toolbar.style.display = 'flex';
}

function renderEquationSection(heading, body) {
  const h = heading.toLowerCase();
  if (heading.includes('🎯') || h.includes('plain english') || h.includes('what this equation'))
    return renderEqHeroSection(heading, body);
  if (heading.includes('🔤') || h.includes('every symbol') || h.includes('symbol decoded'))
    return renderEqSymbolSection(heading, body);
  if (heading.includes('🧠') || h.includes('intuition'))
    return renderEqIntuitionSection(heading, body);
  if (heading.includes('🌍') || h.includes('where you') || h.includes('real-world'))
    return renderEqApplicationsSection(heading, body);
  if (heading.includes('📐') || h.includes('step-by-step') || h.includes('how it works'))
    return renderEqStepsSection(heading, body);
  if (heading.includes('⚠️') || h.includes('confused') || h.includes('confusion'))
    return renderConfusionSection(heading, body);
  if (heading.includes('🗺️') || h.includes('roadmap'))
    return renderRoadmapSection(heading, body);
  return renderDefaultSection(heading, body);
}

function renderEqHeroSection(heading, body) {
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--hero eq-hero">
      <div class="exp-section-header">
        <span class="exp-section-icon">🎯</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="exp-hero-text">${renderMarkdown(body)}</div>
    </div>`;
}

function renderEqSymbolSection(heading, body) {
  const lines = body.split('\n');
  const symbols = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const match = line.match(/^\*\*([^*]+)\*\*[:\s]+(.*)$/);
    if (match) {
      const sym = match[1].trim();
      let content = match[2].trim();
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || /^\*\*/.test(next)) break;
        content += ' ' + next; i++;
      }
      const analogyRx = /(Think of it like[\s\S]*)/i;
      const am = content.match(analogyRx);
      symbols.push(am
        ? { sym, def: content.replace(am[1], '').trim(), analogy: am[1].trim() }
        : { sym, def: content, analogy: null });
    } else { i++; }
  }
  if (symbols.length === 0) return renderDefaultSection(heading, body);
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--concepts eq-symbols">
      <div class="exp-section-header">
        <span class="exp-section-icon">🔤</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="eq-symbol-grid">
        ${symbols.map(s => `
          <div class="eq-symbol-card">
            <div class="eq-symbol-glyph">${escapeHtml(s.sym)}</div>
            <div class="eq-symbol-def">${inlineFormat(escapeHtml(s.def))}</div>
            ${s.analogy ? `<div class="concept-analogy">${inlineFormat(escapeHtml(s.analogy))}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
}

function renderEqIntuitionSection(heading, body) {
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--narrative eq-intuition">
      <div class="exp-section-header">
        <span class="exp-section-icon">🧠</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="narrative-body eq-intuition-body">${renderMarkdown(body)}</div>
    </div>`;
}

function renderEqApplicationsSection(heading, body) {
  const lines = body.split('\n');
  const apps = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const match = line.match(/^\*\*([^*]+)\*\*[:\s]+(.*)$/);
    if (match) {
      apps.push({ domain: match[1].trim(), desc: match[2].trim() });
    } else {
      const bm = line.match(/^[-*\d.]+\s+(.+)$/);
      if (bm) apps.push({ domain: null, desc: bm[1] });
    }
    i++;
  }
  if (apps.length === 0) return renderDefaultSection(heading, body);
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--tips eq-applications">
      <div class="exp-section-header">
        <span class="exp-section-icon">🌍</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="tips-grid">
        ${apps.map(a => `
          <div class="tip-card eq-app-card">
            ${a.domain ? `<strong>${escapeHtml(a.domain)}:</strong> ` : ''}${inlineFormat(escapeHtml(a.desc))}
          </div>`).join('')}
      </div>
    </div>`;
}

function renderEqStepsSection(heading, body) {
  const steps = [];
  body.split('\n').forEach(line => {
    const t = line.trim();
    if (!t) return;
    const nm = t.match(/^\d+\.\s+(.+)$/); if (nm) { steps.push(nm[1]); return; }
    const bm = t.match(/^[-*]\s+(.+)$/); if (bm) { steps.push(bm[1]); return; }
    if (steps.length > 0) steps[steps.length - 1] += ' ' + t;
    else steps.push(t);
  });
  if (steps.length === 0) return renderDefaultSection(heading, body);
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--roadmap eq-steps">
      <div class="exp-section-header">
        <span class="exp-section-icon">📐</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <ol class="roadmap-steps">
        ${steps.map((step, idx) => `
          <li class="roadmap-step eq-step">
            <div class="roadmap-num">${idx + 1}</div>
            <div class="roadmap-content">${inlineFormat(escapeHtml(step))}</div>
          </li>`).join('')}
      </ol>
    </div>`;
}

function exportEquation(format) {
  if (!STATE.equationData) return;
  if (format === 'md') {
    const blob = new Blob([STATE.equationData], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'equation_explanation.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } else if (format === 'pdf') {
    const content = document.getElementById('equation-content');
    html2pdf().set({
      margin: 10, filename: 'equation_explanation.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(content).save();
  }
}

// ===== SECTION-AWARE RENDERING =====
// Each section heading routes to a specialized renderer that
// generates purpose-built HTML — not a generic card.

function renderExplanation(text) {
  const container = $('#explanation-content');
  const sections = text.split(/(?=###\s)/).filter(s => s.trim());
  let html = '';
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const rawHeading = lines[0].replace(/^#+\s*/, '');
    const body = lines.slice(1).join('\n').trim();
    html += renderSection(rawHeading, body);
  });
  if (!html) html = `<div class="exp-section exp-section--default">${renderMarkdown(text)}</div>`;
  container.innerHTML = html;

  // Wire breakdown accordion — start ALL items open
  container.querySelectorAll('.breakdown-item').forEach(item => {
    item.classList.add('open');
    item.querySelector('.breakdown-item-header')?.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  const toolbar = $('#toolbar-explanation');
  if (toolbar) toolbar.style.display = 'flex';
}

// Dispatcher: match heading to the right renderer
function renderSection(heading, body) {
  const h = heading.toLowerCase();
  if (heading.includes('🎯') || h.includes('big picture') || h.includes('what this code does'))
    return renderHeroSection(heading, body);
  if (heading.includes('📊') || h.includes('difficulty') || h.includes('prerequisite'))
    return renderDifficultySection(heading, body);
  if (heading.includes('🔍') || h.includes('section-by-section') || h.includes('breakdown'))
    return renderBreakdownSection(heading, body);
  if (heading.includes('🧠') || h.includes('concept dictionary') || h.includes('key concept'))
    return renderConceptSection(heading, body);
  if (heading.includes('🔗') || h.includes('pieces work') || h.includes('how the pieces'))
    return renderNarrativeSection(heading, body);
  if (heading.includes('⚠️') || h.includes('confused') || h.includes('confusion'))
    return renderConfusionSection(heading, body);
  if (heading.includes('💡') || (h.includes('tip') && !h.includes('roadmap')))
    return renderTipsSection(heading, body);
  if (heading.includes('🗺️') || h.includes('roadmap') || h.includes('learning roadmap'))
    return renderRoadmapSection(heading, body);
  return renderDefaultSection(heading, body);
}

// ── 1. Hero ──────────────────────────────────────────────────
function renderHeroSection(heading, body) {
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--hero">
      <div class="exp-section-header">
        <span class="exp-section-icon">🎯</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="exp-hero-text">${renderMarkdown(body)}</div>
    </div>`;
}

// ── 2. Difficulty ────────────────────────────────────────────
function renderDifficultySection(heading, body) {
  const lower = body.toLowerCase();
  let badgeClass = 'beginner', badgeIcon = '🟢', badgeText = 'Beginner';
  if (lower.includes('advanced'))     { badgeClass = 'advanced';     badgeIcon = '🔴'; badgeText = 'Advanced'; }
  else if (lower.includes('intermediate')) { badgeClass = 'intermediate'; badgeIcon = '🟡'; badgeText = 'Intermediate'; }

  // Parse prereq items — **Term:** description lines, bullets, numbered
  const lines = body.split('\n').filter(l => l.trim());
  const prereqs = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^(beginner|intermediate|advanced)[:\s]/i.test(t)) continue; // skip rating line
    const boldMatch = t.match(/^\*\*([^*]+)\*\*[:\s]+(.+)$/);
    if (boldMatch) { prereqs.push({ term: boldMatch[1].trim(), desc: boldMatch[2].trim() }); continue; }
    const bulletMatch = t.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) { prereqs.push({ term: null, desc: bulletMatch[1] }); continue; }
    const numMatch = t.match(/^\d+\.\s+(.+)$/);
    if (numMatch) prereqs.push({ term: null, desc: numMatch[1] });
  }

  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--difficulty">
      <div class="exp-section-header">
        <span class="exp-section-icon">📊</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="difficulty-row">
        <span class="difficulty-label">Difficulty:</span>
        <span class="difficulty-badge difficulty-badge--${badgeClass}">${badgeIcon} ${badgeText}</span>
      </div>
      ${prereqs.length > 0 ? `
        <span class="prereq-title">What you'll need to know</span>
        <ul class="prereq-list">
          ${prereqs.map(p => `
            <li class="prereq-item">
              <span class="prereq-dot"></span>
              <span>${p.term ? `<strong>${escapeHtml(p.term)}:</strong> ` : ''}${inlineFormat(escapeHtml(p.desc))}</span>
            </li>`).join('')}
        </ul>` : renderMarkdown(body)}
    </div>`;
}

// ── 3. Breakdown Accordion ───────────────────────────────────
function renderBreakdownSection(heading, body) {
  // Pre-process: strip standalone # / ## / ### lines and sub-headings within body
  const rawLines = body.split('\n').filter(line => {
    const t = line.trim();
    // Drop pure hash lines (e.g. "#", "##") and sub-heading lines ("#### Foo")
    if (/^#{1,6}\s/.test(t) || /^#{1,6}$/.test(t)) return false;
    return true;
  });

  const blocks = [];
  let i = 0;

  while (i < rawLines.length) {
    const raw = rawLines[i];
    const line = raw.trim();
    if (!line) { i++; continue; }

    // Strip leading bullet/dash before bold: "* **Title:**" → "**Title:**"
    const stripped = line.replace(/^[-*•]\s+/, '');

    // Match "**Title:**", "**Title:** body", or "**Title**" (no colon required)
    const match =
      stripped.match(/^\*\*([^*]+?)\*\*[:\s]+(.*)$/) ||
      stripped.match(/^\*\*([^*]+?)\*\*$/);

    if (match) {
      // Clean trailing ** or * from title (AI sometimes forgets to close)
      const title = match[1].trim().replace(/\*+$/, '').replace(/^\*+/, '');
      let content = (match[2] || '').trim();
      i++;
      while (i < rawLines.length) {
        const next = rawLines[i].trim().replace(/^[-*•]\s+/, '');
        if (!next) {
          // blank line — peek ahead
          let peek = i + 1;
          while (peek < rawLines.length && !rawLines[peek].trim()) peek++;
          const peekLine = (rawLines[peek] || '').trim().replace(/^[-*•]\s+/, '');
          if (peek >= rawLines.length || /^\*\*/.test(peekLine)) break;
          i++; continue;
        }
        // Next bold title → start new block
        if (/^\*\*/.test(next)) break;
        // Skip sub-heading lines that crept in
        if (/^#{1,6}[\s#]/.test(rawLines[i].trim()) || rawLines[i].trim() === '#') { i++; continue; }
        content += '\n' + rawLines[i];
        i++;
      }
      // Sanitize content: remove lone asterisks / hashes
      const cleanContent = content
        .split('\n')
        .map(l => l.replace(/^\s*[#*]\s*$/, '').trim())
        .filter(l => l)
        .join('\n');
      blocks.push({ title, content: cleanContent });
    } else {
      // Orphan line — append to last block
      if (blocks.length > 0) blocks[blocks.length - 1].content += '\n' + line;
      i++;
    }
  }

  if (blocks.length === 0) return renderDefaultSection(heading, body);

  function parseBlockContent(content) {
    const analogyRx = /(Think of it like[^.]*\.)/i;
    const trickyRx  = /(The trickiest line[^.]*\.[^.]*\.)/i;
    let mainText = content, analogy = null, tricky = null;
    const am = content.match(analogyRx);
    if (am) { analogy = am[1]; mainText = mainText.replace(analogy, '').trim(); }
    const tm = mainText.match(trickyRx);
    if (tm) { tricky = tm[1]; mainText = mainText.replace(tricky, '').trim(); }
    // Final clean: remove stray leading * / # from mainText
    mainText = mainText.replace(/^[\s*#]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    return { mainText, analogy, tricky };
  }

  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--breakdown">
      <div class="exp-section-header">
        <span class="exp-section-icon">🔍</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="breakdown-items">
        ${blocks.map(block => {
          const { mainText, analogy, tricky } = parseBlockContent(block.content);
          return `
            <div class="breakdown-item">
              <div class="breakdown-item-header">
                <strong>${inlineFormat(escapeHtml(block.title))}</strong>
                <span class="breakdown-chevron">▸</span>
              </div>
              <div class="breakdown-item-body">
                ${mainText ? `<p>${inlineFormat(escapeHtml(mainText))}</p>` : ''}
                ${analogy  ? `<div class="bd-analogy">🌍 ${inlineFormat(escapeHtml(analogy))}</div>` : ''}
                ${tricky   ? `<div class="bd-tricky">⚡ ${inlineFormat(escapeHtml(tricky))}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ── 4. Concept Dictionary ────────────────────────────────────
function renderConceptSection(heading, body) {
  const lines = body.split('\n');
  const concepts = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const match = line.match(/^\*\*([^*]+)\*\*[:\s]+(.*)$/);
    if (match) {
      const term = match[1].trim();
      let content = match[2].trim();
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || /^\*\*/.test(next) || /^[-*]\s/.test(next)) break;
        content += ' ' + next;
        i++;
      }
      // Split out "Think of it like..." as the analogy
      const analogyRx = /(Think of it like[\s\S]*)/i;
      const am = content.match(analogyRx);
      if (am) {
        concepts.push({ term, def: content.replace(am[1], '').trim(), analogy: am[1].trim() });
      } else {
        concepts.push({ term, def: content, analogy: null });
      }
    } else { i++; }
  }

  if (concepts.length === 0) return renderDefaultSection(heading, body);

  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--concepts">
      <div class="exp-section-header">
        <span class="exp-section-icon">🧠</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="concept-grid">
        ${concepts.map(c => `
          <div class="concept-card">
            <div class="concept-term">${escapeHtml(c.term)}</div>
            <div class="concept-def">${inlineFormat(escapeHtml(c.def))}</div>
            ${c.analogy ? `<div class="concept-analogy">${inlineFormat(escapeHtml(c.analogy))}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`;
}

// ── 5. Narrative ─────────────────────────────────────────────
function renderNarrativeSection(heading, body) {
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--narrative">
      <div class="exp-section-header">
        <span class="exp-section-icon">🔗</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="narrative-body">${renderMarkdown(body)}</div>
    </div>`;
}

// ── 6. Confusion Callouts ────────────────────────────────────
function renderConfusionSection(heading, body) {
  const lines = body.split('\n');
  const items = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const match = line.match(/^\*\*([^*]+)\*\*[:\s]+(.*)$/);
    if (match) {
      const trigger = match[1].trim();
      let content = match[2].trim();
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || /^\*\*/.test(next)) break;
        content += ' ' + next; i++;
      }
      items.push({ trigger, content });
    } else {
      const bm = line.match(/^[-*]\s+(.+)$/);
      if (bm) items.push({ trigger: null, content: bm[1] });
      i++;
    }
  }

  if (items.length === 0) return renderDefaultSection(heading, body);
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--confusion">
      <div class="exp-section-header">
        <span class="exp-section-icon">⚠️</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="confusion-list">
        ${items.map(item => `
          <div class="confusion-box">
            ${item.trigger ? `<div class="confusion-trigger">${escapeHtml(item.trigger)}</div>` : ''}
            <div class="confusion-aha">${inlineFormat(escapeHtml(item.content))}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── 7. Tips List ─────────────────────────────────────────────
function renderTipsSection(heading, body) {
  // Parse tips: support **Title:** body, numbered, bulleted, and plain lines
  const tips = [];
  const rawLines = body.split('\n');
  let i = 0;
  while (i < rawLines.length) {
    const t = rawLines[i].trim();
    if (!t || /^#{1,6}[\s#]/.test(t) || /^#{1,6}$/.test(t)) { i++; continue; }

    // Strip leading bullet/number
    const stripped = t.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');

    // Bold title + body on same line: **Watch the Data Flow:** Add print...
    const boldMatch = stripped.match(/^\*\*([^*]+?)\*\*[:\s]+(.*)$/);
    if (boldMatch) {
      const title = boldMatch[1].trim();
      let body2 = boldMatch[2].trim();
      i++;
      // Collect continuation lines until next tip
      while (i < rawLines.length) {
        const next = rawLines[i].trim();
        if (!next) { i++; break; }
        if (/^[-*•]\s+\*\*/.test(next) || /^\d+\.\s+\*\*/.test(next) || /^\*\*/.test(next.replace(/^[-*•]\s+/, ''))) break;
        if (/^#{1,6}[\s#]/.test(next)) { i++; break; }
        body2 += ' ' + next;
        i++;
      }
      tips.push({ title, body: body2 });
      continue;
    }
    // Plain tip — no bold title
    if (stripped) tips.push({ title: null, body: stripped });
    i++;
  }

  if (tips.length === 0) return renderDefaultSection(heading, body);
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--tips">
      <div class="exp-section-header">
        <span class="exp-section-icon">💡</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <div class="tips-list">
        ${tips.map(tip => `
          <div class="tip-item">
            <span class="tip-bulb">💡</span>
            <div class="tip-body">
              ${tip.title ? `<strong class="tip-title">${inlineFormat(escapeHtml(tip.title))}:</strong> ` : ''}${inlineFormat(escapeHtml(tip.body))}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── 8. Learning Roadmap ──────────────────────────────────────
function renderRoadmapSection(heading, body) {
  const steps = [];
  let resourceLine = null;
  body.split('\n').forEach(line => {
    const t = line.trim();
    if (!t) return;
    if (/^resource[:\s]/i.test(t) || (t.includes('http') && steps.length > 0)) {
      resourceLine = t.replace(/^resource[:\s]*/i, '').trim(); return;
    }
    const nm = t.match(/^\d+\.\s+(.+)$/); if (nm) { steps.push(nm[1]); return; }
    const bm = t.match(/^[-*]\s+(.+)$/);  if (bm) steps.push(bm[1]);
  });

  if (steps.length === 0) return renderDefaultSection(heading, body);
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--roadmap">
      <div class="exp-section-header">
        <span class="exp-section-icon">🗺️</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      <ol class="roadmap-steps">
        ${steps.map((step, idx) => `
          <li class="roadmap-step">
            <div class="roadmap-num">${idx + 1}</div>
            <div class="roadmap-content">${inlineFormat(escapeHtml(step))}</div>
          </li>`).join('')}
      </ol>
      ${resourceLine ? `<div class="roadmap-resource">${inlineFormat(escapeHtml(resourceLine))}</div>` : ''}
    </div>`;
}

// ── Default fallback ─────────────────────────────────────────
function renderDefaultSection(heading, body) {
  const iconMatch = heading.match(/^(\p{Emoji})/u);
  const icon = iconMatch ? iconMatch[1] : '📌';
  const clean = heading.replace(/^[\p{Emoji}\s#*]+/u, '').replace(/[\s*#]+$/, '').trim() || heading;
  return `
    <div class="exp-section exp-section--default">
      <div class="exp-section-header">
        <span class="exp-section-icon">${icon}</span>
        <h3 class="exp-section-title">${escapeHtml(clean)}</h3>
      </div>
      ${renderMarkdown(body)}
    </div>`;
}

// ===== MERMAID HELPERS =====
function sanitizeMermaid(code) {
  let s = code.replace(/<[^>]+>/g, '');
  s = s.replace(/\[([^\]"]+)\]/g, (match, label) => {
    if (/[()=:;_<>°θΔ&{}#@!$%^*~`|\\]/.test(label)) {
      const clean = label.replace(/["]/g,"'").replace(/[()]/g,'').replace(/[°θΔ]/g,'').replace(/[_]/g,' ').trim();
      return `["${clean}"]`;
    }
    return match;
  });
  s = s.replace(/-->\|([^|"]+)\|/g, (_, label) => `-->|"${label}"|`);
  s = s.split('\n').filter(l => l.trim() !== '').join('\n');
  return s;
}

async function renderSingleMermaid(container, code, label) {
  const uid = Date.now() + Math.random().toString(36).substr(2, 5);
  const id = `mermaid-${label}-${uid}`;
  const sanitized = sanitizeMermaid(code);
  console.log(`[Visual] Rendering ${label}:`, sanitized.substring(0, 200));
  container.innerHTML = `<pre class="mermaid" id="${id}">${sanitized}</pre>`;
  try {
    await mermaid.run({ nodes: [document.getElementById(id)] });
    const toolbar = $(`#toolbar-${label}`);
    if (toolbar) toolbar.style.display = 'flex';
    STATE.zooms[label] = 1;
    return true;
  } catch (e) {
    console.warn(`[Visual] ${label} sanitized failed, retrying original...`, e);
    const id2 = `${id}-retry`;
    container.innerHTML = `<pre class="mermaid" id="${id2}">${code}</pre>`;
    try {
      await mermaid.run({ nodes: [document.getElementById(id2)] });
      const toolbar = $(`#toolbar-${label}`);
      if (toolbar) toolbar.style.display = 'flex';
      STATE.zooms[label] = 1;
      return true;
    } catch (e2) {
      console.warn(`[Visual] ${label} failed completely:`, e2);
      container.innerHTML = `
        <div class="mermaid-fallback">
          <p class="mermaid-fallback-label">⚠️ Diagram couldn't render automatically. Paste the code below into
            <a href="https://mermaid.live" target="_blank">mermaid.live</a> to view it:</p>
          <pre class="mermaid-fallback-code">${escapeHtml(code)}</pre>
        </div>`;
      const toolbar = $(`#toolbar-${label}`);
      if (toolbar) toolbar.style.display = 'none';
      return false;
    }
  }
}

// ===== DIAGRAM ZOOM & EXPORT =====
function zoomDiagram(label, amount) {
  STATE.zooms[label] = Math.max(0.2, Math.min(3, STATE.zooms[label] + amount));
  const pre = document.querySelector(`#diagram-${label === 'concept' ? 'concept' : 'flow'} pre.mermaid`);
  if (pre) pre.style.transform = `scale(${STATE.zooms[label]})`;
}

function exportExplanation(format) {
  if (!STATE.explanationData) return;
  if (format === 'md') {
    const blob = new Blob([STATE.explanationData], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ml_explanation.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } else if (format === 'pdf') {
    const content = document.getElementById('explanation-content');
    content.querySelectorAll('.breakdown-item').forEach(item => item.classList.add('open'));
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) { content.style.backgroundColor = '#1C1C1A'; content.style.color = '#E5E5E0'; content.style.padding = '20px'; }
    html2pdf().set({
      margin: 10, filename: 'ml_explanation.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(content).save().then(() => {
      if (isDark) { content.style.backgroundColor = ''; content.style.color = ''; content.style.padding = ''; }
    });
  }
}

function saveDiagram(label, format = 'svg') {
  const container = document.querySelector(`#diagram-${label === 'concept' ? 'concept' : 'flow'}`);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) { alert('No diagram rendered yet. Click "Visualize" first.'); return; }

  if (format === 'pdf') {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) container.style.backgroundColor = '#1C1C1A';
    html2pdf().set({
      margin: 10, filename: `ml_explainer_${label}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(container).save().then(() => { if (isDark) container.style.backgroundColor = ''; });
    return;
  }

  let svgData = new XMLSerializer().serializeToString(svg);
  if (!svgData.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/))
    svgData = svgData.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');

  if (format === 'svg') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    a.download = `ml_explainer_${label}.svg`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  } else if (format === 'png') {
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    const scale = 3;
    canvas.width  = parseFloat(svg.getAttribute('width')  || rect.width  || 800) * scale;
    canvas.height = parseFloat(svg.getAttribute('height') || rect.height || 600) * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1C1C1A' : '#FAF9F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `ml_explainer_${label}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }
}

function openDiagramInNewTab(label) {
  const container = document.querySelector(`#diagram-${label === 'concept' ? 'concept' : 'flow'}`);
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  window.open(URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })), '_blank');
}

// ===== VISUAL TAB RENDERING =====
function renderVisual(text) {
  console.log('[Visual] Raw response:', text.substring(0, 500));
  const mermaidBlocks = [];
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = mermaidRegex.exec(text)) !== null) mermaidBlocks.push(match[1].trim());
  console.log('[Visual] Found', mermaidBlocks.length, 'mermaid blocks');

  // Extract walkthrough
  let walkthrough = '';
  const wm = text.match(/(?:SECTION C|PLAIN ENGLISH WALKTHROUGH|walkthrough)[:\s\-]*((?:\d+\.\s+[\s\S]*?)$)/im);
  if (wm) {
    walkthrough = wm[1].trim();
  } else {
    const lastIdx = text.lastIndexOf('```');
    if (lastIdx > 0) { const after = text.substring(lastIdx + 3).trim(); if (after.length > 20) walkthrough = after; }
  }

  // Render walkthrough as a visual timeline
  const walkEl = $('#walkthrough-content');
  if (walkthrough) {
    const steps = walkthrough.match(/\d+\.\s+.+/g);
    if (steps) {
      walkEl.innerHTML = `
        <ol class="walkthrough-timeline">
          ${steps.map((s, i) => `
            <li class="walkthrough-step">
              <div class="wt-num">${i + 1}</div>
              <div class="wt-text">${escapeHtml(s.replace(/^\d+\.\s+/, ''))}</div>
            </li>`).join('')}
        </ol>`;
    } else {
      walkEl.innerHTML = renderMarkdown(walkthrough);
    }
  } else {
    walkEl.innerHTML = '<p style="color:var(--text-muted)">No walkthrough was generated. Try clicking Visualize again.</p>';
  }

  const flowEl = $('#diagram-flow');
  const conceptEl = $('#diagram-concept');
  if (mermaidBlocks.length === 0) {
    flowEl.innerHTML = '<p style="color:var(--text-muted)">No flowchart generated. Try again.</p>';
    conceptEl.innerHTML = '<p style="color:var(--text-muted)">No concept map generated.</p>';
    return;
  }
  flowEl.innerHTML = '<p style="color:var(--text-muted)">⏳ Rendering flowchart...</p>';
  conceptEl.innerHTML = '<p style="color:var(--text-muted)">⏳ Rendering concept map...</p>';
  $('#toolbar-flowchart').style.display = 'none';
  $('#toolbar-concept').style.display = 'none';

  setTimeout(async () => {
    if (mermaidBlocks.length > 0) await renderSingleMermaid(flowEl, mermaidBlocks[0], 'flowchart');
    if (mermaidBlocks.length > 1) {
      await renderSingleMermaid(conceptEl, mermaidBlocks[1], 'concept');
    } else {
      conceptEl.innerHTML = '<p style="color:var(--text-muted)">No concept map generated for this code.</p>';
    }
  }, 300);
}

// ===== SIMPLE MARKDOWN RENDERER (used inside narrative, hero, default) =====
function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    // Bold-key bullet → collapsible (kept for fallback sections)
    const sectionMatch = trimmed.match(/^[-*]\s+\*\*(.+?)\*\*\s*[:\uff1a]?\s*(.*)$/);
    if (sectionMatch) {
      const title = sectionMatch[1];
      const trailingText = (sectionMatch[2] || '').trim();
      const subItems = [];
      if (trailingText) subItems.push(trailingText);
      i++;
      while (i < lines.length) {
        const subTrimmed = lines[i].trim();
        if (!subTrimmed) {
          let peek = i + 1;
          while (peek < lines.length && !lines[peek].trim()) peek++;
          if (peek >= lines.length || /^[-*]\s+\*\*/.test(lines[peek].trim())) break;
          i++; continue;
        }
        if (/^[-*]\s+\*\*/.test(subTrimmed)) break;
        subItems.push(subTrimmed);
        i++;
      }
      let subHtml = '';
      if (subItems.length > 0) {
        subHtml = '<ul class="breakdown-sub-list">' +
          subItems.map(sub => `<li>${inlineFormat(escapeHtml(sub.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')))}</li>`).join('') +
          '</ul>';
      }
      output.push(
        `<div class="breakdown-item">` +
          `<div class="breakdown-item-header">` +
            `<strong>${inlineFormat(escapeHtml(title))}</strong>` +
            `<span class="breakdown-chevron">▸</span>` +
          `</div>` +
          `<div class="breakdown-item-body">${subHtml}</div>` +
        `</div>`
      );
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const listItems = [];
      while (i < lines.length) {
        const bm = lines[i].trim().match(/^[-*]\s+(.+)$/);
        if (!bm) break;
        listItems.push(bm[1]); i++;
      }
      output.push('<ul>' + listItems.map(item => `<li>${inlineFormat(escapeHtml(item))}</li>`).join('') + '</ul>');
      continue;
    }

    const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      const listItems = [];
      while (i < lines.length) {
        const nm = lines[i].trim().match(/^\d+\.\s+(.+)$/);
        if (!nm) break;
        listItems.push(nm[1]); i++;
      }
      output.push('<ol>' + listItems.map(item => `<li>${inlineFormat(escapeHtml(item))}</li>`).join('') + '</ol>');
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const pLine = lines[i].trim();
      if (!pLine || /^[-*]\s+/.test(pLine) || /^\d+\.\s+/.test(pLine)) break;
      paraLines.push(pLine); i++;
    }
    if (paraLines.length > 0)
      output.push(`<p>${inlineFormat(escapeHtml(paraLines.join(' ')))}</p>`);
  }

  return output.join('');
}

function inlineFormat(html) {
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Linkify [Line N] and [Lines N-M] — clickable line references
  html = html.replace(/\[Lines?\s*(\d+)(?:\s*[-\u2013]\s*(\d+))?\]/gi, (_, start, end) => {
    const s = parseInt(start, 10);
    const e = end ? parseInt(end, 10) : null;
    const label = e ? `Lines ${s}\u2013${e}` : `Line ${s}`;
    const fn    = e ? `jumpToLines(${s},${e})` : `jumpToLine(${s})`;
    return `<span class="line-ref" onclick="${fn}" title="Click to jump to ${label}">${label}</span>`;
  });
  return html;
}

function escapeHtml(s) {
  const el = document.createElement('div');
  el.textContent = s;
  return el.innerHTML;
}

// ===== UI HELPERS =====
let loadingInterval;
function showLoading(show) {
  const el = $('.loading-container');
  if (show) {
    el.classList.add('active');
    clearInterval(loadingInterval);
    let i = 0;
    const txt = $('.loading-text');
    txt.textContent = LOADING_MSGS[0];
    loadingInterval = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      txt.textContent = LOADING_MSGS[i];
    }, 2000);
  } else {
    el.classList.remove('active');
    clearInterval(loadingInterval);
  }
}

function showResults() {
  $('.results-section').classList.add('active');
  $('#results-placeholder')?.classList.add('hidden');
  $('#results-badge').textContent = `Powered by: ${STATE.lastProvider} — ${STATE.lastModel}`;
}

function hideResults()  { $('.results-section').classList.remove('active'); }
function showError(msg) { $('#error-message').textContent = msg; $('.error-card').classList.add('active'); }
function hideError()    { $('.error-card').classList.remove('active'); }

function setButtonsDisabled(d) {
  $('#btn-explain').disabled = d;
  $('#btn-visualize').disabled = d;
}

function setButtonsDisabledAll(d) {
  $('#btn-explain').disabled = d;
  $('#btn-visualize').disabled = d;
  $('#btn-explain-equation').disabled = d;
}

function switchResultTab(tab) {
  $$('.result-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
}

function clearAll() {
  $('#code-input').value = '';
  hideResults(); hideError();
  STATE.explanationData = null; STATE.visualData = null;
  $('#toolbar-explanation') && ($('#toolbar-explanation').style.display = 'none');
  $('#results-placeholder')?.classList.remove('hidden');
}
