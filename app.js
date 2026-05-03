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
  lastProvider: '',
  lastModel: '',
  zooms: { concept: 1, flowchart: 1 }
};

// ===== LOADING MESSAGES =====
// Multiple sets so they rotate meaningfully during longer waits
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

// ===== SYSTEM PROMPT: EXPLAIN =====
// Philosophy: Feynman Technique — if you can't explain it simply, you don't understand it.
// A great professor always: (1) anchors abstract ideas to physical reality,
// (2) anticipates WHERE beginners will get confused and heads it off,
// (3) gives a roadmap so the learner never feels lost,
// (4) ends with encouragement and a concrete next step.
const SYSTEM_PROMPT_EXPLAIN = `You are a world-class Python and Machine Learning professor. Your single most important job is making complex ideas feel obvious and exciting to a complete beginner — someone who has never written ML code before.

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
  **[Block name or what it does]:** Explain what it does in 1-2 plain sentences, then give a real-world analogy (start with "Think of it like..."). If the block has tricky lines, call them out: "The trickiest line here is X — it means Y."
Use clear sub-headings for each block.

### 🧠 Concept Dictionary
Find every ML/RL/Python concept in the code. For each one:
  **[Concept Name]:** What it means in one plain sentence. Then a real-world analogy in the next sentence. Then, if relevant, how it's used in this specific code.
Order them from simplest to most complex.

### 🔗 How the Pieces Work Together
Tell the story of what happens when someone runs this code — from the very first line to the very last output. Write it like a narrative, not a list. Use transitions like "first", "then", "which causes", "finally". Make the reader feel like they're watching the code run in slow motion.

### ⚠️ Where Beginners Usually Get Confused
List 3-5 specific things in this code that commonly trip up newcomers. For each one:
  **[The confusing thing]:** Why it's confusing, then the "aha!" explanation that makes it click.

### 💡 Beginner Tips for This Code
Give 4-6 practical tips specific to this code. These are things the reader can actually do: "Try changing X to Y and see what happens", "Add a print() statement after line Z to watch the data", etc. End with a specific encouragement — name something impressive the beginner has just understood.

### 🗺️ Your Learning Roadmap
Based on what this code uses, give a short ordered list of what to learn next. Format: "1. Learn [topic] → because this code uses [specific thing]". Maximum 5 items. End with one resource recommendation (a website, not a book).`;


// ===== SYSTEM PROMPT: VISUALIZE =====
// A professor's visual explanation prioritizes FLOW over completeness.
// Better to have a clean 10-node diagram than a cluttered 30-node mess.
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
Use these node classes with these colors:
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


