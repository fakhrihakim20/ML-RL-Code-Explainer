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

const LOADING_MSGS = [
  "Reading your code...",
  "Thinking like a tutor...",
  "Building your explanation..."
];

const SYSTEM_PROMPT_EXPLAIN = `You are a friendly coding tutor helping a complete beginner understand Python code, especially machine learning and reinforcement learning. Always explain in simple English, use real-world analogies, avoid heavy jargon, and be encouraging.

Respond in these exact sections:

### 1. Simple Summary
One short paragraph explaining what the code does like talking to a 12-year-old.

### 2. What Problem Does This Solve?
Why does this code exist and what is it trying to achieve.

### 3. Section-by-Section Breakdown
Go through each important block or function and explain in plain English.

### 4. Key Concepts Explained
List ML/RL/Python terms found in the code and explain each with a simple real-world analogy.

### 5. How The Pieces Connect
Explain the overall flow: what happens first, next, and what the final output is.

### 6. Beginner Tips
Helpful tips and encouragement for a beginner reading this code.`;

const SYSTEM_PROMPT_VISUAL = `You are a coding tutor helping a beginner visualize how Python code works. Your job is to return THREE sections:

SECTION A - FLOWCHART:
Return a valid Mermaid.js flowchart using 'flowchart TD' syntax showing the execution flow.
RULES for valid Mermaid syntax:
- Use simple alphanumeric node IDs like A, B, C1, step1, etc.
- Put labels in square brackets: A["Start the program"]
- Always wrap labels in double quotes inside brackets: B["Load the data"]
- Do NOT use special characters like parentheses, colons, equals, underscores, or unicode in labels
- Use simple short English phrases only
- For decision nodes use curly braces: C{"Is data valid?"}
- For arrows with labels use: A -->|"yes"| B

COLOR-CODING (REQUIRED): After the diagram, add classDef and class statements to color-code nodes by category:
  classDef input fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
  classDef process fill:#FEF3C7,stroke:#D97706,color:#78350F
  classDef decision fill:#EDE9FE,stroke:#7C3AED,color:#3B0764
  classDef output fill:#D1FAE5,stroke:#059669,color:#064E3B
  classDef error fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
  classDef data fill:#FFE4E6,stroke:#E11D48,color:#881337
  classDef loop fill:#FFF7ED,stroke:#EA580C,color:#7C2D12
Then assign nodes: class A,B input; class C,D process; etc.
Every node must be assigned to a class. Group all start/input nodes as "input", processing/action nodes as "process", conditional/decision nodes as "decision", final/output nodes as "output", error-handling as "error", data/variable nodes as "data", and loop nodes as "loop".

Wrap the diagram in a mermaid code block.

SECTION B - CONCEPT MAP:
Return a second Mermaid.js diagram using 'graph LR' syntax showing how key concepts relate.
Follow the same syntax rules as above. Use simple node IDs and quoted labels.
Example: A["Training Loop"] -->|"uses"| B["Neural Network"]

COLOR-CODING (REQUIRED): Add classDef for concept categories:
  classDef core fill:#DBEAFE,stroke:#3B82F6,color:#1E3A5F
  classDef algo fill:#FEF3C7,stroke:#D97706,color:#78350F
  classDef data fill:#D1FAE5,stroke:#059669,color:#064E3B
  classDef lib fill:#EDE9FE,stroke:#7C3AED,color:#3B0764
  classDef math fill:#FFE4E6,stroke:#E11D48,color:#881337
  classDef infra fill:#F3F4F6,stroke:#6B7280,color:#1F2937
Then assign: class A,B core; etc. Categories: "core" for main concepts, "algo" for algorithms/methods, "data" for data-related, "lib" for libraries/frameworks, "math" for mathematical concepts, "infra" for infrastructure/setup.

Wrap in a mermaid code block.

SECTION C - PLAIN ENGLISH WALKTHROUGH:
Write a short numbered step-by-step walkthrough (max 10 steps) of what happens when this code runs, like a story. Each step should be one simple sentence.

Only return these three sections, nothing else.`;


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
  // Re-init mermaid with base theme for color-coded classDefs
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
  // Built-in models
  OR_MODELS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    sel.appendChild(opt);
  });
  // Custom models
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
  // Check if already exists
  const allModels = [...OR_MODELS, ...STATE.customModels];
  if (allModels.some(m => m.value === modelId)) {
    input.value = '';
    input.placeholder = 'Model already exists!';
    setTimeout(() => { input.placeholder = 'e.g. openai/gpt-4o-mini'; }, 2000);
    return;
  }
  // Create label from model ID
  const label = modelId.split('/').pop().replace(/[-_:]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const newModel = { value: modelId, label: label };
  STATE.customModels.push(newModel);
  localStorage.setItem('ml_custom_models', JSON.stringify(STATE.customModels));
  buildModelDropdown();
  // Auto-select the new model
  $('#or-model').value = modelId;
  STATE.orModel = modelId;
  localStorage.setItem('ml_or_model', modelId);
  input.value = '';
}

