// DeepSeek API provider add-on for ML/RL Code Explainer.
(() => {
    const DEEPSEEK_MODELS = [
        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
    ];

    const qs = (selector) => document.querySelector(selector);

    function getState() {
        if (typeof STATE === 'undefined') {
            throw new Error('DeepSeek add-on must load after app.js');
        }

        STATE.deepseekToken =
            localStorage.getItem('ml_deepseek_token') ||
            STATE.deepseekToken ||
            '';

        STATE.deepseekModel =
            localStorage.getItem('ml_deepseek_model') ||
            STATE.deepseekModel ||
            'deepseek-chat';

        return STATE;
    }

    function ensureDeepSeekUi() {
        const tabs = qs('.provider-tabs');
        if (!tabs || qs('[data-provider="deepseek"]')) return;

        const deepseekTab = document.createElement('button');
        deepseekTab.className = 'provider-tab';
        deepseekTab.dataset.provider = 'deepseek';
        deepseekTab.textContent = '🐋 DeepSeek';
        tabs.appendChild(deepseekTab);

        const section = document.createElement('div');
        section.id = 'deepseek-section';
        section.style.display = 'none';
        section.innerHTML = `
      <div class="form-group">
        <label>DeepSeek API Key</label>
        <input type="password" id="deepseek-token" placeholder="sk-...">
      </div>

      <div class="form-group model-select-group">
        <label for="deepseek-model">Model</label>
        <select id="deepseek-model">
          ${DEEPSEEK_MODELS.map(
            (model) => `<option value="${model.value}">${model.label}</option>`
        ).join('')}
        </select>
      </div>
    `;

        const openRouterSection = qs('#or-section');
        if (openRouterSection) {
            openRouterSection.insertAdjacentElement('afterend', section);
        }

        deepseekTab.addEventListener('click', () => setProvider('deepseek'));

        qs('#deepseek-model')?.addEventListener('change', (event) => {
            const state = getState();
            state.deepseekModel = event.target.value;
            localStorage.setItem('ml_deepseek_model', state.deepseekModel);
            updateSaveStatus();
        });
    }

    const originalSetProvider = window.setProvider || setProvider;

    window.setProvider = setProvider = function patchedSetProvider(provider) {
        ensureDeepSeekUi();

        const state = getState();

        if (provider !== 'deepseek') {
            originalSetProvider(provider);

            const deepseekSection = qs('#deepseek-section');
            if (deepseekSection) deepseekSection.style.display = 'none';

            return;
        }

        state.provider = 'deepseek';
        localStorage.setItem('ml_provider', 'deepseek');

        document.querySelectorAll('.provider-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.provider === 'deepseek');
        });

        const hfSection = qs('#hf-section');
        const orSection = qs('#or-section');
        const geminiSection = qs('#gemini-section');
        const deepseekSection = qs('#deepseek-section');

        if (hfSection) hfSection.style.display = 'none';
        if (orSection) orSection.style.display = 'none';
        if (geminiSection) geminiSection.style.display = 'none';
        if (deepseekSection) deepseekSection.style.display = 'block';

        const tokenInput = qs('#deepseek-token');
        const modelSelect = qs('#deepseek-model');

        if (tokenInput) tokenInput.value = state.deepseekToken;
        if (modelSelect) modelSelect.value = state.deepseekModel;

        updateSaveStatus();
        updateHint();
    };

    const originalUpdateHint = window.updateHint || updateHint;

    window.updateHint = updateHint = function patchedUpdateHint() {
        const state = getState();

        if (state.provider === 'deepseek') {
            const hint = qs('#setup-hint');

            if (hint) {
                hint.innerHTML =
                    '💡 Get your DeepSeek API key at <a href="https://platform.deepseek.com/api_keys" target="_blank">platform.deepseek.com/api_keys</a>.';
            }

            return;
        }

        originalUpdateHint();
    };

    const originalUpdateSaveStatus = window.updateSaveStatus || updateSaveStatus;

    window.updateSaveStatus = updateSaveStatus = function patchedUpdateSaveStatus() {
        const state = getState();

        if (state.provider === 'deepseek') {
            const status = qs('#save-status');

            if (status) {
                status.textContent = state.deepseekToken
                    ? `Saved · ${state.deepseekModel}`
                    : 'No token saved';
            }

            return;
        }

        originalUpdateSaveStatus();
    };

    const originalSaveToken = window.saveToken || saveToken;

    window.saveToken = saveToken = function patchedSaveToken() {
        const state = getState();

        if (state.provider !== 'deepseek') {
            originalSaveToken();
            return;
        }

        state.deepseekToken = qs('#deepseek-token')?.value.trim() || '';
        state.deepseekModel = qs('#deepseek-model')?.value || 'deepseek-chat';

        localStorage.setItem('ml_deepseek_token', state.deepseekToken);
        localStorage.setItem('ml_deepseek_model', state.deepseekModel);

        updateSaveStatus();
    };

    function buildNumberedCode(code) {
        return code
            .split('\n')
            .map((line, index) => `L${index + 1}: ${line}`)
            .join('\n');
    }

    async function callDeepSeek(systemPrompt, userContent, options = {}) {
        const state = getState();

        if (!state.deepseekToken) {
            throw new Error('Please add your DeepSeek API key in API Setup first.');
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${state.deepseekToken}`
            },
            body: JSON.stringify({
                model: state.deepseekModel || 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                temperature: options.temperature ?? 0.35,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    const originalRunExplain = window.runExplain || runExplain;

    window.runExplain = runExplain = async function patchedRunExplain() {
        const state = getState();

        if (state.provider !== 'deepseek') {
            return originalRunExplain();
        }

        const code = qs('#code-input')?.value.trim();
        if (!code) return;

        try {
            showLoading(true);
            hideError();

            const output = await callDeepSeek(
                SYSTEM_PROMPT_EXPLAIN,
                buildNumberedCode(code)
            );

            STATE.explanationData = output;
            STATE.lastProvider = 'DeepSeek';
            STATE.lastModel = STATE.deepseekModel;

            renderExplanation(output);
            switchResultTab('explanation');

            const badge = qs('#results-badge');
            if (badge) badge.textContent = `DeepSeek · ${STATE.deepseekModel}`;
        } catch (error) {
            showError(error.message || String(error));
        } finally {
            showLoading(false);
        }
    };

    const originalRunVisualize = window.runVisualize || runVisualize;

    window.runVisualize = runVisualize = async function patchedRunVisualize() {
        const state = getState();

        if (state.provider !== 'deepseek') {
            return originalRunVisualize();
        }

        const code = qs('#code-input')?.value.trim();
        if (!code) return;

        try {
            showLoading(true);
            hideError();

            const output = await callDeepSeek(
                SYSTEM_PROMPT_VISUAL,
                buildNumberedCode(code),
                { temperature: 0.2 }
            );

            STATE.visualData = output;
            STATE.lastProvider = 'DeepSeek';
            STATE.lastModel = STATE.deepseekModel;

            renderVisual(output);
            switchResultTab('visual');

            const badge = qs('#results-badge');
            if (badge) badge.textContent = `DeepSeek · ${STATE.deepseekModel}`;
        } catch (error) {
            showError(error.message || String(error));
        } finally {
            showLoading(false);
        }
    };

    const originalRunExplainEquation =
        window.runExplainEquation || runExplainEquation;

    window.runExplainEquation = runExplainEquation =
        async function patchedRunExplainEquation() {
            const state = getState();

            if (state.provider !== 'deepseek') {
                return originalRunExplainEquation();
            }

            if (STATE.equationInputMode === 'image') {
                showError(
                    'DeepSeek direct API mode currently supports typed equations only in this app. Use Gemini or OpenRouter for image-based equation reading.'
                );
                return;
            }

            const equation = qs('#equation-input')?.value.trim();
            if (!equation) return;

            try {
                showLoading(true);
                hideError();

                const output = await callDeepSeek(
                    SYSTEM_PROMPT_EQUATION,
                    equation,
                    { temperature: 0.25 }
                );

                STATE.equationData = output;
                STATE.lastProvider = 'DeepSeek';
                STATE.lastModel = STATE.deepseekModel;

                renderEquation(output);
                switchResultTab('equation');

                const badge = qs('#results-badge');
                if (badge) badge.textContent = `DeepSeek · ${STATE.deepseekModel}`;
            } catch (error) {
                showError(error.message || String(error));
            } finally {
                showLoading(false);
            }
        };

    document.addEventListener('DOMContentLoaded', () => {
        ensureDeepSeekUi();

        const state = getState();

        if (state.provider === 'deepseek') {
            setProvider('deepseek');
        }
    });
})();