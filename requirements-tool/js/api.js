/**
 * js/api.js
 * Responsibility: Constructs the prompt, routes to the correct provider's API,
 * parses the JSON response, and throws typed errors. No DOM dependencies.
 * Supported providers: anthropic, openai, gemini
 */

class APIKeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'APIKeyError';
  }
}

class RateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class ParseError extends Error {
  constructor(message, rawResponse) {
    super(message);
    this.name = 'ParseError';
    this.rawResponse = rawResponse;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

// ─── Provider config ──────────────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: {
    label: 'Anthropic Claude',
    placeholder: 'sk-ant-api03-...',
    hint: 'Get a free key at console.anthropic.com',
    model: 'claude-sonnet-4-20250514'
  },
  openai: {
    label: 'OpenAI',
    placeholder: 'sk-...',
    hint: 'Get a key at platform.openai.com/api-keys',
    model: 'gpt-4o'
  },
  gemini: {
    label: 'Google Gemini',
    placeholder: 'AIza...',
    hint: 'Get a free key at aistudio.google.com/app/apikey',
    model: 'gemini-1.5-pro'
  }
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(problemText) {
  return `You are a senior business analyst.
Analyse this business problem and return ONLY a JSON object.
No markdown. No explanation. Just the JSON.

Business problem: ${problemText}

Return exactly this structure:
{
  "process": {
    "title": "string",
    "swimlanes": ["role1", "role2", "role3"],
    "steps": [
      {
        "id": "string",
        "type": "start|process|decision|end",
        "label": "string (max 4 words)",
        "role": "string (must match a swimlane)",
        "description": "string"
      }
    ],
    "connections": [
      {
        "from": "step id",
        "to": "step id",
        "label": "string (Yes/No for decisions, empty otherwise)"
      }
    ]
  },
  "requirements": [
    {
      "id": "FR-001 or NFR-001",
      "type": "functional|non-functional",
      "priority": "must|should|could",
      "category": "Process|Data|Integration|Security|Performance|UX|Compliance",
      "requirement": "The system shall...",
      "notes": "string"
    }
  ],
  "stakeholders": [
    {
      "name": "string",
      "role": "string",
      "interest": "high|medium|low",
      "influence": "high|medium|low",
      "impact": "string",
      "action": "manage_closely|keep_informed|keep_satisfied|monitor"
    }
  ]
}

Rules:
- Maximum 8 process steps
- Minimum 8 requirements (mix of functional and non-functional)
- Minimum 5 stakeholders
- Every step role must exactly match one of the swimlane strings
- Decision steps must have exactly 2 outgoing connections labelled Yes and No
- Requirements must use "The system shall" language
- Return ONLY the JSON, nothing else`;
}

// ─── Provider fetch functions ─────────────────────────────────────────────────

async function fetchAnthropic(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: PROVIDERS.anthropic.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  checkStatus(response, 'console.anthropic.com');

  const data = await response.json();
  return data?.content?.[0]?.text ?? '';
}

async function fetchOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: PROVIDERS.openai.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  checkStatus(response, 'platform.openai.com/api-keys');

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function fetchGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${PROVIDERS.gemini.model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2000 }
    })
  });

  checkStatus(response, 'aistudio.google.com/app/apikey');

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── Shared status check ──────────────────────────────────────────────────────

async function checkStatus(response, keyUrl) {
  if (response.status === 401 || response.status === 403) {
    throw new APIKeyError(`Invalid API key. Check your key at ${keyUrl}.`);
  }
  if (response.status === 429) {
    throw new RateLimitError('Rate limit reached. Please wait a moment and try again.');
  }
  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new NetworkError(`API returned status ${response.status}: ${text}`);
  }
}

// ─── Parse helper ─────────────────────────────────────────────────────────────

function parseJSON(rawText) {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ParseError('The model returned text that could not be parsed as JSON.', rawText);
  }

  if (!parsed.process || !parsed.requirements || !parsed.stakeholders) {
    throw new ParseError('The model response is missing required fields (process, requirements, stakeholders).', rawText);
  }

  return parsed;
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function generateAnalysis(problemText, apiKey, provider = 'anthropic') {
  if (!apiKey || apiKey.trim() === '') {
    throw new APIKeyError('API key is required.');
  }
  if (!problemText || problemText.trim() === '') {
    throw new APIKeyError('Problem description cannot be empty.');
  }

  const key = apiKey.trim();
  const prompt = buildPrompt(problemText);
  let rawText;

  try {
    if (provider === 'openai') {
      rawText = await fetchOpenAI(prompt, key);
    } else if (provider === 'gemini') {
      rawText = await fetchGemini(prompt, key);
    } else {
      rawText = await fetchAnthropic(prompt, key);
    }
  } catch (err) {
    // Re-throw typed errors as-is; wrap plain fetch failures
    if (err.name === 'APIKeyError' || err.name === 'RateLimitError' || err.name === 'NetworkError') {
      throw err;
    }
    throw new NetworkError('Could not reach the API. Check your internet connection.');
  }

  return parseJSON(rawText);
}