function removeCustomModel(modelId) {
  STATE.customModels = STATE.customModels.filter(m => m.value !== modelId);
  localStorage.setItem('ml_custom_models', JSON.stringify(STATE.customModels));
  // If we're removing the currently selected model, reset to default
  if (STATE.orModel === modelId) {
    STATE.orModel = OR_MODELS[0].value;
    localStorage.setItem('ml_or_model', STATE.orModel);
  }
  buildModelDropdown();
  $('#or-model').value = STATE.orModel;
}

function restoreState() {
  // Check if token exists on load
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
  // Setup drawer toggle
  $('#setup-toggle-btn').addEventListener('click', () => {
    $('#setup-drawer').classList.add('open');
    $('#drawer-overlay').classList.add('open');
  });
  $('#drawer-close').addEventListener('click', closeDrawer);
  $('#drawer-overlay').addEventListener('click', closeDrawer);

  // Provider tabs
  $$('.provider-tab').forEach(tab => {
    tab.addEventListener('click', () => setProvider(tab.dataset.provider));
  });

  // Save
  $('#btn-save').addEventListener('click', saveToken);

  // Add custom model
  $('#btn-add-model').addEventListener('click', addCustomModel);
  $('#custom-model').addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomModel(); });

  // Actions
  $('#btn-explain').addEventListener('click', () => runExplain());
  $('#btn-visualize').addEventListener('click', () => runVisualize());
  $('#btn-clear').addEventListener('click', clearAll);

  // Result tabs
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
    hint.innerHTML = '💡 Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>';
  } else if (STATE.provider === 'huggingface') {
    hint.innerHTML = '💡 Get your free token at <a href="https://huggingface.co" target="_blank">huggingface.co</a> → Sign up → Settings → Access Tokens → New Token (Read role)';
  } else {
    hint.innerHTML = '💡 Get your free key at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a> → Sign up → Keys → Create Key';
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
    el.textContent = '✅ Token saved';
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
  if (STATE.provider === 'gemini') return 'Gemini 2.5 Flash';
  if (STATE.provider === 'huggingface') return STATE.hfModel;
  const allModels = [...OR_MODELS, ...STATE.customModels];
  const m = allModels.find(x => x.value === STATE.orModel);
  return m ? m.label : STATE.orModel;
}

