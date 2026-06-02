/**
 * js/app.js
 * Responsibility: Main controller — wires up all event listeners, manages
 * application state, orchestrates calls to api.js, render.js, diagram.js,
 * and exports.js. Loads last.
 */

const state = {
  apiKey: '',
  provider: 'anthropic',
  currentProblem: '',
  lastResult: null,
  activeTab: 'process',
  isLoading: false
};

let loadingInterval = null;

const LOADING_MESSAGES = [
  'Reading your business problem...',
  'Mapping the process flow...',
  'Drafting requirements...',
  'Building stakeholder matrix...'
];

// ─── DOM references ──────────────────────────────────────────────────────────

const providerSelect      = document.getElementById('provider-select');
const apiKeyInput         = document.getElementById('api-key-input');
const apiKeyError         = document.getElementById('api-key-error');
const apiKeyLink          = document.getElementById('api-key-link');
const problemTextarea     = document.getElementById('problem-textarea');
const charCounter         = document.getElementById('char-counter');
const generateBtn         = document.getElementById('generate-btn');
const generateBtnText     = document.getElementById('generate-btn-text');
const loadingMsgEl        = document.getElementById('loading-message');

const outputSection       = document.getElementById('output-section');
const diagramContainer    = document.getElementById('diagram-container');
const requirementsContainer = document.getElementById('requirements-container');
const stakeholderTableContainer = document.getElementById('stakeholders-table-container');
const stakeholderGridContainer  = document.getElementById('stakeholders-grid-container');

const tabButtons          = document.querySelectorAll('.tab-btn');
const tabPanels           = document.querySelectorAll('.tab-content');

const downloadSVGBtn      = document.getElementById('download-svg-btn');
const downloadReqCSVBtn   = document.getElementById('download-req-csv-btn');
const downloadStakeCSVBtn = document.getElementById('download-stake-csv-btn');

const errorBanner         = document.getElementById('error-banner');

// ─── Initialise ───────────────────────────────────────────────────────────────

function init() {
  // Pre-populate the real output section with SAMPLE_OUTPUT on page load
  if (typeof SAMPLE_OUTPUT !== 'undefined') {
    state.lastResult = SAMPLE_OUTPUT;
    renderDiagram(SAMPLE_OUTPUT.process, diagramContainer);
    renderRequirements(SAMPLE_OUTPUT.requirements, requirementsContainer);
    renderStakeholders(SAMPLE_OUTPUT.stakeholders, stakeholderTableContainer, stakeholderGridContainer);
    outputSection?.classList.remove('hidden');
  }

  // IntersectionObserver for fade-up reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // CTA scroll
  const ctaBtn = document.getElementById('cta-scroll-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      document.getElementById('tool-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// ─── Event Listeners ─────────────────────────────────────────────────────────

const PROVIDER_META = {
  anthropic: { placeholder: 'sk-ant-api03-...', hint: 'console.anthropic.com' },
  openai:    { placeholder: 'sk-...',            hint: 'platform.openai.com/api-keys' },
  gemini:    { placeholder: 'AIza...',           hint: 'aistudio.google.com/app/apikey' }
};

if (providerSelect) {
  providerSelect.addEventListener('change', () => {
    state.provider = providerSelect.value;
    const meta = PROVIDER_META[state.provider];
    if (apiKeyInput) apiKeyInput.placeholder = meta.placeholder;
    if (apiKeyLink)  apiKeyLink.textContent  = meta.hint;
    if (apiKeyError) apiKeyError.textContent = '';
    apiKeyInput.value = '';
    state.apiKey = '';
  });
}

if (apiKeyInput) {
  apiKeyInput.addEventListener('input', () => {
    state.apiKey = apiKeyInput.value;
    if (apiKeyError) apiKeyError.textContent = '';
  });
}

if (problemTextarea) {
  problemTextarea.addEventListener('input', () => {
    state.currentProblem = problemTextarea.value;
    if (charCounter) {
      charCounter.textContent = `${problemTextarea.value.length} characters`;
    }
  });
}

// Example buttons
document.querySelectorAll('[data-example]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-example');
    if (typeof EXAMPLE_PROBLEMS !== 'undefined' && EXAMPLE_PROBLEMS[key]) {
      problemTextarea.value = EXAMPLE_PROBLEMS[key];
      state.currentProblem = EXAMPLE_PROBLEMS[key];
      if (charCounter) charCounter.textContent = `${EXAMPLE_PROBLEMS[key].length} characters`;
      problemTextarea.focus();
    }
  });
});

if (generateBtn) {
  generateBtn.addEventListener('click', handleGenerate);
}

// Tab switching
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    if (tab) switchTab(tab);
  });
});