const OR_MODELS = [
  { value: 'google/gemma-4-31b-it:free', label: 'Google Gemma 4 31B' },
  { value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nvidia Nemotron 3 Super 120B' },
  { value: 'nvidia/nemotron-nano-9b-v2:free', label: 'Nvidia Nemotron Nano 9B' },
  { value: 'inclusionai/ling-2.6-1t:free', label: 'InclusionAI Ling 2.6 1T' },
  { value: 'minimax/minimax-m2.5:free', label: 'MiniMax M2.5' },
  { value: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'Nvidia Nemotron 3 Nano 30B' },
  { value: 'openai/gpt-oss-120b:free', label: 'OpenAI GPT-OSS 120B' }
];

// ===== DOM REFS =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===== THEME =====
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('ml_theme', next);
  updateThemeIcon(next);
  // Re-init mermaid with base theme so color-coded classDefs still work correctly
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
    opt.value = m.value;
    opt.textContent = m.label;
    sel.appendChild(opt);
  });
  if (STATE.customModels.length > 0) {
    const sep = document.createElement('option');
    sep.disabled = true;
    sep.textContent = '── Custom Models ──';
    sel.appendChild(sep);
    STATE.customModels.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = `★ ${m.label}`;
      opt.className = 'custom';
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
  const newModel = { value: modelId, label: label };
  STATE.customModels.push(newModel);
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

  $$('.provider-tab').forEach(tab => {
    tab.addEventListener('click', () => setProvider(tab.dataset.provider));
  });

  $('#btn-save').addEventListener('click', saveToken);
  $('#btn-add-model').addEventListener('click', addCustomModel);
  $('#custom-model').addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomModel(); });

  $('#btn-explain').addEventListener('click', () => runExplain());
  $('#btn-visualize').addEventListener('click', () => runVisualize());
  $('#btn-clear').addEventListener('click', clearAll);

  $$('.result-tab').forEach(tab => {
    tab.addEventListener('click', () => switchResultTab(tab.dataset.tab));
  });
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
    hint.innerHTML = '💡 Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> — it\'s free and takes 30 seconds.';
  } else if (STATE.provider === 'huggingface') {
    hint.innerHTML = '💡 Get your free token at <a href="https://huggingface.co" target="_blank">huggingface.co</a> → Sign up → Settings → Access Tokens → New Token (Read role)';
  } else {
    hint.innerHTML = '💡 Get your free key at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a> → Sign up → Keys → Create Key. Free models are available!';
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
  let token = '';
  if (STATE.provider === 'gemini') token = STATE.geminiToken;
  else if (STATE.provider === 'huggingface') token = STATE.hfToken;
  else token = STATE.orToken;
  if (token) {
    el.textContent = '✅ Token saved — you\'re ready to go!';
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
// Turn raw API error strings into something a beginner can act on
function friendlyError(rawMessage) {
  const msg = rawMessage || '';

  if (msg.includes('No API token')) {
    return '🔑 No API key found. Click "Setup" in the top-right corner, paste your key, and hit Save.';
  }
  if (msg.includes('paste some Python code')) {
    return '📋 The code box is empty! Paste some Python or ML code in the box on the left first.';
  }
  if (msg.includes('free-models-per-day') || msg.includes('daily limit')) {
    return '⏰ You\'ve hit the daily free limit for this model. Try again tomorrow, or switch to a different free model in Setup.';
  }
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    return '🐢 Too many requests too fast. The app will retry automatically — just wait a few seconds.';
  }
  if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid key')) {
    return '🔑 Your API key looks incorrect. Go to Setup, double-check the key (no extra spaces), and save again.';
  }
  if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
    return '🚫 Access denied. Your API key may not have permission for this model. Try a different model in Setup.';
  }
  if (msg.includes('content_filter') || msg.toLowerCase().includes('filtered')) {
    return '🛡️ This model filtered the request. Try pasting a different code snippet, or switch to a different model.';
  }
  if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    return '🌐 Network error — check your internet connection and try again.';
  }
  if (msg.toLowerCase().includes('unexpected') || msg.toLowerCase().includes('format')) {
    return '🤔 The AI returned an unexpected response. This sometimes happens with free models — try clicking the button again, or switch to a different model.';
  }
  // Default: show the raw message but prepend context
  return \`❌ Something went wrong: \${msg}\n\nTip: Try switching the AI model in Setup, or paste a smaller snippet of code.\`;
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

  btn.disabled = true;
  btn.textContent = 'Checking...';
  loading.style.display = 'flex';
  body.style.display = 'none';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });

    if (!res.ok) throw new Error(\`API returned \${res.status}. Check your key is valid.\`);

    const json = await res.json();
    const d = json.data;

    const isFree = d.is_free_tier;
    const tierLabel = isFree ? 'Free Tier' : 'Paid Tier';
    const tierClass = isFree ? 'tier-free' : 'tier-paid';
    const tierIcon = isFree ? '🆓' : '💎';

    const hasLimit = d.limit !== null;
    const limit = hasLimit ? d.limit : null;
    const remaining = d.limit_remaining;
    const usedPercent = hasLimit && limit > 0 ? Math.min(100, ((limit - (remaining || 0)) / limit) * 100) : 0;
    const resetLabel = d.limit_reset || 'Never';

    const fmt = (v) => {
      if (v === null || v === undefined) return '—';
      return '$' + Number(v).toFixed(4);
    };

    const freeInfo = isFree
      ? \`<div class="or-limits-free-info">
           <span class="free-badge">⚡ Free Model Limits</span>
           <span>20 req/min • 50 req/day</span>
           <span class="or-limits-hint">Purchase ≥$10 credits → 1000 req/day</span>
         </div>\`
      : \`<div class="or-limits-free-info paid">
           <span class="free-badge paid-badge">⚡ Free Model Limits</span>
           <span>20 req/min • 1000 req/day</span>
         </div>\`;

    body.innerHTML = \`
      <div class="or-limits-grid">
        <div class="or-stat-row tier-row">
          <span class="or-stat-label">\${tierIcon} Account Tier</span>
          <span class="or-stat-value \${tierClass}">\${tierLabel}</span>
        </div>
        \${d.label ? \`<div class="or-stat-row">
          <span class="or-stat-label">🏷️ Key Label</span>
          <span class="or-stat-value">\${escapeHtml(d.label)}</span>
        </div>\` : ''}
        \${hasLimit ? \`
        <div class="or-stat-row">
          <span class="or-stat-label">💳 Credit Limit</span>
          <span class="or-stat-value">\${fmt(limit)}</span>
        </div>
        <div class="or-stat-row">
          <span class="or-stat-label">✅ Remaining</span>
          <span class="or-stat-value remaining">\${fmt(remaining)}</span>
        </div>
        <div class="or-limits-bar-wrap">
          <div class="or-limits-bar" style="width: \${usedPercent.toFixed(1)}%"></div>
        </div>
        <div class="or-stat-row">
          <span class="or-stat-label">🔄 Resets</span>
          <span class="or-stat-value">\${resetLabel}</span>
        </div>\` : \`
        <div class="or-stat-row">
          <span class="or-stat-label">💳 Credit Limit</span>
          <span class="or-stat-value remaining">Unlimited</span>
        </div>\`}
      </div>
      <div class="or-usage-section">
        <span class="or-usage-title">📈 Usage Breakdown</span>
        <div class="or-usage-grid">
          <div class="or-usage-item">
            <span class="or-usage-period">Today</span>
            <span class="or-usage-amount">\${fmt(d.usage_daily)}</span>
          </div>
          <div class="or-usage-item">
            <span class="or-usage-period">This Week</span>
            <span class="or-usage-amount">\${fmt(d.usage_weekly)}</span>
          </div>
          <div class="or-usage-item">
            <span class="or-usage-period">This Month</span>
            <span class="or-usage-amount">\${fmt(d.usage_monthly)}</span>
          </div>
          <div class="or-usage-item">
            <span class="or-usage-period">All Time</span>
            <span class="or-usage-amount">\${fmt(d.usage)}</span>
          </div>
        </div>
      </div>
      \${freeInfo}
    \`;
    body.style.display = 'block';
  } catch (e) {
    body.innerHTML = \`<p class="or-limits-error">❌ \${escapeHtml(e.message)}</p>\`;
    body.style.display = 'block';
  } finally {
    loading.style.display = 'none';
    btn.disabled = false;
    btn.textContent = 'Check Status';
  }
}

// ===== API CALLS =====
async function callAPI(systemPrompt, userCode) {
  const token = getToken();
  if (!token) throw new Error('No API token found. Please save your token in the Setup section.');
  if (!userCode.trim()) throw new Error('Please paste some Python code first.');

  if (STATE.provider === 'gemini') {
    return await callGemini(token, systemPrompt, userCode);
  } else if (STATE.provider === 'huggingface') {
    return await callHuggingFace(token, systemPrompt, userCode);
  } else {
    return await callOpenRouter(token, systemPrompt, userCode);
  }
}

// BUG FIX: was hardcoded to 'gemini-2.5-flash' — now correctly uses STATE.geminiModel
async function callGemini(token, systemPrompt, userCode) {
  const model = STATE.geminiModel || 'gemini-2.5-flash';
  console.log('[Gemini] Calling model:', model);

  const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${token}\`;

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

  if (!res.ok) {
    const msg = data?.error?.message || \`API error: \${res.status}\`;
    throw new Error(\`Google Gemini: \${msg}\`);
  }

  if (data.candidates && data.candidates.length > 0) {
    const parts = data.candidates[0].content?.parts;
    if (parts && parts.length > 0) return parts[0].text || '';
    // Handle safety blocks
    const reason = data.candidates[0].finishReason;
    if (reason === 'SAFETY') throw new Error('content_filter: The model blocked this content for safety reasons.');
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
        const clonedRes = res.clone();
        const data = await clonedRes.json();
        if (data?.error?.message?.includes('free-models-per-day')) {
          isHardLimit = true;
        }
      } catch (e) { /* ignore */ }
    }

    if (res.status === 429 && !isHardLimit && retries < maxRetries) {
      retries++;
      const waitTime = Math.pow(2, retries) * 1000 + Math.random() * 1000;
      const secondsTotal = Math.ceil(waitTime / 1000);
      console.log(\`[Rate Limit 429] Retrying in \${secondsTotal}s... (Attempt \${retries}/\${maxRetries})\`);

      const txt = $('.loading-text');
      if (txt && document.querySelector('.loading-container').classList.contains('active')) {
        clearInterval(loadingInterval);
        let secondsLeft = secondsTotal;
        txt.textContent = \`🐢 Rate limited. Retrying in \${secondsLeft}s... (this is normal!)\`;

        const countdown = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) {
            txt.textContent = \`🐢 Rate limited. Retrying in \${secondsLeft}s... (this is normal!)\`;
          }
        }, 1000);

        await new Promise(resolve => setTimeout(resolve, waitTime));
        clearInterval(countdown);
        showLoading(true);
      } else {
        await new Promise(resolve => setTimeout(resolve, waitTime));
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
    headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userCode }
      ],
      max_tokens: 8000,
      temperature: 0.4
    })
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || data?.error || \`API error: \${res.status}\`;
    throw new Error(\`Hugging Face: \${msg}\`);
  }

  if (data.choices && data.choices.length > 0) {
    return data.choices[0].message?.content || '';
  }

  throw new Error('Unexpected response format from Hugging Face');
}

async function callOpenRouter(token, systemPrompt, userCode) {
  const model = STATE.orModel || 'google/gemma-4-31b-it:free';
  console.log('[OpenRouter] Calling model:', model);
  const res = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'ml-code-explainer',
      'X-Title': 'ML Code Explainer'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userCode }
      ],
      temperature: 0.4,
      max_tokens: 8000
    })
  });

  const data = await res.json();
  console.log('[OpenRouter] Response status:', res.status, 'Body:', JSON.stringify(data).substring(0, 500));

  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.code || data?.message || \`API error: \${res.status}\`;
    throw new Error(\`OpenRouter: \${msg}\`);
  }

  if (data.error) {
    throw new Error(\`OpenRouter: \${data.error.message || data.error.code || JSON.stringify(data.error)}\`);
  }

  if (data.choices && data.choices.length > 0) {
    const choice = data.choices[0];
    const content = choice.message?.content || choice.text || '';
    if (content) return content;
    if (choice.finish_reason === 'content_filter') {
      throw new Error('content_filter: The model filtered this request. Try a different model.');
    }
  }

  throw new Error(\`Unexpected OpenRouter response. Check browser console for details.\`);
}

// ===== EXPLAIN =====
async function runExplain() {
  saveToken();
  const code = $('#code-input').value;
  if (!code.trim()) return showError(friendlyError('paste some Python code'));

  showLoading(true);
  hideError();
  hideResults();
  setButtonsDisabled(true);

  try {
    const text = await callAPI(SYSTEM_PROMPT_EXPLAIN, code);
    STATE.explanationData = text;
    STATE.lastProvider = getProviderLabel();
    STATE.lastModel = getModelLabel();
    renderExplanation(text);
    showResults();
    switchResultTab('explanation');
  } catch (e) {
    showError(friendlyError(e.message));
  } finally {
    showLoading(false);
    setButtonsDisabled(false);
  }
}

async function runVisualize() {
  saveToken();
  const code = $('#code-input').value;
  if (!code.trim()) return showError(friendlyError('paste some Python code'));

  showLoading(true);
  hideError();
  hideResults();
  setButtonsDisabled(true);

  try {
    const text = await callAPI(SYSTEM_PROMPT_VISUAL, code);
    STATE.visualData = text;
    STATE.lastProvider = getProviderLabel();
    STATE.lastModel = getModelLabel();
    renderVisual(text);
    showResults();
    switchResultTab('visual');
  } catch (e) {
    showError(friendlyError(e.message));
  } finally {
    showLoading(false);
    setButtonsDisabled(false);
  }
}

// ===== RENDERING =====
function renderExplanation(text) {
  const container = $('#explanation-content');
  // Split on ### headings, keeping the heading with each section
  const sections = text.split(/(?=###\s)/).filter(s => s.trim());
  let html = '';
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const rawHeading = lines[0].replace(/^#+\s*/, '');
    const body = lines.slice(1).join('\n').trim();
    html += \`<div class="explanation-section"><h3>\${escapeHtml(rawHeading)}</h3>\${renderMarkdown(body)}</div>\`;
  });
  if (!html) html = \`<div class="explanation-section">\${renderMarkdown(text)}</div>\`;
  container.innerHTML = html;

  // Wire up collapsible breakdown items
  container.querySelectorAll('.breakdown-item-header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('collapsed');
    });
  });

  const toolbar = $('#toolbar-explanation');
  if (toolbar) toolbar.style.display = 'flex';
}

function sanitizeMermaid(code) {
  let s = code;

  // Strip stray HTML tags
  s = s.replace(/<[^>]+>/g, '');

  // Wrap bare bracket labels that contain special chars in double-quotes
  s = s.replace(/\[([^\]"]+)\]/g, (match, label) => {
    if (/[()=:;_<>°θΔ&{}#@!$%^*~`|\\]/.test(label)) {
      const clean = label
        .replace(/["]/g, "'")
        .replace(/[()]/g, '')
        .replace(/[°θΔ]/g, '')
        .replace(/[_]/g, ' ')
        .trim();
      return \`["\${clean}"]\`;
    }
    return match;
  });

  // Ensure arrow labels are quoted
  s = s.replace(/-->\\|([^|"]+)\\|/g, (match, label) => \`-->|"\${label}"|\`);

  // Remove blank lines (Mermaid is picky)
  s = s.split('\n').filter(line => line.trim() !== '').join('\n');

  return s;
}

async function renderSingleMermaid(container, code, label) {
  const uid = Date.now() + Math.random().toString(36).substr(2, 5);
  const id = \`mermaid-\${label}-\${uid}\`;
  const sanitized = sanitizeMermaid(code);
  console.log(\`[Visual] Rendering \${label}:\`, sanitized.substring(0, 200));

  container.innerHTML = \`<pre class="mermaid" id="\${id}">\${sanitized}</pre>\`;

  try {
    await mermaid.run({ nodes: [document.getElementById(id)] });
    console.log(\`[Visual] \${label} rendered OK\`);
    const toolbar = $(\`#toolbar-\${label}\`);
    if (toolbar) toolbar.style.display = 'flex';
    STATE.zooms[label] = 1;
    return true;
  } catch (e) {
    console.warn(\`[Visual] \${label} render failed, trying original...\`, e);
    const id2 = \`\${id}-retry\`;
    container.innerHTML = \`<pre class="mermaid" id="\${id2}">\${code}</pre>\`;
    try {
      await mermaid.run({ nodes: [document.getElementById(id2)] });
      console.log(\`[Visual] \${label} rendered OK on retry\`);
      const toolbar = $(\`#toolbar-\${label}\`);
      if (toolbar) toolbar.style.display = 'flex';
      STATE.zooms[label] = 1;
      return true;
    } catch (e2) {
      console.warn(\`[Visual] \${label} failed completely:\`, e2);
      container.innerHTML = \`
        <div class="mermaid-fallback">
          <p class="mermaid-fallback-label">⚠️ Couldn't render this diagram automatically. Here's the raw diagram code you can paste into <a href="https://mermaid.live" target="_blank">mermaid.live</a> to view it:</p>
          <pre class="mermaid-fallback-code">\${escapeHtml(code)}</pre>
        </div>\`;
      const toolbar = $(\`#toolbar-\${label}\`);
      if (toolbar) toolbar.style.display = 'none';
      return false;
    }
  }
}

// ===== DIAGRAM TOOLS =====
function zoomDiagram(label, amount) {
  STATE.zooms[label] = Math.max(0.2, Math.min(3, STATE.zooms[label] + amount));
  const pre = document.querySelector(\`#diagram-\${label === 'concept' ? 'concept' : 'flow'} pre.mermaid\`);
  if (pre) pre.style.transform = \`scale(\${STATE.zooms[label]})\`;
}

// ===== EXPORT / SAVE TOOLS =====
function exportExplanation(format) {
  if (!STATE.explanationData) return;

  if (format === 'md') {
    const blob = new Blob([STATE.explanationData], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ml_explanation.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } else if (format === 'pdf') {
    const content = document.getElementById('explanation-content');
    // Expand all collapsed sections before export
    content.querySelectorAll('.breakdown-item').forEach(item => item.classList.remove('collapsed'));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      content.style.backgroundColor = '#1C1C1A';
      content.style.color = '#E5E5E0';
      content.style.padding = '20px';
    }

    html2pdf().set({
      margin: 10,
      filename: 'ml_explanation.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(content).save().then(() => {
      if (isDark) {
        content.style.backgroundColor = '';
        content.style.color = '';
        content.style.padding = '';
      }
    });
  }
}

function saveDiagram(label, format = 'svg') {
  const container = document.querySelector(\`#diagram-\${label === 'concept' ? 'concept' : 'flow'}\`);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) {
    alert('No diagram rendered yet. Click "Visualize" first to generate diagrams.');
    return;
  }

  if (format === 'pdf') {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) container.style.backgroundColor = '#1C1C1A';
    html2pdf().set({
      margin: 10,
      filename: \`ml_explainer_\${label}.pdf\`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(container).save().then(() => {
      if (isDark) container.style.backgroundColor = '';
    });
    return;
  }

  let svgData = new XMLSerializer().serializeToString(svg);
  if (!svgData.match(/^<svg[^>]+xmlns="http\\:\\/\\/www\\.w3\\.org\\/2000\\/svg"/)) {
    svgData = svgData.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (format === 'svg') {
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`ml_explainer_\${label}.svg\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } else if (format === 'png') {
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    const scale = 3;
    const width = parseFloat(svg.getAttribute('width') || rect.width || 800);
    const height = parseFloat(svg.getAttribute('height') || rect.height || 600);
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1C1C1A' : '#FAF9F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = \`ml_explainer_\${label}.png\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }
}

function openDiagramInNewTab(label) {
  const container = document.querySelector(\`#diagram-\${label === 'concept' ? 'concept' : 'flow'}\`);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  window.open(URL.createObjectURL(blob), '_blank');
}

function renderVisual(text) {
  console.log('[Visual] Raw response:', text.substring(0, 500));

  // Extract all mermaid code blocks
  const mermaidBlocks = [];
  const mermaidRegex = /\`\`\`mermaid\s*\n([\s\S]*?)\`\`\`/g;
  let match;
  while ((match = mermaidRegex.exec(text)) !== null) {
    mermaidBlocks.push(match[1].trim());
  }
  console.log('[Visual] Found', mermaidBlocks.length, 'mermaid blocks');

  // Extract the plain-English walkthrough
  let walkthrough = '';
  const walkthroughMatch = text.match(/(?:SECTION C|PLAIN ENGLISH WALKTHROUGH|walkthrough)[:\s\-]*((?:\d+\.\s+[\s\S]*?)$)/im);
  if (walkthroughMatch) {
    walkthrough = walkthroughMatch[1].trim();
  } else {
    const lastIdx = text.lastIndexOf('\`\`\`');
    if (lastIdx > 0) {
      const after = text.substring(lastIdx + 3).trim();
      if (after.length > 20) walkthrough = after;
    }
  }

  // Render walkthrough (sync, no mermaid dependency)
  const walkEl = $('#walkthrough-content');
  if (walkthrough) {
    const steps = walkthrough.match(/\d+\.\s+.+/g);
    if (steps) {
      walkEl.innerHTML = '<ol>' + steps.map(s => \`<li>\${escapeHtml(s.replace(/^\\d+\\.\\s+/, ''))}</li>\`).join('') + '</ol>';
    } else {
      walkEl.innerHTML = renderMarkdown(walkthrough);
    }
  } else {
    walkEl.innerHTML = '<p style="color:var(--text-muted)">No walkthrough was generated. Try clicking Visualize again.</p>';
  }

  const flowEl = $('#diagram-flow');
  const conceptEl = $('#diagram-concept');

  if (mermaidBlocks.length === 0) {
    flowEl.innerHTML = '<p style="color:var(--text-muted)">No flowchart was generated. The AI may have returned an unexpected format — try again.</p>';
    conceptEl.innerHTML = '<p style="color:var(--text-muted)">No concept map was generated.</p>';
    return;
  }

  flowEl.innerHTML = '<p style="color:var(--text-muted)">⏳ Rendering flowchart...</p>';
  conceptEl.innerHTML = '<p style="color:var(--text-muted)">⏳ Rendering concept map...</p>';
  $('#toolbar-flowchart').style.display = 'none';
  $('#toolbar-concept').style.display = 'none';

  setTimeout(async () => {
    if (mermaidBlocks.length > 0) {
      await renderSingleMermaid(flowEl, mermaidBlocks[0], 'flowchart');
    }
    if (mermaidBlocks.length > 1) {
      await renderSingleMermaid(conceptEl, mermaidBlocks[1], 'concept');
    } else {
      conceptEl.innerHTML = '<p style="color:var(--text-muted)">No concept map was generated for this code.</p>';
    }
  }, 300);
}

// ===== MARKDOWN RENDERER =====
function renderMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Section-header bullet: * **Title:** or - **Title:**
    const sectionMatch = trimmed.match(/^[-*]\s+\*\*(.+?)\*\*\s*[:\uff1a]?\s*(.*)$/);
    if (sectionMatch) {
      const title = sectionMatch[1];
      const trailingText = (sectionMatch[2] || '').trim();
      const subItems = [];
      if (trailingText) subItems.push(trailingText);
      i++;
      while (i < lines.length) {
        const subLine = lines[i];
        const subTrimmed = subLine.trim();
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
        subHtml = '<ul class="breakdown-sub-list">';
        for (const sub of subItems) {
          const content = sub.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
          subHtml += \`<li>\${inlineFormat(escapeHtml(content))}</li>\`;
        }
        subHtml += '</ul>';
      }
      output.push(
        \`<div class="breakdown-item">\` +
          \`<div class="breakdown-item-header">\` +
            \`<span class="sec-dot"></span>\` +
            \`<span class="breakdown-chevron">▸</span>\` +
            \`<strong>\${inlineFormat(escapeHtml(title))}</strong>\` +
          \`</div>\` +
          \`<div class="breakdown-item-body">\${subHtml}</div>\` +
        \`</div>\`
      );
      continue;
    }

    // Regular bullet list
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const listItems = [];
      while (i < lines.length) {
        const bLine = lines[i].trim();
        const bMatch = bLine.match(/^[-*]\s+(.+)$/);
        if (!bMatch) break;
        listItems.push(bMatch[1]);
        i++;
      }
      output.push('<ul>' + listItems.map(item => \`<li>\${inlineFormat(escapeHtml(item))}</li>\`).join('') + '</ul>');
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      const listItems = [];
      while (i < lines.length) {
        const nLine = lines[i].trim();
        const nMatch = nLine.match(/^\d+\.\s+(.+)$/);
        if (!nMatch) break;
        listItems.push(nMatch[1]);
        i++;
      }
      output.push('<ol>' + listItems.map(item => \`<li>\${inlineFormat(escapeHtml(item))}</li>\`).join('') + '</ol>');
      continue;
    }

    // Paragraph: collect consecutive plain lines
    const paraLines = [];
    while (i < lines.length) {
      const pLine = lines[i].trim();
      if (!pLine || /^[-*]\s+/.test(pLine) || /^\d+\.\s+/.test(pLine)) break;
      paraLines.push(pLine);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(\`<p>\${inlineFormat(escapeHtml(paraLines.join(' ')))}</p>\`);
    }
  }

  return output.join('');
}

function inlineFormat(html) {
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
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
  const el = $('.results-section');
  el.classList.add('active');
  const ph = $('#results-placeholder');
  if (ph) ph.classList.add('hidden');
  $('#results-badge').textContent = \`Powered by: \${STATE.lastProvider} — \${STATE.lastModel}\`;
}

function hideResults() {
  $('.results-section').classList.remove('active');
}

function showError(msg) {
  const el = $('.error-card');
  // Support multi-line friendly messages
  $('#error-message').textContent = msg;
  el.classList.add('active');
}

function hideError() {
  $('.error-card').classList.remove('active');
}

function setButtonsDisabled(d) {
  $('#btn-explain').disabled = d;
  $('#btn-visualize').disabled = d;
}

function switchResultTab(tab) {
  $$('.result-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.tab-content').forEach(c => c.classList.toggle('active', c.id === \`tab-\${tab}\`));
}

function clearAll() {
  $('#code-input').value = '';
  hideResults();
  hideError();
  STATE.explanationData = null;
  STATE.visualData = null;
  const expToolbar = $('#toolbar-explanation');
  if (expToolbar) expToolbar.style.display = 'none';
  const ph = $('#results-placeholder');
  if (ph) ph.classList.remove('hidden');
}