function getProviderLabel() {
  if (STATE.provider === 'gemini') return 'Google Gemini';
  return STATE.provider === 'huggingface' ? 'Hugging Face' : 'OpenRouter';
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
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}. Check your key is valid.`);
    }

    const json = await res.json();
    const d = json.data;

    // Build the status card
    const isFree = d.is_free_tier;
    const tierLabel = isFree ? 'Free Tier' : 'Paid Tier';
    const tierClass = isFree ? 'tier-free' : 'tier-paid';
    const tierIcon = isFree ? '🆓' : '💎';

    // Credits
    const hasLimit = d.limit !== null;
    const limit = hasLimit ? d.limit : null;
    const remaining = d.limit_remaining;
    const usedPercent = hasLimit && limit > 0 ? Math.min(100, ((limit - (remaining || 0)) / limit) * 100) : 0;
    const resetLabel = d.limit_reset || 'Never';

    // Format currency
    const fmt = (v) => {
      if (v === null || v === undefined) return '—';
      return '$' + Number(v).toFixed(4);
    };

    // Free tier limits
    const freeInfo = isFree
      ? `<div class="or-limits-free-info">
           <span class="free-badge">⚡ Free Model Limits</span>
           <span>20 req/min • 50 req/day</span>
           <span class="or-limits-hint">Purchase ≥$10 credits → 1000 req/day</span>
         </div>`
      : `<div class="or-limits-free-info paid">
           <span class="free-badge paid-badge">⚡ Free Model Limits</span>
           <span>20 req/min • 1000 req/day</span>
         </div>`;

    body.innerHTML = `
      <div class="or-limits-grid">
        <div class="or-stat-row tier-row">
          <span class="or-stat-label">${tierIcon} Account Tier</span>
          <span class="or-stat-value ${tierClass}">${tierLabel}</span>
        </div>
        ${d.label ? `<div class="or-stat-row">
          <span class="or-stat-label">🏷️ Key Label</span>
          <span class="or-stat-value">${escapeHtml(d.label)}</span>
        </div>` : ''}
        ${hasLimit ? `
        <div class="or-stat-row">
          <span class="or-stat-label">💳 Credit Limit</span>
          <span class="or-stat-value">${fmt(limit)}</span>
        </div>
        <div class="or-stat-row">
          <span class="or-stat-label">✅ Remaining</span>
          <span class="or-stat-value remaining">${fmt(remaining)}</span>
        </div>
        <div class="or-limits-bar-wrap">
          <div class="or-limits-bar" style="width: ${usedPercent.toFixed(1)}%"></div>
        </div>
        <div class="or-stat-row">
          <span class="or-stat-label">🔄 Resets</span>
          <span class="or-stat-value">${resetLabel}</span>
        </div>` : `
        <div class="or-stat-row">
          <span class="or-stat-label">💳 Credit Limit</span>
          <span class="or-stat-value remaining">Unlimited</span>
        </div>`}
      </div>

      <div class="or-usage-section">
        <span class="or-usage-title">📈 Usage Breakdown</span>
        <div class="or-usage-grid">
          <div class="or-usage-item">
            <span class="or-usage-period">Today</span>
            <span class="or-usage-amount">${fmt(d.usage_daily)}</span>
          </div>
          <div class="or-usage-item">
            <span class="or-usage-period">This Week</span>
            <span class="or-usage-amount">${fmt(d.usage_weekly)}</span>
          </div>
          <div class="or-usage-item">
            <span class="or-usage-period">This Month</span>
            <span class="or-usage-amount">${fmt(d.usage_monthly)}</span>
          </div>
          <div class="or-usage-item">
            <span class="or-usage-period">All Time</span>
            <span class="or-usage-amount">${fmt(d.usage)}</span>
          </div>
        </div>
      </div>

      ${freeInfo}
    `;

    body.style.display = 'block';
  } catch (e) {
    body.innerHTML = `<p class="or-limits-error">❌ ${escapeHtml(e.message)}</p>`;
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

async function callGemini(token, systemPrompt, userCode) {
  const model = 'gemini-2.5-flash';
  console.log('[Gemini] Calling model:', model);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`;
  
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userCode }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.4, maxOutputTokens: 8000 }
    })
  });

  const data = await res.json();
  
  if (!res.ok) {
    const msg = data?.error?.message || `API error: ${res.status}`;
    throw new Error(`Google Gemini: ${msg}`);
  }

  if (data.candidates && data.candidates.length > 0) {
    const parts = data.candidates[0].content?.parts;
    if (parts && parts.length > 0) return parts[0].text || '';
  }
  
  throw new Error('Unexpected response format from Gemini');
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  let retries = 0;
  while (true) {
    const res = await fetch(url, options);
    
    // Check if it's a hard daily limit from OpenRouter
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
      console.log(`[Rate Limit 429] Retrying in ${secondsTotal}s... (Attempt ${retries}/${maxRetries})`);
      
      const txt = $('.loading-text');
      if (txt && document.querySelector('.loading-container').classList.contains('active')) {
        clearInterval(loadingInterval);
        let secondsLeft = secondsTotal;
        txt.textContent = `Rate limited. Waiting ${secondsLeft}s...`;
        
        const countdown = setInterval(() => {
          secondsLeft--;
          if (secondsLeft > 0) {
            txt.textContent = `Rate limited. Waiting ${secondsLeft}s...`;
          }
        }, 1000);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        clearInterval(countdown);
        
        // Restart normal loading
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
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    const msg = data?.error?.message || data?.error || `API error: ${res.status}`;
    throw new Error(`Hugging Face: ${msg}`);
  }

  if (data.choices && data.choices.length > 0) {
    return data.choices[0].message?.content || '';
  }
  
  throw new Error('Unexpected response format from Hugging Face');
}