// Download buttons
if (downloadSVGBtn) {
  downloadSVGBtn.addEventListener('click', () => {
    const svgEl = diagramContainer?.querySelector('svg');
    if (svgEl) {
      downloadSVG(svgEl, 'process-map.svg');
    } else {
      showBanner('No diagram to download yet.', 'warn');
    }
  });
}

if (downloadReqCSVBtn) {
  downloadReqCSVBtn.addEventListener('click', () => {
    const tableEl = document.getElementById('requirements-table-el');
    if (tableEl) {
      downloadCSV(tableEl, 'requirements.csv');
    } else {
      showBanner('No requirements table to download yet.', 'warn');
    }
  });
}

if (downloadStakeCSVBtn) {
  downloadStakeCSVBtn.addEventListener('click', () => {
    const tableEl = document.getElementById('stakeholders-table-el');
    if (tableEl) {
      downloadCSV(tableEl, 'stakeholders.csv');
    } else {
      showBanner('No stakeholder table to download yet.', 'warn');
    }
  });
}

// ─── Core Handlers ───────────────────────────────────────────────────────────

async function handleGenerate() {
  clearErrors();

  if (!state.apiKey || state.apiKey.trim() === '') {
    if (apiKeyError) apiKeyError.textContent = 'Please enter your API key.';
    apiKeyInput?.focus();
    return;
  }

  if (!state.currentProblem || state.currentProblem.trim() === '') {
    showBanner('Please describe your business problem before generating.', 'warn');
    problemTextarea?.focus();
    return;
  }

  state.isLoading = true;
  setLoadingState(true);

  try {
    const result = await generateAnalysis(state.currentProblem, state.apiKey, state.provider);
    state.lastResult = result;
    renderAll(result);
  } catch (err) {
    handleError(err);
  } finally {
    state.isLoading = false;
    setLoadingState(false);
  }
}

function renderAll(result) {
  renderDiagram(result.process, diagramContainer);
  renderRequirements(result.requirements, requirementsContainer);
  renderStakeholders(result.stakeholders, stakeholderTableContainer, stakeholderGridContainer);

  outputSection?.classList.remove('hidden');
  switchTab('process');

  setTimeout(() => {
    outputSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function handleError(err) {
  const name = err.name || '';

  if (name === 'APIKeyError') {
    if (apiKeyError) {
      apiKeyError.textContent = err.message;
    } else {
      showBanner(err.message, 'danger');
    }
    return;
  }

  if (name === 'RateLimitError') {
    showBanner(err.message, 'warn');
    return;
  }

  if (name === 'ParseError') {
    showParseError(err.message, err.rawResponse);
    return;
  }

  if (name === 'NetworkError') {
    showBanner(err.message, 'danger');
    return;
  }

  showBanner(err.message || 'An unexpected error occurred.', 'danger');
}

// ─── UI Helpers ──────────────────────────────────────────────────────────────

function setLoadingState(loading) {
  if (!generateBtn) return;

  generateBtn.disabled = loading;
  generateBtn.classList.toggle('btn-loading', loading);

  if (loading) {
    let msgIndex = 0;
    if (loadingMsgEl) loadingMsgEl.textContent = LOADING_MESSAGES[0];
    loadingInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      if (loadingMsgEl) loadingMsgEl.textContent = LOADING_MESSAGES[msgIndex];
    }, 1500);
    if (generateBtnText) generateBtnText.textContent = 'Analysing...';
  } else {
    clearInterval(loadingInterval);
    loadingInterval = null;
    if (loadingMsgEl) loadingMsgEl.textContent = '';
    if (generateBtnText) generateBtnText.textContent = 'Generate Analysis';
  }
}

function switchTab(tabName) {
  state.activeTab = tabName;

  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
}

function clearErrors() {
  if (apiKeyError) apiKeyError.textContent = '';
  if (errorBanner) {
    errorBanner.classList.add('hidden');
    errorBanner.innerHTML = '';
  }
}

function showBanner(message, type = 'danger') {
  if (!errorBanner) return;
  errorBanner.className = `banner banner-${type}`;
  errorBanner.innerHTML = `<span>${message}</span>`;
  errorBanner.classList.remove('hidden');
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showParseError(message, rawResponse) {
  if (!errorBanner) return;
  const safeRaw = rawResponse
    ? rawResponse.slice(0, 800).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : '(no response text)';

  errorBanner.className = 'banner banner-warn';
  errorBanner.innerHTML = `
    <strong>Parse Error:</strong> ${message}
    <details style="margin-top:0.75rem;">
      <summary>Show raw response</summary>
      <pre style="white-space:pre-wrap;font-size:0.75rem;margin-top:0.5rem;">${safeRaw}</pre>
    </details>
  `;
  errorBanner.classList.remove('hidden');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