async function callOpenRouter(token, systemPrompt, userCode) {
  const model = STATE.orModel || 'mistralai/mistral-7b-instruct:free';
  console.log('[OpenRouter] Calling model:', model);
  const res = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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

  // Handle HTTP errors
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.code || data?.message || `API error: ${res.status}`;
    throw new Error(`OpenRouter: ${msg}`);
  }

  // Handle error-in-200 responses
  if (data.error) {
    throw new Error(`OpenRouter: ${data.error.message || data.error.code || JSON.stringify(data.error)}`);
  }

  // Extract content from various response shapes
  if (data.choices && data.choices.length > 0) {
    const choice = data.choices[0];
    const content = choice.message?.content || choice.text || '';
    if (content) return content;
    // Some models return finish_reason without content
    if (choice.finish_reason === 'content_filter') {
      throw new Error('The model filtered this request. Try a different model.');
    }
  }

  // Fallback: show what we actually got
  throw new Error(`Unexpected OpenRouter response. Check browser console for details.`);
}

// ===== EXPLAIN =====
async function runExplain() {
  saveToken(); // Auto-save current inputs before running
  const code = $('#code-input').value;
  if (!code.trim()) return showError('Please paste some Python code first.');

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
    showError(e.message);
  } finally {
    showLoading(false);
    setButtonsDisabled(false);
  }
}

async function runVisualize() {
  saveToken(); // Auto-save current inputs before running
  const code = $('#code-input').value;
  if (!code.trim()) return showError('Please paste some Python code first.');

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
    showError(e.message);
  } finally {
    showLoading(false);
    setButtonsDisabled(false);
  }
}

// ===== RENDERING =====
function renderExplanation(text) {
  const container = $('#explanation-content');
  // Split by ### headings into sections
  const sections = text.split(/(?=###\s)/).filter(s => s.trim());
  let html = '';
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const heading = lines[0].replace(/^#+\s*/, '');
    const body = lines.slice(1).join('\n').trim();
    html += `<div class="explanation-section"><h3>${escapeHtml(heading)}</h3>${renderMarkdown(body)}</div>`;
  });
  if (!html) html = `<div class="explanation-section">${renderMarkdown(text)}</div>`;
  container.innerHTML = html;

  // Post-process: add toggle behavior to collapsible items
  container.querySelectorAll('.breakdown-item-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      item.classList.toggle('collapsed');
    });
  });

  const toolbar = $('#toolbar-explanation');
  if (toolbar) toolbar.style.display = 'flex';
}

function sanitizeMermaid(code) {
  // Fix common LLM-generated Mermaid syntax issues
  let s = code;

  // Remove any HTML tags the LLM might have included
  s = s.replace(/<[^>]+>/g, '');

  // Fix labels that have special chars but aren't quoted
  // Match node definitions like A[label with special chars] and wrap in quotes
  s = s.replace(/\[([^\]"]+)\]/g, (match, label) => {
    // If label contains special chars, wrap in quotes
    if (/[()=:;_<>°θΔ&{}#@!$%^*~`|\\]/.test(label)) {
      const clean = label
        .replace(/["]/g, "'")
        .replace(/[()]/g, '')
        .replace(/[°θΔ]/g, '')
        .replace(/[_]/g, ' ')
        .trim();
      return `["${clean}"]`;
    }
    return match;
  });

  // Fix edge labels: -->|label| should have quotes
  s = s.replace(/-->\|([^|"]+)\|/g, (match, label) => {
    return `-->|"${label}"|`;
  });

  // Remove empty lines that might cause issues
  s = s.split('\n').filter(line => line.trim() !== '').join('\n');

  return s;
}

async function renderSingleMermaid(container, code, label) {
  const uid = Date.now() + Math.random().toString(36).substr(2, 5);
  const id = `mermaid-${label}-${uid}`;

  // Try rendering with sanitized code
  const sanitized = sanitizeMermaid(code);
  console.log(`[Visual] Rendering ${label}:`, sanitized.substring(0, 200));

  container.innerHTML = `<pre class="mermaid" id="${id}">${sanitized}</pre>`;

  try {
    await mermaid.run({ nodes: [document.getElementById(id)] });
    console.log(`[Visual] ${label} rendered OK`);
    const toolbar = $(`#toolbar-${label}`);
    if (toolbar) toolbar.style.display = 'flex';
    STATE.zooms[label] = 1;
    return true;
  } catch (e) {
    console.warn(`[Visual] ${label} render failed, trying original...`, e);

    // Retry with original code
    const id2 = `${id}-retry`;
    container.innerHTML = `<pre class="mermaid" id="${id2}">${code}</pre>`;
    try {
      await mermaid.run({ nodes: [document.getElementById(id2)] });
      console.log(`[Visual] ${label} rendered OK on retry`);
      const toolbar = $(`#toolbar-${label}`);
      if (toolbar) toolbar.style.display = 'flex';
      STATE.zooms[label] = 1;
      return true;
    } catch (e2) {
      console.warn(`[Visual] ${label} failed completely:`, e2);
      // Show fallback: raw code in a styled box
      container.innerHTML = `
        <div class="mermaid-fallback">
          <p class="mermaid-fallback-label">⚠️ Diagram couldn't be rendered. Raw diagram code:</p>
          <pre class="mermaid-fallback-code">${escapeHtml(code)}</pre>
        </div>`;
      const toolbar = $(`#toolbar-${label}`);
      if (toolbar) toolbar.style.display = 'none';
      return false;
    }
  }
}

// ===== DIAGRAM TOOLS =====
function zoomDiagram(label, amount) {
  STATE.zooms[label] = Math.max(0.2, Math.min(3, STATE.zooms[label] + amount));
  const pre = document.querySelector(`#diagram-${label === 'concept' ? 'concept' : 'flow'} pre.mermaid`);
  if (pre) {
    pre.style.transform = `scale(${STATE.zooms[label]})`;
  }
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
    // Expand all accordions before export so content is visible
    const content = document.getElementById('explanation-content');
    const items = content.querySelectorAll('.breakdown-item');
    items.forEach(item => item.classList.remove('collapsed'));
    
    // Add temporary styling for PDF to ensure dark/light modes render cleanly
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      content.style.backgroundColor = '#1C1C1A';
      content.style.color = '#E5E5E0';
      content.style.padding = '20px';
    }

    const opt = {
      margin: 10,
      filename: 'ml_explanation.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save().then(() => {
      if (isDark) {
        content.style.backgroundColor = '';
        content.style.color = '';
        content.style.padding = '';
      }
    });
  }
}

function saveDiagram(label, format = 'svg') {
  const container = document.querySelector(`#diagram-${label === 'concept' ? 'concept' : 'flow'}`);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) {
    alert("No diagram rendered yet to save.");
    return;
  }
  
  if (format === 'pdf') {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      container.style.backgroundColor = '#1C1C1A';
    }

    const opt = {
      margin: 10,
      filename: `ml_explainer_${label}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(container).save().then(() => {
      if (isDark) container.style.backgroundColor = '';
    });
    return;
  }
  
  let svgData = new XMLSerializer().serializeToString(svg);
  if (!svgData.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgData = svgData.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (format === 'svg') {
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ml_explainer_${label}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } else if (format === 'png') {
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    const scale = 3; // high resolution
    
    // Explicitly parse width/height if getBoundingClientRect is wonky due to CSS transforms
    const width = parseFloat(svg.getAttribute('width') || rect.width || 800);
    const height = parseFloat(svg.getAttribute('height') || rect.height || 600);
    
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1C1C1A' : '#FAF9F6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    // SVG MUST be base64 encoded for canvas to draw it cleanly without tainting or missing elements
    const svgBase64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    
    img.onload = function() {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `ml_explainer_${label}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = svgBase64;
  }
}

function openDiagramInNewTab(label) {
  const container = document.querySelector(`#diagram-${label === 'concept' ? 'concept' : 'flow'}`);
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;
  
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function renderVisual(text) {
  console.log('[Visual] Raw response:', text.substring(0, 500));

  // Extract mermaid blocks
  const mermaidBlocks = [];
  const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = mermaidRegex.exec(text)) !== null) {
    mermaidBlocks.push(match[1].trim());
  }
  console.log('[Visual] Found', mermaidBlocks.length, 'mermaid blocks');

  // Extract walkthrough
  let walkthrough = '';
  const walkthroughMatch = text.match(/(?:SECTION C|PLAIN ENGLISH WALKTHROUGH|walkthrough)[:\s\-]*((?:\d+\.\s+[\s\S]*?)$)/im);
  if (walkthroughMatch) {
    walkthrough = walkthroughMatch[1].trim();
  } else {
    const lastIdx = text.lastIndexOf('```');
    if (lastIdx > 0) {
      const after = text.substring(lastIdx + 3).trim();
      if (after.length > 20) walkthrough = after;
    }
  }

  // Render walkthrough first (doesn't depend on mermaid)
  const walkEl = $('#walkthrough-content');
  if (walkthrough) {
    const steps = walkthrough.match(/\d+\.\s+.+/g);
    if (steps) {
      walkEl.innerHTML = '<ol>' + steps.map(s => `<li>${escapeHtml(s.replace(/^\d+\.\s+/, ''))}</li>`).join('') + '</ol>';
    } else {
      walkEl.innerHTML = renderMarkdown(walkthrough);
    }
  } else {
    walkEl.innerHTML = '<p style="color:var(--text-muted)">No walkthrough generated</p>';
  }

  // Render diagrams individually (async, with fallback)
  const flowEl = $('#diagram-flow');
  const conceptEl = $('#diagram-concept');

  if (mermaidBlocks.length === 0) {
    flowEl.innerHTML = '<p style="color:var(--text-muted)">No flowchart generated</p>';
    conceptEl.innerHTML = '<p style="color:var(--text-muted)">No concept map generated</p>';
    return;
  }

  // Set loading state
  flowEl.innerHTML = '<p style="color:var(--text-muted)">Rendering flowchart...</p>';
  conceptEl.innerHTML = '<p style="color:var(--text-muted)">Rendering concept map...</p>';
  $('#toolbar-flowchart').style.display = 'none';
  $('#toolbar-concept').style.display = 'none';

  setTimeout(async () => {
    // Render flowchart
    if (mermaidBlocks.length > 0) {
      await renderSingleMermaid(flowEl, mermaidBlocks[0], 'flowchart');
    }
    // Render concept map
    if (mermaidBlocks.length > 1) {
      await renderSingleMermaid(conceptEl, mermaidBlocks[1], 'concept');
    } else {
      conceptEl.innerHTML = '<p style="color:var(--text-muted)">No concept map generated</p>';
    }
  }, 300);
}

function renderMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Check if this is a top-level bullet that acts as a "section header"
    // Pattern: * **Title:** or - **Title:**  (with optional trailing text)
    const sectionMatch = trimmed.match(/^[-*]\s+\*\*(.+?)\*\*\s*[:\uff1a]?\s*(.*)$/);
    if (sectionMatch) {
      const title = sectionMatch[1];
      const trailingText = (sectionMatch[2] || '').trim();
      const subItems = [];

      // If there's trailing text on the same line, treat it as first sub-item
      if (trailingText) {
        subItems.push(trailingText);
      }

      i++;
      // Collect all sub-items (indented lines or sub-bullets)
      while (i < lines.length) {
        const subLine = lines[i];
        const subTrimmed = subLine.trim();
        // Stop if empty line followed by another top-level bullet
        if (!subTrimmed) {
          let peek = i + 1;
          while (peek < lines.length && !lines[peek].trim()) peek++;
          if (peek >= lines.length || /^[-*]\s+\*\*/.test(lines[peek].trim())) break;
          i++; continue;
        }
        // Stop at next top-level section header
        if (/^[-*]\s+\*\*/.test(subTrimmed)) break;
        subItems.push(subTrimmed);
        i++;
      }

      // Render as a collapsible breakdown item
      let subHtml = '';
      if (subItems.length > 0) {
        subHtml = '<ul class="breakdown-sub-list">';
        for (const sub of subItems) {
          const content = sub.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
          subHtml += `<li>${inlineFormat(escapeHtml(content))}</li>`;
        }
        subHtml += '</ul>';
      }

      output.push(
        `<div class="breakdown-item">` +
          `<div class="breakdown-item-header">` +
            `<span class="sec-dot"></span>` +
            `<span class="breakdown-chevron">\u25b8</span>` +
            `<strong>${inlineFormat(escapeHtml(title))}</strong>` +
          `</div>` +
          `<div class="breakdown-item-body">${subHtml}</div>` +
        `</div>`
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
      output.push('<ul>' + listItems.map(item => `<li>${inlineFormat(escapeHtml(item))}</li>`).join('') + '</ul>');
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
      output.push('<ol>' + listItems.map(item => `<li>${inlineFormat(escapeHtml(item))}</li>`).join('') + '</ol>');
      continue;
    }

    // Regular paragraph - collect consecutive non-special lines
    const paraLines = [];
    while (i < lines.length) {
      const pLine = lines[i].trim();
      if (!pLine || /^[-*]\s+/.test(pLine) || /^\d+\.\s+/.test(pLine)) break;
      paraLines.push(pLine);
      i++;
    }
    if (paraLines.length > 0) {
      output.push(`<p>${inlineFormat(escapeHtml(paraLines.join(' ')))}</p>`);
    }
  }

  return output.join('');
}

function inlineFormat(html) {
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
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
  // Hide placeholder
  const ph = $('#results-placeholder');
  if (ph) ph.classList.add('hidden');
  // Update badge
  $('#results-badge').textContent = `Powered by: ${STATE.lastProvider} — ${STATE.lastModel}`;
}

function hideResults() {
  $('.results-section').classList.remove('active');
}

function showError(msg) {
  const el = $('.error-card');
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
  $$('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
}

function clearAll() {
  $('#code-input').value = '';
  hideResults();
  hideError();
  STATE.explanationData = null;
  STATE.visualData = null;
  // Hide explanation toolbar
  const expToolbar = $('#toolbar-explanation');
  if (expToolbar) expToolbar.style.display = 'none';
  // Show placeholder again
  const ph = $('#results-placeholder');
  if (ph) ph.classList.remove('hidden');
}
